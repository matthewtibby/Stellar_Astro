import { useMemo, useCallback } from 'react';
import { HistogramAnalysisReportProps } from '../types/histogram.types';
import { calculateStatisticalRanges } from '../utils/histogramUtils';
import { useHistogramState, useFrameActions } from './';

/**
 * Custom hook that encapsulates all histogram analysis logic and state management
 * Provides a clean interface for the main component with computed values and handlers
 */
export const useHistogramAnalysis = (
  summary: HistogramAnalysisReportProps['summary'],
  frameResults: HistogramAnalysisReportProps['frameResults'],
  onFrameAction: HistogramAnalysisReportProps['onFrameAction']
) => {
  const state = useHistogramState();
  const frameActions = useFrameActions();
  
  const statisticalRanges = useMemo(() => calculateStatisticalRanges(frameResults), [frameResults]);
  
  const toggleExpanded = useCallback(() => state.setExpanded(!state.expanded), [state.expanded, state.setExpanded]);
  const toggleStatistics = useCallback(() => state.setShowStatistics(!state.showStatistics), [state.showStatistics, state.setShowStatistics]);
  
  const shouldShowStatistics = state.showStatistics && frameResults.length > 0;
  
  return {
    ...state,
    frameActions,
    statisticalRanges,
    toggleExpanded,
    toggleStatistics,
    shouldShowStatistics,
    summary,
    frameResults,
    onFrameAction
  };
}; 