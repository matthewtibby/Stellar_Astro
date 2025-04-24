export type FileType = 'light' | 'dark' | 'flat' | 'bias';

export interface FitsValidationResult {
  valid: boolean;
  message?: string;
  metadata?: {
    [key: string]: any;
  };
} 