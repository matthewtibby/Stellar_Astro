import React, { useState } from 'react';
import { BarChart3, AlertTriangle, CheckCircle, XCircle, Info, ChevronDown, ChevronUp, TrendingUp, Activity } from 'lucide-react';

interface HistogramFrameResult {
  frame_path: string;
  frame_type: string;
  histogram_score: number;
  distribution_type: string;
  clipping_detected: boolean;
  saturation_percent: number;
  zero_pixel_percent: number;
  outlier_percent: number;
  requires_pedestal: boolean;
  recommended_pedestal: number;
  pedestal_reason: string;
  issues_detected: string[];
  recommendations: string[];
  quality_flags: Record<string, boolean>;
  // Statistical data
  mean: number;
  median: number;
  std: number;
  skewness: number;
  kurtosis: number;
}

interface HistogramAnalysisSummary {
  message: string;
  quality_status: string;
  score: number;
  frame_breakdown: {
    total: number;
    high_quality: number;
    poor_quality: number;
    requiring_pedestal: number;
    with_clipping: number;
  };
  recommendations: string[];
  overall_recommendation: string;
}

interface HistogramAnalysisReportProps {
  summary: HistogramAnalysisSummary;
  frameResults: HistogramFrameResult[];
  onFrameAction?: (framePath: string, action: 'accept' | 'reject' | 'apply_pedestal') => void;
  className?: string;
}

