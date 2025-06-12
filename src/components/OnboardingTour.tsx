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

// Constants
export const DASHBOARD_TOUR_STEPS = {
  SIDEBAR_NAVIGATION: "sidebar-navigation",
  ANALYTICS_OVERVIEW: "analytics-overview",
  QUICK_ACTIONS: "quick-actions",
  RECENT_ACTIVITY: "recent-activity",
  USER_SETTINGS: "user-settings",
} as const

export interface DashboardTourStep {
  content: React.ReactNode
  selectorId: string
  title: string
  position?: "top" | "bottom" | "left" | "right"
  icon?: React.ReactNode
}

interface DashboardTourContextType {
  currentStep: number
  totalSteps: number
  nextStep: () => void
  previousStep: () => void
  endTour: () => void
  isActive: boolean
  startTour: () => void
  setSteps: (steps: DashboardTourStep[]) => void
  steps: DashboardTourStep[]
  isTourCompleted: boolean
  setIsTourCompleted: (completed: boolean) => void
  skipToStep: (stepIndex: number) => void
}

interface DashboardTourProviderProps {
  children: React.ReactNode
  onComplete?: () => void
  className?: string
  isTourCompleted?: boolean
}

const DashboardTourContext = React.createContext<DashboardTourContextType | null>(null)

