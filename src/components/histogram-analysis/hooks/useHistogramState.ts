import { useState } from 'react';

export interface HistogramUIState {
  expanded: boolean;
  selectedFrame: string | null;
  showStatistics: boolean;
}

export interface HistogramStateActions {
  setExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
  setSelectedFrame: (frame: string | null) => void;
  toggleFrameSelection: (framePath: string) => void;
  setShowStatistics: (show: boolean) => void;
  toggleStatistics: () => void;
  resetState: () => void;
}

export interface UseHistogramStateReturn extends HistogramUIState, HistogramStateActions {}

/**
 * Custom hook for managing histogram analysis UI state
 * Handles expanded sections, frame selection, and statistics visibility
 */
export const useHistogramState = (): UseHistogramStateReturn => {
  const [expanded, setExpanded] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);

  const toggleExpanded = () => setExpanded(!expanded);
  
  const toggleFrameSelection = (framePath: string) => {
    setSelectedFrame(selectedFrame === framePath ? null : framePath);
  };
  
  const toggleStatistics = () => setShowStatistics(!showStatistics);
  
  const resetState = () => {
    setExpanded(false);
    setSelectedFrame(null);
    setShowStatistics(false);
  };

  return {
    // State
    expanded,
    selectedFrame,
    showStatistics,
    
    // Actions
    setExpanded,
    toggleExpanded,
    setSelectedFrame,
    toggleFrameSelection,
    setShowStatistics,
    toggleStatistics,
    resetState,
  };
}; 