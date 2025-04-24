'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getFilesByType, type StorageFile, validateFitsFile, uploadRawFrame, getFitsFileUrl } from '@/src/utils/storage';
import { File, Trash2, Download, Eye, RefreshCw, FolderOpen, Upload, AlertCircle } from 'lucide-react';
import { type FileType } from '@/src/types/store';
import { useDropzone } from 'react-dropzone';

interface FileManagementPanelProps {
  projectId: string;
  onFileSelect?: (file: StorageFile) => void;
  onRefresh?: () => void;
  onValidationError?: (error: string) => void;
}

export function FileManagementPanel({ 
  projectId, 
  onFileSelect,
  onRefresh,
  onValidationError
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
    setUploadError(null);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of acceptedFiles) {
      try {
        const validationResult = await validateFitsFile(file, activeTab);
        if (!validationResult.valid) {
          errors.push(`${file.name}: ${validationResult.message}`);
        } else {
          validFiles.push(file);
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

    setSelectedFiles(validFiles);
  }, [activeTab, onValidationError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/fits': ['.fits', '.fit', '.FIT', '.FITS', '.RAW'],
    },
    multiple: true,
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    for (const file of selectedFiles) {
      setCurrentFile(file.name);
      try {
        await uploadRawFrame(projectId, activeTab, file, (progress) => {
          setUploadProgress(progress * 100);
        });
        loadFiles(); // Refresh the file list
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setUploadError(errorMessage);
        onValidationError?.(errorMessage);
        break;
      }
    }

    setIsUploading(false);
    setSelectedFiles([]);
    setUploadProgress(0);
    setCurrentFile('');
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

  return (
    <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">File Management</h3>
        <button 
          onClick={handleRefresh}
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
          title="Refresh files"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {loading && (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading files...</p>
        </div>
      )}

      {!loading && error && (
        <div className="p-4 bg-red-900/50 text-red-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="text-red-500 mt-1" size={16} />
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="flex">
          {/* Left column with file types */}
          <div className="w-64 border-r border-gray-700 p-4">
            <div className="space-y-2">
              {Object.entries(fileTypeLabels).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type as FileType)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {label}
                  <span className="ml-auto text-xs">
                    ({filesByType[type as FileType]?.length || 0})
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
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-800/70 transition-colors"
                >
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 