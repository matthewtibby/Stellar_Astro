import { useState, useCallback } from 'react';
import { MasterType } from '../types/calibration.types';

/**
 * Hook for managing calibration preview state: preview URLs, loading, and errors.
 *
 * @returns {object} Preview state and updaters.
 *   - previewUrls: Map of preview URLs by master type.
 *   - setPreviewUrls: Setter for previewUrls.
 *   - previewLoadings: Map of loading states by master type.
 *   - setPreviewLoadings: Setter for previewLoadings.
 *   - previewUrl: The current preview URL.
 *   - setPreviewUrl: Setter for previewUrl.
 *   - previewLoading: Whether the preview is loading.
 *   - setPreviewLoading: Setter for previewLoading.
 *   - previewError: Any preview error message.
 *   - setPreviewError: Setter for previewError.
 */
export function useCalibrationPreviewState() {
  const [previewUrls, setPreviewUrls] = useState<{ [K in MasterType]?: string | null }>({});
  const [previewLoadings, setPreviewLoadings] = useState<{ [K in MasterType]?: boolean }>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  return {
    previewUrls,
    setPreviewUrls,
    previewLoadings,
    setPreviewLoadings,
    previewUrl,
    setPreviewUrl,
    previewLoading,
    setPreviewLoading,
    previewError,
    setPreviewError,
  };
} 