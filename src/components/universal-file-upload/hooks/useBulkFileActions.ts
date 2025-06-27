import { useState, useCallback, useRef } from 'react';
import type { FileType, StorageFile } from '@/src/types/store';
import type { StorageFileWithMetadata } from '../types/upload.types';

interface UseBulkFileActionsProps {
  handlePreview: (file: StorageFile) => void;
  setSelectedPath: (path: string | null) => void;
  filesByType: Record<FileType, StorageFileWithMetadata[]>;
  activeTab: FileType;
  viewAll: boolean;
}

export function useBulkFileActions({ handlePreview, setSelectedPath, filesByType, activeTab, viewAll }: UseBulkFileActionsProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const fileRowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toggleFileSelection = useCallback((filePath: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    // Implement bulk delete logic here (e.g., call handleDelete for each selected file)
    // For now, just clear selection
    setSelectedFiles(new Set());
  }, []);

  const handleFileListKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>, idx: number, file: StorageFileWithMetadata) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(fileRowRefs.current.length - 1, idx + 1);
      fileRowRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(0, idx - 1);
      fileRowRefs.current[prev]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePreview(file);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      // Optionally implement delete
    }
  }, [handlePreview]);

  return {
    selectedFiles,
    setSelectedFiles,
    handleBulkDelete,
    toggleFileSelection,
    handleFileListKeyDown,
    fileRowRefs,
  };
} 