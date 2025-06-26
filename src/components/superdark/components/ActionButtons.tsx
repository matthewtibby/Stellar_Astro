import React from 'react';
import { DialogFooter } from '../../ui/dialog';

interface ActionButtonsProps {
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isFormValid: boolean;
  submitText?: string;
  submittingText?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onSubmit,
  isSubmitting,
  isFormValid,
  submitText = 'Create Superdark',
  submittingText = 'Creating...'
}) => {
  return (
    <DialogFooter className="flex justify-between">
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={isSubmitting || !isFormValid}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? submittingText : submitText}
      </button>
    </DialogFooter>
  );
}; 