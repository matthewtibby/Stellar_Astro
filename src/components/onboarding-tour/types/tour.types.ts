import React from 'react';

// Core tour step interface
export interface DashboardTourStep {
  content: React.ReactNode;
  selectorId: string;
  title: string;
  position?: "top" | "bottom" | "left" | "right";
  icon?: React.ReactNode;
}

// Element position interface
export interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Tour context interface
export interface DashboardTourContextType {
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  previousStep: () => void;
  endTour: () => void;
  isActive: boolean;
  startTour: () => void;
  setSteps: (steps: DashboardTourStep[]) => void;
  steps: DashboardTourStep[];
  isTourCompleted: boolean;
  setIsTourCompleted: (completed: boolean) => void;
  skipToStep: (stepIndex: number) => void;
}

// Provider props interface
export interface DashboardTourProviderProps {
  children: React.ReactNode;
  onComplete?: () => void;
  className?: string;
  isTourCompleted?: boolean;
}

// Welcome dialog props interface
export interface DashboardTourWelcomeDialogProps {
  setIsOpen: (isOpen: boolean) => void;
}

// Tour modal props interface
export interface TourModalProps {
  currentStep: number;
  steps: DashboardTourStep[];
  elementPosition: ElementPosition;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onSkipToStep: (stepIndex: number) => void;
}

// Tour overlay props interface
export interface TourOverlayProps {
  isVisible: boolean;
  children: React.ReactNode;
}

// Progress bar props interface
export interface TourProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

// Step indicators props interface
export interface StepIndicatorsProps {
  steps: DashboardTourStep[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

// Navigation buttons props interface
export interface TourNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  showBack: boolean;
  isLastStep: boolean;
}

// Confetti animation props interface
export interface ConfettiProps {
  show: boolean;
  particleCount?: number;
  duration?: number;
}

// Confetti particle interface
export interface ConfettiParticle {
  id: number;
  initialLeft: number;
  finalLeft: number;
  color: string;
  duration: number;
  delay: number;
  rotation: number;
}

// Tour example props interface
export interface TourExampleProps {
  className?: string;
}

// Hook return types
export interface UseTourStateReturn {
  steps: DashboardTourStep[];
  setSteps: (steps: DashboardTourStep[]) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isCompleted: boolean;
  setIsCompleted: (completed: boolean) => void;
  showConfetti: boolean;
  setShowConfetti: (show: boolean) => void;
}

export interface UseElementPositioningReturn {
  elementPosition: ElementPosition | null;
  updateElementPosition: () => void;
}

export interface UseTourNavigationReturn {
  nextStep: () => void;
  previousStep: () => void;
  skipToStep: (stepIndex: number) => void;
  endTour: () => void;
  startTour: () => void;
  isActive: boolean;
}

export interface UseTourContentReturn {
  currentStepData: DashboardTourStep | null;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  stepProgress: number;
}

export interface UseAnimationStateReturn {
  showConfetti: boolean;
  setShowConfetti: (show: boolean) => void;
  triggerConfetti: () => void;
}

// Service interfaces
export interface PositioningService {
  getElementPosition: (id: string) => ElementPosition | null;
  updatePosition: (id: string) => ElementPosition | null;
  addEventListeners: (callback: () => void) => void;
  removeEventListeners: (callback: () => void) => void;
}

export interface AnimationService {
  getOverlayAnimation: () => object;
  getModalAnimation: () => object;
  getContentAnimation: () => object;
  getWelcomeDialogAnimation: () => object;
  getConfettiAnimation: (particle: ConfettiParticle) => object;
}

export interface TourNavigationService {
  validateStepIndex: (index: number, maxSteps: number) => boolean;
  getNextStepIndex: (current: number, maxSteps: number) => number;
  getPreviousStepIndex: (current: number) => number;
  shouldShowConfetti: (currentStep: number, totalSteps: number) => boolean;
}

export interface TourContentService {
  createDefaultSteps: () => DashboardTourStep[];
  validateSteps: (steps: DashboardTourStep[]) => boolean;
  getStepContent: (step: DashboardTourStep) => React.ReactNode;
  getStepIcon: (step: DashboardTourStep) => React.ReactNode;
}

// Utility types
export type TourPosition = "top" | "bottom" | "left" | "right";
export type TourStepIndex = number;
export type TourStepId = string;

// Constants types
export type DashboardTourStepsType = typeof import('../constants/tourConstants').DASHBOARD_TOUR_STEPS;
export type AnimationConfigType = typeof import('../constants/tourConstants').ANIMATION_CONFIG;
export type CssClassesType = typeof import('../constants/tourConstants').CSS_CLASSES;
export type UiTextType = typeof import('../constants/tourConstants').UI_TEXT;

// Event handler types
export type TourEventHandler = () => void;
export type StepChangeHandler = (stepIndex: number) => void;
export type TourCompleteHandler = () => void;
export type ElementPositionHandler = (position: ElementPosition | null) => void;

// Component ref types
export type TourModalRef = React.RefObject<HTMLDivElement>;
export type TourOverlayRef = React.RefObject<HTMLDivElement>;
export type WelcomeDialogRef = React.RefObject<HTMLDivElement>;

// Animation transition types
export interface AnimationTransition {
  duration?: number;
  ease?: string;
  delay?: number;
  repeat?: number;
}

export interface MotionVariants {
  initial: object;
  animate: object;
  exit?: object;
  transition?: AnimationTransition;
}

// Tour configuration types
export interface TourConfig {
  defaultPosition: TourPosition;
  minContentHeight: number;
  zIndex: {
    overlay: number;
    welcomeModal: number;
    confetti: number;
  };
  blurFilters: {
    active: string;
    inactive: string;
  };
} 