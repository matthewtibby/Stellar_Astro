import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import { FileType, StorageFile } from '@/src/types/store';
import { extractTagsFromFitsHeader } from './storage.tagging';
import { STORAGE_BUCKETS, FILE_TYPE_FOLDERS } from './storage.constants';
import type { FitsValidationResult, UploadProgressCallback } from '@/src/types/storage.types';
import { ensureProjectExists, checkBucketContents } from './storage.project';
import { validateFitsFile } from './storage.validation';
import { uploadProfilePicture, listRawFrames, uploadMasterFrame, uploadCalibratedFrame, uploadStackedFrame, uploadPreProcessedImage, uploadPostProcessedImage, downloadFile, deleteFitsFile, listProjectFiles, fileExists, getFitsFileUrl, getFilesByType, getFitsPreviewUrl } from './storage.files';

// Helper function to get Supabase client
const checkSupabase = () => {
  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch {
    throw new Error('Storage service is currently unavailable. Please try again later.');
  }
};

// Profile picture functions
export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  const client = checkSupabase();
  const filePath = `${userId}/profile.${file.name.split('.').pop()}`;
  
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.PROFILE_PICTURES)
    .upload(filePath, file, {
      upsert: true,
      metadata: {
        owner: userId
      }
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = client.storage
    .from(STORAGE_BUCKETS.PROFILE_PICTURES)
    .getPublicUrl(filePath);
  
  return publicUrl;
};

// Raw frames functions
export async function listRawFrames(projectId: string): Promise<string[]> {
  try {
    const client = checkSupabase();
    const { data: { user }, error: authError } = await client.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User must be authenticated to list files');
    }

    const { data, error } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .list(`${user.id}/${projectId}`);

    if (error) {
      console.error('Error listing files:', error);
      throw error;
    }

    return data.map(file => file.name);
  } catch (error) {
    console.error('Error listing raw frames:', error);
    throw error;
  }
}

// Master frames functions
export const uploadMasterFrame = async (
  projectId: string, 
  masterType: 'master-dark' | 'master-bias' | 'master-flat', 
  file: File
): Promise<string> => {
  const client = checkSupabase();
  const filePath = `${projectId}/${masterType}/${file.name}`;
  
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.MASTER_FRAMES)
    .upload(filePath, file, {
      metadata: {
        owner: (await client.auth.getUser()).data.user?.id
      }
    });
  
  if (error) throw error;
  
  return filePath;
};

// Calibrated frames functions
export const uploadCalibratedFrame = async (
  projectId: string, 
  file: File
): Promise<string> => {
  const client = checkSupabase();
  const filePath = `${projectId}/calibrated/${file.name}`;
  
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.CALIBRATED_FRAMES)
    .upload(filePath, file, {
      metadata: {
        owner: (await client.auth.getUser()).data.user?.id
      }
    });
  
  if (error) throw error;
  
  return filePath;
};

// Stacked frames functions
export const uploadStackedFrame = async (
  projectId: string, 
  file: File
): Promise<string> => {
  const client = checkSupabase();
  const filePath = `${projectId}/stacked/${file.name}`;
  
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.STACKED_FRAMES)
    .upload(filePath, file, {
      metadata: {
        owner: (await client.auth.getUser()).data.user?.id
      }
    });
  
  if (error) throw error;
  
  return filePath;
};

// Pre-processed image functions
export const uploadPreProcessedImage = async (
  projectId: string,
  file: File
): Promise<string> => {
  const client = checkSupabase();
  const filePath = `${projectId}/pre-processed/${file.name}`;
  
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.PRE_PROCESSED)
    .upload(filePath, file, {
      metadata: {
        owner: (await client.auth.getUser()).data.user?.id
      }
    });
  
  if (error) throw error;
  
  return filePath;
};

// Post-processed image functions
export const uploadPostProcessedImage = async (
  projectId: string,
  file: File
): Promise<string> => {
  const client = checkSupabase();
  const filePath = `${projectId}/post-processed/${file.name}`;
  
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.POST_PROCESSED)
    .upload(filePath, file, {
      metadata: {
        owner: (await client.auth.getUser()).data.user?.id
      }
    });
  
  if (error) throw error;
  
  return filePath;
};

