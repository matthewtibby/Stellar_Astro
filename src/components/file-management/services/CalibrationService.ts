import { FilesByType, FileType } from '../types';
import { REQUIRED_CALIBRATION_TYPES, ERROR_MESSAGES } from '../constants';

/**
 * Service class for handling calibration validation and progress
 * Manages calibration requirements and validation logic
 */
export class CalibrationService {
  /**
   * Validate calibration requirements
   */
  static validateCalibrationRequirements(filesByType: FilesByType): {
    isValid: boolean;
    missingTypes: FileType[];
    hasLightFrames: boolean;
  } {
    const missingTypes = REQUIRED_CALIBRATION_TYPES.filter(
      type => filesByType[type].length === 0
    );
    
    const hasLightFrames = filesByType['light'].length > 0;
    
    return {
      isValid: missingTypes.length === 0 && hasLightFrames,
      missingTypes,
      hasLightFrames
    };
  }

  /**
   * Check if calibration can proceed
   */
  static canProceedToCalibration(filesByType: FilesByType): boolean {
    const { hasLightFrames } = this.validateCalibrationRequirements(filesByType);
    return hasLightFrames;
  }

  /**
   * Get missing frame types for calibration
   */
  static getMissingFrameTypes(filesByType: FilesByType): FileType[] {
    return REQUIRED_CALIBRATION_TYPES.filter(
      type => filesByType[type].length === 0
    );
  }

  /**
   * Handle calibration progress logic
   */
  static handleCalibrationProgress(filesByType: FilesByType): {
    canProceed: boolean;
    missingTypes: FileType[];
    errorMessage?: string;
  } {
    if (filesByType['light'].length === 0) {
      return {
        canProceed: false,
        missingTypes: [],
        errorMessage: ERROR_MESSAGES.NO_LIGHT_FRAMES
      };
    }

    const missingTypes = this.getMissingFrameTypes(filesByType);
    
    if (missingTypes.length > 0) {
      return {
        canProceed: false,
        missingTypes,
      };
    }

    return {
      canProceed: true,
      missingTypes: []
    };
  }

  /**
   * Proceed with calibration (placeholder for actual implementation)
   */
  static proceedToCalibration(): void {
    console.log('Proceeding to calibration step...');
  }

  /**
   * Proceed with calibration despite missing frames
   */
  static proceedDespiteMissingFrames(): void {
    console.log('Proceeding to calibration step despite missing frames...');
  }
} 