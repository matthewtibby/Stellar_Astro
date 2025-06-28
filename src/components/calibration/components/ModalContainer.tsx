import React from 'react';
import ReactDOM from 'react-dom';
import { FileListModal } from './FileListModal';
import { FrameQualityReport, HistogramAnalysisReport } from '../../ui/missing-components';
import type { QualityAnalysisResult, HistogramResult, Presets } from '../types/analysis.types';
import type { MasterType, TabState } from '../types/calibration.types';
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
  qualityAnalysisResults: QualityAnalysisResult | null;
  
  // Histogram report props
  histogramAnalysisResults: HistogramResult | null;
  
  // Preset modal props
  presets: Presets;
  setPresets: React.Dispatch<React.SetStateAction<Presets>>;
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
        typeof document !== 'undefined'
          ? ReactDOM.createPortal(
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
                role="dialog"
                aria-modal="true"
                aria-labelledby="frame-quality-report-title"
                tabIndex={-1}
                onKeyDown={e => { if (e.key === 'Escape') setShowQualityReport(false); }}
              >
                <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 id="frame-quality-report-title" className="text-xl font-semibold">Frame Quality Report</h2>
                    <button
                      onClick={() => setShowQualityReport(false)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Close Frame Quality Report"
                    >
                      ✕
                    </button>
                  </div>
                  <FrameQualityReport data={qualityAnalysisResults} />
                </div>
              </div>,
              document.body
            )
          : null
      )}
      
      {/* Histogram Analysis Report Modal */}
      {showHistogramReport && histogramAnalysisResults && (
        typeof document !== 'undefined'
          ? ReactDOM.createPortal(
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
                role="dialog"
                aria-modal="true"
                aria-labelledby="histogram-analysis-report-title"
                tabIndex={-1}
                onKeyDown={e => { if (e.key === 'Escape') setShowHistogramReport(false); }}
              >
                <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 id="histogram-analysis-report-title" className="text-xl font-semibold">Histogram Analysis Report</h2>
                    <button
                      onClick={() => setShowHistogramReport(false)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Close Histogram Analysis Report"
                    >
                      ✕
                    </button>
                  </div>
                  <HistogramAnalysisReport data={histogramAnalysisResults} />
                </div>
              </div>,
              document.body
            )
          : null
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