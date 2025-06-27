import { useState, useCallback, useEffect, useRef } from 'react';
import { getFitsFileUrl, getFitsPreviewUrl } from '@/src/utils/storage';
import type { FileType, StorageFile } from '@/src/types/store';
import type { StorageFileWithMetadata } from '../types/upload.types';

interface UsePreviewStateProps {
  filesByType: Record<FileType, StorageFileWithMetadata[]>;
  activeTab: FileType;
  viewAll: boolean;
  onPreviewFile?: (file: StorageFile, url: string, isBlob: boolean, meta?: any) => void;
}

export function usePreviewState({ filesByType, activeTab, viewAll, onPreviewFile }: UsePreviewStateProps) {
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewCache = useRef<Record<string, string>>({});
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Prefetch preview images for the first 3 files in the current tab or all
  useEffect(() => {
    let filesToPrefetch: StorageFileWithMetadata[] = [];
    if (viewAll) {
      filesToPrefetch = Object.values(filesByType).flat().slice(0, 3);
    } else {
      filesToPrefetch = filesByType[activeTab]?.slice(0, 3) || [];
    }
    filesToPrefetch.forEach(async (file) => {
      if (!previewCache.current[file.path]) {
        try {
          const fileUrl = await getFitsFileUrl(file.path);
          const previewResponse = await fetch('http://localhost:8000/preview-fits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: fileUrl }),
          });
          if (previewResponse.ok) {
            const imageBlob = await previewResponse.blob();
            previewCache.current[file.path] = URL.createObjectURL(imageBlob);
          }
        } catch { }
      }
    });
    // Cleanup: revokeObjectURL on unmount
    return () => {
      Object.values(previewCache.current).forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) { /* ignore */ }
      });
      previewCache.current = {};
    };
  }, [filesByType, activeTab, viewAll]);

  // ESC and overlay click to close preview (for both loading and loaded)
  useEffect(() => {
    if (!(previewBlob || previewLoading)) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePreview();
        setPreviewError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewBlob, previewLoading]);

  // Use cache if available in handlePreview
  const handlePreview = useCallback(async (file: StorageFile) => {
    setSelectedPath(file.path);
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewBlob(null);
      // Use cache if available (cache preview URL)
      if (previewCache.current[file.path]) {
        setPreviewUrl(previewCache.current[file.path]);
        setPreviewLoading(false);
        if (onPreviewFile) {
          onPreviewFile(file, previewCache.current[file.path], false, undefined);
        }
        return;
      }
      // Get the PNG preview URL from storage
      const previewUrl = await getFitsPreviewUrl(file.path);
      previewCache.current[file.path] = previewUrl;
      setPreviewUrl(previewUrl);
      if (onPreviewFile) {
        onPreviewFile(file, previewUrl, false, undefined);
      }
      setPreviewLoading(false);
    } catch (error) {
      setPreviewError('Preview not available yet. Please wait a moment.');
      setPreviewLoading(false);
    }
  }, [onPreviewFile]);

  // closePreview definition
  const closePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewBlob(null);
    }
  }, [previewUrl]);

  // Set previewUrl from previewBlob
  useEffect(() => {
    if (previewBlob) {
      const url = URL.createObjectURL(previewBlob);
      setPreviewUrl(url);
      if (onPreviewFile && selectedPath) {
        // Find the file object for selectedPath
        const allFiles = Object.values(filesByType).flat();
        const fileObj = allFiles.find(f => f.path === selectedPath);
        if (fileObj) {
          onPreviewFile(fileObj, url, false, undefined);
        }
      }
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [previewBlob, onPreviewFile, selectedPath, filesByType]);

  return {
    previewBlob,
    setPreviewBlob,
    previewLoading,
    setPreviewLoading,
    previewError,
    setPreviewError,
    selectedPath,
    setSelectedPath,
    previewUrl,
    setPreviewUrl,
    previewCache,
    handlePreview,
    closePreview,
  };
} 