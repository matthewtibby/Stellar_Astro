import { MasterType } from '../types/calibration.types';
import { calibrationHandlersService } from '../services';

/**
 * Create optimized job handlers
 */
export const createJobHandlers = (
  selectedType: MasterType,
  tabState: any,
  setTabState: any,
  defaultTabState: any,
  realFiles: string[],
  projectId: string,
  userId: string,
  selectedSuperdarkPath?: string,
  selectedMasterBias?: string,
  setCalibrationStart?: (time: number) => void,
  setCalibrationEnd?: (time: number | null) => void,
  setJobProgress?: (progress: number) => void,
  setJobStatus?: (status: string) => void,
  setJobId?: (id: string | null) => void,
  actionBtnRef?: React.RefObject<HTMLButtonElement>
) => {
  
  const handleCreateMaster = () => {
    const settings = {
      input_light_ids: [], // placeholder
      advanced_settings: {
        stackingMethod: tabState[selectedType].stackingMethod,
        sigmaThreshold: tabState[selectedType].sigmaThreshold,
        ...(selectedType === 'dark' && {
          darkScaling: tabState[selectedType].darkScaling,
          darkScalingAuto: tabState[selectedType].darkScalingAuto,
          darkScalingFactor: tabState[selectedType].darkScalingFactor,
          biasSubtraction: tabState[selectedType].biasSubtraction,
          ...(tabState[selectedType].biasSubtraction && selectedMasterBias && { masterBiasPath: selectedMasterBias }),
        }),
      },
    };

    setCalibrationStart?.(Date.now());
    setCalibrationEnd?.(null);
    setJobProgress?.(0);
    setJobStatus?.('queued');

    calibrationHandlersService.submitCalibrationJob(
      settings, projectId, userId, selectedType, realFiles, selectedSuperdarkPath, selectedMasterBias
    ).then(data => {
      setJobId?.(data.jobId || null);
      setJobStatus?.('queued');
    }).catch(() => {
      setJobStatus?.('failed');
    });
  };

  const handleCreateMasterWithRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (actionBtnRef) {
      calibrationHandlersService.handleCreateMasterWithRipple(e, actionBtnRef, handleCreateMaster);
    } else {
      handleCreateMaster();
    }
  };

  const handleResetCurrent = () => {
    calibrationHandlersService.handleResetCurrent(selectedType, setTabState, defaultTabState);
  };

  const handleResetAll = () => {
    calibrationHandlersService.handleResetAll(setTabState, defaultTabState);
  };

  return {
    handleCreateMaster,
    handleCreateMasterWithRipple,
    handleResetCurrent,
    handleResetAll,
  };
};
