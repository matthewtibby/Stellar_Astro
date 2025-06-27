import React from 'react';
import { HistogramFrameResult, HistogramAnalysisSummary } from '../types/histogram.types';
import { getDistributionIcon } from '../utils/histogramUtils';

interface StatisticalOverviewProps {
  summary: HistogramAnalysisSummary;
  frameResults: HistogramFrameResult[];
  outlierRange: { min: number; max: number };
  pedestalRange: { min: number; max: number };
}

export const StatisticalOverview: React.FC<StatisticalOverviewProps> = ({
  summary,
  frameResults,
  outlierRange,
  pedestalRange,
}) => {
  return (
    <div className="bg-gray-900/30 p-4 border-b border-gray-700">
      <h4 className="text-sm font-semibold text-gray-300 mb-3">📊 Statistical Overview</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-gray-400">Avg Score:</span>
          <span className="ml-2 font-mono text-white">{summary.score.toFixed(1)}</span>
        </div>
        <div>
          <span className="text-gray-400">Distribution Types:</span>
          <div className="text-white">
            {Object.entries(
              frameResults.reduce((acc, frame) => {
                acc[frame.distribution_type] = (acc[frame.distribution_type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([type, count]) => (
              <span key={type} className="mr-2">
                {getDistributionIcon(type)} {count}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-gray-400">Outlier Range:</span>
          <span className="ml-2 font-mono text-white">
            {outlierRange.min.toFixed(1)}% - {outlierRange.max.toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-gray-400">Pedestal Range:</span>
          <span className="ml-2 font-mono text-white">
            {pedestalRange.min.toFixed(0)} - {pedestalRange.max.toFixed(0)} DN
          </span>
        </div>
      </div>
    </div>
  );
}; 