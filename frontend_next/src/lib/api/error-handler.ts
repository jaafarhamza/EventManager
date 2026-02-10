import { AxiosError } from 'axios';
import type { ApiError } from '@/types/api.types';

/**
 * Check if error is an Axios error
 */
export const isAxiosError = (error: unknown): error is AxiosError => {
  return (error as AxiosError).isAxiosError === true;
};

/**
 * Extract error message from API error response
 */
export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;

    if (apiError?.message) {
      // Handle array of messages
      if (Array.isArray(apiError.message)) {
        return apiError.message.join(', ');
      }
      return apiError.message;
    }

    // Fallback to error message
    return error.message || 'An unexpected error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

/**
 * Get error status code
 */
export const getErrorStatusCode = (error: unknown): number | null => {
  if (isAxiosError(error)) {
    return error.response?.status || null;
  }
  return null;
};

/**
 * Check if error is a specific status code
 */
export const isErrorStatus = (error: unknown, statusCode: number): boolean => {
  return getErrorStatusCode(error) === statusCode;
};

/**
 * Check if error is a validation error (400)
 */
export const isValidationError = (error: unknown): boolean => {
  return isErrorStatus(error, 400);
};

/**
 * Check if error is an authentication error (401)
 */
export const isAuthError = (error: unknown): boolean => {
  return isErrorStatus(error, 401);
};

/**
 * Check if error is a forbidden error (403)
 */
export const isForbiddenError = (error: unknown): boolean => {
  return isErrorStatus(error, 403);
};

/**
 * Check if error is a not found error (404)
 */
export const isNotFoundError = (error: unknown): boolean => {
  return isErrorStatus(error, 404);
};

/**
 * Check if error is a conflict error (409)
 */
export const isConflictError = (error: unknown): boolean => {
  return isErrorStatus(error, 409);
};

/**
 * Check if error is a rate limit error (429)
 */
export const isRateLimitError = (error: unknown): boolean => {
  return isErrorStatus(error, 429);
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (isAxiosError(error)) {
    return !error.response && error.message === 'Network Error';
  }
  return false;
};

/**
 * Get validation errors as an object
 */
export const getValidationErrors = (error: unknown): Record<string, string> | null => {
  if (isAxiosError(error) && isValidationError(error)) {
    const apiError = error.response?.data as ApiError;

    if (apiError?.message && Array.isArray(apiError.message)) {
      // Convert array of messages to object
      const errors: Record<string, string> = {};
      apiError.message.forEach((msg) => {
        // Try to extract field name from message
        const match = msg.match(/^(\w+):/);
        if (match) {
          const field = match[1];
          errors[field] = msg.replace(`${field}: `, '');
        } else {
          errors.general = msg;
        }
      });
      return errors;
    }
  }
  return null;
};

/**
 * Format error for display
 */
export const formatError = (error: unknown): {
  message: string;
  statusCode: number | null;
  type: string;
} => {
  const message = getErrorMessage(error);
  const statusCode = getErrorStatusCode(error);

  let type = 'error';
  if (isValidationError(error)) type = 'validation';
  else if (isAuthError(error)) type = 'auth';
  else if (isForbiddenError(error)) type = 'forbidden';
  else if (isNotFoundError(error)) type = 'notFound';
  else if (isConflictError(error)) type = 'conflict';
  else if (isRateLimitError(error)) type = 'rateLimit';
  else if (isNetworkError(error)) type = 'network';

  return { message, statusCode, type };
};
