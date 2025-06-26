import React from 'react';
import { FileListModal } from './FileListModal';
import { FrameQualityReport, HistogramAnalysisReport } from '../../ui/missing-components';
import { MasterType, TabState } from '../types/calibration.types';
import { PresetManagementModal } from './PresetManagementModal';
import { SuperdarkCreationModal } from './SuperdarkCreationModal';

interface ModalContainerProps {
  // Modal states
  showFileModal: boolean;
  showQualityReport: boolean;
  showHistogramReport: boolean;
  showPresetMenu: boolean;
  showSuperdarkModal: boolean;
  
  // Modal controls
  setShowFileModal: (show: boolean) => void;
  setShowQualityReport: (show: boolean) => void;
  setShowHistogramReport: (show: boolean) => void;
  setShowPresetMenu: (show: boolean) => void;
  setShowSuperdarkModal: (show: boolean) => void;
  
  // File modal props
  selectedType: MasterType;
  realFiles: string[];
  fileSearch: string;
  onFileSearchChange: (search: string) => void;
  
  // Quality report props
  qualityAnalysisResults: any;
  
  // Histogram report props
  histogramAnalysisResults: any;
  
  // Preset modal props
  presets: { [K in MasterType]: Record<string, any> };
  setPresets: React.Dispatch<React.SetStateAction<{ [K in MasterType]: Record<string, any> }>>;
  tabState: { [K in MasterType]: TabState };
  setTabState: (updater: (prev: { [K in MasterType]: TabState }) => { [K in MasterType]: TabState }) => void;
  presetNameInput: string;
  setPresetNameInput: (name: string) => void;
  menuDirection: 'up' | 'down';
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  
  // Superdark modal props
  projectId: string;
  userId: string;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
  // Modal states
  showFileModal,
  showQualityReport,
  showHistogramReport,
  showPresetMenu,
  showSuperdarkModal,
  
  // Modal controls
  setShowFileModal,
  setShowQualityReport,
  setShowHistogramReport,
  setShowPresetMenu,
  setShowSuperdarkModal,
  
  // File modal props
  selectedType,
  realFiles,
  fileSearch,
  onFileSearchChange,
  
  // Quality report props
  qualityAnalysisResults,
  
  // Histogram report props
  histogramAnalysisResults,
  
  // Preset modal props
  presets,
  setPresets,
  tabState,
  setTabState,
  presetNameInput,
  setPresetNameInput,
  menuDirection,
  triggerRef,
  
  // Superdark modal props
  projectId,
  userId,
}) => {
  return (
    <>
      {/* File List Modal */}
      <FileListModal
        isOpen={showFileModal}
        onClose={() => setShowFileModal(false)}
        selectedType={selectedType}
        realFiles={realFiles}
        fileSearch={fileSearch}
        onFileSearchChange={onFileSearchChange}
      />
      
      {/* Frame Quality Report Modal */}
      {showQualityReport && qualityAnalysisResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Frame Quality Report</h2>
              <button
                onClick={() => setShowQualityReport(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <FrameQualityReport data={qualityAnalysisResults} />
          </div>
        </div>
      )}
      
      {/* Histogram Analysis Report Modal */}
      {showHistogramReport && histogramAnalysisResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Histogram Analysis Report</h2>
              <button
                onClick={() => setShowHistogramReport(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <HistogramAnalysisReport data={histogramAnalysisResults} />
          </div>
        </div>
      )}
      
      {/* Preset Management Modal */}
      <PresetManagementModal
        isOpen={showPresetMenu}
        onClose={() => setShowPresetMenu(false)}
        selectedType={selectedType}
        presets={presets}
        setPresets={setPresets}
        tabState={tabState}
        setTabState={setTabState}
        presetNameInput={presetNameInput}
        setPresetNameInput={setPresetNameInput}
        menuDirection={menuDirection}
        triggerRef={triggerRef}
      />
      
      {/* Superdark Creation Modal */}
      <SuperdarkCreationModal
        isOpen={showSuperdarkModal}
        onClose={() => setShowSuperdarkModal(false)}
        projectId={projectId}
        userId={userId}
      />
    </>
  );
}; 