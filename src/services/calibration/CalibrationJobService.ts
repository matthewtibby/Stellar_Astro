import { createBrowserClient } from '@supabase/ssr';
import { supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { MasterType } from '../../components/calibration/types/calibration.types';

export class CalibrationJobService {
  private supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  /**
   * Submit a calibration job with advanced settings
   */
  async submitJob(settings: {
    selectedType: MasterType;
    realFiles: string[];
    userId: string;
    projectId: string;
    tabState: any;
    selectedMasterBias?: string;
    selectedSuperdarkPath?: string;
    SUPABASE_INPUT_BUCKET: string;
    SUPABASE_OUTPUT_BUCKET: string;
    PLACEHOLDER_FILES: any;
  }) {
    const {
      selectedType,
      realFiles,
      userId,
      projectId,
      tabState,
      selectedMasterBias,
      selectedSuperdarkPath,
      SUPABASE_INPUT_BUCKET,
      SUPABASE_OUTPUT_BUCKET,
      PLACEHOLDER_FILES
    } = settings;

    // Use real files if available, else fallback to placeholder
    const input_paths = realFiles
      .filter(f => f.toLowerCase().endsWith('.fit') || f.toLowerCase().endsWith('.fits'))
      .map(f => `${userId}/${projectId}/${selectedType}/${f}`);
    
    const output_base = `${userId}/${projectId}/${selectedType}/master_${selectedType}`;
    
    // For darks, gather light frame paths for scaling
    let light_input_paths: string[] | undefined = undefined;
    if (selectedType === 'dark') {
      const lightFolder = `${userId}/${projectId}/light/`;
      const { data: lightData, error: lightError } = await this.supabase.storage
        .from('raw-frames')
        .list(lightFolder);
      
      if (!lightError && lightData) {
        light_input_paths = lightData
          .filter(f => f.name.toLowerCase().endsWith('.fit') || f.name.toLowerCase().endsWith('.fits'))
          .map(f => `${userId}/${projectId}/light/${f.name}`);
      }
    }

    const currentTab = tabState[selectedType];
    const reqBody = {
      input_bucket: SUPABASE_INPUT_BUCKET,
      input_paths,
      ...(light_input_paths ? { light_input_paths } : {}),
      output_bucket: SUPABASE_OUTPUT_BUCKET,
      output_base,
      advanced_settings: {
        stackingMethod: currentTab.stackingMethod,
        sigmaThreshold: currentTab.sigmaThreshold,
        ...(selectedType === 'dark' ? {
          darkScaling: currentTab.darkScaling,
          darkScalingAuto: currentTab.darkScalingAuto,
          darkScalingFactor: currentTab.darkScalingFactor,
          biasSubtraction: currentTab.biasSubtraction,
          ...(currentTab.biasSubtraction && selectedMasterBias
            ? { masterBiasPath: selectedMasterBias }
            : {}),
        } : {}),
      },
      projectId,
      userId,
      selectedType,
      ...(currentTab.badPixelMapPath && { badPixelMapPath: currentTab.badPixelMapPath }),
      darkOptimization: currentTab.darkOptimization,
      superdarkPath: selectedSuperdarkPath,
    };

    const res = await fetch(`/api/projects/${projectId}/calibration-jobs/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
    });

    const data = await res.json();
    return {
      jobId: data.jobId || null,
      status: 'queued'
    };
  }

  /**
   * Poll job progress and status
   */
  async pollJobProgress(projectId: string, jobId: string) {
    const res = await fetch(`/api/projects/${projectId}/calibration-jobs/progress?jobId=${jobId}`);
    return await res.json();
  }

  /**
   * Get job results
   */
  async getJobResults(projectId: string, jobId: string) {
    const res = await fetch(`/api/projects/${projectId}/calibration-jobs/results?jobId=${jobId}`);
    return await res.json();
  }

  /**
   * Cancel a running job
   */
  async cancelJob(projectId: string, jobId: string) {
    const res = await fetch(`/api/projects/${projectId}/calibration-jobs/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    return await res.json();
  }

  /**
   * Fetch latest job for a specific frame type
   */
  async getLatestJob(projectId: string, frameType: MasterType) {
    const res = await fetch(`/api/projects/${projectId}/calibration-jobs/latest?type=${frameType}`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  }

  /**
   * Fetch latest results for a frame type
   */
  async getLatestResult(projectId: string, userId: string, frameType: MasterType) {
    const res = await fetch(`/api/projects/${projectId}/calibration-jobs/latest-result?userId=${userId}&frameType=${frameType}`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  }
} 