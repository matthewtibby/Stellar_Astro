import { StorageFile, PreviewCache } from '../types';
import { ERROR_MESSAGES, PREVIEW_SERVICE_URL } from '../constants';
import { getFitsFileUrl } from '../../../utils/storage';

/**
 * Service class for handling file preview operations
 * Manages preview generation, caching, and cleanup
 */
export class PreviewService {
  /**
   * Generate a preview for a FITS file
   */
  static async generatePreview(file: StorageFile): Promise<string> {
    try {
      const fileUrl = await getFitsFileUrl(file.path);
      const previewResponse = await fetch(PREVIEW_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileUrl),
      });
      
      if (!previewResponse.ok) {
        const errorText = await previewResponse.text();
        throw new Error(`${ERROR_MESSAGES.PREVIEW_FAILED} ${errorText}`);
      }
      
      const imageBlob = await previewResponse.blob();
      return URL.createObjectURL(imageBlob);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.PREVIEW_FAILED;
      throw new Error(errorMessage);
    }
  }

  /**
   * Get preview URL with caching support
   */
  static async getPreviewUrl(
    file: StorageFile, 
    previewCache: PreviewCache
  ): Promise<string> {
    // Check cache first
    if (previewCache[file.path]) {
      return previewCache[file.path];
    }

    // Generate new preview
    return await this.generatePreview(file);
  }

  /**
   * Update preview cache with new URL
   */
  static updateCache(
    previewCache: PreviewCache, 
    filePath: string, 
    imageUrl: string
  ): PreviewCache {
    return { ...previewCache, [filePath]: imageUrl };
  }

  /**
   * Clean up preview URL
   */
  static cleanupPreview(previewUrl: string | null): void {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }

  /**
   * Clean up all cached preview URLs
   */
  static cleanupAllPreviews(previewCache: PreviewCache): void {
    Object.values(previewCache).forEach(url => URL.revokeObjectURL(url));
  }
} 