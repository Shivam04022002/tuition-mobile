import { apiConfig } from '../config/api';
import {
  DashboardData,
  DashboardStats,
  TutorMatch,
  TeacherApplication,
  DemoClass,
} from './teacherApi';

const API_BASE_URL = apiConfig.baseURL;

// ── Re-export types for convenience ──────────────────────────────────────────
export type { DashboardData, DashboardStats, TutorMatch, TeacherApplication, DemoClass };

// ── Response wrapper ──────────────────────────────────────────────────────────
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) throw new Error('Unauthorized');
  if (response.status === 404) throw new Error('Not found');
  if (!response.ok) {
    let msg = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      msg = body?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  const body: ApiResponse<T> = await response.json();
  return body.data;
}

// ── Teacher Dashboard ─────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/teacher
 * Returns aggregated teacher dashboard: stats + matches + applications + demos + activeStudents
 */
export const fetchTeacherDashboard = async (token: string): Promise<DashboardData> => {
  const response = await fetch(`${API_BASE_URL}/dashboard/teacher`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<DashboardData>(response);
};

/**
 * GET /api/matches/teacher?status=recommended
 * Returns matching leads for the teacher
 */
export const fetchTeacherMatches = async (
  token: string,
  status?: string,
): Promise<TutorMatch[]> => {
  const url = status
    ? `${API_BASE_URL}/matches/teacher?status=${status}`
    : `${API_BASE_URL}/matches/teacher`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse<{ matches: TutorMatch[] }>(response);
  return data?.matches || [];
};

/**
 * GET /api/applications/teacher
 * Returns applications sent by the teacher
 */
export const fetchTeacherApplications = async (
  token: string,
  status?: string,
): Promise<TeacherApplication[]> => {
  const url = status
    ? `${API_BASE_URL}/applications/teacher?status=${status}`
    : `${API_BASE_URL}/applications/teacher`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse<{ applications: TeacherApplication[] }>(response);
  return data?.applications || [];
};

/**
 * GET /api/demos/teacher?status=scheduled
 * Returns upcoming demo classes for the teacher
 */
export const fetchTeacherDemos = async (
  token: string,
  status?: string,
): Promise<DemoClass[]> => {
  const url = status
    ? `${API_BASE_URL}/demos/teacher?status=${status}`
    : `${API_BASE_URL}/demos/teacher`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse<{ demos: DemoClass[] }>(response);
  return data?.demos || [];
};

/**
 * POST /api/applications/apply/:requirementId
 * Apply to a tuition requirement
 */
export const applyToLead = async (
  token: string,
  requirementId: string,
  payload?: { message?: string; proposedFee?: number; proposedSchedule?: any },
): Promise<{ applicationId: string }> => {
  const response = await fetch(`${API_BASE_URL}/applications/apply/${requirementId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload || {}),
  });
  if (response.status === 409) throw new Error('Already applied to this requirement');
  return handleResponse<{ applicationId: string }>(response);
};