export const HistogramAnalysisReport: React.FC<HistogramAnalysisReportProps> = ({
  summary,
  frameResults,
  onFrameAction,
  className = ""
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);

  const getQualityColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getQualityIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (score >= 6) return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  const getStatusText = (score: number, distributionType: string) => {
    if (score >= 8) return "✅ Excellent";
    if (score >= 6) return "⚠️ Good";
    if (score >= 4) return "⚠️ Moderate";
    return "❌ Poor";
  };

  const getDistributionIcon = (distributionType: string) => {
    switch (distributionType) {
      case 'normal': return '📊';
      case 'bimodal': return '📈';
      case 'right_clipped': return '📉';
      case 'left_clipped': return '📈';
      case 'skewed': return '📊';
      default: return '📋';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 overflow-hidden ${className}`}>
      {/* Summary Header */}
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
              onClick={() => setShowStatistics(!showStatistics)}
              className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors text-sm text-blue-300"
            >
              <Activity className="w-4 h-4 inline mr-1" />
              Stats
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
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

        {/* Recommendations */}
        {summary.recommendations.length > 0 && (
          <div className="mt-4 bg-blue-900/30 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">📋 Key Recommendations</h4>
            <ul className="text-sm text-blue-100 space-y-1">
              {summary.recommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
              {summary.recommendations.length > 3 && (
                <li className="text-blue-300">...and {summary.recommendations.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Statistical Overview */}
      {showStatistics && frameResults.length > 0 && (
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
                {Math.min(...frameResults.map(f => f.outlier_percent)).toFixed(1)}% - 
                {Math.max(...frameResults.map(f => f.outlier_percent)).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400">Pedestal Range:</span>
              <span className="ml-2 font-mono text-white">
                {Math.min(...frameResults.filter(f => f.requires_pedestal).map(f => f.recommended_pedestal) || [0]).toFixed(0)} - 
                {Math.max(...frameResults.filter(f => f.requires_pedestal).map(f => f.recommended_pedestal) || [0]).toFixed(0)} DN
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Frame Analysis */}
      {expanded && (
        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Individual Frame Analysis</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {frameResults.map((frame, index) => (
              <div
                key={frame.frame_path}
                className={`bg-gray-900/50 rounded-lg p-3 border ${
                  selectedFrame === frame.frame_path ? 'border-blue-500' : 'border-gray-700'
                } hover:border-gray-600 transition-colors cursor-pointer`}
                onClick={() => setSelectedFrame(
                  selectedFrame === frame.frame_path ? null : frame.frame_path
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getQualityIcon(frame.histogram_score)}
                    <div>
                      <p className="font-medium text-white">
                        {frame.frame_path.split('/').pop()}
                      </p>
                      <p className="text-xs text-gray-300">
                        Score: <span className={getQualityColor(frame.histogram_score)}>
                          {frame.histogram_score.toFixed(1)}/10
                        </span>
                        {' • '}
                        Type: <span className="text-blue-300">{frame.frame_type}</span>
                        {' • '}
                        Distribution: <span className="text-purple-300">
                          {getDistributionIcon(frame.distribution_type)} {frame.distribution_type}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      frame.histogram_score >= 8 ? 'bg-green-900/50 text-green-300' :
                      frame.histogram_score >= 6 ? 'bg-yellow-900/50 text-yellow-300' :
                      frame.histogram_score >= 4 ? 'bg-orange-900/50 text-orange-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {getStatusText(frame.histogram_score, frame.distribution_type)}
                    </span>
                    
                    {onFrameAction && (
                      <div className="flex gap-1">
                        {frame.requires_pedestal && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onFrameAction(frame.frame_path, 'apply_pedestal');
                            }}
                            className="p-1 bg-yellow-600/20 hover:bg-yellow-600/30 rounded text-yellow-400 transition-colors text-xs px-2"
                            title={`Apply pedestal: ${frame.recommended_pedestal.toFixed(0)} DN`}
                          >
                            ⚡ Pedestal
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onFrameAction(frame.frame_path, 'accept');
                          }}
                          className="p-1 bg-green-600/20 hover:bg-green-600/30 rounded text-green-400 transition-colors"
                          title="Force Accept"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onFrameAction(frame.frame_path, 'reject');
                          }}
                          className="p-1 bg-red-600/20 hover:bg-red-600/30 rounded text-red-400 transition-colors"
                          title="Force Reject"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quality Indicators */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {frame.clipping_detected && (
                    <span className="px-2 py-1 bg-red-900/30 text-red-300 rounded text-xs">
                      📉 Clipping
                    </span>
                  )}
                  {frame.requires_pedestal && (
                    <span className="px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded text-xs">
                      ⚡ Needs Pedestal
                    </span>
                  )}
                  {frame.outlier_percent > 1.0 && (
                    <span className="px-2 py-1 bg-orange-900/30 text-orange-300 rounded text-xs">
                      🔥 High Outliers
                    </span>
                  )}
                  {frame.saturation_percent > 0.1 && (
                    <span className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs">
                      📊 Saturation
                    </span>
                  )}
                </div>

                {/* Expanded Details */}
                {selectedFrame === frame.frame_path && (
                  <div className="mt-3 space-y-3 border-t border-gray-700 pt-3">
                    {/* Statistics */}
                    <div>
                      <h5 className="text-xs font-semibold text-gray-400 mb-2">📊 Statistics</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Mean:</span>
                          <span className="ml-1 font-mono text-white">{frame.mean.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Median:</span>
                          <span className="ml-1 font-mono text-white">{frame.median.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Std:</span>
                          <span className="ml-1 font-mono text-white">{frame.std.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Outliers:</span>
                          <span className="ml-1 font-mono text-white">{frame.outlier_percent.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Pedestal Info */}
                    {frame.requires_pedestal && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-400 mb-2">⚡ Pedestal Requirements</h5>
                        <div className="bg-yellow-900/20 rounded p-2 text-xs">
                          <div className="text-yellow-300">
                            Recommended: <span className="font-mono">{frame.recommended_pedestal.toFixed(0)} DN</span>
                          </div>
                          <div className="text-yellow-200 mt-1">{frame.pedestal_reason}</div>
                        </div>
                      </div>
                    )}

                    {/* Issues */}
                    {frame.issues_detected.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-400 mb-2">⚠️ Issues Detected</h5>
                        <ul className="text-xs text-red-300 space-y-1">
                          {frame.issues_detected.map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-red-400 mt-0.5">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {frame.recommendations.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-400 mb-2">💡 Recommendations</h5>
                        <ul className="text-xs text-blue-300 space-y-1">
                          {frame.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-blue-400 mt-0.5">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 