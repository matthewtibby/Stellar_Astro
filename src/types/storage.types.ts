// Types for storage utilities
import { FileType } from '@/src/types/store';

export type UploadProgressCallback = (progress: number) => void;

export interface FitsValidationResult {
  valid: boolean;
  message: string;
  actual_type: string | null;
  expected_type: string | null;
  file_path: string | null;
  metadata: {
    exposure_time?: number;
    filter?: string;
    object?: string;
    date_obs?: string;
    instrument?: string;
    telescope?: string;
    gain?: number;
    temperature?: number;
    binning?: string;
    image_type?: string;
    observation_type?: string;
  } | null;
  warnings: string[];
}

// Add any other types/interfaces from storage.ts as needed 