import React, { useState, useRef, useEffect } from 'react';
import { Info, Loader2, CheckCircle2, XCircle, RefreshCw, Star, Moon, Sun, Zap, BarChart3, X } from 'lucide-react';
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
import FileManagementPanel from './FileManagementPanel';
import { useProjects } from '@/src/hooks/useProjects';
import { getFilesByType, uploadRawFrame, validateFitsFile } from '@/src/utils/storage';
import { useUserStore } from '@/src/store/user';
import { createBrowserClient } from '@/src/lib/supabase';
import { supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import CreateSuperdarkUI from './CreateSuperdarkUI';
import { useSuperdarks } from '@/src/hooks/useSuperdarks';
import FrameQualityReport from './FrameQualityReport';
import { HistogramAnalysisReport } from './HistogramAnalysisReport';

interface DarkFileWithMetadata {
  name: string;
  path: string;
  project: string;
  projectId: string;
  camera: string;
  binning: string;
  gain: string | number;
  temp: string | number;
  exposure: string | number;
}

// Add type definition at the top of the file
interface FileMetadata {
  path: string;
  type: string;
  metadata: {
    instrument?: string;
    binning?: string;
    gain?: number;
    temperature?: number;
    exposure_time?: number;
    // Keep the old fields for backward compatibility
    INSTRUME?: string;
    XBINNING?: number;
    YBINNING?: number;
    GAIN?: number;
    'CCD-TEMP'?: number;
    EXPTIME?: number;
  };
}

const fetchAllProjectDarks = async (
  projects: { id: string; title: string }[],
  userId: string
): Promise<DarkFileWithMetadata[]> => {
  if (!userId || !projects) return [];

  const allDarks: DarkFileWithMetadata[] = [];
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  for (const project of projects) {
    try {
      const storageFiles = await supabase.storage
        .from('raw-frames')
        .list(`${userId}/${project.id}/dark`);

      if (!storageFiles.data) continue;

      const existingFiles = new Set(storageFiles.data.map((f) => f.name));

      const res = await fetch(
        `http://localhost:8000/list-files?project_id=${project.id}&user_id=${userId}`
      );
      const data = await res.json();

      if (data.files) {
        const darks = data.files
          .filter((f: FileMetadata) => {
            const fileName = f.path.split('/').pop();
            return f.type === 'dark' && existingFiles.has(fileName || '');
          })
          .map(
            (f: FileMetadata): DarkFileWithMetadata => ({
              name: f.path.split('/').pop() || '',
              path: f.path,
              project: project.title,
              projectId: project.id,
              camera: f.metadata?.instrument || f.metadata?.INSTRUME || 'Unknown',
              binning: f.metadata?.binning || `${f.metadata?.XBINNING || 1}x${f.metadata?.YBINNING || 1}`,
              gain: f.metadata?.gain || f.metadata?.GAIN || 'Unknown',
              temp:
                f.metadata?.temperature !== undefined
                  ? Number(f.metadata.temperature).toFixed(1)
                  : f.metadata?.['CCD-TEMP'] !== undefined
                  ? Number(f.metadata['CCD-TEMP']).toFixed(1)
                  : 'Unknown',
              exposure:
                f.metadata?.exposure_time !== undefined
                  ? Number(f.metadata.exposure_time).toFixed(1)
                  : f.metadata?.EXPTIME !== undefined
                  ? Number(f.metadata.EXPTIME).toFixed(1)
                  : 'Unknown',
            })
          );
        allDarks.push(...darks);
      }
    } catch (error) {
      console.error(`Error fetching darks for project ${project.id}:`, error);
    }
  }
  return allDarks;
};

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
  { value: 'adaptive', label: 'Auto-stacking (recommended)' },
  { value: 'median', label: 'Median' },
  { value: 'mean', label: 'Mean' },
  { value: 'sigma', label: 'Kappa-Sigma Clipping' },
  { value: 'percentile_clip', label: 'Percentile Clipping' },
  { value: 'minmax', label: 'MinMax Rejection' },
  { value: 'winsorized', label: 'Winsorized Sigma Clipping' },
  { value: 'linear_fit', label: 'Linear Fit Clipping' },
  { value: 'entropy_weighted', label: 'Entropy-Weighted Averaging' },
];

// Add to ADVANCED_DARK_STACKING_METHODS for bias only
const ADVANCED_BIAS_STACKING_METHODS = [
  { value: 'adaptive', label: 'Auto-stacking (recommended)' },
  { value: 'median', label: 'Median' },
  { value: 'mean', label: 'Mean' },
  { value: 'sigma', label: 'Kappa-Sigma Clipping' },
  { value: 'minmax', label: 'MinMax Rejection' },
  { value: 'superbias', label: 'Superbias (PCA modeling, advanced)' },
];

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
  { 
    value: 'hot_pixel_map', 
    label: 'Hot Pixel Map',
    tooltip: 'Identifies and masks consistently hot pixels by comparing multiple frames. Essential for removing sensor defects.',
    category: 'detection',
    defaultEnabled: true,
    order: 1
  },
  { 
    value: 'la_cosmic_enhanced', 
    label: 'L.A.Cosmic Enhanced',
    tooltip: 'Advanced cosmic ray detection using L.A.Cosmic algorithm with auto-tuning and multi-method support. Removes high-energy particle strikes.',
    category: 'cosmic_rays',
    defaultEnabled: true,
    order: 2
  },
  { 
    value: 'bad_pixel_masking', 
    label: 'Bad Pixel/Column/Row Masking',
    tooltip: 'Masks known bad pixels, columns, and rows based on calibration analysis. Removes systematic sensor defects.',
    category: 'masking',
    defaultEnabled: false,
    order: 3
  },
  { 
    value: 'patterned_noise_removal', 
    label: 'Patterned Noise Removal',
    tooltip: 'Removes systematic noise patterns like banding, fixed pattern noise, and readout artifacts using advanced filtering.',
    category: 'noise',
    defaultEnabled: false,
    order: 4
  },
  { 
    value: 'la_cosmic', 
    label: 'L.A.Cosmic (Basic)',
    tooltip: 'Standard L.A.Cosmic cosmic ray detection with manual parameters. Use Enhanced version for better results.',
    category: 'cosmic_rays',
    defaultEnabled: false,
    order: 5
  },
  { 
    value: 'multi_algorithm', 
    label: 'Multi-Algorithm Detection',
    tooltip: 'Combines multiple cosmic ray detection methods (L.A.Cosmic, sigma clipping, Laplacian) with voting strategies.',
    category: 'cosmic_rays',
    defaultEnabled: false,
    order: 6
  },
];

const COSMIC_RAY_METHODS = [
  { value: 'lacosmic', label: 'L.A.Cosmic (Standard)' },
  { value: 'multi', label: 'Multi-Algorithm' },
  { value: 'auto', label: 'Auto-Select Method' },
  { value: 'sigma_clip', label: 'Sigma Clipping' }
];

const MULTI_COMBINE_METHODS = [
  { value: 'intersection', label: 'Intersection (Conservative)' },
  { value: 'union', label: 'Union (Aggressive)' },
  { value: 'voting', label: 'Majority Voting' }
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

// API endpoints for cosmetic correction
const COSMETIC_API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://your-production-api.com';

// API functions for cosmetic correction
const generateBadPixelMasks = async (projectId: string, userId: string, sigmaThreshold: number = 5.0) => {
  const response = await fetch(`${COSMETIC_API_BASE}/cosmetic-masks/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      user_id: userId,
      sigma_threshold: sigmaThreshold,
    }),
  });
  return response.json();
};

const correctPatternedNoise = async (projectId: string, userId: string, method: string = 'auto', options: any = {}) => {
  const response = await fetch(`${COSMETIC_API_BASE}/patterned-noise/correct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      user_id: userId,
      method,
      ...options,
    }),
  });
  return response.json();
};

// Job status polling function
const pollJobStatus = async (jobId: string) => {
  const response = await fetch(`${COSMETIC_API_BASE}/jobs/${jobId}/status`);
  return response.json();
};

function getProgressMessage(progress: number) {
  if (progress < 20) return "Preparing and downloading frames...";
  if (progress < 40) return "Analyzing frame quality and gradients...";
  if (progress < 60) return "Calibrating and stacking frames...";
  if (progress < 75) return "Creating master frame...";
  if (progress < 95) return "Uploading results to database...";
  if (progress < 100) return "Loading preview...";
  return "Calibration complete!";
}

// Add a mapping of stacking method to tooltip/description
const STACKING_METHOD_TOOLTIPS: Record<string, string> = {
  adaptive: 'Auto-stacking: Analyzes your frames and picks the best method for you. Recommended for most users.',
  median: 'Median: Robust to outliers and hot pixels. Good for most calibration frames.',
  mean: 'Mean: Averages all frames. Sensitive to outliers, but can reduce noise if all frames are clean.',
  sigma: 'Kappa-Sigma Clipping: Rejects pixels beyond kappa×sigma from the mean, then averages remaining pixels. Standard robust stacking method.',
  percentile_clip: 'Percentile Clipping: Rejects pixels outside specified percentile range (e.g., keep middle 60%). One-step algorithm ideal for small datasets (2-6 frames).',
  minmax: 'MinMax Rejection: Removes the minimum and maximum values at each pixel, then averages the rest. Simple and effective for small datasets (3-8 frames).',
  winsorized: 'Winsorized Sigma Clipping: Reduces the effect of outliers by limiting extreme values. Useful for frames with some bad pixels.',
  linear_fit: 'Linear Fit Clipping: Fits a line to pixel values and rejects outliers. Advanced, for experienced users.',
  entropy_weighted: 'Entropy-Weighted Averaging: Uses information entropy to weight pixels. Preserves signal while reducing noise. Best for high-quality frames.',
  superbias: 'Superbias (PCA modeling): Uses principal component analysis to model and remove bias structure. Advanced, for bias frames only.'
};

// Move groupByMatchingFrames to the module level, above the component
function groupByMatchingFrames(frames: Array<{ name: string; camera: string; binning: string; gain: string | number; temp: string | number; path: string; }>) {
  // Group by camera, binning, gain, and temp (rounded to nearest int)
  const groups: Record<string, typeof frames> = {};
  for (const f of frames) {
    const key = [f.camera, f.binning, f.gain, Math.round(Number(f.temp))].join('|');
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  }
  // Find the largest group
  let bestKey: string | null = null;
  let bestGroup: typeof frames = [];
  for (const [key, group] of Object.entries(groups)) {
    if (group.length > bestGroup.length) {
      bestGroup = group;
      bestKey = key;
    }
  }
  return { groups, bestKey, bestGroup };
}

