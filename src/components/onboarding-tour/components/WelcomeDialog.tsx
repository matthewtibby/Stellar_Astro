import React from 'react';
import { motion } from 'framer-motion';
import { Play, SkipForward, Sparkles } from 'lucide-react';
import { AnimationService } from '../services';
import { CSS_CLASSES, UI_TEXT, ICON_SIZES } from '../constants';
import type { WelcomeDialogProps } from '../types';

/**
 * WelcomeDialog - Renders the welcome dialog for tour introduction
 * Provides tour overview and start/skip options with engaging animations
 */
export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ 
  onStart, 
  onSkip 
}) => {
  return (
    <div className={CSS_CLASSES.OVERLAY}>
      <div className={CSS_CLASSES.MODAL_CONTAINER}>
        <motion.div
          {...AnimationService.getWelcomeAnimation()}
          className={CSS_CLASSES.WELCOME_MODAL}
        >
          <div className={CSS_CLASSES.WELCOME_CONTENT}>
            <div className={CSS_CLASSES.WELCOME_HEADER}>
              <Sparkles className={`${ICON_SIZES.EXTRA_LARGE} text-primary mb-4`} />
              <h2 className={CSS_CLASSES.WELCOME_TITLE}>
                {UI_TEXT.WELCOME.TITLE}
              </h2>
              <p className={CSS_CLASSES.WELCOME_DESCRIPTION}>
                {UI_TEXT.WELCOME.DESCRIPTION}
              </p>
            </div>
            
            <div className={CSS_CLASSES.WELCOME_ACTIONS}>
              <button
                onClick={onStart}
                className={CSS_CLASSES.WELCOME_START_BUTTON}
              >
                <Play className={`mr-2 ${ICON_SIZES.SMALL}`} />
                {UI_TEXT.WELCOME.START_BUTTON}
              </button>
              <button
                onClick={onSkip}
                className={CSS_CLASSES.WELCOME_SKIP_BUTTON}
              >
                <SkipForward className={`mr-2 ${ICON_SIZES.SMALL}`} />
                {UI_TEXT.WELCOME.SKIP_BUTTON}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
