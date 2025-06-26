import { useCallback } from 'react';
import { StorageFile } from '../types';
import { FileOperationsService } from '../services';

/**
 * Custom hook for managing file operations
 * Handles download, delete operations with error handling
 */
export const useFileOperations = (
  loadFiles: () => Promise<void>,
  onRefresh?: () => void
) => {
  const handleDownload = useCallback(async (file: StorageFile) => {
    try {
      await FileOperationsService.downloadFile(file);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, []);

  const handleDeleteFile = useCallback(async (file: StorageFile) => {
    try {
      await FileOperationsService.deleteFile(file);
      await loadFiles();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, [loadFiles, onRefresh]);

  return {
    handleDownload,
    handleDeleteFile
  };
}; 