import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, ChevronDown, ChevronUp, Eye, RotateCcw } from 'lucide-react';

interface FrameQualityResult {
  file_path: string;
  frame_type: string;
  gradient_score: number;
  uniformity_score: number;
  detected_issues: string[];
  recommendations: string[];
  statistics: Record<string, any>;
  quality_flags: Record<string, any>;
}

interface QualitySummary {
  total_frames: number;
  accepted_frames: number;
  flagged_frames: number;
  rejected_frames: number;
  average_quality: number;
  common_issues: string[];
  overall_recommendation: string;
}

interface FrameQualityReportProps {
  summary: QualitySummary;
  frameResults: FrameQualityResult[];
  rejectedFrames: string[];
  onFrameOverride?: (framePath: string, action: 'accept' | 'reject') => void;
  className?: string;
}

export const FrameQualityReport: React.FC<FrameQualityReportProps> = ({
  summary,
  frameResults,
  rejectedFrames,
  onFrameOverride,
  className = ""
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);

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

  const getStatusText = (score: number, issues: string[]) => {
    if (score >= 8) return "✅ Excellent";
    if (score >= 6) return "⚠️ Good";
    if (score >= 4) return "⚠️ Poor";
    return "❌ Failed";
  };

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 overflow-hidden ${className}`}>
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Info className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Frame Quality Report</h3>
              <p className="text-sm text-gray-300">
                {summary.accepted_frames}/{summary.total_frames} frames accepted • 
                Average Quality: {summary.average_quality.toFixed(1)}/10
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors"
          >
            <span className="text-sm text-purple-300">
              {expanded ? 'Hide Details' : 'View Details'}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Accepted</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-xl font-bold text-green-400">{summary.accepted_frames}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Flagged</span>
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-xl font-bold text-yellow-400">{summary.flagged_frames}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Rejected</span>
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-xl font-bold text-red-400">{summary.rejected_frames}</p>
          </div>
        </div>

        {/* Issues Summary */}
        {summary.common_issues.length > 0 && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="font-medium text-red-300">Detected Issues</span>
            </div>
            <ul className="text-sm text-red-200 space-y-1">
              {summary.common_issues.map((issue, idx) => (
                <li key={idx}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Overall Recommendation */}
        {summary.overall_recommendation && (
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="font-medium text-blue-300">Recommendation</span>
            </div>
            <p className="text-sm text-blue-200">{summary.overall_recommendation}</p>
          </div>
        )}
      </div>

      {/* Detailed Frame Analysis */}
      {expanded && (
        <div className="p-4">
          <h4 className="text-lg font-semibold text-white mb-4">Per-Frame Analysis</h4>
          
          <div className="space-y-3">
            {frameResults.map((frame, idx) => (
              <div
                key={idx}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getQualityIcon(frame.gradient_score)}
                    <div>
                      <p className="font-medium text-white">
                        {frame.file_path.split('/').pop()}
                      </p>
                      <p className="text-sm text-gray-300">
                        Quality: <span className={getQualityColor(frame.gradient_score)}>
                          {frame.gradient_score.toFixed(1)}/10
                        </span>
                        {' • '}
                        Uniformity: <span className={getQualityColor(frame.uniformity_score)}>
                          {frame.uniformity_score.toFixed(1)}/10
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      frame.gradient_score >= 8 ? 'bg-green-900/50 text-green-300' :
                      frame.gradient_score >= 6 ? 'bg-yellow-900/50 text-yellow-300' :
                      frame.gradient_score >= 4 ? 'bg-orange-900/50 text-orange-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {getStatusText(frame.gradient_score, frame.detected_issues)}
                    </span>
                    
                    {onFrameOverride && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => onFrameOverride(frame.file_path, 'accept')}
                          className="p-1 bg-green-600/20 hover:bg-green-600/30 rounded text-green-400 transition-colors"
                          title="Force Accept"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onFrameOverride(frame.file_path, 'reject')}
                          className="p-1 bg-red-600/20 hover:bg-red-600/30 rounded text-red-400 transition-colors"
                          title="Force Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Issues */}
                {frame.detected_issues.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-red-300 mb-1">Issues:</p>
                    <ul className="text-sm text-red-200 space-y-1">
                      {frame.detected_issues.map((issue, issueIdx) => (
                        <li key={issueIdx}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {frame.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-blue-300 mb-1">Recommendations:</p>
                    <ul className="text-sm text-blue-200 space-y-1">
                      {frame.recommendations.map((rec, recIdx) => (
                        <li key={recIdx}>• {rec}</li>
                      ))}
                    </ul>
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

export default FrameQualityReport; 