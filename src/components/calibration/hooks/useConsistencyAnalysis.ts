import { useState, useCallback } from 'react';
import { fetchConsistencyAnalysis } from '../services/analysisApi';
import { ConsistencyResult } from '../types/analysis.types';

/**
 * Hook for managing consistency analysis state and operations.
 */
export function useConsistencyAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ConsistencyResult[]>([]);
  const [selections, setSelections] = useState<Record<string, boolean>>({});

  /**
   * Run consistency analysis.
   */
  const run = useCallback(async (files: string[], frameType: string, consistencyThreshold: number = 0.7) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConsistencyAnalysis(files, frameType, consistencyThreshold);
      setResults(data.analysis_results || []);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Toggle selection for a frame.
   */
  const toggleSelection = useCallback((framePath: string, selected: boolean) => {
    setSelections(prev => ({ ...prev, [framePath]: selected }));
  }, []);

  /**
   * Reset consistency analysis state.
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResults([]);
    setSelections({});
  }, []);

  return { loading, error, results, selections, run, toggleSelection, reset };
} 