// Generic download function
export const downloadFile = async (bucket: string, filePath: string): Promise<Blob> => {
  const client = checkSupabase();
  const result = await client.storage
    .from(bucket)
    .download(filePath);
  
  if (result.error) throw result.error;
  
  return result.data;
};

// Generic delete function
export async function deleteFitsFile(filePath: string): Promise<void> {
  const client = checkSupabase();
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.RAW_FRAMES)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

// List files in a project folder
export async function listProjectFiles(projectId: string): Promise<string[]> {
  const client = checkSupabase();
  const { data, error } = await client.storage
    .from('fits-files')
    .list(projectId);

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data.map(file => `${projectId}/${file.name}`);
}

// Add a function to check if a file exists in the bucket
export async function fileExists(bucket: string, filePath: string): Promise<boolean> {
  const client = checkSupabase();
  try {
    const { data, error } = await client.storage
      .from(bucket)
      .list(filePath.split('/').slice(0, -1).join('/'));
    
    if (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
    
    const fileName = filePath.split('/').pop();
    return data?.some(file => file.name === fileName) || false;
  } catch (error) {
    console.error('Error in fileExists:', error);
    return false;
  }
}

export async function getFitsFileUrl(filePath: string): Promise<string> {
  try {
    console.log('[getFitsFileUrl] Getting URL for file:', filePath);
    const client = checkSupabase();

    // Log the directory we're checking
    const directory = filePath.split('/').slice(0, -1).join('/');
    const fileName = filePath.split('/').pop();
    console.log('[getFitsFileUrl] Directory:', directory);
    console.log('[getFitsFileUrl] Filename:', fileName);

    // Check if the file exists first
    const { data: fileExists, error: checkError } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .list(directory);

    if (checkError) {
      console.error('[getFitsFileUrl] Error checking file existence:', checkError);
      throw checkError;
    }

    console.log('[getFitsFileUrl] Files in directory:', fileExists);

    // Check if our file is in the list
    const fileInList = fileExists?.find(f => f.name === fileName);
    console.log('[getFitsFileUrl] File found in list?', !!fileInList);

    // Get the URL
    const { data: url } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .createSignedUrl(filePath, 3600);

    console.log('[getFitsFileUrl] Generated URL:', url);
    
    if (!url?.signedUrl) {
      throw new Error('Failed to generate signed URL');
    }

    return url.signedUrl;
  } catch (error) {
    console.error('[getFitsFileUrl] Error:', error);
    throw error;
  }
}

export async function getFilesByType(projectId: string): Promise<Record<FileType, StorageFile[]>> {
  try {
    console.log('[getFilesByType] Starting for project:', projectId);
    const client = checkSupabase();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) {
      throw new Error('User must be authenticated to fetch files');
    }
    const userId = user.id;
    // Query the project_files table for all files in this project
    const { data: dbFiles, error: dbError } = await client
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId);
    if (dbError) {
      throw new Error('Failed to fetch files from project_files: ' + dbError.message);
    }
    // Group files by type
    const result: Record<FileType, StorageFile[]> = {
      'light': [],
      'dark': [],
      'bias': [],
      'flat': [],
      'master-dark': [],
      'master-bias': [],
      'master-flat': [],
      'calibrated': [],
      'stacked': [],
      'aligned': [],
      'pre-processed': [],
      'post-processed': []
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
    console.error('[getFilesByType] Error:', error);
    throw error;
  }
}

// Helper to get the PNG preview URL for a FITS file
export async function getFitsPreviewUrl(filePath: string): Promise<string> {
  // filePath: userId/projectId/fileType/fileName.fit or .fits
  const pngPath = filePath.replace(/\.fits?$/i, '.png').replace(/\.fit$/i, '.png');
  const client = checkSupabase();
  const { data, error } = await client.storage
    .from(STORAGE_BUCKETS.RAW_FRAMES)
    .createSignedUrl(pngPath, 3600);
  if (error || !data?.signedUrl) throw new Error('Failed to get preview URL');
  return data.signedUrl;
}

export type { StorageFile } from '@/src/types/store';