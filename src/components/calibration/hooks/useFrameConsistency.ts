import { useState } from 'react';

interface ConsistencyFrame {
  path: string;
  score: number;
  issues: string[];
  recommended: boolean;
}

interface ConsistencyResults {
  frames: ConsistencyFrame[];
  summary: {
    total_frames: number;
    recommended_frames: number;
    average_score: number;
    threshold: number;
  };
  recommendations: string[];
}

export const useFrameConsistency = () => {
  const [consistencyLoading, setConsistencyLoading] = useState(false);
  const [consistencyResults, setConsistencyResults] = useState<ConsistencyResults | null>(null);
  const [consistencyError, setConsistencyError] = useState<string | null>(null);
  const [consistencySelections, setConsistencySelections] = useState<Record<string, boolean>>({});
  const [autoConsistencyEnabled, setAutoConsistencyEnabled] = useState(true);

  const analyzeFrameConsistency = async (fitsPaths: string[], frameType?: string) => {
    try {
      const response = await fetch('/api/frames/consistency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fits_paths: fitsPaths,
          frame_type: frameType,
          consistency_threshold: 0.7,
          sigma_threshold: 2.5,
          min_frames: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`Frame consistency analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error analyzing frame consistency:', error);
      throw error;
    }
  };

  const handleRunConsistencyAnalysis = async (realFiles: string[], selectedType: string) => {
    setConsistencyLoading(true);
    setConsistencyError(null);
    
    try {
      // Filter to only FITS files and determine the correct frame type from filenames
      const fitsFiles = realFiles.filter(f => f.toLowerCase().endsWith('.fit') || f.toLowerCase().endsWith('.fits'));
      
      // Detect actual frame type from filenames if bias files are in dark folder
      let actualFrameType = selectedType;
      if (fitsFiles.length > 0) {
        const firstFile = fitsFiles[0].toLowerCase();
        if (firstFile.includes('bias') || firstFile.includes('zero')) {
          actualFrameType = 'bias';
        } else if (firstFile.includes('dark')) {
          actualFrameType = 'dark';
        } else if (firstFile.includes('flat')) {
          actualFrameType = 'flat';
        }
      }
      
      const result = await analyzeFrameConsistency(fitsFiles, actualFrameType);
      setConsistencyResults(result);
      
      // Initialize selections based on recommendations
      const newSelections: Record<string, boolean> = {};
      result.frames.forEach((frame: ConsistencyFrame) => {
        newSelections[frame.path] = frame.recommended;
      });
      setConsistencySelections(newSelections);
    } catch (e: any) {
      setConsistencyError(e.message);
    } finally {
      setConsistencyLoading(false);
    }
  };

  const handleAutoConsistencyAnalysis = async (fitsPaths: string[]) => {
    if (!autoConsistencyEnabled || fitsPaths.length < 3) return;
    
    try {
      const result = await analyzeFrameConsistency(fitsPaths);
      
      // Auto-apply recommendations if they look good
      if (result.summary.average_score > 0.8) {
        const newSelections: Record<string, boolean> = {};
        result.frames.forEach((frame: ConsistencyFrame) => {
          newSelections[frame.path] = frame.recommended;
        });
        setConsistencySelections(newSelections);
        setConsistencyResults(result);
      }
    } catch (error) {
      // Silent failure for auto-analysis
      console.warn('Auto consistency analysis failed:', error);
    }
  };

  const handleConsistencyFrameToggle = (path: string, include: boolean) => {
    setConsistencySelections(prev => ({ ...prev, [path]: include }));
  };

  const handleQualityFrameOverride = (framePath: string, action: 'accept' | 'reject') => {
    setConsistencySelections(prev => ({
      ...prev,
      [framePath]: action === 'accept'
    }));
  };

  const resetFrameConsistency = () => {
    setConsistencyResults(null);
    setConsistencyError(null);
    setConsistencySelections({});
  };

  return {
    // State
    consistencyLoading,
    consistencyResults,
    consistencyError,
    consistencySelections,
    autoConsistencyEnabled,
    
    // Actions
    setAutoConsistencyEnabled,
    handleRunConsistencyAnalysis,
    handleAutoConsistencyAnalysis,
    handleConsistencyFrameToggle,
    handleQualityFrameOverride,
    resetFrameConsistency,
    analyzeFrameConsistency,
  };
}; 