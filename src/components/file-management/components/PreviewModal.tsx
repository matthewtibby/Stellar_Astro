import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { UI_TEXT, CSS_CLASSES } from '../constants';

interface PreviewModalProps {
  previewUrl: string | null;
  previewLoading: boolean;
  previewError: string | null;
  onClose: () => void;
  onClearError: () => void;
}

/**
 * PreviewModal component for displaying file previews
 * Handles loading states, errors, and preview display
 */
export const PreviewModal: React.FC<PreviewModalProps> = ({
  previewUrl,
  previewLoading,
  previewError,
  onClose,
  onClearError
}) => {
  // Preview loading modal
  if (previewLoading) {
    return (
      <div className={CSS_CLASSES.MODAL_OVERLAY}>
        <div className="bg-gray-900 p-8 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-white mt-4">{UI_TEXT.PREVIEW_LOADING}</p>
        </div>
      </div>
    );
  }

  // Preview error modal
  if (previewError) {
    return (
      <div className={CSS_CLASSES.MODAL_OVERLAY}>
        <div className={CSS_CLASSES.MODAL_CONTENT}>
          <div className="flex items-center space-x-3 text-red-500 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h3 className="text-lg font-semibold">{UI_TEXT.PREVIEW_ERROR_TITLE}</h3>
          </div>
          <p className="text-gray-300 mb-6">{previewError}</p>
          <div className="flex justify-end">
            <button
              onClick={onClearError}
              className={CSS_CLASSES.BUTTON_SECONDARY}
            >
              {UI_TEXT.CLOSE_BUTTON}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Preview display modal
  if (previewUrl) {
    return (
      <div className={CSS_CLASSES.MODAL_OVERLAY}>
        <div className={CSS_CLASSES.MODAL_LARGE}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">{UI_TEXT.PREVIEW_TITLE}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="FITS Preview" className="w-full h-auto rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 