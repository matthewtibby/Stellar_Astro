import { useCalibrationCoreState } from './useCalibrationCoreState';
import { useCalibrationPreviewState } from './useCalibrationPreviewState';
import { useSuperdarkState } from './useSuperdarkState';
import { useCalibrationNotificationState } from './useCalibrationNotificationState';

/**
 * Composed hook for enhanced calibration state, merging all domain-specific hooks.
 */
export function useEnhancedCalibrationState() {
  const core = useCalibrationCoreState();
  const preview = useCalibrationPreviewState();
  const superdark = useSuperdarkState();
  const notification = useCalibrationNotificationState();

  return {
    ...core,
    ...preview,
    ...superdark,
    ...notification,
  };
} 