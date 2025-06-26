import React from 'react';
import { CSS_CLASSES } from '../constants';
import type { TourProgressBarProps } from '../types';

/**
 * TourProgressBar - Renders the progress bar showing tour completion
 * Displays visual progress indicator with smooth transitions
 */
export const TourProgressBar: React.FC<TourProgressBarProps> = ({ 
  currentStep, 
  totalSteps 
}) => {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className={CSS_CLASSES.PROGRESS_BAR}>
      <div
        className={CSS_CLASSES.PROGRESS_FILL}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}; 