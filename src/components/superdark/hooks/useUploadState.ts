import { useState } from 'react';
import { UploadProgress, CompatibilityWarnings, DarkFileWithMetadata, UploadStatus } from '../types/superdark.types';
import { FileUploadService, MetadataService, ValidationService } from '../services';
import { validateFitsFile } from '../../../utils/storage';

export const useUploadState = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalToUpload, setTotalToUpload] = useState(0);
  const [compatibilityWarnings, setCompatibilityWarnings] = useState<CompatibilityWarnings>({});

  // Reset upload state
  const resetUploadState = () => {
    setIsUploading(false);
    setUploadProgress({});
    setUploadedCount(0);
    setTotalToUpload(0);
    setCompatibilityWarnings({});
  };

  // Update upload progress for a specific file
  const updateFileProgress = (fileName: string, status: UploadStatus) => {
    setUploadProgress(prev => ({ ...prev, [fileName]: status }));
  };

  // Add compatibility warning for a file
  const addCompatibilityWarning = (fileName: string, warnings: string[]) => {
    setCompatibilityWarnings(prev => ({
      ...prev,
      [fileName]: warnings
    }));
  };

  // Remove compatibility warning for a file
  const removeCompatibilityWarning = (fileName: string) => {
    setCompatibilityWarnings(prev => {
      const updated = { ...prev };
      delete updated[fileName];
      return updated;
    });
  };

  // Handle file upload process
  const handleFileUpload = async (
    files: File[],
    userId: string,
    projectId: string,
    availableDarks: DarkFileWithMetadata[],
    tempFiles: DarkFileWithMetadata[],
    onTempFileAdded: (files: DarkFileWithMetadata[]) => void,
    onWarningAdded: (warning: string) => void
  ) => {
    setIsUploading(true);
    setTotalToUpload(files.length);
    setUploadedCount(0);
    setUploadProgress({});
    setCompatibilityWarnings({});
    
    const newTempFiles: DarkFileWithMetadata[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name;
      
      try {
        // Update progress: validating
        updateFileProgress(fileName, 'validating');
        
        // Validate FITS file
        const validation = await validateFitsFile(file, projectId, userId);
        if (!validation.valid) {
          throw new Error(validation.message || 'Invalid FITS file');
        }
        
        // Update progress: uploading
        updateFileProgress(fileName, 'uploading');
        
        // Upload to temp storage using service
        const tempPath = await FileUploadService.uploadToTempStorage(file, userId);
        
        // Get metadata using service
        const metadata = await MetadataService.getTempFileMetadata(tempPath, userId);
        
        if (!metadata) {
          throw new Error('Failed to analyze uploaded file');
        }
        
        // Create temp file object
        const tempFile: DarkFileWithMetadata = {
          name: fileName,
          path: tempPath,
          project: 'Uploaded',
          projectId: 'temp',
          camera: metadata.metadata?.instrument || metadata.metadata?.INSTRUME || 'Unknown',
          binning: metadata.metadata?.binning || `${metadata.metadata?.XBINNING || 1}x${metadata.metadata?.YBINNING || 1}`,
          gain: metadata.metadata?.gain || metadata.metadata?.GAIN || 'Unknown',
          temp: metadata.metadata?.temperature !== undefined
            ? Number(metadata.metadata.temperature).toFixed(1)
            : metadata.metadata?.['CCD-TEMP'] !== undefined
            ? Number(metadata.metadata['CCD-TEMP']).toFixed(1)
            : 'Unknown',
          exposure: metadata.metadata?.exposure_time !== undefined
            ? Number(metadata.metadata.exposure_time).toFixed(1)
            : metadata.metadata?.EXPTIME !== undefined
            ? Number(metadata.metadata.EXPTIME).toFixed(1)
            : 'Unknown',
          isTemporary: true
        };
        
        // Validate compatibility using service
        const compatibilityResult = ValidationService.validateFrameCompatibility(
          tempFile, 
          [...availableDarks, ...tempFiles, ...newTempFiles]
        );
        
        if (compatibilityResult.warnings.length > 0) {
          addCompatibilityWarning(fileName, compatibilityResult.warnings);
          updateFileProgress(fileName, 'warning');
        } else {
          updateFileProgress(fileName, 'complete');
        }
        
        newTempFiles.push(tempFile);
        setUploadedCount(prev => prev + 1);
        
      } catch (error) {
        console.error(`Upload failed for ${fileName}:`, error);
        updateFileProgress(fileName, 'error');
        onWarningAdded(`Failed to upload ${fileName}: ${error}`);
      }
    }
    
    // Add all successfully uploaded files
    onTempFileAdded(newTempFiles);
    setIsUploading(false);
  };

  return {
    isUploading,
    uploadProgress,
    uploadedCount,
    totalToUpload,
    compatibilityWarnings,
    resetUploadState,
    updateFileProgress,
    addCompatibilityWarning,
    removeCompatibilityWarning,
    handleFileUpload
  };
}; 