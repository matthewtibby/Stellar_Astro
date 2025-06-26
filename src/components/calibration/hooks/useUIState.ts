import { useState, useRef } from 'react';

export const useUIState = () => {
  // Modal and dialog states
  const [showHistogram, setShowHistogram] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [showSuperdarkModal, setShowSuperdarkModal] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);

  // Search and filter states
  const [fileSearch, setFileSearch] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);

  // Notification and recommendation states
  const [recommendationDialog, setRecommendationDialog] = useState<null | {
    recommendation: { method: string; sigma?: number; reason: string };
    userMethod: string;
    userSigma?: number;
    onAccept: () => void;
    onDecline: () => void;
  }>(null);

  // Preview and loading states
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string | null }>({});
  const [previewLoadings, setPreviewLoadings] = useState<{ [key: string]: boolean }>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Success and notification states
  const [showSuccess, setShowSuccess] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  // Timing states
  const [calibrationStart, setCalibrationStart] = useState<number | null>(null);
  const [calibrationEnd, setCalibrationEnd] = useState<number | null>(null);

  // Master stats
  const [masterStats, setMasterStats] = useState<any>(null);

  // Superdark-related states
  const [selectedSuperdarkPath, setSelectedSuperdarkPath] = useState<string>('');
  const [superdarkPreviewUrl, setSuperdarkPreviewUrl] = useState<string | null>(null);
  const [superdarkStats, setSuperdarkStats] = useState<any>(null);
  const [superdarkStatsLoading, setSuperdarkStatsLoading] = useState(false);
  const [availableDarks, setAvailableDarks] = useState<any[]>([]);
  const [selectedDarkPaths, setSelectedDarkPaths] = useState<string[]>([]);
  const [superdarkRefetchTrigger, setSuperdarkRefetchTrigger] = useState(0);

  // Preset menu direction
  const [presetMenuDirection, setPresetMenuDirection] = useState<'down' | 'up'>('down');
  const [presetNameInput, setPresetNameInput] = useState('');

  // Feature flags
  const [smartDefaultsEnabled, setSmartDefaultsEnabled] = useState(true);

  // Refs
  const actionBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Helper functions
  const openSuperdarkModal = () => {
    setShowSuperdarkModal(true);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Close any open modals
      setShowFileModal(false);
      setShowSuperdarkModal(false);
      setShowPresetMenu(false);
      setShowSkipDialog(false);
      setRecommendationDialog(null);
    }
  };

  // Navigation helpers
  const handleBack = () => {
    // Navigate to previous step - implementation depends on routing
    console.log('Navigate back');
  };

  const handleNextStep = () => {
    // Navigate to light stacking step - implementation depends on routing
    console.log('Navigate to next step');
  };

  const resetUIState = () => {
    setShowHistogram(false);
    setShowFileModal(false);
    setShowSkipDialog(false);
    setShowSuperdarkModal(false);
    setShowPresetMenu(false);
    setFileSearch('');
    setRecommendationDialog(null);
    setPreviewUrls({});
    setPreviewLoadings({});
    setPreviewUrl(null);
    setPreviewLoading(false);
    setPreviewError(null);
    setShowSuccess(false);
    setCancelMessage(null);
    setMasterStats(null);
    setSelectedSuperdarkPath('');
    setSuperdarkPreviewUrl(null);
    setSuperdarkStats(null);
    setSuperdarkStatsLoading(false);
    setAvailableDarks([]);
    setSelectedDarkPaths([]);
    setSuperdarkRefetchTrigger(0);
    setPresetNameInput('');
  };

  return {
    // Modal states
    showHistogram,
    setShowHistogram,
    showFileModal,
    setShowFileModal,
    showSkipDialog,
    setShowSkipDialog,
    showSuperdarkModal,
    setShowSuperdarkModal,
    showPresetMenu,
    setShowPresetMenu,

    // Search and filter
    fileSearch,
    setFileSearch,
    isAdvancedOpen,
    setIsAdvancedOpen,

    // Recommendations and dialogs
    recommendationDialog,
    setRecommendationDialog,

    // Preview states
    previewUrls,
    setPreviewUrls,
    previewLoadings,
    setPreviewLoadings,
    previewUrl,
    setPreviewUrl,
    previewLoading,
    setPreviewLoading,
    previewError,
    setPreviewError,

    // Success and notifications
    showSuccess,
    setShowSuccess,
    cancelMessage,
    setCancelMessage,

    // Timing
    calibrationStart,
    setCalibrationStart,
    calibrationEnd,
    setCalibrationEnd,

    // Stats
    masterStats,
    setMasterStats,

    // Superdark states
    selectedSuperdarkPath,
    setSelectedSuperdarkPath,
    superdarkPreviewUrl,
    setSuperdarkPreviewUrl,
    superdarkStats,
    setSuperdarkStats,
    superdarkStatsLoading,
    setSuperdarkStatsLoading,
    availableDarks,
    setAvailableDarks,
    selectedDarkPaths,
    setSelectedDarkPaths,
    superdarkRefetchTrigger,
    setSuperdarkRefetchTrigger,

    // Preset menu
    presetMenuDirection,
    setPresetMenuDirection,
    presetNameInput,
    setPresetNameInput,

    // Feature flags
    smartDefaultsEnabled,
    setSmartDefaultsEnabled,

    // Refs
    actionBtnRef,
    modalRef,

    // Helper functions
    openSuperdarkModal,
    handleKeyDown,
    handleBack,
    handleNextStep,
    resetUIState,
  };
}; 