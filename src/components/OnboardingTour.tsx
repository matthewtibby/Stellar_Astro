"use client"

import * as React from 'react';
import { AnimatePresence } from "framer-motion"
import { useEffect } from "react"

// Import extracted constants and types - Phase 1
import {
  ERROR_MESSAGES,
} from './onboarding-tour/constants';

import type {
  DashboardTourContextType,
  DashboardTourProviderProps,
  DashboardTourWelcomeDialogProps,
} from './onboarding-tour/types';

// Import extracted services - Phase 2
import {
  TourContentService,
} from './onboarding-tour/services';

// Import extracted hooks - Phase 3
import {
  useTourState,
  useElementPositioning,
  useTourNavigation,
  useAnimationState,
} from './onboarding-tour/hooks';

// Import extracted UI components - Phase 4
import {
  TourOverlay,
  TourModal,
  ConfettiAnimation,
  WelcomeDialog,
  DemoExample,
} from './onboarding-tour/components';

// Re-export for backward compatibility
export { DASHBOARD_TOUR_STEPS } from './onboarding-tour/constants';
export type { DashboardTourStep } from './onboarding-tour/types';

const DashboardTourContext = React.createContext<DashboardTourContextType | null>(null)

export function DashboardTourProvider({
  children,
  onComplete,
  isTourCompleted = false,
}: DashboardTourProviderProps) {
  // Phase 3: Use extracted hooks for state management
  const tourState = useTourState();
  const { steps, setSteps, currentStep, setCurrentStep, isCompleted, setIsCompleted } = tourState;
  const { showConfetti, setShowConfetti } = useAnimationState(tourState.showConfetti, tourState.setShowConfetti);
  
  // Initialize completed state
  React.useEffect(() => {
    setIsCompleted(isTourCompleted);
  }, [isTourCompleted, setIsCompleted]);

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

  return (
    <DashboardTourContext.Provider
      value={{
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
      }}
    >
      {children}
      
      {/* Phase 4: Use extracted TourModal component */}
      <AnimatePresence>
        {navigation.isActive && positioning.elementPosition && (
          <TourOverlay isVisible={true}>
            <TourModal
              currentStep={currentStep}
              steps={steps}
              elementPosition={positioning.elementPosition}
              onNext={navigation.nextStep}
              onPrevious={navigation.previousStep}
              onClose={navigation.endTour}
              onSkipToStep={navigation.skipToStep}
            />
          </TourOverlay>
        )}
      </AnimatePresence>
      
      {/* Phase 4: Use extracted ConfettiAnimation component */}
      <ConfettiAnimation isVisible={showConfetti} />
    </DashboardTourContext.Provider>
  )
}

export function useDashboardTour() {
  const context = React.useContext(DashboardTourContext)
  if (!context) {
    throw new Error(ERROR_MESSAGES.HOOK_OUTSIDE_PROVIDER)
  }
  return context
}

export function DashboardTourWelcomeDialog({ setIsOpen }: DashboardTourWelcomeDialogProps) {
  const { startTour, steps, isTourCompleted } = useDashboardTour()

  if (isTourCompleted || steps.length === 0) {
    return null
  }

  const handleStart = () => {
    startTour()
    setIsOpen(false)
  }

  const handleSkip = () => {
    setIsOpen(false)
  }

  // Phase 4: Use extracted WelcomeDialog component
  return (
    <WelcomeDialog 
      onStart={handleStart}
      onSkip={handleSkip}
    />
  )
}

// Phase 4: Use extracted DemoExample component
export function DashboardTourExample() {
  const { setSteps } = useDashboardTour()

  useEffect(() => {
    const defaultSteps = TourContentService.createDefaultSteps()
    if (TourContentService.validateSteps(defaultSteps)) {
      setSteps(defaultSteps)
    }
  }, [setSteps])

  return <DemoExample />
}

export default function DashboardTourDemo() {
  return (
    <DashboardTourProvider>
      <DashboardTourExample />
    </DashboardTourProvider>
  )
} 