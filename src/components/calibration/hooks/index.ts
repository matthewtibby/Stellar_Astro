// Legacy hooks (keeping for backward compatibility during transition)
export { useCalibrationState } from './useCalibrationState';
export { useOutlierDetection } from './useOutlierDetection';
export { useFrameConsistency } from './useFrameConsistency';
export { useHistogramAnalysis } from './useHistogramAnalysis';
export { useUIState } from './useUIState';
export { useJobManagement } from './useJobManagement';
export { useCosmeticMethods } from './useCosmeticMethods';

// Phase 5 Advanced Hooks
export { useFileOperations } from './useFileOperations';
export { useJobOperations } from './useJobOperations';
export { useJobPolling } from './useJobPolling';
export { useDataEffects } from './useDataEffects';
export { useLocalState } from './useLocalState';

// Phase 5.2 Consolidated Hooks - NEW ARCHITECTURE
export { useAnalysisOperations } from './useAnalysisOperations';
export { useModalManagement } from './useModalManagement';
export { useEnhancedCalibrationState } from './useEnhancedCalibrationState';

// Re-export types
export type { JobStatus } from './useJobManagement';
