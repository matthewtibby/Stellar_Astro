/**
 * Fetches and hydrates all projects for a user with related data for dashboard display.
 * Handles errors and missing data gracefully.
 */
import { createClient } from '@supabase/supabase-js';
// import type { HydratedProject } from '@/src/types/dashboard'; // TODO: Create this type or inline

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// TODO: Move to a shared types file if needed
export interface HydratedProject {
  id: string;
  title: string;
  targetName: string;
  status: string;
  thumbnailUrl: string;
  userImageUrl?: string;
  creationDate: string;
  updatedAt: string;
  frameCount: number;
  fileSize: number;
  equipment: { type: string; name: string }[];
  steps: any[];
  tags?: string[];
  isFavorite?: boolean;
  target?: {
    name: string;
    coordinates: { ra: string; dec: string };
    category?: string;
    angularSizeArcmin?: number;
  };
}

/**
 * Returns a hydrated array of projects for the dashboard, with error handling and fallbacks.
 */
export async function getDashboardProjects(userId: string): Promise<HydratedProject[]> {
  const hydrated: HydratedProject[] = [];
  let projects: any[] = [];
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    if (!data) return [];
    projects = data;
  } catch (err) {
    console.error('Failed to fetch projects:', err);
    return [];
  }

  for (const project of projects) {
    let target: HydratedProject['target'] = undefined;
    let targetName = project.title;
    if (project.target) {
      target = project.target;
      targetName = project.target.name || project.title;
    }

    // Aggregate FITS files from Supabase Storage
    let frameCount = 0;
    let fileSize = 0;
    let userImageUrl = undefined;
    try {
      // List files in the storage bucket under 'raw-frames/{project.id}/'
      const { data: files, error } = await supabase.storage.from('raw-frames').list(`${project.id}/`);
      if (error) throw error;
      if (files && Array.isArray(files)) {
        frameCount = files.length;
        fileSize = files.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
        // Optionally, pick a preview image if available
        userImageUrl = files.length > 0 ? supabase.storage.from('raw-frames').getPublicUrl(`${project.id}/${files[0].name}`).data.publicUrl : undefined;
      }
    } catch (err) {
      console.warn(`Failed to fetch storage files for project ${project.id}:`, err);
      // Fallback to fits_files table if storage fails
      let fitsFiles: any[] = [];
      try {
        const { data, error } = await supabase
          .from('fits_files')
          .select('file_size, file_type, file_path, metadata')
          .eq('project_id', project.id);
        if (error) throw error;
        fitsFiles = data || [];
      } catch (err) {
        console.warn(`Failed to fetch fits_files for project ${project.id}:`, err);
        fitsFiles = [];
      }
      frameCount = fitsFiles.length;
      fileSize = fitsFiles.reduce((sum, f) => sum + (f.file_size || 0), 0);
      const final = fitsFiles.find(f => f.file_type === 'final' || f.file_type === 'master');
      userImageUrl = final ? final.file_path : undefined;
    }

    // Steps/status from processing_steps
    let steps: any[] = [];
    let status = 'new';
    try {
      const { data, error } = await supabase
        .from('processing_steps')
        .select('*')
        .eq('project_id', project.id);
      if (error) throw error;
      steps = data || [];
      if (steps.length > 0) {
        const lastStep = steps[steps.length - 1];
        status = lastStep.status || 'in_progress';
      }
    } catch (err) {
      console.warn(`Failed to fetch processing_steps for project ${project.id}:`, err);
      steps = [];
      status = 'new';
    }

    // Equipment (placeholder)
    const equipment: { type: string; name: string }[] = [];
    // Tags (if present)
    const tags = project.tags || [];
    // isFavorite (placeholder)
    const isFavorite = false;

    // Thumbnail: use SkyView if target has coordinates, else fallback
    let thumbnailUrl = '';
    if (target && target.coordinates && target.coordinates.ra && target.coordinates.dec) {
      // Use SkyView utility (client-side), so fallback to userImageUrl or blank here
      thumbnailUrl = userImageUrl || '';
    } else {
      thumbnailUrl = userImageUrl || '';
    }

    hydrated.push({
      id: project.id,
      title: project.title,
      targetName,
      status,
      thumbnailUrl,
      userImageUrl,
      creationDate: project.created_at,
      updatedAt: project.updated_at,
      frameCount,
      fileSize,
      equipment,
      steps,
      tags,
      isFavorite,
      target,
    });
  }
  return hydrated;
} 