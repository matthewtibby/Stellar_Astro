// Type definitions for calibration components
export type MasterType = 'dark' | 'flat' | 'bias';
export type MasterStatus = 'complete' | 'in_progress' | 'not_started';

export interface TabState {
  advanced: boolean;
  stackingMethod: string;
  sigmaThreshold: string;
  cosmeticCorrection: boolean;
  cosmeticMethods: Record<string, { enabled: boolean; order: number }>;
  cosmeticThreshold: number;
  customRejection: string;
  badPixelMapPath: string;
  
  // Dark-specific
  darkScaling: boolean;
  darkScalingAuto: boolean;
  darkScalingFactor: number;
  biasSubtraction: boolean;
  ampGlowSuppression: boolean;
  tempMatching: boolean;
  exposureMatching: boolean;
  pixelRejectionAlgorithm: string;
  darkOptimization: boolean;
  useSuperdark: boolean;
  superdarkPath: string;
  
  // Flat-specific
  weightParam: string;
  
  // Advanced cosmetic correction parameters
  badPixelSigmaThreshold: number;
  patternedNoiseMethod: string;
  patternedNoiseStrength: number;
  gradientRemovalSize: number;
  fourierCutoffFreq: number;
  polynomialDegree: number;
}

export interface DarkFileWithMetadata {
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

export interface FileMetadata {
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

export interface StackingMethod {
  value: string;
  label: string;
}

export interface CosmeticMethod {
  value: string;
  label: string;
  tooltip: string;
  category: string;
  defaultEnabled: boolean;
  order: number;
  frameTypes: MasterType[];
}

export interface RecommendationDialog {
  recommendation: { method: string; sigma?: number; reason: string };
  userMethod: string;
  userSigma?: number;
  onAccept: () => void;
  onDecline: () => void;
}

// Constants
export const FRAME_TYPES = [
  { key: 'bias', label: 'Master Bias' },
  { key: 'dark', label: 'Master Dark' },
  { key: 'flat', label: 'Master Flat' },
];

export const PLACEHOLDER_FILES = {
  light: Array.from({ length: 104 }, (_, i) => `Light${i + 1}.fits`),
  dark: Array.from({ length: 42 }, (_, i) => `Dark${i + 1}.fits`),
  flat: Array.from({ length: 12 }, (_, i) => `Flat${i + 1}.fits`),
  bias: Array.from({ length: 8 }, (_, i) => `Bias${i + 1}.fits`),
};

export const BEGINNER_DARK_STACKING_METHODS: StackingMethod[] = [
  { value: 'median', label: 'Median' },
  { value: 'mean', label: 'Mean' },
];

export const ADVANCED_DARK_STACKING_METHODS: StackingMethod[] = [
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

export const ADVANCED_BIAS_STACKING_METHODS: StackingMethod[] = [
  { value: 'adaptive', label: 'Auto-stacking (recommended)' },
  { value: 'median', label: 'Median' },
  { value: 'mean', label: 'Mean' },
  { value: 'sigma', label: 'Kappa-Sigma Clipping' },
  { value: 'minmax', label: 'MinMax Rejection' },
  { value: 'superbias', label: 'Superbias (PCA modeling, advanced)' },
];

export const ADVANCED_FLAT_STACKING_METHODS: StackingMethod[] = [
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

export const BEGINNER_FLAT_STACKING_METHODS: StackingMethod[] = [
  { value: 'median', label: 'Median' },
  { value: 'mean', label: 'Mean' },
];

export const STATUS_COLORS: Record<MasterStatus, string> = {
  complete: 'bg-green-500',
  in_progress: 'bg-amber-400',
  not_started: 'bg-red-500',
};

export const STATUS_LABELS: Record<MasterStatus, string> = {
  complete: 'Ready',
  in_progress: 'Processing',
  not_started: 'Not Started',
};

export const COSMETIC_METHODS: CosmeticMethod[] = [
  { 
    value: 'hot_pixel_map', 
    label: 'Hot Pixel Map',
    tooltip: 'Identifies and masks consistently hot pixels by comparing multiple frames. Essential for removing sensor defects.',
    category: 'detection',
    defaultEnabled: true,
    order: 1,
    frameTypes: ['bias', 'dark', 'flat'],
  },
  { 
    value: 'la_cosmic_enhanced', 
    label: 'L.A.Cosmic Enhanced',
    tooltip: 'Advanced cosmic ray detection using L.A.Cosmic algorithm with auto-tuning and multi-method support. Removes high-energy particle strikes.',
    category: 'cosmic_rays',
    defaultEnabled: true,
    order: 2,
    frameTypes: ['dark', 'flat'],
  },
  { 
    value: 'bad_pixel_masking', 
    label: 'Bad Pixel/Column/Row Masking',
    tooltip: 'Masks known bad pixels, columns, and rows based on calibration analysis. Removes systematic sensor defects.',
    category: 'masking',
    defaultEnabled: false,
    order: 3,
    frameTypes: ['dark', 'flat'],
  },
  { 
    value: 'patterned_noise_removal', 
    label: 'Patterned Noise Removal',
    tooltip: 'Removes systematic noise patterns like banding, fixed pattern noise, and readout artifacts using advanced filtering.',
    category: 'noise',
    defaultEnabled: false,
    order: 4,
    frameTypes: ['dark', 'flat'],
  },
  { 
    value: 'la_cosmic', 
    label: 'L.A.Cosmic (Basic)',
    tooltip: 'Standard L.A.Cosmic cosmic ray detection with manual parameters. Use Enhanced version for better results.',
    category: 'cosmic_rays',
    defaultEnabled: false,
    order: 5,
    frameTypes: ['dark', 'flat'],
  },
  { 
    value: 'multi_algorithm', 
    label: 'Multi-Algorithm Detection',
    tooltip: 'Combines multiple cosmic ray detection methods (L.A.Cosmic, sigma clipping, Laplacian) with voting strategies.',
    category: 'cosmic_rays',
    defaultEnabled: false,
    order: 6,
    frameTypes: ['dark', 'flat'],
  },
];

export const COSMIC_RAY_METHODS: StackingMethod[] = [
  { value: 'lacosmic', label: 'L.A.Cosmic (Standard)' },
  { value: 'multi', label: 'Multi-Algorithm' },
  { value: 'auto', label: 'Auto-Select Method' },
  { value: 'sigma_clip', label: 'Sigma Clipping' }
];

export const MULTI_COMBINE_METHODS: StackingMethod[] = [
  { value: 'intersection', label: 'Intersection (Conservative)' },
  { value: 'union', label: 'Union (Aggressive)' },
  { value: 'voting', label: 'Majority Voting' }
];

// API Configuration
export const SUPABASE_INPUT_BUCKET = 'raw-frames';
export const SUPABASE_OUTPUT_BUCKET = 'calibrated-frames';
export const COSMETIC_API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://your-production-api.com';

// Stacking method tooltips
export const STACKING_METHOD_TOOLTIPS: Record<string, string> = {
  adaptive: 'Auto-stacking: Analyzes your frames and picks the best method for you. Recommended for most users.',
  median: 'Median: Robust to outliers and hot pixels. Good for most calibration frames.',
  mean: 'Mean: Averages all frames. Sensitive to outliers, but can reduce noise if all frames are clean.',
  sigma: 'Kappa-Sigma Clipping: Rejects pixels beyond kappa×sigma from the mean, then averages remaining pixels. Standard robust stacking method.',
  percentile_clip: 'Percentile Clipping: Rejects the highest and lowest percentile of pixels, then averages the rest. Good for removing outliers.',
  minmax: 'MinMax Rejection: Rejects the minimum and maximum pixel values, then averages the rest. Simple outlier rejection.',
  winsorized: 'Winsorized Sigma Clipping: Like sigma clipping, but replaces outliers with the clipping threshold instead of removing them.',
  linear_fit: 'Linear Fit Clipping: Fits a linear model to pixel values and rejects outliers based on residuals.',
  entropy_weighted: 'Entropy-Weighted Averaging: Weights pixels based on local entropy. Experimental method for advanced users.',
  superbias: 'Superbias: Principal Component Analysis modeling of bias patterns. Advanced method for high-precision bias correction.',
}; 