import { useState, useCallback, useEffect } from 'react';
import { getFilesByType } from '@/src/utils/storage';
import type { FileType } from '@/src/types/store';
import type { StorageFileWithMetadata } from '../types/upload.types';

interface UseFileListStateProps {
  projectId: string;
  onValidationError?: (error: string) => void;
}

export function useFileListState({ projectId, onValidationError }: UseFileListStateProps) {
  const [filesByType, setFilesByType] = useState<Record<FileType, StorageFileWithMetadata[]>>({
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
  const [filesLoading, setFilesLoading] = useState(true);

  // Save files to localStorage
  const saveFilesToLocalStorage = useCallback((files: Record<FileType, StorageFileWithMetadata[]>) => {
    try {
      localStorage.setItem(`files_${projectId}`, JSON.stringify(files));
    } catch (error) {
      console.error('Error saving files to localStorage:', error);
    }
  }, [projectId]);

  // Load files from localStorage
  const loadFilesFromLocalStorage = useCallback(() => {
    try {
      const savedFiles = localStorage.getItem(`files_${projectId}`);
      if (savedFiles) {
        const parsedFiles = JSON.parse(savedFiles);
        setFilesByType(parsedFiles);
        return parsedFiles;
      }
    } catch (error) {
      console.error('Error loading files from localStorage:', error);
    }
    return null;
  }, [projectId]);

  // Load files on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        // Try to load from localStorage first
        const savedFiles = loadFilesFromLocalStorage();
        // Fetch from server for latest state
        const serverFiles = await getFilesByType(projectId);
        // Merge, prioritizing server files
        const mergedFiles = { ...savedFiles, ...serverFiles };
        setFilesByType(mergedFiles);
        saveFilesToLocalStorage(mergedFiles);
      } catch (error) {
        console.error('Error loading files:', error);
        onValidationError?.(error instanceof Error ? error.message : 'Failed to load files');
      } finally {
        setFilesLoading(false);
      }
    };
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, onValidationError, loadFilesFromLocalStorage, saveFilesToLocalStorage]);

  // Save files to localStorage whenever they change
  useEffect(() => {
    saveFilesToLocalStorage(filesByType);
  }, [filesByType, saveFilesToLocalStorage]);

  return {
    filesByType,
    setFilesByType,
    filesLoading,
  };
} 