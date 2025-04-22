'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle, File, Trash2 } from 'lucide-react';
import { uploadRawFrame } from '@/src/utils/storage';
import { FileType } from '@/src/types/store';

interface FitsFileUploadProps {
  projectId: string;
  fileType: FileType;
  onUploadComplete: (filePaths: string[]) => void;
  onError: (error: string) => void;
  maxFileSize?: number; // in bytes
}

interface FileWithPreview extends File {
  preview?: string;
  error?: string;
}

const FitsFileUpload: React.FC<FitsFileUploadProps> = ({
  projectId,
  fileType,
  onUploadComplete,
  onError,
  maxFileSize = 100 * 1024 * 1024, // 100MB default
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [currentFile, setCurrentFile] = useState<string>('');
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string>('');
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);
  const uploadStartTime = useRef<number>(0);
  const totalFiles = useRef<number>(0);
  const uploadedFiles = useRef<number>(0);

  // Check if Supabase is ready
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase configuration is missing');
        }

        // Simple health check to Supabase REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey
          }
        });

        if (!response.ok) {
          throw new Error('Supabase service is not responding');
        }

        setIsSupabaseReady(true);
        setError('');
      } catch (err) {
        console.error('Supabase check failed:', err);
        setIsSupabaseReady(false);
        const errorMessage = 'Storage service is currently unavailable. Please try again later.';
        setError(errorMessage);
        onError(errorMessage);
      }
    };

    checkSupabase();
  }, [onError]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)} limit`;
    }
    return null;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError('');
    
    if (!isSupabaseReady) {
      setError('Storage service is currently unavailable. Please try again later.');
      return;
    }
    
    const validFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    acceptedFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    setFiles(validFiles);
  }, [maxFileSize, isSupabaseReady]);

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    if (!isSupabaseReady) {
      setError('Storage service is currently unavailable. Please try again later.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    uploadStartTime.current = Date.now();
    totalFiles.current = files.length;
    uploadedFiles.current = 0;

    const filePaths: string[] = [];
    let hasError = false;

    for (const file of files) {
      try {
        setCurrentFile(file.name);
        
        // Create a progress callback for this file
        const onFileProgress = (progress: number) => {
          // Calculate overall progress including this file
          const fileProgress = progress / totalFiles.current;
          const previousFilesProgress = uploadedFiles.current / totalFiles.current;
          const totalProgress = previousFilesProgress + fileProgress;
          
          setUploadProgress(totalProgress * 100);
          
          // Update estimated time
          const elapsedTime = Date.now() - uploadStartTime.current;
          const estimatedTotalTime = elapsedTime / (totalProgress);
          const remainingTime = estimatedTotalTime - elapsedTime;
          
          if (remainingTime > 0) {
            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            setEstimatedTime(`${minutes}m ${seconds}s`);
          }
        };
        
        const filePath = await uploadRawFrame(projectId, fileType, file, onFileProgress);
        
        uploadedFiles.current++;
        const totalProgress = (uploadedFiles.current / totalFiles.current) * 100;
        setUploadProgress(totalProgress);

        const elapsedTime = Date.now() - uploadStartTime.current;
        const estimatedTotalTime = elapsedTime / (uploadedFiles.current / totalFiles.current);
        const remainingTime = estimatedTotalTime - elapsedTime;
        
        if (remainingTime > 0) {
          const minutes = Math.floor(remainingTime / 60000);
          const seconds = Math.floor((remainingTime % 60000) / 1000);
          setEstimatedTime(`${minutes}m ${seconds}s`);
        }

        filePaths.push(filePath);
      } catch (error) {
        hasError = true;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onError(`Failed to upload ${file.name}: ${errorMessage}`);
        setError(`Failed to upload ${file.name}: ${errorMessage}`);
      }
    }

    setIsUploading(false);
    setCurrentFile('');
    setUploadProgress(0);
    setEstimatedTime('');
    setFiles([]);

    if (!hasError && filePaths.length > 0) {
      onUploadComplete(filePaths);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/fits': ['.fits', '.fit', '.FIT', '.FITS', '.RAW'],
    },
    multiple: true,
    disabled: !isSupabaseReady,
  });

  return (
    <div className="w-full space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${!isSupabaseReady ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag & drop files here, or click to select files'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: .fits, .fit, .FIT, .FITS, .RAW
          </p>
          {!isSupabaseReady && (
            <p className="text-xs text-red-500 mt-2">
              Storage service is currently unavailable. Please try again later.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="text-red-500 mt-1" size={16} />
            <div className="text-sm text-red-500 whitespace-pre-line">{error}</div>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400">Selected Files</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <File size={16} className="text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-300">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Trash2 size={16} className="text-gray-500 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={isUploading || !isSupabaseReady}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      )}

      {isUploading && (
        <div className="space-y-3 mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-gray-300">{currentFile}</span>
            </div>
            <span className="text-gray-400">{estimatedTime} remaining</span>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ 
                  width: `${uploadProgress}%`,
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">
                {uploadedFiles.current} of {totalFiles.current} files
              </span>
              <span className="text-gray-400 font-medium">
                {Math.round(uploadProgress)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FitsFileUpload;