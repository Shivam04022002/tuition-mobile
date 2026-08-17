import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface LocationConfig {
  isActive: boolean;
  hasApiKey: boolean;
  updatedAt: string | null;
}

export interface LocationConfigInput {
  isActive: boolean;
  apiKey?: string; // omit/blank to keep the currently saved key
  clear?: boolean; // wipes the saved config back to unconfigured
}

export interface LocationConfigResponse {
  success: boolean;
  data: LocationConfig;
  message?: string;
}

export interface ApiResult {
  success: boolean;
  message: string;
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

async function adminFetch<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Request failed with status ${response.status}`);
  }

  return result as T;
}

// ─────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────

export const getLocationConfig = (token: string): Promise<LocationConfigResponse> =>
  adminFetch('/location-config', token);

export const updateLocationConfig = (token: string, input: LocationConfigInput): Promise<LocationConfigResponse> =>
  adminFetch('/location-config', token, { method: 'PUT', body: JSON.stringify(input) });

export const testLocationConfig = (token: string, apiKey?: string): Promise<ApiResult> =>
  adminFetch('/location-config/test', token, { method: 'POST', body: JSON.stringify({ apiKey }) });
