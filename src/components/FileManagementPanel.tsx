'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getFilesByType, type StorageFile, validateFitsFile, uploadRawFrame } from '@/src/utils/storage';
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

      {uploadError && (
        <div className="p-4 bg-red-900/50 text-red-200 border-b border-red-800">
          <div className="flex items-start space-x-2">
            <AlertCircle className="text-red-500 mt-1" size={16} />
            <div className="text-sm whitespace-pre-line">{uploadError}</div>
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`p-6 border-b border-gray-700 transition-colors ${
          isDragActive ? 'bg-blue-600/20 border border-blue-500' : 'bg-gray-800/30'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-400">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag & drop files here, or click to select files'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: .fits, .fit, .FIT, .FITS, .RAW
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="p-4 border-b border-gray-700">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400">Selected Files</h4>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-800/50 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{file.name}</span>
                </div>
                <button
                  onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                  className="p-1 hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Selected Files'}
            </button>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="p-4 border-b border-gray-700">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{currentFile}</span>
              <span className="text-gray-400">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        {/* Tabs sidebar */}
        <div className="w-full md:w-48 border-r border-gray-700 bg-gray-800/30">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search files..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            {Object.entries(fileTypeLabels).map(([type, label]) => (
              <button
                key={type}
                className={`w-full flex items-center space-x-2 px-4 py-3 text-left transition-colors ${
                  activeTab === type 
                    ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500' 
                    : 'text-gray-400 hover:bg-gray-800/50'
                }`}
                onClick={() => setActiveTab(type as FileType)}
              >
                {fileTypeIcons[type as FileType]}
                <span className="text-sm">{label}</span>
                <span className="ml-auto bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                  {filesByType[type as FileType].length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* File list */}
        <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-300px)]">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">
              {error}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p className="text-lg font-medium">No files found</p>
              <p className="text-sm">Upload files to see them here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between bg-black/30 p-3 rounded-md hover:bg-black/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-sm text-gray-400">
                        {formatFileSize(file.size)} • {formatDate(file.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onFileSelect?.(file)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="View file"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {/* TODO: Implement download */}}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Download file"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {/* TODO: Implement delete */}}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 