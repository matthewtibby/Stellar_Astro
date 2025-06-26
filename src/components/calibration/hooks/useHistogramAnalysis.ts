import { useState } from 'react';

interface HistogramFrame {
  path: string;
  issues: string[];
  recommendations: string[];
  quality_score: number;
  pedestal_offset?: number;
}

interface HistogramResults {
  frames: HistogramFrame[];
  summary: {
    total_frames: number;
    frames_with_issues: number;
    average_quality: number;
    common_issues: string[];
  };
  overall_recommendation: string;
}

export const useHistogramAnalysis = () => {
  const [histogramAnalysisResults, setHistogramAnalysisResults] = useState<HistogramResults | null>(null);
  const [showHistogramReport, setShowHistogramReport] = useState(false);
  const [histogramAnalysisLoading, setHistogramAnalysisLoading] = useState(false);
  const [histogramAnalysisNotification, setHistogramAnalysisNotification] = useState<string | null>(null);
  const [qualityAnalysisResults, setQualityAnalysisResults] = useState<any>(null);
  const [showQualityReport, setShowQualityReport] = useState(false);

  const handleHistogramAnalysis = async (fitsPaths: string[]) => {
    setHistogramAnalysisLoading(true);
    setHistogramAnalysisNotification("Starting histogram analysis...");
    
    try {
      const response = await fetch('/api/histograms/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fits_paths: fitsPaths,
          project_id: 'current-project', // This should be passed as parameter
          user_id: 'current-user', // This should be passed as parameter
        }),
      });

      if (!response.ok) {
        throw new Error(`Histogram analysis failed: ${response.statusText}`);
      }

      const jobData = await response.json();
      const jobId = jobData.job_id;
      
      setHistogramAnalysisNotification("Analysis running... this may take a moment");

      // Poll for results
      const pollForResults = async () => {
        try {
          const statusResponse = await fetch(`/api/jobs/status?job_id=${jobId}`);
          if (!statusResponse.ok) {
            throw new Error('Failed to check job status');
          }

          const statusData = await statusResponse.json();
          
          if (statusData.status === 'completed') {
            setHistogramAnalysisResults(statusData.result);
            setHistogramAnalysisNotification("Histogram analysis completed!");
            setShowHistogramReport(true);
            
            // Clear notification after 3 seconds
            setTimeout(() => {
              setHistogramAnalysisNotification(null);
            }, 3000);
            
            return true;
          } else if (statusData.status === 'failed') {
            throw new Error(statusData.error || 'Analysis failed');
          } else {
            // Still running, continue polling
            setTimeout(pollForResults, 2000);
            return false;
          }
        } catch (error) {
          console.error('Error polling histogram results:', error);
          setHistogramAnalysisNotification("Error checking analysis status");
          setTimeout(() => {
            setHistogramAnalysisNotification(null);
          }, 3000);
          return true; // Stop polling
        }
      };

      await pollForResults();
    } catch (error: any) {
      console.error('Histogram analysis error:', error);
      setHistogramAnalysisNotification(`Analysis failed: ${error.message}`);
      setTimeout(() => {
        setHistogramAnalysisNotification(null);
      }, 5000);
    } finally {
      setHistogramAnalysisLoading(false);
    }
  };

  const handleHistogramFrameAction = (framePath: string, action: 'accept' | 'reject' | 'apply_pedestal') => {
    if (!histogramAnalysisResults) return;

    const updatedFrames = histogramAnalysisResults.frames.map(frame => {
      if (frame.path === framePath) {
        if (action === 'apply_pedestal' && frame.pedestal_offset) {
          // Mark frame as having pedestal applied
          return {
            ...frame,
            recommendations: frame.recommendations.filter(r => !r.includes('pedestal')),
            issues: frame.issues.filter(i => !i.includes('pedestal'))
          };
        } else if (action === 'reject') {
          // Mark frame as rejected
          return { ...frame, quality_score: 0 };
        } else if (action === 'accept') {
          // Mark frame as accepted despite issues
          return { ...frame, quality_score: Math.max(frame.quality_score, 0.7) };
        }
      }
      return frame;
    });

    setHistogramAnalysisResults({
      ...histogramAnalysisResults,
      frames: updatedFrames
    });
  };

  const resetHistogramAnalysis = () => {
    setHistogramAnalysisResults(null);
    setShowHistogramReport(false);
    setHistogramAnalysisNotification(null);
    setQualityAnalysisResults(null);
    setShowQualityReport(false);
  };

  return {
    // State
    histogramAnalysisResults,
    showHistogramReport,
    histogramAnalysisLoading,
    histogramAnalysisNotification,
    qualityAnalysisResults,
    showQualityReport,
    
    // Actions
    setShowHistogramReport,
    setQualityAnalysisResults,
    setShowQualityReport,
    handleHistogramAnalysis,
    handleHistogramFrameAction,
    resetHistogramAnalysis,
  };
}; 