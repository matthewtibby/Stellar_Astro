import React from 'react';
import { UI_TEXT, CSS_CLASSES } from '../constants';

interface NotificationBannerProps {
  message: string | null;
  onDismiss: () => void;
}

/**
 * NotificationBanner component for displaying notifications
 * Handles move notifications and other UI messages
 */
export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  message,
  onDismiss
}) => {
  if (!message) return null;

  return (
    <div className={CSS_CLASSES.NOTIFICATION}>
      {message}
      <button
        className="ml-4 px-2 py-1 bg-yellow-700 text-white rounded hover:bg-yellow-800"
        onClick={onDismiss}
      >
        {UI_TEXT.DISMISS_BUTTON}
      </button>
    </div>
  );
}; 