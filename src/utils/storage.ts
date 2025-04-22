import { createClient } from '@supabase/supabase-js';
import { FileType } from '@/src/types/store';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket names
export const STORAGE_BUCKETS = {
  PROFILE_PICTURES: 'profile-pictures',
  RAW_FRAMES: 'raw-frames',
  MASTER_FRAMES: 'master-frames',
  CALIBRATED_FRAMES: 'calibrated-frames',
  STACKED_FRAMES: 'stacked-frames',
  PRE_PROCESSED: 'pre-processed',
  POST_PROCESSED: 'post-processed',
} as const;

// File type folders
export const FILE_TYPE_FOLDERS: Record<FileType, string> = {
  'light': 'light',
  'dark': 'dark',
  'bias': 'bias',
  'flat': 'flat',
  'master-dark': 'master-dark',
  'master-bias': 'master-bias',
  'master-flat': 'master-flat',
  'calibrated': 'calibrated',
  'stacked': 'stacked',
  'aligned': 'aligned',
  'pre-processed': 'pre-processed',
  'post-processed': 'post-processed',
} as const;

// Profile picture functions
export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/profile.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_PICTURES)
    .upload(filePath, file, { upsert: true });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_PICTURES)
    .getPublicUrl(filePath);
  
  return publicUrl;
};

// Raw frames functions
export async function uploadRawFrame(
  projectId: string,
  fileType: 'light' | 'dark' | 'flat' | 'bias',
  file: File
): Promise<string> {
  const timestamp = new Date().getTime();
  const fileExtension = file.name.split('.').pop();
  const fileName = `${fileType}_${timestamp}.${fileExtension}`;
  const filePath = `${projectId}/${fileType}/${fileName}`;

  const { error } = await supabase.storage
    .from('fits-files')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return filePath;
}

// Master frames functions
export const uploadMasterFrame = async (
  projectId: string, 
  masterType: 'master-dark' | 'master-bias' | 'master-flat', 
  file: File
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${projectId}/${masterType}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.MASTER_FRAMES)
    .upload(filePath, file);
  
  if (error) throw error;
  
  return filePath;
};

// Calibrated frames functions
export const uploadCalibratedFrame = async (
  projectId: string, 
  file: File
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${projectId}/${FILE_TYPE_FOLDERS.calibrated}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.CALIBRATED_FRAMES)
    .upload(filePath, file);
  
  if (error) throw error;
  
  return filePath;
};

// Stacked frames functions
export const uploadStackedFrame = async (
  projectId: string, 
  file: File
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${projectId}/${FILE_TYPE_FOLDERS.stacked}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.STACKED_FRAMES)
    .upload(filePath, file);
  
  if (error) throw error;
  
  return filePath;
};

// Pre-processed image functions
export const uploadPreProcessedImage = async (
  projectId: string,
  file: File
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${projectId}/${FILE_TYPE_FOLDERS['pre-processed']}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.PRE_PROCESSED)
    .upload(filePath, file, { upsert: true });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.PRE_PROCESSED)
    .getPublicUrl(filePath);
  
  return publicUrl;
};

// Post-processed image functions
export const uploadPostProcessedImage = async (
  projectId: string,
  file: File
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${projectId}/${FILE_TYPE_FOLDERS['post-processed']}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.POST_PROCESSED)
    .upload(filePath, file, { upsert: true });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.POST_PROCESSED)
    .getPublicUrl(filePath);
  
  return publicUrl;
};

// Generic download function
export const downloadFile = async (bucket: string, filePath: string): Promise<Blob> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(filePath);
  
  if (error) throw error;
  
  return data;
};

// Generic delete function
export async function deleteFitsFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('fits-files')
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

// List files in a project folder
export async function listProjectFiles(projectId: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from('fits-files')
    .list(projectId);

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data.map(file => `${projectId}/${file.name}`);
}

export async function getFitsFileUrl(filePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from('fits-files')
    .createSignedUrl(filePath, 3600); // URL expires in 1 hour

  if (!data?.signedUrl) {
    throw new Error('Failed to generate signed URL');
  }

  return data.signedUrl;
} 