import { SuperdarkJobPayload, JobResult } from '../types/superdark.types';

export class JobService {
  /**
   * Submit superdark creation job to the API
   */
  static async submitSuperdarkJob(
    payload: SuperdarkJobPayload,
    projectId: string
  ): Promise<JobResult> {
    console.log('[DEBUG] Submitting Superdark creation via API:', payload);
    
    // Call our API endpoint
    const res = await fetch(`/api/projects/${projectId}/superdarks/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const resBody = await res.json();
    console.log('[DEBUG] Superdark API response status:', res.status, 'body:', resBody);
    
    if (!res.ok) {
      throw new Error(resBody.error || `HTTP ${res.status}: Failed to create Superdark`);
    }
    
    return {
      jobId: resBody.jobId,
      estimatedTime: resBody.estimatedTime
    };
  }
}
