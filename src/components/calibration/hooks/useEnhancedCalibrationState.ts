import { useState, useCallback, useEffect } from 'react';
import { MasterType } from '../types/calibration.types';

interface TabState {
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

interface CalibrationStateData {
  // Core state
  selectedType: MasterType;
  realFiles: string[];
  tabState: { [K in MasterType]: TabState };
  
  // Preview and results state
  previewUrls: { [K in MasterType]?: string | null };
  previewLoadings: { [K in MasterType]?: boolean };
  masterStats: any;
  
  // Notification state
  showSuccess: boolean;
  cancelMessage: string | null;
  
  // Timing
  calibrationStart: number | null;
  calibrationEnd: number | null;
  
  // Superdark state
  selectedSuperdarkPath: string;
  superdarkPreviewUrl: string | null;
  superdarkStats: any;
  superdarkStatsLoading: boolean;
  availableDarks: any[];
  selectedDarkPaths: string[];
  superdarkRefetchTrigger: number;
  
  // Preview management
  previewUrl: string | null;
  previewLoading: boolean;
  previewError: string | null;
}

export const useEnhancedCalibrationState = () => {
  const [state, setState] = useState<CalibrationStateData>({
    selectedType: 'bias',
    realFiles: [],
    tabState: {
      dark: getDefaultTabState('dark'),
      flat: getDefaultTabState('flat'),
      bias: getDefaultTabState('bias'),
    },
    previewUrls: {},
    previewLoadings: {},
    masterStats: null,
    showSuccess: false,
    cancelMessage: null,
    calibrationStart: null,
    calibrationEnd: null,
    selectedSuperdarkPath: '',
    superdarkPreviewUrl: null,
    superdarkStats: null,
    superdarkStatsLoading: false,
    availableDarks: [],
    selectedDarkPaths: [],
    superdarkRefetchTrigger: 0,
    previewUrl: null,
    previewLoading: false,
    previewError: null,
  });

  // State updaters
  const setSelectedType = useCallback((type: MasterType) => {
    setState(prev => ({ ...prev, selectedType: type }));
  }, []);

  const setRealFiles = useCallback((files: string[]) => {
    setState(prev => ({ ...prev, realFiles: files }));
  }, []);

  const setTabState = useCallback((updater: (prev: { [K in MasterType]: TabState }) => { [K in MasterType]: TabState }) => {
    setState(prev => ({ ...prev, tabState: updater(prev.tabState) }));
  }, []);

  const updateCurrentTab = useCallback((updates: Partial<TabState>) => {
    setState(prev => ({
      ...prev,
      tabState: {
        ...prev.tabState,
        [prev.selectedType]: { ...prev.tabState[prev.selectedType], ...updates }
      }
    }));
  }, []);

  const setPreviewUrls = useCallback((urls: { [K in MasterType]?: string | null }) => {
    setState(prev => ({ ...prev, previewUrls: { ...prev.previewUrls, ...urls } }));
  }, []);

  const setPreviewLoadings = useCallback((loadings: { [K in MasterType]?: boolean }) => {
    setState(prev => ({ ...prev, previewLoadings: { ...prev.previewLoadings, ...loadings } }));
  }, []);

  const setMasterStats = useCallback((stats: any) => {
    setState(prev => ({ ...prev, masterStats: stats }));
  }, []);

  const setShowSuccess = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showSuccess: show }));
  }, []);

  const setCancelMessage = useCallback((message: string | null) => {
    setState(prev => ({ ...prev, cancelMessage: message }));
  }, []);

  const setCalibrationStart = useCallback((start: number | null) => {
    setState(prev => ({ ...prev, calibrationStart: start }));
  }, []);

  const setCalibrationEnd = useCallback((end: number | null) => {
    setState(prev => ({ ...prev, calibrationEnd: end }));
  }, []);

  const setSelectedSuperdarkPath = useCallback((path: string) => {
    setState(prev => ({ ...prev, selectedSuperdarkPath: path }));
  }, []);

  const setSuperdarkPreviewUrl = useCallback((url: string | null) => {
    setState(prev => ({ ...prev, superdarkPreviewUrl: url }));
  }, []);

  const setSuperdarkStats = useCallback((stats: any) => {
    setState(prev => ({ ...prev, superdarkStats: stats }));
  }, []);

  const setSuperdarkStatsLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, superdarkStatsLoading: loading }));
  }, []);

  const setAvailableDarks = useCallback((darks: any[]) => {
    setState(prev => ({ ...prev, availableDarks: darks }));
  }, []);

  const setSelectedDarkPaths = useCallback((paths: string[]) => {
    setState(prev => ({ ...prev, selectedDarkPaths: paths }));
  }, []);

  const setSuperdarkRefetchTrigger = useCallback((trigger: number) => {
    setState(prev => ({ ...prev, superdarkRefetchTrigger: trigger }));
  }, []);

  const setPreviewUrl = useCallback((url: string | null) => {
    setState(prev => ({ ...prev, previewUrl: url }));
  }, []);

  const setPreviewLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, previewLoading: loading }));
  }, []);

  const setPreviewError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, previewError: error }));
  }, []);

  // Complex state operations
  const resetTabState = useCallback((type?: MasterType) => {
    if (type) {
      setState(prev => ({
        ...prev,
        tabState: {
          ...prev.tabState,
          [type]: getDefaultTabState(type)
        }
      }));
    } else {
      setState(prev => ({
        ...prev,
        tabState: {
          dark: getDefaultTabState('dark'),
          flat: getDefaultTabState('flat'),
          bias: getDefaultTabState('bias'),
        }
      }));
    }
  }, []);

  const resetAllState = useCallback(() => {
    setState({
      selectedType: 'bias',
      realFiles: [],
      tabState: {
        dark: getDefaultTabState('dark'),
        flat: getDefaultTabState('flat'),
        bias: getDefaultTabState('bias'),
      },
      previewUrls: {},
      previewLoadings: {},
      masterStats: null,
      showSuccess: false,
      cancelMessage: null,
      calibrationStart: null,
      calibrationEnd: null,
      selectedSuperdarkPath: '',
      superdarkPreviewUrl: null,
      superdarkStats: null,
      superdarkStatsLoading: false,
      availableDarks: [],
      selectedDarkPaths: [],
      superdarkRefetchTrigger: 0,
      previewUrl: null,
      previewLoading: false,
      previewError: null,
    });
  }, []);

  // Computed properties
  const currentTab = state.tabState[state.selectedType];
  const showAdvancedDarkOptions = state.selectedType === 'dark' && currentTab.advanced;
  const hasPreview = !!state.previewUrls[state.selectedType];
  const isLoading = !!state.previewLoadings[state.selectedType];

  // Auto-save state to localStorage
  useEffect(() => {
    localStorage.setItem('calibrationTabState_v2', JSON.stringify(state.tabState));
  }, [state.tabState]);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('calibrationTabState_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, tabState: parsed }));
      } catch (e) {
        console.warn('Failed to load saved calibration state:', e);
      }
    }
  }, []);

  return {
    // State
    ...state,
    
    // Computed properties
    currentTab,
    showAdvancedDarkOptions,
    hasPreview,
    isLoading,
    
    // Updaters
    setSelectedType,
    setRealFiles,
    setTabState,
    updateCurrentTab,
    setPreviewUrls,
    setPreviewLoadings,
    setMasterStats,
    setShowSuccess,
    setCancelMessage,
    setCalibrationStart,
    setCalibrationEnd,
    setSelectedSuperdarkPath,
    setSuperdarkPreviewUrl,
    setSuperdarkStats,
    setSuperdarkStatsLoading,
    setAvailableDarks,
    setSelectedDarkPaths,
    setSuperdarkRefetchTrigger,
    setPreviewUrl,
    setPreviewLoading,
    setPreviewError,
    
    // Complex operations
    resetTabState,
    resetAllState,
  };
};

// Helper function to get default tab state
function getDefaultTabState(type: MasterType): TabState {
  const defaultCosmeticMethods = {
    'hot_pixel_map': { enabled: true, order: 1 },
    'lacosmic_enhanced': { enabled: false, order: 2 },
    'gradient_removal': { enabled: false, order: 3 },
    'fourier_filtering': { enabled: false, order: 4 },
    'polynomial_fitting': { enabled: false, order: 5 },
  };

  const baseState = {
    advanced: false,
    stackingMethod: type === 'flat' ? 'mean' : 'median',
    sigmaThreshold: '3.0',
    cosmeticCorrection: false,
    cosmeticMethods: defaultCosmeticMethods,
    cosmeticThreshold: 0.5,
    customRejection: '',
    badPixelMapPath: '',
    
    // Dark-specific defaults
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
    
    // Flat-specific defaults
    weightParam: '',
    
    // Advanced cosmetic correction parameters
    badPixelSigmaThreshold: 5.0,
    patternedNoiseMethod: 'auto',
    patternedNoiseStrength: 0.5,
    gradientRemovalSize: 50,
    fourierCutoffFreq: 0.1,
    polynomialDegree: 2,
  };

  return baseState;
} 