function getElementPosition(id: string) {
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
  const [elementPosition, setElementPosition] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
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
        setTimeout(() => setShowConfetti(false), 3000)
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
            <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-[2px]">
              <div className="fixed inset-0 overflow-hidden">
                <div className="foo">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="foo">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{
                          position: "fixed",
                          top: elementPosition.top,
                          left: elementPosition.left,
                          width: elementPosition.width,
                          height: elementPosition.height,
                        }}
                      >
                        <div className="bg-background relative rounded-lg border p-5 shadow-lg">
                          <button
                            className="absolute right-2 top-2"
                            onClick={endTour}
                          >
                            <X className="h-4 w-4" />
                          </button>
                          
                          <div className="mb-4 flex items-center gap-3">
                            {steps[currentStep]?.icon || <Lightbulb className="h-5 w-5 text-primary" />}
                            <h3 className="font-semibold">{steps[currentStep]?.title}</h3>
                          </div>
                          
                          <AnimatePresence mode="wait">
                            <div>
                              <motion.div
                                key={`tour-content-${currentStep}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                style={{ filter: currentStep === -1 ? "blur(4px)" : "blur(0px)", minHeight: 80 }}
                                transition={{
                                  duration: 0.2,
                                  height: {
                                    duration: 0.4,
                                  },
                                }}
                              >
                                {steps[currentStep]?.content}
                              </motion.div>
                              
                              <div className="mt-5 flex flex-col gap-3">
                                <div className="h-1 bg-primary rounded-full overflow-hidden">
                                  <div
                                    className="h-1 bg-primary/50"
                                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                  ></div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex gap-1">
                                    {steps.map((_, index) => (
                                      <button
                                        key={index}
                                        onClick={() => skipToStep(index)}
                                        className={cn(
                                          "h-1.5 w-1.5 rounded-full",
                                          index === currentStep 
                                            ? "bg-primary" 
                                            : index < currentStep 
                                              ? "bg-primary/50" 
                                              : "bg-muted"
                                        )}
                                        aria-label={`Go to step ${index + 1}`}
                                      />
                                    ))}
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    {currentStep > 0 && (
                                      <button
                                        onClick={previousStep}
                                        className="h-8"
                                      >
                                        <ChevronLeft className="mr-1 h-3 w-3" />
                                        Back
                                      </button>
                                    )}
                                    <button
                                      onClick={nextStep}
                                      className="h-8"
                                    >
                                      {currentStep === steps.length - 1 ? (
                                        <>
                                          Finish
                                          <CheckCircle2 className="ml-1 h-3 w-3" />
                                        </>
                                      ) : (
                                        <>
                                          Next
                                          <ChevronRight className="ml-1 h-3 w-3" />
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
    throw new Error("useDashboardTour must be used within a DashboardTourProvider")
  }
  return context
}

export function DashboardTourWelcomeDialog({ setIsOpen }: { setIsOpen: (isOpen: boolean) => void }) {
  const { startTour, steps, isTourCompleted } = useDashboardTour()

  if (isTourCompleted || steps.length === 0) {
    return null
  }

  const handleSkip = () => {
    setIsOpen(false)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"></div>
      <div className="fixed inset-0 overflow-hidden">
        <div className="foo">
          <motion.div
            initial={{ scale: 0.7, filter: "blur(10px)" }}
            animate={{
              scale: 1,
              filter: "blur(0px)",
              y: [0, -8, 0],
            }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
              y: {
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              },
            }}
          >
            <div className="fixed inset-0 z-[100] rounded-md border-2 border-primary">
              <div className="relative mb-4">
                <motion.div
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1, y: [0, -8, 0] }}
                  style={{ filter: "blur(0px)", position: "absolute", right: 0, top: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    y: {
                      duration: 2.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <Compass className="h-24 w-24 text-primary" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, rotate: [0, 360] }}
                  style={{ position: "absolute", right: 0, top: 0 }}
                  transition={{
                    delay: 0.3,
                    duration: 0.5,
                    rotate: {
                      duration: 20,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    },
                  }}
                >
                  <Sparkles className="h-6 w-6 text-primary" />
                </motion.div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-medium mb-4">Welcome to Your Dashboard</h2>
                <p className="text-muted-foreground mb-6">
                  Let&apos;s take a quick tour to help you get familiar with all the features and make the most of your experience.
                </p>
                <div className="space-x-2">
                  <button
                    onClick={startTour}
                    className="px-4 py-2 bg-primary text-white rounded-md"
                  >
                    Start Tour
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-md"
                  >
                    Skip for Now
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
        icon: <Compass className="h-5 w-5 text-primary" />,
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
        icon: <Sparkles className="h-5 w-5 text-primary" />,
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
    <div className="container mx-auto p-10">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your dashboard. Here&apos;s an overview of your account.
          </p>
        </div>

        <div className="grid gap-8">
          <div id={DASHBOARD_TOUR_STEPS.SIDEBAR_NAVIGATION} className="border rounded-lg p-6 bg-muted/30">
            <div className="text-muted-foreground text-sm">Sidebar Navigation</div>
          </div>

          <div id={DASHBOARD_TOUR_STEPS.ANALYTICS_OVERVIEW} className="border rounded-lg p-6 bg-muted/30">
            <div className="text-muted-foreground text-sm">Analytics Overview</div>
          </div>

          <div id={DASHBOARD_TOUR_STEPS.QUICK_ACTIONS} className="border rounded-lg p-6 bg-muted/30">
            <div className="text-muted-foreground text-sm">Quick Actions</div>
          </div>

          <div id={DASHBOARD_TOUR_STEPS.RECENT_ACTIVITY} className="border rounded-lg p-6 bg-muted/30">
            <div className="text-muted-foreground text-sm">Recent Activity</div>
          </div>

          <div id={DASHBOARD_TOUR_STEPS.USER_SETTINGS} className="border rounded-lg p-6 bg-muted/30">
            <div className="text-muted-foreground text-sm">User Settings</div>
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
    <div className="fixed inset-0 pointer-events-none z-[1000] overflow-hidden">
      {Array.from({ length: 100 }).map((_, i) => (
        <div className="absolute w-2 h-2 rounded-full" key={i}>
          <motion.div
            initial={{ top: "-10%", left: `${Math.random() * 100}%` }}
            animate={{ top: "100%", left: `${Math.random() * 100}%`, rotate: Math.random() * 360 }}
            style={{ backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`, position: "absolute" }}
            transition={{
              duration: Math.random() * 2 + 2,
              ease: "easeOut",
              delay: Math.random() * 0.5,
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