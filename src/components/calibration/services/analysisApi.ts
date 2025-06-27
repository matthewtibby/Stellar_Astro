import { OUTLIER_DETECTION_ENDPOINT, CONSISTENCY_ANALYSIS_ENDPOINT, HISTOGRAM_ANALYSIS_ENDPOINT } from '../constants/analysisEndpoints';
import { OutlierResult, ConsistencyResult, HistogramResult } from '../types/analysis.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_ANALYSIS_API_BASE_URL || 'http://localhost:8000';

/**
 * Fetch outlier detection results from the API.
 */
export async function fetchOutlierDetection(files: string[], frameType: string, sigmaThreshold: number = 3.0): Promise<{ outliers: OutlierResult[] }> {
  const response = await fetch(`${API_BASE_URL}${OUTLIER_DETECTION_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fits_paths: files, frame_type: frameType, sigma_thresh: sigmaThreshold }),
  });
  if (!response.ok) {
    throw new Error(`Outlier detection failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch consistency analysis results from the API.
 */
export async function fetchConsistencyAnalysis(files: string[], frameType: string, consistencyThreshold: number = 0.7): Promise<{ analysis_results: ConsistencyResult[] }> {
  const response = await fetch(`${API_BASE_URL}${CONSISTENCY_ANALYSIS_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fits_paths: files, frame_type: frameType, consistency_threshold: consistencyThreshold }),
  });
  if (!response.ok) {
    throw new Error(`Consistency analysis failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch histogram analysis results from the API.
 */
export async function fetchHistogramAnalysis(files: string[], frameType: string): Promise<{ analysis_results: HistogramResult[]; summary?: any }> {
  const response = await fetch(`${API_BASE_URL}${HISTOGRAM_ANALYSIS_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fits_paths: files, frame_type: frameType }),
  });
  if (!response.ok) {
    throw new Error(`Histogram analysis failed: ${response.statusText}`);
  }
  return response.json();
} 