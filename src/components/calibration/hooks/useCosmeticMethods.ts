import { useState } from 'react';
import { MasterType } from '../types/calibration.types';

interface LaCosmicParams {
  sigclip: number;
  readnoise: number;
  gain: number;
  satlevel: number;
  objlim: number;
  sigfrac: number;
  niter: number;
  // Additional properties for enhanced L.A.Cosmic
  method: string;
  auto_tune: boolean;
  multi_methods: string[];
  combine_method: string;
  sigma_frac: number;
  analyze_image_quality: boolean;
}

interface CosmeticJobStatus {
  badPixelMasking: 'idle' | 'running' | 'completed' | 'failed';
  patternedNoise: 'idle' | 'running' | 'completed' | 'failed';
}

interface CosmeticResults {
  badPixelMasking: any;
  patternedNoise: any;
}

export const useCosmeticMethods = () => {
  const [laCosmicParams, setLaCosmicParams] = useState<LaCosmicParams>({
    sigclip: 4.5,
    readnoise: 6.5,
    gain: 1.0,
    satlevel: 65535.0,
    objlim: 5.0,
    sigfrac: 0.3,
    niter: 4,
    method: 'lacosmic',
    auto_tune: true,
    multi_methods: ['lacosmic', 'sigma_clip'],
    combine_method: 'intersection',
    sigma_frac: 0.3,
    analyze_image_quality: true,
  });

  const [autoPopulated, setAutoPopulated] = useState<{ 
    readnoise?: boolean; 
    gain?: boolean; 
    satlevel?: boolean 
  }>({});

  const [lastAutoPopulated, setLastAutoPopulated] = useState<{ 
    readnoise?: number; 
    gain?: number; 
    satlevel?: number 
  }>({});

  const [lastMeta, setLastMeta] = useState<any>(null);

  const [cosmeticJobs, setCosmeticJobs] = useState<CosmeticJobStatus>({
    badPixelMasking: 'idle',
    patternedNoise: 'idle',
  });

  const [cosmeticResults, setCosmeticResults] = useState<CosmeticResults>({
    badPixelMasking: null,
    patternedNoise: null,
  });

  // Helper functions for cosmetic methods
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

  const getMethodWarnings = (frameType: MasterType, cosmeticMethods: Record<string, { enabled: boolean; order: number }>, methodValue: string): string[] => {
    const warnings: string[] = [];
    const enabledMethods = Object.entries(cosmeticMethods)
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

  const getEnabledCosmeticMethods = (cosmeticMethods: Record<string, { enabled: boolean; order: number }>) => {
    return Object.entries(cosmeticMethods)
      .filter(([_, config]) => config.enabled)
      .sort(([_, a], [__, b]) => a.order - b.order)
      .map(([methodValue, _]) => methodValue);
  };

  const handleLaCosmicParamChange = (key: keyof LaCosmicParams, value: number) => {
    setLaCosmicParams(prev => ({ ...prev, [key]: value }));
  };

  const handleResetToMetadata = () => {
    if (lastMeta?.readnoise) {
      setLaCosmicParams(prev => ({ ...prev, readnoise: lastMeta.readnoise }));
      setAutoPopulated(prev => ({ ...prev, readnoise: true }));
    }
    if (lastMeta?.gain) {
      setLaCosmicParams(prev => ({ ...prev, gain: lastMeta.gain }));
      setAutoPopulated(prev => ({ ...prev, gain: true }));
    }
    if (lastMeta?.satlevel) {
      setLaCosmicParams(prev => ({ ...prev, satlevel: lastMeta.satlevel }));
      setAutoPopulated(prev => ({ ...prev, satlevel: true }));
    }
  };

  const handleCosmeticCorrection = async (type: 'badPixelMasking' | 'patternedNoise') => {
    setCosmeticJobs(prev => ({ ...prev, [type]: 'running' }));
    
    try {
      const endpoint = type === 'badPixelMasking' ? '/api/cosmetic-masks/generate' : '/api/patterned-noise/correct';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Add appropriate request body based on type
          input_bucket: 'fits-files',
          input_paths: [], // Should be passed as parameter
          output_bucket: 'fits-files',
          output_base: `cosmetic_${type}`,
          project_id: 'current-project', // Should be passed as parameter
          user_id: 'current-user', // Should be passed as parameter
          settings: type === 'badPixelMasking' ? {
            sigma: 5.0,
            min_bad_fraction: 0.01,
          } : {
            method: 'auto',
            filter_size: 50,
            strength: 0.5,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`${type} failed: ${response.statusText}`);
      }

      const jobData = await response.json();
      
      // Poll for completion
      await pollCosmeticJobStatus(jobData.job_id, type);
    } catch (error) {
      console.error(`Error in ${type}:`, error);
      setCosmeticJobs(prev => ({ ...prev, [type]: 'failed' }));
    }
  };

  const pollCosmeticJobStatus = async (jobId: string, type: 'badPixelMasking' | 'patternedNoise') => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs/status?job_id=${jobId}`);
        if (!response.ok) {
          throw new Error('Failed to check job status');
        }

        const statusData = await response.json();
        
        if (statusData.status === 'completed') {
          setCosmeticJobs(prev => ({ ...prev, [type]: 'completed' }));
          setCosmeticResults(prev => ({ ...prev, [type]: statusData.result }));
        } else if (statusData.status === 'failed') {
          setCosmeticJobs(prev => ({ ...prev, [type]: 'failed' }));
        } else {
          // Still running, continue polling
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error(`Error polling ${type} status:`, error);
        setCosmeticJobs(prev => ({ ...prev, [type]: 'failed' }));
      }
    };

    await poll();
  };

  const resetCosmeticMethods = () => {
    setLaCosmicParams({
      sigclip: 4.5,
      readnoise: 6.5,
      gain: 1.0,
      satlevel: 65535.0,
      objlim: 5.0,
      sigfrac: 0.3,
      niter: 4,
      method: 'lacosmic',
      auto_tune: true,
      multi_methods: ['lacosmic', 'sigma_clip'],
      combine_method: 'intersection',
      sigma_frac: 0.3,
      analyze_image_quality: true,
    });
    setAutoPopulated({});
    setLastAutoPopulated({});
    setLastMeta(null);
    setCosmeticJobs({
      badPixelMasking: 'idle',
      patternedNoise: 'idle',
    });
    setCosmeticResults({
      badPixelMasking: null,
      patternedNoise: null,
    });
  };

  return {
    // L.A.Cosmic parameters
    laCosmicParams,
    setLaCosmicParams,
    autoPopulated,
    setAutoPopulated,
    lastAutoPopulated,
    setLastAutoPopulated,
    lastMeta,
    setLastMeta,

    // Cosmetic job management
    cosmeticJobs,
    setCosmeticJobs,
    cosmeticResults,
    setCosmeticResults,

    // Helper functions
    getConflictingMethods,
    getMethodWarnings,
    getEnabledCosmeticMethods,
    handleLaCosmicParamChange,
    handleResetToMetadata,
    handleCosmeticCorrection,
    pollCosmeticJobStatus,
    resetCosmeticMethods,
  };
}; 