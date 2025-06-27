import React from 'react';
import { FrameDetailsPanelProps } from '../types/histogram.types';

export const FrameDetailsPanel: React.FC<FrameDetailsPanelProps> = ({ frame }) => {
  return (
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
  );
}; 