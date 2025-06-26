import { useState } from 'react';
import { FileType, FilesByType } from '../types';
import { CalibrationService } from '../services';

/**
 * Custom hook for managing calibration state and validation
 * Handles calibration warnings, missing frame types, and progress logic
 */
export const useCalibrationState = () => {
  const [showCalibrationWarning, setShowCalibrationWarning] = useState(false);
  const [missingFrameTypes, setMissingFrameTypes] = useState<FileType[]>([]);

  const handleCalibrationProgress = (filesByType: FilesByType) => {
    const result = CalibrationService.handleCalibrationProgress(filesByType);
    
    if (result.errorMessage) {
      console.error(result.errorMessage);
      return;
    }

    if (!result.canProceed && result.missingTypes.length > 0) {
      setMissingFrameTypes(result.missingTypes);
      setShowCalibrationWarning(true);
      return;
    }

    CalibrationService.proceedToCalibration();
  };

  const handleConfirmCalibration = () => {
    setShowCalibrationWarning(false);
    CalibrationService.proceedDespiteMissingFrames();
  };

  const handleCancelCalibration = () => {
    setShowCalibrationWarning(false);
  };

  const validateCalibrationRequirements = (filesByType: FilesByType) => {
    return CalibrationService.validateCalibrationRequirements(filesByType);
  };

  return {
    showCalibrationWarning,
    missingFrameTypes,
    handleCalibrationProgress,
    handleConfirmCalibration,
    handleCancelCalibration,
    validateCalibrationRequirements
  };
}; 