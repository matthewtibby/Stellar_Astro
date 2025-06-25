import { useState, useRef } from 'react';

export type MasterType = 'dark' | 'flat' | 'bias';
export type MasterStatus = 'complete' | 'in_progress' | 'not_started';

// Default cosmetic methods configuration
const COSMETIC_METHODS = [
  { value: 'hot_pixel_map', label: 'Hot Pixel Mapping', defaultEnabled: false, order: 1 },
  { value: 'la_cosmic', label: 'L.A.Cosmic', defaultEnabled: false, order: 2 },
  // ... other methods
];

interface TabState {
  advanced: boolean;
  stackingMethod: string;
  sigmaThreshold: string;
  cosmeticCorrection: boolean;
  cosmeticMethods: Record<string, { enabled: boolean; order: number }>;
  cosmeticThreshold: number;
  customRejection: string;
  badPixelMapPath: string;
  // Frame-specific properties
  darkScaling?: boolean;
  darkScalingAuto?: boolean;
  darkScalingFactor?: number;
  biasSubtraction?: boolean;
  ampGlowSuppression?: boolean;
  tempMatching?: boolean;
  exposureMatching?: boolean;
  pixelRejectionAlgorithm?: string;
  darkOptimization?: boolean;
  useSuperdark?: boolean;
  superdarkPath?: string;
  weightParam?: string;
  // Advanced cosmetic correction parameters
  badPixelSigmaThreshold: number;
  patternedNoiseMethod: string;
  patternedNoiseStrength: number;
  gradientRemovalSize: number;
  fourierCutoffFreq: number;
  polynomialDegree: number;
}

export const useCalibrationState = () => {
  const [selectedType, setSelectedType] = useState<MasterType>('bias');
  const [jobStatus, setJobStatus] = useState<'idle' | 'queued' | 'running' | 'success' | 'failed'>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [realFiles, setRealFiles] = useState<string[]>([]);

  const [tabState, setTabState] = useState<Record<MasterType, TabState>>({
    dark: getDefaultTabState('dark'),
    flat: getDefaultTabState('flat'),
    bias: getDefaultTabState('bias'),
  });

  // Helper to get default tab state for a given type
  function getDefaultTabState(type: MasterType): TabState {
    const defaultCosmeticMethods = COSMETIC_METHODS.reduce((acc, method) => {
      acc[method.value] = { enabled: method.defaultEnabled, order: method.order };
      return acc;
    }, {} as Record<string, { enabled: boolean; order: number }>);

    const baseState = {
      advanced: false,
      sigmaThreshold: '3.0',
      cosmeticCorrection: false,
      cosmeticMethods: defaultCosmeticMethods,
      cosmeticThreshold: 0.5,
      customRejection: '',
      badPixelMapPath: '',
      badPixelSigmaThreshold: 5.0,
      patternedNoiseMethod: 'auto',
      patternedNoiseStrength: 0.5,
      gradientRemovalSize: 50,
      fourierCutoffFreq: 0.1,
      polynomialDegree: 2,
    };

    if (type === 'dark') {
      return {
        ...baseState,
        stackingMethod: 'median',
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
        weightParam: '',
      };
    } else if (type === 'flat') {
      return {
        ...baseState,
        stackingMethod: 'mean',
        weightParam: '',
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
      };
    } else {
      return {
        ...baseState,
        stackingMethod: 'median',
        // Dark-specific properties (unused)
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
        weightParam: '',
      };
    }
  }

  // Helper to get/set current tab state
  const currentTab = tabState[selectedType];
  const setCurrentTab = (updates: Partial<TabState>) => setTabState(prev => ({
    ...prev,
    [selectedType]: { ...prev[selectedType], ...updates }
  }));

  const handleResetCurrent = () => {
    setTabState(prev => ({
      ...prev,
      [selectedType]: getDefaultTabState(selectedType)
    }));
  };

  const handleResetAll = () => {
    setTabState({
      dark: getDefaultTabState('dark'),
      flat: getDefaultTabState('flat'),
      bias: getDefaultTabState('bias'),
    });
  };

  return {
    selectedType,
    setSelectedType,
    jobStatus,
    setJobStatus,
    showSuccess,
    setShowSuccess,
    jobProgress,
    setJobProgress,
    jobId,
    setJobId,
    realFiles,
    setRealFiles,
    tabState,
    setTabState,
    currentTab,
    setCurrentTab,
    handleResetCurrent,
    handleResetAll,
    getDefaultTabState,
  };
}; 