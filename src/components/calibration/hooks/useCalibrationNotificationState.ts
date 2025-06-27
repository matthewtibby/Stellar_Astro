import { useState } from 'react';

/**
 * Hook for managing calibration notification and timing state.
 *
 * @returns {object} Notification and timing state and updaters.
 *   - showSuccess: Whether to show the success notification.
 *   - setShowSuccess: Setter for showSuccess.
 *   - cancelMessage: The cancel message, if any.
 *   - setCancelMessage: Setter for cancelMessage.
 *   - calibrationStart: Start time for calibration.
 *   - setCalibrationStart: Setter for calibrationStart.
 *   - calibrationEnd: End time for calibration.
 *   - setCalibrationEnd: Setter for calibrationEnd.
 */
export function useCalibrationNotificationState() {
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [calibrationStart, setCalibrationStart] = useState<number | null>(null);
  const [calibrationEnd, setCalibrationEnd] = useState<number | null>(null);

  return {
    showSuccess,
    setShowSuccess,
    cancelMessage,
    setCancelMessage,
    calibrationStart,
    setCalibrationStart,
    calibrationEnd,
    setCalibrationEnd,
  };
} 