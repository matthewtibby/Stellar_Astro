import { FITSParser } from 'jsfitsio';

export interface FITSValidationResult {
  isValid: boolean;
  warnings: string[];
  metadata: {
    exposureTime?: number;
    gain?: number;
    temperature?: number;
    filter?: string;
    observationDate?: string;
    frameType?: string;
  };
}

export async function validateFITSFile(file: File): Promise<FITSValidationResult> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/validate-fits', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        isValid: false,
        warnings: [error.error || 'Failed to validate file'],
        metadata: {}
      };
    }

    return await response.json();
  } catch (error) {
    return {
      isValid: false,
      warnings: ['Error validating file: ' + (error instanceof Error ? error.message : 'Unknown error')],
      metadata: {}
    };
  }
}

export function getFrameTypeFromFilename(filename: string): string {
  filename = filename.toLowerCase();
  if (filename.includes('light')) return 'light';
  if (filename.includes('dark')) return 'dark';
  if (filename.includes('flat')) return 'flat';
  if (filename.includes('bias')) return 'bias';
  return 'unknown';
}

export async function validateFileBatch(files: File[]): Promise<Map<string, FITSValidationResult>> {
  const results = new Map<string, FITSValidationResult>();
  
  for (const file of files) {
    results.set(file.name, await validateFITSFile(file));
  }
  
  return results;
} 