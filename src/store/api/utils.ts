import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';
import { API_ERROR_MESSAGES, HTTP_STATUS } from './config';

/**
 * Type guard to check if error is FetchBaseQueryError
 */
export function isFetchBaseQueryError(
  error: unknown
): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

/**
 * Type guard to check if error is SerializedError
 */
export function isSerializedError(error: unknown): error is SerializedError {
  return typeof error === 'object' && error != null && 'message' in error;
}

/**
 * Extract error message from RTK Query error
 */
export function getErrorMessage(error: unknown): string {
  if (isFetchBaseQueryError(error)) {
    // Handle FetchBaseQueryError
    if ('error' in error) {
      return error.error;
    }
    
    if ('data' in error && typeof error.data === 'object' && error.data !== null) {
      const data = error.data as any;
      return data.message || data.error || API_ERROR_MESSAGES.UNKNOWN;
    }

    // Handle HTTP status codes
    switch (error.status) {
      case HTTP_STATUS.UNAUTHORIZED:
        return API_ERROR_MESSAGES.UNAUTHORIZED;
      case HTTP_STATUS.FORBIDDEN:
        return API_ERROR_MESSAGES.FORBIDDEN;
      case HTTP_STATUS.NOT_FOUND:
        return API_ERROR_MESSAGES.NOT_FOUND;
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.BAD_GATEWAY:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        return API_ERROR_MESSAGES.SERVER_ERROR;
      case HTTP_STATUS.GATEWAY_TIMEOUT:
        return API_ERROR_MESSAGES.TIMEOUT;
      case 'FETCH_ERROR':
        return API_ERROR_MESSAGES.NETWORK_ERROR;
      case 'PARSING_ERROR':
        return 'Error parsing server response';
      case 'TIMEOUT_ERROR':
        return API_ERROR_MESSAGES.TIMEOUT;
      default:
        return API_ERROR_MESSAGES.UNKNOWN;
    }
  }

  if (isSerializedError(error)) {
    return error.message || API_ERROR_MESSAGES.UNKNOWN;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return API_ERROR_MESSAGES.UNKNOWN;
}

/**
 * Build query string from params object
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Format date for API requests
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString();
}

/**
 * Parse date from API response
 */
export function parseDateFromApi(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Debounce function for search queries
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Transform API response with pagination
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function transformPaginatedResponse<T>(
  response: any
): PaginatedResponse<T> {
  const { data, total, page, limit } = response;
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Create optimistic update helper
 */
export function createOptimisticUpdate<T>(
  updateFn: (draft: T, payload: any) => void
) {
  return async (
    payload: any,
    { dispatch, queryFulfilled }: any,
    apiUtil: any,
    queryKey: string,
    queryArgs?: any
  ) => {
    const patchResult = dispatch(
      apiUtil.updateQueryData(queryKey, queryArgs, (draft: T) => {
        updateFn(draft, payload);
      })
    );
    
    try {
      await queryFulfilled;
    } catch {
      patchResult.undo();
    }
  };
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Check if response is successful
 */
export function isSuccessResponse(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Transform form data for multipart requests
 */
export function createFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          formData.append(`${key}[${index}]`, item);
        });
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });
  
  return formData;
}
