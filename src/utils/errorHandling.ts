import { PostgrestError } from '@supabase/supabase-js';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
<<<<<<< HEAD
    public details?: any
=======
    public details?: unknown
>>>>>>> calibration
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
<<<<<<< HEAD
  constructor(message: string, details?: any) {
=======
  constructor(message: string, details?: unknown) {
>>>>>>> calibration
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`, 'RESOURCE_NOT_FOUND', 404);
    this.name = 'ResourceNotFoundError';
  }
}

export class FileError extends AppError {
<<<<<<< HEAD
  constructor(message: string, details?: any) {
=======
  constructor(message: string, details?: unknown) {
>>>>>>> calibration
    super(message, 'FILE_ERROR', 400, details);
    this.name = 'FileError';
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof PostgrestError) {
    switch (error.code) {
      case '23505': // Unique violation
        return new ValidationError('Resource already exists', error);
      case '23503': // Foreign key violation
        return new ValidationError('Invalid reference', error);
      case '42P01': // Table does not exist
        return new AppError('Database error', 'DATABASE_ERROR', 500, error);
      default:
        return new AppError('Database error', 'DATABASE_ERROR', 500, error);
    }
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, error);
  }

  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500);
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function isResourceNotFoundError(error: unknown): error is ResourceNotFoundError {
  return error instanceof ResourceNotFoundError;
}

export function isFileError(error: unknown): error is FileError {
  return error instanceof FileError;
} 