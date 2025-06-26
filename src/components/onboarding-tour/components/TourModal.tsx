import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Lightbulb } from 'lucide-react';
import { AnimationService, TourContentService } from '../services';
import { CSS_CLASSES, UI_TEXT, TOUR_CONFIG, ICON_SIZES } from '../constants';
import { TourProgressBar } from './TourProgressBar';
import { StepIndicators } from './StepIndicators';
import { TourNavigation } from './TourNavigation';
import type { TourModalProps } from '../types';

/**
 * TourModal - Renders the main tour modal with content and navigation
 * Combines header, content, progress, and navigation in a cohesive modal
 */
export const TourModal: React.FC<TourModalProps> = ({ 
  currentStep, 
  steps, 
  elementPosition, 
  onNext, 
  onPrevious, 
  onClose, 
  onSkipToStep 
}) => {
  const currentStepData = steps[currentStep];
  
  if (!currentStepData || !elementPosition) {
    return null;
  }

  return (
    <motion.div
      {...AnimationService.getModalAnimation()}
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
          onClick={onClose}
          aria-label={UI_TEXT.ARIA_LABELS.CLOSE_TOUR}
        >
          <X className={ICON_SIZES.MEDIUM} />
        </button>
        
        <div className={CSS_CLASSES.HEADER_SECTION}>
          {TourContentService.getStepIcon(currentStepData) || 
            <Lightbulb className={`${ICON_SIZES.LARGE} text-primary`} />}
          <h3 className={CSS_CLASSES.TITLE}>{currentStepData.title}</h3>
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
              {TourContentService.getStepContent(currentStepData)}
            </motion.div>
            
            <div className={CSS_CLASSES.CONTENT_SECTION}>
              <TourProgressBar 
                currentStep={currentStep} 
                totalSteps={steps.length} 
              />
              
              <div className={CSS_CLASSES.NAVIGATION_SECTION}>
                <StepIndicators 
                  steps={steps}
                  currentStep={currentStep}
                  onStepClick={onSkipToStep}
                />
                
                <TourNavigation 
                  currentStep={currentStep}
                  totalSteps={steps.length}
                  onNext={onNext}
                  onPrevious={onPrevious}
                  showBack={true}
                  isLastStep={currentStep === steps.length - 1}
                />
              </div>
            </div>
          </div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}; 