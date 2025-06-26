import React from 'react';
import { UI_TEXT, CSS_CLASSES } from '../constants';

interface CalibrationActionButtonProps {
  onClick: () => void;
}

/**
 * CalibrationActionButton component for proceeding to calibration
 * Renders the main action button for calibration progress
 */
export const CalibrationActionButton: React.FC<CalibrationActionButtonProps> = ({
  onClick
}) => {
  return (
    <div className="mt-4 flex justify-end">
      <button
        onClick={onClick}
        className={CSS_CLASSES.BUTTON_PRIMARY}
      >
        {UI_TEXT.PROCEED_TO_CALIBRATION}
      </button>
    </div>
  );
}; 