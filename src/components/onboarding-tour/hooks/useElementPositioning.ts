import { useState, useCallback, useEffect } from 'react';
import { PositioningService } from '../services';
import type { ElementPosition, UseElementPositioningReturn } from '../types';

/**
 * useElementPositioning - Manages element position tracking and updates
 * Handles DOM element positioning with automatic resize/scroll event management
 */
export function useElementPositioning(
  currentStep: number,
  steps: Array<{ selectorId: string }>
): UseElementPositioningReturn {
  const [elementPosition, setElementPosition] = useState<ElementPosition | null>(null);

  const updateElementPosition = useCallback(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const position = PositioningService.getElementPosition(steps[currentStep]?.selectorId ?? "");
      if (position) {
        setElementPosition(position);
      }
    } else {
      setElementPosition(null);
    }
  }, [currentStep, steps]);

  useEffect(() => {
    updateElementPosition();
    PositioningService.addEventListeners(updateElementPosition);

    return () => {
      PositioningService.removeEventListeners(updateElementPosition);
    };
  }, [updateElementPosition]);

  return {
    elementPosition,
    updateElementPosition,
  };
} 