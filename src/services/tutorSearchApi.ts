import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SearchTutor {
  _id: string;
  basicDetails: {
    fullName: string;
    profilePhoto?: string;
    gender?: 'male' | 'female' | 'other';
    languages?: string[];
  };
  teachingDetails: {
    subjects: string[];
    classes: string[];
    teachingModes: string[];
    specialization?: string;
  };
  education: {
    highestQualification: string;
    degree: string;
    university: string;
  };
  locationAvailability: {
    city: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    teachingRadius: number;
    preferredAreas?: string[];
  };
  pricingRevenue: {
    hourlyRate: number;
    monthlyRate: number;
    experienceYears: number;
  };
  stats: {
    averageRating: number;
    totalReviews: number;
    totalStudents: number;
    responseRate: number;
    responseTime?: string;
  };
  bio?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResponse {
  tutors: SearchTutor[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  query: string;
}

export interface SearchSuggestionsResponse {
  suggestions: string[];
}

export interface PopularSearch {
  term: string;
  type: 'subject' | 'city' | 'qualification';
  count: number;
}

export interface PopularSearchesResponse {
  popularSearches: PopularSearch[];
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

// ── API Functions ────────────────────────────────────────────────────────────

/**
 * GET /api/tutors/search?q={query}&page={page}&limit={limit}
 * Search tutors by text query with pagination
 */
export const searchTutors = async (
  token: string,
  query: string,
  page: number = 1,
  limit: number = 20,
  abortSignal?: AbortSignal
): Promise<SearchResponse> => {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  params.append('page', String(page));
  params.append('limit', String(limit));

  const response = await fetch(`${API_BASE_URL}/tutors/search?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal: abortSignal,
  });
  return handleResponse<SearchResponse>(response);
};

/**
 * GET /api/tutors/search/suggestions?q={query}
 * Get search suggestions as user types
 */
export const getSearchSuggestions = async (
  token: string,
  query: string,
  abortSignal?: AbortSignal
): Promise<SearchSuggestionsResponse> => {
  const params = new URLSearchParams();
  params.append('q', query);

  const response = await fetch(`${API_BASE_URL}/tutors/search/suggestions?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal: abortSignal,
  });
  return handleResponse<SearchSuggestionsResponse>(response);
};

/**
 * GET /api/tutors/search/popular
 * Get popular search terms
 */
export const getPopularSearches = async (
  token: string,
  abortSignal?: AbortSignal
): Promise<PopularSearchesResponse> => {
  const response = await fetch(`${API_BASE_URL}/tutors/search/popular`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal: abortSignal,
  });
  return handleResponse<PopularSearchesResponse>(response);
};
