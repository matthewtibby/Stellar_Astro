'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getFilesByType, type StorageFile, validateFitsFile, uploadRawFrame, getFitsFileUrl, deleteFitsFile, type FitsValidationResult } from '@/src/utils/storage';
import { File, Trash2, Download, Eye, RefreshCw, FolderOpen, Upload, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { type FileType } from '@/src/types/store';
import { useDropzone } from 'react-dropzone';

// Add constant for initial file types
const INITIAL_FILE_TYPES: FileType[] = ['light', 'dark', 'bias', 'flat'];

interface FileManagementPanelProps {
  projectId: string;
  onFileSelect?: (file: StorageFile) => void;
  onRefresh?: () => void;
  onValidationError?: (error: string) => void;
  onProgress?: (progress: number) => void;
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

export function FileManagementPanel({ 
  projectId, 
  onFileSelect,
  onRefresh,
  onValidationError,
  onProgress
}: FileManagementPanelProps) {
  const [filesByType, setFilesByType] = useState<Record<FileType, StorageFile[]>>({
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FileType>('light');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [currentFile, setCurrentFile] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [selectedType, setSelectedType] = useState<FileType | null>(null);
  const [showCalibrationWarning, setShowCalibrationWarning] = useState(false);
  const [missingFrameTypes, setMissingFrameTypes] = useState<FileType[]>([]);
  const [selectedFileMetadata, setSelectedFileMetadata] = useState<FitsValidationResult['metadata'] | null>(null);
  const [fileWarnings, setFileWarnings] = useState<Record<string, string[]>>({});
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
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  const loadFiles = async () => {
    try {
      setLoading(true);
      const files = await getFilesByType(projectId);
      setFilesByType(files);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('onDrop triggered with files:', acceptedFiles);
    console.log('Current active tab:', activeTab);
    setUploadError(null);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of acceptedFiles) {
      try {
        console.log('Validating file:', file.name, 'with type:', activeTab);
        const validationResult = await validateFitsFile(file, activeTab);
        console.log('Validation result:', validationResult);
        
        if (!validationResult.valid) {
          errors.push(`${file.name}: ${validationResult.message}`);
        } else {
          validFiles.push(file);
          // Store metadata and warnings
          if (validationResult.metadata) {
            setSelectedFileMetadata(validationResult.metadata);
          }
          if (validationResult.warnings.length > 0) {
            setFileWarnings(prev => ({
              ...prev,
              [file.name]: validationResult.warnings
            }));
          }
        }
      } catch (error) {
        console.error('Validation error:', error);
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Validation failed'}`);
      }
    }

    if (errors.length > 0) {
      const errorMessage = errors.join('\n');
      console.error('Validation errors:', errorMessage);
      setUploadError(errorMessage);
      onValidationError?.(errorMessage);
    }

    console.log('Valid files:', validFiles);
    if (validFiles.length > 0) {
      console.log('Setting selected files with type:', activeTab);
      setSelectedFiles(validFiles.map(file => ({ file, type: activeTab })));
    }
  }, [activeTab, onValidationError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/fits': ['.fits', '.fit', '.FIT', '.FITS', '.RAW'],
    },
    multiple: true,
  });

  const handleUpload = async () => {
    console.log('handleUpload called with selectedFiles:', selectedFiles);
    if (!selectedFiles.length) {
      console.log('No files selected, returning');
      return;
    }

    try {
      console.log('Starting upload process');
      setIsUploading(true);
      setError(null);
      const uploadPromises = selectedFiles.map(async (selectedFile) => {
        try {
          console.log(`Starting upload for file: ${selectedFile.file.name} with type: ${selectedFile.type}`);
          setCurrentFile(selectedFile.file.name);
          const filePath = await uploadRawFrame(
            projectId,
            selectedFile.type,
            selectedFile.file,
            (progress) => {
              console.log(`Progress for ${selectedFile.file.name}: ${progress * 100}%`);
              setUploadProgress(prev => ({
                ...prev,
                [selectedFile.file.name]: progress
              }));
            }
          );
          console.log(`Upload completed for file: ${selectedFile.file.name}, path: ${filePath}`);
          return filePath;
        } catch (error) {
          console.error(`Error uploading file ${selectedFile.file.name}:`, error);
          throw error;
        }
      });

      const uploadedPaths = await Promise.all(uploadPromises);
      console.log('All uploads completed, paths:', uploadedPaths);
      
      if (onProgress) onProgress(1);
      
      // Wait for Supabase to process the files
      console.log('Upload complete, waiting for files to be available...');
      
      // Add multiple retries for file listing with exponential backoff
      let retries = 5;
      let delay = 2000; // Start with 2 seconds
      let filesFound = false;
      
      while (retries > 0 && !filesFound) {
        try {
          console.log(`Attempting to fetch files (${retries} retries remaining, waiting ${delay}ms)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          const files = await getFilesByType(projectId);
          console.log('Files after refresh:', files);
          
          // Check if our uploaded files are in the result
          const uploadedFileNames = uploadedPaths.map(path => path.split('/').pop());
          const foundFiles = Object.values(files).flat().some(file => 
            uploadedFileNames.includes(file.name)
          );
          
          if (foundFiles) {
            console.log('Uploaded files found in the list');
            setFilesByType(files);
            filesFound = true;
          } else {
            console.log('Uploaded files not found yet, waiting before retry');
            delay *= 2; // Exponential backoff
            retries--;
          }
        } catch (error) {
          console.error('Error fetching files:', error);
          retries--;
          if (retries > 0) {
            delay *= 2;
          }
        }
      }

      if (!filesFound) {
        console.warn('Uploaded files not found after all retries');
        setError('Files uploaded but not immediately visible. They should appear after a refresh.');
      }

      setSelectedFiles([]);
      setUploadProgress({});
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error in handleUpload:', error);
      setError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (file: StorageFile) => {
    try {
      const url = await getFitsFileUrl(file.path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      // You might want to show an error toast here
    }
  };

  const handleDeleteFile = async (file: StorageFile) => {
    try {
      await deleteFitsFile(file.path);
      // Refresh the file list
      await loadFiles();
      if (onRefresh) onRefresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  const filteredFiles = filesByType[activeTab].filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    'pre-processed': 'Pre-processed',
    'post-processed': 'Post-processed'
  };

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

  // Add a useEffect to handle file count updates
  useEffect(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [filesByType, onRefresh]);

  const handleUploadClick = (type: FileType) => {
    fileInputRefs.current[type]?.click();
  };

  const handleFileChange = (type: FileType) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of fileList) {
      try {
        const validationResult = await validateFitsFile(file, type);
        
        if (!validationResult.valid) {
          errors.push(`${file.name}: ${validationResult.message}`);
        } else {
          validFiles.push(file);
          // Store metadata and warnings
          if (validationResult.metadata) {
            setSelectedFileMetadata(validationResult.metadata);
          }
          if (validationResult.warnings.length > 0) {
            setFileWarnings(prev => ({
              ...prev,
              [file.name]: validationResult.warnings
            }));
          }
        }
      } catch (error) {
        console.error('Validation error:', error);
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Validation failed'}`);
      }
    }

    if (errors.length > 0) {
      const errorMessage = errors.join('\n');
      setUploadError(errorMessage);
      onValidationError?.(errorMessage);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles.map(file => ({ file, type })));
    }
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

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-900/50 text-red-200 rounded-md border border-red-800">
          {error}
        </div>
      )}
      
      {isUploading && (
        <div className="p-4 bg-blue-900/50 text-blue-200 rounded-md border border-blue-800">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-transparent" />
            <span>Uploading {currentFile}... {uploadProgress[currentFile] ? Math.round(uploadProgress[currentFile] * 100) : 0}%</span>
          </div>
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress[currentFile] ? Math.round(uploadProgress[currentFile] * 100) : 0}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">File Management</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {filesByType[activeTab]?.length || 0} files
            </span>
            <button 
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
              title="Refresh files"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {!loading && !error && (
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
                    <span className="ml-auto text-xs">
                      ({filesByType[type]?.length || 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right column with file list and upload area */}
            <div className="flex-1 p-4">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Drag and drop area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-4 ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {isDragActive
                    ? 'Drop the files here...'
                    : 'Drag and drop files here, or click to select files'}
                </p>
              </div>

              {/* File list */}
              <div className="space-y-2">
                {filteredFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex flex-col p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <File className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-white">{file.name}</p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(file.size)} • {formatDate(file.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onFileSelect?.(file)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="View file"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Show metadata if available */}
                    {selectedFileMetadata && (
                      <FileMetadata 
                        metadata={selectedFileMetadata} 
                        isExpanded={expandedFiles[file.name] || false}
                        onToggle={() => toggleFileExpansion(file.name)}
                      />
                    )}
                    
                    {/* Show warnings if any */}
                    {fileWarnings[file.name]?.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-900/50 rounded-md text-sm">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
                          <div className="space-y-1">
                            {fileWarnings[file.name].map((warning, i) => (
                              <p key={i} className="text-yellow-400">{warning}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Show upload button when files are selected */}
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={handleUpload}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Uploading {currentFile}... ({uploadProgress[currentFile] ? Math.round(uploadProgress[currentFile] * 100) : 0}%)</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Show error if any */}
              {uploadError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500 rounded-md">
                  <p className="text-red-500 text-sm">{uploadError}</p>
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
    </div>
  );
} 