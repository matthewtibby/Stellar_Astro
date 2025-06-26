import React from 'react';
import { FileType } from '../types';
import { UI_TEXT, CSS_CLASSES } from '../constants';

interface CalibrationWarningModalProps {
  show: boolean;
  missingFrameTypes: FileType[];
  onCancel: () => void;
  onProceed: () => void;
}

/**
 * CalibrationWarningModal component for displaying calibration warnings
 * Shows missing frame types and allows user to proceed or cancel
 */
export const CalibrationWarningModal: React.FC<CalibrationWarningModalProps> = ({
  show,
  missingFrameTypes,
  onCancel,
  onProceed
}) => {
  if (!show) return null;

  return (
    <div className={CSS_CLASSES.MODAL_OVERLAY}>
      <div className={CSS_CLASSES.MODAL_CONTENT}>
        <h3 className="text-lg font-semibold text-white mb-4">{UI_TEXT.CALIBRATION_WARNING_TITLE}</h3>
        <p className="text-gray-300 mb-4">{UI_TEXT.CALIBRATION_WARNING_MESSAGE}</p>
        <ul className="list-disc list-inside text-gray-300 mb-4">
          {missingFrameTypes.map(type => (
            <li key={type} className="capitalize">{type} frames</li>
          ))}
        </ul>
        <p className="text-gray-300 mb-4">{UI_TEXT.CALIBRATION_WARNING_QUESTION}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className={CSS_CLASSES.BUTTON_SECONDARY}
          >
            {UI_TEXT.CANCEL_BUTTON}
          </button>
          <button
            onClick={onProceed}
            className={CSS_CLASSES.BUTTON_PRIMARY}
          >
            {UI_TEXT.PROCEED_ANYWAY_BUTTON}
          </button>
        </div>
      </div>
    </div>
  );
}; 