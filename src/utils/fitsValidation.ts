export interface FitsValidationResult {
  valid: boolean;
  message: string;
  actual_type: string | null;
  expected_type: string | null;
}

export async function validateFitsFile(
  file: File,
  expectedType: string | null = null
): Promise<FitsValidationResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (expectedType) {
    formData.append('expected_type', expectedType);
  }

  const API_URL = process.env.NEXT_PUBLIC_PYTHON_WORKER_URL || 'http://localhost:8001';

  try {
    const response = await fetch(`${API_URL}/validate-fits`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        valid: false,
        message: errorData.message || 'Failed to validate FITS file',
        actual_type: null,
        expected_type: expectedType
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error validating FITS file:', error);
    return {
      valid: false,
      message: error instanceof Error ? error.message : 'Failed to validate FITS file',
      actual_type: null,
      expected_type: expectedType
    };
  }
} 