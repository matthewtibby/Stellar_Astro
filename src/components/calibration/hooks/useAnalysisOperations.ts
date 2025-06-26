import { useState, useCallback } from 'react';

// Types
interface OutlierResult {
  frame: string;
  score: number;
  reason: string;
  suggested_action: 'keep' | 'remove';
}

interface ConsistencyResult {
  frame: string;
  consistency_score: number;
  issues: string[];
  recommendation: 'accept' | 'review' | 'reject';
}

interface HistogramResult {
  frame: string;
  quality_score: number;
  issues: string[];
  histogram_data: any;
  recommendations: string[];
}

interface AnalysisState {
  outliers: {
    loading: boolean;
    error: string | null;
    results: OutlierResult[];
    overrides: Record<string, 'keep' | 'remove'>;
  };
  consistency: {
    loading: boolean;
    error: string | null;
    results: ConsistencyResult[];
    selections: Record<string, boolean>;
  };
  histogram: {
    loading: boolean;
    error: string | null;
    results: HistogramResult[];
    notification: string | null;
  };
}

export const useAnalysisOperations = () => {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    outliers: {
      loading: false,
      error: null,
      results: [],
      overrides: {},
    },
    consistency: {
      loading: false,
      error: null,
      results: [],
      selections: {},
    },
    histogram: {
      loading: false,
      error: null,
      results: [],
      notification: null,
    },
  });

  // Outlier Detection Operations
  const runOutlierDetection = useCallback(async (
    files: string[],
    frameType: string,
    sigmaThreshold: number = 3.0
  ) => {
    setAnalysisState(prev => ({
      ...prev,
      outliers: { ...prev.outliers, loading: true, error: null }
    }));

    try {
      const response = await fetch('http://localhost:8000/outliers/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fits_paths: files,
          frame_type: frameType,
          sigma_thresh: sigmaThreshold,
        }),
      });

      if (!response.ok) {
        throw new Error(`Outlier detection failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      setAnalysisState(prev => ({
        ...prev,
        outliers: {
          ...prev.outliers,
          loading: false,
          results: data.outliers || [],
        }
      }));

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAnalysisState(prev => ({
        ...prev,
        outliers: { ...prev.outliers, loading: false, error: errorMessage }
      }));
      throw error;
    }
  }, []);

  // Frame Consistency Operations
  const runConsistencyAnalysis = useCallback(async (
    files: string[],
    frameType: string,
    consistencyThreshold: number = 0.7
  ) => {
    setAnalysisState(prev => ({
      ...prev,
      consistency: { ...prev.consistency, loading: true, error: null }
    }));

    try {
      const response = await fetch('http://localhost:8000/frames/consistency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fits_paths: files,
          frame_type: frameType,
          consistency_threshold: consistencyThreshold,
        }),
      });

      if (!response.ok) {
        throw new Error(`Consistency analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      setAnalysisState(prev => ({
        ...prev,
        consistency: {
          ...prev.consistency,
          loading: false,
          results: data.analysis_results || [],
        }
      }));

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAnalysisState(prev => ({
        ...prev,
        consistency: { ...prev.consistency, loading: false, error: errorMessage }
      }));
      throw error;
    }
  }, []);

  // Histogram Analysis Operations
  const runHistogramAnalysis = useCallback(async (
    files: string[],
    frameType: string
  ) => {
    setAnalysisState(prev => ({
      ...prev,
      histogram: { ...prev.histogram, loading: true, error: null }
    }));

    try {
      const response = await fetch('http://localhost:8000/histograms/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fits_paths: files,
          frame_type: frameType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Histogram analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      setAnalysisState(prev => ({
        ...prev,
        histogram: {
          ...prev.histogram,
          loading: false,
          results: data.analysis_results || [],
          notification: data.summary ? 'Histogram analysis completed' : null,
        }
      }));

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAnalysisState(prev => ({
        ...prev,
        histogram: { ...prev.histogram, loading: false, error: errorMessage }
      }));
      throw error;
    }
  }, []);

  // Combined Analysis Operation
  const runFullAnalysis = useCallback(async (
    files: string[],
    frameType: string,
    options: {
      includeOutliers?: boolean;
      includeConsistency?: boolean;
      includeHistogram?: boolean;
      sigmaThreshold?: number;
      consistencyThreshold?: number;
    } = {}
  ) => {
    const {
      includeOutliers = true,
      includeConsistency = true,
      includeHistogram = true,
      sigmaThreshold = 3.0,
      consistencyThreshold = 0.7,
    } = options;

    const results: any = {};

    try {
      // Run all analyses in parallel for better performance
      const promises: Promise<any>[] = [];

      if (includeOutliers) {
        promises.push(runOutlierDetection(files, frameType, sigmaThreshold).then(data => {
          results.outliers = data;
          return data;
        }));
      }

      if (includeConsistency) {
        promises.push(runConsistencyAnalysis(files, frameType, consistencyThreshold).then(data => {
          results.consistency = data;
          return data;
        }));
      }

      if (includeHistogram) {
        promises.push(runHistogramAnalysis(files, frameType).then(data => {
          results.histogram = data;
          return data;
        }));
      }

      await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Full analysis failed:', error);
      throw error;
    }
  }, [runOutlierDetection, runConsistencyAnalysis, runHistogramAnalysis]);

  // Action handlers
  const handleOutlierOverride = useCallback((framePath: string, action: 'keep' | 'remove') => {
    setAnalysisState(prev => ({
      ...prev,
      outliers: {
        ...prev.outliers,
        overrides: { ...prev.outliers.overrides, [framePath]: action }
      }
    }));
  }, []);

  const handleConsistencyFrameToggle = useCallback((framePath: string, selected: boolean) => {
    setAnalysisState(prev => ({
      ...prev,
      consistency: {
        ...prev.consistency,
        selections: { ...prev.consistency.selections, [framePath]: selected }
      }
    }));
  }, []);

  const handleQualityFrameOverride = useCallback((framePath: string, action: 'accept' | 'reject') => {
    setAnalysisState(prev => ({
      ...prev,
      consistency: {
        ...prev.consistency,
        selections: { ...prev.consistency.selections, [framePath]: action === 'accept' }
      }
    }));
  }, []);

  const handleHistogramFrameAction = useCallback((framePath: string, action: 'accept' | 'reject' | 'apply_pedestal') => {
    // Implementation for histogram frame actions
    console.log(`Histogram action: ${action} for ${framePath}`);
    
    if (action === 'apply_pedestal') {
      setAnalysisState(prev => ({
        ...prev,
        histogram: {
          ...prev.histogram,
          notification: `Applied pedestal correction to ${framePath}`
        }
      }));
    }
  }, []);

  // Reset functions
  const resetOutlierAnalysis = useCallback(() => {
    setAnalysisState(prev => ({
      ...prev,
      outliers: {
        loading: false,
        error: null,
        results: [],
        overrides: {},
      }
    }));
  }, []);

  const resetConsistencyAnalysis = useCallback(() => {
    setAnalysisState(prev => ({
      ...prev,
      consistency: {
        loading: false,
        error: null,
        results: [],
        selections: {},
      }
    }));
  }, []);

  const resetHistogramAnalysis = useCallback(() => {
    setAnalysisState(prev => ({
      ...prev,
      histogram: {
        loading: false,
        error: null,
        results: [],
        notification: null,
      }
    }));
  }, []);

  const resetAllAnalysis = useCallback(() => {
    resetOutlierAnalysis();
    resetConsistencyAnalysis();
    resetHistogramAnalysis();
  }, [resetOutlierAnalysis, resetConsistencyAnalysis, resetHistogramAnalysis]);

  return {
    // State
    analysisState,
    
    // Individual analysis operations
    runOutlierDetection,
    runConsistencyAnalysis,
    runHistogramAnalysis,
    
    // Combined operations
    runFullAnalysis,
    
    // Action handlers
    handleOutlierOverride,
    handleConsistencyFrameToggle,
    handleQualityFrameOverride,
    handleHistogramFrameAction,
    
    // Reset functions
    resetOutlierAnalysis,
    resetConsistencyAnalysis,
    resetHistogramAnalysis,
    resetAllAnalysis,
    
    // Computed properties for easy access
    outlierLoading: analysisState.outliers.loading,
    outlierError: analysisState.outliers.error,
    outlierResults: analysisState.outliers.results,
    outlierOverrides: analysisState.outliers.overrides,
    
    consistencyLoading: analysisState.consistency.loading,
    consistencyError: analysisState.consistency.error,
    consistencyResults: analysisState.consistency.results,
    consistencySelections: analysisState.consistency.selections,
    
    histogramLoading: analysisState.histogram.loading,
    histogramError: analysisState.histogram.error,
    histogramResults: analysisState.histogram.results,
    histogramNotification: analysisState.histogram.notification,
  };
}; 