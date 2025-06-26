import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { supabaseUrl, supabaseAnonKey } from '../../../lib/supabase';
import { MasterType } from '../types/calibration.types';
import { dataFetchingService } from '../services/DataFetchingService';

interface UseDataEffectsProps {
  selectedSuperdarkPath?: string;
  projectId: string;
  userId: string;
  selectedType: MasterType;
  realFiles: string[];
  setSuperdarkPreviewUrl: (url: string) => void;
  setSuperdarkStats: (stats: any) => void;
  setSuperdarkStatsLoading: (loading: boolean) => void;
  setPreviewUrls: (urls: any) => void;
  setRealFiles: (files: string[]) => void;
  setLaCosmicParams: (params: any) => void;
  setAutoPopulated: (auto: any) => void;
  setLastAutoPopulated: (auto: any) => void;
  setLastMeta: (meta: any) => void;
}

export const useDataEffects = ({
  selectedSuperdarkPath,
  projectId,
  userId,
  selectedType,
  realFiles,
  setSuperdarkPreviewUrl,
  setSuperdarkStats,
  setSuperdarkStatsLoading,
  setPreviewUrls,
  setRealFiles,
  setLaCosmicParams,
  setAutoPopulated,
  setLastAutoPopulated,
  setLastMeta,
}: UseDataEffectsProps) => {
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  // Superdark analysis effect
  useEffect(() => {
    if (!selectedSuperdarkPath) {
      setSuperdarkPreviewUrl('');
      setSuperdarkStats(null);
      setSuperdarkStatsLoading(false);
      return;
    }

    const checkPreviewExists = async () => {
      try {
        const previewPath = selectedSuperdarkPath.replace('.fits', '_preview.png').replace('.fit', '_preview.png');
        const folderPath = previewPath.substring(0, previewPath.lastIndexOf('/'));
        const fileName = previewPath.substring(previewPath.lastIndexOf('/') + 1);
        
        const { data: fileExists, error } = await supabase.storage
          .from('superdarks')
          .list(folderPath, { search: fileName });
        
        if (!error && fileExists && fileExists.length > 0) {
          const { data } = supabase.storage.from('superdarks').getPublicUrl(previewPath);
          setSuperdarkPreviewUrl(data.publicUrl);
        } else {
          setSuperdarkPreviewUrl('');
        }
      } catch (error) {
        console.error('[Superdark] Error checking preview existence:', error);
        setSuperdarkPreviewUrl('');
      }
    };
    
    const analyzeSuperdark = async () => {
      setSuperdarkStatsLoading(true);
      setSuperdarkStats(null);
      try {
        const response = await fetch('http://localhost:8000/analyze-superdark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            superdark_path: selectedSuperdarkPath,
            bucket: 'superdarks'
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setSuperdarkStats(data);
        } else {
          setSuperdarkStats(null);
        }
      } catch (error) {
        console.error('[Superdark] Error analyzing superdark:', error);
        setSuperdarkStats(null);
      } finally {
        setSuperdarkStatsLoading(false);
      }
    };
    
    checkPreviewExists();
    analyzeSuperdark();
  }, [selectedSuperdarkPath]);

  // Fetch all previews effect
  useEffect(() => {
    dataFetchingService.fetchAllPreviews(projectId, userId).then(setPreviewUrls);
  }, [projectId, userId]);

  // User ID validation effect
  useEffect(() => {
    if (!userId) {
      console.warn('CalibrationScaffoldUI: userId is undefined! The parent component must pass a valid userId prop.');
    }
  }, [userId]);

  // Fetch real files effect
  useEffect(() => {
    dataFetchingService.fetchProjectFiles(userId, projectId, selectedType).then(setRealFiles);
  }, [selectedType, projectId, userId]);

  // L.A.Cosmic params auto-population effect
  useEffect(() => {
    if (selectedType !== 'bias' || !realFiles.length) return;
    
    dataFetchingService.fetchLaCosmicParams(userId, projectId, selectedType, realFiles[0])
      .then(result => {
        if (result) {
          const { metadata, laCosmicParams, autoPopulated } = result;
          setLastMeta(metadata);
          setLaCosmicParams(laCosmicParams);
          setAutoPopulated(autoPopulated);
          setLastAutoPopulated({
            readnoise: metadata.readnoise,
            gain: metadata.gain,
            satlevel: metadata.satlevel,
          });
        }
      });
  }, [realFiles, selectedType, projectId, userId]);
};
