import React, { useCallback } from 'react';
import { TourContentService } from '../services';
import { 
  useTourState, 
  useElementPositioning, 
  useTourNavigation, 
  useAnimationState 
} from './';
import type { DashboardTourContextType } from '../types';

/**
 * useTourManager - Comprehensive hook that consolidates all tour logic
 * Combines state, positioning, navigation, and animation management
 */
export const useTourManager = (
  onComplete?: () => void,
  isTourCompleted = false
) => {
  // Consolidated state management
  const tourState = useTourState();
  const { steps, setSteps, currentStep, setCurrentStep, isCompleted, setIsCompleted } = tourState;
  const { showConfetti, setShowConfetti } = useAnimationState(tourState.showConfetti, tourState.setShowConfetti);
  
  // Initialize completed state
  React.useEffect(() => {
    setIsCompleted(isTourCompleted);
  }, [isTourCompleted, setIsCompleted]);

  // Positioning and navigation
  const positioning = useElementPositioning(currentStep, steps);
  const navigation = useTourNavigation(
    currentStep,
    setCurrentStep,
    steps,
    isCompleted,
    setIsCompleted,
    setShowConfetti,
    onComplete
  );

  // Context value factory
  const contextValue: DashboardTourContextType = {
    currentStep,
    totalSteps: steps.length,
    nextStep: navigation.nextStep,
    previousStep: navigation.previousStep,
    endTour: navigation.endTour,
    isActive: navigation.isActive,
    startTour: navigation.startTour,
    setSteps,
    steps,
    isTourCompleted: isCompleted,
    setIsTourCompleted: setIsCompleted,
    skipToStep: navigation.skipToStep,
  };

  // Demo initialization helper
  const initializeDemoSteps = useCallback(() => {
    const defaultSteps = TourContentService.createDefaultSteps();
    if (TourContentService.validateSteps(defaultSteps)) {
      setSteps(defaultSteps);
    }
  }, [setSteps]);

  return {
    contextValue,
    positioning,
    navigation,
    showConfetti,
    initializeDemoSteps,
  };
};
