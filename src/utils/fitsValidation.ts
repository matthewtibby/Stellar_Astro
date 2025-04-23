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
      headers: {
        'Accept': 'application/json',
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      // If the response is not ok but contains our custom error format
      if (data.valid !== undefined) {
        return data;
      }
      throw new Error(data.detail || 'Failed to validate FITS file');
    }

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