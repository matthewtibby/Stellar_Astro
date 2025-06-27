import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import { FileType, StorageFile } from '@/src/types/store';
import { STORAGE_BUCKETS, FILE_TYPE_FOLDERS } from './storage.constants';
import { handleError, FileError } from './errorHandling';

export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const filePath = `${userId}/profile.${file.name.split('.').pop()}`;
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.PROFILE_PICTURES)
    .upload(filePath, file, {
      upsert: true,
      metadata: { owner: userId }
    });
  if (error) throw handleError(error);
  const { data: { publicUrl } } = client.storage
    .from(STORAGE_BUCKETS.PROFILE_PICTURES)
    .getPublicUrl(filePath);
  return publicUrl;
};

export async function listRawFrames(projectId: string): Promise<string[]> {
  try {
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) throw handleError(authError);
    const { data, error } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .list(`${user.id}/${projectId}`);
    if (error) throw handleError(error);
    return data.map(file => file.name);
  } catch (error) {
    throw handleError(error);
  }
}

export const uploadMasterFrame = async (
  projectId: string, 
  masterType: 'master-dark' | 'master-bias' | 'master-flat', 
  file: File
): Promise<string> => {
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const filePath = `${projectId}/${masterType}/${file.name}`;
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.MASTER_FRAMES)
    .upload(filePath, file, {
      metadata: { owner: (await client.auth.getUser()).data.user?.id }
    });
  if (error) throw handleError(error);
  return filePath;
};

export const uploadCalibratedFrame = async (
  projectId: string, 
  file: File
): Promise<string> => {
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const filePath = `${projectId}/calibrated/${file.name}`;
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.CALIBRATED_FRAMES)
    .upload(filePath, file, {
      metadata: { owner: (await client.auth.getUser()).data.user?.id }
    });
  if (error) throw handleError(error);
  return filePath;
};

export const uploadStackedFrame = async (
  projectId: string, 
  file: File
): Promise<string> => {
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const filePath = `${projectId}/stacked/${file.name}`;
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.STACKED_FRAMES)
    .upload(filePath, file, {
      metadata: { owner: (await client.auth.getUser()).data.user?.id }
    });
  if (error) throw handleError(error);
  return filePath;
};

export const uploadPreProcessedImage = async (
  projectId: string,
  file: File
): Promise<string> => {
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const filePath = `${projectId}/pre-processed/${file.name}`;
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.PRE_PROCESSED)
    .upload(filePath, file, {
      metadata: { owner: (await client.auth.getUser()).data.user?.id }
    });
  if (error) throw handleError(error);
  return filePath;
};

export const uploadPostProcessedImage = async (
  projectId: string,
  file: File
): Promise<string> => {
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const filePath = `${projectId}/post-processed/${file.name}`;
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.POST_PROCESSED)
    .upload(filePath, file, {
      metadata: { owner: (await client.auth.getUser()).data.user?.id }
    });
  if (error) throw handleError(error);
  return filePath;
};

export const downloadFile = async (bucket: string, filePath: string): Promise<Blob> => {
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const result = await client.storage
    .from(bucket)
    .download(filePath);
  if (result.error) throw handleError(result.error);
  return result.data as Blob;
};

export async function deleteFitsFile(filePath: string): Promise<void> {
  try {
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const { error } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .remove([filePath]);
    if (error) throw handleError(error);
  } catch (error) {
    throw handleError(error);
  }
}

export async function listProjectFiles(projectId: string): Promise<string[]> {
  try {
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await client.storage
      .from('fits-files')
      .list(projectId);
    if (error) throw handleError(error);
    return data.map(file => `${projectId}/${file.name}`);
  } catch (error) {
    throw handleError(error);
  }
}

export async function fileExists(bucket: string, filePath: string): Promise<boolean> {
  try {
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await client.storage
      .from(bucket)
      .list(filePath.split('/').slice(0, -1).join('/'));
    if (error) throw handleError(error);
    const fileName = filePath.split('/').pop();
    return !!data?.find(f => f.name === fileName);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getFitsFileUrl(filePath: string): Promise<string> {
  try {
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const directory = filePath.split('/').slice(0, -1).join('/');
    const fileName = filePath.split('/').pop();
    const { data: fileExists, error: checkError } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .list(directory);
    if (checkError) throw handleError(checkError);
    const fileInList = fileExists?.find(f => f.name === fileName);
    const { data: url } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .createSignedUrl(filePath, 3600);
    if (!url?.signedUrl) throw new FileError('Failed to generate signed URL');
    return url.signedUrl;
  } catch (error) {
    throw handleError(error);
  }
}

export async function getFilesByType(projectId: string): Promise<Record<FileType, StorageFile[]>> {
  try {
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) throw handleError(authError);
    const userId = user.id;
    const { data: dbFiles, error: dbError } = await client
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId);
    if (dbError) throw handleError(dbError);
    const result: Record<FileType, StorageFile[]> = {
      'light': [], 'dark': [], 'bias': [], 'flat': [], 'master-dark': [], 'master-bias': [], 'master-flat': [], 'calibrated': [], 'stacked': [], 'aligned': [], 'pre-processed': [], 'post-processed': []
    };
    for (const file of dbFiles || []) {
      const type = (file.file_type || 'light') as FileType;
      if (result[type]) {
        result[type].push({
          name: file.filename,
          path: file.file_path,
          size: file.file_size,
          created_at: file.created_at,
          type: type,
          metadata: file.metadata || {},
        });
      }
    }
    return result;
  } catch (error) {
    throw handleError(error);
  }
}

export async function getFitsPreviewUrl(filePath: string): Promise<string> {
  try {
    const pngPath = filePath.replace(/\.fits?$/i, '.png').replace(/\.fit$/i, '.png');
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .createSignedUrl(pngPath, 3600);
    if (error || !data?.signedUrl) throw handleError(error);
    return data.signedUrl;
  } catch (error) {
    throw handleError(error);
  }
} 