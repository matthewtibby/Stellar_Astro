import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { validateFitsFile, uploadRawFrame, type FitsValidationResult, getFilesByType, type StorageFile, getFitsFileUrl } from '@/src/utils/storage';
import { File, AlertCircle, Info, Upload, X, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { type FileType } from '@/src/types/store';

type StorageFileWithMetadata = StorageFile & { metadata?: any };

interface UniversalFileUploadProps {
  projectId: string;
  onUploadComplete?: () => void;
  onValidationError?: (error: string) => void;
}

interface UploadStatus {
  file: File;
  type: FileType;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  metadata?: FitsValidationResult['metadata'];
  warnings: string[];
}

export function UniversalFileUpload({ 
  projectId, 
  onUploadComplete,
  onValidationError 
}: UniversalFileUploadProps) {
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [moveNotification, setMoveNotification] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [activeTab, setActiveTab] = useState<FileType>('light');
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
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  // Load files when component mounts or active tab changes
  useEffect(() => {
    const loadFiles = async () => {
      try {
        console.log('Loading files for project:', projectId);
        const files = await getFilesByType(projectId);
        console.log('Raw files from getFilesByType:', files);

        // Ensure files are properly sorted by their type
        const sortedFiles: Record<FileType, StorageFile[]> = {
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
        };

        // Sort files into their respective types
        Object.entries(files).forEach(([type, fileList]) => {
          console.log(`Processing files for type: ${type}`, fileList);
          if (type in sortedFiles) {
            sortedFiles[type as FileType] = fileList;
            console.log(`Added ${fileList.length} files to ${type} folder`);
          } else {
            console.warn(`Unknown file type: ${type}`);
          }
        });

        console.log('Final sorted files:', sortedFiles);
        setFilesByType(sortedFiles);
      } catch (error) {
        console.error('Error loading files:', error);
      }
    };
    loadFiles();
  }, [projectId, activeTab]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    console.log('Starting upload for files:', acceptedFiles.map(f => f.name));

    // Create a new AbortController for this upload
    const controller = new AbortController();
    setAbortController(controller);
    setIsUploading(true);

    const newUploadStatuses: UploadStatus[] = [];

    for (const file of acceptedFiles) {
      try {
        console.log('Validating file:', file.name);
        // Validate the FITS file
        const validationResult = await validateFitsFile(file);
        console.log('Validation result:', validationResult);
        
        if (!validationResult.valid) {
          console.log('File validation failed:', validationResult.message);
          newUploadStatuses.push({
            file,
            type: 'light', // Default type
            progress: 0,
            status: 'error',
            error: validationResult.message,
            warnings: validationResult.warnings || []
          });
          continue;
        }

        // Determine the file type from validation result only
        const fileType = validationResult.actual_type as FileType || 'light';
        console.log('Determined file type:', fileType);
        
        newUploadStatuses.push({
          file,
          type: fileType,
          progress: 0,
          status: 'uploading',
          metadata: validationResult.metadata,
          warnings: validationResult.warnings || []
        });

        // Update the upload statuses immediately
        setUploadStatuses(newUploadStatuses);

        console.log('Uploading file to path:', `${projectId}/${fileType}/${file.name}`);
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

        console.log('Reloading files after upload');
        // Reload files after successful upload
        const updatedFiles = await getFilesByType(projectId);
        console.log('Updated files after upload:', updatedFiles);
        setFilesByType(prevFilesByType => {
          const newFilesByType = { ...updatedFiles };
          uploadStatuses.forEach(status => {
            if (status.metadata) {
              const files = newFilesByType[status.type] || [];
              // Match by name for robustness
              const idx = files.findIndex(f => f.name === status.file.name);
              if (idx !== -1) {
                console.log('Attaching metadata to:', files[idx].name, status.metadata);
                files[idx] = { ...files[idx], metadata: status.metadata } as StorageFileWithMetadata;
              } else {
                console.log('No match found for:', status.file.name);
              }
            }
          });
          return newFilesByType;
        });

        // Switch to the correct tab after successful upload
        // This is just for UI navigation, not affecting the file type
        if (fileType !== activeTab) {
          console.log('Switching to tab:', fileType);
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

  }, [projectId, onUploadComplete, activeTab]);

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

      // Send the URL to your preview endpoint
      const previewResponse = await fetch('http://localhost:8000/preview-fits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileUrl),
      });

      if (!previewResponse.ok) {
        const errorText = await previewResponse.text();
        throw new Error(`Failed to generate preview: ${errorText}`);
      }

      // Get the image blob and create a URL
      const imageBlob = await previewResponse.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      setPreviewUrl(imageUrl);
    } catch (error) {
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
          <h4 className="text-blue-300 text-sm mb-2">Uploading...</h4>
          {uploadStatuses.map((status) => (
            <div key={status.file.name} className="mb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-200">{status.file.name}</span>
                <span className="text-xs text-gray-400">{Math.round((status.progress || 0) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded h-2 mt-1">
                <div
                  className="bg-blue-500 h-2 rounded"
                  style={{ width: `${Math.round((status.progress || 0) * 100)}%` }}
                />
              </div>
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
          <div className="bg-gray-900 p-8 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
            <p className="text-white mt-4">Generating preview...</p>
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