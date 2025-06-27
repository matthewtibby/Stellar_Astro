import type { FileType } from '@/src/types/store';
import type { FitsValidationResult } from '@/src/types/storage.types';
import { handleError, ValidationError } from './errorHandling';

export async function validateFitsFile(
  file: File, 
  projectId: string, 
  userId: string, 
  expectedType?: FileType
): Promise<FitsValidationResult> {
  try {
    if (!projectId || !userId) {
      throw new ValidationError('projectId and userId are required');
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    formData.append('user_id', userId);
    
    if (expectedType) {
      formData.append('expected_type', expectedType);
    }

    const response = await fetch('http://localhost:8000/validate-fits', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ValidationError(errorData.message || errorData.details || 'Validation failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    const appError = handleError(error);
    // Optionally log: console.error(appError.message);
    throw appError;
  }
} 