import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import { FileType } from '@/src/types/store';
import { extractTagsFromFitsHeader } from './fileTagging';

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

// Helper function to get Supabase client
const checkSupabase = () => {
  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    throw new Error('Storage service is currently unavailable. Please try again later.');
  }
};

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

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
      size: ('size' in file && typeof file.size === 'number') ? file.size : (file.metadata?.size || 0),
      created_at: file.created_at
    })));
  } catch (error) {
    console.error('Error checking bucket contents:', error);
  }
}

// Add this new function for FITS validation
export interface FitsValidationResult {
  valid: boolean;
  message: string;
  actual_type: string | null;
  expected_type: string | null;
  file_path: string | null;
  metadata: {
    exposure_time?: number;
    filter?: string;
    object?: string;
    date_obs?: string;
    instrument?: string;
    telescope?: string;
    gain?: number;
    temperature?: number;
    binning?: string;
    image_type?: string;
    observation_type?: string;
  } | null;
  warnings: string[];
}

export async function validateFitsFile(
  file: File, 
  projectId: string, 
  userId: string, 
  expectedType?: FileType
): Promise<FitsValidationResult> {
  try {
    if (!projectId || !userId) {
      throw new Error('projectId and userId are required');
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    formData.append('user_id', userId);
    if (expectedType) {
      formData.append('expected_type', expectedType);
    }
    const response = await fetch('http://localhost:8001/validate-fits', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.details || 'Validation failed');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error validating FITS file:', error);
    throw error;
  }
}

// Add a function to ensure project exists
export async function ensureProjectExists(projectId: string): Promise<void> {
  const client = checkSupabase();
  const { data: project, error } = await client
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error || !project) {
    // Create a default project if it doesn't exist
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }

    await client
      .from('projects')
      .insert([
        {
          id: projectId,
          user_id: user.id,
          title: 'Default Project',
          description: 'Created automatically for file uploads',
          created_at: new Date().toISOString()
        }
      ]);
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
    // Ensure project exists
    console.log('[uploadRawFrame] Ensuring project exists...');
    await ensureProjectExists(projectId);
    // Initialize Supabase client
    const client = checkSupabase();
    // Authenticate user
    console.log('[uploadRawFrame] Checking user authentication...');
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) {
      throw new Error('User must be authenticated to upload files');
    }
    console.log('[uploadRawFrame] User authenticated:', user.id);
    // Validate the FITS file
    console.log('[uploadRawFrame] Validating FITS file...');
    const validationResult = await validateFitsFile(file, projectId, user.id, fileType);
    console.log('[uploadRawFrame] Validation result:', validationResult);
    if (!validationResult.valid) {
      throw new Error(validationResult.message);
    }
    // Get project details to include project name in path
    const { data: project, error: projectError } = await client
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (projectError) {
      console.error('Error fetching project:', projectError);
      throw new Error(`Failed to fetch project: ${projectError.message}`);
    }
    if (!project) {
      throw new Error('Project not found. Please create a project first.');
    }
    // Upload the file to Supabase Storage
    const filePath = validationResult.file_path || `${user.id}/${projectId}/${fileType}/${file.name}`;
    const { data: uploadData, error: uploadError } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .upload(filePath, file, {
        metadata: validationResult.metadata || {},
        upsert: false
      });
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error('Failed to upload file');
    }
    console.log('File uploaded successfully to:', filePath);
    return filePath;
  } catch (error) {
    console.error('Error in uploadRawFrame:', error);
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

    // Check if the file exists first
    const { data: fileExists, error: checkError } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .list(filePath.split('/').slice(0, -1).join('/'));

    if (checkError) {
      console.error('[getFitsFileUrl] Error checking file existence:', checkError);
      throw checkError;
    }

    const fileName = filePath.split('/').pop();
    const exists = fileExists?.some(file => file.name === fileName);

    if (!exists) {
      console.error('[getFitsFileUrl] File not found in bucket:', filePath);
      throw new Error('File not found in bucket');
    }

    // Get the signed URL
    const { data, error } = await client.storage
      .from(STORAGE_BUCKETS.RAW_FRAMES)
      .createSignedUrl(filePath, 3600); // URL expires in 1 hour

    if (error) {
      console.error('[getFitsFileUrl] Error creating signed URL:', error);
      throw error;
    }

    if (!data?.signedUrl) {
      console.error('[getFitsFileUrl] No signed URL returned');
      throw new Error('Failed to generate signed URL');
    }

    console.log('[getFitsFileUrl] Successfully generated signed URL');
    return data.signedUrl;
  } catch (error) {
    console.error('[getFitsFileUrl] Error:', error);
    throw error;
  }
}

export interface StorageFile {
  name: string;
  path: string;
  size: number;
  created_at: string;
  type: FileType;
  metadata?: any;
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
    console.log('[getFilesByType] User authenticated:', userId);

    // Initialize the result object with empty arrays for each type
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

    // For each type, list files in the corresponding subfolder
    for (const type of Object.keys(result) as FileType[]) {
      const folderPath = `${userId}/${projectId}/${type}`;
      const { data: files, error } = await client.storage
        .from(STORAGE_BUCKETS.RAW_FRAMES)
        .list(folderPath);
      if (error) {
        // Only log error if folder doesn't exist, not a fatal error
        if (error.message && error.message.includes('The resource was not found')) {
          continue;
        }
        console.error(`[getFilesByType] Error listing files for type ${type}:`, error);
        continue;
      }
      if (files && Array.isArray(files)) {
        for (const file of files) {
          // Only include files, not folders
          if (file.name && !file.name.endsWith('/')) {
            result[type].push({
              name: file.name,
              path: `${folderPath}/${file.name}`,
              size: file.metadata?.size || 0,
              created_at: file.created_at,
              type: type,
              metadata: file.metadata
            });
          }
        }
      }
    }

    console.log('[getFilesByType] Final sorted files:', result);
    return result;
  } catch (error) {
    console.error('[getFilesByType] Error:', error);
    throw error;
  }
}