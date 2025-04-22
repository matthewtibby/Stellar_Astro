'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { uploadRawFrame } from '@/src/utils/storage';
import { FileType } from '@/src/types/store';

interface FitsFileUploadProps {
  projectId: string;
  fileType: FileType;
  onUploadComplete: (filePath: string) => void;
  onError: (error: string) => void;
}

export default function FitsFileUpload({
  projectId,
  fileType,
  onUploadComplete,
  onError,
}: FitsFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.name.toLowerCase().endsWith('.fits') && !file.name.toLowerCase().endsWith('.fit')) {
      onError('Please upload a valid FITS file (.fits or .fit)');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const filePath = await uploadRawFrame(projectId, fileType, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      onUploadComplete(filePath);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [projectId, fileType, onUploadComplete, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/fits': ['.fits', '.fit'],
    },
    maxFiles: 1,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? 'Drop the FITS file here' : 'Drag & drop a FITS file here'}
            </p>
            <p className="text-sm text-gray-500">or click to select a file</p>
            <p className="text-xs text-gray-400">Only .fits and .fit files are accepted</p>
          </div>
        )}
      </div>
    </div>
  );
} 