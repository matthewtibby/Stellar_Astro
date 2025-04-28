export type FileType = 'light' | 'dark' | 'flat' | 'bias';

export interface FitsMetadata {
  [key: string]: any;
}

export interface FitsValidationResult {
  valid: boolean;
  message?: string;
  metadata?: FitsMetadata;
  actual_type?: string;
  file_path?: string;
} 