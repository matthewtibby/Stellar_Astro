import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FileType } from '@/src/types/store';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize Supabase client with error handling
let supabase: SupabaseClient | null = null;
let supabaseError: string | null = null;

try {
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured in environment variables.');
  }
  
  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured in environment variables.');
  }
  
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  supabaseError = error instanceof Error ? error.message : 'Unknown error initializing Supabase';
}

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

// Helper function to check if Supabase is available
const checkSupabase = () => {
  if (!supabase) {
    throw new Error(supabaseError || 'Storage service is currently unavailable. Please try again later.');
  }
  return supabase;
};

// Profile picture functions
export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  const client = checkSupabase();
  const filePath = `${userId}/profile.${file.name.split('.').pop()}`;
  
  const { data, error } = await client.storage
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
export type UploadProgressCallback = (progress: number) => void;

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

export async function checkBucketContents(): Promise<void> {
  try {
    const client = checkSupabase();
    const { data: { user }, error: authError } = await client.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('User must be authenticated to check bucket contents');
    }

    // List all files in the raw-frames bucket
    const { data, error } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .list();

    if (error) {
      console.error('Error listing bucket contents:', error);
      throw error;
    }

    console.log('All files in raw-frames bucket:', data.map(file => ({
      name: file.name,
      size: file.metadata?.size,
      created_at: file.created_at
    })));
  } catch (error) {
    console.error('Error checking bucket contents:', error);
  }
}

export async function uploadRawFrame(
  projectId: string,
  fileType: FileType,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  try {
    const client = checkSupabase();
    
    // Get the current user from Supabase auth
    const { data: { user }, error: authError } = await client.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('User must be authenticated to upload files');
    }

    // Sanitize the file name by replacing special characters
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${projectId}/${FILE_TYPE_FOLDERS[fileType]}/${sanitizedFileName}`;
    
    // Check if file already exists
    const { data: existingFiles, error: listError } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .list(`${user.id}/${projectId}/${FILE_TYPE_FOLDERS[fileType]}`);
    
    if (listError) {
      console.error('Error checking for existing files:', listError);
      throw new Error('Failed to check for existing files');
    }
    
    const fileExists = existingFiles?.some(existingFile => existingFile.name === sanitizedFileName);
    if (fileExists) {
      throw new Error(`A file named "${sanitizedFileName}" already exists in this project. Please rename the file or choose a different one.`);
    }
    
    console.log('Attempting to upload file:', {
      originalName: file.name,
      sanitizedName: sanitizedFileName,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      userId: user.id,
      bucketName: STORAGE_BUCKETS.RAW_FRAMES,
      contentType: file.type
    });
    
    const { error: uploadError, data } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Upload error details:', {
        error: uploadError,
        message: uploadError.message,
        name: uploadError.name
      });
      
      // Provide user-friendly error messages for common issues
      if (uploadError.message.includes('already exists')) {
        throw new Error(`A file named "${sanitizedFileName}" already exists in this project. Please rename the file or choose a different one.`);
      } else if (uploadError.message.includes('quota')) {
        throw new Error('Storage quota exceeded. Please contact support or upgrade your plan.');
      } else if (uploadError.message.includes('size')) {
        throw new Error('File size exceeds the maximum allowed size. Please choose a smaller file.');
      } else {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
    }

    if (!data?.path) {
      throw new Error('Upload failed: No file path returned');
    }

    // Check bucket contents after successful upload
    await checkBucketContents();

    return data.path;
  } catch (error) {
    console.error('Error uploading raw frame:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
    }
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
  
  const { data, error } = await client.storage
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
  
  const { data, error } = await client.storage
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
  
  const { data, error } = await client.storage
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
  
  const { data, error } = await client.storage
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
  
  const { data, error } = await client.storage
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
  const { data, error } = await client.storage
    .from(bucket)
    .download(filePath);
  
  if (error) throw error;
  
  return data;
};

// Generic delete function
export async function deleteFitsFile(filePath: string): Promise<void> {
  const client = checkSupabase();
  const { error } = await client.storage
    .from('fits-files')
    .remove([filePath]);

  if (error) {
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

export async function getFitsFileUrl(filePath: string): Promise<string> {
  const client = checkSupabase();
  const { data } = await client.storage
    .from('fits-files')
    .createSignedUrl(filePath, 3600); // URL expires in 1 hour

  if (!data?.signedUrl) {
    throw new Error('Failed to generate signed URL');
  }

  return data.signedUrl;
}

export interface StorageFile {
  name: string;
  path: string;
  size: number;
  created_at: string;
  type: FileType;
}

export async function getFilesByType(projectId: string): Promise<Record<FileType, StorageFile[]>> {
  try {
    const client = checkSupabase();
    const { data: { user }, error: authError } = await client.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User must be authenticated to fetch files');
    }

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

    // Fetch files for each type
    for (const [type, folder] of Object.entries(FILE_TYPE_FOLDERS)) {
      const { data, error } = await client.storage
        .from(STORAGE_BUCKETS.RAW_FRAMES)
        .list(`${user.id}/${projectId}/${folder}`);
      
      if (error) {
        console.error(`Error fetching ${type} files:`, error);
        continue;
      }
      
      if (data) {
        result[type as FileType] = data.map(file => ({
          name: file.name,
          path: `${user.id}/${projectId}/${folder}/${file.name}`,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          type: type as FileType
        }));
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching files by type:', error);
    throw error;
  }
}