// OutlierReviewTable subcomponent
function OutlierReviewTable({
  frames,
  outliers,
  sigma,
  onSigmaChange,
  onOverride,
  overrides,
  loading,
  onReRun,
}: {
  frames: any[];
  outliers: any[];
  sigma: number;
  onSigmaChange: (v: number) => void;
  onOverride: (path: string, include: boolean) => void;
  overrides: Record<string, boolean>;
  loading: boolean;
  onReRun: () => void;
}) {
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

function FrameConsistencyTable({
  analysis,
  onFrameToggle,
  frameSelections,
  loading,
}: {
  analysis: any;
  onFrameToggle: (path: string, include: boolean) => void;
  frameSelections: Record<string, boolean>;
  loading: boolean;
}) {
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

const CalibrationScaffoldUI: React.FC<{ projectId: string, userId: string }> = ({ projectId, userId }) => {
  
  // Helper functions for cosmetic methods
  const handleCosmeticMethodToggle = (frameType: MasterType, methodValue: string, enabled: boolean) => {
    setTabState(prev => {
      let newCosmeticMethods = { ...prev[frameType].cosmeticMethods };
      
      // Handle conflicting method logic
      if (enabled) {
        const conflictingMethods = getConflictingMethods(methodValue);
        
        // Disable conflicting methods
        conflictingMethods.forEach(conflictMethod => {
          if (newCosmeticMethods[conflictMethod]?.enabled) {
            newCosmeticMethods[conflictMethod] = {
              ...newCosmeticMethods[conflictMethod],
              enabled: false
            };
          }
        });
      }
      
      // Update the selected method
      newCosmeticMethods[methodValue] = {
        ...newCosmeticMethods[methodValue],
        enabled
      };

      return {
        ...prev,
        [frameType]: {
          ...prev[frameType],
          cosmeticMethods: newCosmeticMethods
        }
      };
    });
  };

  // Define conflicting method groups
  const getConflictingMethods = (methodValue: string): string[] => {
    const conflicts: Record<string, string[]> = {
      // Cosmic ray detection methods conflict with each other
      'la_cosmic': ['la_cosmic_enhanced', 'multi_algorithm'],
      'la_cosmic_enhanced': ['la_cosmic', 'multi_algorithm'], 
      'multi_algorithm': ['la_cosmic', 'la_cosmic_enhanced'],
      
      // Auto method conflicts with all manual selections
      'auto_method': ['hot_pixel_map', 'la_cosmic', 'la_cosmic_enhanced', 'multi_algorithm', 'bad_pixel_masking', 'patterned_noise_removal'],
    };
    
    return conflicts[methodValue] || [];
  };

  const getMethodWarnings = (frameType: MasterType, methodValue: string): string[] => {
    const warnings: string[] = [];
    const enabledMethods = Object.entries(tabState[frameType].cosmeticMethods)
      .filter(([_, config]) => config.enabled)
      .map(([method, _]) => method);
    
    // Check for cosmic ray method conflicts
    const cosmicRayMethods = ['la_cosmic', 'la_cosmic_enhanced', 'multi_algorithm'];
    const enabledCosmicMethods = enabledMethods.filter(method => cosmicRayMethods.includes(method));
    
    if (enabledCosmicMethods.length > 1) {
      warnings.push("⚠️ Multiple cosmic ray methods selected - only the most recent will be used");
    }
    
    // Check for auto method conflicts
    if (enabledMethods.includes('auto_method') && enabledMethods.length > 1) {
      warnings.push("⚠️ Auto-method conflicts with manual selections");
    }
    
    return warnings;
  };

  const handleCosmeticMethodOrderChange = (frameType: MasterType, methodValue: string, newOrder: number) => {
    setTabState(prev => ({
      ...prev,
      [frameType]: {
        ...prev[frameType],
        cosmeticMethods: {
          ...prev[frameType].cosmeticMethods,
          [methodValue]: {
            ...prev[frameType].cosmeticMethods[methodValue],
            order: newOrder
          }
        }
      }
    }));
  };

  const getEnabledCosmeticMethods = (frameType: MasterType) => {
    const methods = tabState[frameType].cosmeticMethods;
    return Object.entries(methods)
      .filter(([_, config]) => config.enabled)
      .sort(([_, a], [__, b]) => a.order - b.order)
      .map(([methodValue, _]) => methodValue);
  };
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
      cosmeticMethods: COSMETIC_METHODS.reduce((acc, method) => {
        acc[method.value] = { enabled: method.defaultEnabled, order: method.order };
        return acc;
      }, {} as Record<string, { enabled: boolean; order: number }>),
      cosmeticThreshold: 0.5,
      customRejection: '',
      pixelRejectionAlgorithm: 'sigma',
      badPixelMapPath: '',
      darkOptimization: false,
      useSuperdark: false,
      superdarkPath: '',
      // New advanced cosmetic correction parameters
      badPixelSigmaThreshold: 5.0,
      patternedNoiseMethod: 'auto',
      patternedNoiseStrength: 0.5,
      gradientRemovalSize: 50,
      fourierCutoffFreq: 0.1,
      polynomialDegree: 2,
    },
    flat: {
      advanced: false,
      stackingMethod: 'mean',
      sigmaThreshold: '3.0',
      weightParam: '',
      cosmeticCorrection: false,
      cosmeticMethods: COSMETIC_METHODS.reduce((acc, method) => {
        acc[method.value] = { enabled: method.defaultEnabled, order: method.order };
        return acc;
      }, {} as Record<string, { enabled: boolean; order: number }>),
      cosmeticThreshold: 0.5,
      customRejection: '',
      badPixelMapPath: '',
      // New advanced cosmetic correction parameters
      badPixelSigmaThreshold: 5.0,
      patternedNoiseMethod: 'auto',
      patternedNoiseStrength: 0.5,
      gradientRemovalSize: 50,
      fourierCutoffFreq: 0.1,
      polynomialDegree: 2,
    },
    bias: {
      advanced: false,
      stackingMethod: 'median',
      sigmaThreshold: '3.0',
      cosmeticCorrection: false,
      cosmeticMethods: COSMETIC_METHODS.reduce((acc, method) => {
        acc[method.value] = { enabled: method.defaultEnabled, order: method.order };
        return acc;
      }, {} as Record<string, { enabled: boolean; order: number }>),
      cosmeticThreshold: 0.5,
      customRejection: '',
      badPixelMapPath: '',
      // New advanced cosmetic correction parameters
      badPixelSigmaThreshold: 5.0,
      patternedNoiseMethod: 'auto',
      patternedNoiseStrength: 0.5,
      gradientRemovalSize: 50,
      fourierCutoffFreq: 0.1,
      polynomialDegree: 2,
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
    // Enhanced parameters
    sigma_frac: 0.3,
    objlim: 5.0,
    method: 'lacosmic',  // 'lacosmic', 'multi', 'auto'
    auto_tune: true,
    multi_methods: ['lacosmic', 'sigma_clip'],
    combine_method: 'intersection',
    analyze_image_quality: true
  });
  // Track which parameters are auto-populated
  const [autoPopulated, setAutoPopulated] = useState<{ readnoise?: boolean; gain?: boolean; satlevel?: boolean }>({});
  const [lastAutoPopulated, setLastAutoPopulated] = useState<{ readnoise?: number; gain?: number; satlevel?: number }>({});
  const [lastMeta, setLastMeta] = useState<any>(null);
  // Add a state for showing a cancel message
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  // Timing state for calibration duration
  const [calibrationStart, setCalibrationStart] = useState<number | null>(null);
  const [calibrationEnd, setCalibrationEnd] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [masterStats, setMasterStats] = useState<any>(null);
  // At the top of the component, add state for skip dialog
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  // --- Preset Saving/Loading Logic ---
  const [presets, setPresets] = useState<{ [K in MasterType]: Record<string, any> }>({ dark: {}, flat: {}, bias: {} });
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  // Add state to track dropdown direction
  const [presetMenuDirection, setPresetMenuDirection] = useState<'down' | 'up'>('down');
  const presetBtnRef = useRef<HTMLButtonElement>(null);
  const [showSuperdarkModal, setShowSuperdarkModal] = useState(false);
  const [superdarkFiles, setSuperdarkFiles] = useState<string[]>([]);
  const [superdarkUploads, setSuperdarkUploads] = useState<File[]>([]);
  const [superdarkName, setSuperdarkName] = useState('');
  const [superdarkStacking, setSuperdarkStacking] = useState('median');
  const [superdarkSigma, setSuperdarkSigma] = useState('3.0');
  const [superdarkMetadata, setSuperdarkMetadata] = useState<any[]>([]);
  const [superdarkWarnings, setSuperdarkWarnings] = useState<string[]>([]);
  const [isCreatingSuperdark, setIsCreatingSuperdark] = useState(false);
  const { user } = useUserStore();
  const { projects, isLoading: projectsLoading, fetchProjects } = useProjects(user?.id, !!user);
  const { superdarks, isLoading: superdarksLoading, error: superdarksError, refresh: refreshSuperdarks } = useSuperdarks(user?.id, projectId);
  const [selectedSuperdarkPath, setSelectedSuperdarkPath] = useState<string>('');
  const [superdarkPreviewUrl, setSuperdarkPreviewUrl] = useState<string>('');
  const [superdarkStats, setSuperdarkStats] = useState<any>(null);
  const [superdarkStatsLoading, setSuperdarkStatsLoading] = useState(false);
  // Add state for available darks in selected project
  const [availableDarks, setAvailableDarks] = useState<DarkFileWithMetadata[]>([]);
  const [selectedDarkPaths, setSelectedDarkPaths] = useState<string[]>([]);
  const [superdarkRefetchTrigger, setSuperdarkRefetchTrigger] = useState(0);

  // State for cosmetic correction jobs
  const [cosmeticJobs, setCosmeticJobs] = useState<{
    badPixelMasking?: { jobId: string; status: string; progress: number };
    patternedNoise?: { jobId: string; status: string; progress: number };
  }>({});
  const [cosmeticResults, setCosmeticResults] = useState<{
    badPixelMasks?: any;
    patternedNoiseCorrection?: any;
  }>({});

  // Outlier detection state
  const [outlierSigma, setOutlierSigma] = useState(3.0);
  const [outlierResults, setOutlierResults] = useState<any>(null);
  const [outlierLoading, setOutlierLoading] = useState(false);
  const [outlierError, setOutlierError] = useState<string | null>(null);
  const [outlierOverrides, setOutlierOverrides] = useState<Record<string, boolean>>({});

  // Frame consistency analysis state
  const [consistencyLoading, setConsistencyLoading] = useState(false);
  const [consistencyResults, setConsistencyResults] = useState<any>(null);
  const [consistencyError, setConsistencyError] = useState<string | null>(null);
  const [consistencySelections, setConsistencySelections] = useState<Record<string, boolean>>({});

  // Frame quality analysis state
  const [qualityAnalysisResults, setQualityAnalysisResults] = useState<any>(null);
  const [histogramAnalysisResults, setHistogramAnalysisResults] = useState<any>(null);
  const [showQualityReport, setShowQualityReport] = useState(false);
  const [showHistogramReport, setShowHistogramReport] = useState(false);
  const [histogramAnalysisLoading, setHistogramAnalysisLoading] = useState(false);
  const [histogramAnalysisNotification, setHistogramAnalysisNotification] = useState<string | null>(null);

  // Add this near the other state declarations (around line 865)
  const [autoConsistencyEnabled, setAutoConsistencyEnabled] = useState(true);
  const [smartDefaultsEnabled, setSmartDefaultsEnabled] = useState(true);

  // Enhanced consistency analysis with auto-run capability
  const handleAutoConsistencyAnalysis = async (fitsPaths: string[]) => {
    if (!autoConsistencyEnabled || fitsPaths.length < 2) return;
    
    try {
      setConsistencyLoading(true);
      setConsistencyError(null);
      
      const analysis = await analyzeFrameConsistency(fitsPaths);
      setConsistencyResults(analysis);
      
      // If smart defaults are enabled, pre-select recommended frames
      if (smartDefaultsEnabled) {
        const selections: Record<string, boolean> = {};
        analysis.metrics_by_frame.forEach((frame: any) => {
          const isRecommended = analysis.recommended_frames?.includes(frame.path);
          selections[frame.path] = isRecommended;
        });
        setConsistencySelections(selections);
        
        // Show a toast notification about auto-selection
        console.log(`Auto-selected ${analysis.recommended_frames?.length || 0} recommended frames based on consistency analysis`);
      }
    } catch (error) {
      setConsistencyError(error instanceof Error ? error.message : 'Failed to analyze consistency');
    } finally {
      setConsistencyLoading(false);
    }
  };

  // Auto-run consistency analysis when frames are loaded
  useEffect(() => {
    if (realFiles.length >= 2 && autoConsistencyEnabled) {
      handleAutoConsistencyAnalysis(realFiles);
    }
  }, [realFiles, selectedType, autoConsistencyEnabled]);

  // API call for outlier detection
  async function detectOutliers(fitsPaths: string[], sigmaThresh: number = 3.0, frameType?: string) {
    const response = await fetch('http://localhost:8000/outliers/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fits_paths: fitsPaths, 
        sigma_thresh: sigmaThresh,
        bucket: 'raw-frames',
        project_id: projectId,
        user_id: userId,
        frame_type: frameType || selectedType
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Outlier detection failed');
    }
    return response.json();
  }

  const handleRunOutlierDetection = async () => {
    setOutlierLoading(true);
    setOutlierError(null);
    try {
      // Filter to only FITS files and determine the correct frame type from filenames
      const fitsFiles = realFiles.filter(f => f.toLowerCase().endsWith('.fit') || f.toLowerCase().endsWith('.fits'));
      
      // Detect actual frame type from filenames if bias files are in dark folder
      let actualFrameType = selectedType;
      if (fitsFiles.length > 0) {
        const firstFile = fitsFiles[0].toLowerCase();
        if (firstFile.includes('bias') || firstFile.includes('zero')) {
          actualFrameType = 'bias';
        } else if (firstFile.includes('dark')) {
          actualFrameType = 'dark';
        } else if (firstFile.includes('flat')) {
          actualFrameType = 'flat';
        }
      }
      
      const result = await detectOutliers(fitsFiles, outlierSigma, actualFrameType);
      setOutlierResults(result);
      // Reset overrides: include all good, exclude outliers by default
      const newOverrides: Record<string, boolean> = {};
      result.good.forEach((f: any) => { newOverrides[f.path] = true; });
      result.outliers.forEach((f: any) => { newOverrides[f.path] = false; });
      setOutlierOverrides(newOverrides);
    } catch (e: any) {
      setOutlierError(e.message);
    } finally {
      setOutlierLoading(false);
    }
  };

  const handleOverride = (path: string, include: boolean) => {
    setOutlierOverrides(prev => ({ ...prev, [path]: include }));
  };

  // API call for frame consistency analysis
  async function analyzeFrameConsistency(fitsPaths: string[], frameType?: string) {
    const response = await fetch('http://localhost:8000/frames/consistency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fits_paths: fitsPaths,
        bucket: 'raw-frames',
        project_id: projectId,
        user_id: userId,
        frame_type: frameType || selectedType,
        consistency_threshold: 0.7,
        sigma_threshold: 2.5,
        min_frames: 5,
        max_frames: null
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Frame consistency analysis failed');
    }
    return response.json();
  }

  const handleRunConsistencyAnalysis = async () => {
    setConsistencyLoading(true);
    setConsistencyError(null);
    try {
      // Filter to only FITS files and determine the correct frame type from filenames
      const fitsFiles = realFiles.filter(f => f.toLowerCase().endsWith('.fit') || f.toLowerCase().endsWith('.fits'));
      
      // Detect actual frame type from filenames if bias files are in dark folder
      let actualFrameType = selectedType;
      if (fitsFiles.length > 0) {
        const firstFile = fitsFiles[0].toLowerCase();
        if (firstFile.includes('bias') || firstFile.includes('zero')) {
          actualFrameType = 'bias';
        } else if (firstFile.includes('dark')) {
          actualFrameType = 'dark';
        } else if (firstFile.includes('flat')) {
          actualFrameType = 'flat';
        }
      }
      
      const result = await analyzeFrameConsistency(fitsFiles, actualFrameType);
      setConsistencyResults(result);
      // Initialize selections based on recommendations
      const newSelections: Record<string, boolean> = {};
      if (result.selection_advice) {
        result.selection_advice.selected_frames.forEach((path: string) => {
          newSelections[path] = true;
        });
        result.selection_advice.excluded_frames.forEach((path: string) => {
          newSelections[path] = false;
        });
      }
      setConsistencySelections(newSelections);
    } catch (e: any) {
      setConsistencyError(e.message);
    } finally {
      setConsistencyLoading(false);
    }
  };

  const handleConsistencyFrameToggle = (path: string, include: boolean) => {
    setConsistencySelections(prev => ({ ...prev, [path]: include }));
  };

  // Handler for quality report frame overrides
  const handleQualityFrameOverride = (framePath: string, action: 'accept' | 'reject') => {
    console.log(`Quality override: ${action} frame ${framePath}`);
    // This could trigger a re-run of calibration with the override
    // For now, just log the action
  };

  // Histogram analysis functions
  const handleHistogramAnalysis = async (fitsPaths: string[]) => {
    console.log('🧪 Histogram Analysis Button Clicked!', { fitsPaths, selectedType, projectId, userId });
    
    if (!fitsPaths || fitsPaths.length === 0) {
      console.log('No files provided for histogram analysis');
      setHistogramAnalysisNotification('No files found for histogram analysis. Please ensure you have uploaded calibration frames.');
      setTimeout(() => setHistogramAnalysisNotification(null), 5000);
      return;
    }

    try {
      setHistogramAnalysisLoading(true);
      setHistogramAnalysisNotification(`Starting histogram analysis for ${fitsPaths.length} files...`);
      console.log(`Starting histogram analysis for ${fitsPaths.length} files...`);
      
      const response = await fetch('http://localhost:8000/histograms/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fits_paths: fitsPaths,
          bucket: 'raw-frames', // Use bucket for Supabase files
          project_id: projectId,
          user_id: userId,
          frame_type: selectedType
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Histogram analysis started:', data);

      if (data.job_id) {
        // Poll for completion
        const pollForResults = async () => {
          try {
            const statusResponse = await fetch(`http://localhost:8000/jobs/status?job_id=${data.job_id}`);
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'success') {
              const resultsResponse = await fetch(`http://localhost:8000/jobs/results?job_id=${data.job_id}`);
              const resultsData = await resultsResponse.json();
              
              console.log('Histogram analysis completed:', resultsData.result);
              setHistogramAnalysisResults(resultsData.result);
              setHistogramAnalysisLoading(false);
              setHistogramAnalysisNotification('Histogram analysis completed successfully!');
              setTimeout(() => setHistogramAnalysisNotification(null), 3000);
            } else if (statusData.status === 'failed') {
              console.error('Histogram analysis failed:', statusData.error);
              setHistogramAnalysisLoading(false);
              setHistogramAnalysisNotification(`Analysis failed: ${statusData.error || 'Unknown error'}`);
              setTimeout(() => setHistogramAnalysisNotification(null), 5000);
            } else {
              // Still running, poll again
              setHistogramAnalysisNotification(`Analyzing histograms... (${statusData.progress || 0}%)`);
              setTimeout(pollForResults, 2000);
            }
          } catch (error) {
            console.error('Error polling histogram analysis status:', error);
            setHistogramAnalysisLoading(false);
            setHistogramAnalysisNotification('Error checking analysis status');
            setTimeout(() => setHistogramAnalysisNotification(null), 5000);
          }
        };

        pollForResults();
      }
    } catch (error) {
      console.error('Error starting histogram analysis:', error);
      setHistogramAnalysisLoading(false);
      setHistogramAnalysisNotification('Error starting histogram analysis');
      setTimeout(() => setHistogramAnalysisNotification(null), 5000);
    }
  };

  const handleHistogramFrameAction = (framePath: string, action: 'accept' | 'reject' | 'apply_pedestal') => {
    console.log(`Histogram frame action: ${action} for ${framePath}`);
    
    if (action === 'apply_pedestal') {
      // Find the frame in results to get pedestal value
      const frameResult = histogramAnalysisResults?.analysis_results?.frame_results?.find(
        (frame: any) => frame.frame_path === framePath
      );
      
      if (frameResult?.recommended_pedestal) {
        console.log(`Applying pedestal of ${frameResult.recommended_pedestal} DN to ${framePath}`);
        // TODO: Implement pedestal application
      }
    }
    
    // TODO: Implement frame accept/reject logic
  };

  // Load presets from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('calibrationPresets_v1');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch {}
    }
  }, []);
  // Save presets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('calibrationPresets_v1', JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    if (selectedSuperdarkPath) {
      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
      
      // First check if the preview file exists before generating the URL
      const checkPreviewExists = async () => {
        try {
          const previewPath = `${selectedSuperdarkPath.replace('.fits', '_preview.png').replace('.fit', '_preview.png')}`;
          
          // Since the selectedSuperdarkPath should now be in format: userId/projectId/filename.fits
          // The preview path should be: userId/projectId/filename_preview.png
          
          // Check if preview exists by trying to get file info from the specific folder
          const folderPath = previewPath.substring(0, previewPath.lastIndexOf('/'));
          const fileName = previewPath.substring(previewPath.lastIndexOf('/') + 1);
          
          const { data: fileExists, error } = await supabase.storage
            .from('superdarks')
            .list(folderPath, { search: fileName });
          
          if (!error && fileExists && fileExists.length > 0) {
            // Preview exists, generate the public URL
            const { data } = supabase.storage.from('superdarks').getPublicUrl(previewPath);
            setSuperdarkPreviewUrl(data.publicUrl);
          } else {
            // Preview doesn't exist, clear the URL to prevent 400 errors
            console.log(`[Superdark] Preview not found for: ${previewPath}`);
            setSuperdarkPreviewUrl('');
          }
        } catch (error) {
          console.error('[Superdark] Error checking preview existence:', error);
          setSuperdarkPreviewUrl('');
        }
      };
      
      // Analyze superdark statistics
      const analyzeSuperdark = async () => {
        setSuperdarkStatsLoading(true);
        setSuperdarkStats(null);
        try {
          console.log('[Superdark] Analyzing superdark:', selectedSuperdarkPath);
          const response = await fetch('http://localhost:8000/analyze-superdark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              superdark_path: selectedSuperdarkPath,
              bucket: 'superdarks'
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('[Superdark] Analysis result:', data);
            setSuperdarkStats(data);
          } else {
            console.error('[Superdark] Analysis failed:', response.status);
            setSuperdarkStats(null);
          }
        } catch (error) {
          console.error('[Superdark] Error analyzing superdark:', error);
          setSuperdarkStats(null);
        } finally {
          setSuperdarkStatsLoading(false);
        }
      };
      
      checkPreviewExists();
      analyzeSuperdark();
    } else {
      setSuperdarkPreviewUrl('');
      setSuperdarkStats(null);
      setSuperdarkStatsLoading(false);
    }
  }, [selectedSuperdarkPath]);

  const handleSavePreset = () => {
    setPresetNameInput('');
    // Auto-detect direction
    setTimeout(() => {
      if (presetBtnRef.current) {
        const rect = presetBtnRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < 300 && spaceAbove > spaceBelow) {
          setPresetMenuDirection('up');
        } else {
          setPresetMenuDirection('down');
        }
      }
    }, 0);
    setShowPresetMenu(true);
  };
  const confirmSavePreset = () => {
    if (!presetNameInput.trim()) return;
    setPresets(prev => ({
      ...prev,
      [selectedType]: {
        ...prev[selectedType],
        [presetNameInput.trim()]: { ...tabState[selectedType] }
      }
    }));
    setShowPresetMenu(false);
  };
  const handleLoadPreset = (name: string) => {
    setTabState(prev => ({ ...prev, [selectedType]: { ...presets[selectedType][name] } }));
    setShowPresetMenu(false);
  };
  const handleDeletePreset = (name: string) => {
    setPresets(prev => {
      const updated = { ...prev[selectedType] };
      delete updated[name];
      return { ...prev, [selectedType]: updated };
    });
  };

  // Add this effect after state declarations
  useEffect(() => {
    // Fetch latest preview for all frame types
    async function fetchAllPreviews() {
      const types: MasterType[] = ['bias', 'dark', 'flat'];
      const newPreviewUrls: { [K in MasterType]?: string | null } = {};
      await Promise.all(types.map(async (type) => {
        try {
          const res = await fetch(`/api/projects/${projectId}/calibration-jobs/latest-result?userId=${userId}&frameType=${type}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.result?.preview_url) {
              newPreviewUrls[type] = data.result.preview_url;
            } else {
              newPreviewUrls[type] = null;
            }
          } else {
            newPreviewUrls[type] = null;
          }
        } catch {
          newPreviewUrls[type] = null;
        }
      }));
      setPreviewUrls(newPreviewUrls);
    }
    fetchAllPreviews();
  }, [projectId, userId]);

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
      setRealFiles((data || [])
        .filter(f => !f.name.endsWith('/')) // Exclude directories
        .filter(f => f.name.toLowerCase().endsWith('.fit') || f.name.toLowerCase().endsWith('.fits')) // Only FITS files
        .map(f => f.name));
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

  // Helper to get default tab state for a given type
  const getDefaultTabState = (type: MasterType) => {
    const defaultCosmeticMethods = COSMETIC_METHODS.reduce((acc, method) => {
      acc[method.value] = { enabled: method.defaultEnabled, order: method.order };
      return acc;
    }, {} as Record<string, { enabled: boolean; order: number }>);

    switch (type) {
      case 'dark':
        return {
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
          cosmeticMethods: defaultCosmeticMethods,
          cosmeticThreshold: 0.5,
          customRejection: '',
          pixelRejectionAlgorithm: 'sigma',
          badPixelMapPath: '',
          darkOptimization: false,
          useSuperdark: false,
          superdarkPath: '',
          // Flat-specific properties (unused but needed for type consistency)
          weightParam: '',
          // New advanced cosmetic correction parameters
          badPixelSigmaThreshold: 5.0,
          patternedNoiseMethod: 'auto',
          patternedNoiseStrength: 0.5,
          gradientRemovalSize: 50,
          fourierCutoffFreq: 0.1,
          polynomialDegree: 2,
        };
      case 'flat':
        return {
          advanced: false,
          stackingMethod: 'mean',
          sigmaThreshold: '3.0',
          weightParam: '',
          cosmeticCorrection: false,
          cosmeticMethods: defaultCosmeticMethods,
          cosmeticThreshold: 0.5,
          customRejection: '',
          badPixelMapPath: '',
          // Dark-specific properties (unused but needed for type consistency)
          darkScaling: false,
          darkScalingAuto: true,
          darkScalingFactor: 1.0,
          biasSubtraction: false,
          ampGlowSuppression: false,
          tempMatching: false,
          exposureMatching: false,
          pixelRejectionAlgorithm: 'sigma',
          darkOptimization: false,
          useSuperdark: false,
          superdarkPath: '',
          // New advanced cosmetic correction parameters
          badPixelSigmaThreshold: 5.0,
          patternedNoiseMethod: 'auto',
          patternedNoiseStrength: 0.5,
          gradientRemovalSize: 50,
          fourierCutoffFreq: 0.1,
          polynomialDegree: 2,
        };
      case 'bias':
      default:
        return {
          advanced: false,
          stackingMethod: 'median',
          sigmaThreshold: '3.0',
          cosmeticCorrection: false,
          cosmeticMethods: defaultCosmeticMethods,
          cosmeticThreshold: 0.5,
          customRejection: '',
          badPixelMapPath: '',
          // Dark-specific properties (unused but needed for type consistency)
          darkScaling: false,
          darkScalingAuto: true,
          darkScalingFactor: 1.0,
          biasSubtraction: false,
          ampGlowSuppression: false,
          tempMatching: false,
          exposureMatching: false,
          pixelRejectionAlgorithm: 'sigma',
          darkOptimization: false,
          useSuperdark: false,
          superdarkPath: '',
          // Flat-specific properties (unused but needed for type consistency)
          weightParam: '',
          // New advanced cosmetic correction parameters
          badPixelSigmaThreshold: 5.0,
          patternedNoiseMethod: 'auto',
          patternedNoiseStrength: 0.5,
          gradientRemovalSize: 50,
          fourierCutoffFreq: 0.1,
          polynomialDegree: 2,
        };
    }
  };

  // Default settings for reset
  const defaultTabState = {
    dark: getDefaultTabState('dark'),
    flat: getDefaultTabState('flat'),
    bias: getDefaultTabState('bias'),
  };

  // Reset current tab
  const handleResetCurrent = () => {
    setTabState(prev => ({ ...prev, [selectedType]: { ...defaultTabState[selectedType] } }));
  };
  // Reset all tabs
  const handleResetAll = () => {
    setTabState({ ...defaultTabState });
  };

  // Helper to submit calibration job
  const submitCalibrationJob = async (settings: any) => {
    setCalibrationStart(Date.now()); // Record start time
    setCalibrationEnd(null); // Reset end time
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
        selectedType, // <-- add this line
        // ...add other required fields
        ...(tabState.bias.badPixelMapPath && { badPixelMapPath: tabState.bias.badPixelMapPath }),
        darkOptimization: tabState.dark.darkOptimization,
        superdarkPath: selectedSuperdarkPath,
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
            setJobProgress(100); // Ensure progress bar is full when job is done
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
            setPreviewUrl(data.results.preview_url);
            console.log('[Preview] Setting previewLoading to false after setting previewUrl');
            setPreviewLoading(false);
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

            // --- Extract quality analysis results ---
            if (data.diagnostics && data.diagnostics.quality_analysis) {
              setQualityAnalysisResults(data.diagnostics.quality_analysis);
              // Show quality report if there are issues detected
              const hasIssues = data.results.rejected > 0 || 
                              (data.diagnostics.quality_analysis.summary && 
                               data.diagnostics.quality_analysis.summary.average_quality < 7);
              setShowQualityReport(hasIssues);
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
        const prefix = `${userId}/${projectId}/bias/`;
        const { data, error } = await supabase.storage.from('calibrated-frames').list(prefix);
        if (!error && data) {
          // Filter for FITS files only (not PNG duplicates)
          const fits = data.filter((f: any) => 
            (f.name.toLowerCase().endsWith('.fits') || f.name.toLowerCase().endsWith('.fit')) &&
            !f.name.toLowerCase().endsWith('.png')
          );
          setMasterBiasOptions(fits.map((f: any) => ({ path: prefix + f.name, name: f.name })));
          console.log(`[Master Bias] Found ${fits.length} bias frames in calibrated-frames/${prefix}:`, fits.map(f => f.name));
        } else {
          console.log(`[Master Bias] Error or no data from calibrated-frames/${prefix}:`, error);
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



  // Add this handler near other job handlers
  const handleCancelJob = async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/calibration-jobs/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'cancelled') {
        setTabState(prev => ({ ...prev, [selectedType]: getDefaultTabState(selectedType) }));
        setJobStatus('idle');
        setJobProgress(0);
        setJobId(null);
        setCancelMessage('Calibration cancelled successfully.');
        setTimeout(() => setCancelMessage(null), 3500);
      } else {
        setCancelMessage('Failed to cancel calibration.');
        setTimeout(() => setCancelMessage(null), 3500);
      }
    } catch (e) {
      setCancelMessage('Failed to cancel calibration.');
      setTimeout(() => setCancelMessage(null), 3500);
    }
  };

  // Add this useEffect after the other useEffects
  useEffect(() => {
    // Only run if no job is currently running/queued for this type
    if (jobStatus === 'queued' || jobStatus === 'running') return;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/calibration-jobs/latest?type=${selectedType}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.preview_url) {
            setPreviewUrls(prev => ({ ...prev, [selectedType]: data.preview_url }));
            setJobStatus('success');
          }
        }
      } catch (e) {
        // Ignore errors (no previous job)
      }
    };
    fetchLatest();
  }, [projectId, selectedType]);

  // Beginner stacking methods for bias, dark, and flat
  const BEGINNER_BIAS_STACKING_METHODS = [
    { value: 'median', label: 'Median (recommended)' },
    { value: 'mean', label: 'Mean' },
  ];
  const BEGINNER_DARK_STACKING_METHODS = [
    { value: 'adaptive', label: 'Auto-stacking (recommended)' },
    { value: 'median', label: 'Median' },
    { value: 'mean', label: 'Mean' },
  ];
  const BEGINNER_FLAT_STACKING_METHODS = [
    { value: 'adaptive', label: 'Auto-stacking (recommended)' },
    { value: 'median', label: 'Median' },
    { value: 'mean', label: 'Mean' },
  ];

  // Load tabState from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('calibrationTabState_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTabState(parsed);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);
  // Save tabState to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('calibrationTabState_v1', JSON.stringify(tabState));
  }, [tabState]);

  // Fetch latest master preview on mount and when selectedType/projectId/userId changes
  useEffect(() => {
    async function fetchPreview() {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewUrl(null);
      try {
        // List all files in the master frame folder for the selected type
        const folder = `${userId}/${projectId}/${selectedType}/`;
        const { data: files, error } = await supabase.storage.from('calibrated-frames').list(folder);
        if (error || !files || files.length === 0) {
          setPreviewError('No preview found. Run calibration to generate a master frame.');
          setPreviewUrl(null);
          setPreviewLoading(false);
          return;
        }
        // Filter for .png files only
        const pngFiles = files.filter(f => f.name.toLowerCase().endsWith('.png'));
        if (pngFiles.length === 0) {
          setPreviewError('No preview found. Run calibration to generate a master frame.');
          setPreviewUrl(null);
          setPreviewLoading(false);
          return;
        }
        // Sort by last_modified (descending) and pick the most recent
        pngFiles.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
        const latestPng = pngFiles[0];
        const path = `${folder}${latestPng.name}`;
        const { data } = await supabase.storage.from('calibrated-frames').getPublicUrl(path);
        if (!data?.publicUrl) {
          setPreviewError('No preview found. Run calibration to generate a master frame.');
          setPreviewUrl(null);
        } else {
          setPreviewUrl(data.publicUrl);
        }
      } catch (e) {
        setPreviewError('Error loading preview.');
        setPreviewUrl(null);
      } finally {
        setPreviewLoading(false);
      }
    }
    fetchPreview();
  }, [selectedType, projectId, userId]);

  // Fetch latest master stats when previewUrl changes
  useEffect(() => {
    async function fetchStats() {
      setMasterStats(null);
      if (!previewUrl) return;
      try {
        // Fetch the latest calibration job result for this project/type
        const res = await fetch(`/api/projects/${projectId}/calibration-jobs/latest-result?userId=${userId}&frameType=${selectedType}`);
        console.log('[Diagnostics] /latest-result response:', res);
        if (res.ok) {
          const data = await res.json();
          console.log('[Diagnostics] /latest-result data:', data);
          console.log('[Diagnostics] data.result:', data.result);
          console.log('[Diagnostics] data.diagnostics:', data.diagnostics);
          if (data?.result?.master_stats) {
            console.log('[Diagnostics] Setting masterStats from data.result.master_stats:', data.result.master_stats);
            setMasterStats(data.result.master_stats);
            if (data?.result?.preview_url) {
              setPreviewUrls(prev => ({ ...prev, [selectedType]: data.result.preview_url }));
            }
          } else if (data?.diagnostics) {
            console.log('[Diagnostics] Setting masterStats from data.diagnostics:', data.diagnostics);
            setMasterStats(data.diagnostics);
            if (data?.result?.preview_url) {
              setPreviewUrls(prev => ({ ...prev, [selectedType]: data.result.preview_url }));
            }
          } else {
            console.log('[Diagnostics] No diagnostics found in response.');
          }
        } else {
          console.log('[Diagnostics] /latest-result not ok:', res.status);
        }
      } catch (e) {
        console.error('[Diagnostics] Error fetching stats:', e);
      }
    }
    fetchStats();
  }, [previewUrl, projectId, selectedType, userId]);

  // Dynamically compute master status for each type
  function getMasterStatus(type: MasterType): MasterStatus {
    // If we have a preview URL for this type, it's complete
    if (previewUrls[type]) return 'complete';
    // If a job is running for this type, it's in progress
    if ((jobStatus === 'queued' || jobStatus === 'running') && selectedType === type) return 'in_progress';
    // Otherwise, not started
    return 'not_started';
  }

  // Add handleBack and handleNextStep handlers if not present:
  // function handleBack() { /* navigate to previous step */ }
  // function handleNextStep() { /* navigate to light stacking step */ }

  // Add above the return statement, after state declarations:
  const requiredTypes: MasterType[] = ['bias', 'dark', 'flat'];
  const missingTypes = requiredTypes.filter(type => !previewUrls[type]);
  const allCalibrationsReady = missingTypes.length === 0;

  function handleBack() {
    // TODO: Implement navigation to previous step
  }
  function handleNextStep() {
    // TODO: Implement navigation to light stacking step
  }

  // Helper to open modal
  const openSuperdarkModal = () => {
    console.log('[DEBUG] openSuperdarkModal called');
    setShowSuperdarkModal(true);
  };

  // Handle cosmetic correction job submission
  const handleCosmeticCorrection = async (type: 'badPixelMasking' | 'patternedNoise') => {
    try {
      let result: any;
      const currentTabSettings = tabState[selectedType];
      
      if (type === 'badPixelMasking') {
        result = await generateBadPixelMasks(
          projectId, 
          userId, 
          currentTabSettings.badPixelSigmaThreshold
        );
        setCosmeticJobs(prev => ({
          ...prev,
          badPixelMasking: { jobId: result.job_id, status: 'running', progress: 0 }
        }));
      } else if (type === 'patternedNoise') {
        result = await correctPatternedNoise(
          projectId, 
          userId, 
          currentTabSettings.patternedNoiseMethod,
          {
            strength: currentTabSettings.patternedNoiseStrength,
            gradient_removal_size: currentTabSettings.gradientRemovalSize,
            fourier_cutoff_freq: currentTabSettings.fourierCutoffFreq,
            polynomial_degree: currentTabSettings.polynomialDegree,
          }
        );
        setCosmeticJobs(prev => ({
          ...prev,
          patternedNoise: { jobId: result.job_id, status: 'running', progress: 0 }
        }));
      }

      // Start polling for job status
      if (result?.job_id) {
        pollCosmeticJobStatus(result.job_id, type);
      }
    } catch (error) {
      console.error(`Error starting ${type} job:`, error);
    }
  };

  // Poll cosmetic correction job status
  const pollCosmeticJobStatus = async (jobId: string, type: 'badPixelMasking' | 'patternedNoise') => {
    const poll = async () => {
      try {
        const status = await pollJobStatus(jobId);
        
        setCosmeticJobs(prev => ({
          ...prev,
          [type]: { jobId, status: status.status, progress: status.progress || 0 }
        }));

        if (status.status === 'completed') {
          setCosmeticResults(prev => ({
            ...prev,
            [type === 'badPixelMasking' ? 'badPixelMasks' : 'patternedNoiseCorrection']: status.result
          }));
        } else if (status.status === 'running') {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.error(`Error polling ${type} job status:`, error);
        setCosmeticJobs(prev => ({
          ...prev,
          [type]: { jobId, status: 'failed', progress: 0 }
        }));
      }
    };
    
    poll();
  };

  // Cosmetic Methods Selection Component with Tooltips and Ordering
  // Histogram Analysis Component
  function HistogramAnalysisSection({ frameType }: { frameType: MasterType }) {
    const fitsFiles = realFiles.filter((f: string) => f.endsWith('.fits') || f.endsWith('.fit'));
    
    return (
      <div className="mb-4 border-t border-purple-900 pt-4 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <h4 className="font-semibold text-purple-200">Histogram/Distribution Analysis</h4>
        </div>
        <p className="text-xs text-purple-300 mb-3">
          Analyze pixel value distributions for quality assessment, clipping detection, and pedestal requirements
        </p>
        
        {/* Notification */}
        {histogramAnalysisNotification && (
          <div className="mb-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              {histogramAnalysisLoading && (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span className="text-sm text-blue-200">{histogramAnalysisNotification}</span>
            </div>
          </div>
        )}
        
        <button
          className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
          onClick={() => {
            console.log('🔍 Button clicked - fitsFiles:', fitsFiles);
            const paths = fitsFiles.map((f: string) => `${userId}/${projectId}/${frameType}/${f}`);
            console.log('🔍 Generated paths:', paths);
            handleHistogramAnalysis(paths);
          }}
          disabled={fitsFiles.length === 0 || histogramAnalysisLoading}
        >
          <BarChart3 className="w-4 h-4 inline mr-1" />
          {histogramAnalysisLoading ? 'Analyzing...' : `Analyze Histograms (${fitsFiles.length} files)`}
        </button>
        
        {histogramAnalysisResults && (
          <div className="mt-4">
            <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm font-medium text-purple-200">
                  {histogramAnalysisResults.summary?.message || 'Analysis Complete'}
                </div>
              </div>
              
              {histogramAnalysisResults.summary?.frame_breakdown && (
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="text-green-300">
                    High Quality: {histogramAnalysisResults.summary.frame_breakdown.high_quality}
                  </div>
                  <div className="text-red-300">
                    Poor Quality: {histogramAnalysisResults.summary.frame_breakdown.poor_quality}
                  </div>
                  <div className="text-yellow-300">
                    Need Pedestal: {histogramAnalysisResults.summary.frame_breakdown.requiring_pedestal}
                  </div>
                  <div className="text-orange-300">
                    With Clipping: {histogramAnalysisResults.summary.frame_breakdown.with_clipping}
                  </div>
                </div>
              )}
              
              {histogramAnalysisResults.summary?.recommendations && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-purple-300 mb-1">Key Recommendations:</div>
                  <ul className="text-xs text-purple-200 space-y-1">
                    {histogramAnalysisResults.summary.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button
                className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline"
                onClick={() => setShowHistogramReport(true)}
              >
                View Detailed Report →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function CosmeticMethodsSelector({
    selectedMethods,
    onMethodToggle,
    onOrderChange,
  }: {
    selectedMethods: Record<string, { enabled: boolean; order: number }>;
    onMethodToggle: (methodValue: string, enabled: boolean) => void;
    onOrderChange: (methodValue: string, newOrder: number) => void;
  }) {
    // Sort methods by their order for display
    const sortedMethods = COSMETIC_METHODS.sort((a, b) => {
      const aOrder = selectedMethods[a.value]?.order || a.order;
      const bOrder = selectedMethods[b.value]?.order || b.order;
      return aOrder - bOrder;
    });

    const enabledMethods = sortedMethods.filter(method => selectedMethods[method.value]?.enabled);
    const disabledMethods = sortedMethods.filter(method => !selectedMethods[method.value]?.enabled);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-medium text-blue-200">Cosmetic Correction Methods</h5>
          <span className="text-xs text-blue-300">
            {enabledMethods.length} method{enabledMethods.length !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Enabled Methods (with ordering) */}
        {enabledMethods.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-blue-300 mb-2">
              ✅ Enabled (processed in order):
            </div>
            {enabledMethods.map((method, index) => (
              <TooltipProvider key={method.value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between bg-blue-900/30 rounded p-3 border border-blue-600/50">
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-blue-700 text-blue-100 px-2 py-1 rounded font-mono">
                          {index + 1}
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMethods[method.value]?.enabled || false}
                            onChange={(e) => onMethodToggle(method.value, e.target.checked)}
                            className="accent-blue-600"
                          />
                          <span className="text-blue-100 font-medium">{method.label}</span>
                        </label>
                      </div>
                      
                      {/* Order controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => index > 0 && onOrderChange(method.value, selectedMethods[method.value].order - 1)}
                          disabled={index === 0}
                          className="p-1 text-blue-300 hover:text-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => index < enabledMethods.length - 1 && onOrderChange(method.value, selectedMethods[method.value].order + 1)}
                          disabled={index === enabledMethods.length - 1}
                          className="p-1 text-blue-300 hover:text-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>{method.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}

        {/* Disabled Methods */}
        {disabledMethods.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-2">
              ⭕ Available methods:
            </div>
            {disabledMethods.map((method) => (
              <TooltipProvider key={method.value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between bg-gray-900/30 rounded p-3 border border-gray-600/30">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMethods[method.value]?.enabled || false}
                          onChange={(e) => onMethodToggle(method.value, e.target.checked)}
                          className="accent-blue-600"
                        />
                        <span className="text-gray-300">{method.label}</span>
                      </label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>{method.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}

        {/* Help text */}
        <div className="text-xs text-blue-300 bg-blue-900/20 rounded p-2">
          💡 <strong>Pro tip:</strong> Multiple methods work together - Hot Pixel Map removes sensor defects, 
          L.A.Cosmic Enhanced removes cosmic rays, and additional methods handle specific noise patterns.
        </div>
      </div>
    );
  }

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
              <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${STATUS_COLORS[getMasterStatus(ft.key as MasterType)]}`}></span>
              <span className="ml-4 flex items-center gap-1">
                {FRAME_TYPE_ICONS[ft.key as MasterType]}
                <span className="drop-shadow font-bold text-base tracking-tight">{ft.label}</span>
              </span>
              <span className={`ml-1 text-xs ${selectedType === ft.key ? 'text-white' : 'text-blue-300'}`}>{STATUS_LABELS[getMasterStatus(ft.key as MasterType)]}</span>
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
                  <CheckCircle2 className="w-3 h-3" /> {STATUS_LABELS[getMasterStatus(selectedType)]}
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
                  {selectedType === 'bias' && !tabState.bias.advanced && (
                    <div className="mb-4">
                      <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
                      <div className="flex flex-col gap-2">
                        {BEGINNER_BIAS_STACKING_METHODS.map(m => (
                          <Tooltip key={m.value}>
                            <TooltipTrigger asChild>
                              <label className="flex items-center gap-2 text-blue-200 cursor-pointer">
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
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={4} className="max-w-xs text-sm">
                              {STACKING_METHOD_TOOLTIPS[m.value]}
                            </TooltipContent>
                          </Tooltip>
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
                          {ADVANCED_BIAS_STACKING_METHODS.map(m => (
                            <Tooltip key={m.value}>
                              <TooltipTrigger asChild>
                                <label className="flex items-center gap-2 text-blue-200 cursor-pointer">
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
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={4} className="max-w-xs text-sm">
                                {STACKING_METHOD_TOOLTIPS[m.value]}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                      {/* Sigma/Kappa Threshold for advanced methods */}
                      {(tabState.bias.stackingMethod === 'sigma' || tabState.bias.stackingMethod === 'winsorized' || tabState.bias.stackingMethod === 'linear_fit') && (
                        <div className="mb-4">
                          <label className="block font-medium mb-1 text-blue-100">
                            Sigma/Kappa Threshold
                            {tabState.bias.stackingMethod === 'sigma' && (
                              <span className="ml-2 text-xs text-blue-300">(pixels beyond ±{tabState.bias.sigmaThreshold}σ will be rejected)</span>
                            )}
                          </label>
                          <input
                            type="range"
                            min="1.5"
                            max="5"
                            step="0.1"
                            value={tabState.bias.sigmaThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, bias: { ...prev.bias, sigmaThreshold: e.target.value } }))}
                            className="w-40 accent-blue-600"
                          />
                          <input
                            type="number"
                            step="0.1"
                            min="1.5"
                            max="5"
                            value={tabState.bias.sigmaThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, bias: { ...prev.bias, sigmaThreshold: e.target.value } }))}
                            className="border rounded px-2 py-1 w-20 bg-[#181c23] text-white border-[#232946] ml-2"
                          />
                        </div>
                      )}
                      {/* Percentile Range for percentile clipping */}
                      {tabState.bias.stackingMethod === 'percentile_clip' && (
                        <div className="mb-4">
                          <label className="block font-medium mb-1 text-blue-100">
                            Percentile Range to Keep
                            <span className="ml-2 text-xs text-blue-300">(keep middle {tabState.bias.sigmaThreshold}%, reject {((100 - parseFloat(tabState.bias.sigmaThreshold)) / 2).toFixed(1)}% from each end)</span>
                          </label>
                          <input
                            type="range"
                            min="40"
                            max="90"
                            step="5"
                            value={tabState.bias.sigmaThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, bias: { ...prev.bias, sigmaThreshold: e.target.value } }))}
                            className="w-40 accent-blue-600"
                          />
                          <input
                            type="number"
                            step="5"
                            min="40"
                            max="90"
                            value={tabState.bias.sigmaThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, bias: { ...prev.bias, sigmaThreshold: e.target.value } }))}
                            className="border rounded px-2 py-1 w-20 bg-[#181c23] text-white border-[#232946] ml-2"
                          />
                          <span className="ml-2 text-xs text-blue-300">%</span>
                        </div>
                      )}
                      {/* Bad Pixel Map upload UI should be here, not inside the map */}
                      {tabState.bias.cosmeticCorrection && (
                        <div className="mb-4">
                          <label className="block font-medium mb-1 text-blue-100">Bad Pixel Map (optional, FITS)</label>
                          <input
                            type="file"
                            accept=".fits,.fit,.fts"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                // Upload to Supabase or your storage bucket
                                const file = e.target.files[0];
                                // TODO: Replace with your upload logic
                                // Example: const path = await uploadBpmFile(file, projectId, userId);
                                // For now, just set the file name as a placeholder
                                setTabState(prev => ({ ...prev, bias: { ...prev.bias, badPixelMapPath: file.name } }));
                              }
                            }}
                            className="block w-full text-sm text-blue-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-700 file:text-blue-100 hover:file:bg-blue-800"
                          />
                          {tabState.bias.badPixelMapPath && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-blue-300">Selected: {tabState.bias.badPixelMapPath}</span>
                              <button
                                type="button"
                                className="text-xs text-red-400 underline"
                                onClick={() => setTabState(prev => ({ ...prev, bias: { ...prev.bias, badPixelMapPath: '' } }))}
                              >Clear</button>
                            </div>
                          )}
                          <span className="text-xs text-blue-400">Advanced: Upload a FITS bad pixel map. Bad pixels will be replaced with local median.</span>
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
                      {selectedType === 'bias' && tabState.bias.cosmeticMethods?.la_cosmic?.enabled && (
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

                      {/* Enhanced Cosmic Ray Detection */}
                      {selectedType === 'bias' && (tabState.bias.cosmeticMethods?.la_cosmic_enhanced?.enabled || tabState.bias.cosmeticMethods?.multi_algorithm?.enabled || tabState.bias.cosmeticMethods?.auto_method?.enabled) && (
                        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-4 mb-4 border border-purple-500/30 shadow-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-5 h-5 text-purple-400" />
                            <h4 className="font-semibold text-purple-200">Enhanced Cosmic Ray Detection</h4>
                            <span className="px-2 py-1 text-xs bg-purple-700 text-purple-100 rounded-full">NEW</span>
                          </div>
                          
                          {/* Detection Method Selection */}
                          <div className="mb-4">
                            <label className="block text-purple-200 text-sm mb-2">Detection Method</label>
                            <select
                              value={laCosmicParams.method}
                              onChange={e => setLaCosmicParams(prev => ({ ...prev, method: e.target.value }))}
                              className="w-full bg-[#2a2e3a] text-purple-100 border border-purple-600 rounded px-3 py-2"
                            >
                              {COSMIC_RAY_METHODS.map(method => (
                                <option key={method.value} value={method.value}>{method.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Auto-tuning Toggle */}
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <label className="text-purple-200 text-sm font-medium">Auto-tune Parameters</label>
                              <p className="text-xs text-purple-300">Automatically optimize detection parameters for each image</p>
                            </div>
                            <label className="inline-flex relative items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={laCosmicParams.auto_tune} 
                                onChange={e => setLaCosmicParams(prev => ({ ...prev, auto_tune: e.target.checked }))}
                              />
                              <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:bg-purple-600 transition-all flex items-center justify-start peer-checked:justify-end">
                                {!laCosmicParams.auto_tune && <span className="w-3 h-3 bg-white rounded-full ml-1" />}
                                {laCosmicParams.auto_tune && <span className="w-3 h-3 bg-purple-300 rounded-full mr-1" />}
                              </div>
                            </label>
                          </div>

                          {/* Multi-algorithm specific controls */}
                          {laCosmicParams.method === 'multi' && (
                            <div className="space-y-4 border-l-2 border-purple-500/30 pl-4 ml-2">
                              <div>
                                <label className="block text-purple-200 text-sm mb-2">Detection Methods to Combine</label>
                                <div className="space-y-2">
                                  {['lacosmic', 'sigma_clip', 'laplacian'].map(method => (
                                    <label key={method} className="flex items-center gap-2 text-purple-200 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={laCosmicParams.multi_methods.includes(method)}
                                        onChange={e => {
                                          if (e.target.checked) {
                                            setLaCosmicParams(prev => ({ 
                                              ...prev, 
                                              multi_methods: [...prev.multi_methods, method] 
                                            }));
                                          } else {
                                            setLaCosmicParams(prev => ({ 
                                              ...prev, 
                                              multi_methods: prev.multi_methods.filter(m => m !== method) 
                                            }));
                                          }
                                        }}
                                        className="accent-purple-600"
                                      />
                                      <span className="capitalize">{method.replace('_', ' ')}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-purple-200 text-sm mb-2">Combination Method</label>
                                <select
                                  value={laCosmicParams.combine_method}
                                  onChange={e => setLaCosmicParams(prev => ({ ...prev, combine_method: e.target.value }))}
                                  className="w-full bg-[#2a2e3a] text-purple-100 border border-purple-600 rounded px-3 py-2"
                                >
                                  {MULTI_COMBINE_METHODS.map(method => (
                                    <option key={method.value} value={method.value}>{method.label}</option>
                                  ))}
                                </select>
                                <p className="text-xs text-purple-300 mt-1">
                                  {laCosmicParams.combine_method === 'intersection' && 'Only pixels detected by ALL methods (most conservative)'}
                                  {laCosmicParams.combine_method === 'union' && 'Pixels detected by ANY method (most aggressive)'}
                                  {laCosmicParams.combine_method === 'voting' && 'Pixels detected by majority of methods (balanced)'}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Advanced L.A.Cosmic Parameters */}
                          {!laCosmicParams.auto_tune && ['lacosmic', 'multi'].includes(laCosmicParams.method) && (
                            <div className="space-y-3 border-t border-purple-500/20 pt-4">
                              <h5 className="text-purple-200 font-medium text-sm">Advanced Parameters</h5>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-purple-200 text-xs mb-1">Sigma Fraction</label>
                                  <input 
                                    type="number" 
                                    step="0.1" 
                                    min="0.1" 
                                    max="1.0" 
                                    value={laCosmicParams.sigma_frac} 
                                    onChange={e => setLaCosmicParams(prev => ({ ...prev, sigma_frac: parseFloat(e.target.value) }))}
                                    className="w-full bg-[#2a2e3a] text-purple-100 border border-purple-600 rounded px-2 py-1 text-sm" 
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-purple-200 text-xs mb-1">Object Limit</label>
                                  <input 
                                    type="number" 
                                    step="0.5" 
                                    min="1.0" 
                                    max="10.0" 
                                    value={laCosmicParams.objlim} 
                                    onChange={e => setLaCosmicParams(prev => ({ ...prev, objlim: parseFloat(e.target.value) }))}
                                    className="w-full bg-[#2a2e3a] text-purple-100 border border-purple-600 rounded px-2 py-1 text-sm" 
                                  />
                                </div>
                              </div>
                              
                              <p className="text-xs text-purple-300">💡 Enable auto-tune to automatically optimize these parameters</p>
                            </div>
                          )}

                          {/* Image Quality Analysis Toggle */}
                          <div className="mt-4 flex items-center justify-between border-t border-purple-500/20 pt-4">
                            <div>
                              <label className="text-purple-200 text-sm font-medium">Generate Image Quality Analysis</label>
                              <p className="text-xs text-purple-300">Analyze image metrics for parameter recommendations</p>
                            </div>
                            <label className="inline-flex relative items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={laCosmicParams.analyze_image_quality} 
                                onChange={e => setLaCosmicParams(prev => ({ ...prev, analyze_image_quality: e.target.checked }))}
                              />
                              <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:bg-purple-600 transition-all flex items-center justify-start peer-checked:justify-end">
                                {!laCosmicParams.analyze_image_quality && <span className="w-3 h-3 bg-white rounded-full ml-1" />}
                                {laCosmicParams.analyze_image_quality && <span className="w-3 h-3 bg-purple-300 rounded-full mr-1" />}
                              </div>
                            </label>
                          </div>
                        </div>
                      )}
                      
                      {/* Outlier Frame Rejection for Bias */}
                      <div className="mb-4 border-t border-blue-900 pt-4 mt-4">
                        <h4 className="font-semibold text-blue-200 mb-2">Outlier Frame Rejection</h4>
                        <button
                          className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800"
                          onClick={handleRunOutlierDetection}
                          disabled={outlierLoading}
                        >
                          {outlierLoading ? 'Detecting...' : 'Run Outlier Detection'}
                        </button>
                        {outlierError && <div className="text-red-400 mt-2">{outlierError}</div>}
                        {outlierResults && (
                          <OutlierReviewTable
                            frames={[...outlierResults.good, ...outlierResults.outliers]}
                            outliers={outlierResults.outliers}
                            sigma={outlierSigma}
                            onSigmaChange={setOutlierSigma}
                            onOverride={handleOverride}
                            overrides={outlierOverrides}
                            loading={outlierLoading}
                            onReRun={handleRunOutlierDetection}
                          />
                        )}
                      </div>

                      {/* Histogram/Distribution Analysis */}
                      <HistogramAnalysisSection frameType="bias" />
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
                  {selectedType === 'dark' && !tabState.dark.advanced && (
                    <div className="mb-4">
                      <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
                      <div className="flex flex-col gap-2">
                        {BEGINNER_DARK_STACKING_METHODS.map(bsm => (
                          <Tooltip key={bsm.value}>
                            <TooltipTrigger asChild>
                              <label className="flex items-center gap-2 text-blue-200 cursor-pointer">
                                <input
                                  type="radio"
                                  name="darkStackingMethod"
                                  value={bsm.value}
                                  checked={tabState.dark.stackingMethod === bsm.value}
                                  onChange={() => setTabState(prev => ({ ...prev, dark: { ...prev.dark, stackingMethod: bsm.value } }))}
                                  className="accent-blue-600"
                                />
                                <span>{bsm.label}</span>
                              </label>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={4} className="max-w-xs text-sm">
                              {STACKING_METHOD_TOOLTIPS[bsm.value]}
                            </TooltipContent>
                          </Tooltip>
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
                            <Tooltip key={m.value}>
                              <TooltipTrigger asChild>
                                <label className="flex items-center gap-2 text-blue-200 cursor-pointer">
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
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={4} className="max-w-xs text-sm">
                                {STACKING_METHOD_TOOLTIPS[m.value]}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                      {/* Sigma/Kappa Threshold for advanced methods */}
                      {(tabState.dark.stackingMethod === 'sigma' || tabState.dark.stackingMethod === 'winsorized' || tabState.dark.stackingMethod === 'linear_fit') && (
                        <div className="mb-4">
                          <label className="block font-medium mb-1 text-blue-100">
                            Sigma/Kappa Threshold
                            {tabState.dark.stackingMethod === 'sigma' && (
                              <span className="ml-2 text-xs text-blue-300">(pixels beyond ±{tabState.dark.sigmaThreshold}σ will be rejected)</span>
                            )}
                          </label>
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
                      {/* Percentile Range for percentile clipping */}
                      {tabState.dark.stackingMethod === 'percentile_clip' && (
                        <div className="mb-4">
                          <label className="block font-medium mb-1 text-blue-100">
                            Percentile Range to Keep
                            <span className="ml-2 text-xs text-blue-300">(keep middle {tabState.dark.sigmaThreshold}%, reject {((100 - parseFloat(tabState.dark.sigmaThreshold)) / 2).toFixed(1)}% from each end)</span>
                          </label>
                          <input
                            type="range"
                            min="40"
                            max="90"
                            step="5"
                            value={tabState.dark.sigmaThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, sigmaThreshold: e.target.value } }))}
                            className="w-40 accent-blue-600"
                          />
                          <input
                            type="number"
                            step="5"
                            min="40"
                            max="90"
                            value={tabState.dark.sigmaThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, sigmaThreshold: e.target.value } }))}
                            className="border rounded px-2 py-1 w-20 bg-[#181c23] text-white border-[#232946] ml-2"
                          />
                          <span className="ml-2 text-xs text-blue-300">%</span>
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
                      {/* Select Superdark */}
                      <div className="mb-4">
                        <label className="block font-medium mb-1 text-blue-100">Select Superdark (optional)</label>
                        <select
                          className="bg-[#181c23] text-white border border-[#232946] rounded px-3 py-2 mt-1 w-full"
                          value={selectedSuperdarkPath}
                          onChange={e => setSelectedSuperdarkPath(e.target.value)}
                          disabled={superdarksLoading}
                        >
                          <option value="">Do not use a Superdark</option>
                          {superdarks.map(sd => (
                            <option key={sd.path} value={sd.path}>{sd.name}</option>
                          ))}
                        </select>
                        {superdarksLoading && <div className="text-xs text-blue-300 mt-1">Loading superdarks...</div>}
                        {superdarksError && <div className="text-xs text-red-400 mt-1">Error loading superdarks.</div>}
                      </div>
                      {superdarkPreviewUrl && (
                        <div className="mb-4">
                          <label className="block font-medium mb-1 text-blue-100">Superdark Preview</label>
                          <Image src={superdarkPreviewUrl} alt="Superdark preview" width={200} height={200} className="rounded-lg" />
                        </div>
                      )}
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
                          <div className="flex items-center justify-between mb-3">
                            <label className="block font-medium text-blue-100">Correction Methods</label>
                            <span className="text-xs text-blue-300">
                              {Object.values(tabState.dark.cosmeticMethods).filter(m => m.enabled).length} selected
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {COSMETIC_METHODS.map((method) => (
                              <TooltipProvider key={method.value}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                                                         <div className={`flex items-center justify-between rounded p-3 border cursor-pointer ${
                                       tabState.dark.cosmeticMethods[method.value]?.enabled 
                                         ? 'bg-blue-900/30 border-blue-600/50' 
                                         : 'bg-gray-900/20 border-gray-600/30 hover:bg-gray-800/30'
                                     }`}>
                                       <label className="flex items-center gap-2 cursor-pointer">
                                         <input
                                           type="checkbox"
                                           checked={tabState.dark.cosmeticMethods[method.value]?.enabled || false}
                                           onChange={(e) => handleCosmeticMethodToggle('dark', method.value, e.target.checked)}
                                           className="accent-blue-600"
                                         />
                                         <span className={`font-medium ${
                                           tabState.dark.cosmeticMethods[method.value]?.enabled 
                                             ? 'text-blue-100' 
                                             : 'text-gray-300'
                                         }`}>
                                           {method.label}
                                         </span>
                                       </label>
                                       {tabState.dark.cosmeticMethods[method.value]?.enabled && (
                                         <span className="text-xs bg-blue-700 text-blue-100 px-2 py-1 rounded font-mono">
                                           #{tabState.dark.cosmeticMethods[method.value].order}
                                         </span>
                                       )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <p>{method.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>
                          
                          {/* Conflict warnings */}
                          {getMethodWarnings('dark', '').length > 0 && (
                            <div className="mt-3 text-xs text-amber-300 bg-amber-900/20 rounded p-2 border border-amber-600/30">
                              {getMethodWarnings('dark', '').map((warning, idx) => (
                                <div key={idx}>{warning}</div>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-3 text-xs text-blue-300 bg-blue-900/20 rounded p-2">
                            💡 <strong>Pro tip:</strong> Each method targets different defects - Hot Pixel Map removes sensor defects, 
                            L.A.Cosmic removes cosmic rays, Bad Pixel Masking handles systematic defects.
                            <br/><br/>
                            <strong>Smart Conflicts:</strong> Conflicting methods (like L.A.Cosmic Basic + Enhanced) are automatically disabled to prevent redundancy.
                          </div>

                          {/* Method-specific settings for each enabled method */}
                          {Object.entries(tabState.dark.cosmeticMethods)
                            .filter(([_, config]) => config.enabled)
                            .sort(([_, a], [__, b]) => a.order - b.order)
                            .map(([methodValue, config]) => (
                              <div key={methodValue} className="mt-4 p-4 bg-gray-900/20 rounded-lg border border-gray-600/30">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs bg-blue-700 text-blue-100 px-2 py-1 rounded font-mono">
                                    #{config.order}
                                  </span>
                                  <h5 className="font-medium text-blue-200">
                                    {COSMETIC_METHODS.find(m => m.value === methodValue)?.label} Settings
                                  </h5>
                                </div>

                                {/* Hot Pixel Map Settings */}
                                {methodValue === 'hot_pixel_map' && (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-sm text-blue-200 mb-1">Detection Threshold</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="range"
                                          min="0"
                                          max="1"
                                          step="0.01"
                                          value={tabState.dark.cosmeticThreshold}
                                          onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, cosmeticThreshold: Number(e.target.value) } }))}
                                          className="flex-1 accent-blue-600"
                                        />
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          max="1"
                                          value={tabState.dark.cosmeticThreshold}
                                          onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, cosmeticThreshold: Number(e.target.value) } }))}
                                          className="w-20 bg-[#181c23] text-white border border-[#232946] rounded px-2 py-1 text-sm"
                                        />
                                      </div>
                                      <p className="text-xs text-gray-400 mt-1">Higher values = more aggressive detection</p>
                                    </div>
                                  </div>
                                )}

                                {/* L.A.Cosmic Basic Settings */}
                                {methodValue === 'la_cosmic' && (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-sm text-blue-200 mb-1">Sigma Clipping Threshold</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="range"
                                          min="3"
                                          max="8"
                                          step="0.1"
                                          value={laCosmicParams.sigclip}
                                          onChange={e => setLaCosmicParams(prev => ({ ...prev, sigclip: parseFloat(e.target.value) }))}
                                          className="flex-1 accent-blue-600"
                                        />
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="3"
                                          max="8"
                                          value={laCosmicParams.sigclip}
                                          onChange={e => setLaCosmicParams(prev => ({ ...prev, sigclip: parseFloat(e.target.value) }))}
                                          className="w-20 bg-[#181c23] text-white border border-[#232946] rounded px-2 py-1 text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-sm text-blue-200 mb-1">Gain</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="0.1"
                                          value={laCosmicParams.gain}
                                          onChange={e => setLaCosmicParams(prev => ({ ...prev, gain: parseFloat(e.target.value) }))}
                                          className="w-full bg-[#181c23] text-white border border-[#232946] rounded px-2 py-1 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm text-blue-200 mb-1">Read Noise</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="0.1"
                                          value={laCosmicParams.readnoise}
                                          onChange={e => setLaCosmicParams(prev => ({ ...prev, readnoise: parseFloat(e.target.value) }))}
                                          className="w-full bg-[#181c23] text-white border border-[#232946] rounded px-2 py-1 text-sm"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Bad Pixel Masking Settings */}
                                {methodValue === 'bad_pixel_masking' && (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-sm text-blue-200 mb-1">Detection Sigma Threshold</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="range"
                                          min="2"
                                          max="10"
                                          step="0.1"
                                          value={tabState.dark.badPixelSigmaThreshold}
                                          onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, badPixelSigmaThreshold: Number(e.target.value) } }))}
                                          className="flex-1 accent-blue-600"
                                        />
                                        <input
                                          type="number"
                                          min="2"
                                          max="10"
                                          step="0.1"
                                          value={tabState.dark.badPixelSigmaThreshold}
                                          onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, badPixelSigmaThreshold: Number(e.target.value) } }))}
                                          className="w-20 bg-[#181c23] text-white border border-[#232946] rounded px-2 py-1 text-sm"
                                        />
                                      </div>
                                      <p className="text-xs text-gray-400 mt-1">Higher values = less aggressive masking</p>
                                    </div>
                                    <button
                                      className="px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 text-sm"
                                      onClick={() => handleCosmeticCorrection('badPixelMasking')}
                                      disabled={cosmeticJobs.badPixelMasking?.status === 'running'}
                                    >
                                      {cosmeticJobs.badPixelMasking?.status === 'running' ? 'Running...' : 'Generate Bad Pixel Map'}
                                    </button>
                                                                         {cosmeticJobs?.badPixelMasking && (
                                       <div className="text-xs text-blue-300">
                                         Status: {cosmeticJobs.badPixelMasking.status} | Progress: {cosmeticJobs.badPixelMasking.progress}%
                                       </div>
                                     )}
                                  </div>
                                )}

                                {/* Patterned Noise Removal Settings */}
                                {methodValue === 'patterned_noise_removal' && (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-sm text-blue-200 mb-1">Noise Removal Method</label>
                                      <select
                                        value={tabState.dark.patternedNoiseMethod}
                                        onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, patternedNoiseMethod: e.target.value } }))}
                                        className="w-full bg-[#181c23] text-white border border-[#232946] rounded px-2 py-1 text-sm"
                                      >
                                        <option value="auto">Auto</option>
                                        <option value="median_filter">Median Filter</option>
                                        <option value="fourier_filter">Fourier Filter</option>
                                        <option value="polynomial">Polynomial</option>
                                        <option value="combined">Combined</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm text-blue-200 mb-1">Correction Strength</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="range"
                                          min="0"
                                          max="1"
                                          step="0.01"
                                          value={tabState.dark.patternedNoiseStrength}
                                          onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, patternedNoiseStrength: Number(e.target.value) } }))}
                                          className="flex-1 accent-blue-600"
                                        />
                                        <input
                                          type="number"
                                          min="0"
                                          max="1"
                                          step="0.01"
                                          value={tabState.dark.patternedNoiseStrength}
                                          onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, patternedNoiseStrength: Number(e.target.value) } }))}
                                          className="w-20 bg-[#181c23] text-white border border-[#232946] rounded px-2 py-1 text-sm"
                                        />
                                      </div>
                                    </div>
                                    <button
                                      className="px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 text-sm"
                                      onClick={() => handleCosmeticCorrection('patternedNoise')}
                                      disabled={cosmeticJobs.patternedNoise?.status === 'running'}
                                    >
                                      {cosmeticJobs.patternedNoise?.status === 'running' ? 'Running...' : 'Apply Noise Removal'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}

                          {/* Legacy settings section - keeping for compatibility but should be hidden when new system is active */}
                          {false && (
                            <div className="mt-4">
                              <label className="block font-medium mb-1 text-blue-100">Sigma Threshold</label>
                              <input
                                type="number"
                                min="2"
                                max="10"
                                step="0.1"
                                value={tabState.dark.badPixelSigmaThreshold}
                                onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, badPixelSigmaThreshold: Number(e.target.value) } }))}
                                className="border rounded px-2 py-1 w-24 bg-[#181c23] text-white border-[#232946] ml-2"
                              />
                              <button
                                className="ml-4 px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800"
                                onClick={() => handleCosmeticCorrection('badPixelMasking')}
                                disabled={cosmeticJobs.badPixelMasking?.status === 'running'}
                              >
                                {cosmeticJobs.badPixelMasking?.status === 'running' ? 'Running...' : 'Run Bad Pixel Masking'}
                              </button>
                              {cosmeticJobs.badPixelMasking && (
                                <div className="mt-2 text-xs text-blue-300">
                                  Status: {cosmeticJobs.badPixelMasking.status} | Progress: {cosmeticJobs.badPixelMasking.progress}%
                                </div>
                              )}
                              {cosmeticResults.badPixelMasks && (
                                <div className="mt-2 text-green-400 text-xs">Bad pixel mask generated! (pixels: {cosmeticResults.badPixelMasks.bad_pixels}, columns: {cosmeticResults.badPixelMasks.bad_columns}, rows: {cosmeticResults.badPixelMasks.bad_rows})</div>
                              )}
                            </div>
                          )}
                          {tabState.dark.cosmeticMethods?.patterned_noise_removal?.enabled && (
                            <div className="mt-4">
                              <label className="block font-medium mb-1 text-blue-100">Patterned Noise Method</label>
                              <select
                                className="bg-[#181c23] text-white border border-[#232946] rounded px-3 py-2 mt-1"
                                value={tabState.dark.patternedNoiseMethod}
                                onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, patternedNoiseMethod: e.target.value } }))}
                              >
                                <option value="auto">Auto</option>
                                <option value="median_filter">Median Filter</option>
                                <option value="fourier_filter">Fourier Filter</option>
                                <option value="polynomial">Polynomial</option>
                                <option value="combined">Combined</option>
                              </select>
                              <label className="block font-medium mb-1 text-blue-100 mt-2">Strength</label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={tabState.dark.patternedNoiseStrength}
                                onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, patternedNoiseStrength: Number(e.target.value) } }))}
                                className="w-40 accent-blue-600"
                              />
                              <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.01"
                                value={tabState.dark.patternedNoiseStrength}
                                onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, patternedNoiseStrength: Number(e.target.value) } }))}
                                className="border rounded px-2 py-1 w-20 bg-[#181c23] text-white border-[#232946] ml-2"
                              />
                              {/* Show method-specific params */}
                              {tabState.dark.patternedNoiseMethod === 'median_filter' && (
                                <div className="mt-2">
                                  <label className="block font-medium mb-1 text-blue-100">Gradient Removal Size</label>
                                  <input
                                    type="number"
                                    min="10"
                                    max="200"
                                    step="1"
                                    value={tabState.dark.gradientRemovalSize}
                                    onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, gradientRemovalSize: Number(e.target.value) } }))}
                                    className="border rounded px-2 py-1 w-24 bg-[#181c23] text-white border-[#232946] ml-2"
                                  />
                                </div>
                              )}
                              {tabState.dark.patternedNoiseMethod === 'fourier_filter' && (
                                <div className="mt-2">
                                  <label className="block font-medium mb-1 text-blue-100">Fourier Cutoff Frequency</label>
                                  <input
                                    type="number"
                                    min="0.01"
                                    max="0.5"
                                    step="0.01"
                                    value={tabState.dark.fourierCutoffFreq}
                                    onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, fourierCutoffFreq: Number(e.target.value) } }))}
                                    className="border rounded px-2 py-1 w-24 bg-[#181c23] text-white border-[#232946] ml-2"
                                  />
                                </div>
                              )}
                              {tabState.dark.patternedNoiseMethod === 'polynomial' && (
                                <div className="mt-2">
                                  <label className="block font-medium mb-1 text-blue-100">Polynomial Degree</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    step="1"
                                    value={tabState.dark.polynomialDegree}
                                    onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, polynomialDegree: Number(e.target.value) } }))}
                                    className="border rounded px-2 py-1 w-24 bg-[#181c23] text-white border-[#232946] ml-2"
                                  />
                                </div>
                              )}
                              <button
                                className="ml-4 px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800 mt-2"
                                onClick={() => handleCosmeticCorrection('patternedNoise')}
                                disabled={cosmeticJobs.patternedNoise?.status === 'running'}
                              >
                                {cosmeticJobs.patternedNoise?.status === 'running' ? 'Running...' : 'Run Patterned Noise Removal'}
                              </button>
                              {cosmeticJobs.patternedNoise && (
                                <div className="mt-2 text-xs text-blue-300">
                                  Status: {cosmeticJobs.patternedNoise.status} | Progress: {cosmeticJobs.patternedNoise.progress}%
                                </div>
                              )}
                              {cosmeticResults.patternedNoiseCorrection && (
                                <div className="mt-2 text-green-400 text-xs">Patterned noise correction complete! (improvement: {cosmeticResults.patternedNoiseCorrection.improvement_percent}%)</div>
                              )}
                            </div>
                          )}
                          {/* Existing threshold for legacy methods */}
                          {(tabState.dark.cosmeticMethods?.hot_pixel_map?.enabled || tabState.dark.cosmeticMethods?.la_cosmic?.enabled) && (
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
                          )}
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
                      {/* Dark Optimization */}
                      <div className="mb-4 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="darkOptimization"
                          checked={tabState.dark.darkOptimization || false}
                          onChange={e => setTabState(prev => ({ ...prev, dark: { ...prev.dark, darkOptimization: e.target.checked } }))}
                          className="mr-2 accent-blue-600"
                        />
                        <label htmlFor="darkOptimization" className="font-medium text-blue-100 flex items-center gap-2">
                          Optimize darks (per-light scaling)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-1 px-1 py-0.5 text-[10px] bg-blue-700 text-blue-100 rounded cursor-help">?</span>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={4} className="max-w-xs text-sm">
                                Automatically scales the master dark to best match each light frame. Recommended for advanced users.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </label>
                      </div>
                      {/* Outlier Frame Rejection */}
                      <div className="mb-4 border-t border-blue-900 pt-4 mt-4">
                        <h4 className="font-semibold text-blue-200 mb-2">Outlier Frame Rejection</h4>
                        <button
                          className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800"
                          onClick={handleRunOutlierDetection}
                          disabled={outlierLoading}
                        >
                          {outlierLoading ? 'Detecting...' : 'Run Outlier Detection'}
                        </button>
                        {outlierError && <div className="text-red-400 mt-2">{outlierError}</div>}
                        {outlierResults && (
                          <OutlierReviewTable
                            frames={[...outlierResults.good, ...outlierResults.outliers]}
                            outliers={outlierResults.outliers}
                            sigma={outlierSigma}
                            onSigmaChange={setOutlierSigma}
                            onOverride={handleOverride}
                            overrides={outlierOverrides}
                            loading={outlierLoading}
                            onReRun={handleRunOutlierDetection}
                          />
                        )}
                      </div>
                      {/* Create Superdark Button */}
                      <div className="mb-4">
                        <button
                          className="px-4 py-2 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-800 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                          onClick={openSuperdarkModal}
                        >
                          + Create Superdark
                        </button>
                      </div>
                      
                      {/* Histogram/Distribution Analysis for Dark */}
                      <HistogramAnalysisSection frameType="dark" />
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
                  {selectedType === 'flat' && !tabState.flat.advanced && (
                    <div className="mb-4">
                      <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
                      <div className="flex flex-col gap-2">
                        {BEGINNER_FLAT_STACKING_METHODS.map(bsm => (
                          <Tooltip key={bsm.value}>
                            <TooltipTrigger asChild>
                              <label className="flex items-center gap-2 text-blue-200 cursor-pointer">
                                <input
                                  type="radio"
                                  name="flatStackingMethod"
                                  value={bsm.value}
                                  checked={tabState.flat.stackingMethod === bsm.value}
                                  onChange={() => setTabState(prev => ({ ...prev, flat: { ...prev.flat, stackingMethod: bsm.value } }))}
                                  className="accent-blue-600"
                                />
                                <span>{bsm.label}</span>
                              </label>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={4} className="max-w-xs text-sm">
                              {STACKING_METHOD_TOOLTIPS[bsm.value]}
                            </TooltipContent>
                          </Tooltip>
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
                            <Tooltip key={m.value}>
                              <TooltipTrigger asChild>
                                <label className="flex items-center gap-2 text-blue-200 cursor-pointer">
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
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={4} className="max-w-xs text-sm">
                                {STACKING_METHOD_TOOLTIPS[m.value]}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                      {/* Sigma/Kappa Threshold for advanced methods */}
                      {(tabState.flat.stackingMethod === 'sigma' || tabState.flat.stackingMethod === 'winsorized' || tabState.flat.stackingMethod === 'linear_fit') && (
                        <div className="mb-4">
                          <label className="block font-medium mb-1 text-blue-100">
                            Sigma/Kappa Threshold
                            {tabState.flat.stackingMethod === 'sigma' && (
                              <span className="ml-2 text-xs text-blue-300">(pixels beyond ±{tabState.flat.sigmaThreshold}σ will be rejected)</span>
                            )}
                          </label>
                          <input
                            type="range"
                            min="1.5"
                            max="5"
                            step="0.1"
                            value={tabState.flat.sigmaThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, sigmaThreshold: e.target.value } }))}
                            className="w-40 accent-blue-600"
                          />
                          <input
                            type="number"
                            step="0.1"
                            min="1.5"
                            max="5"
                            value={tabState.flat.sigmaThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, sigmaThreshold: e.target.value } }))}
                            className="border rounded px-2 py-1 w-20 bg-[#181c23] text-white border-[#232946] ml-2"
                          />
                        </div>
                      )}
                      {/* Percentile Range for percentile clipping */}
                      {tabState.flat.stackingMethod === 'percentile_clip' && (
                        <div className="mb-4">
                          <label className="block font-medium mb-1 text-blue-100">
                            Percentile Range to Keep
                            <span className="ml-2 text-xs text-blue-300">(keep middle {tabState.flat.sigmaThreshold}%, reject {((100 - parseFloat(tabState.flat.sigmaThreshold)) / 2).toFixed(1)}% from each end)</span>
                          </label>
                          <input
                            type="range"
                            min="40"
                            max="90"
                            step="5"
                            value={tabState.flat.sigmaThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, sigmaThreshold: e.target.value } }))}
                            className="w-40 accent-blue-600"
                          />
                          <input
                            type="number"
                            step="5"
                            min="40"
                            max="90"
                            value={tabState.flat.sigmaThreshold}
                            onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, sigmaThreshold: e.target.value } }))}
                            className="border rounded px-2 py-1 w-20 bg-[#181c23] text-white border-[#232946] ml-2"
                          />
                          <span className="ml-2 text-xs text-blue-300">%</span>
                        </div>
                      )}
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
                                                    value="multiple_methods"
                        disabled={true}
                          >
                            {COSMETIC_METHODS.map((m: { value: string; label: string }) => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                          {tabState.flat.cosmeticMethods?.bad_pixel_masking?.enabled && (
                            <div className="mt-4">
                              <label className="block font-medium mb-1 text-blue-100">Sigma Threshold</label>
                              <input
                                type="number"
                                min="2"
                                max="10"
                                step="0.1"
                                value={tabState.flat.badPixelSigmaThreshold}
                                onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, badPixelSigmaThreshold: Number(e.target.value) } }))}
                                className="border rounded px-2 py-1 w-24 bg-[#181c23] text-white border-[#232946] ml-2"
                              />
                              <button
                                className="ml-4 px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800"
                                onClick={() => handleCosmeticCorrection('badPixelMasking')}
                                disabled={cosmeticJobs.badPixelMasking?.status === 'running'}
                              >
                                {cosmeticJobs.badPixelMasking?.status === 'running' ? 'Running...' : 'Run Bad Pixel Masking'}
                              </button>
                              {cosmeticJobs.badPixelMasking && (
                                <div className="mt-2 text-xs text-blue-300">
                                  Status: {cosmeticJobs.badPixelMasking.status} | Progress: {cosmeticJobs.badPixelMasking.progress}%
                                </div>
                              )}
                              {cosmeticResults.badPixelMasks && (
                                <div className="mt-2 text-green-400 text-xs">Bad pixel mask generated! (pixels: {cosmeticResults.badPixelMasks.bad_pixels}, columns: {cosmeticResults.badPixelMasks.bad_columns}, rows: {cosmeticResults.badPixelMasks.bad_rows})</div>
                              )}
                            </div>
                          )}
                          {tabState.flat.cosmeticMethods?.patterned_noise_removal?.enabled && (
                            <div className="mt-4">
                              <label className="block font-medium mb-1 text-blue-100">Patterned Noise Method</label>
                              <span className="ml-2 text-xs text-yellow-400">Use with caution: may remove real illumination gradients in flats.</span>
                              <select
                                className="bg-[#181c23] text-white border border-[#232946] rounded px-3 py-2 mt-1"
                                value={tabState.flat.patternedNoiseMethod}
                                onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, patternedNoiseMethod: e.target.value } }))}
                              >
                                <option value="auto">Auto</option>
                                <option value="median_filter">Median Filter</option>
                                <option value="fourier_filter">Fourier Filter</option>
                                <option value="polynomial">Polynomial</option>
                                <option value="combined">Combined</option>
                              </select>
                              <label className="block font-medium mb-1 text-blue-100 mt-2">Strength</label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={tabState.flat.patternedNoiseStrength}
                                onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, patternedNoiseStrength: Number(e.target.value) } }))}
                                className="w-40 accent-blue-600"
                              />
                              <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.01"
                                value={tabState.flat.patternedNoiseStrength}
                                onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, patternedNoiseStrength: Number(e.target.value) } }))}
                                className="border rounded px-2 py-1 w-20 bg-[#181c23] text-white border-[#232946] ml-2"
                              />
                              {tabState.flat.patternedNoiseMethod === 'median_filter' && (
                                <div className="mt-2">
                                  <label className="block font-medium mb-1 text-blue-100">Gradient Removal Size</label>
                                  <input
                                    type="number"
                                    min="10"
                                    max="200"
                                    step="1"
                                    value={tabState.flat.gradientRemovalSize}
                                    onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, gradientRemovalSize: Number(e.target.value) } }))}
                                    className="border rounded px-2 py-1 w-24 bg-[#181c23] text-white border-[#232946] ml-2"
                                  />
                                </div>
                              )}
                              {tabState.flat.patternedNoiseMethod === 'fourier_filter' && (
                                <div className="mt-2">
                                  <label className="block font-medium mb-1 text-blue-100">Fourier Cutoff Frequency</label>
                                  <input
                                    type="number"
                                    min="0.01"
                                    max="0.5"
                                    step="0.01"
                                    value={tabState.flat.fourierCutoffFreq}
                                    onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, fourierCutoffFreq: Number(e.target.value) } }))}
                                    className="border rounded px-2 py-1 w-24 bg-[#181c23] text-white border-[#232946] ml-2"
                                  />
                                </div>
                              )}
                              {tabState.flat.patternedNoiseMethod === 'polynomial' && (
                                <div className="mt-2">
                                  <label className="block font-medium mb-1 text-blue-100">Polynomial Degree</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    step="1"
                                    value={tabState.flat.polynomialDegree}
                                    onChange={e => setTabState(prev => ({ ...prev, flat: { ...prev.flat, polynomialDegree: Number(e.target.value) } }))}
                                    className="border rounded px-2 py-1 w-24 bg-[#181c23] text-white border-[#232946] ml-2"
                                  />
                                </div>
                              )}
                              <button
                                className="ml-4 px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800 mt-2"
                                onClick={() => handleCosmeticCorrection('patternedNoise')}
                                disabled={cosmeticJobs.patternedNoise?.status === 'running'}
                              >
                                {cosmeticJobs.patternedNoise?.status === 'running' ? 'Running...' : 'Run Patterned Noise Removal'}
                              </button>
                              {cosmeticJobs.patternedNoise && (
                                <div className="mt-2 text-xs text-blue-300">
                                  Status: {cosmeticJobs.patternedNoise.status} | Progress: {cosmeticJobs.patternedNoise.progress}%
                                </div>
                              )}
                              {cosmeticResults.patternedNoiseCorrection && (
                                <div className="mt-2 text-green-400 text-xs">Patterned noise correction complete! (improvement: {cosmeticResults.patternedNoiseCorrection.improvement_percent}%)</div>
                              )}
                            </div>
                          )}
                          {(tabState.flat.cosmeticMethods?.hot_pixel_map?.enabled || tabState.flat.cosmeticMethods?.la_cosmic?.enabled) && (
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
                          )}
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
                      {/* Outlier Frame Rejection */}
                      <div className="mb-4 border-t border-blue-900 pt-4 mt-4">
                        <h4 className="font-semibold text-blue-200 mb-2">Outlier Frame Rejection</h4>
                        <button
                          className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800"
                          onClick={handleRunOutlierDetection}
                          disabled={outlierLoading}
                        >
                          {outlierLoading ? 'Detecting...' : 'Run Outlier Detection'}
                        </button>
                        {outlierError && <div className="text-red-400 mt-2">{outlierError}</div>}
                        {outlierResults && (
                          <OutlierReviewTable
                            frames={[...outlierResults.good, ...outlierResults.outliers]}
                            outliers={outlierResults.outliers}
                            sigma={outlierSigma}
                            onSigmaChange={setOutlierSigma}
                            onOverride={handleOverride}
                            overrides={outlierOverrides}
                            loading={outlierLoading}
                            onReRun={handleRunOutlierDetection}
                          />
                        )}
                      </div>

                    </>
                  )}
                  
                  {/* Histogram/Distribution Analysis for Flat */}
                  <HistogramAnalysisSection frameType="flat" />
                </>
              )}
            
            {/* Frame-to-Frame Consistency Analysis - Available for All Frame Types */}
            {realFiles.length >= 2 && (
              <div className="mb-4 border-t border-purple-900 pt-4 mt-4">
                <h4 className="font-semibold text-purple-200 mb-2">Frame-to-Frame Consistency</h4>
                <p className="text-sm text-purple-300 mb-3">
                  Analyze how consistent your {FRAME_TYPES.find(f => f.key === selectedType)?.label.toLowerCase()} frames are with each other for optimal stacking quality.
                </p>
                
                {/* Auto-analysis controls */}
                <div className="mb-3 p-2 bg-purple-900/20 rounded border border-purple-500/30">
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 text-sm text-purple-200">
                      <input
                        type="checkbox"
                        checked={autoConsistencyEnabled}
                        onChange={(e) => setAutoConsistencyEnabled(e.target.checked)}
                        className="accent-purple-600"
                      />
                      Auto-analyze when frames load
                    </label>
                    <label className="flex items-center gap-2 text-sm text-purple-200">
                      <input
                        type="checkbox"
                        checked={smartDefaultsEnabled}
                        onChange={(e) => setSmartDefaultsEnabled(e.target.checked)}
                        className="accent-purple-600"
                        disabled={!autoConsistencyEnabled}
                      />
                      Smart frame pre-selection
                    </label>
                  </div>
                  {smartDefaultsEnabled && autoConsistencyEnabled && (
                    <div className="mt-1 text-xs text-purple-300">
                      Recommended frames will be automatically selected for stacking
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 items-center mb-2">
                  <button
                    className="px-3 py-1 bg-purple-700 text-white rounded hover:bg-purple-800"
                    onClick={handleRunConsistencyAnalysis}
                    disabled={consistencyLoading}
                  >
                    {consistencyLoading ? 'Analyzing...' : 'Analyze Consistency'}
                  </button>
                  {consistencyResults && (
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-purple-200">
                        Score: {consistencyResults.overall_consistency?.toFixed(1)}/10
                      </span>
                      {consistencyResults.overall_consistency >= 8 && (
                        <span className="text-green-400 text-sm">✓ Excellent</span>
                      )}
                      {consistencyResults.overall_consistency >= 6 && consistencyResults.overall_consistency < 8 && (
                        <span className="text-yellow-400 text-sm">⚠ Good</span>
                      )}
                      {consistencyResults.overall_consistency < 6 && (
                        <span className="text-red-400 text-sm">⚠ Poor</span>
                      )}
                    </div>
                  )}
                </div>
                {consistencyError && <div className="text-red-400 mt-2 text-sm">{consistencyError}</div>}
                {consistencyResults && (
                  <FrameConsistencyTable
                    analysis={consistencyResults}
                    onFrameToggle={handleConsistencyFrameToggle}
                    frameSelections={consistencySelections}
                    loading={consistencyLoading}
                  />
                )}
              </div>
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
              <div className="w-full mt-2 mb-4 flex items-center justify-between">
                <div className="flex-1">
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
                {/* Cancel X icon with tooltip */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="ml-3 p-1 rounded-full hover:bg-red-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        onClick={handleCancelJob}
                        disabled={!jobId}
                        aria-label="Cancel Calibration"
                        type="button"
                      >
                        <X className="w-5 h-5 text-red-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Cancel Calibration</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                  <div className="relative">
                    <button
                      ref={presetBtnRef}
                      className="p-2 rounded-full hover:bg-blue-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      onClick={handleSavePreset}
                      aria-label="Save current settings as preset"
                    >
                      <Star className="w-5 h-5 text-blue-200" />
                    </button>
                    {/* Preset menu dropdown with auto direction */}
                    {showPresetMenu && (
                      <div className={`absolute z-50 right-0 w-64 bg-[#181c23] border border-[#232946]/60 rounded-lg shadow-lg p-4 animate-fade-in ${presetMenuDirection === 'down' ? 'mt-2 top-full' : 'mb-2 bottom-full'}`}>
                        <div className="mb-2 font-semibold text-blue-100">Presets for {FRAME_TYPES.find(f => f.key === selectedType)?.label}</div>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            className="border rounded px-2 py-1 w-full bg-[#232946] text-white border-[#232946]"
                            placeholder="Preset name"
                            value={presetNameInput}
                            onChange={e => setPresetNameInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmSavePreset(); }}
                            autoFocus
                          />
                          <button
                            className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800"
                            onClick={confirmSavePreset}
                            disabled={!presetNameInput.trim()}
                          >Save</button>
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {Object.keys(presets[selectedType] || {}).length === 0 ? (
                            <div className="text-blue-300 text-sm">No presets saved yet.</div>
                          ) : (
                            <ul>
                              {Object.keys(presets[selectedType]).map(name => (
                                <li key={name} className="flex items-center justify-between py-1 group">
                                  <button
                                    className="text-blue-200 hover:underline text-left flex-1"
                                    onClick={() => handleLoadPreset(name)}
                                  >{name}</button>
                                  <button
                                    className="ml-2 text-xs text-red-400 opacity-0 group-hover:opacity-100 hover:underline"
                                    onClick={() => handleDeletePreset(name)}
                                  >Delete</button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <button
                          className="mt-3 w-full px-3 py-1 bg-gray-700 text-blue-100 rounded hover:bg-gray-600"
                          onClick={() => setShowPresetMenu(false)}
                        >Close</button>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="animate-fade-in">
                  Save/load calibration preset
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
{(() => {
              // Determine which preview to show: superdark takes priority over master dark
              const isShowingSuperdark = selectedType === 'dark' && selectedSuperdarkPath && superdarkPreviewUrl;
              const displayUrl = isShowingSuperdark ? superdarkPreviewUrl : previewUrl;
              const displayTitle = isShowingSuperdark ? 'Selected Superdark Preview' : 'Master Preview';
              
              if (previewLoading) {
                return (
                  <div className="flex items-center gap-2 mt-4 text-blue-500">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                    <span>Loading preview...</span>
                  </div>
                );
              }
              
              if (displayUrl) {
                console.log('[PreviewPanel JSX] Rendering <img> with displayUrl:', displayUrl);
                return (
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
                            return <>
                              {/* Axis bar */}
                              <line x1={20} y1={80} x2={380} y2={80} stroke="#888" strokeWidth="2" opacity="0.5" />
                              {/* Histogram curve */}
                              <polyline points={hist.map((v: number, i: number) => `${20 + (i / (hist.length - 1)) * 360},${80 - (v / max) * 70}`).join(' ')} fill="none" stroke="#00ffcc" strokeWidth="2.5" opacity="0.95" />
                              {/* 0 and max labels, smaller and flush with bar ends */}
                              <text x={20} y={75} fill="#aaa" fontSize="11" fontWeight="500" textAnchor="start">0</text>
                              <text x={380} y={75} fill="#aaa" fontSize="11" fontWeight="500" textAnchor="end">{maxVal}</text>
                            </>;
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
                );
              } else {
                return (
                  <div className="text-blue-200 text-center mt-8">
                    {previewError || 'No preview available. Run calibration to generate a master frame.'}
                  </div>
                );
              }
            })()}
            {/* Remove the Show Histogram button and replace with an icon */}
 
          </div>
        </div>

        {/* Frame Quality Report */}
        {showQualityReport && qualityAnalysisResults && (
          <div className="mt-6">
            <FrameQualityReport
              summary={qualityAnalysisResults.summary || {
                total_frames: 0,
                accepted_frames: 0,
                flagged_frames: 0,
                rejected_frames: 0,
                average_quality: 0,
                common_issues: [],
                overall_recommendation: ''
              }}
              frameResults={qualityAnalysisResults.frame_results || []}
              rejectedFrames={qualityAnalysisResults.rejected_frames || []}
              onFrameOverride={handleQualityFrameOverride}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button className="px-6 py-2 bg-[#232946] text-white rounded shadow hover:bg-[#181c23]" onClick={handleBack}>Back</button>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded shadow-md hover:bg-blue-700"
            onClick={() => {
              if (allCalibrationsReady) {
                handleNextStep();
              } else {
                setShowSkipDialog(true);
              }
            }}
          >
            Next: Light Frame Calibration & Stacking
          </button>
          {showSkipDialog && (
            <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Proceed Without All Calibration Frames?</DialogTitle>
                  <DialogDescription>
                    You don't have {missingTypes.join(', ')} calibration frame{missingTypes.length > 1 ? 's' : ''}.<br />
                    Skipping calibration may result in suboptimal results. Are you sure you want to continue?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => { setShowSkipDialog(false); handleNextStep(); }}>Proceed Anyway</button>
                  <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={() => setShowSkipDialog(false)}>Go Back</button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {recommendationDialog && (
          <Dialog open={!!recommendationDialog} onOpenChange={() => setRecommendationDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Stacking Recommendation</DialogTitle>
                <DialogDescription>
                  {recommendationDialog?.recommendation?.reason}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 mt-2">
                <div><b>Recommended Method:</b> {recommendationDialog?.recommendation?.method}</div>
                {recommendationDialog?.recommendation?.sigma && (
                  <div><b>Recommended Sigma:</b> {recommendationDialog?.recommendation?.sigma}</div>
                )}
                <div><b>Your Choice:</b> {recommendationDialog?.userMethod}</div>
                {recommendationDialog?.userSigma && (
                  <div><b>Your Sigma:</b> {recommendationDialog?.userSigma}</div>
                )}
              </div>
              <DialogFooter>
                <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={recommendationDialog?.onAccept}>Accept Recommendation</button>
                <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={recommendationDialog?.onDecline}>Keep My Choice</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {/* Show a positive message if cancelMessage is set */}
        {cancelMessage && (
          <div className="w-full mb-2 px-4 py-2 rounded bg-green-700 text-white text-center text-sm animate-fade-in">
            {cancelMessage}
          </div>
        )}
      </div>
      {/* Superdark Creation Modal */}
      <CreateSuperdarkUI
        showSuperdarkModal={showSuperdarkModal}
        setShowSuperdarkModal={setShowSuperdarkModal}
        userId={userId}
        projectId={projectId}
        onSuperdarkCreated={refreshSuperdarks}
      />

      {/* Histogram Analysis Report Modal */}
      {showHistogramReport && histogramAnalysisResults && (
        <Dialog open={showHistogramReport} onOpenChange={setShowHistogramReport}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Histogram Analysis Report
              </DialogTitle>
              <DialogDescription>
                Detailed histogram and distribution analysis results for your calibration frames
              </DialogDescription>
            </DialogHeader>
            <HistogramAnalysisReport
              summary={histogramAnalysisResults.summary || {}}
              frameResults={histogramAnalysisResults.analysis_results?.frame_results || []}
              onFrameAction={handleHistogramFrameAction}
            />
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
};

export default CalibrationScaffoldUI; 