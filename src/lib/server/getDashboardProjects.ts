/**
 * Fetches and hydrates all projects for a user with related data for dashboard display.
 * Handles errors and missing data gracefully.
 */
import { createClient } from '@/src/lib/supabase';
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
  steps: { status: string }[];
  tags?: string[];
  isFavorite?: boolean;
  target?: {
    name: string;
    coordinates: { ra: string; dec: string };
    category?: string;
    angularSizeArcmin?: number;
    fitsMetadata?: Record<string, unknown>;
  };
}

// Helper to recursively list all files under a given path in Supabase Storage
async function listAllFilesRecursive(basePath: string): Promise<Array<{ name: string; metadata?: { size?: number }; file_size?: number; file_type?: string; file_path?: string }>> {
  let allFiles: Array<{ name: string; metadata?: { size?: number }; file_size?: number; file_type?: string; file_path?: string }> = [];
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
  let projects: Array<Record<string, unknown>> = [];
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
    let targetName = '';
    if (project.target && typeof project.target === 'object' && Object.keys(project.target as object).length > 0) {
      const t = project.target as { name?: string; object?: string; target?: string };
      target = project.target as HydratedProject['target'];
      targetName = t.name || t.object || t.target || '';
    } else if (typeof project === 'object' && project !== null && 'object' in project && typeof (project as Record<string, unknown>).object === 'string') {
      targetName = (project as Record<string, unknown>).object as string;
    }
    if (!targetName) {
      const { data: fitsMetaRows, error: fitsMetaError } = await supabase
        .from('fits_metadata')
        .select('metadata')
        .eq('project_id', project.id as string);
      if (!fitsMetaError && fitsMetaRows && fitsMetaRows.length > 0) {
        const metaWithObject = fitsMetaRows.find((row: { metadata?: { object?: string } }) => row.metadata && row.metadata.object);
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
          if (!project.target || Object.keys(project.target as object).length === 0) {
            await supabase
              .from('projects')
              .update({ target })
              .eq('id', project.id as string);
          }
        }
      }
    }
    if (!targetName) {
      const p = project as Record<string, unknown>;
      targetName = (typeof p.title === 'string' && p.title) || (typeof p.name === 'string' && p.name) || '—';
    }

    let frameCount = 0;
    let fileSize = 0;
    let userImageUrl = undefined;
    try {
      const storageBase = `${userId}/${project.id}/`;
      const files = await listAllFilesRecursive(storageBase);
      frameCount = files.length;
      fileSize = files.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
      userImageUrl = files.length > 0 ? supabase.storage.from('raw-frames').getPublicUrl(storageBase + files[0].name).data.publicUrl : undefined;
    } catch (err) {
      console.warn(`Failed to fetch storage files for project ${project.id}:`, err);
      let fitsFiles: Array<{ file_size?: number; file_type?: string; file_path?: string; metadata?: Record<string, unknown> }> = [];
      try {
        const { data, error } = await supabase
          .from('fits_files')
          .select('file_size, file_type, file_path, metadata')
          .eq('project_id', project.id as string);
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

    let steps: { status: string }[] = [];
    let status: 'new' | 'in_progress' | 'completed' = 'new';
    try {
      const { data, error } = await supabase
        .from('processing_steps')
        .select('*')
        .eq('project_id', project.id as string);
      if (error) throw error;
      steps = (data || []).map((s: Record<string, unknown>) => ({ status: typeof s.status === 'string' ? s.status : '' }));
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

    let equipment: { type: string; name: string }[] = [];
    try {
      const { data: files, error } = await supabase
        .from('project_files')
        .select('metadata')
        .eq('project_id', project.id as string);
      if (error) throw error;
      const eqSet = new Set<string>();
      const eqArr: { type: string; name: string }[] = [];
      for (const file of files || []) {
        const meta = file.metadata || {};
        if (typeof meta === 'object' && meta !== null && 'telescope' in meta && typeof (meta as Record<string, unknown>).telescope === 'string') {
          const key = `telescope:${(meta as Record<string, unknown>).telescope}`;
          if (!eqSet.has(key)) {
            eqArr.push({ type: 'telescope', name: (meta as Record<string, unknown>).telescope as string });
            eqSet.add(key);
          }
        }
        if (typeof meta === 'object' && meta !== null && ('camera' in meta || 'instrument' in meta)) {
          const cameraName = (meta as Record<string, unknown>).camera || (meta as Record<string, unknown>).instrument;
          if (typeof cameraName === 'string') {
            const key = `camera:${cameraName}`;
            if (!eqSet.has(key)) {
              eqArr.push({ type: 'camera', name: cameraName });
              eqSet.add(key);
            }
          }
        }
        if (typeof meta === 'object' && meta !== null && 'filter' in meta && typeof (meta as Record<string, unknown>).filter === 'string') {
          const key = `filter:${(meta as Record<string, unknown>).filter}`;
          if (!eqSet.has(key)) {
            eqArr.push({ type: 'filter', name: (meta as Record<string, unknown>).filter as string });
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

    const p = project as Record<string, unknown>;
    const tags = Array.isArray(p.tags) ? p.tags as string[] : [];
    const isFavorite = false;

    let thumbnailUrl = '';
    if (target && target.coordinates && target.coordinates.ra && target.coordinates.dec) {
      thumbnailUrl = userImageUrl || '';
    } else if (userImageUrl && typeof userImageUrl === 'string' && userImageUrl.startsWith('raw-frames/')) {
      thumbnailUrl = supabase.storage.from('raw-frames').getPublicUrl(userImageUrl).data.publicUrl || '';
    } else {
      thumbnailUrl = userImageUrl || '';
    }

    let fitsMetadata: Record<string, unknown> | undefined = undefined;
    try {
      const { data: filesWithMeta, error: metaError } = await supabase
        .from('project_files')
        .select('metadata')
        .eq('project_id', project.id as string);
      if (!metaError && filesWithMeta && filesWithMeta.length > 0) {
        const firstWithMeta = filesWithMeta.find((f: { metadata?: Record<string, unknown> }) => f.metadata && Object.keys(f.metadata).length > 0);
        if (firstWithMeta) {
          fitsMetadata = firstWithMeta.metadata;
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch fitsMetadata for project ${project.id}:`, err);
    }
    if (target) {
      target.fitsMetadata = fitsMetadata || {};
    }

    hydrated.push({
      id: project.id as string,
      title: typeof p.title === 'string' ? p.title : '',
      targetName,
      status,
      thumbnailUrl,
      userImageUrl,
      creationDate: typeof p.created_at === 'string' ? p.created_at : '',
      updatedAt: typeof p.updated_at === 'string' ? p.updated_at : '',
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