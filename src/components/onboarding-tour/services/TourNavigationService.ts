export const TourNavigationService = {
  validateStepIndex: (index: number, maxSteps: number) => index >= 0 && index < maxSteps,
  getNextStepIndex: (current: number, maxSteps: number) => Math.min(current + 1, maxSteps - 1),
  getPreviousStepIndex: (current: number) => Math.max(current - 1, 0),
  shouldShowConfetti: (currentStep: number, totalSteps: number) => currentStep === totalSteps - 1,
  getStepStatus: (index: number, currentStep: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'inactive';
  },
  canGoBack: (currentStep: number) => currentStep > 0,
  isLastStep: (currentStep: number, totalSteps: number) => currentStep === totalSteps - 1,
  isFirstStep: (currentStep: number) => currentStep === 0,
  calculateProgress: (currentStep: number, totalSteps: number) => {
    if (totalSteps <= 1) return 100;
    return Math.round(((currentStep + 1) / totalSteps) * 100);
  },
}; 