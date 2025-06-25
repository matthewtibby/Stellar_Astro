import { useState } from 'react';

interface OutlierFrame {
  path: string;
  reason: string;
  score: number;
}

interface OutlierResults {
  good: OutlierFrame[];
  outliers: OutlierFrame[];
  summary: {
    total_frames: number;
    good_frames: number;
    outlier_frames: number;
    sigma_threshold: number;
  };
}

export const useOutlierDetection = () => {
  const [outlierLoading, setOutlierLoading] = useState(false);
  const [outlierError, setOutlierError] = useState<string | null>(null);
  const [outlierResults, setOutlierResults] = useState<OutlierResults | null>(null);
  const [outlierSigma, setOutlierSigma] = useState(3.0);
  const [outlierOverrides, setOutlierOverrides] = useState<Record<string, boolean>>({});

  const detectOutliers = async (fitsPaths: string[], sigmaThresh: number = 3.0, frameType?: string) => {
    try {
      const response = await fetch('/api/outliers/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fits_paths: fitsPaths,
          sigma_thresh: sigmaThresh,
          frame_type: frameType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Outlier detection failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error detecting outliers:', error);
      throw error;
    }
  };

  const handleRunOutlierDetection = async (realFiles: string[], selectedType: string) => {
    setOutlierLoading(true);
    setOutlierError(null);
    
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
      
      const result = await detectOutliers(fitsFiles, outlierSigma, actualFrameType);
      setOutlierResults(result);
      
      // Reset overrides: include all good, exclude outliers by default
      const newOverrides: Record<string, boolean> = {};
      result.good.forEach((f: OutlierFrame) => { newOverrides[f.path] = true; });
      result.outliers.forEach((f: OutlierFrame) => { newOverrides[f.path] = false; });
      setOutlierOverrides(newOverrides);
    } catch (e: any) {
      setOutlierError(e.message);
    } finally {
      setOutlierLoading(false);
    }
  };

  const handleOverride = (path: string, include: boolean) => {
    setOutlierOverrides(prev => ({ ...prev, [path]: include }));
  };

  const resetOutlierDetection = () => {
    setOutlierResults(null);
    setOutlierError(null);
    setOutlierOverrides({});
  };

  return {
    // State
    outlierLoading,
    outlierError,
    outlierResults,
    outlierSigma,
    outlierOverrides,
    
    // Actions
    setOutlierSigma,
    handleRunOutlierDetection,
    handleOverride,
    resetOutlierDetection,
    detectOutliers,
  };
}; 