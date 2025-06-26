import { FileType } from '../types';
import { INITIAL_FILE_TYPES, FILE_SIZE_THRESHOLD, FILE_SIZE_UNITS } from '../constants';

/**
 * Service class for utility functions
 * Handles file type detection, formatting, and display helpers
 */
export class UtilityService {
  /**
   * Get file type from file path
   */
  static getFileTypeFromPath(path: string): FileType | null {
    const type = path.split('/')[0] as FileType;
    return INITIAL_FILE_TYPES.includes(type) ? type : null;
  }

  /**
   * Get display name for file type
   */
  static getFileTypeDisplay(type: FileType | null): string {
    if (!type) return 'Unknown';
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Format file size in human-readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(FILE_SIZE_THRESHOLD));
    return parseFloat((bytes / Math.pow(FILE_SIZE_THRESHOLD, i)).toFixed(2)) + ' ' + FILE_SIZE_UNITS[i];
  }

  /**
   * Format date string to locale string
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  /**
   * Get file extension from path
   */
  static getFileExtension(path: string): string {
    return path.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if file is a FITS file
   */
  static isFitsFile(path: string): boolean {
    const extension = this.getFileExtension(path);
    return extension === 'fits' || extension === 'fit';
  }

  /**
   * Generate file display info
   */
  static getFileDisplayInfo(file: { 
    name: string; 
    size: number; 
    created_at: string; 
    path: string; 
  }): {
    name: string;
    sizeFormatted: string;
    dateFormatted: string;
    typeDisplay: string;
  } {
    const fileType = this.getFileTypeFromPath(file.path);
    
    return {
      name: file.name,
      sizeFormatted: this.formatFileSize(file.size),
      dateFormatted: this.formatDate(file.created_at),
      typeDisplay: this.getFileTypeDisplay(fileType)
    };
  }
} 