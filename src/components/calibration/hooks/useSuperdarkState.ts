import { useState, useCallback } from 'react';

/**
 * Hook for managing superdark-related calibration state.
 *
 * @returns {object} Superdark state and updaters.
 *   - selectedSuperdarkPath: The selected superdark file path.
 *   - setSelectedSuperdarkPath: Setter for selectedSuperdarkPath.
 *   - superdarkPreviewUrl: The preview URL for the superdark.
 *   - setSuperdarkPreviewUrl: Setter for superdarkPreviewUrl.
 *   - superdarkStats: Stats for the superdark.
 *   - setSuperdarkStats: Setter for superdarkStats.
 *   - superdarkStatsLoading: Whether superdark stats are loading.
 *   - setSuperdarkStatsLoading: Setter for superdarkStatsLoading.
 *   - availableDarks: List of available dark frames.
 *   - setAvailableDarks: Setter for availableDarks.
 *   - selectedDarkPaths: List of selected dark frame paths.
 *   - setSelectedDarkPaths: Setter for selectedDarkPaths.
 *   - superdarkRefetchTrigger: Refetch trigger for superdark data.
 *   - setSuperdarkRefetchTrigger: Setter for superdarkRefetchTrigger.
 */
export function useSuperdarkState() {
  const [selectedSuperdarkPath, setSelectedSuperdarkPath] = useState<string>('');
  const [superdarkPreviewUrl, setSuperdarkPreviewUrl] = useState<string | null>(null);
  const [superdarkStats, setSuperdarkStats] = useState<any>(null);
  const [superdarkStatsLoading, setSuperdarkStatsLoading] = useState<boolean>(false);
  const [availableDarks, setAvailableDarks] = useState<any[]>([]);
  const [selectedDarkPaths, setSelectedDarkPaths] = useState<string[]>([]);
  const [superdarkRefetchTrigger, setSuperdarkRefetchTrigger] = useState<number>(0);

  return {
    selectedSuperdarkPath,
    setSelectedSuperdarkPath,
    superdarkPreviewUrl,
    setSuperdarkPreviewUrl,
    superdarkStats,
    setSuperdarkStats,
    superdarkStatsLoading,
    setSuperdarkStatsLoading,
    availableDarks,
    setAvailableDarks,
    selectedDarkPaths,
    setSelectedDarkPaths,
    superdarkRefetchTrigger,
    setSuperdarkRefetchTrigger,
  };
} 