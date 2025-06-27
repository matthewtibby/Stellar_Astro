import { MasterType } from './calibration.types';

/**
 * State for a single calibration tab (dark, flat, bias).
 */
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

/**
 * Full calibration state for the enhanced calibration workflow.
 */
export interface CalibrationStateData {
  selectedType: MasterType;
  realFiles: string[];
  tabState: { [K in MasterType]: TabState };
  previewUrls: { [K in MasterType]?: string | null };
  previewLoadings: { [K in MasterType]?: boolean };
  masterStats: any;
  showSuccess: boolean;
  cancelMessage: string | null;
  calibrationStart: number | null;
  calibrationEnd: number | null;
  selectedSuperdarkPath: string;
  superdarkPreviewUrl: string | null;
  superdarkStats: any;
  superdarkStatsLoading: boolean;
  availableDarks: any[];
  selectedDarkPaths: string[];
  superdarkRefetchTrigger: number;
  previewUrl: string | null;
  previewLoading: boolean;
  previewError: string | null;
} 