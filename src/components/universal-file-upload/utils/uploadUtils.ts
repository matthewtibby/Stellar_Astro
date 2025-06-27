// Utility functions extracted from UniversalFileUpload.tsx

/**
 * Format file size in human-readable units
 */
export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

/**
 * Save files to localStorage
 */
export const saveFilesToLocalStorage = (projectId: string, files: any) => {
  try {
    localStorage.setItem(`files_${projectId}`, JSON.stringify(files));
  } catch (error) {
    console.error('Error saving files to localStorage:', error);
  }
};

/**
 * Load files from localStorage
 */
export const loadFilesFromLocalStorage = (projectId: string) => {
  try {
    const savedFiles = localStorage.getItem(`files_${projectId}`);
    if (savedFiles) {
      return JSON.parse(savedFiles);
    }
  } catch (error) {
    console.error('Error loading files from localStorage:', error);
  }
  return null;
}; 