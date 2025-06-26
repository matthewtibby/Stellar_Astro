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
import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

// Import extracted constants and types - Phase 1
import {
  DASHBOARD_TOUR_STEPS,
  ANIMATION_CONFIG,
  CSS_CLASSES,
  UI_TEXT,
  TOUR_CONFIG,
  ERROR_MESSAGES,
  ICON_SIZES,
} from './onboarding-tour/constants';

import type {
  DashboardTourStep,
  ElementPosition,
  DashboardTourContextType,
  DashboardTourProviderProps,
  DashboardTourWelcomeDialogProps,
} from './onboarding-tour/types';

// Re-export for backward compatibility
export { DASHBOARD_TOUR_STEPS } from './onboarding-tour/constants';
export type { DashboardTourStep } from './onboarding-tour/types';

const DashboardTourContext = React.createContext<DashboardTourContextType | null>(null)

function getElementPosition(id: string): ElementPosition | null {
  const element = document.getElementById(id)
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

export function DashboardTourProvider({
  children,
  onComplete,
  isTourCompleted = false,
}: DashboardTourProviderProps) {
  const [steps, setSteps] = useState<DashboardTourStep[]>([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [elementPosition, setElementPosition] = useState<ElementPosition | null>(null)
  const [isCompleted, setIsCompleted] = useState(isTourCompleted)
  const [showConfetti, setShowConfetti] = useState(false)

  const updateElementPosition = useCallback(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const position = getElementPosition(steps[currentStep]?.selectorId ?? "")
      if (position) {
        setElementPosition(position)
      }
    }
  }, [currentStep, steps])

  useEffect(() => {
    updateElementPosition()
    window.addEventListener("resize", updateElementPosition)
    window.addEventListener("scroll", updateElementPosition)

    return () => {
      window.removeEventListener("resize", updateElementPosition)
      window.removeEventListener("scroll", updateElementPosition)
    }
  }, [updateElementPosition])

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= steps.length - 1) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), ANIMATION_CONFIG.CONFETTI.SHOW_DURATION)
        return -1
      }
      return prev + 1
    })

    if (currentStep === steps.length - 1) {
      setIsTourCompleted(true)
      onComplete?.()
    }
  }, [steps.length, onComplete, currentStep])

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev))
  }, [])

  const skipToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex)
    }
  }, [steps.length])

  const endTour = useCallback(() => {
    setCurrentStep(-1)
  }, [])

  const startTour = useCallback(() => {
    if (isTourCompleted) {
      return
    }
    setCurrentStep(0)
  }, [isTourCompleted])

  const setIsTourCompleted = useCallback((completed: boolean) => {
    setIsCompleted(completed)
  }, [])

  return (
    <DashboardTourContext.Provider
      value={{
        currentStep,
        totalSteps: steps.length,
        nextStep,
        previousStep,
        endTour,
        isActive: currentStep >= 0,
        startTour,
        setSteps,
        steps,
        isTourCompleted: isCompleted,
        setIsTourCompleted,
        skipToStep,
      }}
    >
      {children}
      <AnimatePresence>
        {currentStep >= 0 && elementPosition && (
          <>
            <div className={CSS_CLASSES.OVERLAY}>
              <div className={CSS_CLASSES.MODAL_CONTAINER}>
                <div className={CSS_CLASSES.MODAL_WRAPPER}>
                  <motion.div
                    initial={ANIMATION_CONFIG.OVERLAY.INITIAL}
                    animate={ANIMATION_CONFIG.OVERLAY.ANIMATE}
                    exit={ANIMATION_CONFIG.OVERLAY.EXIT}
                  >
                    <div className={CSS_CLASSES.MODAL_WRAPPER}>
                      <motion.div
                        initial={ANIMATION_CONFIG.MODAL.INITIAL}
                        animate={ANIMATION_CONFIG.MODAL.ANIMATE}
                        exit={ANIMATION_CONFIG.MODAL.EXIT}
                        style={{
                          position: "fixed",
                          top: elementPosition.top,
                          left: elementPosition.left,
                          width: elementPosition.width,
                          height: elementPosition.height,
                        }}
                      >
                        <div className={CSS_CLASSES.MODAL_CONTENT}>
                          <button
                            className={CSS_CLASSES.CLOSE_BUTTON}
                            onClick={endTour}
                            aria-label={UI_TEXT.ARIA_LABELS.CLOSE_TOUR}
                          >
                            <X className={ICON_SIZES.MEDIUM} />
                          </button>
                          
                          <div className={CSS_CLASSES.HEADER_SECTION}>
                            {steps[currentStep]?.icon || <Lightbulb className={`${ICON_SIZES.LARGE} text-primary`} />}
                            <h3 className={CSS_CLASSES.TITLE}>{steps[currentStep]?.title}</h3>
                          </div>
                          
                          <AnimatePresence mode="wait">
                            <div>
                              <motion.div
                                key={`tour-content-${currentStep}`}
                                initial={ANIMATION_CONFIG.CONTENT.INITIAL}
                                animate={ANIMATION_CONFIG.CONTENT.ANIMATE}
                                exit={ANIMATION_CONFIG.CONTENT.EXIT}
                                style={{ 
                                  filter: currentStep === -1 ? TOUR_CONFIG.BLUR_FILTERS.INACTIVE : TOUR_CONFIG.BLUR_FILTERS.ACTIVE, 
                                  minHeight: TOUR_CONFIG.MIN_CONTENT_HEIGHT 
                                }}
                                transition={ANIMATION_CONFIG.CONTENT.TRANSITION}
                              >
                                {steps[currentStep]?.content}
                              </motion.div>
                              
                              <div className={CSS_CLASSES.CONTENT_SECTION}>
                                <div className={CSS_CLASSES.PROGRESS_BAR}>
                                  <div
                                    className={CSS_CLASSES.PROGRESS_FILL}
                                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                  ></div>
                                </div>
                                
                                <div className={CSS_CLASSES.NAVIGATION_SECTION}>
                                  <div className={CSS_CLASSES.STEP_INDICATORS}>
                                    {steps.map((_, index) => (
                                      <button
                                        key={index}
                                        onClick={() => skipToStep(index)}
                                        className={cn(
                                          CSS_CLASSES.STEP_DOT,
                                          index === currentStep 
                                            ? CSS_CLASSES.STEP_ACTIVE
                                            : index < currentStep 
                                              ? CSS_CLASSES.STEP_COMPLETED
                                              : CSS_CLASSES.STEP_INACTIVE
                                        )}
                                        aria-label={`${UI_TEXT.ARIA_LABELS.GO_TO_STEP} ${index + 1}`}
                                      />
                                    ))}
                                  </div>
                                  
                                  <div className={CSS_CLASSES.NAVIGATION_BUTTONS}>
                                    {currentStep > 0 && (
                                      <button
                                        onClick={previousStep}
                                        className={CSS_CLASSES.BACK_BUTTON}
                                        aria-label={UI_TEXT.ARIA_LABELS.BACK_STEP}
                                      >
                                        <ChevronLeft className={`mr-1 ${ICON_SIZES.SMALL}`} />
                                        {UI_TEXT.NAVIGATION.BACK}
                                      </button>
                                    )}
                                    <button
                                      onClick={nextStep}
                                      className={CSS_CLASSES.NEXT_BUTTON}
                                      aria-label={currentStep === steps.length - 1 ? UI_TEXT.ARIA_LABELS.FINISH_TOUR : UI_TEXT.ARIA_LABELS.NEXT_STEP}
                                    >
                                      {currentStep === steps.length - 1 ? (
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
            initial={ANIMATION_CONFIG.WELCOME_DIALOG.INITIAL}
            animate={ANIMATION_CONFIG.WELCOME_DIALOG.ANIMATE}
            transition={ANIMATION_CONFIG.WELCOME_DIALOG.TRANSITION}
          >
            <div className={CSS_CLASSES.WELCOME_MODAL}>
              <div className={CSS_CLASSES.WELCOME_HEADER}>
                <motion.div
                  initial={ANIMATION_CONFIG.COMPASS.INITIAL}
                  animate={ANIMATION_CONFIG.COMPASS.ANIMATE}
                  style={{ filter: TOUR_CONFIG.BLUR_FILTERS.ACTIVE, position: "absolute", right: 0, top: 0 }}
                  transition={ANIMATION_CONFIG.COMPASS.TRANSITION}
                >
                  <Compass className={`${ICON_SIZES.COMPASS} text-primary`} />
                </motion.div>
                <motion.div
                  initial={ANIMATION_CONFIG.SPARKLES.INITIAL}
                  animate={ANIMATION_CONFIG.SPARKLES.ANIMATE}
                  style={{ position: "absolute", right: 0, top: 0 }}
                  transition={ANIMATION_CONFIG.SPARKLES.TRANSITION}
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
    setSteps([
      {
        title: "Navigation Sidebar",
        content: (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Access all your important sections from here. Click on any icon to navigate to that section.
            </p>
          </div>
        ),
        selectorId: DASHBOARD_TOUR_STEPS.SIDEBAR_NAVIGATION,
        position: "right",
        icon: <Compass className={`${ICON_SIZES.LARGE} text-primary`} />,
      },
      {
        title: "Analytics Overview",
        content: (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Get a quick snapshot of your key metrics and performance indicators. Hover over charts for more details.
            </p>
          </div>
        ),
        selectorId: DASHBOARD_TOUR_STEPS.ANALYTICS_OVERVIEW,
        position: "bottom",
        icon: <Sparkles className={`${ICON_SIZES.LARGE} text-primary`} />,
      },
      {
        title: "Quick Actions",
        content: (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Perform common tasks without navigating away from the dashboard. Try clicking on any action button.
            </p>
          </div>
        ),
        selectorId: DASHBOARD_TOUR_STEPS.QUICK_ACTIONS,
        position: "bottom",
      },
      {
        title: "Recent Activity",
        content: (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Stay updated with the latest changes and activities. Click on any item to see more details.
            </p>
          </div>
        ),
        selectorId: DASHBOARD_TOUR_STEPS.RECENT_ACTIVITY,
        position: "top",
      },
      {
        title: "User Settings",
        content: (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Customize your experience and manage your account preferences from here.
            </p>
          </div>
        ),
        selectorId: DASHBOARD_TOUR_STEPS.USER_SETTINGS,
        position: "left",
      },
    ])
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
  return (
    <div className={CSS_CLASSES.CONFETTI_CONTAINER}>
      {Array.from({ length: ANIMATION_CONFIG.CONFETTI.PARTICLE_COUNT }).map((_, i) => (
        <div className={CSS_CLASSES.CONFETTI_PARTICLE} key={i}>
          <motion.div
            initial={{ top: "-10%", left: `${Math.random() * 100}%` }}
            animate={{ top: "100%", left: `${Math.random() * 100}%`, rotate: Math.random() * 360 }}
            style={{ backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`, position: "absolute" }}
            transition={{
              duration: Math.random() * ANIMATION_CONFIG.CONFETTI.FALL_DURATION.min + ANIMATION_CONFIG.CONFETTI.FALL_DURATION.max,
              ease: "easeOut",
              delay: Math.random() * ANIMATION_CONFIG.CONFETTI.DELAY_MAX,
            }}
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