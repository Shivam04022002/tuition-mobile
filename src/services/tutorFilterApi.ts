import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FilterParams {
  // Multi-select filters
  subjects?: string[];
  classes?: string[];
  languages?: string[];
  
  // Single value filters
  mode?: 'online' | 'offline' | 'hybrid';
  gender?: 'male' | 'female' | 'any';
  city?: string;
  area?: string;
  
  // Range filters
  experience?: '0-2' | '3-5' | '6-10' | '10+';
  rating?: '4.5' | '4.0' | '3.5';
  minBudget?: number;
  maxBudget?: number;
  
  // Availability
  availability?: ('weekdays' | 'weekends' | 'morning' | 'afternoon' | 'evening')[];
  
  // Pagination
  page?: number;
  limit?: number;
}

export interface FilterTutor {
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

export interface FilterResponse {
  tutors: FilterTutor[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  appliedFilters: {
    subjects?: string[];
    classes?: string[];
    mode?: string;
    gender?: string;
    experience?: string;
    rating?: string;
    budget?: { min?: number; max?: number };
    languages?: string[];
    availability?: string[];
    city?: string;
    area?: string;
  };
}

export interface FilterOptions {
  subjects: string[];
  classes: string[];
  cities: string[];
  languages: string[];
  teachingModes: string[];
  experienceRanges: {
    value: string;
    label: string;
    min: number;
    max: number;
  }[];
  ratingOptions: {
    value: string;
    label: string;
    min: number;
  }[];
  availabilityOptions: {
    value: string;
    label: string;
  }[];
  genderOptions: {
    value: string;
    label: string;
  }[];
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

function buildFilterQueryString(params: FilterParams): string {
  const queryParams = new URLSearchParams();
  
  if (params.subjects?.length) queryParams.append('subjects', params.subjects.join(','));
  if (params.classes?.length) queryParams.append('classes', params.classes.join(','));
  if (params.languages?.length) queryParams.append('languages', params.languages.join(','));
  if (params.mode) queryParams.append('mode', params.mode);
  if (params.gender && params.gender !== 'any') queryParams.append('gender', params.gender);
  if (params.city) queryParams.append('city', params.city);
  if (params.area) queryParams.append('area', params.area);
  if (params.experience) queryParams.append('experience', params.experience);
  if (params.rating) queryParams.append('rating', params.rating);
  if (params.minBudget !== undefined) queryParams.append('minBudget', String(params.minBudget));
  if (params.maxBudget !== undefined) queryParams.append('maxBudget', String(params.maxBudget));
  if (params.availability?.length) queryParams.append('availability', params.availability.join(','));
  if (params.page) queryParams.append('page', String(params.page));
  if (params.limit) queryParams.append('limit', String(params.limit));
  
  const query = queryParams.toString();
  return query ? `?${query}` : '';
}

// ── API Functions ────────────────────────────────────────────────────────────

/**
 * GET /api/tutors/filter
 * Filter tutors by multiple criteria
 */
export const filterTutors = async (
  token: string,
  params: FilterParams,
  abortSignal?: AbortSignal
): Promise<FilterResponse> => {
  const query = buildFilterQueryString(params);
  
  const response = await fetch(`${API_BASE_URL}/tutors/filter${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal: abortSignal,
  });
  return handleResponse<FilterResponse>(response);
};

/**
 * GET /api/tutors/filter/options
 * Get available filter options from backend
 */
export const getFilterOptions = async (
  token: string,
  abortSignal?: AbortSignal
): Promise<FilterOptions> => {
  const response = await fetch(`${API_BASE_URL}/tutors/filter/options`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal: abortSignal,
  });
  return handleResponse<FilterOptions>(response);
};

// ── Utility Functions ─────────────────────────────────────────────────────────

/**
 * Count active filters
 */
export const countActiveFilters = (params: FilterParams): number => {
  let count = 0;
  if (params.subjects?.length) count++;
  if (params.classes?.length) count++;
  if (params.mode) count++;
  if (params.gender && params.gender !== 'any') count++;
  if (params.experience) count++;
  if (params.rating) count++;
  if (params.minBudget !== undefined || params.maxBudget !== undefined) count++;
  if (params.languages?.length) count++;
  if (params.availability?.length) count++;
  if (params.city) count++;
  if (params.area) count++;
  return count;
};

/**
 * Get filter label for display
 */
export const getFilterLabel = (key: string, value: string | string[] | number): string => {
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    if (value.length === 1) return String(value[0]);
    return `${value[0]} +${value.length - 1}`;
  }
  return String(value);
};
