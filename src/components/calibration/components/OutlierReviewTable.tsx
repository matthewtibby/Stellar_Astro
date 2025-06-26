import React from 'react';

interface OutlierReviewTableProps {
  frames: any[];
  outliers: any[];
  sigma: number;
  onSigmaChange: (v: number) => void;
  onOverride: (path: string, include: boolean) => void;
  overrides: Record<string, boolean>;
  loading: boolean;
  onReRun: () => void;
}

export function OutlierReviewTable({
  frames,
  outliers,
  sigma,
  onSigmaChange,
  onOverride,
  overrides,
  loading,
  onReRun,
}: OutlierReviewTableProps) {
  return (
    <div className="bg-[#181c23] rounded-xl shadow-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-blue-200">Outlier Frame Review</h3>
        <div className="flex items-center gap-4">
          <label className="text-blue-100 font-medium">Sigma Threshold</label>
          <input
            type="range"
            min={1}
            max={5}
            step={0.1}
            value={sigma}
            onChange={e => onSigmaChange(Number(e.target.value))}
            className="w-32 accent-blue-600"
            disabled={loading}
          />
          <input
            type="number"
            min={1}
            max={5}
            step={0.1}
            value={sigma}
            onChange={e => onSigmaChange(Number(e.target.value))}
            className="border rounded px-2 py-1 w-16 bg-[#232946] text-white border-[#232946]"
            disabled={loading}
          />
          <button
            className="ml-4 px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800"
            onClick={onReRun}
            disabled={loading}
          >
            {loading ? "Detecting..." : "Re-Run"}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-8 mb-2">
        <span className="text-green-400 font-semibold">
          Good: {frames.length - outliers.length}
        </span>
        <span className="text-red-400 font-semibold">
          Outliers: {outliers.length}
        </span>
        <span className="text-blue-300">
          Total: {frames.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-blue-100">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">Include</th>
              <th className="px-2 py-1 text-left">File</th>
              <th className="px-2 py-1 text-right">Mean</th>
              <th className="px-2 py-1 text-right">Std</th>
              <th className="px-2 py-1 text-right">Median</th>
              <th className="px-2 py-1 text-right">Min</th>
              <th className="px-2 py-1 text-right">Max</th>
              <th className="px-2 py-1 text-left">Outlier?</th>
              <th className="px-2 py-1 text-left">Reason</th>
            </tr>
          </thead>
          <tbody>
            {frames.map((f, i) => {
              const isOutlier = f.outlier;
              const included = overrides[f.path] !== undefined ? overrides[f.path] : !isOutlier;
              return (
                <tr
                  key={f.path}
                  className={
                    isOutlier && included
                      ? "bg-yellow-900/30"
                      : isOutlier
                      ? "bg-red-900/40"
                      : included
                      ? "bg-green-900/10"
                      : "bg-gray-800/40"
                  }
                >
                  <td className="px-2 py-1">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={e => onOverride(f.path, e.target.checked)}
                      className="accent-blue-600"
                    />
                  </td>
                  <td className="px-2 py-1 max-w-xs truncate" title={f.path}>
                    {f.path.split("/").pop()}
                  </td>
                  <td className="px-2 py-1 text-right">{f.mean.toFixed(3)}</td>
                  <td className="px-2 py-1 text-right">{f.std.toFixed(3)}</td>
                  <td className="px-2 py-1 text-right">{f.median.toFixed(3)}</td>
                  <td className="px-2 py-1 text-right">{f.min.toFixed(3)}</td>
                  <td className="px-2 py-1 text-right">{f.max.toFixed(3)}</td>
                  <td className="px-2 py-1">
                    {isOutlier ? (
                      <span className="text-red-400 font-bold">Yes</span>
                    ) : (
                      <span className="text-green-400">No</span>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {isOutlier && f.reasons && (
                      <ul>
                        {f.reasons.map((r: string, j: number) => (
                          <li key={j} className="text-yellow-300">{r}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-xs text-blue-300">
        <span>
          <b>Tip:</b> Outliers are auto-flagged, but you can override by toggling the checkbox. Only checked frames will be used in the master stack.
        </span>
      </div>
    </div>
  );
} 