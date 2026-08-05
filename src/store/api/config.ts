/**
 * API Configuration
 * Central place for API-related constants and utilities
 */

/**
 * API Base URLs for different environments
 */
export const API_BASE_URLS = {
  development: 'http://localhost:3000/api',
  staging: 'https://staging-api.example.com/api',
  production: 'https://api.example.com/api',
} as const;

/**
 * Get the appropriate API base URL based on environment
 */
export const getApiBaseUrl = (): string => {
  const env = import.meta.env.MODE as keyof typeof API_BASE_URLS;
  return import.meta.env.VITE_API_BASE_URL || API_BASE_URLS[env] || API_BASE_URLS.development;
};

/**
 * API Endpoints
 * Centralized endpoint definitions
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },

  // Products
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
    SEARCH: '/products/search',
    BULK_DELETE: '/products/bulk-delete',
  },

  // Add more endpoint groups as needed
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },

  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
  },

  ECOMMERCE: {
    ABANDONED_CARTS: '/ecommerce/abandoned-carts',
    CARTS: '/ecommerce/carts',
    CART_BY_ID: (id: string) => `/ecommerce/carts/${id}`,
    ABANDONED_CART_BY_ID: (id: string) => `/ecommerce/abandoned-carts/${id}`,
    RECOVER_CART: (id: string) => `/ecommerce/abandoned-carts/${id}/recover`,
    SEND_REMINDER: (id: string) => `/ecommerce/abandoned-carts/${id}/send-reminder`,
    ABANDONED_CART_SETTINGS: '/ecommerce/abandoned-carts/settings',
    STATS: '/ecommerce/stats',
  },

  DASHBOARD: {
    WIDGETS: '/dashboard/widgets',
    WIDGET_BY_ID: (id: string) => `/dashboard/widgets/${id}`,
    REORDER: '/dashboard/widgets/reorder',
    DATA: '/dashboard/data',
    WIDGET_DATA: (id: string) => `/dashboard/widgets/${id}/data`,
    METRICS_AVAILABLE: '/dashboard/metrics/available',
    LAYOUT: '/dashboard/layout',
    SEED: '/dashboard/seed',
  },
} as const;

/**
 * API Error Messages
 */
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT: 'Request timeout. Please try again.',
  UNKNOWN: 'An unknown error occurred.',
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Request timeout in milliseconds
 */
export const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryCondition: (error: any) => {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  },
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  DEFAULT_TTL: 60, // 60 seconds
  LONG_TTL: 300, // 5 minutes
  SHORT_TTL: 30, // 30 seconds
} as const;
