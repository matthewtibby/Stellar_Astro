import { useState, useEffect } from 'react';
import { StorageFile, PreviewCache } from '../types';
import { PreviewService } from '../services';

/**
 * Custom hook for managing preview state and operations
 * Handles preview generation, caching, loading states, and cleanup
 */
export const usePreviewState = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewCache, setPreviewCache] = useState<PreviewCache>({});

  const handlePreview = async (file: StorageFile) => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewUrl(null);

      const imageUrl = await PreviewService.getPreviewUrl(file, previewCache);
      setPreviewCache(prev => PreviewService.updateCache(prev, file.path, imageUrl));
      setPreviewUrl(imageUrl);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    PreviewService.cleanupPreview(previewUrl);
    setPreviewUrl(null);
  };

  const clearPreviewError = () => {
    setPreviewError(null);
  };

  // Cleanup all preview URLs on unmount
  useEffect(() => {
    return () => {
      PreviewService.cleanupAllPreviews(previewCache);
    };
  }, [previewCache]);

  return {
    previewUrl,
    previewLoading,
    previewError,
    previewCache,
    handlePreview,
    closePreview,
    clearPreviewError
  };
}; 