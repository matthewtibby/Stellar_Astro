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
    fitsMetadata?: any;
  };
}

// Helper to recursively list all files under a given path in Supabase Storage
async function listAllFilesRecursive(basePath: string): Promise<any[]> {
  let allFiles: any[] = [];
  const { data: items, error } = await supabase.storage.from('raw-frames').list(basePath);
  console.log('[listAllFilesRecursive] Listing:', basePath, 'Items:', items, 'Error:', error);
  if (error) return [];
  for (const item of items || []) {
    if (item.name && item.metadata !== null) {
      // It's a file
      allFiles.push(item);
    } else if (item.name && item.metadata === null) {
      // It's a folder
      const subFiles = await listAllFilesRecursive(basePath + (basePath.endsWith('/') ? '' : '/') + item.name + '/');
      allFiles = allFiles.concat(subFiles);
    }
  }
  return allFiles;
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
    // Fix: Prefer astronomical object name for targetName, fallback to project.title
    let target: HydratedProject['target'] = undefined;
    let targetName = '';
    if (project.target && typeof project.target === 'object' && Object.keys(project.target).length > 0) {
      target = project.target;
      targetName = project.target.name || project.target.object || project.target.target || '';
    } else if (project.object) {
      targetName = project.object;
    }
    // If no targetName, try to hydrate from fits_metadata
    if (!targetName) {
      // Query fits_metadata for this project
      const { data: fitsMetaRows, error: fitsMetaError } = await supabase
        .from('fits_metadata')
        .select('metadata')
        .eq('project_id', project.id);
      if (!fitsMetaError && fitsMetaRows && fitsMetaRows.length > 0) {
        // Find the first non-empty object name
        const metaWithObject = fitsMetaRows.find(row => row.metadata && row.metadata.object);
        if (metaWithObject) {
          targetName = metaWithObject.metadata.object;
          target = {
            name: metaWithObject.metadata.object,
            coordinates: {
              ra: metaWithObject.metadata.ra || '',
              dec: metaWithObject.metadata.dec || '',
            },
            category: metaWithObject.metadata.category || undefined,
          };
          // Optionally update the project record if target is missing
          if (!project.target || Object.keys(project.target).length === 0) {
            await supabase
              .from('projects')
              .update({ target })
              .eq('id', project.id);
          }
        }
      }
    }
    if (!targetName) {
      targetName = project.title || project.name || '—';
    }

    // Aggregate FITS files from Supabase Storage (recursive)
    let frameCount = 0;
    let fileSize = 0;
    let userImageUrl = undefined;
    try {
      // List all files recursively under 'raw-frames/{user_id}/{project_id}/'
      const storageBase = `${userId}/${project.id}/`;
      const files = await listAllFilesRecursive(storageBase);
      frameCount = files.length;
      fileSize = files.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
      userImageUrl = files.length > 0 ? supabase.storage.from('raw-frames').getPublicUrl(storageBase + files[0].name).data.publicUrl : undefined;
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
    let status: 'new' | 'in_progress' | 'completed' = 'new';
    try {
      const { data, error } = await supabase
        .from('processing_steps')
        .select('*')
        .eq('project_id', project.id);
      if (error) throw error;
      steps = data || [];
      if (frameCount > 0) {
        const allStepsDone = steps.length > 0 && steps.every(s => s.status === 'done' || s.status === 'completed');
        status = allStepsDone ? 'completed' : 'in_progress';
      } else {
        status = 'new';
      }
    } catch (err) {
      console.warn(`Failed to fetch processing_steps for project ${project.id}:`, err);
      steps = [];
      status = frameCount > 0 ? 'in_progress' : 'new';
    }

    // Equipment: aggregate from project_files metadata (not storage)
    let equipment: { type: string; name: string }[] = [];
    try {
      const { data: files, error } = await supabase
        .from('project_files')
        .select('metadata')
        .eq('project_id', project.id);
      if (error) throw error;
      const eqSet = new Set<string>();
      const eqArr: { type: string; name: string }[] = [];
      for (const file of files || []) {
        const meta = file.metadata || {};
        if (meta.telescope) {
          const key = `telescope:${meta.telescope}`;
          if (!eqSet.has(key)) {
            eqArr.push({ type: 'telescope', name: meta.telescope });
            eqSet.add(key);
          }
        }
        if (meta.camera || meta.instrument) {
          const cameraName = meta.camera || meta.instrument;
          const key = `camera:${cameraName}`;
          if (!eqSet.has(key)) {
            eqArr.push({ type: 'camera', name: cameraName });
            eqSet.add(key);
          }
        }
        if (meta.filter) {
          const key = `filter:${meta.filter}`;
          if (!eqSet.has(key)) {
            eqArr.push({ type: 'filter', name: meta.filter });
            eqSet.add(key);
          }
        }
      }
      equipment = eqArr;
      console.log('Hydrated equipment from project_files for project', project.id, equipment);
    } catch (err) {
      console.warn(`Failed to fetch equipment from project_files for project ${project.id}:`, err);
      equipment = [];
    }

    // Tags (if present)
    const tags = project.tags || [];
    // isFavorite (placeholder)
    const isFavorite = false;

    // Thumbnail: use SkyView if target has coordinates, else fallback
    let thumbnailUrl = '';
    if (target && target.coordinates && target.coordinates.ra && target.coordinates.dec) {
      // Use SkyView utility (client-side), so fallback to userImageUrl or blank here
      thumbnailUrl = userImageUrl || '';
    } else if (userImageUrl && typeof userImageUrl === 'string' && userImageUrl.startsWith('raw-frames/')) {
      // If userImageUrl is a file path, convert to public URL
      thumbnailUrl = supabase.storage.from('raw-frames').getPublicUrl(userImageUrl).data.publicUrl || '';
    } else {
      thumbnailUrl = userImageUrl || '';
    }

    // Attach full FITS metadata from the main file (if available)
    let fitsMetadata = undefined;
    try {
      // Try to get the first file's metadata from project_files
      const { data: filesWithMeta, error: metaError } = await supabase
        .from('project_files')
        .select('metadata')
        .eq('project_id', project.id);
      if (!metaError && filesWithMeta && filesWithMeta.length > 0) {
        // Use the first file with metadata
        const firstWithMeta = filesWithMeta.find(f => f.metadata && Object.keys(f.metadata).length > 0);
        if (firstWithMeta) {
          fitsMetadata = firstWithMeta.metadata;
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch fitsMetadata for project ${project.id}:`, err);
    }
    // Attach fitsMetadata to target
    if (target) {
      target.fitsMetadata = fitsMetadata || {};
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