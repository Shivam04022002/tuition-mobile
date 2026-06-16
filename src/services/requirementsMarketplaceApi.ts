import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RequirementListItem {
  _id: string;
  requirementId: string;
  studentDetails: {
    studentName: string;
    grade: string;
    board: string;
    age?: number;
    genderPreference?: 'any' | 'male' | 'female';
  };
  subjects: string[];
  tuitionType: 'home' | 'online' | 'group' | 'crash';
  location: {
    city: string;
    pincode: string;
    address?: string;
  };
  schedule: {
    daysPerWeek: string;
    preferredTimings: string[];
    startDate?: string;
  };
  budget: {
    minAmount: number;
    maxAmount: number;
    negotiationAllowed: boolean;
  };
  status: string;
  priority: string;
  totalMatches: number;
  views: number;
  matchScore: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface RequirementDetail extends RequirementListItem {
  tutorPreferences?: string;
  languagePreference?: string[];
  applicationStatus?: string | null;
  isSaved?: boolean;
  isHidden?: boolean;
}

export interface MatchBreakdownItem {
  score: number;
  rawScore: number;
  isMatch?: boolean;
  matchedSubjects?: string[];
  requirementSubjects?: string[];
  requirementGrade?: string;
  requirementBoard?: string;
  requirementCity?: string;
  teacherCity?: string;
  requirementMin?: number;
  requirementMax?: number;
  teacherRate?: number;
  requirementMode?: string;
  teacherModes?: string[];
  overlap?: string[];
  requirementTimings?: string[];
}

export interface MatchAnalysis {
  overall: number;
  breakdown: {
    subject: MatchBreakdownItem;
    class: MatchBreakdownItem;
    board: MatchBreakdownItem;
    location: MatchBreakdownItem;
    budget: MatchBreakdownItem;
    mode: MatchBreakdownItem;
    availability: MatchBreakdownItem;
  };
  competition: {
    total: number;
    shortlisted: number;
    rejected: number;
    selected: number;
    myPosition: number | null;
  };
}

export interface RequirementsFilters {
  search?: string;
  subject?: string;
  board?: string;
  grade?: string;
  city?: string;
  area?: string;
  minBudget?: string;
  maxBudget?: string;
  mode?: string;
  minMatch?: string;
  sortBy?: 'newest' | 'match' | 'budget';
  postedDays?: string;
}

export interface RequirementsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RequirementsResponse {
  requirements: RequirementListItem[];
  pagination: RequirementsPagination;
}

export interface RecommendedResponse {
  requirements: RequirementListItem[];
  total: number;
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
 * GET /api/teachers/requirements
 * Paginated + filtered list of all active requirements with on-the-fly match scores.
 */
export const getAvailableRequirements = async (
  token: string,
  filters: RequirementsFilters = {},
  page: number = 1,
  limit: number = 15,
): Promise<RequirementsResponse> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filters.search?.trim())    params.set('search',     filters.search.trim());
  if (filters.subject?.trim())   params.set('subject',    filters.subject.trim());
  if (filters.board?.trim())     params.set('board',      filters.board.trim());
  if (filters.grade?.trim())     params.set('grade',      filters.grade.trim());
  if (filters.city?.trim())      params.set('city',       filters.city.trim());
  if (filters.area?.trim())      params.set('area',       filters.area.trim());
  if (filters.minBudget?.trim()) params.set('minBudget',  filters.minBudget.trim());
  if (filters.maxBudget?.trim()) params.set('maxBudget',  filters.maxBudget.trim());
  if (filters.mode?.trim())      params.set('mode',       filters.mode.trim());
  if (filters.minMatch?.trim())  params.set('minMatch',   filters.minMatch.trim());
  if (filters.sortBy)            params.set('sortBy',     filters.sortBy);
  if (filters.postedDays?.trim()) params.set('postedDays', filters.postedDays.trim());

  const response = await fetch(`${API_BASE_URL}/teachers/requirements?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<RequirementsResponse>(response);
};

/**
 * GET /api/teachers/requirements/recommended
 * Best-match requirements for the teacher (score ≥ 60, subject + city pre-filtered).
 */
export const getRecommendedRequirements = async (
  token: string,
  limit: number = 10,
): Promise<RecommendedResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/teachers/requirements/recommended?limit=${limit}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
  return handleResponse<RecommendedResponse>(response);
};

/**
 * GET /api/teachers/requirements/:id
 * Single requirement detail with match score + application status + isSaved + isHidden.
 */
export const getRequirementDetail = async (
  token: string,
  requirementId: string,
): Promise<RequirementDetail> => {
  const response = await fetch(
    `${API_BASE_URL}/teachers/requirements/${requirementId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
  return handleResponse<RequirementDetail>(response);
};

/**
 * GET /api/teachers/requirements/:id/match-analysis
 * Detailed per-dimension match analysis + competition stats.
 */
export const getMatchAnalysis = async (
  token: string,
  requirementId: string,
): Promise<MatchAnalysis> => {
  const response = await fetch(
    `${API_BASE_URL}/teachers/requirements/${requirementId}/match-analysis`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
  return handleResponse<MatchAnalysis>(response);
};

/**
 * POST /api/teachers/requirements/:id/save
 * Bookmark a requirement for the teacher (server-persisted).
 */
export const saveRequirement = async (
  token: string,
  requirementId: string,
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/teachers/requirements/${requirementId}/save`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
  await handleResponse<{ message: string }>(response);
};

/**
 * DELETE /api/teachers/requirements/:id/save
 * Remove saved bookmark.
 */
export const unsaveRequirement = async (
  token: string,
  requirementId: string,
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/teachers/requirements/${requirementId}/save`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
  await handleResponse<{ message: string }>(response);
};

/**
 * POST /api/teachers/requirements/:id/hide
 * Hide a requirement so it no longer appears in the marketplace.
 */
export const hideRequirement = async (
  token: string,
  requirementId: string,
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/teachers/requirements/${requirementId}/hide`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
  await handleResponse<{ message: string }>(response);
};
