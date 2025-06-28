import React, { useEffect } from 'react';

// Import UI components
import { TooltipProvider } from '../components/ui/tooltip';

// Import hooks - Phase 5.5 Final Optimized Architecture
import {
  useCalibrationModals,
  useEnhancedCalibrationState,
  useJobOperations,
  useJobPolling,
  useDataEffects,
  useLocalState,
  useUIState
} from './calibration/hooks';

// Import types and utilities
import { 
  MasterType,
  FRAME_TYPES
} from './calibration/types/calibration.types';

// Import utils - Phase 5.5 Final Optimized
import { getMasterStatus } from './calibration/utils/statusUtils';

// Import components
import { 
  MasterTabNavigation,
  CalibrationSettingsPanel,
  MasterPreviewPanel,
  ModalContainer,
  SuccessToast,
  ActionButtons
} from './calibration/components';

/**
 * CalibrationScaffoldUI
 *
 * Main UI scaffold for the calibration workflow. Composes all calibration state, modular modal management, and job operations.
 *
 * Modular modal management is handled via useCalibrationModals, which provides state and controls for each modal type.
 *
 * Example usage:
 *   const modals = useCalibrationModals();
 *   modals.fileModal.openModal();
 *   modals.superdarkModal.closeModal();
 *
 * Props:
 *   - projectId: string (project identifier)
 *   - userId: string (user identifier)
 */
const CalibrationScaffoldUI: React.FC<{ projectId: string, userId: string }> = ({ projectId, userId }) => {
  
  // Phase 5.5 Final Optimized Hook Architecture
  const calibrationState = useEnhancedCalibrationState();
  // --- Modular modal management ---
  const modals = useCalibrationModals();
  const jobOperations = useJobOperations(projectId);
  const localState = useLocalState();
  const uiState = useUIState();

  // Simple destructuring that works
  const { selectedType, setSelectedType, tabState, setTabState } = calibrationState;
  const { realFiles, setRealFiles, previewUrls, setPreviewUrls } = calibrationState;
  const { showSuccess, previewUrl, previewLoading, superdarkPreviewUrl } = calibrationState;
  const { selectedSuperdarkPath, superdarkStats, superdarkStatsLoading } = calibrationState;
  const { setSuperdarkStats, setSuperdarkStatsLoading, setSuperdarkPreviewUrl } = calibrationState;
  const { previewError } = calibrationState;

  // Modal state and setters from modular hooks
  const { fileModal, presetMenuModal } = modals;
  // Modal management (replace destructuring from old modalManagement)
  const showFileModal = fileModal.open;
  const setShowFileModal = fileModal.setOpen;
  const fileSearch = fileModal.fileSearch;
  const setFileSearch = fileModal.setFileSearch;
  const presetBtnRef = presetMenuModal.presetBtnRef;
  const showPresetMenu = presetMenuModal.open;
  const setShowPresetMenu = presetMenuModal.setOpen;
  const presetNameInput = presetMenuModal.presetNameInput;
  const setPresetNameInput = presetMenuModal.setPresetNameInput;
  const presetMenuDirection = presetMenuModal.menuDirection;

  // UI modal state
  const { showHistogram, setShowHistogram, handleBack, handleNextStep } = uiState;

  // Job operations
  const { jobStatus, jobId, setJobStatus, setJobProgress } = jobOperations;

  // Local state from hook
  const { 
    qualityAnalysisResults, setQualityAnalysisResults, showHistogramReport, setShowHistogramReport,
    setLastMeta, setLastAutoPopulated,
    presetNameInput: localPresetNameInput, setPresetNameInput: setLocalPresetNameInput, showPresetMenu: localShowPresetMenu, setShowPresetMenu: setLocalShowPresetMenu,
    presetMenuDirection: localPresetMenuDirection, presets, setPresets,
    setPreviewLoadings,
    setLaCosmicParams, setAutoPopulated
  } = localState;

  // Phase 5.5 - Use extracted data effects hook
  useDataEffects({
    selectedSuperdarkPath, projectId, userId, selectedType, realFiles,
    setSuperdarkPreviewUrl, setSuperdarkStats, setSuperdarkStatsLoading,
    setPreviewUrls, setRealFiles, setLaCosmicParams, setAutoPopulated,
    setLastAutoPopulated, setLastMeta,
  });

  // Job polling effects
  useJobPolling({
    jobStatus, jobId, projectId, selectedType, setJobProgress, setJobStatus,
    setShowSuccess: () => {}, setPreviewUrls, setPreviewLoadings,
    setPreviewUrl: () => {}, setPreviewLoading: () => {},
    setQualityAnalysisResults, modalManagement: { setShowQualityReport }, previewUrls
  });

  // Keyboard accessibility for modal
  useEffect(() => {
    if (!showFileModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFileModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFileModal, setShowFileModal]);

  // Phase 5.5 - Use utility for status computation
  const getMasterStatusForType = (type: MasterType) => getMasterStatus(type, previewUrls, jobStatus, selectedType);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-[#0a0d13]/80 rounded-2xl shadow-2xl border border-[#232946]/60 p-6 backdrop-blur-md">
        <SuccessToast showSuccess={showSuccess} />
        
        <ModalContainer
          showFileModal={showFileModal}
          showQualityReport={showHistogramReport}
          showHistogramReport={showHistogramReport}
          showPresetMenu={showPresetMenu}
          showSuperdarkModal={false}
          setShowFileModal={setShowFileModal}
          setShowQualityReport={setShowHistogramReport}
          setShowHistogramReport={setShowHistogramReport}
          setShowPresetMenu={setShowPresetMenu}
          setShowSuperdarkModal={() => {}}
          selectedType={selectedType}
          realFiles={realFiles}
          fileSearch={fileSearch}
          onFileSearchChange={setFileSearch}
          qualityAnalysisResults={qualityAnalysisResults}
          histogramAnalysisResults={null}
          presets={presets}
          setPresets={setPresets}
          tabState={tabState}
          setTabState={setTabState}
          presetNameInput={presetNameInput}
          setPresetNameInput={setPresetNameInput}
          menuDirection={presetMenuDirection}
          triggerRef={presetBtnRef}
          projectId={projectId}
          userId={userId}
        />
        
        <MasterTabNavigation
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          getMasterStatus={getMasterStatusForType}
        />
        
        <div className="flex flex-row gap-6 w-full transition-all duration-500 animate-fade-in">
          <CalibrationSettingsPanel
            selectedType={selectedType}
            realFiles={realFiles}
            onShowFileModal={() => setShowFileModal(true)}
            getMasterStatus={getMasterStatusForType}
            tabState={tabState}
            setTabState={setTabState}
          />
          
          <MasterPreviewPanel
            selectedType={selectedType}
            previewLoading={previewLoading}
            previewUrl={previewUrl}
            superdarkPreviewUrl={superdarkPreviewUrl}
            selectedSuperdarkPath={selectedSuperdarkPath}
            masterStats={null}
            superdarkStats={superdarkStats}
            superdarkStatsLoading={superdarkStatsLoading}
            showHistogram={showHistogram}
            setShowHistogram={setShowHistogram}
            qualityAnalysisResults={qualityAnalysisResults}
            showQualityReport={showHistogramReport}
            setShowQualityReport={setShowHistogramReport}
            previewError={previewError}
            FRAME_TYPES={FRAME_TYPES}
          />
        </div>

        <ActionButtons onBack={handleBack} onNext={handleNextStep} />
      </div>
    </TooltipProvider>
  );
};

export default CalibrationScaffoldUI;