import React from 'react';
import { UI_TEXT, CSS_CLASSES } from '../constants';

/**
 * LoadingState component for displaying loading spinner and text
 * Used when files are being loaded
 */
export const LoadingState: React.FC = () => {
  return (
    <div className={CSS_CLASSES.LOADING_CONTAINER}>
      <div className={CSS_CLASSES.LOADING_SPINNER} />
      <p className="text-gray-400">{UI_TEXT.LOADING_TEXT}</p>
    </div>
  );
}; 