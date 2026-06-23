/**
 * API Configuration
 * Production-ready configuration for hometuitionapp.com deployment
 */

// Declare global __DEV__ for React Native
declare const __DEV__: boolean;

// Platform detection for React Native
const Platform = {
  OS: typeof navigator !== 'undefined' && navigator.product === 'ReactNative' 
    ? 'ios' // Default to iOS detection for web
    : 'web',
  select: (obj: { ios?: any; android?: any; web?: any; default?: any }) => {
    return obj.ios || obj.default;
  }
};

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || (typeof __DEV__ !== 'undefined' && __DEV__);

// API Base URL configuration
// Priority: 1. Environment variable 2. Production default 3. Development default
const getApiBaseUrl = (): string => {
  // Production domain — https://hometuitionapp.com
  if (isProduction) {
    return 'https://hometuitionapp.com/api';
  }
  
  // Development / non-production builds also use the domain
  // Fallback IP: http://15.206.92.25:5000/api
  return 'https://hometuitionapp.com/api';
  
  // ==========================================
  // EMULATOR/SIMULATOR URLs (Keep for reference)
  // ==========================================
  // Android emulator uses 10.0.2.2 to access host machine
  // if (Platform.OS === 'android') {
  //   return 'http://10.0.2.2:5000/api';
  // }
  
  // iOS simulator and others
  // return 'http://localhost:5000/api';
};

// Socket.IO configuration
const getSocketUrl = (): string => {
  if (isProduction) {
    return 'https://hometuitionapp.com';
  }
  
  return 'https://hometuitionapp.com';
};

// CDN URL
const getCdnUrl = (): string => {
  return 'https://hometuitionapp.com';
};

// API Configuration Object
export const apiConfig = {
  // Base URL for all API requests
  baseURL: getApiBaseUrl(),
  
  // Socket.IO URL
  socketURL: getSocketUrl(),
  
  // CDN URL for static assets
  cdnURL: getCdnUrl(),
  
  // Request timeout in milliseconds
  timeout: 30000,
  
  // Request headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Whether to include credentials (cookies) in requests
  withCredentials: true,
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000,
  },
};

// Endpoint paths
export const endpoints = {
  // Authentication
  auth: {
    sendOTP: '/auth/send-otp',
    verifyOTP: '/auth/verify-otp',
    refreshToken: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  
  // Teachers
  teachers: {
    list: '/teachers',
    detail: (id: string) => `/teachers/${id}`,
    search: '/teachers/search',
    bySubject: '/teachers/by-subject',
    byLocation: '/teachers/by-location',
  },
  
  // Requirements (Parent)
  requirements: {
    create: '/requirements',
    list: (parentId: string) => `/requirements/${parentId}`,
    detail: (id: string) => `/requirements/${id}`,
    update: (id: string) => `/requirements/${id}`,
    delete: (id: string) => `/requirements/${id}`,
  },
  
  // Lead Management
  leads: {
    unlock: '/leads/unlock',
    myLeads: '/leads/my-leads',
    stats: '/leads/stats',
  },
  
  // Payments
  payments: {
    create: '/payments',
    verify: '/payments/verify',
    refund: '/payments/refund',
    history: '/payments/history',
    invoice: (id: string) => `/payments/${id}/invoice`,
  },
  
  // Uploads
  uploads: {
    image: '/uploads/image',
    document: '/uploads/document',
    video: '/uploads/video',
  },
  
  // Health Check
  health: '/health',
};

// Error handling configuration
export const errorConfig = {
  // Network error messages
  networkError: 'Network error. Please check your internet connection.',
  timeoutError: 'Request timeout. Please try again.',
  serverError: 'Server error. Please try again later.',
  unauthorized: 'Session expired. Please login again.',
  forbidden: 'You do not have permission to perform this action.',
  notFound: 'Resource not found.',
  
  // Retryable status codes
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  
  // Don't retry these status codes
  noRetryStatusCodes: [400, 401, 403, 404, 422],
};

// CORS configuration for production
export const corsConfig = {
  // Origins that are allowed (should match backend configuration)
  allowedOrigins: isProduction
    ? [
        'https://hometuitionapp.com',
        'https://www.hometuitionapp.com',
      ]
    : [
        'http://localhost:5000',
        'http://10.0.2.2:5000',
        'http://10.167.235.60:5000', // ← PHYSICAL DEVICE LAN IP
        'http://192.168.1.100:5000', // Common LAN IP range
      ],
  
  // Credentials mode
  credentials: 'include' as RequestCredentials,
};

// Helper function to get full API URL
export const getFullUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${apiConfig.baseURL}${cleanEndpoint}`;
};

// Helper function to check if we're in production
export const isProd = (): boolean => isProduction;

// Helper function to get environment name
export const getEnvironment = (): string => {
  if (isProduction) return 'production';
  if (typeof __DEV__ !== 'undefined' && __DEV__) return 'development';
  return 'unknown';
};

export default apiConfig;
