import { FileType, StorageFile } from '../../../types/store';

// Re-export types for service layer
export { FileType, StorageFile };

// Main component props
export interface FileManagementPanelProps {
  projectId: string;
  userId: string;
  onRefresh?: () => void;
  onValidationError?: (error: string) => void;
}

// State interfaces
export interface ExpandedFiles {
  [key: string]: boolean;
}

// Update to be compatible with storage utility return type
export type FilesByType = Record<FileType, StorageFile[]>;

export interface PreviewCache {
  [filePath: string]: string;
}

// File operations interfaces
export interface FileOperationHandlers {
  onDownload: (file: StorageFile) => Promise<void>;
  onDelete: (file: StorageFile) => Promise<void>;
  onPreview: (file: StorageFile) => Promise<void>;
  onRefresh: () => void;
}

// Search and filter interfaces
export interface SearchState {
  searchTerm: string;
  tagFilter: string;
  activeTab: FileType;
}

export interface FilteredFileData {
  files: StorageFile[];
  hasFiles: boolean;
  isEmpty: boolean;
}

// Preview state interfaces
export interface PreviewState {
  url: string | null;
  loading: boolean;
  error: string | null;
  cache: PreviewCache;
}

// Calibration interfaces
export interface CalibrationState {
  showWarning: boolean;
  missingFrameTypes: FileType[];
}

// Notification interfaces
export interface NotificationState {
  message: string | null;
  type: 'info' | 'warning' | 'error' | 'success';
}

// File validation interfaces
export interface FileValidationError {
  fileName: string;
  error: string;
}

// Upload interfaces
export interface UploadState {
  isDragActive: boolean;
  validationErrors: FileValidationError[];
}

// UI component props interfaces
export interface FileTypeNavigationProps {
  activeTab: FileType;
  filesByType: FilesByType;
  onTabChange: (tab: FileType) => void;
}

export interface FileListDisplayProps {
  files: StorageFile[];
  expandedFiles: ExpandedFiles;
  onToggleExpansion: (fileName: string) => void;
  onFileOperation: FileOperationHandlers;
}

export interface SearchAndFilterProps {
  searchTerm: string;
  tagFilter: string;
  hasFiles: boolean;
  onSearchChange: (term: string) => void;
  onTagFilterChange: (filter: string) => void;
  onClearFilter: () => void;
}

export interface PreviewModalProps {
  previewUrl: string | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export interface CalibrationWarningModalProps {
  show: boolean;
  missingFrameTypes: FileType[];
  onCancel: () => void;
  onProceed: () => void;
}

// Service interfaces
export interface FileOperationsService {
  loadFiles: (projectId: string) => Promise<FilesByType>;
  downloadFile: (file: StorageFile) => Promise<void>;
  deleteFile: (file: StorageFile) => Promise<void>;
  validateFiles: (files: File[], projectId: string, userId: string) => Promise<FileValidationError[]>;
}

export interface PreviewService {
  generatePreview: (file: StorageFile) => Promise<string>;
  getCachedPreview: (filePath: string, cache: PreviewCache) => string | null;
  setCachedPreview: (filePath: string, url: string, cache: PreviewCache) => PreviewCache;
  cleanupPreviewUrl: (url: string) => void;
  cleanupCache: (cache: PreviewCache) => void;
}

export interface SearchService {
  filterFilesByTag: (files: StorageFile[], tagFilter: string) => StorageFile[];
  filterFilesBySearch: (files: StorageFile[], searchTerm: string) => StorageFile[];
  getFileTypeFromPath: (path: string) => FileType | null;
  getFileTypeDisplay: (type: FileType | null) => string;
}

export interface ValidationService {
  validateFitsFile: (file: File, projectId: string, userId: string) => Promise<{ isValid: boolean; error?: string }>;
  checkCalibrationRequirements: (filesByType: FilesByType) => { canProceed: boolean; missingTypes: FileType[] };
}

// Utility function types
export type FileFormatter = {
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
};

// Hook return types
export interface UseFileStateReturn {
  filesByType: FilesByType;
  loading: boolean;
  hasLoadedFiles: boolean;
  expandedFiles: ExpandedFiles;
  loadFiles: () => Promise<void>;
  toggleFileExpansion: (fileName: string) => void;
}

export interface UsePreviewStateReturn {
  previewUrl: string | null;
  previewLoading: boolean;
  previewError: string | null;
  previewCache: PreviewCache;
  handlePreview: (file: StorageFile) => Promise<void>;
  closePreview: () => void;
}

export interface UseSearchStateReturn {
  activeTab: FileType;
  searchTerm: string;
  tagFilter: string;
  setActiveTab: (tab: FileType) => void;
  setSearchTerm: (term: string) => void;
  setTagFilter: (filter: string) => void;
  clearFilters: () => void;
  filteredFiles: StorageFile[];
}

export interface UseFileOperationsReturn {
  handleDownload: (file: StorageFile) => Promise<void>;
  handleDeleteFile: (file: StorageFile) => Promise<void>;
  handleRefresh: () => void;
  handleCalibrationProgress: () => void;
  handleConfirmCalibration: () => void;
  showCalibrationWarning: boolean;
  missingFrameTypes: FileType[];
  moveNotification: string | null;
  setMoveNotification: (message: string | null) => void;
} 