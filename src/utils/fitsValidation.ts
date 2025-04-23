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

  try {
    const response = await fetch('http://localhost:8001/validate-fits', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to validate FITS file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error validating FITS file:', error);
    throw error;
  }
} 