import { useState, useCallback } from 'react';
import type { DashboardTourStep, UseTourStateReturn } from '../types';

/**
 * useTourState - Manages core tour state including steps, completion, and confetti
 * Provides centralized state management for tour progression and configuration
 */
export function useTourState(): UseTourStateReturn {
  const [steps, setSteps] = useState<DashboardTourStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const updateSteps = useCallback((newSteps: DashboardTourStep[]) => {
    setSteps(newSteps);
  }, []);

  const updateCurrentStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const updateIsCompleted = useCallback((completed: boolean) => {
    setIsCompleted(completed);
  }, []);

  const updateShowConfetti = useCallback((show: boolean) => {
    setShowConfetti(show);
  }, []);

  return {
    steps,
    setSteps: updateSteps,
    currentStep,
    setCurrentStep: updateCurrentStep,
    isCompleted,
    setIsCompleted: updateIsCompleted,
    showConfetti,
    setShowConfetti: updateShowConfetti,
  };
} 