import { useState, useCallback } from 'react';
import { fetchOutlierDetection } from '../services/analysisApi';
import { OutlierResult } from '../types/analysis.types';

/**
 * Hook for managing outlier analysis state and operations.
 */
export function useOutlierAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<OutlierResult[]>([]);
  const [overrides, setOverrides] = useState<Record<string, 'keep' | 'remove'>>({});

  /**
   * Run outlier detection analysis.
   */
  const run = useCallback(async (files: string[], frameType: string, sigmaThreshold: number = 3.0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOutlierDetection(files, frameType, sigmaThreshold);
      setResults(data.outliers || []);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Override the suggested action for a frame.
   */
  const override = useCallback((framePath: string, action: 'keep' | 'remove') => {
    setOverrides(prev => ({ ...prev, [framePath]: action }));
  }, []);

  /**
   * Reset outlier analysis state.
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResults([]);
    setOverrides({});
  }, []);

  return { loading, error, results, overrides, run, override, reset };
} 