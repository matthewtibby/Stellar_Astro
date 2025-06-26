'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getFilesByType, getFitsFileUrl, deleteFitsFile } from '@/src/utils/storage';
import { File, Download, Eye, X, AlertCircle, RefreshCw } from 'lucide-react';
import { type FileType, type StorageFile } from '@/src/types/store';

// Import extracted types and constants
import {
  FileManagementPanelProps,
  FilesByType,
  PreviewCache
} from './file-management/types';

import {
  INITIAL_FILE_TYPES,
  REQUIRED_CALIBRATION_TYPES,
  FILE_TYPE_LABELS,
  FILE_SIZE_UNITS,
  FILE_SIZE_THRESHOLD,
  PREVIEW_SERVICE_URL,
  UI_TEXT,
  ERROR_MESSAGES,
  CSS_CLASSES
} from './file-management/constants';

// Utility functions extracted to use constants
const getFileTypeFromPath = (path: string): FileType | null => {
  const type = path.split('/')[0] as FileType;
  return INITIAL_FILE_TYPES.includes(type) ? type : null;
};

const getFileTypeDisplay = (type: FileType | null): string => {
  if (!type) return 'Unknown';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(FILE_SIZE_THRESHOLD));
  return parseFloat((bytes / Math.pow(FILE_SIZE_THRESHOLD, i)).toFixed(2)) + ' ' + FILE_SIZE_UNITS[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export default function FileManagementPanel({ 
  projectId, 
  onRefresh
}: Pick<FileManagementPanelProps, 'projectId' | 'onRefresh'>) {
  const [moveNotification, setMoveNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FileType>('light');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState('');

  const [filesByType, setFilesByType] = useState<FilesByType>({
    'light': [],
    'dark': [],
    'bias': [],
    'flat': [],
    'master-dark': [],
    'master-bias': [],
    'master-flat': [],
    'calibrated': [],
    'stacked': [],
    'aligned': [],
    'pre-processed': [],
    'post-processed': []
  });
  const [loading, setLoading] = useState(false);
  const [showCalibrationWarning, setShowCalibrationWarning] = useState(false);
  const [missingFrameTypes, setMissingFrameTypes] = useState<FileType[]>([]);
  const [hasLoadedFiles, setHasLoadedFiles] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewCache, setPreviewCache] = useState<PreviewCache>({});

  const loadFiles = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const files = await getFilesByType(projectId);
      setFilesByType(files);
      setHasLoadedFiles(true);
    } catch (err) {
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadFiles();
    }
  }, [projectId, loadFiles]);

  const handleRefresh = () => {
    loadFiles();
    if (onRefresh) onRefresh();
  };

  const handleDownload = async (file: StorageFile) => {
    try {
      const url = await getFitsFileUrl(file.path);
      window.open(url, '_blank');
    } catch (error) {
      console.error(ERROR_MESSAGES.DOWNLOAD_ERROR, error);
    }
  };

  const handleDeleteFile = async (file: StorageFile) => {
    try {
      await deleteFitsFile(file.path);
      await loadFiles();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(ERROR_MESSAGES.DELETE_ERROR, error);
    }
  };

  // Filter files by tag
  const filteredFiles = tagFilter.trim()
    ? filesByType[activeTab].filter(f => {
        const tags = Array.isArray((f as unknown as { tags?: unknown }).tags) ? (f as unknown as { tags: string[] }).tags : [];
        return tags.some((tag: string) => tag.toLowerCase().includes(tagFilter.toLowerCase()));
      })
    : filesByType[activeTab];

  const handleCalibrationProgress = () => {
    const missingTypes = REQUIRED_CALIBRATION_TYPES.filter(type => filesByType[type].length === 0);

    if (filesByType['light'].length === 0) {
      console.error(ERROR_MESSAGES.NO_LIGHT_FRAMES);
      return;
    }

    if (missingTypes.length > 0) {
      setMissingFrameTypes(missingTypes);
      setShowCalibrationWarning(true);
      return;
    }

    console.log('Proceeding to calibration step...');
  };

  const handleConfirmCalibration = () => {
    setShowCalibrationWarning(false);
    console.log('Proceeding to calibration step despite missing frames...');
  };

  useEffect(() => {
    return () => {
      Object.values(previewCache).forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewCache]);

  const handlePreview = async (file: StorageFile) => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewUrl(null);

      if (previewCache[file.path]) {
        setPreviewUrl(previewCache[file.path]);
        return;
      }

      const fileUrl = await getFitsFileUrl(file.path);
      const previewResponse = await fetch(PREVIEW_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileUrl),
      });
      
      if (!previewResponse.ok) {
        const errorText = await previewResponse.text();
        throw new Error(`${ERROR_MESSAGES.PREVIEW_FAILED} ${errorText}`);
      }
      
      const imageBlob = await previewResponse.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      setPreviewCache(prev => ({ ...prev, [file.path]: imageUrl }));
      setPreviewUrl(imageUrl);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : ERROR_MESSAGES.PREVIEW_FAILED);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const renderFileList = (files: StorageFile[]) => {
    return files.map((file) => {
      const fileType = getFileTypeFromPath(file.path);
      
      return (
        <div key={file.path} className={CSS_CLASSES.FILE_ITEM}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-white">{file.name}</p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(file.size)} • {formatDate(file.created_at)} • {getFileTypeDisplay(fileType)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePreview(file)}
                className={CSS_CLASSES.ICON_BUTTON}
                title={UI_TEXT.PREVIEW_TOOLTIP}
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDownload(file)}
                className={CSS_CLASSES.ICON_BUTTON}
                title={UI_TEXT.DOWNLOAD_TOOLTIP}
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteFile(file)}
                className={CSS_CLASSES.ICON_BUTTON_DANGER}
                title={UI_TEXT.DELETE_TOOLTIP}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {(Array.isArray((file as unknown as { tags?: unknown }).tags) ? (file as unknown as { tags: string[] }).tags : [])
              .map((tag: string, i: number) => (
                <span key={i} className={CSS_CLASSES.TAG_BADGE}>
                  {tag}
                </span>
              ))}
          </div>
        </div>
      );
    });
  };

  const renderFileTypeDisplay = (type: FileType) => {
    const files = filesByType[type];
    return (
      <span className="text-sm text-gray-400">
        {files.length} files
      </span>
    );
  };

  return (
    <div className={CSS_CLASSES.CONTAINER}>
      {moveNotification && (
        <div className={CSS_CLASSES.NOTIFICATION}>
          {moveNotification}
          <button
            className="ml-4 px-2 py-1 bg-yellow-700 text-white rounded hover:bg-yellow-800"
            onClick={() => setMoveNotification(null)}
          >
            {UI_TEXT.DISMISS_BUTTON}
          </button>
        </div>
      )}
      
      <div className={CSS_CLASSES.MAIN_PANEL}>
        <div className={CSS_CLASSES.HEADER}>
          <h3 className={CSS_CLASSES.TITLE}>{UI_TEXT.TITLE}</h3>
          <div className="flex items-center space-x-2">
            {renderFileTypeDisplay(activeTab)}
            <button 
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
              title={UI_TEXT.REFRESH_TOOLTIP}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className={CSS_CLASSES.LOADING_CONTAINER}>
            <div className={CSS_CLASSES.LOADING_SPINNER} />
            <p className="text-gray-400">{UI_TEXT.LOADING_TEXT}</p>
          </div>
        ) : (
          <div className="flex">
            <div className={CSS_CLASSES.SIDEBAR}>
              <div className="space-y-2">
                {INITIAL_FILE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={`${CSS_CLASSES.TAB_BASE} ${
                      activeTab === type ? CSS_CLASSES.TAB_ACTIVE : CSS_CLASSES.TAB_INACTIVE
                    }`}
                  >
                    {FILE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            <div className={CSS_CLASSES.CONTENT}>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="text"
                  value={tagFilter}
                  onChange={e => setTagFilter(e.target.value)}
                  placeholder={UI_TEXT.TAG_FILTER_PLACEHOLDER}
                  className={CSS_CLASSES.INPUT_BASE}
                />
                {tagFilter && (
                  <button onClick={() => setTagFilter('')} className={CSS_CLASSES.BUTTON_SMALL}>
                    {UI_TEXT.CLEAR_BUTTON}
                  </button>
                )}
              </div>

              {hasLoadedFiles && filesByType[activeTab].length > 0 && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder={UI_TEXT.SEARCH_PLACEHOLDER}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={CSS_CLASSES.SEARCH_INPUT}
                  />
                </div>
              )}

              {hasLoadedFiles && filesByType[activeTab].length === 0 ? (
                <div className="text-center py-8">
                  <File className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">{UI_TEXT.EMPTY_STATE_TITLE}</p>
                  <p className="text-sm text-gray-500 mt-1">{UI_TEXT.EMPTY_STATE_SUBTITLE}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {renderFileList(filteredFiles)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleCalibrationProgress}
          className={CSS_CLASSES.BUTTON_PRIMARY}
        >
          {UI_TEXT.PROCEED_TO_CALIBRATION}
        </button>
      </div>

      {showCalibrationWarning && (
        <div className={CSS_CLASSES.MODAL_OVERLAY}>
          <div className={CSS_CLASSES.MODAL_CONTENT}>
            <h3 className="text-lg font-semibold text-white mb-4">{UI_TEXT.CALIBRATION_WARNING_TITLE}</h3>
            <p className="text-gray-300 mb-4">{UI_TEXT.CALIBRATION_WARNING_MESSAGE}</p>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              {missingFrameTypes.map(type => (
                <li key={type} className="capitalize">{type} frames</li>
              ))}
            </ul>
            <p className="text-gray-300 mb-4">{UI_TEXT.CALIBRATION_WARNING_QUESTION}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCalibrationWarning(false)}
                className={CSS_CLASSES.BUTTON_SECONDARY}
              >
                {UI_TEXT.CANCEL_BUTTON}
              </button>
              <button
                onClick={handleConfirmCalibration}
                className={CSS_CLASSES.BUTTON_PRIMARY}
              >
                {UI_TEXT.PROCEED_ANYWAY_BUTTON}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className={CSS_CLASSES.MODAL_OVERLAY}>
          <div className={CSS_CLASSES.MODAL_LARGE}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">{UI_TEXT.PREVIEW_TITLE}</h3>
              <button onClick={closePreview} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="FITS Preview" className="w-full h-auto rounded-md" />
            </div>
          </div>
        </div>
      )}

      {previewLoading && (
        <div className={CSS_CLASSES.MODAL_OVERLAY}>
          <div className="bg-gray-900 p-8 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
            <p className="text-white mt-4">{UI_TEXT.PREVIEW_LOADING}</p>
          </div>
        </div>
      )}

      {previewError && (
        <div className={CSS_CLASSES.MODAL_OVERLAY}>
          <div className={CSS_CLASSES.MODAL_CONTENT}>
            <div className="flex items-center space-x-3 text-red-500 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">{UI_TEXT.PREVIEW_ERROR_TITLE}</h3>
            </div>
            <p className="text-gray-300 mb-6">{previewError}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewError(null)}
                className={CSS_CLASSES.BUTTON_SECONDARY}
              >
                {UI_TEXT.CLOSE_BUTTON}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 