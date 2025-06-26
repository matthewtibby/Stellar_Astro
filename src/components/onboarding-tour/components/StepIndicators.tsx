import React from 'react';
import { cn } from '@/lib/utils';
import { TourNavigationService } from '../services';
import { CSS_CLASSES, UI_TEXT } from '../constants';
import type { StepIndicatorsProps } from '../types';

/**
 * StepIndicators - Renders clickable step indicator dots
 * Shows current, completed, and upcoming steps with visual states
 */
export const StepIndicators: React.FC<StepIndicatorsProps> = ({ 
  steps, 
  currentStep, 
  onStepClick 
}) => {
  return (
    <div className={CSS_CLASSES.STEP_INDICATORS}>
      {steps.map((_, index) => {
        const status = TourNavigationService.getStepStatus(index, currentStep);
        
        return (
          <button
            key={index}
            onClick={() => onStepClick(index)}
            className={cn(
              CSS_CLASSES.STEP_DOT,
              status === 'active'
                ? CSS_CLASSES.STEP_ACTIVE
                : status === 'completed'
                  ? CSS_CLASSES.STEP_COMPLETED
                  : CSS_CLASSES.STEP_INACTIVE
            )}
            aria-label={`${UI_TEXT.ARIA_LABELS.GO_TO_STEP} ${index + 1}`}
          />
        );
      })}
    </div>
  );
}; 