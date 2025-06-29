import { useOutlierAnalysis } from './useOutlierAnalysis';
import { useConsistencyAnalysis } from './useConsistencyAnalysis';
import { useHistogramAnalysis } from './useHistogramAnalysis';

/**
 * Unified hook for all calibration analysis operations.
 * Composes outlier, consistency, and histogram analysis hooks.
 */
export function useAnalysisOperations() {
  const outlier = useOutlierAnalysis();
  const consistency = useConsistencyAnalysis();
  const histogram = useHistogramAnalysis();

  /**
   * Run all enabled analyses in parallel.
   */
  const runFullAnalysis = async (
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
    console.log('[useAnalysisOperations] runFullAnalysis called with', { files, frameType, options });
    const {
      includeOutliers = true,
      includeConsistency = true,
      includeHistogram = true,
      sigmaThreshold = 3.0,
      consistencyThreshold = 0.7,
    } = options;
    const results: any = {};
    const promises: Promise<any>[] = [];
    if (includeOutliers) {
      promises.push(outlier.run(files, frameType, sigmaThreshold).then(data => { results.outliers = data; }));
    }
    if (includeConsistency) {
      promises.push(consistency.run(files, frameType, consistencyThreshold).then(data => { results.consistency = data; }));
    }
    if (includeHistogram) {
      promises.push(histogram.run(files, frameType).then(data => { results.histogram = data; }));
    }
    await Promise.all(promises);
    console.log('[useAnalysisOperations] runFullAnalysis results', results);
    return results;
  };

  /**
   * Reset all analysis state.
   */
  const resetAllAnalysis = () => {
    outlier.reset();
    consistency.reset();
    histogram.reset();
  };

  return {
    // Outlier analysis
    outlierLoading: outlier.loading,
    outlierError: outlier.error,
    outlierResults: outlier.results,
    outlierOverrides: outlier.overrides,
    runOutlierDetection: outlier.run,
    handleOutlierOverride: outlier.override,
    resetOutlierAnalysis: outlier.reset,

    // Consistency analysis
    consistencyLoading: consistency.loading,
    consistencyError: consistency.error,
    consistencyResults: consistency.results,
    consistencySelections: consistency.selections,
    runConsistencyAnalysis: consistency.run,
    handleConsistencyFrameToggle: consistency.toggleSelection,
    resetConsistencyAnalysis: consistency.reset,

    // Histogram analysis
    histogramLoading: histogram.loading,
    histogramError: histogram.error,
    histogramResults: histogram.results,
    histogramNotification: histogram.notification,
    runHistogramAnalysis: histogram.run,
    resetHistogramAnalysis: histogram.reset,
    setHistogramNotification: histogram.setNotification,

    // Combined operations
    runFullAnalysis,
    resetAllAnalysis,
  };
} 