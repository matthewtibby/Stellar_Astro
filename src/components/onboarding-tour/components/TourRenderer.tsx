import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { TourOverlay, TourModal, ConfettiAnimation } from './';
import type { TourRendererProps } from '../types';

/**
 * TourRenderer - Handles conditional rendering of tour components
 * Consolidates all tour rendering logic in a single component
 */
export const TourRenderer: React.FC<TourRendererProps> = ({
  isActive,
  elementPosition,
  currentStep,
  steps,
  navigation,
  showConfetti,
}) => {
  return (
    <>
      <AnimatePresence>
        {isActive && elementPosition && (
          <TourOverlay isVisible={true}>
            <TourModal
              currentStep={currentStep}
              steps={steps}
              elementPosition={elementPosition}
              onNext={navigation.nextStep}
              onPrevious={navigation.previousStep}
              onClose={navigation.endTour}
              onSkipToStep={navigation.skipToStep}
            />
          </TourOverlay>
        )}
      </AnimatePresence>
      
      <ConfettiAnimation isVisible={showConfetti} />
    </>
  );
};
