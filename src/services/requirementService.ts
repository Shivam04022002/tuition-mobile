import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RequirementFormData {
  studentName: string;
  grade: string;
  board: string;
  subjects: string[];
  tuitionType: 'home' | 'online' | 'group' | 'crash';
  address: string;
  city: string;
  state: string;
  pincode: string;
  budgetMin: string;
  budgetMax: string;
  preferredDays: string[];
  preferredTimings: string[];
  notes: string;
}

export interface RequirementRecord {
  _id: string;
  requirementId: string;
  studentDetails: {
    studentName: string;
    grade: string;
    board: string;
  };
  subjects: string[];
  tuitionType: 'home' | 'online' | 'group' | 'crash';
  location: {
    address: string;
    city: string;
    state?: string;
    pincode: string;
  };
  budget: {
    minAmount: number;
    maxAmount: number;
  };
  schedule: {
    daysPerWeek: string;
    preferredTimings: string[];
  };
  tutorPreferences?: string;
  status: 'active' | 'closed' | 'expired' | 'paused';
  totalMatches: number;
  createdAt: string;
  updatedAt: string;
}

export interface MyRequirementsResponse {
  requirements: RequirementRecord[];
  total: number;
  counts: {
    total: number;
    active: number;
    closed: number;
    expired: number;
    paused: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

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

// ── requirementService ────────────────────────────────────────────────────────

export const requirementService = {
  /**
   * POST /api/parents/requirements
   * Creates a new requirement for the authenticated parent.
   */
  createRequirement: async (
    token: string,
    formData: RequirementFormData,
  ): Promise<{ requirementId: string; requirement: RequirementRecord }> => {
    const response = await fetch(`${API_BASE_URL}/parents/requirements`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(formData),
    });
    return handleResponse(response);
  },

  /**
   * PUT /api/parents/requirements/:id
   * Updates an existing requirement owned by the authenticated parent.
   */
  updateRequirement: async (
    token: string,
    id: string,
    formData: Partial<RequirementFormData>,
  ): Promise<{ requirement: RequirementRecord }> => {
    const response = await fetch(`${API_BASE_URL}/parents/requirements/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(formData),
    });
    return handleResponse(response);
  },

  /**
   * GET /api/parents/my-requirements
   * Returns all requirements owned by the authenticated parent.
   */
  getMyRequirements: async (token: string): Promise<MyRequirementsResponse> => {
    const response = await fetch(`${API_BASE_URL}/parents/my-requirements`, {
      method: 'GET',
      headers: authHeaders(token),
    });
    return handleResponse(response);
  },

  /**
   * GET /api/parents/requirements/:id
   * Returns a single requirement by ID (public-safe projection).
   */
  getRequirementById: async (
    token: string,
    id: string,
  ): Promise<{ requirement: RequirementRecord }> => {
    const response = await fetch(`${API_BASE_URL}/parents/requirements/${id}`, {
      method: 'GET',
      headers: authHeaders(token),
    });
    return handleResponse(response);
  },

  /**
   * POST /api/parents/requirements/:id/close
   * Closes an active requirement.
   */
  closeRequirement: async (
    token: string,
    id: string,
    reason?: string,
  ): Promise<{ requirement: RequirementRecord }> => {
    const response = await fetch(`${API_BASE_URL}/parents/requirements/${id}/close`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  },

  /**
   * DELETE /api/parents/requirements/:id
   * Soft-deletes a non-active requirement.
   */
  deleteRequirement: async (token: string, id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/parents/requirements/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    await handleResponse(response);
  },
};
