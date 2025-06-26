import { MasterType } from '../types/calibration.types';

export class CalibrationHandlersService {
  /**
   * Submit a calibration job with the given settings
   */
  async submitCalibrationJob(settings: any, projectId: string, userId: string, selectedType: MasterType, realFiles: string[], selectedSuperdarkPath?: string, selectedMasterBias?: string) {
    // Use real files if available, else fallback to placeholder
    const input_paths = realFiles
      .filter(f => f.toLowerCase().endsWith('.fit') || f.toLowerCase().endsWith('.fits'))
      .map(f => `${userId}/${projectId}/${selectedType}/${f}`);
    const output_base = `${userId}/${projectId}/${selectedType}/master_${selectedType}`;
    
    // For darks, also gather light frame paths for scaling
    let light_input_paths: string[] | undefined = undefined;
    if (selectedType === 'dark') {
      // Try to list light frames in the same project/user
      // (Assume the same naming convention as realFiles, but for 'light')
      // This would need to be implemented based on actual storage structure
    }
    
    const reqBody = {
      input_bucket: 'raw-frames',
      input_paths,
      ...(light_input_paths ? { light_input_paths } : {}),
      output_bucket: 'master-frames',
      output_base,
      advanced_settings: settings.advanced_settings,
      projectId,
      userId,
      selectedType,
      darkOptimization: settings.darkOptimization,
      superdarkPath: selectedSuperdarkPath,
      ...(selectedMasterBias && { masterBiasPath: selectedMasterBias }),
    };
    
    const res = await fetch(`/api/projects/${projectId}/calibration-jobs/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
    });
    
    return await res.json();
  }

  /**
   * Handle cosmetic method toggling with conflict resolution
   */
  handleCosmeticMethodToggle(
    frameType: MasterType, 
    methodValue: string, 
    enabled: boolean,
    tabState: any,
    setTabState: any,
    cosmeticMethods: any
  ) {
    setTabState((prev: any) => {
      const newCosmeticMethods = { ...prev[frameType].cosmeticMethods };
      
      if (enabled) {
        const conflictingMethods = cosmeticMethods.getConflictingMethods(methodValue);
        
        conflictingMethods.forEach((conflictMethod: string) => {
          if (newCosmeticMethods[conflictMethod]?.enabled) {
            newCosmeticMethods[conflictMethod] = {
              ...newCosmeticMethods[conflictMethod],
              enabled: false
            };
          }
        });
      }
      
      newCosmeticMethods[methodValue] = {
        ...newCosmeticMethods[methodValue],
        enabled
      };

      return {
        ...prev,
        [frameType]: {
          ...prev[frameType],
          cosmeticMethods: newCosmeticMethods
        }
      };
    });
  }

  /**
   * Reset current tab to defaults
   */
  handleResetCurrent(selectedType: MasterType, setTabState: any, defaultTabState: any) {
    setTabState((prev: any) => ({ 
      ...prev, 
      [selectedType]: { ...defaultTabState[selectedType] } 
    }));
  }

  /**
   * Reset all tabs to defaults
   */
  handleResetAll(setTabState: any, defaultTabState: any) {
    setTabState(defaultTabState);
  }

  /**
   * Create ripple effect for primary action button
   */
  handleCreateMasterWithRipple(
    e: React.MouseEvent<HTMLButtonElement>, 
    actionBtnRef: React.RefObject<HTMLButtonElement>,
    handleCreateMaster: () => void
  ) {
    const btn = actionBtnRef.current;
    if (btn) {
      const circle = document.createElement('span');
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      const radius = diameter / 2;
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - btn.getBoundingClientRect().left - radius}px`;
      circle.style.top = `${e.clientY - btn.getBoundingClientRect().top - radius}px`;
      circle.className = 'ripple';
      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    }
    handleCreateMaster();
  }
}

// Export singleton instance
export const calibrationHandlersService = new CalibrationHandlersService();
