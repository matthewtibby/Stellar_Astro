import { createBrowserClient } from '../../../lib/supabase';
import { supabaseUrl, supabaseAnonKey } from '../../../lib/supabase';
import { DarkFileWithMetadata } from '../types/superdark.types';

export class FileUploadService {
  /**
   * Upload file to temporary storage in Supabase
   */
  static async uploadToTempStorage(file: File, userId: string): Promise<string> {
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const tempPath = `temp/${userId}/${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('raw-frames')
      .upload(tempPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return tempPath;
  }

  /**
   * Clean up all temporary files for a user
   */
  static async cleanupTempFiles(tempFiles: DarkFileWithMetadata[], userId?: string): Promise<void> {
    if (!userId || tempFiles.length === 0) return;
    
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
    
    for (const tempFile of tempFiles) {
      try {
        await supabase.storage
          .from('raw-frames')
          .remove([tempFile.path]);
        console.log(`[Cleanup] Deleted temp file: ${tempFile.path}`);
      } catch (error) {
        console.error(`[Cleanup] Failed to delete temp file ${tempFile.path}:`, error);
      }
    }
  }

  /**
   * Delete a specific temporary file
   */
  static async deleteTempFile(tempFile: DarkFileWithMetadata, userId?: string): Promise<void> {
    if (!userId) return;
    
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
    
    try {
      await supabase.storage
        .from('raw-frames')
        .remove([tempFile.path]);
      
      console.log(`[Delete] Successfully deleted temp file: ${tempFile.path}`);
    } catch (error) {
      console.error(`[Delete] Failed to delete temp file ${tempFile.path}:`, error);
      throw new Error(`Failed to delete ${tempFile.name}: ${error}`);
    }
  }
}
