export const ADVANCED_DARK_STACKING_METHODS = [
  'adaptive',
  'median', 
  'mean',
  'minmax',
  'winsorized',
  'linear_fit'
];

export const TEMPERATURE_TOLERANCE = 2.0;
export const GAIN_TOLERANCE = 0.1;
export const REQUIRED_METADATA_FIELDS = ['camera', 'binning', 'gain'];

// Default values
export const DEFAULT_SUPERDARK_STACKING = 'median';
export const DEFAULT_SUPERDARK_SIGMA = '3.0';

// UI Constants
export const MAX_UPLOAD_DISPLAY_HEIGHT = '45vh';
export const UPLOAD_PROGRESS_HEIGHT = '32rem';
