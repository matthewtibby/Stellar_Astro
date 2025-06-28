import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import { FileType, StorageFile } from '@/src/types/store';
import { extractTagsFromFitsHeader } from './storage.tagging';
import { STORAGE_BUCKETS, FILE_TYPE_FOLDERS } from './storage.constants';
import type { FitsValidationResult, UploadProgressCallback } from '@/src/types/storage.types';
import { ensureProjectExists, checkBucketContents } from './storage.project';
import { validateFitsFile } from './storage.validation';
import { uploadProfilePicture, downloadFile, deleteFitsFile, listProjectFiles, fileExists, getFitsFileUrl, getFilesByType, getFitsPreviewUrl } from './storage.files';

// Helper function to get Supabase client
const checkSupabase = () => {
  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch {
    throw new Error('Storage service is currently unavailable. Please try again later.');
  }
};

// List files in a project folder
// Removed duplicate implementation of listProjectFiles; use the imported version from storage.files.ts

// Add a function to check if a file exists in the bucket
// Removed duplicate implementation of fileExists; use the imported version from storage.files.ts

// Removed duplicate implementation of getFitsFileUrl; use the imported version from storage.files.ts

// Removed duplicate implementation of getFitsPreviewUrl; use the imported version from storage.files.ts

export type { StorageFile } from '@/src/types/store';
export { getFilesByType };