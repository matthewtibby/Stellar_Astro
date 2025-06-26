// Types Barrel Export - Phase 1
export type {
  // Core interfaces
  DashboardTourStep,
  ElementPosition,
  DashboardTourContextType,
  
  // Component props
  DashboardTourProviderProps,
  DashboardTourWelcomeDialogProps,
  TourModalProps,
  TourOverlayProps,
  TourProgressBarProps,
  StepIndicatorsProps,
  TourNavigationProps,
  ConfettiProps,
  ConfettiParticle,
  TourExampleProps,
  
  // Hook return types
  UseTourStateReturn,
  UseElementPositioningReturn,
  UseTourNavigationReturn,
  UseTourContentReturn,
  UseAnimationStateReturn,
  
  // Service interfaces
  PositioningService,
  AnimationService,
  TourNavigationService,
  TourContentService,
  
  // Utility types
  TourPosition,
  TourStepIndex,
  TourStepId,
  
  // Constants types
  DashboardTourStepsType,
  AnimationConfigType,
  CssClassesType,
  UiTextType,
  
  // Event handler types
  TourEventHandler,
  StepChangeHandler,
  TourCompleteHandler,
  ElementPositionHandler,
  
  // Component ref types
  TourModalRef,
  TourOverlayRef,
  WelcomeDialogRef,
  
  // Animation types
  AnimationTransition,
  MotionVariants,
  TourConfig,
} from './tour.types'; 