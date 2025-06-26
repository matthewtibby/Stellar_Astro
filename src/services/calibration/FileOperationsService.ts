import { createBrowserClient } from '@supabase/ssr';
import { supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { MasterType } from '../../components/calibration/types/calibration.types';

export class FileOperationsService {
  private supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  /**
   * Fetch files from Supabase storage for a specific frame type
   */
  async fetchFiles(userId: string, projectId: string, selectedType: MasterType): Promise<string[]> {
    const folderPath = `${userId}/${projectId}/${selectedType}/`;
    
    if (!userId) {
      return [];
    }

    const { data, error } = await this.supabase.storage.from('raw-frames').list(folderPath);
    
    if (error) {
      console.error('Error fetching files:', error);
      return [];
    }

    return (data || [])
      .filter(f => !f.name.endsWith('/')) // Exclude directories
      .filter(f => f.name.toLowerCase().endsWith('.fit') || f.name.toLowerCase().endsWith('.fits')) // Only FITS files
      .map(f => f.name);
  }

  /**
   * Fetch all preview images for calibration types
   */
  async fetchAllPreviews(projectId: string, userId: string): Promise<{ [K in MasterType]?: string | null }> {
    const types: MasterType[] = ['bias', 'dark', 'flat'];
    const previewUrls: { [K in MasterType]?: string | null } = {};

    await Promise.all(types.map(async (type) => {
      try {
        const res = await fetch(`/api/projects/${projectId}/calibration-jobs/latest-result?userId=${userId}&frameType=${type}`);
        if (res.ok) {
          const data = await res.json();
          previewUrls[type] = data?.result?.preview_url || null;
        } else {
          previewUrls[type] = null;
        }
      } catch {
        previewUrls[type] = null;
      }
    }));

    return previewUrls;
  }

  /**
   * Fetch master preview for a specific frame type
   */
  async fetchMasterPreview(userId: string, projectId: string, selectedType: MasterType): Promise<{
    previewUrl: string | null;
    previewError: string | null;
  }> {
    try {
      // List all files in the master frame folder for the selected type
      const folder = `${userId}/${projectId}/${selectedType}/`;
      const { data: files, error } = await this.supabase.storage.from('calibrated-frames').list(folder);
      
      if (error || !files || files.length === 0) {
        return {
          previewUrl: null,
          previewError: 'No preview found. Run calibration to generate a master frame.'
        };
      }

      // Filter for .png files only
      const pngFiles = files.filter(f => f.name.toLowerCase().endsWith('.png'));
      if (pngFiles.length === 0) {
        return {
          previewUrl: null,
          previewError: 'No preview found. Run calibration to generate a master frame.'
        };
      }

      // Sort by last_modified (descending) and pick the most recent
      pngFiles.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
      const latestPng = pngFiles[0];
      const path = `${folder}${latestPng.name}`;
      
      const { data } = await this.supabase.storage.from('calibrated-frames').getPublicUrl(path);
      
      if (!data?.publicUrl) {
        return {
          previewUrl: null,
          previewError: 'No preview found. Run calibration to generate a master frame.'
        };
      }

      return {
        previewUrl: data.publicUrl,
        previewError: null
      };
    } catch (e) {
      return {
        previewUrl: null,
        previewError: 'Error loading preview.'
      };
    }
  }

  /**
   * Fetch FITS metadata for L.A.Cosmic parameters
   */
  async fetchFitsMetadata(userId: string, projectId: string, selectedType: MasterType, fileName: string) {
    const filePath = `${userId}/${projectId}/${selectedType}/${fileName}`;
    
    const { data, error } = await this.supabase
      .from('fits_metadata')
      .select('metadata')
      .eq('file_path', filePath)
      .single();

    if (!error && data && data.metadata) {
      return data.metadata;
    }
    
    return null;
  }

  /**
   * Fetch master bias frames for dark calibration
   */
  async fetchMasterBiases(userId: string, projectId: string): Promise<{ path: string, name: string }[]> {
    const prefix = `${userId}/${projectId}/bias/`;
    const { data, error } = await this.supabase.storage.from('calibrated-frames').list(prefix);
    
    if (!error && data) {
      // Filter for FITS files only (not PNG duplicates)
      const fits = data.filter((f: any) => 
        (f.name.toLowerCase().endsWith('.fits') || f.name.toLowerCase().endsWith('.fit')) &&
        !f.name.toLowerCase().endsWith('.png')
      );
      return fits.map((f: any) => ({ path: prefix + f.name, name: f.name }));
    }
    
    return [];
  }

  /**
   * Check if superdark preview exists and generate URL
   */
  async checkSuperdarkPreview(selectedSuperdarkPath: string): Promise<string> {
    try {
      const previewPath = `${selectedSuperdarkPath.replace('.fits', '_preview.png').replace('.fit', '_preview.png')}`;
      
      // Check if preview exists by trying to get file info from the specific folder
      const folderPath = previewPath.substring(0, previewPath.lastIndexOf('/'));
      const fileName = previewPath.substring(previewPath.lastIndexOf('/') + 1);
      
      const { data: fileExists, error } = await this.supabase.storage
        .from('superdarks')
        .list(folderPath, { search: fileName });
      
      if (!error && fileExists && fileExists.length > 0) {
        // Preview exists, generate the public URL
        const { data } = this.supabase.storage.from('superdarks').getPublicUrl(previewPath);
        return data.publicUrl;
      }
      
      return '';
    } catch (error) {
      console.error('[Superdark] Error checking preview existence:', error);
      return '';
    }
  }

  /**
   * Analyze superdark statistics
   */
  async analyzeSuperdark(selectedSuperdarkPath: string) {
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
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('[Superdark] Error analyzing superdark:', error);
      return null;
    }
  }

  /**
   * Fetch master frame statistics
   */
  async fetchMasterStats(projectId: string, userId: string, selectedType: MasterType) {
    try {
      const res = await fetch(`/api/projects/${projectId}/calibration-jobs/latest-result?userId=${userId}&frameType=${selectedType}`);
      
      if (res.ok) {
        const data = await res.json();
        return {
          masterStats: data?.result?.master_stats || data?.diagnostics || null,
          previewUrl: data?.result?.preview_url || null
        };
      }
      
      return { masterStats: null, previewUrl: null };
    } catch (e) {
      console.error('[Diagnostics] Error fetching stats:', e);
      return { masterStats: null, previewUrl: null };
    }
  }
} 