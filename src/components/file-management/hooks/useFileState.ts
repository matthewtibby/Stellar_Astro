import { useState, useCallback, useEffect } from 'react';
import { FilesByType } from '../types';
import { FileOperationsService } from '../services';

/**
 * Custom hook for managing file state and loading
 * Handles file loading, refresh, and loading states
 */
export const useFileState = (projectId: string) => {
  const [filesByType, setFilesByType] = useState<FilesByType>({} as FilesByType);
  const [loading, setLoading] = useState(false);
  const [hasLoadedFiles, setHasLoadedFiles] = useState(false);

  const loadFiles = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const files = await FileOperationsService.loadFiles(projectId);
      setFilesByType(files);
      setHasLoadedFiles(true);
    } catch (err) {
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const refreshFiles = useCallback(async (onRefresh?: () => void) => {
    try {
      const files = await FileOperationsService.refreshFiles(projectId, onRefresh);
      setFilesByType(files);
    } catch (err) {
      console.error('Error refreshing files:', err);
    }
  }, [projectId]);

  // Load files when projectId changes
  useEffect(() => {
    if (projectId) {
      loadFiles();
    }
  }, [projectId, loadFiles]);

  return {
    filesByType,
    loading,
    hasLoadedFiles,
    loadFiles,
    refreshFiles,
    setFilesByType
  };
}; 