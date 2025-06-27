import { useCallback } from 'react';
import { FrameAction } from '../types/histogram.types';

export interface FrameActionHandlers {
  handleFrameClick: (framePath: string, currentSelected: string | null, setSelected: (frame: string | null) => void) => void;
  handleFrameAction: (framePath: string, action: FrameAction, onFrameAction?: (path: string, action: FrameAction) => void) => (e: React.MouseEvent) => void;
  getFrameClickHandler: (framePath: string, currentSelected: string | null, setSelected: (frame: string | null) => void) => () => void;
}

/**
 * Custom hook for handling frame actions and interactions
 * Provides optimized event handlers for frame selection and actions
 */
export const useFrameActions = (): FrameActionHandlers => {
  
  const handleFrameClick = useCallback((
    framePath: string, 
    currentSelected: string | null, 
    setSelected: (frame: string | null) => void
  ) => {
    setSelected(currentSelected === framePath ? null : framePath);
  }, []);

  const handleFrameAction = useCallback((
    framePath: string, 
    action: FrameAction, 
    onFrameAction?: (path: string, action: FrameAction) => void
  ) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onFrameAction) {
        onFrameAction(framePath, action);
      }
    };
  }, []);

  const getFrameClickHandler = useCallback((
    framePath: string, 
    currentSelected: string | null, 
    setSelected: (frame: string | null) => void
  ) => {
    return () => handleFrameClick(framePath, currentSelected, setSelected);
  }, [handleFrameClick]);

  return {
    handleFrameClick,
    handleFrameAction,
    getFrameClickHandler,
  };
}; 