import React from 'react';
import { MasterType } from '../types/calibration.types';
import { Star, Moon, BarChart3, Info } from 'lucide-react';
import type { MasterStats } from '../types/analysis.types';

interface MasterPreviewPanelProps {
  selectedType: MasterType;
  previewLoading: boolean;
  previewUrl: string | null;
  superdarkPreviewUrl: string | null;
  selectedSuperdarkPath: string | null;
  masterStats: MasterStats | null;
  superdarkStats: MasterStats | null;
  superdarkStatsLoading: boolean;
  showHistogram: boolean;
  setShowHistogram: (show: boolean | ((prev: boolean) => boolean)) => void;
  qualityAnalysisResults: any;
  showQualityReport: boolean;
  setShowQualityReport: (show: boolean) => void;
  previewError: string | null;
  FRAME_TYPES: Array<{ key: string; label: string }>;
  histogramStats?: any | null;
}

export const MasterPreviewPanel: React.FC<MasterPreviewPanelProps> = ({
  selectedType,
  previewLoading,
  previewUrl,
  superdarkPreviewUrl,
  selectedSuperdarkPath,
  masterStats,
  superdarkStats,
  superdarkStatsLoading,
  showHistogram,
  setShowHistogram,
  qualityAnalysisResults,
  showQualityReport,
  setShowQualityReport,
  previewError,
  FRAME_TYPES,
  histogramStats
}) => {
  // Determine which preview to show: superdark takes priority over master dark
  const isShowingSuperdark = selectedType === 'dark' && selectedSuperdarkPath && superdarkPreviewUrl;
  const displayUrl = isShowingSuperdark ? superdarkPreviewUrl : previewUrl;
  const displayTitle = isShowingSuperdark ? 'Selected Superdark Preview' : 'Master Preview';

  // Determine which stats to use for histogram overlay
  const overlayStats = histogramStats || (isShowingSuperdark ? superdarkStats : masterStats);

  if (previewLoading) {
    return (
      <div className="w-full bg-[#10131a] rounded-2xl p-10 border border-[#232946]/60 flex flex-col items-center shadow-xl h-full">
        <h3 className="text-xl font-bold mb-6 text-white">{FRAME_TYPES.find(f => f.key === selectedType)?.label} Preview</h3>
        <div className="flex items-center gap-2 mt-4 text-blue-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>Loading preview...</span>
        </div>
      </div>
    );
  }

  if (!displayUrl) {
    return (
      <div className="w-full bg-[#10131a] rounded-2xl p-10 border border-[#232946]/60 flex flex-col items-center shadow-xl h-full">
        <h3 className="text-xl font-bold mb-6 text-white">{FRAME_TYPES.find(f => f.key === selectedType)?.label} Preview</h3>
        <div className="text-blue-200 text-center mt-8">
          {previewError || 'No preview available. Run calibration to generate a master frame.'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#10131a] rounded-2xl p-10 border border-[#232946]/60 flex flex-col items-center shadow-xl h-full">
      <h3 className="text-xl font-bold mb-6 text-white">{FRAME_TYPES.find(f => f.key === selectedType)?.label} Preview</h3>
      
      <div className="flex flex-row items-start w-full max-w-5xl mx-auto gap-6">
        {/* Left: Main image preview, relative for overlay */}
        <div className="relative flex-grow flex justify-center">
          <div className="relative inline-block">
            <img src={displayUrl} alt={displayTitle} className="rounded-lg shadow-lg max-w-full max-h-96" />

            {/* Floating action bar at the bottom of the preview image */}
            <div className="absolute left-0 bottom-0 w-full flex flex-row items-center gap-2 p-3 bg-transparent rounded-b-lg z-20">
              {/* Histogram toggle icon */}
              <button
                className="p-2 rounded-full bg-gray-900/70 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 shadow flex items-center justify-center transition-colors"
                style={{ minWidth: 40, minHeight: 40 }}
                onClick={() => setShowHistogram((v: boolean): boolean => !v)}
                aria-label="Show Histogram"
              >
                <BarChart3 className={`w-6 h-6 ${showHistogram ? 'text-blue-300' : 'text-blue-200'}`} />
              </button>
              {/* Add more icons/buttons here as needed */}
            </div>

            {/* Histogram overlay - show for both master frames and superdarks */}
            {showHistogram && overlayStats && (
              <svg className="absolute left-0 bottom-0 w-full h-32 pointer-events-none z-10" viewBox="0 0 400 80">
                {(() => {
                  const hist = overlayStats.histogram;
                  const max = Math.max(...hist);
                  const minVal = overlayStats.stats?.min ?? overlayStats.min;
                  const maxVal = overlayStats.stats?.max ?? overlayStats.max;
                  return (
                    <>
                      {/* Axis bar */}
                      <line x1={20} y1={80} x2={380} y2={80} stroke="#888" strokeWidth="2" opacity="0.5" />
                      {/* Histogram curve */}
                      <polyline 
                        points={hist.map((v: number, i: number) => `${20 + (i / (hist.length - 1)) * 360},${80 - (v / max) * 70}`).join(' ')} 
                        fill="none" 
                        stroke="#00ffcc" 
                        strokeWidth="2.5" 
                        opacity="0.95" 
                      />
                      {/* 0 and max labels, smaller and flush with bar ends */}
                      <text x={20} y={75} fill="#aaa" fontSize="11" fontWeight="500" textAnchor="start">0</text>
                      <text x={380} y={75} fill="#aaa" fontSize="11" fontWeight="500" textAnchor="end">{maxVal}</text>
                    </>
                  );
                })()}
              </svg>
            )}
          </div>
        </div>
        {/* Right: Stack score card and info card vertically, right-aligned */}
        <div className="flex flex-col items-end gap-4 flex-shrink-0">
          {/* Score card - only show for master frames, not superdarks */}
          {!isShowingSuperdark && masterStats?.score !== undefined && (
            <div className="w-72 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border border-blue-500/40 rounded-xl shadow-lg p-4 flex flex-col items-center z-20 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-6 h-6 text-yellow-400 drop-shadow" />
                <span className="text-2xl font-bold text-white">{masterStats.score} / 10</span>
                <span className="ml-2 text-blue-200 text-sm font-medium">Calibration Score</span>
              </div>
              {Array.isArray(masterStats.recommendations) && masterStats.recommendations.length > 0 && (
                <ul className="mt-1 text-blue-100 text-sm list-disc list-inside w-full">
                  {masterStats.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="mb-1">{rec}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {/* Info card - show when histogram is toggled */}
          {showHistogram && overlayStats && (
            <div className="w-48 bg-black/80 rounded-lg p-2 text-xs text-white border border-gray-700 shadow-lg flex flex-col items-center justify-start flex-shrink-0">
              <div className="font-semibold text-gray-200 mb-1 text-center">Information</div>
              <div className="flex flex-col gap-0.5 text-center">
                {(() => {
                  // Prefer overlayStats.stats if present, else use overlayStats root
                  const stats = overlayStats.stats || overlayStats;
                  return (
                    <>
                      <div><span className="text-gray-400">Max</span> <span className="ml-2 font-mono">{stats.max ?? '-'}</span></div>
                      <div><span className="text-gray-400">Min</span> <span className="ml-2 font-mono">{stats.min ?? '-'}</span></div>
                      <div><span className="text-gray-400">Avg</span> <span className="ml-2 font-mono">{typeof stats.mean === 'number' ? stats.mean.toFixed(0) : '-'}</span></div>
                      <div><span className="text-gray-400">Std</span> <span className="ml-2 font-mono">{typeof stats.std === 'number' ? stats.std.toFixed(0) : '-'}</span></div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 