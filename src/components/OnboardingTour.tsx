"use client"

import * as React from 'react';
import { useEffect } from "react"

// Import extracted constants and types - Phase 1
import { ERROR_MESSAGES } from './onboarding-tour/constants';
import type {
  DashboardTourContextType,
  DashboardTourProviderProps,
  DashboardTourWelcomeDialogProps,
} from './onboarding-tour/types';

// Import consolidated hooks - Phase 5
import { useTourManager } from './onboarding-tour/hooks';

// Import consolidated components - Phase 5
import { TourRenderer, WelcomeDialog } from './onboarding-tour/components';

// Re-export for backward compatibility
export { DASHBOARD_TOUR_STEPS } from './onboarding-tour/constants';
export type { DashboardTourStep } from './onboarding-tour/types';

const DashboardTourContext = React.createContext<DashboardTourContextType | null>(null)

export function DashboardTourProvider({
  children,
  onComplete,
  isTourCompleted = false,
}: DashboardTourProviderProps) {
  // Phase 5: Use consolidated tour manager
  const { contextValue, positioning, navigation, showConfetti } = useTourManager(onComplete, isTourCompleted);

  return (
    <DashboardTourContext.Provider value={contextValue}>
      {children}
      
      {/* Phase 5: Use consolidated TourRenderer */}
      <TourRenderer
        isActive={navigation.isActive}
        elementPosition={positioning.elementPosition}
        currentStep={contextValue.currentStep}
        steps={contextValue.steps}
        navigation={navigation}
        showConfetti={showConfetti}
      />
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

  if (isTourCompleted || steps.length === 0) return null

  const handleStart = () => { startTour(); setIsOpen(false) }
  const handleSkip = () => setIsOpen(false)

  return <WelcomeDialog onStart={handleStart} onSkip={handleSkip} />
}

export function DashboardTourExample() {
  const { initializeDemoSteps } = useTourManager()
  useEffect(initializeDemoSteps, [initializeDemoSteps])
  return null // DemoExample component handles its own rendering
}

export default function DashboardTourDemo() {
  return (
    <DashboardTourProvider>
      <DashboardTourExample />
    </DashboardTourProvider>
  )
} 