/**
 * API Configuration - PRODUCTION
 * Production Domain: hometuitionapp.com
 */

// Environment detection
const isProduction = process.env.NODE_ENV === 'production' || true;

// Platform detection
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
const isWeb = typeof window !== 'undefined' && !isReactNative;

// PRODUCTION API URL - Production Domain
const PRODUCTION_API_URL = 'https://hometuitionapp.com/api';

// PRODUCTION WebSocket URL
const PRODUCTION_SOCKET_URL = 'https://hometuitionapp.com';

// CDN URL (for static assets if needed)
const CDN_URL = 'https://hometuitionapp.com';

// API Base URL configuration
export const getApiBaseUrl = (): string => {
  // Always use production URL on EC2
  if (isProduction) {
    return PRODUCTION_API_URL;
  }
  
  // Fallback for development
  return 'http://localhost:5000/api';
};

// Socket.IO URL
export const getSocketUrl = (): string => {
  if (isProduction) {
    return PRODUCTION_SOCKET_URL;
  }
  return 'http://localhost:5000';
};

// API Configuration Object
export const apiConfig = {
  baseURL: getApiBaseUrl(),
  socketURL: getSocketUrl(),
  cdnURL: CDN_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
};

// API Endpoints
export const endpoints = {
  auth: {
    sendOTP: '/auth/send-otp',
    verifyOTP: '/auth/verify-otp',
    me: '/auth/me',
    logout: '/auth/logout',
  },
  teachers: {
    list: '/teachers',
    detail: (id: string) => `/teachers/${id}`,
  },
  requirements: {
    create: '/requirements',
    list: (parentId: string) => `/requirements/${parentId}`,
  },
  leads: {
    unlock: '/leads/unlock',
  },
  payments: {
    history: '/payments',
  },
  health: '/health',
};

// CORS Origins (must match backend)
export const allowedOrigins = [
  'https://hometuitionapp.com',
  'https://www.hometuitionapp.com',
  'http://localhost:3000',
  'http://localhost:19006',
];

export default apiConfig;
