'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getFilesByType, validateFitsFile, uploadRawFrame, getFitsFileUrl, deleteFitsFile } from '@/src/utils/storage';
import { File, Trash2, Download, Eye, RefreshCw, FolderOpen, Upload, AlertCircle, Info, ChevronDown, ChevronUp, X } from 'lucide-react';
import { type FileType, type StorageFile } from '@/src/types/store';
import { type FitsMetadata, type FitsValidationResult, type FitsAnalysisResult } from '@/src/types/fits';
import { createBrowserClient } from '@supabase/ssr';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

// Add constant for initial file types
const INITIAL_FILE_TYPES: FileType[] = ['light', 'dark', 'bias', 'flat'];

interface FileManagementPanelProps {
  projectId: string;
  onRefresh?: () => void;
  onValidationError?: (error: string) => void;
}

interface SelectedFile {
  file: File;
  type: FileType;
}

interface FileMetadataProps {
  metadata: NonNullable<FitsValidationResult['metadata']>;
  isExpanded: boolean;
  onToggle: () => void;
}

function FileMetadata({ metadata, isExpanded, onToggle }: FileMetadataProps) {
  return (
    <div className="mt-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 bg-gray-800/50 rounded-md hover:bg-gray-800/70 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Info className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">File Metadata</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-1 p-2 bg-gray-800/50 rounded-md text-sm">
          <div className="grid grid-cols-2 gap-2">
            {metadata.exposure_time && (
              <div>
                <span className="text-gray-400">Exposure:</span>
                <span className="ml-2 text-white">{metadata.exposure_time}s</span>
              </div>
            )}
            {metadata.filter && (
              <div>
                <span className="text-gray-400">Filter:</span>
                <span className="ml-2 text-white">{metadata.filter}</span>
              </div>
            )}
            {metadata.object && (
              <div>
                <span className="text-gray-400">Object:</span>
                <span className="ml-2 text-white">{metadata.object}</span>
              </div>
            )}
            {metadata.date_obs && (
              <div>
                <span className="text-gray-400">Date:</span>
                <span className="ml-2 text-white">{metadata.date_obs}</span>
              </div>
            )}
            {metadata.instrument && (
              <div>
                <span className="text-gray-400">Instrument:</span>
                <span className="ml-2 text-white">{metadata.instrument}</span>
              </div>
            )}
            {metadata.telescope && (
              <div>
                <span className="text-gray-400">Telescope:</span>
                <span className="ml-2 text-white">{metadata.telescope}</span>
              </div>
            )}
            {metadata.gain && (
              <div>
                <span className="text-gray-400">Gain:</span>
                <span className="ml-2 text-white">{metadata.gain}</span>
              </div>
            )}
            {metadata.temperature && (
              <div>
                <span className="text-gray-400">Temp:</span>
                <span className="ml-2 text-white">{metadata.temperature}°C</span>
              </div>
            )}
            {metadata.binning && (
              <div>
                <span className="text-gray-400">Binning:</span>
                <span className="ml-2 text-white">{metadata.binning}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Add interfaces for state
interface FileWarnings {
  [key: string]: string[];
}

interface ExpandedFiles {
  [key: string]: boolean;
}

interface FilesByType extends Record<FileType, StorageFile[]> {
  'light': StorageFile[];
  'dark': StorageFile[];
  'bias': StorageFile[];
  'flat': StorageFile[];
  'master-dark': StorageFile[];
  'master-bias': StorageFile[];
  'master-flat': StorageFile[];
  'calibrated': StorageFile[];
  'stacked': StorageFile[];
  'aligned': StorageFile[];
  'pre-processed': StorageFile[];
  'post-processed': StorageFile[];
}

interface UploadProgress {
  [key: string]: number;
}

interface FileValidationResult {
  isValid: boolean;
  type: FileType;
  metadata: FitsMetadata;
  analysis?: FitsAnalysisResult;
  error?: string;
}

// Update the file type mapping to handle null values
const getFileTypeFromPath = (path: string): FileType | null => {
  const type = path.split('/')[0] as FileType;
  return INITIAL_FILE_TYPES.includes(type) ? type : null;
};

// Update the file type display to handle null values
const getFileTypeDisplay = (type: FileType | null): string => {
  if (!type) return 'Unknown';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Update the file type labels
const fileTypeLabels: Record<FileType, string> = {
  'light': 'Light Frames',
  'dark': 'Dark Frames',
  'bias': 'Bias Frames',
  'flat': 'Flat Frames',
  'master-dark': 'Master Dark',
  'master-bias': 'Master Bias',
  'master-flat': 'Master Flat',
  'calibrated': 'Calibrated',
  'stacked': 'Stacked',
  'aligned': 'Aligned',
  'pre-processed': 'Pre-Processed',
  'post-processed': 'Post-Processed'
};

export default function FileManagementPanel({ projectId, onRefresh, onValidationError }: FileManagementPanelProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [selectedFileMetadata, setSelectedFileMetadata] = useState<NonNullable<FitsValidationResult['metadata']> | null>(null);
  const [fileWarnings, setFileWarnings] = useState<FileWarnings>({});
  const [moveNotification, setMoveNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FileType>('light');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState('');

  const supabase = useSupabaseClient();

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
  const fileInputRefs = useRef<Record<FileType, HTMLInputElement | null>>({
    light: null,
    dark: null,
    bias: null,
    flat: null,
    'master-dark': null,
    'master-bias': null,
    'master-flat': null,
    calibrated: null,
    stacked: null,
    aligned: null,
    'pre-processed': null,
    'post-processed': null
  });
  const [expandedFiles, setExpandedFiles] = useState<ExpandedFiles>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewCache, setPreviewCache] = useState<Record<string, string>>({});

  // Get user ID on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setError('User not authenticated');
        return;
      }
      setUserId(user.id);
    };
    getUser();
  }, [supabase]);

  const loadFiles = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const files = await getFilesByType(supabase, projectId);
      setFilesByType(files);
      setError(null);
      setHasLoadedFiles(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadFiles();
    }
  }, [projectId]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleRefresh = () => {
    loadFiles();
    if (onRefresh) onRefresh();
  };

  const handleDownload = async (file: StorageFile) => {
    try {
      const url = await getFitsFileUrl(supabase, file.path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      // You might want to show an error toast here
    }
  };

  const handleDeleteFile = async (file: StorageFile) => {
    try {
      await deleteFitsFile(supabase, file.path);
      // Refresh the file list
      await loadFiles();
      if (onRefresh) onRefresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  // Filter files by tag
  const filteredFiles = tagFilter.trim()
    ? filesByType[activeTab].filter(f => {
        const tags = Array.isArray(f.metadata?.tags)
          ? f.metadata.tags
          : Array.isArray((f as any).tags)
            ? (f as any).tags
            : [];
        return tags.some((tag: string) => tag.toLowerCase().includes(tagFilter.toLowerCase()));
      })
    : filesByType[activeTab];

  const fileTypeIcons: Record<FileType, React.ReactNode> = {
    'light': <FolderOpen className="h-4 w-4" />,
    'dark': <FolderOpen className="h-4 w-4" />,
    'bias': <FolderOpen className="h-4 w-4" />,
    'flat': <FolderOpen className="h-4 w-4" />,
    'master-dark': <FolderOpen className="h-4 w-4" />,
    'master-bias': <FolderOpen className="h-4 w-4" />,
    'master-flat': <FolderOpen className="h-4 w-4" />,
    'calibrated': <FolderOpen className="h-4 w-4" />,
    'stacked': <FolderOpen className="h-4 w-4" />,
    'aligned': <FolderOpen className="h-4 w-4" />,
    'pre-processed': <FolderOpen className="h-4 w-4" />,
    'post-processed': <FolderOpen className="h-4 w-4" />
  };

  const handleTypeClick = (type: FileType) => {
    // ... existing code ...
  };

  const handleCalibrationProgress = () => {
    const requiredTypes: FileType[] = ['dark', 'bias', 'flat'];
    const missingTypes = requiredTypes.filter(type => filesByType[type].length === 0);

    if (filesByType['light'].length === 0) {
      setError('Cannot progress to calibration: No light frames found. Please upload light frames first.');
      return;
    }

    if (missingTypes.length > 0) {
      setMissingFrameTypes(missingTypes);
      setShowCalibrationWarning(true);
      return;
    }

    // If we have all required files, proceed to calibration
    // TODO: Implement navigation to calibration step
    console.log('Proceeding to calibration step...');
  };

  const handleConfirmCalibration = () => {
    setShowCalibrationWarning(false);
    // TODO: Implement navigation to calibration step
    console.log('Proceeding to calibration step despite missing frames...');
  };

  const toggleFileExpansion = (fileName: string) => {
    setExpandedFiles(prev => ({
      ...prev,
      [fileName]: !prev[fileName]
    }));
  };

  // Clean up object URLs on unmount
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

      // Check cache first
      if (previewCache[file.path]) {
        setPreviewUrl(previewCache[file.path]);
        return;
      }

      // Get the file URL from Supabase
      const fileUrl = await getFitsFileUrl(supabase, file.path);
      // Send the URL to our preview endpoint
      const previewResponse = await fetch('http://localhost:8000/preview-fits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileUrl),
      });
      if (!previewResponse.ok) {
        const errorText = await previewResponse.text();
        throw new Error(`Failed to generate preview: ${errorText}`);
      }
      const imageBlob = await previewResponse.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      setPreviewCache(prev => ({ ...prev, [file.path]: imageUrl }));
      setPreviewUrl(imageUrl);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Failed to generate preview');
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

  // Update the file list rendering to handle null values
  const renderFileList = (files: StorageFile[]) => {
    return files.map((file) => {
      const fileType = getFileTypeFromPath(file.path);
      const warnings = fileWarnings[file.name] || [];
      const isExpanded = expandedFiles[file.name] || false;
      
      return (
        <div
          key={file.path}
          className="flex flex-col p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-800/70 transition-colors"
        >
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
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Preview"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDownload(file)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteFile(file)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Show metadata if available */}
          {selectedFileMetadata && (
            <FileMetadata 
              metadata={selectedFileMetadata} 
              isExpanded={isExpanded}
              onToggle={() => toggleFileExpansion(file.name)}
            />
          )}
          {/* Show warnings if any */}
          {warnings.length > 0 && (
            <div className="mt-2 p-2 bg-yellow-900/50 rounded-md text-sm">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
                <div className="space-y-1">
                  {warnings.map((warning: string, i: number) => (
                    <div key={i} className="text-yellow-600 text-sm">
                      ⚠️ {warning}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Display tags as chips/badges */}
          <div className="flex flex-wrap gap-1">
            {(Array.isArray(file.metadata?.tags)
              ? file.metadata.tags
              : Array.isArray((file as any).tags)
                ? (file as any).tags
                : []
            ).map((tag: string, i: number) => (
              <span key={i} className="bg-blue-700 text-blue-100 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">
                {tag}
              </span>
            ))}
          </div>
        </div>
      );
    });
  };

  // Update the file type display in the UI
  const renderFileTypeDisplay = (type: FileType) => {
    const files = filesByType[type];
    return (
      <span className="text-sm text-gray-400">
        {files.length} files
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-900/50 text-red-200 rounded-md border border-red-800">
          {error}
        </div>
      )}
      
      {moveNotification && (
        <div className="p-4 bg-yellow-900/50 text-yellow-200 rounded-md border border-yellow-800">
          {moveNotification}
          <button
            className="ml-4 px-2 py-1 bg-yellow-700 text-white rounded hover:bg-yellow-800"
            onClick={() => setMoveNotification(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      
      <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">File Management</h3>
          <div className="flex items-center space-x-2">
            {renderFileTypeDisplay(activeTab)}
            <button 
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
              title="Refresh files"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-400">Loading files...</p>
          </div>
        ) : (
          <div className="flex">
            {/* Left column with file types */}
            <div className="w-64 border-r border-gray-700 p-4">
              <div className="space-y-2">
                {INITIAL_FILE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {fileTypeLabels[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Right column with file list and upload area */}
            <div className="flex-1 p-4">
              {/* Tag search/filter input */}
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="text"
                  value={tagFilter}
                  onChange={e => setTagFilter(e.target.value)}
                  placeholder="Filter by tag (e.g. NGC, telescope, filter...)"
                  className="px-3 py-2 rounded-md border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {tagFilter && (
                  <button onClick={() => setTagFilter('')} className="ml-2 px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600">Clear</button>
                )}
              </div>

              {/* Search bar - only show if there are files */}
              {hasLoadedFiles && filesByType[activeTab].length > 0 && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Empty state */}
              {hasLoadedFiles && filesByType[activeTab].length === 0 ? (
                <div className="text-center py-8">
                  <File className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No files found in this category</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload some files to get started
                  </p>
                </div>
              ) : (
                /* File list */
                <div className="space-y-2">
                  {renderFileList(filteredFiles)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add calibration progress button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleCalibrationProgress}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Proceed to Calibration
        </button>
      </div>

      {/* Calibration warning modal */}
      {showCalibrationWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Missing Calibration Frames</h3>
            <p className="text-gray-300 mb-4">
              You are missing the following calibration frames:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              {missingFrameTypes.map(type => (
                <li key={type} className="capitalize">{type} frames</li>
              ))}
            </ul>
            <p className="text-gray-300 mb-4">
              Calibration may not be optimal without these frames. Do you want to proceed anyway?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCalibrationWarning(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCalibration}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-4 rounded-lg max-w-4xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">File Preview</h3>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative">
              <img
                src={previewUrl}
                alt="FITS Preview"
                className="w-full h-auto rounded-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Preview loading overlay */}
      {previewLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
            <p className="text-white mt-4">Generating preview...</p>
          </div>
        </div>
      )}

      {/* Preview error modal */}
      {previewError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 text-red-500 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Preview Error</h3>
            </div>
            <p className="text-gray-300 mb-6">{previewError}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewError(null)}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 