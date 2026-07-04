import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface MailService {
  key: string;
  label: string;
  enabled: boolean;
}

export interface SmtpConfig {
  isActive: boolean;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  host: string;
  port: number;
  encryption: 'none' | 'SSL/TLS' | 'STARTTLS';
  authRequired: boolean;
  username: string;
  hasPassword: boolean;
  services: MailService[];
  updatedAt: string | null;
}

export interface SmtpConfigInput {
  isActive: boolean;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  host: string;
  port: number;
  encryption: 'none' | 'SSL/TLS' | 'STARTTLS';
  authRequired: boolean;
  username: string;
  password?: string; // omit/blank to keep the currently saved password
  services?: Array<{ key: string; enabled: boolean }>;
  clear?: boolean; // wipes the saved config back to unconfigured, skips validation
}

export interface SmtpConfigResponse {
  success: boolean;
  data: SmtpConfig;
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

export const getSmtpConfig = (token: string): Promise<SmtpConfigResponse> =>
  adminFetch('/smtp-config', token);

export const updateSmtpConfig = (token: string, input: SmtpConfigInput): Promise<SmtpConfigResponse> =>
  adminFetch('/smtp-config', token, { method: 'PUT', body: JSON.stringify(input) });

export const sendTestEmail = (
  token: string,
  input: SmtpConfigInput & { to: string }
): Promise<ApiResult> =>
  adminFetch('/smtp-config/test', token, { method: 'POST', body: JSON.stringify(input) });
