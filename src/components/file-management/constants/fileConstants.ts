import { FileType } from '../../../types/store';

// File type constants
export const INITIAL_FILE_TYPES: FileType[] = ['light', 'dark', 'bias', 'flat'];

export const REQUIRED_CALIBRATION_TYPES: FileType[] = ['dark', 'bias', 'flat'];

// File type display labels
export const FILE_TYPE_LABELS: Record<FileType, string> = {
  'light': 'Light Frames',
  'dark': 'Dark Frames',
  'bias': 'Bias Frames',
  'flat': 'Flat Frames',
  'master-dark': 'Master Dark',
  'master-bias': 'Master Bias',
  'master-flat': 'Master Flat',
  'calibrated': 'Calibrated',
  'stacked': 'Stacked',
  'aligned': 'Aligned',
  'pre-processed': 'Pre-Processed',
  'post-processed': 'Post-Processed'
};

// File size formatting constants
export const FILE_SIZE_UNITS = ['Bytes', 'KB', 'MB', 'GB'];
export const FILE_SIZE_THRESHOLD = 1024;

// Dropzone configuration
export const DROPZONE_ACCEPT_TYPES = {
  'application/fits': ['.fits', '.fit', '.FIT', '.FITS', '.RAW'],
};

// Preview service configuration
export const PREVIEW_SERVICE_URL = 'http://localhost:8000/preview-fits';

// UI text constants
export const UI_TEXT = {
  TITLE: 'File Management',
  REFRESH_TOOLTIP: 'Refresh files',
  PREVIEW_TOOLTIP: 'Preview',
  DOWNLOAD_TOOLTIP: 'Download',
  DELETE_TOOLTIP: 'Delete',
  EMPTY_STATE_TITLE: 'No files found in this category',
  EMPTY_STATE_SUBTITLE: 'Upload some files to get started',
  LOADING_TEXT: 'Loading files...',
  PREVIEW_LOADING: 'Generating preview...',
  PREVIEW_TITLE: 'File Preview',
  PREVIEW_ERROR_TITLE: 'Preview Error',
  SEARCH_PLACEHOLDER: 'Search files...',
  TAG_FILTER_PLACEHOLDER: 'Filter by tag (e.g. NGC, telescope, filter...)',
  CLEAR_BUTTON: 'Clear',
  DISMISS_BUTTON: 'Dismiss',
  PROCEED_TO_CALIBRATION: 'Proceed to Calibration',
  CALIBRATION_WARNING_TITLE: 'Missing Calibration Frames',
  CALIBRATION_WARNING_MESSAGE: 'You are missing the following calibration frames:',
  CALIBRATION_WARNING_QUESTION: 'Calibration may not be optimal without these frames. Do you want to proceed anyway?',
  CANCEL_BUTTON: 'Cancel',
  PROCEED_ANYWAY_BUTTON: 'Proceed Anyway',
  CLOSE_BUTTON: 'Close'
};

// Error messages
export const ERROR_MESSAGES = {
  NO_LIGHT_FRAMES: 'Cannot progress to calibration: No light frames found. Please upload light frames first.',
  DOWNLOAD_ERROR: 'Error downloading file:',
  DELETE_ERROR: 'Error deleting file:',
  PREVIEW_FAILED: 'Failed to generate preview:',
  VALIDATION_FAILED: 'Validation failed'
};

// CSS classes for reuse
export const CSS_CLASSES = {
  CONTAINER: 'space-y-4',
  NOTIFICATION: 'p-4 bg-yellow-900/50 text-yellow-200 rounded-md border border-yellow-800',
  MAIN_PANEL: 'bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden',
  HEADER: 'p-4 border-b border-gray-700 flex justify-between items-center',
  TITLE: 'text-lg font-semibold text-white',
  LOADING_CONTAINER: 'p-8 text-center',
  LOADING_SPINNER: 'animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4',
  SIDEBAR: 'w-64 border-r border-gray-700 p-4',
  CONTENT: 'flex-1 p-4',
  TAB_ACTIVE: 'bg-blue-600 text-white',
  TAB_INACTIVE: 'bg-gray-800 text-gray-400 hover:bg-gray-700',
  TAB_BASE: 'w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
  INPUT_BASE: 'px-3 py-2 rounded-md border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
  SEARCH_INPUT: 'w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
  BUTTON_PRIMARY: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors',
  BUTTON_SECONDARY: 'px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors',
  BUTTON_SMALL: 'ml-2 px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600',
  FILE_ITEM: 'flex flex-col p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-800/70 transition-colors',
  TAG_BADGE: 'bg-blue-700 text-blue-100 text-xs px-2 py-0.5 rounded-full mr-1 mb-1',
  MODAL_OVERLAY: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50',
  MODAL_CONTENT: 'bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4',
  MODAL_LARGE: 'bg-gray-900 p-4 rounded-lg max-w-4xl w-full mx-4',
  ICON_BUTTON: 'p-1 text-gray-400 hover:text-white transition-colors',
  ICON_BUTTON_DANGER: 'p-1 text-gray-400 hover:text-red-500 transition-colors'
}; 