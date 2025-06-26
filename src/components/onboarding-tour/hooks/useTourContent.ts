import { useMemo } from 'react';
import { TourNavigationService } from '../services';
import type { DashboardTourStep, UseTourContentReturn } from '../types';

/**
 * useTourContent - Manages tour content and provides step information
 * Provides computed properties and utilities for current step content and navigation state
 */
export function useTourContent(
  currentStep: number,
  steps: DashboardTourStep[]
): UseTourContentReturn {
  
  const currentStepData = useMemo(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      return steps[currentStep];
    }
    return null;
  }, [currentStep, steps]);

  const totalSteps = steps.length;

  const isFirstStep = useMemo(() => {
    return TourNavigationService.isFirstStep(currentStep);
  }, [currentStep]);

  const isLastStep = useMemo(() => {
    return TourNavigationService.isLastStep(currentStep, totalSteps);
  }, [currentStep, totalSteps]);

  const stepProgress = useMemo(() => {
    return TourNavigationService.calculateProgress(currentStep, totalSteps);
  }, [currentStep, totalSteps]);

  return {
    currentStepData,
    totalSteps,
    isFirstStep,
    isLastStep,
    stepProgress,
  };
} 