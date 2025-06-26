import { MasterType, TabState } from '../types/calibration.types';

export interface PresetHandlersProps {
  selectedType: MasterType;
  tabState: { [K in MasterType]: TabState };
  setTabState: (updater: (prev: { [K in MasterType]: TabState }) => { [K in MasterType]: TabState }) => void;
  presets: { [K in MasterType]: Record<string, any> };
  setPresets: React.Dispatch<React.SetStateAction<{ [K in MasterType]: Record<string, any> }>>;
  presetBtnRef: React.RefObject<HTMLButtonElement | null>;
  setPresetNameInput: (name: string) => void;
  setShowPresetMenu: (show: boolean) => void;
  setPresetMenuDirection: (direction: 'up' | 'down') => void;
}

export const createPresetHandlers = ({
  selectedType,
  tabState,
  setTabState,
  presets,
  setPresets,
  presetBtnRef,
  setPresetNameInput,
  setShowPresetMenu,
  setPresetMenuDirection,
}: PresetHandlersProps) => {
  
  const handleSavePreset = () => {
    setPresetNameInput('');
    // Auto-detect direction
    setTimeout(() => {
      if (presetBtnRef.current) {
        const rect = presetBtnRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < 300 && spaceAbove > spaceBelow) {
          setPresetMenuDirection('up');
        } else {
          setPresetMenuDirection('down');
        }
      }
    }, 0);
    setShowPresetMenu(true);
  };

  const confirmSavePreset = (presetNameInput: string) => {
    if (!presetNameInput.trim()) return;
    setPresets(prev => ({
      ...prev,
      [selectedType]: {
        ...prev[selectedType],
        [presetNameInput.trim()]: { ...tabState[selectedType] }
      }
    }));
    setShowPresetMenu(false);
  };

  const handleLoadPreset = (name: string) => {
    setTabState(prev => ({ 
      ...prev, 
      [selectedType]: { ...presets[selectedType][name] } 
    }));
    setShowPresetMenu(false);
  };

  const handleDeletePreset = (name: string) => {
    setPresets(prev => {
      const updated = { ...prev[selectedType] };
      delete updated[name];
      return { ...prev, [selectedType]: updated };
    });
  };

  return {
    handleSavePreset,
    confirmSavePreset,
    handleLoadPreset,
    handleDeletePreset,
  };
}; 