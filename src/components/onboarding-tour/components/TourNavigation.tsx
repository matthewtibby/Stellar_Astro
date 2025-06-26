import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { TourNavigationService } from '../services';
import { CSS_CLASSES, UI_TEXT, ICON_SIZES } from '../constants';
import type { TourNavigationProps } from '../types';

/**
 * TourNavigation - Renders back and next navigation buttons
 * Handles conditional display and accessibility for tour navigation
 */
export const TourNavigation: React.FC<TourNavigationProps> = ({ 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrevious, 
  showBack, 
  isLastStep 
}) => {
  const canGoBack = TourNavigationService.canGoBack(currentStep);
  const isLast = TourNavigationService.isLastStep(currentStep, totalSteps);

  return (
    <div className={CSS_CLASSES.NAVIGATION_BUTTONS}>
      {canGoBack && showBack && (
        <button
          onClick={onPrevious}
          className={CSS_CLASSES.BACK_BUTTON}
          aria-label={UI_TEXT.ARIA_LABELS.BACK_STEP}
        >
          <ChevronLeft className={`mr-1 ${ICON_SIZES.SMALL}`} />
          {UI_TEXT.NAVIGATION.BACK}
        </button>
      )}
      
      <button
        onClick={onNext}
        className={CSS_CLASSES.NEXT_BUTTON}
        aria-label={isLast ? UI_TEXT.ARIA_LABELS.FINISH_TOUR : UI_TEXT.ARIA_LABELS.NEXT_STEP}
      >
        {isLast ? (
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
  );
}; 