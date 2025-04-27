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
    console.error('Supabase URL is missing. Current value:', supabaseUrl);
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured in environment variables.');
  }
  
  if (!supabaseAnonKey) {
    console.error('Supabase Anon Key is missing. Current value:', supabaseAnonKey);
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured in environment variables.');
  }

  // Validate the Supabase URL format
  try {
    console.log('Attempting to validate Supabase URL:', supabaseUrl);
    new URL(supabaseUrl);
    console.log('Supabase URL validation successful');
  } catch (e) {
    console.error('Supabase URL validation failed:', e);
    throw new Error('Invalid Supabase URL format. Please check your NEXT_PUBLIC_SUPABASE_URL environment variable.');
  }
  
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  supabaseError = error instanceof Error ? error.message : 'Unknown error initializing Supabase';
}

// Export a function to get the Supabase client with error handling
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(supabaseError || 'Supabase client not initialized');
  }
  return supabase;
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

// Add this new function for FITS validation
export async function validateFitsFile(file: File, expectedType?: FileType): Promise<{ valid: boolean; message: string; actual_type: string | null; expected_type: string | null }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (expectedType) {
      formData.append('expected_type', expectedType);
    }

    const response = await fetch('http://localhost:8000/validate-fits', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.detail || 'Validation failed');
    }

    const data = await response.json();
    return {
      valid: data.valid,
      message: data.message,
      actual_type: data.actual_type,
      expected_type: data.expected_type
    };
  } catch (error) {
    console.error('Error validating FITS file:', error);
    throw error;
  }
}

// Add a function to ensure project exists
export async function ensureProjectExists(projectId: string): Promise<void> {
  const client = getSupabaseClient();
  
  // Check if projectId is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    throw new Error('Invalid project ID format. Must be a valid UUID.');
  }

  try {
    const { data: project, error } = await client
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    if (!project) {
      throw new Error('Project not found. Please create a project first.');
    }
  } catch (error) {
    console.error('Error in ensureProjectExists:', error);
    throw error;
  }
}

// Update the uploadRawFrame function to include validation
export async function uploadRawFrame(
  projectId: string,
  fileType: FileType,
  file: File,
  onProgress?: UploadProgressCallback,
  signal?: AbortSignal
): Promise<string> {
  try {
    console.log('[uploadRawFrame] Starting upload for file:', file.name);
    await ensureProjectExists(projectId);
    const validationResult = await validateFitsFile(file, fileType);
    if (!validationResult.valid) {
      throw new Error(validationResult.message);
    }
    const client = getSupabaseClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) {
      throw new Error('User must be authenticated to upload files');
    }
    const { data: project, error: projectError } = await client
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();
    if (projectError || !project) {
      throw new Error('Project not found');
    }
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    const uniqueId = `${timestamp}_${randomString}`;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const baseFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9.-]/g, '_');
    const sanitizedFileName = `${baseFileName}_${uniqueId}.${fileExtension}`;
    const targetFilePath = `${user.id}/${projectId}/${FILE_TYPE_FOLDERS[fileType]}/${uniqueId}/${sanitizedFileName}`;

    console.log('[uploadRawFrame] Target path:', targetFilePath);

    // 1. Get a signed upload URL from Supabase
    const { data: signedUrlData, error: signedUrlError } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .createSignedUploadUrl(targetFilePath);
    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error('Failed to get signed upload URL');
    }

    console.log('[uploadRawFrame] Got signed URL, starting upload');

    // 2. Upload the file using XMLHttpRequest for progress
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signedUrlData.signedUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(event.loaded / event.total);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onProgress) onProgress(1);
          resolve();
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload aborted'));
        });
      }
      xhr.send(file);
    });

    console.log('[uploadRawFrame] Upload completed, verifying file exists');

    // 3. Verify the file exists
    const { data: fileData, error: fileError } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .list(`${user.id}/${projectId}/${FILE_TYPE_FOLDERS[fileType]}/${uniqueId}`);

    if (fileError) {
      console.error('[uploadRawFrame] Error verifying file:', fileError);
      throw new Error('Failed to verify file upload');
    }

    if (!fileData || !fileData.some(f => f.name === sanitizedFileName)) {
      console.error('[uploadRawFrame] File not found after upload');
      throw new Error('File not found after upload');
    }

    console.log('[uploadRawFrame] File verified, returning path:', targetFilePath);
    return targetFilePath;
  } catch (error) {
    console.error('[uploadRawFrame] Error:', error);
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

// Helper to recursively list files in a folder
async function listAllFiles(client: SupabaseClient, bucket: string, path: string): Promise<any[]> {
  let files: any[] = [];
  const { data, error } = await client.storage.from(bucket).list(path, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  });
  
  if (error) {
    console.error(`Error listing files in ${path}:`, error);
    return files;
  }
  
  for (const item of data) {
    if (item.id && item.name && item.metadata && item.created_at) {
      // It's a file
      files.push({ ...item, fullPath: path ? `${path}/${item.name}` : item.name });
    } else if (item.name && item.id === undefined) {
      // It's a folder - recursively search
      const subPath = path ? `${path}/${item.name}` : item.name;
      console.log(`Found directory: ${subPath}, searching recursively`);
      const subFiles = await listAllFiles(client, bucket, subPath);
      files = files.concat(subFiles);
    }
  }
  
  return files;
}

export async function getFilesByType(projectId: string): Promise<Record<FileType, StorageFile[]>> {
  try {
    console.log('[getFilesByType] Starting for project:', projectId);
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
      try {
        const basePath = `${user.id}/${projectId}/${folder}`;
        console.log(`[getFilesByType] Searching for files in path: ${basePath}`);
        
        // First, list the top-level directories
        const { data: directories, error: dirError } = await client.storage
          .from(STORAGE_BUCKETS.RAW_FRAMES)
          .list(basePath);

        if (dirError) {
          console.error(`[getFilesByType] Error listing directories in ${basePath}:`, dirError);
          continue;
        }

        // For each directory, list its files
        for (const dir of directories) {
          if (dir.name) {
            const dirPath = `${basePath}/${dir.name}`;
            const { data: files, error: fileError } = await client.storage
              .from(STORAGE_BUCKETS.RAW_FRAMES)
              .list(dirPath);

            if (fileError) {
              console.error(`[getFilesByType] Error listing files in ${dirPath}:`, fileError);
              continue;
            }

            const filesWithMetadata = await Promise.all(
              files.map(async (file) => {
                try {
                  const filePath = `${dirPath}/${file.name}`;
                  const { data: metadata } = await client.storage
                    .from(STORAGE_BUCKETS.RAW_FRAMES)
                    .getPublicUrl(filePath);

                  return {
                    name: file.name,
                    path: filePath,
                    size: file.metadata?.size || 0,
                    created_at: file.created_at || new Date().toISOString(),
                    type: type as FileType,
                    url: metadata?.publicUrl
                  };
                } catch (error) {
                  console.error(`[getFilesByType] Error processing file ${file.name}:`, error);
                  return null;
                }
              })
            );

            result[type as FileType] = [
              ...result[type as FileType],
              ...filesWithMetadata.filter(Boolean) as StorageFile[]
            ];
          }
        }
      } catch (error) {
        console.error(`[getFilesByType] Error processing type ${type}:`, error);
        // Continue with other types even if one fails
      }
    }

    console.log('[getFilesByType] Final result:', result);
    return result;
  } catch (error) {
    console.error('[getFilesByType] Error:', error);
    throw error;
  }
}