import { useState, useEffect } from 'react';
import { MasterType } from '../types/calibration.types';
import { fileOperationsService } from '../../../services/calibration';

export function useFileOperations(userId: string, projectId: string, selectedType: MasterType) {
  const [realFiles, setRealFiles] = useState<string[]>([]);
  const [masterBiasOptions, setMasterBiasOptions] = useState<{ path: string, name: string }[]>([]);
  const [previewUrls, setPreviewUrls] = useState<{ [K in MasterType]?: string | null }>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [masterStats, setMasterStats] = useState<any>(null);

  // Fetch files for the selected type
  useEffect(() => {
    async function fetchFiles() {
      if (!userId) {
        setRealFiles([]);
        return;
      }
      
      const files = await fileOperationsService.fetchFiles(userId, projectId, selectedType);
      setRealFiles(files);
    }
    
    fetchFiles();
  }, [selectedType, projectId, userId]);

  // Fetch all preview URLs
  useEffect(() => {
    async function fetchAllPreviews() {
      const previews = await fileOperationsService.fetchAllPreviews(projectId, userId);
      setPreviewUrls(previews);
    }
    
    fetchAllPreviews();
  }, [projectId, userId]);

  // Fetch master preview for selected type
  useEffect(() => {
    async function fetchPreview() {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewUrl(null);
      
      const result = await fileOperationsService.fetchMasterPreview(userId, projectId, selectedType);
      setPreviewUrl(result.previewUrl);
      setPreviewError(result.previewError);
      setPreviewLoading(false);
    }
    
    fetchPreview();
  }, [selectedType, projectId, userId]);

  // Fetch master stats when preview URL changes
  useEffect(() => {
    async function fetchStats() {
      setMasterStats(null);
      if (!previewUrl) return;
      
      const result = await fileOperationsService.fetchMasterStats(projectId, userId, selectedType);
      setMasterStats(result.masterStats);
      
      if (result.previewUrl) {
        setPreviewUrls(prev => ({ ...prev, [selectedType]: result.previewUrl }));
      }
    }
    
    fetchStats();
  }, [previewUrl, projectId, selectedType, userId]);

  // Fetch FITS metadata for L.A.Cosmic parameters
  const fetchFitsMetadata = async (fileName: string) => {
    if (!realFiles.length) return null;
    return await fileOperationsService.fetchFitsMetadata(userId, projectId, selectedType, fileName);
  };

  // Update master bias options when needed
  const updateMasterBiasOptions = async (biasSubtractionEnabled: boolean) => {
    if (selectedType === 'dark' && biasSubtractionEnabled) {
      const options = await fileOperationsService.fetchMasterBiases(userId, projectId);
      setMasterBiasOptions(options);
    } else {
      setMasterBiasOptions([]);
    }
  };

  return {
    // State
    realFiles,
    setRealFiles,
    masterBiasOptions,
    previewUrls,
    setPreviewUrls,
    previewLoading,
    previewUrl,
    setPreviewUrl,
    previewError,
    masterStats,
    
    // Functions
    fetchFitsMetadata,
    updateMasterBiasOptions,
  };
} 