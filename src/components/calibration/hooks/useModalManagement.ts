import { useState, useCallback, useRef, useEffect } from 'react';

interface RecommendationDialog {
  recommendation: { method: string; sigma?: number; reason: string };
  userMethod: string;
  userSigma?: number;
  onAccept: () => void;
  onDecline: () => void;
}

interface ModalState {
  // Core modals
  showFileModal: boolean;
  showSuperdarkModal: boolean;
  showSkipDialog: boolean;
  
  // Analysis modals
  showHistogram: boolean;
  showQualityReport: boolean;
  showHistogramReport: boolean;
  
  // Settings modals
  showPresetMenu: boolean;
  
  // Dialog states
  recommendationDialog: RecommendationDialog | null;
  
  // Search and filter
  fileSearch: string;
  isAdvancedOpen: boolean;
  
  // Preset management
  presetNameInput: string;
  presetMenuDirection: 'down' | 'up';
}

export const useModalManagement = () => {
  const [modalState, setModalState] = useState<ModalState>({
    showFileModal: false,
    showSuperdarkModal: false,
    showSkipDialog: false,
    showHistogram: false,
    showQualityReport: false,
    showHistogramReport: false,
    showPresetMenu: false,
    recommendationDialog: null,
    fileSearch: '',
    isAdvancedOpen: true,
    presetNameInput: '',
    presetMenuDirection: 'down',
  });

  // Refs for modal management
  const actionBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const presetBtnRef = useRef<HTMLButtonElement>(null);

  // Modal control functions
  const openModal = useCallback((modalName: keyof ModalState) => {
    setModalState(prev => ({ ...prev, [modalName]: true }));
  }, []);

  const closeModal = useCallback((modalName: keyof ModalState) => {
    setModalState(prev => ({ ...prev, [modalName]: false }));
  }, []);

  const toggleModal = useCallback((modalName: keyof ModalState) => {
    setModalState(prev => ({ ...prev, [modalName]: !prev[modalName] }));
  }, []);

  // Specialized modal functions
  const openFileModal = useCallback(() => {
    setModalState(prev => ({ ...prev, showFileModal: true, fileSearch: '' }));
  }, []);

  const closeFileModal = useCallback(() => {
    setModalState(prev => ({ ...prev, showFileModal: false, fileSearch: '' }));
  }, []);

  const openSuperdarkModal = useCallback(() => {
    console.log('[DEBUG] openSuperdarkModal called');
    setModalState(prev => ({ ...prev, showSuperdarkModal: true }));
  }, []);

  const closeSuperdarkModal = useCallback(() => {
    setModalState(prev => ({ ...prev, showSuperdarkModal: false }));
  }, []);

  const openPresetMenu = useCallback(() => {
    setModalState(prev => ({ ...prev, presetNameInput: '' }));
    
    // Auto-detect direction
    setTimeout(() => {
      if (presetBtnRef.current) {
        const rect = presetBtnRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < 300 && spaceAbove > spaceBelow) {
          setModalState(prev => ({ ...prev, presetMenuDirection: 'up' }));
        } else {
          setModalState(prev => ({ ...prev, presetMenuDirection: 'down' }));
        }
      }
    }, 0);
    
    setModalState(prev => ({ ...prev, showPresetMenu: true }));
  }, []);

  const closePresetMenu = useCallback(() => {
    setModalState(prev => ({ 
      ...prev, 
      showPresetMenu: false, 
      presetNameInput: '' 
    }));
  }, []);

  // Recommendation dialog management
  const showRecommendationDialog = useCallback((dialog: RecommendationDialog) => {
    setModalState(prev => ({ ...prev, recommendationDialog: dialog }));
  }, []);

  const closeRecommendationDialog = useCallback(() => {
    setModalState(prev => ({ ...prev, recommendationDialog: null }));
  }, []);

  // Search and filter management
  const setFileSearch = useCallback((search: string) => {
    setModalState(prev => ({ ...prev, fileSearch: search }));
  }, []);

  const setPresetNameInput = useCallback((name: string) => {
    setModalState(prev => ({ ...prev, presetNameInput: name }));
  }, []);

  const toggleAdvanced = useCallback(() => {
    setModalState(prev => ({ ...prev, isAdvancedOpen: !prev.isAdvancedOpen }));
  }, []);

  // Global keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setModalState(prev => ({
        ...prev,
        showFileModal: false,
        showSuperdarkModal: false,
        showPresetMenu: false,
        showSkipDialog: false,
        showHistogram: false,
        showQualityReport: false,
        showHistogramReport: false,
        recommendationDialog: null,
        fileSearch: '',
        presetNameInput: '',
      }));
    }
  }, []);

  // Bulk modal operations
  const closeAllModals = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      showFileModal: false,
      showSuperdarkModal: false,
      showSkipDialog: false,
      showHistogram: false,
      showQualityReport: false,
      showHistogramReport: false,
      showPresetMenu: false,
      recommendationDialog: null,
    }));
  }, []);

  const resetModalState = useCallback(() => {
    setModalState({
      showFileModal: false,
      showSuperdarkModal: false,
      showSkipDialog: false,
      showHistogram: false,
      showQualityReport: false,
      showHistogramReport: false,
      showPresetMenu: false,
      recommendationDialog: null,
      fileSearch: '',
      isAdvancedOpen: true,
      presetNameInput: '',
      presetMenuDirection: 'down',
    });
  }, []);

  // Navigation helpers
  const handleBack = useCallback(() => {
    console.log('Navigate back');
    // Implementation depends on routing system
  }, []);

  const handleNextStep = useCallback(() => {
    console.log('Navigate to next step');
    // Implementation depends on routing system
  }, []);

  // Set up global keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus management for modals
  useEffect(() => {
    if (modalState.showFileModal && modalRef.current) {
      modalRef.current.focus();
    }
  }, [modalState.showFileModal]);

  return {
    // State
    modalState,
    
    // Refs
    actionBtnRef,
    modalRef,
    presetBtnRef,
    
    // Generic modal controls
    openModal,
    closeModal,
    toggleModal,
    
    // Specific modal controls
    openFileModal,
    closeFileModal,
    openSuperdarkModal,
    closeSuperdarkModal,
    openPresetMenu,
    closePresetMenu,
    
    // Dialog management
    showRecommendationDialog,
    closeRecommendationDialog,
    
    // Search and filter
    setFileSearch,
    setPresetNameInput,
    toggleAdvanced,
    
    // Bulk operations
    closeAllModals,
    resetModalState,
    
    // Navigation
    handleBack,
    handleNextStep,
    
    // Keyboard handling
    handleKeyDown,
    
    // Individual state access for convenience
    showFileModal: modalState.showFileModal,
    showSuperdarkModal: modalState.showSuperdarkModal,
    showSkipDialog: modalState.showSkipDialog,
    showHistogram: modalState.showHistogram,
    showQualityReport: modalState.showQualityReport,
    showHistogramReport: modalState.showHistogramReport,
    showPresetMenu: modalState.showPresetMenu,
    recommendationDialog: modalState.recommendationDialog,
    fileSearch: modalState.fileSearch,
    isAdvancedOpen: modalState.isAdvancedOpen,
    presetNameInput: modalState.presetNameInput,
    presetMenuDirection: modalState.presetMenuDirection,
    
    // Setters for individual state (React standard pattern)
    setShowFileModal: (show: boolean | ((prev: boolean) => boolean)) => {
      if (typeof show === 'function') {
        setModalState(prev => ({ ...prev, showFileModal: show(prev.showFileModal) }));
      } else {
        setModalState(prev => ({ ...prev, showFileModal: show }));
      }
    },
    setShowSuperdarkModal: (show: boolean | ((prev: boolean) => boolean)) => {
      if (typeof show === 'function') {
        setModalState(prev => ({ ...prev, showSuperdarkModal: show(prev.showSuperdarkModal) }));
      } else {
        setModalState(prev => ({ ...prev, showSuperdarkModal: show }));
      }
    },
    setShowSkipDialog: (show: boolean | ((prev: boolean) => boolean)) => {
      if (typeof show === 'function') {
        setModalState(prev => ({ ...prev, showSkipDialog: show(prev.showSkipDialog) }));
      } else {
        setModalState(prev => ({ ...prev, showSkipDialog: show }));
      }
    },
    setShowHistogram: (show: boolean | ((prev: boolean) => boolean)) => {
      if (typeof show === 'function') {
        setModalState(prev => ({ ...prev, showHistogram: show(prev.showHistogram) }));
      } else {
        setModalState(prev => ({ ...prev, showHistogram: show }));
      }
    },
    setShowQualityReport: (show: boolean | ((prev: boolean) => boolean)) => {
      if (typeof show === 'function') {
        setModalState(prev => ({ ...prev, showQualityReport: show(prev.showQualityReport) }));
      } else {
        setModalState(prev => ({ ...prev, showQualityReport: show }));
      }
    },
    setShowHistogramReport: (show: boolean | ((prev: boolean) => boolean)) => {
      if (typeof show === 'function') {
        setModalState(prev => ({ ...prev, showHistogramReport: show(prev.showHistogramReport) }));
      } else {
        setModalState(prev => ({ ...prev, showHistogramReport: show }));
      }
    },
    setShowPresetMenu: (show: boolean) => setModalState(prev => ({ ...prev, showPresetMenu: show })),
    setRecommendationDialog: (dialog: RecommendationDialog | null) => setModalState(prev => ({ ...prev, recommendationDialog: dialog })),
    setIsAdvancedOpen: (open: boolean) => setModalState(prev => ({ ...prev, isAdvancedOpen: open })),
    setPresetMenuDirection: (direction: 'down' | 'up') => setModalState(prev => ({ ...prev, presetMenuDirection: direction })),
  };
}; 