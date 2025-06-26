import { createBrowserClient } from '@supabase/ssr';
import { supabaseUrl, supabaseAnonKey } from '../../../lib/supabase';
import { DarkFileWithMetadata, FileMetadata } from '../types/calibration.types';

export class DataFetchingService {
  private supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  /**
   * Fetch all dark frames across multiple projects for a user
   */
  async fetchAllProjectDarks(
    projects: { id: string; title: string }[],
    userId: string
  ): Promise<DarkFileWithMetadata[]> {
    if (!userId || !projects) return [];

    const allDarks: DarkFileWithMetadata[] = [];

    for (const project of projects) {
      try {
        const storageFiles = await this.supabase.storage
          .from('raw-frames')
          .list(`${userId}/${project.id}/dark`);

        if (!storageFiles.data) continue;

        const existingFiles = new Set(storageFiles.data.map((f) => f.name));

        const res = await fetch(
          `http://localhost:8000/list-files?project_id=${project.id}&user_id=${userId}`
        );
        const data = await res.json();

        if (data.files) {
          const darks = data.files
            .filter((f: FileMetadata) => {
              const fileName = f.path.split('/').pop();
              return f.type === 'dark' && existingFiles.has(fileName || '');
            })
            .map(
              (f: FileMetadata): DarkFileWithMetadata => ({
                name: f.path.split('/').pop() || '',
                path: f.path,
                project: project.title,
                projectId: project.id,
                camera: f.metadata?.instrument || f.metadata?.INSTRUME || 'Unknown',
                binning: f.metadata?.binning || `${f.metadata?.XBINNING || 1}x${f.metadata?.YBINNING || 1}`,
                gain: f.metadata?.gain || f.metadata?.GAIN || 'Unknown',
                temp:
                  f.metadata?.temperature !== undefined
                    ? Number(f.metadata.temperature).toFixed(1)
                    : f.metadata?.['CCD-TEMP'] !== undefined
                    ? Number(f.metadata['CCD-TEMP']).toFixed(1)
                    : 'Unknown',
                exposure:
                  f.metadata?.exposure_time !== undefined
                    ? Number(f.metadata.exposure_time).toFixed(1)
                    : f.metadata?.EXPTIME !== undefined
                    ? Number(f.metadata.EXPTIME).toFixed(1)
                    : 'Unknown',
              })
            );
          allDarks.push(...darks);
        }
      } catch (error) {
        console.error(`Error fetching darks for project ${project.id}:`, error);
      }
    }
    return allDarks;
  }

  /**
   * Fetch all preview URLs for frame types
   */
  async fetchAllPreviews(projectId: string, userId: string) {
    const types = ['bias', 'dark', 'flat'] as const;
    const previewUrls: Record<string, string | null> = {};
    
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
   * Fetch files from Supabase storage
   */
  async fetchProjectFiles(userId: string, projectId: string, frameType: string) {
    const folderPath = `${userId}/${projectId}/${frameType}/`;
    
    if (!userId) return [];
    
    const { data, error } = await this.supabase.storage.from('raw-frames').list(folderPath);
    
    if (error) return [];
    
    return (data || [])
      .filter(f => !f.name.endsWith('/')) // Exclude directories
      .filter(f => f.name.toLowerCase().endsWith('.fit') || f.name.toLowerCase().endsWith('.fits')) // Only FITS files
      .map(f => f.name);
  }

  /**
   * Fetch and analyze L.A.Cosmic parameters from FITS metadata
   */
  async fetchLaCosmicParams(userId: string, projectId: string, frameType: string, fileName: string) {
    const filePath = `${userId}/${projectId}/${frameType}/${fileName}`;
    
    const { data, error } = await this.supabase
      .from('fits_metadata')
      .select('metadata')
      .eq('file_path', filePath)
      .single();
    
    if (!error && data && data.metadata) {
      const meta = data.metadata;
      return {
        metadata: meta,
        laCosmicParams: {
          readnoise: meta.readnoise || 6.5,
          gain: meta.gain || 1.0,
          satlevel: meta.satlevel || 65535
        },
        autoPopulated: {
          readnoise: meta.readnoise !== undefined,
          gain: meta.gain !== undefined,
          satlevel: meta.satlevel !== undefined
        }
      };
    }
    
    return null;
  }
}

// Export singleton instance
export const dataFetchingService = new DataFetchingService();
