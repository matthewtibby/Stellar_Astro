import React, { useState, useRef, useEffect } from 'react';
import { Info, Loader2, CheckCircle2, XCircle, RefreshCw, Star, Moon, Sun, Zap, BarChart3 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { supabase } from '../lib/supabaseClient';
import Image from 'next/image';

const FRAME_TYPES = [
  { key: 'bias', label: 'Master Bias' },
  { key: 'dark', label: 'Master Dark' },
  { key: 'flat', label: 'Master Flat' },
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

const COSMETIC_METHODS = [
  { value: 'hot_pixel_map', label: 'Hot Pixel Map' },
  { value: 'la_cosmic', label: 'L.A.Cosmic' },
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

// Example bucket and path logic (replace with real project/user logic as needed)
const SUPABASE_INPUT_BUCKET = 'raw-frames';
const SUPABASE_OUTPUT_BUCKET = 'calibrated-frames';

function getProgressMessage(progress: number) {
  if (progress < 20) return "Preparing and downloading frames...";
  if (progress < 40) return "Reviewing and analyzing frames...";
  if (progress < 60) return "Calibrating and stacking frames...";
  if (progress < 75) return "Creating master dark...";
  if (progress < 95) return "Uploading results to database...";
  if (progress < 100) return "Loading preview...";
  return "Calibration complete!";
}

const CalibrationScaffoldUI: React.FC<{ projectId: string, userId: string }> = ({ projectId, userId }) => {
  const [selectedType, setSelectedType] = useState<MasterType>('bias');
  const [tabState, setTabState] = useState({
    dark: {
      advanced: false,
      stackingMethod: 'median',
      sigmaThreshold: '3.0',
      darkScaling: false,
      darkScalingAuto: true,
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
  const [recommendationDialog, setRecommendationDialog] = useState<null | {
    recommendation: { method: string; sigma?: number; reason: string };
    userMethod: string;
    userSigma?: number;
    onAccept: () => void;
    onDecline: () => void;
  }>(null);
  const [previewUrls, setPreviewUrls] = useState<{ [K in MasterType]?: string | null }>({});
  const [previewLoadings, setPreviewLoadings] = useState<{ [K in MasterType]?: boolean }>({});
  const [realFiles, setRealFiles] = useState<string[]>([]);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [masterBiasOptions, setMasterBiasOptions] = useState<{ path: string, name: string }[]>([]);
  const [selectedMasterBias, setSelectedMasterBias] = useState<string>('');
  const [laCosmicParams, setLaCosmicParams] = useState({
    sigclip: 4.5,
    readnoise: 6.5,
    gain: 1.0,
    satlevel: 65535,
    niter: 4,
  });
  // Track which parameters are auto-populated
  const [autoPopulated, setAutoPopulated] = useState<{ readnoise?: boolean; gain?: boolean; satlevel?: boolean }>({});
  const [lastAutoPopulated, setLastAutoPopulated] = useState<{ readnoise?: number; gain?: number; satlevel?: number }>({});
  const [lastMeta, setLastMeta] = useState<any>(null);

  // Add a warning if userId is undefined
  useEffect(() => {
    if (!userId) {
      console.warn('CalibrationScaffoldUI: userId is undefined! The parent component must pass a valid userId prop.');
    }
  }, [userId]);

  // Fetch real files from Supabase when selectedType or projectId or userId changes
  useEffect(() => {
    const fetchFiles = async () => {
      const folderPath = `${userId}/${projectId}/${selectedType}/`;
      console.log('Supabase list:', folderPath);
      if (!userId) {
        setRealFiles([]);
        return;
      }
      const { data, error } = await supabase.storage.from('raw-frames').list(folderPath);
      console.log('Supabase list result:', data, error);
      if (error) {
        setRealFiles([]);
        return;
      }
      setRealFiles((data || []).filter(f => !f.name.endsWith('/')).map(f => f.name));
    };
    fetchFiles();
  }, [selectedType, projectId, userId]);

  // Auto-populate L.A.Cosmic params from FITS metadata
  useEffect(() => {
    async function fetchAndSetLaCosmicParams() {
      if (selectedType !== 'bias' || !realFiles.length) return;
      const filePath = `${userId}/${projectId}/${selectedType}/${realFiles[0]}`;
      const { data, error } = await supabase
        .from('fits_metadata')
        .select('metadata')
        .eq('file_path', filePath)
        .single();
      // Add logging for debugging
      console.log('[LACOSMIC] fits_metadata API response:', { data, error, filePath });
      if (!error && data && data.metadata) {
        const meta = data.metadata;
        setLastMeta(meta);
        setLaCosmicParams(prev => {
          const newParams = { ...prev };
          const auto: typeof autoPopulated = {};
          if (meta.readnoise !== undefined && meta.readnoise !== prev.readnoise) {
            newParams.readnoise = meta.readnoise;
            auto.readnoise = true;
          }
          if (meta.gain !== undefined && meta.gain !== prev.gain) {
            newParams.gain = meta.gain;
            auto.gain = true;
          }
          if (meta.satlevel !== undefined && meta.satlevel !== prev.satlevel) {
            newParams.satlevel = meta.satlevel;
            auto.satlevel = true;
          }
          setAutoPopulated(auto);
          setLastAutoPopulated({
            readnoise: meta.readnoise,
            gain: meta.gain,
            satlevel: meta.satlevel,
          });
          return newParams;
        });
      }
    }
    fetchAndSetLaCosmicParams();
  }, [realFiles, selectedType, projectId, userId]);

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
  const filteredFiles = realFiles.filter(f => f.toLowerCase().includes(fileSearch.toLowerCase()));

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
      darkScalingAuto: true,
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

  // Helper to submit calibration job
  const submitCalibrationJob = async (settings: any) => {
    setJobProgress(0);
    setJobStatus('queued');
    try {
      // Use real files if available, else fallback to placeholder
      const input_paths = realFiles
        .filter(f => f.toLowerCase().endsWith('.fit') || f.toLowerCase().endsWith('.fits'))
        .map(f => `${userId}/${projectId}/${selectedType}/${f}`);
      const output_base = `${userId}/${projectId}/${selectedType}/master_${selectedType}`;
      // For darks, also gather light frame paths for scaling
      let light_input_paths: string[] | undefined = undefined;
      if (selectedType === 'dark') {
        // Try to list light frames in the same project/user
        // (Assume the same naming convention as realFiles, but for 'light')
        const lightFolder = `${userId}/${projectId}/light/`;
        const { data: lightData, error: lightError } = await supabase.storage.from('raw-frames').list(lightFolder);
        if (!lightError && lightData) {
          light_input_paths = lightData
            .filter(f => f.name.toLowerCase().endsWith('.fit') || f.name.toLowerCase().endsWith('.fits'))
            .map(f => `${userId}/${projectId}/light/${f.name}`);
        }
      }
      const reqBody = {
        input_bucket: SUPABASE_INPUT_BUCKET,
        input_paths,
        ...(light_input_paths ? { light_input_paths } : {}),
        output_bucket: SUPABASE_OUTPUT_BUCKET,
        output_base,
        advanced_settings: settings.advanced_settings,
        projectId,
        userId,
        // ...add other required fields
      };
      const res = await fetch(`/api/projects/${projectId}/calibration-jobs/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      const data = await res.json();
      setJobId(data.jobId || null);
      setJobStatus('queued');
      // Do not set previewUrl or jobStatus to 'success' here; let polling handle it
    } catch (e) {
      setJobStatus('failed');
    }
  };

  // Update handleCreateMaster to use the new API logic
  const handleCreateMaster = () => {
    // Gather settings for API
    const settings = {
      input_light_ids: PLACEHOLDER_FILES[selectedType],
      advanced_settings: {
        stackingMethod: currentTab.stackingMethod,
        sigmaThreshold: currentTab.sigmaThreshold,
        // ...add other advanced settings as needed
        ...(selectedType === 'dark'
          ? (() => {
              const darkTab = currentTab as typeof tabState['dark'];
              return {
                darkScaling: darkTab.darkScaling,
                darkScalingAuto: darkTab.darkScalingAuto,
                darkScalingFactor: darkTab.darkScalingFactor,
                biasSubtraction: darkTab.biasSubtraction,
                ...(darkTab.biasSubtraction && selectedMasterBias
                  ? { masterBiasPath: selectedMasterBias }
                  : {}),
              };
            })()
          : {}),
      },
      projectId,
      userId,
      // ...add other required fields
    };
    submitCalibrationJob(settings);
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

  // Poll job progress when running/queued
  useEffect(() => {
    if ((jobStatus === 'queued' || jobStatus === 'running') && jobId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/projects/${projectId}/calibration-jobs/progress?jobId=${jobId}`);
          const data = await res.json();
          console.log('[Polling] Progress API response:', data);
          if (typeof data.progress === 'number') {
            setJobProgress(data.progress);
          }
          if (data.status === 'running' && jobStatus !== 'running') {
            setJobStatus('running');
          }
          if (data.status === 'success' || data.status === 'complete') {
            setJobStatus('success');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2500);
            clearInterval(interval);
          }
          if (data.status === 'failed') {
            setJobStatus('failed');
            clearInterval(interval);
          }
        } catch (e) {
          console.error('[Polling] Error fetching progress:', e);
        }
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setJobProgress(0);
    }
  }, [jobStatus, jobId, projectId]);

  useEffect(() => {
    if (jobStatus === 'success' && jobId) {
      let isMounted = true;
      setPreviewLoadings(prev => ({ ...prev, [selectedType]: true }));
      const fetchResults = async () => {
        const res = await fetch(`/api/projects/${projectId}/calibration-jobs/results?jobId=${jobId}`);
        console.log('[Preview] Results API response:', res);
        if (res.status === 202) {
          console.log('[Preview] Job not complete, retrying fetchResults in 2s');
          setTimeout(fetchResults, 2000);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          console.log('[Preview] Results data:', data);
          if (isMounted && data.results?.preview_url) {
            setPreviewUrls(prev => ({ ...prev, [selectedType]: data.results.preview_url }));
            setPreviewLoadings(prev => ({ ...prev, [selectedType]: false }));
            console.log('[Preview] Setting previewUrl:', data.results.preview_url);
            // --- Notification logic for used/rejected frames ---
            if (data.results && (typeof data.results.used === 'number' || typeof data.results.rejected === 'number')) {
              let message = `Calibration complete: ${data.results.used ?? 0} frames used.`;
              if (data.results.rejected > 0) {
                message += ` ${data.results.rejected} frame(s) rejected.`;
                if (Array.isArray(data.results.rejected_details) && data.results.rejected_details.length > 0) {
                  message += '\nReasons:';
                  for (const rej of data.results.rejected_details) {
                    message += `\n- ${rej.file}: ${rej.reason}`;
                  }
                }
              }
              // Send notification to bell
              fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: data.results.rejected > 0 ? 'warning' : 'success',
                  eventType: 'processing_step',
                  message,
                  data: data.results,
                }),
              });
            }
          } else {
            console.log('[Preview] No preview_url found in results:', data.results);
          }
        } else {
          setPreviewLoadings(prev => ({ ...prev, [selectedType]: false }));
          console.error('[Preview] Results API not ok:', res.status);
        }
      };
      fetchResults();
      return () => { isMounted = false; };
    }
  }, [jobStatus, jobId, projectId, selectedType]);

  useEffect(() => {
    if (previewUrls[selectedType]) {
      console.log('[Preview] Preview URL set:', previewUrls[selectedType]);
    } else {
      console.log('[Preview] Preview URL is null or empty');
    }
  }, [previewUrls, selectedType]);

  // Fetch master bias frames when Master Dark tab is active and bias subtraction is enabled
  useEffect(() => {
    async function fetchMasterBiases() {
      if (selectedType === 'dark' && tabState.dark.biasSubtraction) {
        const prefix = `${userId}/${projectId}/master-bias/`;
        const { data, error } = await supabase.storage.from('raw-frames').list(prefix);
        if (!error && data) {
          const fits = data.filter((f: any) => f.name.toLowerCase().endsWith('.fits') || f.name.toLowerCase().endsWith('.fit'));
          setMasterBiasOptions(fits.map((f: any) => ({ path: prefix + f.name, name: f.name })));
        } else {
          setMasterBiasOptions([]);
        }
      } else {
        setMasterBiasOptions([]);
      }
    }
    fetchMasterBiases();
  }, [selectedType, tabState.dark.biasSubtraction, projectId, userId]);

  // Handler for user changing a parameter (removes auto badge)
  const handleLaCosmicParamChange = (key: keyof typeof laCosmicParams, value: number) => {
    setLaCosmicParams(prev => ({ ...prev, [key]: value }));
    setAutoPopulated(prev => ({ ...prev, [key]: false }));
  };

  // Handler to reset all params to last auto-populated values
  const handleResetToMetadata = () => {
    if (!lastMeta) return;
    setLaCosmicParams(prev => ({
      ...prev,
      readnoise: lastMeta.readnoise ?? prev.readnoise,
      gain: lastMeta.gain ?? prev.gain,
      satlevel: lastMeta.satlevel ?? prev.satlevel,
    }));
    setAutoPopulated({
      readnoise: lastMeta.readnoise !== undefined,
      gain: lastMeta.gain !== undefined,
      satlevel: lastMeta.satlevel !== undefined,
    });
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-[#0a0d13]/80 rounded-2xl shadow-2xl border border-[#232946]/60 p-6 backdrop-blur-md">
        {/* Success Toast/Banner with Confetti */}
        {showSuccess && (
          <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in relative">
            <CheckCircle2 className="w-5 h-5 animate-bounce" /> Master frame created successfully!
            <Confetti />
          </div>
        )}
        {/* Preview Loading Spinner/Message */}
        {previewLoadings[selectedType] && (
          <div className="flex items-center gap-2 mt-4 text-blue-500">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
            <span>Generating preview...</span>
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
        <div className="flex gap-2 mb-4 flex-wrap">
          {FRAME_TYPES.map(ft => (
            <button
              key={ft.key}
              onClick={() => setSelectedType(ft.key as MasterType)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold text-base transition-all border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0d13] shadow-sm ${selectedType === ft.key ? 'bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 text-white shadow-lg' : 'bg-[#10131a] text-blue-200 hover:bg-[#181c23]'}`}
              style={{ position: 'relative', minWidth: '120px', transition: 'background 0.3s, color 0.3s, box-shadow 0.3s' }}
            >
              <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${STATUS_COLORS[MASTER_STATUS[ft.key as MasterType]]}`}></span>
              <span className="ml-4 flex items-center gap-1">
                {FRAME_TYPE_ICONS[ft.key as MasterType]}
                <span className="drop-shadow font-bold text-base tracking-tight">{ft.label}</span>
              </span>
              <span className={`ml-1 text-xs ${selectedType === ft.key ? 'text-white' : 'text-blue-300'}`}>{STATUS_LABELS[MASTER_STATUS[ft.key as MasterType]]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-row gap-6 w-full transition-all duration-500 animate-fade-in">
          {/* Center: Files and Settings for Selected Type */}
          <div className="w-2/5 bg-[#10131a]/90 rounded-2xl p-6 border border-[#232946]/60 flex flex-col shadow-xl relative">
            {/* Header row: title left, status chip right */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {FRAME_TYPE_ICONS[selectedType]}
                <h3 className="text-lg font-bold text-white tracking-tight drop-shadow">{FRAME_TYPES.find(f => f.key === selectedType)?.label} Calibration</h3>
                <span className="ml-2 px-2 py-1 rounded-full bg-green-900 text-green-300 text-xs font-semibold flex items-center gap-1 shadow">
                  <CheckCircle2 className="w-3 h-3" /> {STATUS_LABELS[MASTER_STATUS[selectedType]]}
                </span>
              </div>
            </div>
            {/* Files for selected type */}
            <div className="mb-8">
              <div className="flex items-center mb-2">
                <span className="font-medium text-blue-200 mr-2">{realFiles.length} files</span>
                <button
                  className="ml-auto text-xs text-blue-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  onClick={() => setShowFileModal(true)}
                  aria-label={`View all ${FRAME_TYPES.find(f => f.key === selectedType)?.label} files`}
                >
                  View All
                </button>
              </div>
              {realFiles.length === 0 ? (
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
                  {realFiles.slice(0, 3).map((file, idx) => (
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
                  {realFiles.length > 3 && (
                    <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-xs text-blue-200 border border-[#232946]/60 shadow">
                      +{realFiles.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Divider */}
            <div className="h-px bg-[#232946]/40 mb-8" />
            {/* Calibration Settings */}
            <div className="flex flex-col gap-6">
              {/* Master Bias Tab */}
              {selectedType === 'bias' && (
                <>
                  {/* Beginner/Advanced toggle for Bias */}
                  <div className="flex items-center mb-4 gap-4">
                    <span className="font-medium text-blue-200">Beginner</span>
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={tabState.bias.advanced} onChange={e => setTabState(prev => ({ ...prev, bias: { ...prev.bias, advanced: e.target.checked } }))} />
                      <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-all flex items-center justify-start peer-checked:justify-end">
                        {!tabState.bias.advanced && <span className="w-3 h-3 bg-white rounded-full ml-1" />}
                        {tabState.bias.advanced && <span className="w-3 h-3 bg-blue-300 rounded-full mr-1" />}
                      </div>
                    </label>
                    <span className="font-medium text-blue-200">Advanced</span>
                  </div>
                  {/* Beginner mode: only show stacking method (Median, Mean) */}
                  {!tabState.bias.advanced && (
                    <div className="mb-4">
                      <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
                      <div className="flex flex-col gap-2">
                        {BASIC_STACKING_METHODS.map(m => (
                          <label key={m.value} className="flex items-center gap-2 text-blue-200">
                            <input
                              type="radio"
                              name="biasStackingMethod"
                              value={m.value}
                              checked={tabState.bias.stackingMethod === m.value}
                              onChange={() => setTabState(prev => ({
                                ...prev,
                                bias: {
                                  ...prev.bias,
                                  stackingMethod: m.value,
                                }
                              }))}
                              className="accent-blue-600"
                            />
                            <span>{m.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Advanced mode: all stacking methods, cosmetic correction, custom rejection */}
                  {tabState.bias.advanced && (
                    <>
                      <div className="mb-4">
                        <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
                        <div className="flex flex-col gap-2">
                          {ADVANCED_DARK_STACKING_METHODS.map(m => (
                            <label key={m.value} className="flex items-center gap-2 text-blue-200">
                              <input
                                type="radio"
                                name="biasStackingMethod"
                                value={m.value}
                                checked={tabState.bias.stackingMethod === m.value}
                                onChange={() => setTabState(prev => ({
                                  ...prev,
                                  bias: {
                                    ...prev.bias,
                                    stackingMethod: m.value,
                                  }
                                }))}
                                className="accent-blue-600"
                              />
                              <span>{m.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {/* Cosmetic Correction (optional) */}
                      <div className="mb-4 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="cosmeticCorrectionBias"
                          checked={tabState.bias.cosmeticCorrection}
                          onChange={e => setTabState(prev => ({ ...prev, bias: { ...prev.bias, cosmeticCorrection: e.target.checked } }))}
                          className="mr-2 accent-blue-600"
                        />
                        <label htmlFor="cosmeticCorrectionBias" className="font-medium text-blue-100 flex items-center gap-2">
                          Cosmetic Correction
                        </label>
                      </div>
                      {tabState.bias.cosmeticCorrection && (
                        <div className="mb-4">
                          <label className="block font-medium mb-1 text-blue-100">Correction Method</label>
                          <select
                            className="bg-[#181c23] text-white border border-[#232946] rounded px-3 py-2 mt-1"
                            value={tabState.bias.cosmeticMethod}
                            onChange={e => setTabState(prev => ({ ...prev, bias: { ...prev.bias, cosmeticMethod: e.target.value } }))}
                          >
                            {COSMETIC_METHODS.map((m: { value: string; label: string }) => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                          <div className="mt-4">
                            <label className="block font-medium mb-1 text-blue-100">Threshold</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={tabState.bias.cosmeticThreshold}
                              onChange={e => setTabState(prev => ({ ...prev, bias: { ...prev.bias, cosmeticThreshold: Number(e.target.value) } }))}
                              className="w-40 accent-blue-600"
                            />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1"
                              value={tabState.bias.cosmeticThreshold}
                              onChange={e => setTabState(prev => ({ ...prev, bias: { ...prev.bias, cosmeticThreshold: Number(e.target.value) } }))}
                              className="border rounded px-2 py-1 w-20 bg-[#181c23] text-white border-[#232946] ml-2"
                            />
                          </div>
                        </div>
                      )}
                      {/* Custom Rejection Expression (optional) */}
                      <div className="mb-4">
                        <label className="block font-medium mb-1 text-blue-100">Custom Rejection Expression</label>
                        <input
                          type="text"
                          className="border rounded px-3 py-2 w-full bg-[#181c23] text-white border-[#232946]"
                          value={tabState.bias.customRejection}
                          onChange={e => setTabState(prev => ({ ...prev, bias: { ...prev.bias, customRejection: e.target.value } }))}
                          placeholder="e.g. value > 5000"
                        />
                      </div>
                      {/* LA Cosmic parameters */}
                      {selectedType === 'bias' && tabState.bias.cosmeticMethod === 'la_cosmic' && (
                        <div className="bg-[#232946] rounded-lg p-4 mb-4 border border-blue-900 shadow max-w-lg">
                          {/* Info banner if any param is auto-populated */}
                          {Object.values(autoPopulated).some(Boolean) && (
                            <div className="mb-3 p-2 bg-blue-900/70 border border-blue-500/30 rounded text-blue-100 text-sm flex items-center gap-2">
                              <Info className="w-4 h-4 text-blue-300" />
                              Some parameters have been pre-filled from your frame metadata. You can adjust them if needed.
                              <button onClick={handleResetToMetadata} className="ml-auto px-2 py-1 text-xs bg-blue-800 hover:bg-blue-700 rounded text-blue-100 border border-blue-600">Reset to Metadata</button>
                            </div>
                          )}
                          <div className="flex flex-col gap-3">
                            <div>
                              <label className="block text-blue-200 text-sm mb-1">Sigma Clip (sigclip)</label>
                              <input type="number" step="0.1" min="1" max="10" value={laCosmicParams.sigclip} onChange={e => handleLaCosmicParamChange('sigclip', parseFloat(e.target.value))} className="input bg-[#2a2e3a] text-blue-100 border-blue-700" />
                            </div>
                            <div>
                              <label className="block text-blue-200 text-sm mb-1 flex items-center gap-1">Read Noise (e-) (readnoise) {autoPopulated.readnoise && <TooltipProvider><Tooltip><TooltipTrigger><span className="ml-1 px-1 py-0.5 text-[10px] bg-blue-700 text-blue-100 rounded">auto</span></TooltipTrigger><TooltipContent>Auto-filled from FITS metadata</TooltipContent></Tooltip></TooltipProvider>}</label>
                              <input type="number" step="0.1" min="0" value={laCosmicParams.readnoise} onChange={e => handleLaCosmicParamChange('readnoise', parseFloat(e.target.value))} className="input bg-[#2a2e3a] text-blue-100 border-blue-700" />
                              <span className="text-xs text-blue-300">Camera read noise in electrons</span>
                            </div>
                            <div>
                              <label className="block text-blue-200 text-sm mb-1 flex items-center gap-1">Gain (e-/ADU) (gain) {autoPopulated.gain && <TooltipProvider><Tooltip><TooltipTrigger><span className="ml-1 px-1 py-0.5 text-[10px] bg-blue-700 text-blue-100 rounded">auto</span></TooltipTrigger><TooltipContent>Auto-filled from FITS metadata</TooltipContent></Tooltip></TooltipProvider>}</label>
                              <input type="number" step="0.01" min="0.01" value={laCosmicParams.gain} onChange={e => handleLaCosmicParamChange('gain', parseFloat(e.target.value))} className="input bg-[#2a2e3a] text-blue-100 border-blue-700" />
                              <span className="text-xs text-blue-300">Electrons per ADU (camera gain)</span>
                            </div>
                            <div>
                              <label className="block text-blue-200 text-sm mb-1 flex items-center gap-1">Saturation Level (satlevel) {autoPopulated.satlevel && <TooltipProvider><Tooltip><TooltipTrigger><span className="ml-1 px-1 py-0.5 text-[10px] bg-blue-700 text-blue-100 rounded">auto</span></TooltipTrigger><TooltipContent>Auto-filled from FITS metadata</TooltipContent></Tooltip></TooltipProvider>}</label>
                              <input type="number" step="1" min="1000" value={laCosmicParams.satlevel} onChange={e => handleLaCosmicParamChange('satlevel', parseInt(e.target.value))} className="input bg-[#2a2e3a] text-blue-100 border-blue-700" />
                              <span className="text-xs text-blue-300">Pixel value above which is considered saturated</span>
                            </div>
                            <div>
                              <label className="block text-blue-200 text-sm mb-1">Iterations (niter)</label>
                              <input type="number" step="1" min="1" max="10" value={laCosmicParams.niter} onChange={e => handleLaCosmicParamChange('niter', parseInt(e.target.value))} className="input bg-[#2a2e3a] text-blue-100 border-blue-700" />
                              <span className="text-xs text-blue-300">Number of times to run the algorithm</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
              {/* Master Dark Tab */}
              {selectedType === 'dark' && (
                <>
                  {/* Beginner/Advanced toggle for Dark */}
                  <div className="flex items-center mb-4 gap-4">
                    <span className="font-medium text-blue-200">Beginner</span>
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={tabState.dark.advanced} onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, advanced: e.target.checked } }))} />
                      <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-all flex items-center justify-start peer-checked:justify-end">
                        {!tabState.dark.advanced && <span className="w-3 h-3 bg-white rounded-full ml-1" />}
                        {tabState.dark.advanced && <span className="w-3 h-3 bg-blue-300 rounded-full mr-1" />}
                      </div>
                    </label>
                    <span className="font-medium text-blue-200">Advanced</span>
                  </div>
                  {/* Beginner mode: only show stacking method (Median, Mean) */}
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
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Advanced mode: all dark options */}
                  {tabState.dark.advanced && (
                    <>
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
                            </label>
                          ))}
                        </div>
                      </div>
                      {/* Sigma/Kappa Threshold for advanced methods */}
                      {(tabState.dark.stackingMethod === 'sigma' || tabState.dark.stackingMethod === 'winsorized' || tabState.dark.stackingMethod === 'linear_fit') && (
                        <div className="mb-4">
                          <label className="block font-medium mb-1 text-blue-100">Sigma/Kappa Threshold</label>
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
                            className="border rounded px-2 py-1 w-20 bg-[#181c23] text-white border-[#232946] ml-2"
                          />
                        </div>
                      )}
                      {/* Dark Frame Scaling */}
                      <div className="mb-4">
                        <label className="block font-medium mb-1 text-blue-100">Dark Frame Scaling</label>
                        <input type="checkbox" checked={tabState.dark.darkScaling} onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, darkScaling: e.target.checked } }))} className="accent-blue-600" /> Enable
                        {tabState.dark.darkScaling && (
                          <>
                            <input
                              type="number"
                              step="0.01"
                              min="0.5"
                              max="2.0"
                              value={tabState.dark.darkScalingFactor ?? 1.0}
                              onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, darkScalingFactor: Number(e.target.value) } }))}
                              className="border rounded px-2 py-1 w-24 bg-[#181c23] text-white border-[#232946] ml-2"
                              disabled={tabState.dark.darkScalingAuto}
                            />
                            <input
                              type="checkbox"
                              checked={tabState.dark.darkScalingAuto}
                              onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, darkScalingAuto: e.target.checked } }))}
                              className="accent-blue-600 ml-2"
                            /> Auto
                          </>
                        )}
                      </div>
                      {/* Bias Subtraction */}
                      <div className="mb-4">
                        <label className="block font-medium mb-1 text-blue-100">Bias Subtraction</label>
                        <input type="checkbox" checked={tabState.dark.biasSubtraction} onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, biasSubtraction: e.target.checked } }))} className="accent-blue-600" /> Enable
                        {tabState.dark.biasSubtraction && (
                          <div className="mt-2">
                            <label className="block text-blue-100 mb-1">Select Master Bias (optional)</label>
                            <select
                              className="bg-[#181c23] text-white border border-[#232946] rounded px-3 py-2 mt-1 w-full"
                              value={selectedMasterBias}
                              onChange={e => setSelectedMasterBias(e.target.value)}
                            >
                              <option value="">Auto-select (recommended)</option>
                              {masterBiasOptions.map(opt => (
                                <option key={opt.path} value={opt.path}>{opt.name}</option>
                              ))}
                            </select>
                            {masterBiasOptions.length === 0 && <div className="text-xs text-blue-300 mt-1">No master bias frames found for this project. Auto-select will fail if none exist.</div>}
                          </div>
                        )}
                      </div>
                      {/* Amp Glow Suppression */}
                      <div className="mb-4">
                        <label className="block font-medium mb-1 text-blue-100">Amp Glow Suppression</label>
                        <input type="checkbox" checked={tabState.dark.ampGlowSuppression} onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, ampGlowSuppression: e.target.checked } }))} className="accent-blue-600" /> Enable
                      </div>
                      {/* Temperature Matching */}
                      <div className="mb-4">
                        <label className="block font-medium mb-1 text-blue-100">Temperature Matching</label>
                        <input type="checkbox" checked={tabState.dark.tempMatching} onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, tempMatching: e.target.checked } }))} className="accent-blue-600" /> Enable
                      </div>
                      {/* Exposure Time Matching */}
                      <div className="mb-4">
                        <label className="block font-medium mb-1 text-blue-100">Exposure Time Matching</label>
                        <input type="checkbox" checked={tabState.dark.exposureMatching} onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, exposureMatching: e.target.checked } }))} className="accent-blue-600" /> Enable
                      </div>
                      {/* Cosmetic Correction */}
                      <div className="mb-4 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="cosmeticCorrectionDark"
                          checked={tabState.dark.cosmeticCorrection}
                          onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, cosmeticCorrection: e.target.checked } }))}
                          className="mr-2 accent-blue-600"
                        />
                        <label htmlFor="cosmeticCorrectionDark" className="font-medium text-blue-100 flex items-center gap-2">
                          Cosmetic Correction
                        </label>
                      </div>
                      {tabState.dark.cosmeticCorrection && (
                        <div className="mb-4">
                          <label className="block font-medium mb-1 text-blue-100">Correction Method</label>
                          <select
                            className="bg-[#181c23] text-white border border-[#232946] rounded px-3 py-2 mt-1"
                            value={tabState.dark.cosmeticMethod}
                            onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, cosmeticMethod: e.target.value } }))}
                          >
                            {COSMETIC_METHODS.map((m: { value: string; label: string }) => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                          <div className="mt-4">
                            <label className="block font-medium mb-1 text-blue-100">Threshold</label>
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
                        <label className="block font-medium mb-1 text-blue-100">Custom Rejection Expression</label>
                        <input
                          type="text"
                          className="border rounded px-3 py-2 w-full bg-[#181c23] text-white border-[#232946]"
                          value={tabState.dark.customRejection}
                          onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, customRejection: e.target.value } }))}
                          placeholder="e.g. value > 5000"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
              {/* Master Flat Tab */}
              {selectedType === 'flat' && (
                <>
                  {/* Beginner/Advanced toggle for Flat */}
                  <div className="flex items-center mb-4 gap-4">
                    <span className="font-medium text-blue-200">Beginner</span>
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={tabState.flat.advanced} onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, advanced: e.target.checked } }))} />
                      <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-all flex items-center justify-start peer-checked:justify-end">
                        {!tabState.flat.advanced && <span className="w-3 h-3 bg-white rounded-full ml-1" />}
                        {tabState.flat.advanced && <span className="w-3 h-3 bg-blue-300 rounded-full mr-1" />}
                      </div>
                    </label>
                    <span className="font-medium text-blue-200">Advanced</span>
                  </div>
                  {/* Beginner mode: only show stacking method (Median, Mean) */}
                  {!tabState.flat.advanced && (
                    <div className="mb-4">
                      <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
                      <div className="flex flex-col gap-2">
                        {BASIC_STACKING_METHODS.map(m => (
                          <label key={m.value} className="flex items-center gap-2 text-blue-200">
                            <input
                              type="radio"
                              name="flatStackingMethod"
                              value={m.value}
                              checked={tabState.flat.stackingMethod === m.value}
                              onChange={() => setTabState(prev => ({
                                ...prev,
                                flat: {
                                  ...prev.flat,
                                  stackingMethod: m.value,
                                }
                              }))}
                              className="accent-blue-600"
                            />
                            <span>{m.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Advanced mode: all flat options */}
                  {tabState.flat.advanced && (
                    <>
                      <div className="mb-4">
                        <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
                        <div className="flex flex-col gap-2">
                          {ADVANCED_DARK_STACKING_METHODS.map(m => (
                            <label key={m.value} className="flex items-center gap-2 text-blue-200">
                              <input
                                type="radio"
                                name="flatStackingMethod"
                                value={m.value}
                                checked={tabState.flat.stackingMethod === m.value}
                                onChange={() => setTabState(prev => ({
                                  ...prev,
                                  flat: {
                                    ...prev.flat,
                                    stackingMethod: m.value,
                                  }
                                }))}
                                className="accent-blue-600"
                              />
                              <span>{m.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {/* Cosmetic Correction (optional) */}
                      <div className="mb-4 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="cosmeticCorrectionFlat"
                          checked={tabState.flat.cosmeticCorrection}
                          onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, cosmeticCorrection: e.target.checked } }))}
                          className="mr-2 accent-blue-600"
                        />
                        <label htmlFor="cosmeticCorrectionFlat" className="font-medium text-blue-100 flex items-center gap-2">
                          Cosmetic Correction
                        </label>
                      </div>
                      {tabState.flat.cosmeticCorrection && (
                        <div className="mb-4">
                          <label className="block font-medium mb-1 text-blue-100">Correction Method</label>
                          <select
                            className="bg-[#181c23] text-white border border-[#232946] rounded px-3 py-2 mt-1"
                            value={tabState.flat.cosmeticMethod}
                            onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, cosmeticMethod: e.target.value } }))}
                          >
                            {COSMETIC_METHODS.map((m: { value: string; label: string }) => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                          <div className="mt-4">
                            <label className="block font-medium mb-1 text-blue-100">Threshold</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={tabState.flat.cosmeticThreshold}
                              onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, cosmeticThreshold: Number(e.target.value) } }))}
                              className="w-40 accent-blue-600"
                            />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1"
                              value={tabState.flat.cosmeticThreshold}
                              onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, cosmeticThreshold: Number(e.target.value) } }))}
                              className="border rounded px-2 py-1 w-20 bg-[#181c23] text-white border-[#232946] ml-2"
                            />
                          </div>
                        </div>
                      )}
                      {/* Custom Rejection Expression */}
                      <div className="mb-4">
                        <label className="block font-medium mb-1 text-blue-100">Custom Rejection Expression</label>
                        <input
                          type="text"
                          className="border rounded px-3 py-2 w-full bg-[#181c23] text-white border-[#232946]"
                          value={tabState.flat.customRejection}
                          onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, customRejection: e.target.value } }))}
                          placeholder="e.g. value > 5000"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            {/* Create Master Button with extra margin */}
            <button
              ref={actionBtnRef}
              className="mt-8 mb-4 px-6 py-3 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 text-white rounded-xl shadow-lg hover:from-blue-800 hover:to-blue-900 font-semibold text-lg w-full transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 overflow-hidden relative"
              onClick={handleCreateMasterWithRipple}
              disabled={jobStatus === 'queued' || jobStatus === 'running' || realFiles.length === 0}
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
            {/* Progress Bar for Calibration Job */}
            {(jobStatus === 'queued' || jobStatus === 'running') && (
              <div className="w-full mt-2 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-blue-200">Calibration Progress</span>
                  <span className="text-xs text-blue-300">{jobProgress}%</span>
                </div>
                {/* Progress status message */}
                <div className="mb-1">
                  <span className="text-xs text-blue-400 font-medium">{getProgressMessage(jobProgress)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded h-2">
                  <div
                    className="h-2 rounded bg-blue-500 transition-all duration-500"
                    style={{ width: `${jobProgress}%` }}
                  />
                </div>
              </div>
            )}
            {realFiles.length === 0 && (
              <div className="text-red-400 mt-2 text-center">
                No files found in <code>{`raw-frames/${userId}/${projectId}/${selectedType}/`}</code>. Please upload files to proceed.
              </div>
            )}
            {/* Icon Button Group (below primary action) */}
            <div className="flex gap-2 justify-center mt-4 mb-4 bg-[#181c23] rounded-full px-2 py-1 shadow border border-[#232946]/60">
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
          <div className="w-3/5 bg-[#10131a] rounded-2xl p-10 border border-[#232946]/60 flex flex-col items-center shadow-xl h-full">
            <h3 className="text-xl font-bold mb-6 text-white">{FRAME_TYPES.find(f => f.key === selectedType)?.label} Preview</h3>
            <div className="w-full h-96 bg-[#232946] rounded-2xl flex items-center justify-center text-3xl text-blue-200 border-2 border-[#232946] mb-10 shadow-lg">
              {previewLoadings[selectedType] ? (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
                  <p className="text-blue-200 text-lg">Loading preview...</p>
                </div>
              ) : previewUrls[selectedType] ? (
                <Image
                  src={previewUrls[selectedType] as string}
                  alt={`${FRAME_TYPES.find(f => f.key === selectedType)?.label} Preview`}
                  className="w-full h-full object-contain rounded-2xl"
                  style={{ background: '#232946' }}
                  width={384}
                  height={384}
                  onLoad={() => setPreviewLoadings(prev => ({ ...prev, [selectedType]: false }))}
                  onError={e => {
                    console.error('Image failed to load:', previewUrls[selectedType], e);
                    setPreviewUrls(prev => ({ ...prev, [selectedType]: null }));
                    setPreviewLoadings(prev => ({ ...prev, [selectedType]: false }));
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center animate-pulse">
                  <div className="w-1/2 h-1/2 bg-blue-900/30 rounded-2xl" />
                  <span className="mt-4 text-blue-400">No preview available</span>
                </div>
              )}
            </div>
            {/* Remove the Show Histogram button and replace with an icon */}
            <div className="mb-8 flex items-center justify-center w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-3 rounded-full bg-gray-800 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    onClick={() => setShowHistogram(v => !v)}
                    aria-label="Show Histogram"
                  >
                    <BarChart3 className="w-7 h-7 text-blue-200" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {histogramInfo[selectedType]}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button className="px-6 py-2 bg-[#232946] text-white rounded shadow hover:bg-[#181c23]">Back</button>
          <button className="px-6 py-2 bg-[#183153] text-white rounded shadow-md hover:bg-[#102040]">Save Settings</button>
        </div>
        {recommendationDialog && (
          <Dialog open onOpenChange={open => !open && setRecommendationDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Stellar Astro Recommendation</DialogTitle>
                <DialogDescription>
                  We analyzed your frames and recommend using <b>{recommendationDialog.recommendation.method}</b>
                  {recommendationDialog.recommendation.sigma && <> (sigma={recommendationDialog.recommendation.sigma})</>}
                  instead of your choice (<b>{recommendationDialog.userMethod}</b>
                  {recommendationDialog.userSigma && <> (sigma={recommendationDialog.userSigma})</>}).<br />
                  <span className="block mt-2 text-blue-400">{recommendationDialog.recommendation.reason}</span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <button
                  className="px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800"
                  onClick={recommendationDialog.onAccept}
                >
                  Use Recommendation
                </button>
                <button
                  className="px-4 py-2 bg-gray-700 text-white rounded shadow hover:bg-gray-800"
                  onClick={recommendationDialog.onDecline}
                >
                  Proceed with My Choice
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
};

export default CalibrationScaffoldUI; 