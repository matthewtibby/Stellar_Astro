import React, { useEffect } from 'react';

// Import UI components
import { TooltipProvider } from '../components/ui/tooltip';

// Import hooks - Phase 5.5 Final Optimized Architecture
import {
  useModalManagement,
  useEnhancedCalibrationState,
  useJobOperations,
  useJobPolling,
  useDataEffects,
  useLocalState
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

const CalibrationScaffoldUI: React.FC<{ projectId: string, userId: string }> = ({ projectId, userId }) => {
  
  // Phase 5.5 Final Optimized Hook Architecture
  const calibrationState = useEnhancedCalibrationState();
  const modalManagement = useModalManagement();
  const jobOperations = useJobOperations(projectId);
  const localState = useLocalState();

  // Simple destructuring that works
  const { selectedType, setSelectedType, tabState, setTabState } = calibrationState;
  const { realFiles, setRealFiles, previewUrls, setPreviewUrls, masterStats } = calibrationState;
  const { showSuccess, previewUrl, previewLoading, superdarkPreviewUrl } = calibrationState;
  const { selectedSuperdarkPath, superdarkStats, superdarkStatsLoading } = calibrationState;
  const { setSuperdarkStats, setSuperdarkStatsLoading, setSuperdarkPreviewUrl } = calibrationState;
  const { previewError } = calibrationState;

  // Modal management
  const { showFileModal, setShowFileModal, showHistogram, fileSearch, showQualityReport } = modalManagement;
  const { presetBtnRef } = modalManagement;

  // Job operations
  const { jobStatus, jobId, setJobStatus, setJobProgress } = jobOperations;

  // Local state from hook
  const { 
    qualityAnalysisResults, setQualityAnalysisResults, showHistogramReport, setShowHistogramReport,
    setLastMeta, setLastAutoPopulated,
    presetNameInput, setPresetNameInput, showPresetMenu, setShowPresetMenu,
    presetMenuDirection, presets, setPresets,
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
    setQualityAnalysisResults, modalManagement, previewUrls
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

  // Navigation helpers
  const handleBack = () => modalManagement.handleBack();
  const handleNextStep = () => modalManagement.handleNextStep();

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-[#0a0d13]/80 rounded-2xl shadow-2xl border border-[#232946]/60 p-6 backdrop-blur-md">
        <SuccessToast showSuccess={showSuccess} />
        
        <ModalContainer
          showFileModal={showFileModal}
          showQualityReport={showQualityReport}
          showHistogramReport={showHistogramReport}
          showPresetMenu={showPresetMenu}
          showSuperdarkModal={false}
          setShowFileModal={modalManagement.setShowFileModal}
          setShowQualityReport={modalManagement.setShowQualityReport}
          setShowHistogramReport={setShowHistogramReport}
          setShowPresetMenu={setShowPresetMenu}
          setShowSuperdarkModal={() => {}}
          selectedType={selectedType}
          realFiles={realFiles}
          fileSearch={fileSearch}
          onFileSearchChange={modalManagement.setFileSearch}
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
            onShowFileModal={() => modalManagement.setShowFileModal(true)}
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
            masterStats={masterStats}
            superdarkStats={superdarkStats}
            superdarkStatsLoading={superdarkStatsLoading}
            showHistogram={showHistogram}
            setShowHistogram={modalManagement.setShowHistogram}
            qualityAnalysisResults={qualityAnalysisResults}
            showQualityReport={showQualityReport}
            setShowQualityReport={modalManagement.setShowQualityReport}
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