import { DarkFileWithMetadata } from '../types/calibration.types';

/**
 * Get progress message based on completion percentage
 */
export function getProgressMessage(progress: number): string {
  if (progress < 20) return "Preparing and downloading frames...";
  if (progress < 40) return "Analyzing frame quality and gradients...";
  if (progress < 60) return "Calibrating and stacking frames...";
  if (progress < 75) return "Creating master frame...";
  if (progress < 95) return "Uploading results to database...";
  if (progress < 100) return "Loading preview...";
  return "Calibration complete!";
}

/**
 * Group frames by matching characteristics (camera, binning, gain, temperature)
 */
export function groupByMatchingFrames(frames: Array<{ 
  name: string; 
  camera: string; 
  binning: string; 
  gain: string | number; 
  temp: string | number; 
  path: string; 
}>) {
  const groups: Record<string, typeof frames> = {};
  
  frames.forEach(frame => {
    const key = `${frame.camera}-${frame.binning}-${frame.gain}-${frame.temp}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(frame);
  });
  
  return groups;
}

/**
 * API function to generate bad pixel masks
 */
export const generateBadPixelMasks = async (
  projectId: string, 
  userId: string, 
  sigmaThreshold: number = 5.0
) => {
  const COSMETIC_API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : 'https://your-production-api.com';
    
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

/**
 * API function to correct patterned noise
 */
export const correctPatternedNoise = async (
  projectId: string, 
  userId: string, 
  method: string = 'auto', 
  options: any = {}
) => {
  const COSMETIC_API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : 'https://your-production-api.com';
    
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

/**
 * Job status polling function
 */
export const pollJobStatus = async (jobId: string) => {
  const COSMETIC_API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : 'https://your-production-api.com';
    
  const response = await fetch(`${COSMETIC_API_BASE}/jobs/${jobId}/status`);
  return response.json();
}; 