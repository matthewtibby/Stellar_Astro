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
export async function validateFitsFile(file: File, expectedType?: FileType): Promise<{ valid: boolean; message: string; actualType: string | null }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (expectedType) {
      formData.append('expectedType', expectedType);
    }

    const response = await fetch('http://localhost:8001/validate-fits', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Validation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error validating FITS file:', error);
    throw error;
  }
}

// Update the uploadRawFrame function to include validation
export async function uploadRawFrame(
  projectId: string,
  fileType: FileType,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  try {
    // First validate the FITS file
    const validationResult = await validateFitsFile(file, fileType);
    if (!validationResult.valid) {
      throw new Error(validationResult.message);
    }

    const client = getSupabaseClient();
    
    // Get the current user from Supabase auth
    const { data: { user }, error: authError } = await client.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('User must be authenticated to upload files');
    }

    // Generate a unique identifier with timestamp
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    const uniqueId = `${timestamp}_${randomString}`;
    
    // Sanitize the file name and add unique identifier
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const baseFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9.-]/g, '_');
    const sanitizedFileName = `${baseFileName}_${uniqueId}.${fileExtension}`;
    
    // Create a more unique path structure
    const targetFilePath = `${user.id}/${projectId}/${FILE_TYPE_FOLDERS[fileType]}/${uniqueId}/${sanitizedFileName}`;
    
    console.log('Attempting to upload file:', {
      originalName: file.name,
      sanitizedName: sanitizedFileName,
      filePath: targetFilePath,
      fileSize: file.size,
      fileType: file.type,
      userId: user.id,
      bucketName: STORAGE_BUCKETS.RAW_FRAMES,
      contentType: file.type
    });
    
    // Try to upload with a simple approach first
    try {
      const { data, error } = await client.storage
        .from(STORAGE_BUCKETS.RAW_FRAMES)
        .upload(targetFilePath, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) {
        console.error('Simple upload failed:', error);
        throw error;
      }
      
      if (!data?.path) {
        throw new Error('Upload failed: No file path returned');
      }
      
      return data.path;
    } catch (simpleUploadError) {
      console.error('Simple upload failed, trying chunked upload:', simpleUploadError);
      
      // If simple upload fails, try the chunked approach
      // Create a custom upload function that tracks progress
      const uploadWithProgress = async () => {
        // Create a FileReader to read the file in chunks
        const reader = new FileReader();
        const chunkSize = 1024 * 1024; // 1MB chunks
        const totalChunks = Math.ceil(file.size / chunkSize);
        let uploadedChunks = 0;
        
        return new Promise<string>((resolve, reject) => {
          // Create a custom upload function that uses fetch API
          const uploadChunk = async (chunk: Blob, start: number) => {
            try {
              // Create a FormData object for the chunk
              const formData = new FormData();
              formData.append('file', chunk);
              
              // Get a signed URL for the upload
              const { data: signedUrlData, error: signedUrlError } = await client.storage
                .from(STORAGE_BUCKETS.RAW_FRAMES)
                .createSignedUploadUrl(targetFilePath);
                
              if (signedUrlError) {
                throw signedUrlError;
              }
              
              // Upload the chunk using fetch
              const response = await fetch(signedUrlData.signedUrl, {
                method: 'PUT',
                body: chunk,
                headers: {
                  'Content-Type': file.type,
                  'Content-Range': `bytes ${start}-${start + chunk.size - 1}/${file.size}`
                }
              });
              
              if (!response.ok) {
                throw new Error(`Upload failed with status: ${response.status}`);
              }
              
              // Update progress
              uploadedChunks++;
              const progress = uploadedChunks / totalChunks;
              if (onProgress) {
                onProgress(progress);
              }
              
              // If there are more chunks, upload the next one
              if (uploadedChunks < totalChunks) {
                const nextStart = start + chunk.size;
                const nextChunk = file.slice(nextStart, nextStart + chunkSize);
                await uploadChunk(nextChunk, nextStart);
              } else {
                // All chunks uploaded, resolve the promise
                resolve(targetFilePath);
              }
            } catch (error) {
              reject(error);
            }
          };
          
          // Start uploading the first chunk
          const firstChunk = file.slice(0, chunkSize);
          uploadChunk(firstChunk, 0);
        });
      };
      
      // Use the custom upload function
      const uploadedFilePath = await uploadWithProgress();
      
      // Check bucket contents after successful upload
      await checkBucketContents();

      return uploadedFilePath;
    }
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