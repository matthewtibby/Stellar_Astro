import { useState } from 'react';
import { DarkFileWithMetadata } from '../types/superdark.types';
import { FileUploadService, JobService } from '../services';

export const useModalOperations = () => {
  const [isCreatingSuperdark, setIsCreatingSuperdark] = useState(false);

  // Submit superdark creation job
  const submitSuperdarkJob = async (
    payload: {
      name: string;
      selectedDarkPaths: string[];
      stackingMethod: string;
      sigmaThreshold: string;
      userId: string;
      tempFiles: string[];
    },
    projectId: string,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    setIsCreatingSuperdark(true);
    try {
      if (!payload.userId) throw new Error('User not authenticated');
      if (!payload.name.trim()) throw new Error('Superdark name is required');
      if (payload.selectedDarkPaths.length === 0) throw new Error('No dark frames selected');

      // Submit job using service
      const result = await JobService.submitSuperdarkJob(payload, projectId);
      
      alert(`Superdark "${payload.name}" creation started successfully! Job ID: ${result.jobId}\nEstimated time: ${result.estimatedTime}`);
      
      onSuccess();
      
    } catch (e) {
      const err = e as Error;
      console.error('[DEBUG] Superdark creation error:', err);
      onError(err.message || 'Failed to create Superdark');
    } finally {
      setIsCreatingSuperdark(false);
    }
  };

  // Clean up temporary files
  const cleanupTempFiles = async (tempFiles: DarkFileWithMetadata[], userId: string) => {
    if (!userId || tempFiles.length === 0) return;
    
    try {
      await FileUploadService.cleanupTempFiles(tempFiles, userId);
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  };

  // Delete a specific temporary file
  const deleteTempFile = async (
    tempFile: DarkFileWithMetadata,
    userId: string,
    onSuccess: (tempFile: DarkFileWithMetadata) => void,
    onError: (error: string) => void
  ) => {
    if (!userId) return;
    
    try {
      await FileUploadService.deleteTempFile(tempFile, userId);
      onSuccess(tempFile);
    } catch (error) {
      console.error(`Failed to delete temp file ${tempFile.path}:`, error);
      onError(`Failed to delete ${tempFile.name}: ${error}`);
    }
  };

  // Handle modal close with cleanup
  const handleModalClose = async (
    tempFiles: DarkFileWithMetadata[],
    userId: string,
    setShowModal: (show: boolean) => void,
    resetForm: () => void,
    resetSelection: () => void
  ) => {
    await cleanupTempFiles(tempFiles, userId);
    setShowModal(false);
    resetForm();
    resetSelection();
  };

  return {
    isCreatingSuperdark,
    submitSuperdarkJob,
    cleanupTempFiles,
    deleteTempFile,
    handleModalClose
  };
}; 