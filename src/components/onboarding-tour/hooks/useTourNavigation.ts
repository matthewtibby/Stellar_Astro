import { useCallback } from 'react';
import { TourNavigationService } from '../services';
import { ANIMATION_CONFIG } from '../constants';
import type { UseTourNavigationReturn } from '../types';

/**
 * useTourNavigation - Manages tour navigation logic and step transitions
 * Provides methods for navigating through tour steps with validation and completion handling
 */
export function useTourNavigation(
  currentStep: number,
  setCurrentStep: (step: number) => void,
  steps: Array<any>,
  isTourCompleted: boolean,
  setIsTourCompleted: (completed: boolean) => void,
  setShowConfetti: (show: boolean) => void,
  onComplete?: () => void
): UseTourNavigationReturn {
  
  const nextStep = useCallback(() => {
    setCurrentStep((prev: number) => {
      const nextIndex = TourNavigationService.getNextStepIndex(prev, steps.length);
      
      if (TourNavigationService.shouldShowConfetti(prev, steps.length)) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), ANIMATION_CONFIG.CONFETTI.SHOW_DURATION);
      }
      
      return nextIndex;
    });

    if (TourNavigationService.isLastStep(currentStep, steps.length)) {
      setIsTourCompleted(true);
      onComplete?.();
    }
  }, [currentStep, steps.length, setCurrentStep, setShowConfetti, setIsTourCompleted, onComplete]);

  const previousStep = useCallback(() => {
    setCurrentStep(TourNavigationService.getPreviousStepIndex(currentStep));
  }, [currentStep, setCurrentStep]);

  const skipToStep = useCallback((stepIndex: number) => {
    if (TourNavigationService.validateStepIndex(stepIndex, steps.length)) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length, setCurrentStep]);

  const endTour = useCallback(() => {
    setCurrentStep(-1);
  }, [setCurrentStep]);

  const startTour = useCallback(() => {
    if (isTourCompleted) {
      return;
    }
    setCurrentStep(0);
  }, [isTourCompleted, setCurrentStep]);

  const isActive = currentStep >= 0;

  return {
    nextStep,
    previousStep,
    skipToStep,
    endTour,
    startTour,
    isActive,
  };
} 