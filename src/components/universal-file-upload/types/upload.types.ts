// Types and interfaces extracted from UniversalFileUpload.tsx

import type { StorageFile, FileType } from '@/src/types/store';

export type StorageFileWithMetadata = StorageFile & { metadata?: Record<string, unknown> };

export interface UniversalFileUploadProps {
  projectId: string;
  userId: string;
  onUploadComplete?: () => void;
  onValidationError?: (error: string) => void;
  onStepAutosave?: () => void;
  isSavingStep?: boolean;
  layout?: 'upload-only' | 'file-list-only';
  activeTab?: FileType;
  viewAll?: boolean;
  onPreviewFile?: (file: StorageFile, previewUrl: string | null, loading: boolean, error?: string) => void;
  selectedFilePath?: string;
}

export interface UploadStatus {
  file: File;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  type?: FileType;
  metadata?: Record<string, unknown>;
  error?: string;
  warnings?: string[];
  index: number;
  total: number;
} 