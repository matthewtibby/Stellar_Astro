import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { validateFITSFile } from '@/src/utils/fileValidation';
import { uploadRawFrame, getFitsFileUrl, getFilesByType } from '@/src/utils/storage';
import type { StorageFile } from '@/src/types/store';
import { File, AlertCircle, Upload, X, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import type { FileType } from '@/src/types/store';
import { spaceFacts } from '@/src/utils/spaceFacts';
import { handleError, ValidationError } from '@/src/utils/errorHandling';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import Image from 'next/image';
import { useToast } from '../hooks/useToast';

type StorageFileWithMetadata = StorageFile & { metadata?: Record<string, unknown> };

interface UniversalFileUploadProps {
  projectId: string;
  userId: string;
  onUploadComplete?: () => void;
  onValidationError?: (error: string) => void;
  onStepAutosave?: () => void;
  isSavingStep?: boolean;
  layout?: 'upload-only' | 'file-list-only';
  activeTab?: FileType;
  viewAll?: boolean;
}

interface UploadStatus {
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

export function UniversalFileUpload({ 
  projectId, 
  userId,
  onUploadComplete,
  onValidationError,
  onStepAutosave,
  isSavingStep,
  layout,
  activeTab = 'light',
  viewAll = false
}: UniversalFileUploadProps) {
  console.log('UniversalFileUpload rendered with userId:', userId, 'projectId:', projectId);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [moveNotification, setMoveNotification] = useState<string | null>(null);
  const [filesByType, setFilesByType] = useState<Record<FileType, StorageFileWithMetadata[]>>({
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const { } = useToast();
  const [batchTotalBytes, setBatchTotalBytes] = useState(0);
  const [batchUploadedBytes, setBatchUploadedBytes] = useState(0);
  const [batchSpeed, setBatchSpeed] = useState(0); // bytes/sec
  const [batchETA, setBatchETA] = useState<number | null>(null);
  const previewCache = useRef<Record<string, string>>({});

  // Move closePreview definition here
  const closePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  // Function to save files to localStorage
  const saveFilesToLocalStorage = useCallback((files: Record<FileType, StorageFileWithMetadata[]>) => {
    try {
      localStorage.setItem(`files_${projectId}`, JSON.stringify(files));
    } catch (error) {
      console.error('Error saving files to localStorage:', error);
    }
  }, [projectId]);

  // Function to load files from localStorage
  const loadFilesFromLocalStorage = useCallback(() => {
    try {
      const savedFiles = localStorage.getItem(`files_${projectId}`);
      if (savedFiles) {
        const parsedFiles = JSON.parse(savedFiles);
        setFilesByType(parsedFiles);
        return parsedFiles;
      }
    } catch (error) {
      console.error('Error loading files from localStorage:', error);
    }
    return null;
  }, [projectId]);

  // Load files on component mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        // First try to load from localStorage
        const savedFiles = loadFilesFromLocalStorage();
        
        // Then fetch from server to ensure we have the latest state
        const serverFiles = await getFilesByType(projectId);
        
        // Merge the files, prioritizing server files (they might be more up-to-date)
        const mergedFiles = { ...savedFiles, ...serverFiles };
        setFilesByType(mergedFiles);
        saveFilesToLocalStorage(mergedFiles);
      } catch (error) {
        console.error('Error loading files:', error);
        onValidationError?.(error instanceof Error ? error.message : 'Failed to load files');
      }
    };

    loadFiles();
  }, [projectId, onValidationError, loadFilesFromLocalStorage, saveFilesToLocalStorage]);

  // Save files whenever they change
  useEffect(() => {
    saveFilesToLocalStorage(filesByType);
  }, [filesByType, saveFilesToLocalStorage]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('onDrop called, acceptedFiles:', acceptedFiles, 'userId:', userId, 'projectId:', projectId);
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
      
      // Process each file based on validation results
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
        await uploadRawFrame(
          file,
          projectId,
          fileType
        );
        uploadedBytes += file.size;
        setBatchUploadedBytes(uploadedBytes);
      }
      setIsUploading(false);
      if (onUploadComplete) onUploadComplete();
      if (onStepAutosave) onStepAutosave();
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
        console.error('Error fetching files after upload:', fetchError);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const appError = handleError(error);
      setUploadStatuses(prev => prev.map(status =>
        status.status === 'uploading'
          ? {
              ...status,
              status: 'error',
              error: appError.message
            }
          : status
      ));
      onValidationError?.(appError.message);
      setIsUploading(false);
    }
  }, [projectId, userId, activeTab, onUploadComplete, onValidationError, onStepAutosave]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/fits': ['.fits', '.fit', '.FIT', '.FITS', '.RAW'],
    },
    multiple: true,
  });

  // Prefetch preview images for the first 3 files in the current tab or all
  useEffect(() => {
    let filesToPrefetch: StorageFileWithMetadata[] = [];
    if (viewAll) {
      filesToPrefetch = Object.values(filesByType).flat().slice(0, 3);
    } else {
      filesToPrefetch = filesByType[activeTab]?.slice(0, 3) || [];
    }
    filesToPrefetch.forEach(async (file) => {
      if (!previewCache.current[file.path]) {
        try {
          const fileUrl = await getFitsFileUrl(file.path);
          const previewResponse = await fetch('http://localhost:8000/preview-fits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: fileUrl }),
          });
          if (previewResponse.ok) {
            const imageBlob = await previewResponse.blob();
            const imageUrl = URL.createObjectURL(imageBlob);
            previewCache.current[file.path] = imageUrl;
          }
        } catch { }
      }
    });
    // Cleanup: revokeObjectURL on unmount
    return () => {
      Object.values(previewCache.current).forEach(url => URL.revokeObjectURL(url));
      previewCache.current = {};
    };
  }, [filesByType, activeTab, viewAll]);

  // ESC and overlay click to close preview (for both loading and loaded)
  useEffect(() => {
    if (!(previewUrl || previewLoading)) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePreview();
        setPreviewError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewUrl, previewLoading, closePreview]);

  // Use cache if available in handlePreview
  async function handlePreview(file: StorageFile) {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewUrl(null);
      // Use cache if available
      if (previewCache.current[file.path]) {
        setPreviewUrl(previewCache.current[file.path]);
        setPreviewLoading(false);
        return;
      }
      // Log the file path for debugging
      console.log('[FITS Preview] Attempting to get signed URL for file path:', file.path);

      // Get the file URL from Supabase
      const fileUrl = await getFitsFileUrl(file.path);
      console.log('[FITS Preview] Got signed URL:', fileUrl);

      // Send the URL to your preview endpoint
      const previewResponse = await fetch('http://localhost:8000/preview-fits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fileUrl }),
      });

      if (!previewResponse.ok) {
        const errorText = await previewResponse.text();
        console.error('[FITS Preview] Preview generation failed:', errorText);
        throw new Error(`Failed to generate preview: ${errorText}`);
      }

      // Get the image blob and create a URL
      const imageBlob = await previewResponse.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      previewCache.current[file.path] = imageUrl;
      setPreviewUrl(imageUrl);
      console.log('[FITS Preview] Preview generated successfully');
    } catch (error) {
      console.error('[FITS Preview] Error:', error);
      setPreviewError(error instanceof Error ? error.message : 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleDelete() {
    // Implement delete logic here
  }

  function toggleFileExpansion(fileName: string) {
    setExpandedFiles(prev => ({
      ...prev,
      [fileName]: !prev[fileName]
    }));
  }

  function renderMetadataTable(file: StorageFileWithMetadata) {
    const meta = file.metadata || {};
    return (
      <table className="text-xs text-gray-200 w-full">
        <tbody>
          {Object.entries(meta).map(([key, value]) => (
            <tr key={key}>
              <td className="font-semibold pr-2">{key}</td>
              <td>{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Add retry logic
  const retryUpload = async (file: File, fileType: FileType) => {
    setUploadStatuses(prev => prev.map(status => status.file === file ? { ...status, status: 'uploading', progress: 0, error: undefined } : status));
    try {
      // Validate file
      const validationResult = await validateFITSFile(file, projectId, userId);
      if (!validationResult.isValid) {
        throw new ValidationError(validationResult.warnings ? validationResult.warnings.join(', ') : 'File validation failed.');
      }
      // Upload file
      await uploadRawFrame(
        file,
        projectId,
        fileType
      );
      setUploadStatuses(prev => prev.map(status => status.file === file ? { ...status, status: 'completed', progress: 1 } : status));
      // Update filesByType
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

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Conditionally render based on layout prop */}
        {(!layout || layout === 'upload-only') && (
          <div>
            {/* Upload Area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors bg-[#0a0d13]/80 shadow-2xl border-[#232946]/60 backdrop-blur-md ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-[#232946]/60 hover:border-blue-400'}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" aria-label="Upload" />
              <p className="text-lg text-blue-200 mb-2">
                {isDragActive
                  ? 'Drop your FITS files here...'
                  : 'Drag and drop FITS files here, or click to select files'}
              </p>
              <p className="text-sm text-blue-300">
                Supported formats: .fits, .fit, .FIT, .FITS, .RAW
              </p>
              {typeof isSavingStep !== 'undefined' && (
                <div className="flex items-center justify-center mt-2">
                  {isSavingStep ? (
                    <span className="flex items-center text-blue-400 text-sm"><svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Autosaving...</span>
                  ) : (
                    <span className="flex items-center text-green-400 text-sm"><svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Saved</span>
                  )}
                </div>
              )}
            </div>
            {/* Step 1 Instructions */}
            <div className="mt-6 p-4 bg-blue-900/70 border border-blue-500/30 rounded-lg text-blue-100 text-center text-base shadow">
              <b>Step 1: Upload your FITS files</b><br />
              Drag and drop your FITS files above. Upload at least one light frame to continue.
            </div>
          </div>
        )}
        {(!layout || layout === 'file-list-only') && (
          <>
            {/* File List for Active Tab or All */}
            <div className="bg-[#10131a]/90 rounded-2xl p-6 border border-[#232946]/60 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">
                {viewAll
                  ? 'All Frames'
                  : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Frames`}
                <span className="ml-2 text-sm text-blue-300">
                  {viewAll
                    ? `(${Object.values(filesByType).flat().length} files)`
                    : `(${filesByType[activeTab]?.length || 0} files)`}
                </span>
              </h3>
              {viewAll && (
                <div className="mb-2 p-2 bg-blue-900/30 text-blue-200 rounded text-sm text-center">
                  Viewing all frames across all types
                </div>
              )}
              <div className="space-y-2">
                {(viewAll
                  ? Object.entries(filesByType).flatMap(([type, files]) =>
                      files.map(file => ({ ...file, type: type as FileType }))
                    )
                  .sort((a, b) => {
                    const typeOrder = ['light', 'dark', 'bias', 'flat'];
                    const aIndex = typeOrder.indexOf(a.type);
                    const bIndex = typeOrder.indexOf(b.type);
                    if (aIndex !== -1 && bIndex !== -1) {
                      if (aIndex !== bIndex) return aIndex - bIndex;
                    } else if (aIndex !== -1) {
                      return -1;
                    } else if (bIndex !== -1) {
                      return 1;
                    }
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  })
                  : filesByType[activeTab] || []
                )
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((file) => (
                    <div 
                      key={file.path} 
                      className="flex items-center p-2 bg-[#181c23] rounded-lg hover:bg-blue-900/30 group border border-[#232946]/40 shadow"
                    >
                      <span className="text-sm text-blue-100 truncate max-w-xs font-mono" title={file.name}>{file.name}</span>
                      {viewAll && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-blue-900 text-xs text-blue-300 border border-blue-700">
                          {file.type}
                        </span>
                      )}
                      <span className="text-xs text-blue-300 ml-2">
                        {new Date(file.created_at).toLocaleDateString('en-US')}
                      </span>
                      <div className="flex items-center space-x-2 ml-auto">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="text-blue-300 hover:text-blue-400 flex items-center px-2 py-1 rounded hover:bg-blue-800 transition"
                              onClick={() => handlePreview(file)}
                              aria-label="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Preview</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="ml-2 text-blue-300 hover:text-blue-400 flex items-center"
                              onClick={() => toggleFileExpansion(file.name)}
                              aria-label="Show metadata"
                            >
                              {expandedFiles[file.name] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Show metadata</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="text-blue-300 hover:text-red-500"
                              onClick={() => handleDelete()}
                              aria-label="Delete file"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Delete file</TooltipContent>
                        </Tooltip>
                      </div>
                      {expandedFiles[file.name] && (
                        <div className="bg-[#232946] p-3 rounded mt-2 w-full">
                          {renderMetadataTable(file)}
                        </div>
                      )}
                    </div>
                  ))}
                {((viewAll && Object.values(filesByType).flat().length === 0) || (!viewAll && (!filesByType[activeTab] || filesByType[activeTab].length === 0))) && (
                  <p className="text-sm text-blue-300 text-center py-4">
                    No {viewAll ? 'frames' : activeTab + ' frames'} uploaded yet
                  </p>
                )}
              </div>
            </div>
          </>
        )}
        {/* Upload Status - only show during active uploads */}
        {isUploading && (
          <div className="mt-4 bg-gray-800/70 rounded-lg p-4 border border-blue-700">
            <h4 className="text-blue-300 text-sm mb-2">Uploading Files...</h4>
            {/* Batch progress bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-200">Batch Progress</span>
                <span className="text-xs text-gray-400">
                  {batchTotalBytes > 0 ? `${((batchUploadedBytes / batchTotalBytes) * 100).toFixed(0)}%` : '0%'}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded h-2">
                <div
                  className="h-2 rounded bg-blue-500"
                  style={{ width: `${batchTotalBytes > 0 ? (batchUploadedBytes / batchTotalBytes) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1 text-xs text-gray-400">
                <span>
                  Speed: {batchSpeed > 0 ? `${(batchSpeed / 1024 / 1024).toFixed(2)} MB/s` : '--'}
                </span>
                <span>
                  ETA: {batchETA !== null && batchETA > 0 ? `${Math.floor(batchETA / 60)}m ${Math.round(batchETA % 60)}s` : '--'}
                </span>
              </div>
            </div>
            {uploadStatuses.map((status) => (
              <div key={status.file.name} className="mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-200">
                    {status.file.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {status.status === 'completed' ? '✓' : `${Math.round((status.progress || 0) * 100)}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded h-2 mt-1">
                  <div
                    className={`h-2 rounded ${
                      status.status === 'completed' 
                        ? 'bg-green-500' 
                        : status.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.round((status.progress || 0) * 100)}%` }}
                  />
                </div>
                {status.status === 'error' && (
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-red-400 flex-1">{status.error}</p>
                    <button
                      className="ml-2 px-2 py-1 bg-blue-700 text-white rounded hover:bg-blue-800 text-xs"
                      onClick={() => retryUpload(status.file, status.type || activeTab)}
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            ))}
            {uploadStatuses.some(s => s.status === 'error') && (
              <button
                className="mt-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 text-sm"
                onClick={retryAllFailed}
              >
                Retry All Failed
              </button>
            )}
          </div>
        )}
        {/* Move Notification */}
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
        {/* Preview Modal (scaffold) */}
        {(previewUrl || previewLoading) && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
            onClick={closePreview}
            tabIndex={-1}
            aria-modal="true"
            role="dialog"
          >
            <div
              className={previewUrl ? "bg-gray-900 rounded-lg p-6 max-w-2xl w-full relative" : "bg-gray-900 p-8 rounded-lg max-w-md"}
              onClick={e => e.stopPropagation()}
            >
              {previewUrl && (
                <>
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    onClick={closePreview}
                    title="Close preview"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <h2 className="text-lg font-bold text-white mb-4">Preview</h2>
                  <div className="w-full h-auto rounded-md overflow-hidden">
                    <Image src={previewUrl} alt="FITS Preview" width={800} height={600} className="w-full h-auto rounded-md" />
                  </div>
                </>
              )}
              {previewLoading && (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
                  <p className="text-white mt-4 text-center">Generating preview...</p>
                  <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                    <p className="text-blue-400 text-sm italic text-center">
                      {spaceFacts[Math.floor(Math.random() * spaceFacts.length)]}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
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
    </TooltipProvider>
  );
} 