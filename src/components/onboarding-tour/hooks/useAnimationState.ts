import { useCallback } from 'react';
import { ANIMATION_CONFIG } from '../constants';
import type { UseAnimationStateReturn } from '../types';

/**
 * useAnimationState - Manages animation state and confetti effects
 * Provides utilities for triggering and managing tour animations
 */
export function useAnimationState(
  showConfetti: boolean,
  setShowConfetti: (show: boolean) => void
): UseAnimationStateReturn {
  
  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, ANIMATION_CONFIG.CONFETTI.SHOW_DURATION);
  }, [setShowConfetti]);

  const updateShowConfetti = useCallback((show: boolean) => {
    setShowConfetti(show);
  }, [setShowConfetti]);

  return {
    showConfetti,
    setShowConfetti: updateShowConfetti,
    triggerConfetti,
  };
} 