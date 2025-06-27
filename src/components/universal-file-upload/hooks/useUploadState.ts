import { useState, useCallback } from 'react';
import { validateFITSFile } from '@/src/utils/fileValidation';
import { uploadRawFrame, getFilesByType } from '@/src/utils/storage';
import { handleError, ValidationError } from '@/src/utils/errorHandling';
import { useToast } from '../../../hooks/useToast';
import type { FileType, StorageFile } from '@/src/types/store';
import type { UploadStatus, StorageFileWithMetadata } from '../types/upload.types';

interface UseUploadStateProps {
  projectId: string;
  userId: string;
  activeTab: FileType;
  onUploadComplete?: () => void;
  onStepAutosave?: () => void;
  onValidationError?: (error: string) => void;
  setFilesByType: (files: Record<FileType, StorageFileWithMetadata[]>) => void;
}

export function useUploadState({
  projectId,
  userId,
  activeTab,
  onUploadComplete,
  onStepAutosave,
  onValidationError,
  setFilesByType,
}: UseUploadStateProps) {
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [batchTotalBytes, setBatchTotalBytes] = useState(0);
  const [batchUploadedBytes, setBatchUploadedBytes] = useState(0);
  const [batchSpeed, setBatchSpeed] = useState(0); // bytes/sec
  const [batchETA, setBatchETA] = useState<number | null>(null);
  const [moveNotification, setMoveNotification] = useState<string | null>(null);
  const { addToast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsUploading(true);
    setBatchTotalBytes(acceptedFiles.reduce((sum, file) => sum + file.size, 0));
    setBatchUploadedBytes(0);
    setBatchSpeed(0);
    setBatchETA(null);
    setUploadStatuses(acceptedFiles.map((file, index) => ({
      file,
      type: activeTab,
      progress: 0,
      status: 'uploading',
      warnings: [],
      index: index + 1,
      total: acceptedFiles.length
    })));
    try {
      // Validate all files in batch
      const validationResults = await Promise.all(acceptedFiles.map(file => validateFITSFile(file, projectId, userId)));
      let uploadedBytes = 0;
      let successfulUploads = 0;
      let failedUploads = 0;
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const validationResult = validationResults[i];
        if (!validationResult || !validationResult.isValid) {
          throw new ValidationError(
            validationResult && validationResult.warnings ? validationResult.warnings.join(', ') : 'File validation failed.'
          );
        }
        const fileType = (validationResult.metadata && typeof validationResult.metadata.frameType === 'string') ? validationResult.metadata.frameType as FileType : activeTab;
        setUploadStatuses(prev => prev.map(status =>
          status.file === file
            ? { ...status, warnings: validationResult.warnings }
            : status
        ));
        await uploadRawFrame(file, projectId, fileType);
        uploadedBytes += file.size;
        setBatchUploadedBytes(uploadedBytes);
        if (validationResult.isValid) {
          successfulUploads++;
        } else {
          failedUploads++;
        }
      }
      setIsUploading(false);
      onUploadComplete?.();
      onStepAutosave?.();
      try {
        const latestFiles = await getFilesByType(projectId);
        const mappedFiles: Record<FileType, StorageFileWithMetadata[]> = Object.fromEntries(
          Object.entries(latestFiles).map(([type, files]) => [
            type,
            files.map(f => ({ ...f, metadata: f.metadata ?? {} }))
          ])
        ) as Record<FileType, StorageFileWithMetadata[]>;
        setFilesByType(mappedFiles);
      } catch (fetchError) {
        // Optionally handle fetch error
      }
      if (successfulUploads > 0) {
        addToast('success', `${successfulUploads} file${successfulUploads > 1 ? 's' : ''} uploaded successfully`);
      }
      if (failedUploads > 0) {
        addToast('error', `${failedUploads} file${failedUploads > 1 ? 's' : ''} failed to upload`);
      }
    } catch (error) {
      const appError = handleError(error);
      setUploadStatuses(prev => prev.map(status =>
        status.status === 'uploading'
          ? { ...status, status: 'error', error: appError.message }
          : status
      ));
      onValidationError?.(appError.message);
      setIsUploading(false);
    }
  }, [projectId, userId, activeTab, onUploadComplete, onValidationError, onStepAutosave, setFilesByType, addToast]);

  return {
    uploadStatuses,
    setUploadStatuses,
    isUploading,
    setIsUploading,
    batchTotalBytes,
    setBatchTotalBytes,
    batchUploadedBytes,
    setBatchUploadedBytes,
    batchSpeed,
    setBatchSpeed,
    batchETA,
    setBatchETA,
    moveNotification,
    setMoveNotification,
    onDrop,
  };
} 