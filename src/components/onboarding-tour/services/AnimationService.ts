// Confetti particle type
export interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  color: string;
  size: number;
  rotation: number;
}

const CONFETTI_COLORS = [
  '#0a2342', // dark blue
  '#ffffff', // white
  '#ffd700', // gold
];

export const AnimationService = {
  generateConfettiParticles(count: number = 40): ConfettiParticle[] {
    // Generate confetti particles with random positions, velocities, and colors
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random(), // 0 to 1 (relative to width)
      y: Math.random() * -0.2, // start slightly above the top
      velocityX: (Math.random() - 0.5) * 0.02, // -0.01 to 0.01
      velocityY: 0.01 + Math.random() * 0.02, // 0.01 to 0.03
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 8, // 8 to 16 px
      rotation: Math.random() * 360,
    }));
  },

  // Stub for compatibility with other animation calls
  getConfettiAnimation: (index: number) => ({
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { delay: index * 0.02, type: 'spring', stiffness: 100 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
  }),

  // Modular animation methods for onboarding tour
  getDemoAnimation: () => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
  }),
  getFeatureAnimation: (index: number) => ({
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { delay: index * 0.05, duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
  }),
  getModalAnimation: () => ({
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  }),
  getContentAnimation: () => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: 10, transition: { duration: 0.2 } },
  }),
  getOverlayAnimation: () => ({
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  }),
  getWelcomeAnimation: () => ({
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } },
  }),
}; 