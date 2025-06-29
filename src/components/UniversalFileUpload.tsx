import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { validateFITSFile } from '@/src/utils/fileValidation';
import { spaceFacts } from '@/src/utils/spaceFacts';
import { handleError, ValidationError } from '@/src/utils/errorHandling';
import { UniversalFileUploadProps, StorageFileWithMetadata } from './universal-file-upload/types/upload.types';
import { formatFileSize } from './universal-file-upload/utils/uploadUtils';
import type { FileType } from '@/src/types/store';
import { useUploadState } from './universal-file-upload/hooks/useUploadState';
import { useFileListState } from './universal-file-upload/hooks/useFileListState';
import { usePreviewState } from './universal-file-upload/hooks/usePreviewState';
import { useBulkFileActions } from './universal-file-upload/hooks/useBulkFileActions';
// Use barrel import for subcomponents
import {
  UploadArea,
  FileList,
  UploadStatusPanel,
  PreviewModal,
  MetadataModal,
  MoveNotification
} from './universal-file-upload/components';

/**
 * UniversalFileUpload orchestrates the upload, preview, and management of FITS files for a project.
 * All logic is handled by hooks; all UI by subcomponents.
 * @param props UniversalFileUploadProps
 */
export function UniversalFileUpload({ 
  projectId, 
  userId,
  onUploadComplete,
  onValidationError,
  onStepAutosave,
  isSavingStep,
  layout,
  activeTab = 'light',
  viewAll = false,
  onPreviewFile,
  selectedFilePath,
}: UniversalFileUploadProps) {
  const { filesByType, setFilesByType, filesLoading } = useFileListState({ projectId, onValidationError });
  const {
    previewLoading,
    previewError,
    selectedPath,
    previewUrl,
    handlePreview,
    closePreview,
    setSelectedPath,
    setPreviewError,
  } = usePreviewState({ filesByType, activeTab, viewAll, onPreviewFile });
  const [metadataModalFile, setMetadataModalFile] = useState<StorageFileWithMetadata | null>(null);

  // Upload state hook
  const uploadState = useUploadState({
    projectId,
    userId,
    activeTab,
    onUploadComplete,
    onStepAutosave,
    onValidationError,
    setFilesByType,
  });

  const {
    uploadStatuses,
    setUploadStatuses,
    isUploading,
    batchTotalBytes,
    batchUploadedBytes,
    batchSpeed,
    batchETA,
    onDrop,
  } = uploadState;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/fits': ['.fits', '.fit', '.FIT', '.FITS', '.RAW'],
    },
    multiple: true,
  });

  function handleDelete() {
    // Implement delete logic here
  }

  // Add retry logic
  const retryUpload = async (file: File, fileType: FileType) => {
    setUploadStatuses(prev => prev.map(status => status.file === file ? { ...status, status: 'uploading', progress: 0, error: undefined } : status));
    try {
      const validationResult = await validateFITSFile(file, projectId, userId);
      if (!validationResult.isValid) {
        throw new ValidationError(validationResult.warnings ? validationResult.warnings.join(', ') : 'File validation failed.');
      }
      // TODO: Implement uploadRawFrame or use another upload method here
      setUploadStatuses(prev => prev.map(status => status.file === file ? { ...status, status: 'completed', progress: 1 } : status));
      setFilesByType(prevFilesByType => {
        const newFilesByType = { ...prevFilesByType };
        const files = newFilesByType[fileType] || [];
        const newFile: StorageFileWithMetadata = {
          name: file.name,
          path: `${userId}/${projectId}/${fileType}/${file.name}`,
          type: fileType,
          created_at: new Date().toISOString(),
          size: file.size,
          metadata: validationResult.metadata as Record<string, string | number | boolean>
        };
        newFilesByType[fileType] = [...files, newFile];
        return newFilesByType;
      });
    } catch (error) {
      const appError = handleError(error);
      setUploadStatuses(prev => prev.map(status => status.file === file ? { ...status, status: 'error', error: appError.message } : status));
      onValidationError?.(appError.message);
    }
  };

  const retryAllFailed = () => {
    uploadStatuses.filter(s => s.status === 'error').forEach(status => {
      retryUpload(status.file, status.type || activeTab);
    });
  };

  const {
    selectedFiles,
    handleBulkDelete,
    toggleFileSelection,
    fileRowRefs,
    handleFileListKeyDown,
  } = useBulkFileActions({ handlePreview, setSelectedPath, filesByType, activeTab, viewAll });

  return (
    <div className="space-y-4">
      {/* Conditionally render based on layout prop */}
      {(!layout || layout === 'upload-only') && (
        <UploadArea
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isDragActive={isDragActive}
          isSavingStep={isSavingStep}
        />
      )}
      {(!layout || layout === 'file-list-only') && (
        <FileList
          filesByType={filesByType}
          activeTab={activeTab}
          viewAll={viewAll}
          selectedFiles={selectedFiles}
          toggleFileSelection={toggleFileSelection}
          handleFileListKeyDown={handleFileListKeyDown}
          fileRowRefs={fileRowRefs}
          handlePreview={handlePreview}
          handleDelete={handleDelete}
          handleBulkDelete={handleBulkDelete}
          filesLoading={filesLoading}
          selectedFilePath={selectedFilePath}
          setMetadataModalFile={setMetadataModalFile}
          formatFileSize={formatFileSize}
        />
      )}
      {/* Upload Status - only show during active uploads */}
      {isUploading && (
        <UploadStatusPanel
          isUploading={isUploading}
          batchTotalBytes={batchTotalBytes}
          batchUploadedBytes={batchUploadedBytes}
          batchSpeed={batchSpeed}
          batchETA={batchETA}
          uploadStatuses={uploadStatuses}
          retryUpload={retryUpload}
          retryAllFailed={retryAllFailed}
          activeTab={activeTab}
        />
      )}
      {/* Move Notification */}
      <MoveNotification
        moveNotification={uploadState.moveNotification}
        setMoveNotification={uploadState.setMoveNotification}
      />
      {/* Preview Modal (scaffold) */}
      {(!onPreviewFile && (previewUrl || previewLoading)) && (
        <PreviewModal
          previewUrl={previewUrl}
          previewLoading={previewLoading}
          closePreview={closePreview}
          spaceFacts={spaceFacts}
          selectedPath={selectedPath}
          previewError={previewError}
          setPreviewError={setPreviewError}
        />
      )}
      {/* Metadata Modal */}
      <MetadataModal
        metadataModalFile={metadataModalFile}
        setMetadataModalFile={setMetadataModalFile}
      />
    </div>
  );
} 