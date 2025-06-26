import React from 'react';
import { MasterType } from '../types/calibration.types';
import { Star, Moon, BarChart3, Info } from 'lucide-react';

interface MasterPreviewPanelProps {
  selectedType: MasterType;
  previewLoading: boolean;
  previewUrl: string | null;
  superdarkPreviewUrl: string | null;
  selectedSuperdarkPath: string | null;
  masterStats: any;
  superdarkStats: any;
  superdarkStatsLoading: boolean;
  showHistogram: boolean;
  setShowHistogram: (show: boolean | ((prev: boolean) => boolean)) => void;
  qualityAnalysisResults: any;
  showQualityReport: boolean;
  setShowQualityReport: (show: boolean) => void;
  previewError: string | null;
  FRAME_TYPES: Array<{ key: string; label: string }>;
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
  FRAME_TYPES
}) => {
  // Determine which preview to show: superdark takes priority over master dark
  const isShowingSuperdark = selectedType === 'dark' && selectedSuperdarkPath && superdarkPreviewUrl;
  const displayUrl = isShowingSuperdark ? superdarkPreviewUrl : previewUrl;
  const displayTitle = isShowingSuperdark ? 'Selected Superdark Preview' : 'Master Preview';

  if (previewLoading) {
    return (
      <div className="w-3/5 bg-[#10131a] rounded-2xl p-10 border border-[#232946]/60 flex flex-col items-center shadow-xl h-full">
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
      <div className="w-3/5 bg-[#10131a] rounded-2xl p-10 border border-[#232946]/60 flex flex-col items-center shadow-xl h-full">
        <h3 className="text-xl font-bold mb-6 text-white">{FRAME_TYPES.find(f => f.key === selectedType)?.label} Preview</h3>
        <div className="text-blue-200 text-center mt-8">
          {previewError || 'No preview available. Run calibration to generate a master frame.'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-3/5 bg-[#10131a] rounded-2xl p-10 border border-[#232946]/60 flex flex-col items-center shadow-xl h-full">
      <h3 className="text-xl font-bold mb-6 text-white">{FRAME_TYPES.find(f => f.key === selectedType)?.label} Preview</h3>
      
      <div className="flex flex-row items-center w-full max-w-3xl relative">
        {/* Show title and info indicating what we're previewing */}
        {isShowingSuperdark && (
          <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 bg-blue-900/90 text-blue-100 px-3 py-1 rounded-lg text-sm font-medium border border-blue-500/40 z-30">
              Superdark Preview
            </div>
            {/* Superdark Score & Info Box */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-full max-w-md bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 border border-purple-500/40 rounded-xl shadow-lg p-4 flex flex-col items-center z-20 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-6 h-6 text-purple-400 drop-shadow" />
                <span className="text-xl font-bold text-white">Superdark Analysis</span>
              </div>
              
              {superdarkStatsLoading ? (
                <div className="flex items-center gap-2 text-purple-100">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span className="text-sm">Analyzing quality...</span>
                </div>
              ) : superdarkStats?.score !== undefined ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-6 h-6 text-yellow-400 drop-shadow" />
                    <span className="text-2xl font-bold text-white">{superdarkStats.score} / 10</span>
                    <span className="ml-2 text-purple-200 text-sm font-medium">Quality Score</span>
                  </div>
                  {Array.isArray(superdarkStats.recommendations) && superdarkStats.recommendations.length > 0 && (
                    <ul className="mt-1 text-purple-100 text-sm list-disc list-inside w-full">
                      {superdarkStats.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="mb-1">{rec}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2 text-xs text-purple-200 text-center opacity-80">
                    Pre-processed and ready for calibration
                  </div>
                </>
              ) : (
                <div className="text-purple-100 text-sm text-center">
                  <div className="mb-1">✅ Ready for immediate use</div>
                  <div className="mb-1">🎯 Optimized master dark frame</div>
                  <div>⚡ No additional processing required</div>
                  <div className="mt-2 text-xs text-purple-200 opacity-80">
                    This superdark will be used directly for light frame calibration
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Histogram toggle icon */}
        <button
          className="p-3 ml-2 rounded-full bg-gray-900/80 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 shadow-lg flex-shrink-0"
          style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowHistogram((v: boolean): boolean => !v)}
          aria-label="Show Histogram"
        >
          <BarChart3 className="w-7 h-7 text-blue-200" />
        </button>

        {/* Quality Report toggle icon */}
        {qualityAnalysisResults && (
          <button
            className="p-3 ml-2 rounded-full bg-gray-900/80 hover:bg-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 shadow-lg flex-shrink-0"
            style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowQualityReport(!showQualityReport)}
            aria-label="Show Quality Report"
          >
            <Info className="w-7 h-7 text-purple-200" />
          </button>
        )}

        {/* Main image preview, relative for overlay */}
        <div className="relative flex-grow flex justify-center">
          <img src={displayUrl} alt={displayTitle} className="rounded-lg shadow-lg max-w-full max-h-96" />
          
          {/* Score & Recommendations Box - only show for master frames, not superdarks */}
          {!isShowingSuperdark && masterStats?.score !== undefined && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-full max-w-md bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border border-blue-500/40 rounded-xl shadow-lg p-4 flex flex-col items-center z-20 animate-fade-in">
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

          {/* Histogram overlay - show for both master frames and superdarks */}
          {showHistogram && ((masterStats?.histogram && !isShowingSuperdark) || (superdarkStats?.histogram && isShowingSuperdark)) && (
            <svg className="absolute left-0 bottom-0 w-full h-32 pointer-events-none z-10" viewBox="0 0 400 80">
              {(() => {
                const currentStats = isShowingSuperdark ? superdarkStats : masterStats;
                const hist = currentStats.histogram;
                const max = Math.max(...hist);
                const minVal = currentStats.stats?.min || currentStats.min;
                const maxVal = currentStats.stats?.max || currentStats.max;
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

        {/* Info table styled like ASIAIR, right-aligned - show for both master frames and superdarks */}
        {showHistogram && ((masterStats && !isShowingSuperdark) || (superdarkStats && isShowingSuperdark)) && (
          <div className="ml-4 mt-2 bg-black/80 rounded-lg p-2 text-xs text-white border border-gray-700 shadow-lg min-w-[90px] max-h-32 flex flex-col justify-start flex-shrink-0">
            <div className="font-semibold text-gray-200 mb-1 text-right">Information</div>
            <div className="flex flex-col gap-0.5 text-right">
              {(() => {
                const currentStats = isShowingSuperdark ? superdarkStats : masterStats;
                const stats = currentStats.stats || currentStats;
                return (
                  <>
                    <div><span className="text-gray-400">Max</span> <span className="ml-2 font-mono">{stats.max}</span></div>
                    <div><span className="text-gray-400">Min</span> <span className="ml-2 font-mono">{stats.min}</span></div>
                    <div><span className="text-gray-400">Avg</span> <span className="ml-2 font-mono">{stats.mean.toFixed(0)}</span></div>
                    <div><span className="text-gray-400">Std</span> <span className="ml-2 font-mono">{stats.std.toFixed(0)}</span></div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 