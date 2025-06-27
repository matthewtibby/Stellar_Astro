import React from 'react';
import { HistogramAnalysisReportProps } from './histogram-analysis/types/histogram.types';
import { calculateStatisticalRanges } from './histogram-analysis/utils/histogramUtils';
import { useHistogramState, useFrameActions } from './histogram-analysis/hooks';
import { 
  HistogramSummaryHeader, 
  RecommendationsPanel, 
  StatisticalOverview,
  FrameAnalysisList
} from './histogram-analysis/components';

/**
 * HistogramAnalysisReport - A comprehensive histogram analysis display component
 * 
 * Features:
 * - Quality summary with expandable details
 * - Smart recommendations based on analysis
 * - Statistical overview with distribution analysis  
 * - Individual frame analysis with quality indicators
 * - Interactive frame actions (accept/reject/apply pedestal)
 */
export const HistogramAnalysisReport: React.FC<HistogramAnalysisReportProps> = ({
  summary,
  frameResults,
  onFrameAction,
  className = ""
}) => {
  const { expanded, selectedFrame, showStatistics, setExpanded, setShowStatistics } = useHistogramState();
  const frameActions = useFrameActions();
  const { outlierRange, pedestalRange } = calculateStatisticalRanges(frameResults);

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 overflow-hidden ${className}`}>
      {/* Summary Header Component */}
      <HistogramSummaryHeader
        summary={summary}
        expanded={expanded}
        showStatistics={showStatistics}
        onToggleExpanded={() => setExpanded(!expanded)}
        onToggleStatistics={() => setShowStatistics(!showStatistics)}
      />
      
      {/* Recommendations Component */}
      <RecommendationsPanel summary={summary} />

      {/* Statistical Overview Component */}
      {showStatistics && frameResults.length > 0 && (
        <StatisticalOverview
          summary={summary}
          frameResults={frameResults}
          outlierRange={outlierRange}
          pedestalRange={pedestalRange}
        />
      )}

      {/* Frame Analysis List Component */}
      {expanded && (
        <FrameAnalysisList
          frameResults={frameResults}
          selectedFrame={selectedFrame}
          onFrameAction={onFrameAction}
          frameActions={frameActions}
        />
      )}
    </div>
  );
}; 