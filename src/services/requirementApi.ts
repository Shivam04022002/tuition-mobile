import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ── Types ─────────────────────────────────────────────────────────────────────

export type RequirementStatus = 'active' | 'closed' | 'expired' | 'paused';

export interface ParentRequirement {
  _id: string;
  requirementId: string;
  parentId: string;
  status: RequirementStatus;
  isActive: boolean;

  studentDetails: {
    studentName: string;
    age: number;
    grade: string;
    board: string;
    schoolName: string;
    genderPreference: 'any' | 'male' | 'female';
  };

  subjects: string[];
  tuitionType: 'home' | 'online' | 'group' | 'crash';

  location: {
    city: string;
    address?: string;
    pincode?: string;
    teachingRadius?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  schedule: {
    daysPerWeek: string;
    preferredTimings: string[];
    startDate?: string;
  };

  budget: {
    minAmount: number;
    maxAmount: number;
    negotiationAllowed?: boolean;
  };

  tutorPreferences?: string;
  totalMatches: number;
  views: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequirementCounts {
  total: number;
  active: number;
  closed: number;
  expired: number;
  paused: number;
}

export interface RequirementsResponse {
  requirements: ParentRequirement[];
  total: number;
  counts: RequirementCounts;
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
  const body = await response.json();
  return body.data as T;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * GET /api/parents/my-requirements
 * Returns all requirements belonging to the authenticated parent.
 */
export const getRequirements = async (token: string): Promise<RequirementsResponse> => {
  const response = await fetch(`${API_BASE_URL}/parents/my-requirements`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<RequirementsResponse>(response);
};

/**
 * GET /api/parents/requirements/:id
 * Returns a single requirement by its MongoDB _id.
 */
export const getRequirementById = async (
  token: string,
  id: string,
): Promise<{ requirement: ParentRequirement }> => {
  const response = await fetch(`${API_BASE_URL}/parents/requirements/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<{ requirement: ParentRequirement }>(response);
};

/**
 * DELETE /api/parents/requirements/:id
 * Soft-deletes a requirement (sets isActive=false).
 * Only works on non-active requirements.
 */
export const deleteRequirement = async (token: string, id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/parents/requirements/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) throw new Error('Unauthorized');
  if (response.status === 400) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || 'Cannot delete this requirement');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || `Delete failed (${response.status})`);
  }
};

/**
 * PATCH /api/parents/requirements/:id/status
 * Updates the status of a requirement (pause / resume).
 */
export const updateRequirementStatus = async (
  token: string,
  id: string,
  status: 'active' | 'paused',
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/parents/requirements/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    },
  );
  if (response.status === 401) throw new Error('Unauthorized');
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || `Status update failed (${response.status})`);
  }
};

/**
 * Pause an active requirement.
 */
export const pauseRequirement = (token: string, id: string): Promise<void> =>
  updateRequirementStatus(token, id, 'paused');

/**
 * Resume a paused requirement.
 */
export const resumeRequirement = (token: string, id: string): Promise<void> =>
  updateRequirementStatus(token, id, 'active');

/**
 * POST /api/parents/requirements/:id/close
 * Closes an active requirement.
 */
export const closeRequirement = async (token: string, id: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/parents/requirements/${encodeURIComponent(id)}/close`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 401) throw new Error('Unauthorized');
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || `Close failed (${response.status})`);
  }
};
