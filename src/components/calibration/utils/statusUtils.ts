import { MasterType, MasterStatus } from '../types/calibration.types';

/**
 * Compute master status for each frame type
 */
export function getMasterStatus(
  type: MasterType, 
  previewUrls: Record<string, string | null>, 
  jobStatus: string, 
  selectedType: MasterType
): MasterStatus {
  if (previewUrls[type]) return 'complete';
  if ((jobStatus === 'queued' || jobStatus === 'running') && selectedType === type) return 'in_progress';
  return 'not_started';
}
