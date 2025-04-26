'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { validateFitsFile } from '../utils/fitsValidation';
import { uploadRawFrame } from '../utils/storage';
import { FileType } from '../types/fits';
import { useToast, type ToastType } from '../hooks/useToast';

interface FitsFileUploadProps {
  projectId: string;
  userId: string;
  fileType: FileType;
  onUploadComplete?: () => void;
}

const FitsFileUpload: React.FC<FitsFileUploadProps> = ({
  projectId,
  userId,
  fileType,
  onUploadComplete,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { addToast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    console.log('File selected:', file);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('Starting file validation...');
      // Validate the FITS file
      const validationResult = await validateFitsFile(file, fileType);
      console.log('Validation result:', validationResult);
      
      if (!validationResult.valid) {
        throw new Error(validationResult.message || 'Invalid FITS file');
      }

      console.log('Starting file upload...');
      // Upload the file with progress tracking
      await uploadRawFrame(projectId, fileType, file, (progress: number) => {
        console.log('Upload progress:', progress);
        setUploadProgress(progress);
      });

      console.log('Upload completed successfully');
      addToast('success', 'File uploaded successfully');

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      addToast('error', error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [projectId, userId, fileType, onUploadComplete, addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/fits': ['.fits', '.fit', '.fts', '.raw'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600">
              {isDragActive
                ? 'Drop the FITS file here'
                : 'Drag and drop a FITS file here, or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: .fits, .fit, .fts, .raw
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FitsFileUpload;