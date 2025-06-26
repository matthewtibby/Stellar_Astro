import { useState } from 'react';

/**
 * Custom hook for managing notification state
 * Handles move notifications and other UI notifications
 */
export const useNotificationState = () => {
  const [moveNotification, setMoveNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setMoveNotification(message);
  };

  const clearNotification = () => {
    setMoveNotification(null);
  };

  return {
    moveNotification,
    showNotification,
    clearNotification
  };
}; 