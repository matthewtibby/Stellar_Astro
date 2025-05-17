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

export async function validateFITSFile(file: File, projectId: string, userId: string): Promise<FITSValidationResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('project_id', projectId);
  formData.append('user_id', userId);

  try {
    const response = await fetch('/api/validate-fits', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      let warning = error.error || 'Failed to validate file';
      if (typeof warning !== 'string') warning = JSON.stringify(warning);
      return {
        isValid: false,
        warnings: [warning],
        metadata: {}
      };
    }

    const data = await response.json();
    return {
      isValid: data.valid,
      warnings: data.warnings || [],
      metadata: data.metadata || {},
      // Optionally pass through other fields if needed
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isValid: false,
      warnings: ['Error validating file: ' + msg],
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

export async function validateFileBatch(files: File[], projectId: string, userId: string): Promise<Map<string, FITSValidationResult>> {
  const results = new Map<string, FITSValidationResult>();
  for (const file of files) {
    results.set(file.name, await validateFITSFile(file, projectId, userId));
  }
  return results;
} 