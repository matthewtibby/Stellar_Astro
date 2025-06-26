import { useState } from 'react';
import { MasterType } from '../types/calibration.types';

export const useLocalState = () => {
  // Analysis and UI state
  const [qualityAnalysisResults, setQualityAnalysisResults] = useState<any>(null);
  const [showHistogramReport, setShowHistogramReport] = useState(false);
  const [lastMeta, setLastMeta] = useState<any>(null);
  const [lastAutoPopulated, setLastAutoPopulated] = useState<any>({});
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  
  // Preset management state
  const [presetNameInput, setPresetNameInput] = useState('');
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [presetMenuDirection, setPresetMenuDirection] = useState<'up' | 'down'>('down');
  const [presets, setPresets] = useState<{ [K in MasterType]: Record<string, any> }>({ dark: {}, flat: {}, bias: {} });
  
  // Preview loadings state
  const [previewLoadings, setPreviewLoadings] = useState<{ [K in MasterType]?: boolean }>({});

  // L.A.Cosmic parameters state
  const [laCosmicParams, setLaCosmicParams] = useState({
    readnoise: 6.5,
    gain: 1.0,
    satlevel: 65535
  });
  const [autoPopulated, setAutoPopulated] = useState({
    readnoise: false,
    gain: false,
    satlevel: false
  });
  
  // Master bias options state
  const [masterBiasOptions, setMasterBiasOptions] = useState<{ path: string, name: string }[]>([]);
  const [selectedMasterBias, setSelectedMasterBias] = useState<string>('');

  // Feature flags
  const [autoConsistencyEnabled, setAutoConsistencyEnabled] = useState(true);
  const [smartDefaultsEnabled, setSmartDefaultsEnabled] = useState(true);

  // Cosmetic correction jobs state
  const [cosmeticJobs, setCosmeticJobs] = useState<{
    badPixelMasking?: { jobId: string; status: string; progress: number };
    patternedNoise?: { jobId: string; status: string; progress: number };
  }>({});
  const [cosmeticResults, setCosmeticResults] = useState<{
    badPixelMasks?: any;
    patternedNoiseCorrection?: any;
  }>({});

  return {
    // Analysis and UI state
    qualityAnalysisResults,
    setQualityAnalysisResults,
    showHistogramReport,
    setShowHistogramReport,
    lastMeta,
    setLastMeta,
    lastAutoPopulated,
    setLastAutoPopulated,
    cancelMessage,
    setCancelMessage,
    
    // Preset management state
    presetNameInput,
    setPresetNameInput,
    showPresetMenu,
    setShowPresetMenu,
    presetMenuDirection,
    setPresetMenuDirection,
    presets,
    setPresets,
    
    // Preview loadings state
    previewLoadings,
    setPreviewLoadings,

    // L.A.Cosmic parameters state
    laCosmicParams,
    setLaCosmicParams,
    autoPopulated,
    setAutoPopulated,
    
    // Master bias options state
    masterBiasOptions,
    setMasterBiasOptions,
    selectedMasterBias,
    setSelectedMasterBias,

    // Feature flags
    autoConsistencyEnabled,
    setAutoConsistencyEnabled,
    smartDefaultsEnabled,
    setSmartDefaultsEnabled,

    // Cosmetic correction jobs state
    cosmeticJobs,
    setCosmeticJobs,
    cosmeticResults,
    setCosmeticResults,
  };
};
