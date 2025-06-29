import { OUTLIER_DETECTION_ENDPOINT, CONSISTENCY_ANALYSIS_ENDPOINT, HISTOGRAM_ANALYSIS_ENDPOINT } from '../constants/analysisEndpoints';
import { OutlierResult, ConsistencyResult, HistogramResult } from '../types/analysis.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_ANALYSIS_API_BASE_URL || 'http://localhost:8000';

/**
 * Fetch outlier detection results from the API.
 */
export async function fetchOutlierDetection(files: string[], frameType: string, sigmaThreshold: number = 3.0): Promise<{ outliers: OutlierResult[] }> {
  const endpoint = `${API_BASE_URL}${OUTLIER_DETECTION_ENDPOINT}`;
  const body = { fits_paths: files, frame_type: frameType, sigma_thresh: sigmaThreshold };
  console.log('[fetchOutlierDetection] POST', endpoint, body);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[fetchOutlierDetection] Error', response.status, errorText);
    throw new Error(`Outlier detection failed: ${response.statusText}`);
  }
  const json = await response.json();
  console.log('[fetchOutlierDetection] Response', json);
  return json;
}

/**
 * Fetch consistency analysis results from the API.
 */
export async function fetchConsistencyAnalysis(files: string[], frameType: string, consistencyThreshold: number = 0.7): Promise<{ analysis_results: ConsistencyResult[] }> {
  const endpoint = `${API_BASE_URL}${CONSISTENCY_ANALYSIS_ENDPOINT}`;
  const body = { fits_paths: files, frame_type: frameType, consistency_threshold: consistencyThreshold };
  console.log('[fetchConsistencyAnalysis] POST', endpoint, body);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[fetchConsistencyAnalysis] Error', response.status, errorText);
    throw new Error(`Consistency analysis failed: ${response.statusText}`);
  }
  const json = await response.json();
  console.log('[fetchConsistencyAnalysis] Response', json);
  return json;
}

/**
 * Fetch histogram analysis results from the API.
 */
export async function fetchHistogramAnalysis(files: string[], frameType: string): Promise<{ analysis_results: HistogramResult[]; summary?: any }> {
  const endpoint = `${API_BASE_URL}${HISTOGRAM_ANALYSIS_ENDPOINT}`;
  const body = { fits_paths: files, frame_type: frameType };
  console.log('[fetchHistogramAnalysis] POST', endpoint, body);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[fetchHistogramAnalysis] Error', response.status, errorText);
    throw new Error(`Histogram analysis failed: ${response.statusText}`);
  }
  const json = await response.json();
  console.log('[fetchHistogramAnalysis] Response', json);
  return json;
} 