'use client';

import React from 'react';
import { FileManagementPanelProps } from './file-management/types';
import { CSS_CLASSES } from './file-management/constants';

// Import all hooks and components
import {
  useFileState,
  usePreviewState,
  useSearchState,
  useFileOperations,
  useCalibrationState,
  useNotificationState
} from './file-management/hooks';

import {
  NotificationBanner,
  HeaderSection,
  LoadingState,
  MainContentArea,
  CalibrationActionButton,
  CalibrationWarningModal,
  PreviewModal
} from './file-management/components';

export default function FileManagementPanel({ 
  projectId, 
  onRefresh
}: Pick<FileManagementPanelProps, 'projectId' | 'onRefresh'>) {
  
  // State management hooks
  const { filesByType, loading, hasLoadedFiles, loadFiles, refreshFiles } = useFileState(projectId);
  const { previewUrl, previewLoading, previewError, handlePreview, closePreview, clearPreviewError } = usePreviewState();
  const { activeTab, setActiveTab, searchTerm, setSearchTerm, tagFilter, setTagFilter, filteredFiles, currentFileCount, hasFiles, clearTagFilter } = useSearchState(filesByType);
  const { handleDownload, handleDeleteFile } = useFileOperations(loadFiles, onRefresh);
  const { showCalibrationWarning, missingFrameTypes, handleCalibrationProgress, handleConfirmCalibration, handleCancelCalibration } = useCalibrationState();
  const { moveNotification, clearNotification } = useNotificationState();

  return (
    <div className={CSS_CLASSES.CONTAINER}>
      <NotificationBanner message={moveNotification} onDismiss={clearNotification} />
      
      <div className={CSS_CLASSES.MAIN_PANEL}>
        <HeaderSection fileCount={currentFileCount} onRefresh={() => refreshFiles(onRefresh)} />

        {loading ? (
          <LoadingState />
        ) : (
          <MainContentArea 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
            onClearTagFilter={clearTagFilter}
            showSearchInput={hasLoadedFiles && hasFiles}
            files={filteredFiles}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onDelete={handleDeleteFile}
            hasFiles={hasLoadedFiles && hasFiles}
          />
        )}
      </div>

      <CalibrationActionButton onClick={() => handleCalibrationProgress(filesByType)} />

      <CalibrationWarningModal 
        show={showCalibrationWarning}
        missingFrameTypes={missingFrameTypes}
        onCancel={handleCancelCalibration}
        onProceed={handleConfirmCalibration}
      />

      <PreviewModal 
        previewUrl={previewUrl}
        previewLoading={previewLoading}
        previewError={previewError}
        onClose={closePreview}
        onClearError={clearPreviewError}
      />
    </div>
  );
} 