export interface DarkFileWithMetadata {
  name: string;
  path: string;
  project: string;
  projectId: string;
  camera: string;
  binning: string;
  gain: string | number;
  temp: string | number;
  exposure: string | number;
  isTemporary?: boolean; // Flag to indicate temp files
}

export interface FileMetadata {
  path: string;
  type: string;
  metadata: {
    instrument?: string;
    binning?: string;
    gain?: number;
    temperature?: number;
    exposure_time?: number;
    // Keep the old fields for backward compatibility
    INSTRUME?: string;
    XBINNING?: number;
    YBINNING?: number;
    GAIN?: number;
    'CCD-TEMP'?: number;
    EXPTIME?: number;
  };
  validation?: {
    has_required_metadata: boolean;
    missing_fields: string[];
    warnings: string[];
    quality_score: number;
  };
  file_size_mb?: number;
  image_dimensions?: { width: number; height: number };
}

export interface CreateSuperdarkUIProps {
  showSuperdarkModal: boolean;
  setShowSuperdarkModal: (show: boolean) => void;
  userId: string;
  projectId: string;
  onSuperdarkCreated?: () => void;
}

// Upload-related types
export type UploadStatus = 'uploading' | 'validating' | 'complete' | 'error' | 'warning';
export type UploadProgress = {[fileName: string]: UploadStatus};
export type CompatibilityWarnings = {[fileName: string]: string[]};

// Validation result types
export interface ValidationResult {
  isCompatible: boolean;
  warnings: string[];
}

export interface GroupingResult {
  groups: Record<string, DarkFileWithMetadata[]>;
  bestKey: string;
  bestGroup: DarkFileWithMetadata[];
}

// Job submission types
export interface SuperdarkJobPayload {
  name: string;
  selectedDarkPaths: string[];
  stackingMethod: string;
  sigmaThreshold: string;
  userId: string;
  tempFiles: string[]; // Include temp files for cleanup
}

export interface JobResult {
  jobId: string;
  estimatedTime: string;
}

// Project types (for compatibility)
export interface Project {
  id: string;
  title: string;
}
