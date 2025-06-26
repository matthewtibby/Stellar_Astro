import React from 'react';
import { motion } from 'framer-motion';
import { Telescope, Camera, Zap } from 'lucide-react';
import { AnimationService } from '../services';
import { CSS_CLASSES, UI_TEXT, ICON_SIZES } from '../constants';
import type { DemoExampleProps } from '../types';

/**
 * DemoExample - Renders demo content for tour examples
 * Shows interactive examples with animations and visual feedback
 */
export const DemoExample: React.FC<DemoExampleProps> = ({ 
  type = 'default' 
}) => {
  const getDemoContent = () => {
    switch (type) {
      case 'telescope':
        return {
          icon: <Telescope className={`${ICON_SIZES.LARGE} text-blue-400`} />,
          title: UI_TEXT.DEMO.TELESCOPE.TITLE,
          description: UI_TEXT.DEMO.TELESCOPE.DESCRIPTION,
          features: UI_TEXT.DEMO.TELESCOPE.FEATURES
        };
      case 'camera':
        return {
          icon: <Camera className={`${ICON_SIZES.LARGE} text-green-400`} />,
          title: UI_TEXT.DEMO.CAMERA.TITLE,
          description: UI_TEXT.DEMO.CAMERA.DESCRIPTION,
          features: UI_TEXT.DEMO.CAMERA.FEATURES
        };
      case 'processing':
        return {
          icon: <Zap className={`${ICON_SIZES.LARGE} text-purple-400`} />,
          title: UI_TEXT.DEMO.PROCESSING.TITLE,
          description: UI_TEXT.DEMO.PROCESSING.DESCRIPTION,
          features: UI_TEXT.DEMO.PROCESSING.FEATURES
        };
      default:
        return {
          icon: <Telescope className={`${ICON_SIZES.LARGE} text-primary`} />,
          title: UI_TEXT.DEMO.DEFAULT.TITLE,
          description: UI_TEXT.DEMO.DEFAULT.DESCRIPTION,
          features: UI_TEXT.DEMO.DEFAULT.FEATURES
        };
    }
  };

  const content = getDemoContent();

  return (
    <motion.div
      {...AnimationService.getDemoAnimation()}
      className={CSS_CLASSES.DEMO_CONTAINER}
    >
      <div className={CSS_CLASSES.DEMO_HEADER}>
        {content.icon}
        <h3 className={CSS_CLASSES.DEMO_TITLE}>{content.title}</h3>
        <p className={CSS_CLASSES.DEMO_DESCRIPTION}>{content.description}</p>
      </div>
      
      <div className={CSS_CLASSES.DEMO_FEATURES}>
        {content.features.map((feature, index) => (
          <motion.div
            key={index}
            {...AnimationService.getFeatureAnimation(index)}
            className={CSS_CLASSES.DEMO_FEATURE}
          >
            <div className={CSS_CLASSES.DEMO_FEATURE_BULLET} />
            <span className={CSS_CLASSES.DEMO_FEATURE_TEXT}>{feature}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}; 