import { apiConfig } from '../config/api';
import {
  ParentDashboardData,
  DashboardStats,
  QuickStats,
  DashboardRequirement,
  DashboardApplication,
  DashboardRecommendedTutor,
  DashboardDemoClass,
  DashboardShortlistedTutor,
  getQuickStats as getQuickStatsApi,
} from './parentDashboardApi';

const API_BASE_URL = apiConfig.baseURL;

// ── Helper ────────────────────────────────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) throw new Error('Unauthorized');
  if (!response.ok) {
    let msg = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      msg = body?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  const body = await response.json();
  return body.data as T;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ── parentDashboardService ────────────────────────────────────────────────────

/**
 * Centralised service for all Parent Dashboard API calls.
 * All future dashboard API calls must go through this service.
 */
export const parentDashboardService = {
  /**
   * GET /api/dashboard/parent
   * Fetches the full dashboard payload in a single request.
   */
  getDashboardData: async (token: string): Promise<ParentDashboardData> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/parent`, {
      method: 'GET',
      headers: authHeaders(token),
    });
    return handleResponse<ParentDashboardData>(response);
  },

  /**
   * GET /api/dashboard/parent/stats
   * Fetches only the quick-stats section.
   * Falls back to full dashboard endpoint if a dedicated route is unavailable.
   */
  getQuickStats: async (token: string): Promise<QuickStats> => {
    return getQuickStatsApi(token);
  },

  /**
   * GET /api/dashboard/parent/requirements
   * Fetches active requirements for the dashboard.
   */
  getActiveRequirements: async (token: string): Promise<DashboardRequirement[]> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/parent/requirements`, {
      method: 'GET',
      headers: authHeaders(token),
    });
    if (response.status === 404) {
      const full = await parentDashboardService.getDashboardData(token);
      return full.activeRequirements;
    }
    return handleResponse<DashboardRequirement[]>(response);
  },

  /**
   * GET /api/dashboard/parent/applications
   * Fetches recent tutor applications for the dashboard.
   */
  getRecentApplications: async (token: string): Promise<DashboardApplication[]> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/parent/applications`, {
      method: 'GET',
      headers: authHeaders(token),
    });
    if (response.status === 404) {
      const full = await parentDashboardService.getDashboardData(token);
      return full.applications;
    }
    return handleResponse<DashboardApplication[]>(response);
  },

  /**
   * GET /api/dashboard/parent/recommended
   * Fetches personalised tutor recommendations for the dashboard.
   */
  getRecommendedTutors: async (token: string): Promise<DashboardRecommendedTutor[]> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/parent/recommended`, {
      method: 'GET',
      headers: authHeaders(token),
    });
    if (response.status === 404) {
      const full = await parentDashboardService.getDashboardData(token);
      return full.recommendedTutors;
    }
    return handleResponse<DashboardRecommendedTutor[]>(response);
  },

  /**
   * GET /api/dashboard/parent/demos
   * Fetches upcoming demo classes for the dashboard.
   */
  getUpcomingDemos: async (token: string): Promise<DashboardDemoClass[]> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/parent/demos`, {
      method: 'GET',
      headers: authHeaders(token),
    });
    if (response.status === 404) {
      const full = await parentDashboardService.getDashboardData(token);
      return full.upcomingDemos;
    }
    return handleResponse<DashboardDemoClass[]>(response);
  },
};

// Re-export types so consumers only need to import from this service
export type {
  ParentDashboardData,
  DashboardStats,
  QuickStats,
  DashboardRequirement,
  DashboardApplication,
  DashboardRecommendedTutor,
  DashboardDemoClass,
  DashboardShortlistedTutor,
};
