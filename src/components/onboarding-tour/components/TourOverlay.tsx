import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AnimationService } from '../services';
import { CSS_CLASSES } from '../constants';
import type { TourOverlayProps } from '../types';

/**
 * TourOverlay - Renders the backdrop and overlay container for tour modal
 * Provides animated overlay with proper z-index and backdrop blur
 */
export const TourOverlay: React.FC<TourOverlayProps> = ({ 
  isVisible, 
  children 
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <div className={CSS_CLASSES.OVERLAY}>
          <div className={CSS_CLASSES.MODAL_CONTAINER}>
            <div className={CSS_CLASSES.MODAL_WRAPPER}>
              <motion.div
                {...AnimationService.getOverlayAnimation()}
              >
                <div className={CSS_CLASSES.MODAL_WRAPPER}>
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}; 