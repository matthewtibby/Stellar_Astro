import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { MasterType, TabState } from '../types/calibration.types';

interface PresetManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedType: MasterType;
  presets: { [K in MasterType]: Record<string, any> };
  setPresets: React.Dispatch<React.SetStateAction<{ [K in MasterType]: Record<string, any> }>>;
  tabState: { [K in MasterType]: TabState };
  setTabState: (updater: (prev: { [K in MasterType]: TabState }) => { [K in MasterType]: TabState }) => void;
  presetNameInput: string;
  setPresetNameInput: (name: string) => void;
  menuDirection: 'up' | 'down';
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export const PresetManagementModal: React.FC<PresetManagementModalProps> = ({
  isOpen,
  onClose,
  selectedType,
  presets,
  setPresets,
  tabState,
  setTabState,
  presetNameInput,
  setPresetNameInput,
  menuDirection,
  triggerRef,
}) => {
  if (!isOpen) return null;

  // Accessibility: focus modal when opened
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const handleSavePreset = () => {
    if (!presetNameInput.trim()) return;
    
    setPresets(prev => ({
      ...prev,
      [selectedType]: {
        ...prev[selectedType],
        [presetNameInput.trim()]: { ...tabState[selectedType] }
      }
    }));
    
    onClose();
  };

  const handleLoadPreset = (name: string) => {
    setTabState(prev => ({ 
      ...prev, 
      [selectedType]: { ...presets[selectedType][name] } 
    }));
    onClose();
  };

  const handleDeletePreset = (name: string) => {
    setPresets(prev => {
      const updated = { ...prev[selectedType] };
      delete updated[name];
      return { ...prev, [selectedType]: updated };
    });
  };

  // Calculate position relative to trigger button
  const getPosition = () => {
    if (!triggerRef.current) return {};
    
    const rect = triggerRef.current.getBoundingClientRect();
    const modalHeight = 300; // Approximate modal height
    
    if (menuDirection === 'up') {
      return {
        position: 'fixed' as const,
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
        zIndex: 1000,
      };
    } else {
      return {
        position: 'fixed' as const,
        top: rect.bottom + 8,
        left: rect.left,
        zIndex: 1000,
      };
    }
  };

  const currentPresets = presets[selectedType] || {};
  const presetNames = Object.keys(currentPresets);

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg border p-4 w-80"
        style={getPosition()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preset-management-modal-title"
        tabIndex={-1}
        onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
      >
        <div className="mb-4">
          <h3 id="preset-management-modal-title" className="text-lg font-semibold mb-2">Preset Management</h3>
          <p className="text-sm text-gray-600">
            Save and load {selectedType} frame settings
          </p>
        </div>

        {/* Save New Preset */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Save Current Settings
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              placeholder="Preset name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSavePreset();
                } else if (e.key === 'Escape') {
                  onClose();
                }
              }}
              autoFocus
            />
            <button
              onClick={handleSavePreset}
              disabled={!presetNameInput.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>

        {/* Load Existing Presets */}
        {presetNames.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Load Saved Preset
            </label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {presetNames.map((name) => (
                <div 
                  key={name} 
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                >
                  <button
                    onClick={() => handleLoadPreset(name)}
                    className="flex-1 text-left text-sm text-gray-700 hover:text-blue-600"
                  >
                    {name}
                  </button>
                  <button
                    onClick={() => handleDeletePreset(name)}
                    className="ml-2 text-red-500 hover:text-red-700 text-sm"
                    title="Delete preset"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {presetNames.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No saved presets yet
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <button
            onClick={onClose}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );

  // Use React Portal to render modal at document.body
  if (typeof document !== 'undefined') {
    return ReactDOM.createPortal(modalContent, document.body);
  }
  return null;
}; 