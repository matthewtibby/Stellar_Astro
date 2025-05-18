import React, { useState, useRef, useEffect } from 'react';
import { Info, Loader2, CheckCircle2, XCircle, RefreshCw, Star, Moon, Sun, Zap } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import CalibrationUploadScaffold from './CalibrationUploadScaffold';

const FRAME_TYPES = [
  { key: 'dark', label: 'Master Dark' },
  { key: 'flat', label: 'Master Flat' },
  { key: 'bias', label: 'Master Bias' },
];

type MasterType = 'dark' | 'flat' | 'bias';
type MasterStatus = 'complete' | 'in_progress' | 'not_started';

const PLACEHOLDER_FILES = {
  light: Array.from({ length: 104 }, (_, i) => `Light${i + 1}.fits`),
  dark: Array.from({ length: 42 }, (_, i) => `Dark${i + 1}.fits`),
  flat: Array.from({ length: 12 }, (_, i) => `Flat${i + 1}.fits`),
  bias: Array.from({ length: 8 }, (_, i) => `Bias${i + 1}.fits`),
};

const BASIC_STACKING_METHODS = [
  { value: 'median', label: 'Median' },
  { value: 'mean', label: 'Mean' },
];

const ADVANCED_DARK_STACKING_METHODS = [
  { value: 'median', label: 'Median' },
  { value: 'mean', label: 'Mean' },
  { value: 'winsorized', label: 'Winsorized Sigma Clipping' },
  { value: 'linear_fit', label: 'Linear Fit Clipping' },
];

const MASTER_STATUS: Record<MasterType, MasterStatus> = {
  dark: 'complete',
  flat: 'in_progress',
  bias: 'not_started',
};

const STATUS_COLORS: Record<MasterStatus, string> = {
  complete: 'bg-green-500',
  in_progress: 'bg-amber-400',
  not_started: 'bg-red-500',
};

const STATUS_LABELS: Record<MasterStatus, string> = {
  complete: 'Ready',
  in_progress: 'Processing',
  not_started: 'Not Started',
};

// Add new state for pixel rejection algorithm and cosmetic correction method/threshold
type PixelRejectionAlgorithm = 'sigma' | 'winsorized' | 'linear_fit';
const PIXEL_REJECTION_ALGORITHMS = [
  { value: 'sigma', label: 'Sigma Clipping' },
  { value: 'winsorized', label: 'Winsorized Sigma Clipping' },
  { value: 'linear_fit', label: 'Linear Fit Clipping' },
];
const COSMETIC_METHODS = [
  { value: 'hot_pixel_map', label: 'Hot Pixel Map' },
  { value: 'la_cosmic', label: 'L.A.Cosmic' },
];

// Add Master Flat stacking methods and tooltips
const FLAT_BEGINNER_METHODS = [
  { value: 'mean', label: 'Mean (Average)', info: 'Adds all pixel values and divides by number of frames. Simple, fast, but sensitive to outliers.' },
  { value: 'median', label: 'Median', info: 'Selects the median value per pixel. More robust to dust/defects or minor variations between frames.' },
  { value: 'minmax', label: 'Min/Max Rejection', info: 'Drops highest and lowest before averaging. Helps remove outliers.' },
];
const FLAT_ADVANCED_METHODS = [
  { value: 'sigma', label: 'Sigma Clipping', info: 'Removes outlier pixel values based on a standard deviation threshold.' },
  { value: 'winsorized', label: 'Winsorized Sigma Clipping', info: 'Similar to sigma clipping, but replaces outliers instead of discarding them.' },
  { value: 'linear_fit', label: 'Linear Fit Clipping', info: 'Compares pixel values across frames and fits a line to reject inconsistent ones.' },
  { value: 'adaptive_weighted', label: 'Adaptive Weighted Average', info: 'Assigns weights to each frame/pixel based on quality.' },
  { value: 'entropy_weighted', label: 'Entropy Weighted Average', info: 'Prioritizes frames with lowest noise/entropy.' },
];

