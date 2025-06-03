export interface FITSValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

// Calls the API endpoint to validate a FITS file and extract metadata
export async function validateFITSFile(file: File, projectId: string, userId: string): Promise<FITSValidationResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('project_id', projectId);
  formData.append('user_id', userId);
  try {
    const response = await fetch('http://localhost:8000/validate-fits', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      return { isValid: false, error: errorData.message || 'Validation failed' };
    }
    const data = await response.json();
    return {
      isValid: data.valid ?? true,
      warnings: data.warnings || [],
      metadata: data.metadata || {},
    };
  } catch (e) {
    return { isValid: false, error: 'API validation failed' };
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