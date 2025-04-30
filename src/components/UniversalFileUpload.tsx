import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { validateFitsFile, uploadRawFrame, type FitsValidationResult, getFilesByType, type StorageFile, getFitsFileUrl } from '@/src/utils/storage';
import { File, AlertCircle, Info, Upload, X, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { type FileType } from '@/src/types/store';
import { spaceFacts } from '@/src/utils/spaceFacts';

type StorageFileWithMetadata = StorageFile & { metadata?: any };

interface UniversalFileUploadProps {
  projectId: string;
  userId: string;
  onUploadComplete?: () => void;
  onValidationError?: (error: string) => void;
}

interface UploadStatus {
  file: File;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  type?: FileType;
  metadata?: any;
  error?: string;
  warnings?: string[];
  index: number;
  total: number;
}

export function UniversalFileUpload({ 
  projectId, 
  userId,
  onUploadComplete,
  onValidationError 
}: UniversalFileUploadProps) {
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [moveNotification, setMoveNotification] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [activeTab, setActiveTab] = useState<FileType>('light');
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
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

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
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setUploadStatuses(acceptedFiles.map((file, index) => ({
      file,
      type: activeTab,
      progress: 0,
      status: 'uploading',
      warnings: [],
      index: index + 1,
      total: acceptedFiles.length
    })));

    for (const file of acceptedFiles) {
      try {
        // Validate the FITS file
        const validationResult = await validateFitsFile(file, projectId, userId);
        if (!validationResult.valid) {
          throw new Error(validationResult.message || 'Invalid FITS file');
        }

        const fileType = validationResult.actual_type as FileType || activeTab;

        // Upload the file with the type determined from validation
        await uploadRawFrame(
          file,
          projectId,
          fileType,
          (progress) => {
            setUploadStatuses(prev => prev.map(status => 
              status.file === file 
                ? { ...status, progress } 
                : status
            ));
          }
        );

        // Update status to completed
        setUploadStatuses(prev => prev.map(status => 
          status.file === file 
            ? { ...status, status: 'completed', progress: 1 } 
            : status
        ));

        // Update the filesByType state for the correct file type
        setFilesByType(prevFilesByType => {
          const newFilesByType = { ...prevFilesByType };
          const files = newFilesByType[fileType] || [];
          const newFile: StorageFileWithMetadata = {
            name: file.name,
            path: validationResult.file_path || `${userId}/${projectId}/${fileType}/${file.name}`,
            type: fileType,
            created_at: new Date().toISOString(),
            size: file.size,
            metadata: validationResult.metadata
          };
          newFilesByType[fileType] = [...files, newFile];
          return newFilesByType;
        });

        // Switch to the correct tab after successful upload if it's different
        if (fileType !== activeTab) {
          setActiveTab(fileType);
        }

      } catch (error) {
        console.error('Upload error:', error);
        setUploadStatuses(prev => prev.map(status => 
          status.file === file 
            ? { 
                ...status, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed' 
              } 
            : status
        ));
      }
    }

    setIsUploading(false);
    setAbortController(null);
    if (onUploadComplete) onUploadComplete();
  }, [projectId, userId, activeTab, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/fits': ['.fits', '.fit', '.FIT', '.FITS', '.RAW'],
    },
    multiple: true,
  });

  const handleCancelUpload = () => {
    if (abortController) {
      abortController.abort();
      setIsUploading(false);
      setUploadStatuses([]);
      setAbortController(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  async function handlePreview(file: StorageFile) {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewUrl(null);

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
      setPreviewUrl(imageUrl);
      console.log('[FITS Preview] Preview generated successfully');
    } catch (error) {
      console.error('[FITS Preview] Error:', error);
      setPreviewError(error instanceof Error ? error.message : 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }

  function handleDelete(file: StorageFile) {
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

  return (
    <div className="space-y-4">
      {/* File Type Tabs */}
      <div className="flex space-x-2">
        {['light', 'dark', 'bias', 'flat'].map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type as FileType)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} Frames
            <span className="ml-2 text-xs">
              ({filesByType[type as FileType]?.length || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-700 hover:border-gray-600'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-300 mb-2">
          {isDragActive
            ? 'Drop your FITS files here...'
            : 'Drag and drop FITS files here, or click to select files'}
        </p>
        <p className="text-sm text-gray-500">
          Supported formats: .fits, .fit, .FIT, .FITS, .RAW
        </p>
      </div>

      {/* File List for Active Tab */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Frames
          <span className="ml-2 text-sm text-gray-400">
            ({filesByType[activeTab]?.length || 0} files)
          </span>
        </h3>
        <div className="space-y-2">
          {filesByType[activeTab]?.map((file) => (
            <div 
              key={file.path} 
              className="flex items-center p-2 bg-gray-700/50 rounded hover:bg-gray-700/70 group"
            >
              {/* File Name */}
              <span className="text-sm text-gray-300 truncate max-w-xs" title={file.name}>{file.name}</span>
              {/* Upload date */}
              <span className="text-xs text-gray-500 ml-2">
                {new Date(file.created_at).toLocaleDateString()}
              </span>
              {/* Action Icons - right aligned */}
              <div className="flex items-center space-x-2 ml-auto">
                {/* Preview Icon/Button */}
                <button
                  className="text-gray-400 hover:text-blue-400 flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-700 transition"
                  onClick={() => handlePreview(file)}
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
                {/* Info Icon with Tooltip/Popover */}
                <button
                  className="ml-2 text-gray-400 hover:text-blue-400 flex items-center"
                  onClick={() => toggleFileExpansion(file.name)}
                  title="Show metadata"
                >
                  {expandedFiles[file.name] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="ml-1">Metadata</span>
                </button>
                {/* Delete Icon (Trash) */}
                <button
                  className="text-gray-400 hover:text-red-500"
                  onClick={() => handleDelete(file)}
                  title="Delete file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {/* Collapsible metadata section */}
              {expandedFiles[file.name] && (
                <div className="bg-gray-900 p-3 rounded mt-2">
                  {renderMetadataTable(file)}
                </div>
              )}
            </div>
          ))}
          {(!filesByType[activeTab] || filesByType[activeTab].length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">
              No {activeTab} frames uploaded yet
            </p>
          )}
        </div>
      </div>

      {/* Upload Status - only show during active uploads */}
      {isUploading && (
        <div className="mt-4 bg-gray-800/70 rounded-lg p-4 border border-blue-700">
          <h4 className="text-blue-300 text-sm mb-2">Uploading Files...</h4>
          {uploadStatuses.map((status) => (
            <div key={status.file.name} className="mb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-200">
                  {status.file.name} ({status.index} of {status.total})
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
                <p className="text-xs text-red-400 mt-1">{status.error}</p>
              )}
            </div>
          ))}
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
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              onClick={closePreview}
              title="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-white mb-4">Preview</h2>
            <img src={previewUrl} alt="FITS Preview" className="w-full h-auto rounded-md" />
          </div>
        </div>
      )}
      {previewLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg max-w-md">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
            <p className="text-white mt-4 text-center">Generating preview...</p>
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <p className="text-blue-400 text-sm italic text-center">
                {spaceFacts[Math.floor(Math.random() * spaceFacts.length)]}
              </p>
            </div>
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
  );
} 