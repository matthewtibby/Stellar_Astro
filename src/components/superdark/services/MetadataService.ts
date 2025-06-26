import { createBrowserClient } from '../../../lib/supabase';
import { supabaseUrl, supabaseAnonKey } from '../../../lib/supabase';
import { FileMetadata, DarkFileWithMetadata, Project } from '../types/superdark.types';

export class MetadataService {
  /**
   * Get metadata for temp file via Python worker
   */
  static async getTempFileMetadata(tempPath: string, userId: string): Promise<FileMetadata | null> {
    try {
      const response = await fetch('http://localhost:8000/analyze-temp-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempPath,
          userId,
          bucket: 'raw-frames'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze temp file: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze file');
      }

      // Check validation results and add warnings
      if (data.validation) {
        const validation = data.validation;
        
        if (!validation.has_required_metadata) {
          console.warn(`[Temp File] Missing required metadata in ${tempPath}:`, validation.missing_fields);
        }
        
        if (validation.warnings.length > 0) {
          console.warn(`[Temp File] Validation warnings for ${tempPath}:`, validation.warnings);
        }
        
        if (validation.quality_score < 80) {
          console.warn(`[Temp File] Low quality score for ${tempPath}: ${validation.quality_score}/100`);
        }
      }

      return {
        path: data.path,
        type: data.type,
        metadata: data.metadata,
        validation: data.validation, // Include validation results
        file_size_mb: data.file_size_mb,
        image_dimensions: data.image_dimensions
      };
      
    } catch (error) {
      console.error('Error getting temp file metadata:', error);
      return null;
    }
  }

  /**
   * Fetch all dark frames from all projects for a user
   */
  static async fetchAllProjectDarks(
    projects: Project[],
    userId: string
  ): Promise<DarkFileWithMetadata[]> {
    if (!userId || !projects) return [];

    const allDarks: DarkFileWithMetadata[] = [];
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    for (const project of projects) {
      try {
        const storageFiles = await supabase.storage
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
                isTemporary: false
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
}
