import { MasterType } from '../../components/calibration/types/calibration.types';

export class PresetManagementService {
  private readonly STORAGE_KEY = 'calibrationPresets_v1';

  /**
   * Load presets from localStorage
   */
  loadPresets(): { [K in MasterType]: Record<string, any> } {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Return default empty presets if parsing fails
      }
    }
    return { dark: {}, flat: {}, bias: {} };
  }

  /**
   * Save presets to localStorage
   */
  savePresets(presets: { [K in MasterType]: Record<string, any> }): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
  }

  /**
   * Save a new preset for a specific frame type
   */
  savePreset(
    presets: { [K in MasterType]: Record<string, any> },
    frameType: MasterType,
    presetName: string,
    tabState: any
  ): { [K in MasterType]: Record<string, any> } {
    const updatedPresets = {
      ...presets,
      [frameType]: {
        ...presets[frameType],
        [presetName.trim()]: { ...tabState }
      }
    };
    
    this.savePresets(updatedPresets);
    return updatedPresets;
  }

  /**
   * Load a preset for a specific frame type
   */
  loadPreset(
    presets: { [K in MasterType]: Record<string, any> },
    frameType: MasterType,
    presetName: string
  ): any {
    return presets[frameType][presetName];
  }

  /**
   * Delete a preset for a specific frame type
   */
  deletePreset(
    presets: { [K in MasterType]: Record<string, any> },
    frameType: MasterType,
    presetName: string
  ): { [K in MasterType]: Record<string, any> } {
    const updatedPresets = { ...presets };
    const frameTypePresets = { ...updatedPresets[frameType] };
    delete frameTypePresets[presetName];
    updatedPresets[frameType] = frameTypePresets;
    
    this.savePresets(updatedPresets);
    return updatedPresets;
  }

  /**
   * Get all preset names for a specific frame type
   */
  getPresetNames(presets: { [K in MasterType]: Record<string, any> }, frameType: MasterType): string[] {
    return Object.keys(presets[frameType]);
  }

  /**
   * Check if a preset exists
   */
  presetExists(
    presets: { [K in MasterType]: Record<string, any> },
    frameType: MasterType,
    presetName: string
  ): boolean {
    return presetName.trim() in presets[frameType];
  }
} 