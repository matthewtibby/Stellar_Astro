import React from 'react';

interface FrameConsistencyTableProps {
  analysis: any;
  onFrameToggle: (path: string, include: boolean) => void;
  frameSelections: Record<string, boolean>;
  loading: boolean;
}

export function FrameConsistencyTable({
  analysis,
  onFrameToggle,
  frameSelections,
  loading,
}: FrameConsistencyTableProps) {
  if (!analysis || !analysis.metrics_by_frame) {
    return null;
  }

  const sortedFrames = [...analysis.metrics_by_frame].sort((a, b) => b.consistency_score - a.consistency_score);

  return (
    <div className="bg-[#0f1419] rounded-lg p-3 mt-3 border border-blue-900/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-blue-200">
            Overall Consistency: {analysis.overall_consistency?.toFixed(1)}/10
          </span>
          <span className="text-xs text-blue-300">
            Recommended: {analysis.recommended_frames?.length || 0}
          </span>
          <span className="text-xs text-yellow-300">
            Questionable: {analysis.questionable_frames?.length || 0}
          </span>
          <span className="text-xs text-red-300">
            Rejected: {analysis.rejected_frames?.length || 0}
          </span>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-4 text-xs">
        <div className="bg-blue-900/20 p-2 rounded">
          <span className="text-blue-200 font-medium">Mean Stability:</span>
          <span className="text-white ml-2">{(analysis.mean_stability * 100)?.toFixed(2)}% CV</span>
        </div>
        <div className="bg-blue-900/20 p-2 rounded">
          <span className="text-blue-200 font-medium">Std Stability:</span>
          <span className="text-white ml-2">{(analysis.std_stability * 100)?.toFixed(2)}% CV</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-blue-100">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1">Include</th>
              <th className="px-2 py-1">File</th>
              <th className="px-2 py-1 text-right">Score</th>
              <th className="px-2 py-1 text-right">Mean Cons.</th>
              <th className="px-2 py-1 text-right">Std Cons.</th>
              <th className="px-2 py-1 text-right">Hist Sim.</th>
              <th className="px-2 py-1 text-right">Pixel Corr.</th>
              <th className="px-2 py-1 text-right">Outlier σ</th>
              <th className="px-2 py-1">Status</th>
              <th className="px-2 py-1">Warnings</th>
            </tr>
          </thead>
          <tbody>
            {sortedFrames.map((frame, i) => {
              const isRecommended = analysis.recommended_frames?.includes(frame.path);
              const isQuestionable = analysis.questionable_frames?.includes(frame.path);
              const isRejected = analysis.rejected_frames?.includes(frame.path);
              const included = frameSelections[frame.path] !== undefined ? frameSelections[frame.path] : isRecommended;
              
              let statusColor = 'text-green-400';
              let statusText = '✓ Good';
              let rowColor = 'bg-green-900/10';
              
              if (isRejected) {
                statusColor = 'text-red-400';
                statusText = '✗ Poor';
                rowColor = 'bg-red-900/20';
              } else if (isQuestionable) {
                statusColor = 'text-yellow-400';
                statusText = '⚠ Fair';
                rowColor = 'bg-yellow-900/20';
              }

              if (!included) {
                rowColor = 'bg-gray-800/40';
              }

              return (
                <tr key={frame.path} className={rowColor}>
                  <td className="px-2 py-1">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={e => onFrameToggle(frame.path, e.target.checked)}
                      className="accent-purple-600"
                    />
                  </td>
                  <td className="px-2 py-1 max-w-xs truncate" title={frame.path}>
                    {frame.path.split("/").pop()}
                  </td>
                  <td className="px-2 py-1 text-right font-medium">
                    {frame.consistency_score?.toFixed(1)}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {(frame.mean_consistency * 100)?.toFixed(1)}%
                  </td>
                  <td className="px-2 py-1 text-right">
                    {(frame.std_consistency * 100)?.toFixed(1)}%
                  </td>
                  <td className="px-2 py-1 text-right">
                    {(frame.histogram_similarity * 100)?.toFixed(1)}%
                  </td>
                  <td className="px-2 py-1 text-right">
                    {(frame.pixel_correlation * 100)?.toFixed(1)}%
                  </td>
                  <td className="px-2 py-1 text-right">
                    {frame.outlier_deviation?.toFixed(1)}
                  </td>
                  <td className="px-2 py-1">
                    <span className={statusColor}>{statusText}</span>
                  </td>
                  <td className="px-2 py-1">
                    {frame.warnings && frame.warnings.length > 0 && (
                      <div className="text-orange-400 text-xs">
                        {frame.warnings.slice(0, 2).map((warning: string, idx: number) => (
                          <div key={idx} title={warning}>
                            {warning.length > 30 ? warning.substring(0, 30) + '...' : warning}
                          </div>
                        ))}
                        {frame.warnings.length > 2 && (
                          <div className="text-gray-400">+{frame.warnings.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {analysis.selection_advice && (
        <div className="mt-3 p-2 bg-purple-900/20 rounded border border-purple-500/30">
          <div className="text-sm text-purple-200 mb-1">
            <strong>Selection Advice:</strong>
          </div>
          <div className="text-xs text-purple-300">
            Recommended {analysis.selection_advice.frames_used} frames for stacking
            (quality: {analysis.selection_advice.selection_quality?.toFixed(1)}/10,
            improvement: +{analysis.selection_advice.improvement_estimate?.toFixed(1)})
          </div>
        </div>
      )}
    </div>
  );
} 