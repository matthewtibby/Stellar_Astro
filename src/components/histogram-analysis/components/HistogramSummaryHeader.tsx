import React from 'react';
import { BarChart3, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { HistogramAnalysisSummary } from '../types/histogram.types';

interface HistogramSummaryHeaderProps {
  summary: HistogramAnalysisSummary;
  expanded: boolean;
  showStatistics: boolean;
  onToggleExpanded: () => void;
  onToggleStatistics: () => void;
}

export const HistogramSummaryHeader: React.FC<HistogramSummaryHeaderProps> = ({
  summary,
  expanded,
  showStatistics,
  onToggleExpanded,
  onToggleStatistics,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Histogram Analysis Report</h3>
            <p className="text-sm text-gray-300">
              {summary.frame_breakdown.total} frames analyzed • 
              Quality Score: {summary.score}/10 • 
              Status: {summary.quality_status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleStatistics}
            className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors text-sm text-blue-300"
          >
            <Activity className="w-4 h-4 inline mr-1" />
            Stats
          </button>
          <button
            onClick={onToggleExpanded}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors"
          >
            <span className="text-sm text-blue-300">
              {expanded ? 'Hide Details' : 'View Details'}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quality Overview */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">High Quality</div>
          <div className="text-lg font-bold text-green-400">
            {summary.frame_breakdown.high_quality}/{summary.frame_breakdown.total}
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Poor Quality</div>
          <div className="text-lg font-bold text-red-400">
            {summary.frame_breakdown.poor_quality}/{summary.frame_breakdown.total}
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Need Pedestal</div>
          <div className="text-lg font-bold text-yellow-400">
            {summary.frame_breakdown.requiring_pedestal}
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">With Clipping</div>
          <div className="text-lg font-bold text-orange-400">
            {summary.frame_breakdown.with_clipping}
          </div>
        </div>
      </div>
    </div>
  );
}; 