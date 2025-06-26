'use client';

import React from 'react';

// Import extracted types and constants
import {
  FileManagementPanelProps
} from './file-management/types';

import {
  CSS_CLASSES,
  UI_TEXT
} from './file-management/constants';

// Import custom hooks - Phase 3
import {
  useFileState,
  usePreviewState,
  useSearchState,
  useFileOperations,
  useCalibrationState,
  useNotificationState
} from './file-management/hooks';

// Import UI components - Phase 4
import {
  NotificationBanner,
  FileTypeNavigation,
  SearchAndFilter,
  FileListDisplay,
  LoadingState,
  CalibrationWarningModal,
  PreviewModal,
  HeaderSection
} from './file-management/components';

export default function FileManagementPanel({ 
  projectId, 
  onRefresh
}: Pick<FileManagementPanelProps, 'projectId' | 'onRefresh'>) {
  
  // Phase 3: Use custom hooks for state management
  const { 
    filesByType, 
    loading, 
    hasLoadedFiles, 
    loadFiles, 
    refreshFiles 
  } = useFileState(projectId);

  const {
    previewUrl,
    previewLoading,
    previewError,
    handlePreview,
    closePreview,
    clearPreviewError
  } = usePreviewState();

  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    tagFilter,
    setTagFilter,
    filteredFiles,
    currentFileCount,
    hasFiles,
    clearTagFilter
  } = useSearchState(filesByType);

  const { handleDownload, handleDeleteFile } = useFileOperations(loadFiles, onRefresh);

  const {
    showCalibrationWarning,
    missingFrameTypes,
    handleCalibrationProgress,
    handleConfirmCalibration,
    handleCancelCalibration
  } = useCalibrationState();

  const {
    moveNotification,
    clearNotification
  } = useNotificationState();

  // Simplified handlers using hooks
  const handleRefresh = () => refreshFiles(onRefresh);
  const handleCalibrationClick = () => handleCalibrationProgress(filesByType);

  return (
    <div className={CSS_CLASSES.CONTAINER}>
      <NotificationBanner 
        message={moveNotification}
        onDismiss={clearNotification}
      />
      
      <div className={CSS_CLASSES.MAIN_PANEL}>
        <HeaderSection 
          fileCount={currentFileCount}
          onRefresh={handleRefresh}
        />

        {loading ? (
          <LoadingState />
        ) : (
          <div className="flex">
            <FileTypeNavigation 
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <div className={CSS_CLASSES.CONTENT}>
              <SearchAndFilter 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                tagFilter={tagFilter}
                onTagFilterChange={setTagFilter}
                onClearTagFilter={clearTagFilter}
                showSearchInput={hasLoadedFiles && hasFiles}
              />

              <FileListDisplay 
                files={filteredFiles}
                onPreview={handlePreview}
                onDownload={handleDownload}
                onDelete={handleDeleteFile}
                hasFiles={hasLoadedFiles && hasFiles}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleCalibrationClick}
          className={CSS_CLASSES.BUTTON_PRIMARY}
        >
          {UI_TEXT.PROCEED_TO_CALIBRATION}
        </button>
      </div>

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