import { StorageFile, FileType } from '../types';

/**
 * Service class for handling file filtering and search operations
 * Manages tag filtering, search functionality, and file organization
 */
export class FilterService {
  /**
   * Filter files by tag
   */
  static filterFilesByTag(files: StorageFile[], tagFilter: string): StorageFile[] {
    if (!tagFilter.trim()) {
      return files;
    }

    return files.filter(file => {
      const tags = Array.isArray((file as unknown as { tags?: unknown }).tags) 
        ? (file as unknown as { tags: string[] }).tags 
        : [];
      
      return tags.some((tag: string) => 
        tag.toLowerCase().includes(tagFilter.toLowerCase())
      );
    });
  }

  /**
   * Filter files by search term (searches in file name)
   */
  static filterFilesBySearch(files: StorageFile[], searchTerm: string): StorageFile[] {
    if (!searchTerm.trim()) {
      return files;
    }

    return files.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Apply both tag and search filters
   */
  static applyFilters(
    files: StorageFile[], 
    tagFilter: string, 
    searchTerm: string
  ): StorageFile[] {
    let filteredFiles = files;
    
    if (tagFilter.trim()) {
      filteredFiles = this.filterFilesByTag(filteredFiles, tagFilter);
    }
    
    if (searchTerm.trim()) {
      filteredFiles = this.filterFilesBySearch(filteredFiles, searchTerm);
    }
    
    return filteredFiles;
  }

  /**
   * Get file count for a specific type
   */
  static getFileCount(files: StorageFile[]): number {
    return files.length;
  }

  /**
   * Check if files exist for a type
   */
  static hasFiles(files: StorageFile[]): boolean {
    return files.length > 0;
  }
} 