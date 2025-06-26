import { StorageFile, FilesByType, FileType } from '../types';
import { ERROR_MESSAGES } from '../constants';
import { getFilesByType, getFitsFileUrl, deleteFitsFile } from '../../../utils/storage';

/**
 * Service class for handling file operations
 * Manages file loading, downloading, deleting, and refreshing
 */
export class FileOperationsService {
  /**
   * Load files by type for a project
   */
  static async loadFiles(projectId: string): Promise<FilesByType> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    try {
      const files = await getFilesByType(projectId);
      return files;
    } catch (error) {
      console.error('Error loading files:', error);
      throw error;
    }
  }

  /**
   * Download a file by opening it in a new tab
   */
  static async downloadFile(file: StorageFile): Promise<void> {
    try {
      const url = await getFitsFileUrl(file.path);
      window.open(url, '_blank');
    } catch (error) {
      console.error(ERROR_MESSAGES.DOWNLOAD_ERROR, error);
      throw error;
    }
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(file: StorageFile): Promise<void> {
    try {
      await deleteFitsFile(file.path);
    } catch (error) {
      console.error(ERROR_MESSAGES.DELETE_ERROR, error);
      throw error;
    }
  }

  /**
   * Refresh files by reloading them
   */
  static async refreshFiles(
    projectId: string,
    onRefresh?: () => void
  ): Promise<FilesByType> {
    const files = await this.loadFiles(projectId);
    if (onRefresh) {
      onRefresh();
    }
    return files;
  }
} 