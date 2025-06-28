/**
 * useCalibrationModals
 *
 * Composes all modular modal management hooks for calibration UI.
 *
 * Usage example:
 *   const modals = useCalibrationModals();
 *   modals.fileModal.openModal();
 *   modals.superdarkModal.openModal();
 *   modals.presetMenuModal.openModal();
 *   modals.recommendationDialog.showDialog(...);
 *
 * Returns an object with each modal's state and controls.
 */
import { useFileModal } from './useFileModal';
import { useSuperdarkModal } from './useSuperdarkModal';
import { usePresetMenuModal } from './usePresetMenuModal';
import { useRecommendationDialog } from './useRecommendationDialog';

export function useCalibrationModals() {
  const fileModal = useFileModal();
  const superdarkModal = useSuperdarkModal();
  const presetMenuModal = usePresetMenuModal();
  const recommendationDialog = useRecommendationDialog();
  // Add more as needed
  return {
    fileModal,
    superdarkModal,
    presetMenuModal,
    recommendationDialog,
  };
} 