// SVG illustration for empty state
const EmptyFilesSVG = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="40" width="80" height="50" rx="10" fill="#232946" />
    <rect x="30" y="50" width="60" height="8" rx="4" fill="#3b4a6b" />
    <rect x="30" y="62" width="40" height="8" rx="4" fill="#3b4a6b" />
    <circle cx="60" cy="90" r="6" fill="#3b4a6b" />
    <rect x="45" y="20" width="30" height="10" rx="5" fill="#232946" />
    <rect x="50" y="25" width="20" height="3" rx="1.5" fill="#3b4a6b" />
  </svg>
);

// Confetti animation for success
const Confetti = () => (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-50 animate-fade-in">
    <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="4" fill="#facc15" />
      <circle cx="60" cy="10" r="3" fill="#38bdf8" />
      <circle cx="100" cy="25" r="5" fill="#f472b6" />
      <circle cx="40" cy="40" r="3" fill="#a3e635" />
      <circle cx="80" cy="50" r="4" fill="#f87171" />
    </svg>
  </div>
);

const CalibrationScaffoldUI: React.FC<{ projectId: string; onBack?: () => void }> = ({ projectId, onBack }) => {
  const [selectedType, setSelectedType] = useState<MasterType>('dark');
  const [tabState, setTabState] = useState({
    dark: {
      advanced: false,
      stackingMethod: 'median',
      sigmaThreshold: '3.0',
      darkScaling: false,
      darkScalingFactor: 1.0,
      biasSubtraction: false,
      ampGlowSuppression: false,
      tempMatching: false,
      exposureMatching: false,
      cosmeticCorrection: false,
      cosmeticMethod: 'hot_pixel_map',
      cosmeticThreshold: 0.5,
      customRejection: '',
      pixelRejectionAlgorithm: 'sigma',
    },
    flat: {
      advanced: false,
      stackingMethod: 'mean',
      sigmaThreshold: '3.0',
      weightParam: '',
      cosmeticCorrection: false,
      cosmeticMethod: 'hot_pixel_map',
      cosmeticThreshold: 0.5,
      customRejection: '',
    },
    bias: {
      advanced: false,
      stackingMethod: 'median',
      sigmaThreshold: '3.0',
      cosmeticCorrection: false,
      cosmeticMethod: 'hot_pixel_map',
      cosmeticThreshold: 0.5,
      customRejection: '',
    },
  });
  const [showHistogram, setShowHistogram] = useState(false);
  // Simulated job status: 'idle' | 'queued' | 'running' | 'success' | 'failed'
  const [jobStatus, setJobStatus] = useState<'idle' | 'queued' | 'running' | 'success' | 'failed'>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  const actionBtnRef = useRef<HTMLButtonElement>(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility for modal
  useEffect(() => {
    if (!showFileModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFileModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFileModal]);

  // Filtered files for modal
  const filteredFiles = PLACEHOLDER_FILES[selectedType].filter(f => f.toLowerCase().includes(fileSearch.toLowerCase()));

  // Helper to get/set current tab state
  const currentTab = tabState[selectedType];
  const setCurrentTab = (updates: Partial<typeof tabState[MasterType]>) => setTabState(prev => ({
    ...prev,
    [selectedType]: { ...prev[selectedType], ...updates }
  }));

  // Helper to show advanced dark options only for Master Dark
  const showAdvancedDarkOptions = selectedType === 'dark' && currentTab.advanced;

  // Dynamic histogram info text
  const histogramInfo: Record<MasterType, string> = {
    dark: 'Check for hot pixels, amp glow, and clipped blacks. A good dark frame histogram should be smooth, with no sharp spikes at the edges.',
    flat: 'Check for even illumination and no clipping. A good flat frame histogram should be centered, with no spikes at the edges.',
    bias: 'Check for a narrow, centered peak. Bias frames should have low noise and no clipping.'
  };

  // Default settings for reset
  const defaultTabState = {
    dark: {
      advanced: false,
      stackingMethod: 'median',
      sigmaThreshold: '3.0',
      darkScaling: false,
      darkScalingFactor: 1.0,
      biasSubtraction: false,
      ampGlowSuppression: false,
      tempMatching: false,
      exposureMatching: false,
      cosmeticCorrection: false,
      cosmeticMethod: 'hot_pixel_map',
      cosmeticThreshold: 0.5,
      customRejection: '',
      pixelRejectionAlgorithm: 'sigma',
    },
    flat: {
      advanced: false,
      stackingMethod: 'mean',
      sigmaThreshold: '3.0',
      weightParam: '',
      cosmeticCorrection: false,
      cosmeticMethod: 'hot_pixel_map',
      cosmeticThreshold: 0.5,
      customRejection: '',
    },
    bias: {
      advanced: false,
      stackingMethod: 'median',
      sigmaThreshold: '3.0',
      cosmeticCorrection: false,
      cosmeticMethod: 'hot_pixel_map',
      cosmeticThreshold: 0.5,
      customRejection: '',
    },
  };

  // Reset current tab
  const handleResetCurrent = () => {
    setTabState(prev => ({ ...prev, [selectedType]: { ...defaultTabState[selectedType] } }));
  };
  // Reset all tabs
  const handleResetAll = () => {
    setTabState({ ...defaultTabState });
  };
  // Save preset (UI only)
  const handleSavePreset = () => {
    alert('Preset saved! (UI only, not persisted)');
  };

  // Simulate job creation
  const handleCreateMaster = () => {
    setJobStatus('queued');
    setTimeout(() => {
      setJobStatus('running');
      setTimeout(() => {
        setJobStatus('success');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
      }, 2000);
    }, 1000);
  };

  // Ripple effect for primary action button
  const handleCreateMasterWithRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = actionBtnRef.current;
    if (btn) {
      const circle = document.createElement('span');
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      const radius = diameter / 2;
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - btn.getBoundingClientRect().left - radius}px`;
      circle.style.top = `${e.clientY - btn.getBoundingClientRect().top - radius}px`;
      circle.className = 'ripple';
      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    }
    handleCreateMaster();
  };

  // Frame type icons (fix linter: use React.ReactElement)
  const FRAME_TYPE_ICONS: Record<MasterType, React.ReactElement> = {
    dark: <Moon className="w-6 h-6 text-blue-400 drop-shadow" />,
    flat: <Sun className="w-6 h-6 text-yellow-400 drop-shadow" />,
    bias: <Zap className="w-6 h-6 text-pink-400 drop-shadow" />,
  };

  return (
    <TooltipProvider>
      {/* Upload Scaffold: Step 1 */}
      <div className="h-8" />
      <div className="border-b border-blue-900/40 mb-8" />
      {/* Existing calibration workflow UI follows */}
      <div className="flex flex-col h-full bg-[#0a0d13]/80 rounded-2xl shadow-2xl border border-[#232946]/60 p-6 backdrop-blur-md">
        {/* Success Toast/Banner with Confetti */}
        {showSuccess && (
          <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in relative">
            <CheckCircle2 className="w-5 h-5 animate-bounce" /> Master frame created successfully!
            <Confetti />
          </div>
        )}
        {/* File Modal */}
        {showFileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
            <div ref={modalRef} className="bg-[#10131a] rounded-2xl shadow-2xl border border-[#232946]/60 p-8 w-[420px] max-h-[80vh] flex flex-col animate-slide-in">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-white">All {FRAME_TYPES.find(f => f.key === selectedType)?.label} Files</h4>
                <button
                  className="p-2 rounded-full hover:bg-blue-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  onClick={() => setShowFileModal(false)}
                  aria-label="Close file list modal"
                >
                  <XCircle className="w-6 h-6 text-blue-200" />
                </button>
              </div>
              <input
                type="text"
                className="mb-4 px-3 py-2 rounded bg-[#181c23] text-white border border-[#232946]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                placeholder="Search files..."
                value={fileSearch}
                onChange={e => setFileSearch(e.target.value)}
                aria-label="Search files"
              />
              <div className="overflow-y-auto flex-1">
                {filteredFiles.length === 0 ? (
                  <div className="text-blue-200 text-center py-8">No files found.</div>
                ) : (
                  <ul className="space-y-2">
                    {filteredFiles.map((file, idx) => (
                      <li key={file} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#181c23] border border-[#232946]/40 shadow hover:bg-blue-900/30 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                        <span className="w-8 h-8 flex items-center justify-center bg-blue-900/40 rounded-full text-blue-200 font-bold text-sm">{idx + 1}</span>
                        <span className="text-blue-100 font-mono truncate">{file}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Master Tabs with Color Indicators */}
        <div className="flex gap-4 mb-8">
          {FRAME_TYPES.map(ft => (
            <button
              key={ft.key}
              onClick={() => setSelectedType(ft.key as MasterType)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-lg transition-all border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0d13] shadow-sm ${selectedType === ft.key ? 'bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 text-white shadow-lg' : 'bg-[#10131a] text-blue-200 hover:bg-[#181c23]'}`}
              style={{ position: 'relative', transition: 'background 0.3s, color 0.3s, box-shadow 0.3s' }}
            >
              <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${STATUS_COLORS[MASTER_STATUS[ft.key as MasterType]]}`}></span>
              <span className="ml-5 flex items-center gap-2">
                {FRAME_TYPE_ICONS[ft.key as MasterType]}
                <span className="drop-shadow font-extrabold text-xl tracking-tight">{ft.label}</span>
              </span>
              <span className={`ml-2 text-xs ${selectedType === ft.key ? 'text-white' : 'text-blue-300'}`}>{STATUS_LABELS[MASTER_STATUS[ft.key as MasterType]]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-row gap-8 w-full transition-all duration-500 animate-fade-in">
          {/* Center: Files and Settings for Selected Type */}
          <div className="w-2/5 bg-[#10131a]/90 rounded-2xl p-10 border border-[#232946]/60 flex flex-col shadow-xl relative">
            {/* Icon Button Group (top right, outside header) */}
            <div className="absolute top-6 right-6 flex gap-2 bg-[#181c23] rounded-full px-2 py-1 shadow border border-[#232946]/60 z-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-2 rounded-full hover:bg-blue-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    onClick={handleResetCurrent}
                    aria-label={`Reset ${FRAME_TYPES.find(f => f.key === selectedType)?.label} to defaults`}
                  >
                    <RefreshCw className="w-5 h-5 text-blue-200" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="animate-fade-in">
                  Reset to defaults
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-2 rounded-full hover:bg-blue-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    onClick={handleSavePreset}
                    aria-label="Save current settings as preset"
                  >
                    <Star className="w-5 h-5 text-blue-200" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="animate-fade-in">
                  Save current settings as preset
                </TooltipContent>
              </Tooltip>
            </div>
            {/* Header row: title left, status chip right */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {FRAME_TYPE_ICONS[selectedType]}
                <h3 className="text-2xl font-extrabold text-white tracking-tight drop-shadow">{FRAME_TYPES.find(f => f.key === selectedType)?.label} Calibration</h3>
                <span className="ml-2 px-2 py-1 rounded-full bg-green-900 text-green-300 text-xs font-semibold flex items-center gap-1 shadow">
                  <CheckCircle2 className="w-3 h-3" /> {STATUS_LABELS[MASTER_STATUS[selectedType]]}
                </span>
              </div>
            </div>
            {/* Files for selected type */}
            <div className="mb-8">
              <div className="flex items-center mb-2">
                <span className="font-medium text-blue-200 mr-2">{PLACEHOLDER_FILES[selectedType].length} files</span>
                <button
                  className="ml-auto text-xs text-blue-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  onClick={() => setShowFileModal(true)}
                  aria-label={`View all ${FRAME_TYPES.find(f => f.key === selectedType)?.label} files`}
                >
                  View All
                </button>
              </div>
              {PLACEHOLDER_FILES[selectedType].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <EmptyFilesSVG />
                  <div className="text-blue-200 mt-4 mb-2 font-semibold text-lg">No {FRAME_TYPES.find(f => f.key === selectedType)?.label} files yet!</div>
                  <button
                    className="mt-2 px-4 py-2 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-800 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    onClick={() => alert('Trigger upload flow (to be implemented)')}
                    aria-label="Upload files"
                  >
                    Upload Files
                  </button>
                </div>
              ) : (
                <div className="flex flex-row gap-2 flex-wrap mb-1">
                  {PLACEHOLDER_FILES[selectedType].slice(0, 3).map((file, idx) => (
                    <Tooltip key={file}>
                      <TooltipTrigger asChild>
                        <div
                          tabIndex={0}
                          className="w-12 h-12 bg-[#181c23] rounded-full flex items-center justify-center text-xs text-gray-400 border border-[#232946]/60 shadow hover:scale-110 focus:scale-110 transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                          aria-label={`File: ${file}`}
                        >
                          <span>{idx + 1}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="animate-fade-in">
                        {file}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {PLACEHOLDER_FILES[selectedType].length > 3 && (
                    <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-xs text-blue-200 border border-[#232946]/60 shadow">
                      +{PLACEHOLDER_FILES[selectedType].length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Divider */}
            <div className="h-px bg-[#232946]/40 mb-8" />
            {/* Calibration Settings */}
            <div className="flex flex-col gap-8">
              {/* Beginner/Advanced toggle with labels */}
              <div className="flex items-center mb-6 gap-6">
                <span className="font-medium text-blue-200">Beginner</span>
                <label className="inline-flex relative items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={tabState.dark.advanced} onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, advanced: e.target.checked } }))} />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-all"></div>
                </label>
                <span className="font-medium text-blue-200">Advanced</span>
              </div>
              {/* Beginner mode: only show stacking method radio group (Median, Mean) */}
              {!tabState.dark.advanced && (
                <div className="mb-4">
                  <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
                  <div className="flex flex-col gap-2">
                    {BASIC_STACKING_METHODS.map(m => (
                      <label key={m.value} className="flex items-center gap-2 text-blue-200">
                        <input
                          type="radio"
                          name="darkStackingMethod"
                          value={m.value}
                          checked={tabState.dark.stackingMethod === m.value}
                          onChange={() => setTabState(prev => ({
                            ...prev,
                            dark: {
                              ...prev.dark,
                              stackingMethod: m.value,
                            }
                          }))}
                          className="accent-blue-600"
                        />
                        <span>{m.label}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {(() => {
                              switch (m.value) {
                                case 'median':
                                  return 'Median: Robust to outliers, good for most calibration frames.';
                                  case 'mean':
                                    return 'Mean: Improves SNR, but sensitive to outliers.';
                                  default:
                                    return '';
                              }
                            })()}
                          </TooltipContent>
                        </Tooltip>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {/* Advanced mode: show all advanced options as before */}
              {tabState.dark.advanced && (
                <div className="mb-4">
                  <button
                    className="flex items-center gap-2 text-blue-200 font-semibold mb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    onClick={() => setIsAdvancedOpen(v => !v)}
                    aria-expanded={isAdvancedOpen}
                    aria-controls="advanced-dark-panel"
                  >
                    <span className="w-5 h-5"><Zap /></span>
                    Advanced Options
                    <span className={`transition-transform ${isAdvancedOpen ? 'rotate-90' : ''}`}>▶</span>
                  </button>
                  <div
                    id="advanced-dark-panel"
                    className={`transition-all duration-300 overflow-hidden ${isAdvancedOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    {/* Stacking Method Radio Group (always visible) */}
                    <div className="mb-4">
                      <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
                      <div className="flex flex-col gap-2">
                        {ADVANCED_DARK_STACKING_METHODS.map(m => (
                          <label key={m.value} className="flex items-center gap-2 text-blue-200">
                            <input
                              type="radio"
                              name="darkStackingMethod"
                              value={m.value}
                              checked={tabState.dark.stackingMethod === m.value}
                              onChange={() => setTabState(prev => ({
                                ...prev,
                                dark: {
                                  ...prev.dark,
                                  stackingMethod: m.value,
                                }
                              }))}
                              className="accent-blue-600"
                            />
                            <span>{m.label}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {(() => {
                                  switch (m.value) {
                                    case 'median':
                                      return 'Median: Robust to outliers, good for most calibration frames.';
                                    case 'mean':
                                      return 'Mean: Improves SNR, but sensitive to outliers.';
                                    case 'sigma':
                                      return 'Sigma Clipping: Removes outlier pixels based on standard deviation.';
                                    case 'winsorized':
                                      return 'Winsorized Sigma Clipping: Like sigma clipping, but replaces outliers instead of discarding.';
                                    case 'linear_fit':
                                      return 'Linear Fit Clipping: Fits a line to reject inconsistent pixels across frames.';
                                    default:
                                      return '';
                                  }
                                })()}
                              </TooltipContent>
                            </Tooltip>
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Sigma/Kappa Threshold (slider + input) for relevant algorithms */}
                    {(tabState.dark.stackingMethod === 'sigma' || tabState.dark.stackingMethod === 'winsorized' || tabState.dark.stackingMethod === 'linear_fit') && (
                      <div className="mb-4">
                        <label className="block font-medium mb-1 text-blue-100 flex items-center gap-2">
                          Sigma/Kappa Threshold
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Controls outlier rejection. Lower values (2-3) are stricter, higher values (4-5) are more permissive. Default: 3.0. If you have many frames, use a lower value; for few frames, use a higher value.
                            </TooltipContent>
                          </Tooltip>
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="1.5"
                            max="5"
                            step="0.1"
                            value={tabState.dark.sigmaThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, sigmaThreshold: e.target.value } }))}
                            className="w-40 accent-blue-600"
                          />
                          <input
                            type="number"
                            step="0.1"
                            min="1.5"
                            max="5"
                            value={tabState.dark.sigmaThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, sigmaThreshold: e.target.value } }))}
                            className="border rounded px-2 py-1 w-20 bg-[#181c23] text-white border-[#232946]"
                          />
                        </div>
                      </div>
                    )}
                    {/* Dark Frame Scaling Toggle and Factor */}
                    <div className="mb-4">
                      <label className="block font-medium mb-1 text-blue-100 flex items-center gap-2">
                        Dark Frame Scaling
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Enable to scale darks to match lights. Useful if exposure/temperature differ. Default: off. Only enable if you know your darks need scaling.
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <label className="inline-flex items-center gap-2 text-blue-200">
                        <input type="checkbox" checked={tabState.dark.darkScaling} onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, darkScaling: e.target.checked } }))} className="accent-blue-600" />
                        Enable
                      </label>
                      {tabState.dark.darkScaling && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-blue-200">Scaling Factor:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.5"
                            max="2.0"
                            value={tabState.dark.darkScalingFactor ?? 1.0}
                            onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, darkScalingFactor: Number(e.target.value) } }))}
                            className="border rounded px-2 py-1 w-24 bg-[#181c23] text-white border-[#232946]"
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Adjust only if you know the required scaling. Default: 1.0 (no scaling).
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                    {/* Bias Subtraction Toggle */}
                    <div className="mb-4">
                      <label className="block font-medium mb-1 text-blue-100 flex items-center gap-2">
                        Bias Subtraction
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Enable to subtract master bias from darks. Default: on for most CCD/CMOS cameras. Disable only if your camera does not require bias subtraction.
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <label className="inline-flex items-center gap-2 text-blue-200">
                        <input type="checkbox" checked={tabState.dark.biasSubtraction} onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, biasSubtraction: e.target.checked } }))} className="accent-blue-600" />
                        Enable
                      </label>
                    </div>
                    {/* Amp Glow Suppression Toggle */}
                    <div className="mb-4">
                      <label className="block font-medium mb-1 text-blue-100 flex items-center gap-2">
                        Amp Glow Suppression
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Enable to reduce amplifier glow artifacts. Default: off. Enable if you see amp glow in your darks/lights.
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <label className="inline-flex items-center gap-2 text-blue-200">
                        <input type="checkbox" checked={tabState.dark.ampGlowSuppression} onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, ampGlowSuppression: e.target.checked } }))} className="accent-blue-600" />
                        Enable
                      </label>
                    </div>
                    {/* Temperature Matching Toggle */}
                    <div className="mb-4">
                      <label className="block font-medium mb-1 text-blue-100 flex items-center gap-2">
                        Temperature Matching
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Enable to only use darks matching the temperature of your lights. Default: on if you have temperature data. Improves calibration accuracy.
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <label className="inline-flex items-center gap-2 text-blue-200">
                        <input type="checkbox" checked={tabState.dark.tempMatching} onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, tempMatching: e.target.checked } }))} className="accent-blue-600" />
                        Enable
                      </label>
                    </div>
                    {/* Exposure Time Matching Toggle */}
                    <div className="mb-4">
                      <label className="block font-medium mb-1 text-blue-100 flex items-center gap-2">
                        Exposure Time Matching
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Enable to only use darks matching the exposure time of your lights. Default: on if you have matching darks. Improves calibration accuracy.
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <label className="inline-flex items-center gap-2 text-blue-200">
                        <input type="checkbox" checked={tabState.dark.exposureMatching} onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, exposureMatching: e.target.checked } }))} className="accent-blue-600" />
                        Enable
                      </label>
                    </div>
                    {/* Cosmetic Correction and Custom Rejection (for all advanced) */}
                    <div className="mb-4 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="cosmeticCorrection"
                        checked={tabState.dark.cosmeticCorrection}
                        onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, cosmeticCorrection: e.target.checked } }))}
                        className="mr-2 accent-blue-600"
                      />
                      <label htmlFor="cosmeticCorrection" className="font-medium text-blue-100 flex items-center gap-2">
                        Cosmetic Correction
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Removes hot/cold pixels and cosmetic defects. Default: off. Enable if you see many hot/cold pixels in your frames.
                          </TooltipContent>
                        </Tooltip>
                      </label>
                    </div>
                    {tabState.dark.cosmeticCorrection && (
                      <div className="mb-4">
                        <label className="block font-medium mb-1 text-blue-100 flex items-center gap-2">
                          Correction Method
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Choose the method for cosmetic correction. Hot Pixel Map is fast; L.A.Cosmic is more thorough but slower.
                            </TooltipContent>
                          </Tooltip>
                        </label>
                        <select
                          className="bg-[#181c23] text-white border border-[#232946] rounded px-3 py-2 mt-1"
                          value={tabState.dark.cosmeticMethod}
                          onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, cosmeticMethod: e.target.value } }))}
                        >
                          {COSMETIC_METHODS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>
                        <div className="mt-4">
                          <label className="block font-medium mb-1 text-blue-100 flex items-center gap-2">
                            Threshold
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                Adjust the sensitivity for defect detection. Default: 0.5. Lower for stricter correction, higher for more permissive.
                              </TooltipContent>
                            </Tooltip>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={tabState.dark.cosmeticThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, cosmeticThreshold: Number(e.target.value) } }))}
                            className="w-40 accent-blue-600"
                          />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={tabState.dark.cosmeticThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, cosmeticThreshold: Number(e.target.value) } }))}
                            className="border rounded px-2 py-1 w-20 bg-[#181c23] text-white border-[#232946] ml-2"
                          />
                        </div>
                      </div>
                    )}
                    {/* Custom Rejection Expression */}
                    <div className="mb-4">
                      <label className="block font-medium mb-1 text-blue-100 flex items-center gap-2">
                        Custom Rejection Expression
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Optional: Enter a custom outlier rejection rule/expression. For advanced users only.
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <input
                        type="text"
                        value={tabState.dark.customRejection}
                        onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, customRejection: e.target.value } }))}
                        className="border rounded px-2 py-1 w-full bg-[#181c23] text-white border-[#232946]"
                        placeholder="Optional rejection rule"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Create Master Button with extra margin */}
            <button
              ref={actionBtnRef}
              className="mt-8 mb-4 px-6 py-3 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 text-white rounded-xl shadow-lg hover:from-blue-800 hover:to-blue-900 font-semibold text-lg w-full transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 overflow-hidden relative"
              onClick={handleCreateMasterWithRipple}
              disabled={jobStatus === 'queued' || jobStatus === 'running'}
              style={{ boxShadow: '0 4px 24px 0 rgba(30, 64, 175, 0.15)' }}
            >
              {jobStatus === 'queued' || jobStatus === 'running' ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-200" /> Creating {FRAME_TYPES.find(f => f.key === selectedType)?.label}...
                </span>
              ) : (
                `Create ${FRAME_TYPES.find(f => f.key === selectedType)?.label}`
              )}
            </button>
            {/* Icon Button Group (below primary action) */}
            <div className="flex gap-2 justify-center mt-4 mb-8 bg-[#181c23] rounded-full px-2 py-1 shadow border border-[#232946]/60">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-2 rounded-full hover:bg-blue-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    onClick={handleResetCurrent}
                    aria-label={`Reset ${FRAME_TYPES.find(f => f.key === selectedType)?.label} to defaults`}
                  >
                    <RefreshCw className="w-5 h-5 text-blue-200" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="animate-fade-in">
                  Reset to defaults
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-2 rounded-full hover:bg-blue-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    onClick={handleSavePreset}
                    aria-label="Save current settings as preset"
                  >
                    <Star className="w-5 h-5 text-blue-200" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="animate-fade-in">
                  Save current settings as preset
                </TooltipContent>
              </Tooltip>
            </div>
            {/* Ripple effect style */}
            <style>{`
              .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255,255,255,0.3);
                animation: ripple 0.6s linear;
                pointer-events: none;
                z-index: 10;
              }
              @keyframes ripple {
                to {
                  transform: scale(2.5);
                  opacity: 0;
                }
              }
            `}</style>
          </div>
          {/* Right: Master Preview/Status */}
          <div className="w-3/5 bg-[#10131a] rounded-2xl p-10 border border-[#232946]/60 flex flex-col items-center shadow-xl">
            <h3 className="text-xl font-bold mb-6 text-white">{FRAME_TYPES.find(f => f.key === selectedType)?.label} Preview</h3>
            <div className="w-72 h-72 bg-[#232946] rounded-2xl flex items-center justify-center text-3xl text-blue-200 border-2 border-[#232946] mb-10 shadow-lg">
              SA
            </div>
            <button
              className="px-4 py-2 bg-gray-800 text-blue-200 rounded hover:bg-blue-700 mb-8 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              onClick={() => setShowHistogram(v => !v)}
            >
              Show Histogram
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}><Info className="w-4 h-4 text-blue-300 cursor-pointer" /></span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {histogramInfo[selectedType]}
                </TooltipContent>
              </Tooltip>
            </button>
            {showHistogram && (
              <div className="w-72 h-32 bg-gray-700 rounded flex items-center justify-center text-blue-100 border border-[#232946] mb-4">
                Histogram Placeholder
              </div>
            )}
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          {onBack && (
            <button className="px-6 py-2 bg-[#232946] text-white rounded shadow hover:bg-[#181c23]" onClick={onBack}>
              Previous
            </button>
          )}
          <button className="px-6 py-2 bg-[#183153] text-white rounded shadow-md hover:bg-[#102040]">Save Settings</button>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default CalibrationScaffoldUI; 