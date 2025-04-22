import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define storage bucket names
export const STORAGE_BUCKETS = {
  PROFILE_PICS: 'profile-pictures',
  RAW_FRAMES: 'raw-frames',
  MASTER_FRAMES: 'master-frames',
  CALIBRATED_FRAMES: 'calibrated-frames',
  STACKED_FRAMES: 'stacked-frames',
  PRE_PROCESSED: 'pre-processed',
  POST_PROCESSED: 'post-processed'
};

// Define file type folders
export const FILE_TYPE_FOLDERS = {
  LIGHT: 'light',
  DARK: 'dark',
  BIAS: 'bias',
  FLAT: 'flat',
  MASTER_DARK: 'master-dark',
  MASTER_BIAS: 'master-bias',
  MASTER_FLAT: 'master-flat',
  CALIBRATED: 'calibrated',
  STACKED: 'stacked',
  ALIGNED: 'aligned',
  PRE_PROCESSED: 'pre-processed',
  POST_PROCESSED: 'post-processed'
};

// Profile picture functions
export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/profile.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_PICS)
    .upload(filePath, file, { upsert: true });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_PICS)
    .getPublicUrl(filePath);
  
  return publicUrl;
};

// Raw frames functions
export const uploadRawFrame = async (
  projectId: string, 
  fileType: 'light' | 'dark' | 'bias' | 'flat', 
  file: File
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${projectId}/${fileType}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.RAW_FRAMES)
    .upload(filePath, file);
  
  if (error) throw error;
  
  return filePath;
};

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
  const filePath = `${projectId}/${FILE_TYPE_FOLDERS.CALIBRATED}/${file.name}`;
  
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
  const filePath = `${projectId}/${FILE_TYPE_FOLDERS.STACKED}/${file.name}`;
  
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
  const filePath = `${projectId}/${FILE_TYPE_FOLDERS.PRE_PROCESSED}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.PRE_PROCESSED)
    .upload(filePath, file);
  
  if (error) throw error;
  
  return filePath;
};

// Post-processed image functions
export const uploadPostProcessedImage = async (
  projectId: string, 
  file: File
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${projectId}/${FILE_TYPE_FOLDERS.POST_PROCESSED}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.POST_PROCESSED)
    .upload(filePath, file);
  
  if (error) throw error;
  
  return filePath;
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
export const deleteFile = async (bucket: string, filePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);
  
  if (error) throw error;
};

// List files in a project folder
export const listProjectFiles = async (bucket: string, projectId: string): Promise<string[]> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(projectId);
  
  if (error) throw error;
  
  return data.map(file => file.name);
}; 