'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getFilesByType, type StorageFile, validateFitsFile, uploadRawFrame, getFitsFileUrl, deleteFitsFile, type FitsValidationResult } from '@/src/utils/storage';
import { File, Trash2, Download, Eye, RefreshCw, FolderOpen, Upload, AlertCircle, Info, ChevronDown, ChevronUp, X } from 'lucide-react';
import { type FileType } from '@/src/types/store';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

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
  const [loading, setLoading] = useState(false);
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
  const [hasLoadedFiles, setHasLoadedFiles] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [moveNotification, setMoveNotification] = useState<string | null>(null);

  // Initialize file input refs
  useEffect(() => {
    try {
      // Create a container div for the file inputs
      const container = document.createElement('div');
      container.style.display = 'none';
      document.body.appendChild(container);
      
      // Create file inputs
      INITIAL_FILE_TYPES.forEach(type => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.fits,.fit,.FIT,.FITS,.RAW';
        input.multiple = true;
        input.dataset.fileType = type;
        input.style.display = 'none';
        
        // Store the event handler in a variable so we can remove it later
        const handleChange = (event: Event) => {
          const changeEvent = event as unknown as React.ChangeEvent<HTMLInputElement>;
          handleFileChange(type)(changeEvent);
        };
        
        // Store the handler on the input for cleanup
        (input as any).__changeHandler = handleChange;
        input.addEventListener('change', handleChange);
        
        container.appendChild(input);
        fileInputRefs.current[type] = input;
      });
    } catch (error) {
    }
    
    // Cleanup function
    return () => {
      try {
        // Remove all file inputs and their event listeners
        INITIAL_FILE_TYPES.forEach(type => {
          const input = fileInputRefs.current[type];
          if (input) {
            const handler = (input as any).__changeHandler;
            if (handler) {
              input.removeEventListener('change', handler);
            }
            fileInputRefs.current[type] = null;
          }
        });
        
        // Remove the container
        const container = document.querySelector('div[style="display: none;"]');
        if (container?.parentNode) {
          container.parentNode.removeChild(container);
        }
      } catch (error) {
      }
    };
  }, []); // Empty dependency array since we only want this to run once

  const handleFileChange = useCallback((type: FileType) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    
    const files = event.target.files;
    if (!files || files.length === 0) {
      setUploadError('No files selected');
      return;
    }

    const fileList = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];
    let abortController = new AbortController();

    try {
      // Validate file types and sizes
      for (const file of fileList) {
        if (!file.name.toLowerCase().endsWith('.fits') && 
            !file.name.toLowerCase().endsWith('.fit') &&
            !file.name.toLowerCase().endsWith('.raw')) {
          errors.push(`${file.name}: Unsupported file type`);
          continue;
        }

        if (file.size > 100 * 1024 * 1024) { // 100MB limit
          errors.push(`${file.name}: File too large (max 100MB)`);
          continue;
        }

        try {
          const validationResult = await validateFitsFile(file, type);
          
          if (!validationResult.valid) {
            errors.push(`${file.name}: ${validationResult.message}`);
          } else {
            validFiles.push(file);
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
          errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Validation failed'}`);
        }
      }

      if (errors.length > 0) {
        const errorMessage = errors.join('\n');
        setUploadError(errorMessage);
        onValidationError?.(errorMessage);
        return;
      }

      if (validFiles.length > 0) {
        const newSelectedFiles = validFiles.map(file => ({ file, type }));
        setSelectedFiles(newSelectedFiles);
        
        // Start upload immediately
        setIsUploading(true);
        setError(null);
        setUploadProgress({});

        for (const selectedFile of newSelectedFiles) {
          if (abortController.signal.aborted) {
            break;
          }

          try {
            setCurrentFile(selectedFile.file.name);
            const filePath = await uploadRawFrame(
              projectId,
              selectedFile.type,
              selectedFile.file,
              (progress) => {
                setUploadProgress(prev => ({
                  ...prev,
                  [selectedFile.file.name]: progress
                }));
              },
              abortController.signal
            );
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to upload file');
            break;
          }
        }

        // Refresh the file list after upload
        await loadFiles();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setIsUploading(false);
      setSelectedFiles([]);
      setUploadProgress({});
      abortController.abort();
    }
  }, [projectId, onRefresh, onValidationError]);

  const loadFiles = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const files = await getFilesByType(projectId);
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadError(null);
    const validFiles: SelectedFile[] = [];
    const errors: string[] = [];
    const moveMessages: string[] = [];

    // Create a new AbortController for this upload
    const controller = new AbortController();
    setAbortController(controller);

    for (const file of acceptedFiles) {
      try {
        const validationResult = await validateFitsFile(file, activeTab);
        if (validationResult.valid) {
          validFiles.push({ file, type: activeTab });
          if (validationResult.metadata) {
            setSelectedFileMetadata(validationResult.metadata);
          }
          if (validationResult.warnings.length > 0) {
            setFileWarnings(prev => ({
              ...prev,
              [file.name]: validationResult.warnings
            }));
          }
        } else if (
          validationResult.actual_type &&
          ['light', 'dark', 'bias', 'flat'].includes(validationResult.actual_type)
        ) {
          // Move to correct folder
          validFiles.push({ file, type: validationResult.actual_type as FileType });
          moveMessages.push(
            `We noticed you uploaded a ${validationResult.actual_type} frame in the ${activeTab} tab. We've moved it to the ${validationResult.actual_type.charAt(0).toUpperCase() + validationResult.actual_type.slice(1)} tab for you.`
          );
        } else {
          errors.push(`${file.name}: ${validationResult.message}`);
        }
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Validation failed'}`);
      }
    }

    if (errors.length > 0) {
      const errorMessage = errors.join('\n');
      setUploadError(errorMessage);
      onValidationError?.(errorMessage);
    }

    if (moveMessages.length > 0) {
      setMoveNotification(moveMessages.join(' '));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setIsUploading(true);
      setError(null);
      setUploadProgress({});

      for (const selectedFile of validFiles) {
        try {
          setCurrentFile(selectedFile.file.name);
          const filePath = await uploadRawFrame(
            projectId,
            selectedFile.type,
            selectedFile.file,
            (progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [selectedFile.file.name]: progress
              }));
            },
            controller.signal
          );
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            setError('Upload cancelled');
            break;
          }
          setError(error instanceof Error ? error.message : 'Failed to upload file');
          break;
        }
      }

      await loadFiles();
      if (onRefresh) onRefresh();
      setIsUploading(false);
      setSelectedFiles([]);
      setUploadProgress({});
      setAbortController(null);
    }
  }, [activeTab, onValidationError, projectId, onRefresh]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/fits': ['.fits', '.fit', '.FIT', '.FITS', '.RAW'],
    },
    multiple: true,
  });

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    const moveMessages: string[] = [];
    // Create a new AbortController for this upload
    const controller = new AbortController();
    setAbortController(controller);

    // Validate all files before uploading
    const filesToUpload: SelectedFile[] = [];
    for (const selectedFile of selectedFiles) {
      const validationResult = await validateFitsFile(selectedFile.file, selectedFile.type);
      if (validationResult.valid) {
        filesToUpload.push(selectedFile);
      } else if (
        validationResult.actual_type &&
        ['light', 'dark', 'bias', 'flat'].includes(validationResult.actual_type)
      ) {
        filesToUpload.push({ file: selectedFile.file, type: validationResult.actual_type as FileType });
        moveMessages.push(
          `We noticed you uploaded a ${validationResult.actual_type} frame in the ${selectedFile.type} tab. We've moved it to the ${validationResult.actual_type.charAt(0).toUpperCase() + validationResult.actual_type.slice(1)} tab for you.`
        );
      } else {
        setError(validationResult.message);
      }
    }
    if (moveMessages.length > 0) {
      setMoveNotification(moveMessages.join(' '));
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress({});

      for (const selectedFile of filesToUpload) {
        try {
          setCurrentFile(selectedFile.file.name);
          const filePath = await uploadRawFrame(
            projectId,
            selectedFile.type,
            selectedFile.file,
            (progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [selectedFile.file.name]: progress
              }));
            },
            controller.signal
          );
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            setError('Upload cancelled');
            break;
          }
          setError(error instanceof Error ? error.message : 'Failed to upload file');
          break;
        }
      }

      await loadFiles();
      if (onRefresh) onRefresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setIsUploading(false);
      setSelectedFiles([]);
      setUploadProgress({});
      setAbortController(null);
    }
  };

  const handleCancelUpload = () => {
    if (abortController) {
      abortController.abort();
      setIsUploading(false);
      setSelectedFiles([]);
      setUploadProgress({});
      setAbortController(null);
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

  useEffect(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [filesByType, onRefresh]);

  const handleUploadClick = (type: FileType) => {
    try {
      const input = fileInputRefs.current[type];
      if (input) {
        input.value = '';
        input.click();
      } else {
        alert('File upload failed: Input element not found for type: ' + type);
        setError('File upload failed: Input element not found');
      }
    } catch (error) {
      alert('Error in handleUploadClick: ' + error);
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

  const handlePreview = async (file: StorageFile) => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewUrl(null);
      
      console.log('Starting preview for file:', file.name);
      
      // Get the file URL from Supabase
      const fileUrl = await getFitsFileUrl(file.path);
      console.log('Got file URL:', fileUrl);
      
      // Send the URL to our preview endpoint
      console.log('Sending to preview endpoint...');
      const previewResponse = await fetch('http://localhost:8000/preview-fits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileUrl),
      });
      
      if (!previewResponse.ok) {
        const errorText = await previewResponse.text();
        throw new Error(`Failed to generate preview: ${errorText}`);
      }
      
      // Get the image blob and create a URL
      const imageBlob = await previewResponse.blob();
      console.log('Got preview image:', imageBlob.size, 'bytes');
      const imageUrl = URL.createObjectURL(imageBlob);
      setPreviewUrl(imageUrl);
    } catch (error) {
      console.error('Preview error:', error);
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

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clean up any ongoing uploads
      setSelectedFiles([]);
      setUploadProgress({});
      setIsUploading(false);
    };
  }, []);

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-900/50 text-red-200 rounded-md border border-red-800">
          {error}
        </div>
      )}
      
      {isUploading && (
        <div className="p-4 bg-blue-900/50 text-blue-200 rounded-md border border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-transparent" />
              <span>Uploading {currentFile}... {uploadProgress[currentFile] ? Math.round(uploadProgress[currentFile] * 100) : 0}%</span>
            </div>
            <button
              onClick={handleCancelUpload}
              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress[currentFile] ? Math.round(uploadProgress[currentFile] * 100) : 0}%` }}
            />
          </div>
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
                    <span className="ml-auto text-xs">
                      ({filesByType[type]?.length || 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right column with file list and upload area */}
            <div className="flex-1 p-4">
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
                  {filteredFiles.map((file) => (
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
                              {formatFileSize(file.size)} • {formatDate(file.created_at)}
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