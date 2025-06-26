"use client"

import * as React from 'react';
import { AnimatePresence, motion } from "framer-motion"
import { 
  ArrowRight, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Lightbulb, 
  Sparkles, 
  X 
} from "lucide-react"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

// Import extracted constants and types - Phase 1
import {
  DASHBOARD_TOUR_STEPS,
  CSS_CLASSES,
  UI_TEXT,
  TOUR_CONFIG,
  ERROR_MESSAGES,
  ICON_SIZES,
} from './onboarding-tour/constants';

import type {
  DashboardTourStep,
  DashboardTourContextType,
  DashboardTourProviderProps,
  DashboardTourWelcomeDialogProps,
} from './onboarding-tour/types';

// Import extracted services - Phase 2
import {
  AnimationService,
  TourNavigationService,
  TourContentService,
} from './onboarding-tour/services';

// Import extracted hooks - Phase 3
import {
  useTourState,
  useElementPositioning,
  useTourNavigation,
  useTourContent,
  useAnimationState,
} from './onboarding-tour/hooks';

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
      <AnimatePresence>
        {navigation.isActive && positioning.elementPosition && (
          <>
            <div className={CSS_CLASSES.OVERLAY}>
              <div className={CSS_CLASSES.MODAL_CONTAINER}>
                <div className={CSS_CLASSES.MODAL_WRAPPER}>
                  <motion.div
                    {...AnimationService.getOverlayAnimation()}
                  >
                    <div className={CSS_CLASSES.MODAL_WRAPPER}>
                      <motion.div
                        {...AnimationService.getModalAnimation()}
                        style={{
                          position: "fixed",
                          top: positioning.elementPosition.top,
                          left: positioning.elementPosition.left,
                          width: positioning.elementPosition.width,
                          height: positioning.elementPosition.height,
                        }}
                      >
                        <div className={CSS_CLASSES.MODAL_CONTENT}>
                          <button
                            className={CSS_CLASSES.CLOSE_BUTTON}
                            onClick={navigation.endTour}
                            aria-label={UI_TEXT.ARIA_LABELS.CLOSE_TOUR}
                          >
                            <X className={ICON_SIZES.MEDIUM} />
                          </button>
                          
                          <div className={CSS_CLASSES.HEADER_SECTION}>
                            {TourContentService.getStepIcon(steps[currentStep]) || <Lightbulb className={`${ICON_SIZES.LARGE} text-primary`} />}
                            <h3 className={CSS_CLASSES.TITLE}>{steps[currentStep]?.title}</h3>
                          </div>
                          
                          <AnimatePresence mode="wait">
                            <div>
                              <motion.div
                                key={`tour-content-${currentStep}`}
                                {...AnimationService.getContentAnimation()}
                                style={{ 
                                  filter: currentStep === -1 ? TOUR_CONFIG.BLUR_FILTERS.INACTIVE : TOUR_CONFIG.BLUR_FILTERS.ACTIVE, 
                                  minHeight: TOUR_CONFIG.MIN_CONTENT_HEIGHT 
                                }}
                              >
                                {TourContentService.getStepContent(steps[currentStep])}
                              </motion.div>
                              
                              <div className={CSS_CLASSES.CONTENT_SECTION}>
                                <div className={CSS_CLASSES.PROGRESS_BAR}>
                                  <div
                                    className={CSS_CLASSES.PROGRESS_FILL}
                                    style={{ width: `${TourNavigationService.calculateProgress(currentStep, steps.length)}%` }}
                                  ></div>
                                </div>
                                
                                <div className={CSS_CLASSES.NAVIGATION_SECTION}>
                                  <div className={CSS_CLASSES.STEP_INDICATORS}>
                                    {steps.map((_, index) => (
                                      <button
                                        key={index}
                                        onClick={() => navigation.skipToStep(index)}
                                        className={cn(
                                          CSS_CLASSES.STEP_DOT,
                                          TourNavigationService.getStepStatus(index, currentStep) === 'active'
                                            ? CSS_CLASSES.STEP_ACTIVE
                                            : TourNavigationService.getStepStatus(index, currentStep) === 'completed'
                                              ? CSS_CLASSES.STEP_COMPLETED
                                              : CSS_CLASSES.STEP_INACTIVE
                                        )}
                                        aria-label={`${UI_TEXT.ARIA_LABELS.GO_TO_STEP} ${index + 1}`}
                                      />
                                    ))}
                                  </div>
                                  
                                  <div className={CSS_CLASSES.NAVIGATION_BUTTONS}>
                                    {TourNavigationService.canGoBack(currentStep) && (
                                      <button
                                        onClick={navigation.previousStep}
                                        className={CSS_CLASSES.BACK_BUTTON}
                                        aria-label={UI_TEXT.ARIA_LABELS.BACK_STEP}
                                      >
                                        <ChevronLeft className={`mr-1 ${ICON_SIZES.SMALL}`} />
                                        {UI_TEXT.NAVIGATION.BACK}
                                      </button>
                                    )}
                                    <button
                                      onClick={navigation.nextStep}
                                      className={CSS_CLASSES.NEXT_BUTTON}
                                      aria-label={TourNavigationService.isLastStep(currentStep, steps.length) ? UI_TEXT.ARIA_LABELS.FINISH_TOUR : UI_TEXT.ARIA_LABELS.NEXT_STEP}
                                    >
                                      {TourNavigationService.isLastStep(currentStep, steps.length) ? (
                                        <>
                                          {UI_TEXT.NAVIGATION.FINISH}
                                          <CheckCircle2 className={`ml-1 ${ICON_SIZES.SMALL}`} />
                                        </>
                                      ) : (
                                        <>
                                          {UI_TEXT.NAVIGATION.NEXT}
                                          <ChevronRight className={`ml-1 ${ICON_SIZES.SMALL}`} />
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
      
      {showConfetti && <Confetti />}
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

  const handleSkip = () => {
    setIsOpen(false)
  }

  return (
    <div className={CSS_CLASSES.WELCOME_CONTAINER}>
      <div className={CSS_CLASSES.BACKDROP}></div>
      <div className={CSS_CLASSES.MODAL_CONTAINER}>
        <div className={CSS_CLASSES.MODAL_WRAPPER}>
          <motion.div
            {...AnimationService.getWelcomeDialogAnimation()}
          >
            <div className={CSS_CLASSES.WELCOME_MODAL}>
              <div className={CSS_CLASSES.WELCOME_HEADER}>
                <motion.div
                  {...AnimationService.getCompassAnimation()}
                  style={{ filter: TOUR_CONFIG.BLUR_FILTERS.ACTIVE, position: "absolute", right: 0, top: 0 }}
                >
                  <Compass className={`${ICON_SIZES.COMPASS} text-primary`} />
                </motion.div>
                <motion.div
                  {...AnimationService.getSparklesAnimation()}
                  style={{ position: "absolute", right: 0, top: 0 }}
                >
                  <Sparkles className={`${ICON_SIZES.EXTRA_LARGE} text-primary`} />
                </motion.div>
              </div>
              <div className={CSS_CLASSES.WELCOME_TEXT_CENTER}>
                <h2 className={CSS_CLASSES.WELCOME_TITLE}>{UI_TEXT.WELCOME.TITLE}</h2>
                <p className={CSS_CLASSES.WELCOME_DESCRIPTION}>
                  {UI_TEXT.WELCOME.DESCRIPTION}
                </p>
                <div className={CSS_CLASSES.WELCOME_BUTTONS}>
                  <button
                    onClick={startTour}
                    className={CSS_CLASSES.START_BUTTON}
                  >
                    {UI_TEXT.WELCOME.START_BUTTON}
                    <ArrowRight className={`ml-2 ${ICON_SIZES.MEDIUM}`} />
                  </button>
                  <button
                    onClick={handleSkip}
                    className={CSS_CLASSES.SKIP_BUTTON}
                  >
                    {UI_TEXT.WELCOME.SKIP_BUTTON}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Example usage component with sample dashboard tour steps
export function DashboardTourExample() {
  const { setSteps } = useDashboardTour()

  useEffect(() => {
    const defaultSteps = TourContentService.createDefaultSteps()
    if (TourContentService.validateSteps(defaultSteps)) {
      setSteps(defaultSteps)
    }
  }, [setSteps])

  return (
    <div className={CSS_CLASSES.DEMO_CONTAINER}>
      <div className={CSS_CLASSES.DEMO_CONTENT}>
        <div className={CSS_CLASSES.DEMO_HEADER}>
          <h1 className={CSS_CLASSES.DEMO_TITLE}>{UI_TEXT.DEMO.TITLE}</h1>
          <p className={CSS_CLASSES.DEMO_DESCRIPTION}>
            {UI_TEXT.DEMO.DESCRIPTION}
          </p>
        </div>

        <div className={CSS_CLASSES.DEMO_GRID}>
          <div id={DASHBOARD_TOUR_STEPS.SIDEBAR_NAVIGATION} className={CSS_CLASSES.DEMO_ITEM}>
            <div className={CSS_CLASSES.DEMO_ITEM_TEXT}>{UI_TEXT.DEMO.SECTIONS.SIDEBAR_NAVIGATION}</div>
          </div>

          <div id={DASHBOARD_TOUR_STEPS.ANALYTICS_OVERVIEW} className={CSS_CLASSES.DEMO_ITEM}>
            <div className={CSS_CLASSES.DEMO_ITEM_TEXT}>{UI_TEXT.DEMO.SECTIONS.ANALYTICS_OVERVIEW}</div>
          </div>

          <div id={DASHBOARD_TOUR_STEPS.QUICK_ACTIONS} className={CSS_CLASSES.DEMO_ITEM}>
            <div className={CSS_CLASSES.DEMO_ITEM_TEXT}>{UI_TEXT.DEMO.SECTIONS.QUICK_ACTIONS}</div>
          </div>

          <div id={DASHBOARD_TOUR_STEPS.RECENT_ACTIVITY} className={CSS_CLASSES.DEMO_ITEM}>
            <div className={CSS_CLASSES.DEMO_ITEM_TEXT}>{UI_TEXT.DEMO.SECTIONS.RECENT_ACTIVITY}</div>
          </div>

          <div id={DASHBOARD_TOUR_STEPS.USER_SETTINGS} className={CSS_CLASSES.DEMO_ITEM}>
            <div className={CSS_CLASSES.DEMO_ITEM_TEXT}>{UI_TEXT.DEMO.SECTIONS.USER_SETTINGS}</div>
          </div>
        </div>
      </div>

      <DashboardTourWelcomeDialog setIsOpen={() => {}} />
    </div>
  )
}

// Simple confetti animation component
function Confetti() {
  const particles = AnimationService.generateConfettiParticles(100)
  
  return (
    <div className={CSS_CLASSES.CONFETTI_CONTAINER}>
      {particles.map((particle) => (
        <div className={CSS_CLASSES.CONFETTI_PARTICLE} key={particle.id}>
          <motion.div
            {...AnimationService.getConfettiAnimation(particle)}
          ></motion.div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardTourDemo() {
  return (
    <DashboardTourProvider>
      <DashboardTourExample />
    </DashboardTourProvider>
  )
} 