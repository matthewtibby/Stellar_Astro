import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AnimationService } from '../services';
import { CSS_CLASSES } from '../constants';
import type { ConfettiAnimationProps } from '../types';

/**
 * ConfettiAnimation - Renders animated confetti particles for celebration
 * Uses framer-motion for smooth particle animations with stagger effects
 */
export const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({ 
  isVisible 
}) => {
  const particles = AnimationService.generateConfettiParticles();

  return (
    <AnimatePresence>
      {isVisible && (
        <div className={CSS_CLASSES.CONFETTI_CONTAINER}>
          {particles.map((particle, index) => (
            <motion.div
              key={index}
              className={CSS_CLASSES.CONFETTI_PARTICLE}
              style={{ backgroundColor: particle.color }}
              {...AnimationService.getConfettiAnimation(index)}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}; 