import { useState, useCallback } from 'react';
import { MasterType } from '../types/calibration.types';
import { TabState } from '../types/calibrationState.types';
import { getDefaultTabState } from '../utils/calibrationStateUtils';

/**
 * Hook for managing core calibration state: selectedType, realFiles, tabState.
 *
 * @returns {object} Core calibration state and updaters.
 *   - selectedType: The currently selected master type.
 *   - setSelectedType: Setter for selectedType.
 *   - realFiles: List of real file paths.
 *   - setRealFiles: Setter for realFiles.
 *   - tabState: Per-type tab state.
 *   - setTabState: Setter for tabState.
 *   - updateCurrentTab: Update a specific tab's state.
 */
export function useCalibrationCoreState() {
  const [selectedType, setSelectedType] = useState<MasterType>('bias');
  const [realFiles, setRealFiles] = useState<string[]>([]);
  const [tabState, setTabState] = useState<{ [K in MasterType]: TabState }>({
    dark: getDefaultTabState('dark'),
    flat: getDefaultTabState('flat'),
    bias: getDefaultTabState('bias'),
  });

  /**
   * Update a specific tab's state by type.
   */
  const updateCurrentTab = useCallback((type: MasterType, updates: Partial<TabState>) => {
    setTabState(prev => ({
      ...prev,
      [type]: { ...prev[type], ...updates },
    }));
  }, []);

  return {
    selectedType,
    setSelectedType,
    realFiles,
    setRealFiles,
    tabState,
    setTabState,
    updateCurrentTab,
  };
} 