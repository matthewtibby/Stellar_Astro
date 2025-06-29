import { useState, useCallback } from 'react';
import { fetchHistogramAnalysis } from '../services/analysisApi';
import { HistogramResult } from '../types/analysis.types';

/**
 * Hook for managing histogram analysis state and operations.
 */
export function useHistogramAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<HistogramResult[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  /**
   * Run histogram analysis.
   */
  const run = useCallback(async (files: string[], frameType: string) => {
    console.log('[useHistogramAnalysis] Triggered run with files:', files, 'frameType:', frameType);
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHistogramAnalysis(files, frameType);
      console.log('[useHistogramAnalysis] Received data:', data);
      setResults(data.analysis_results || []);
      setNotification(data.summary ? 'Histogram analysis completed' : null);
      setLoading(false);
      return data;
    } catch (err) {
      console.error('[useHistogramAnalysis] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Reset histogram analysis state.
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResults([]);
    setNotification(null);
  }, []);

  return { loading, error, results, notification, run, reset, setNotification };
} 