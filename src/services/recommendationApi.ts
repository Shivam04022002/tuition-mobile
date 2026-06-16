import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ── Types ─────────────────────────────────────────────────────────────────────

export type SortOption = 'match' | 'rating' | 'experience' | 'nearest' | 'newest';
export type TeachingMode = 'online' | 'offline' | 'hybrid';

export interface RecommendedTutor {
  _id: string;
  matchId: string;
  matchPercentage: number;
  teacherId: {
    _id: string;
    profile?: {
      teacherName?: string;
    };
  };
  teacherProfileId: {
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
    };
    bio?: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
  };
  breakdown: {
    subjectScore: number;
    classScore: number;
    locationScore: number;
    modeScore: number;
    experienceScore: number;
    ratingScore: number;
  };
  requirementId?: string;
  status: 'recommended' | 'viewed' | 'applied' | 'shortlisted' | 'rejected' | 'hired' | 'expired';
  viewedAt?: string;
  distanceKm?: number;
}

export interface RecommendationFilters {
  requirementId?: string;
  subject?: string;
  class?: string;
  gender?: 'male' | 'female' | 'other';
  minExperience?: number;
  minRating?: number;
  mode?: TeachingMode;
  city?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface RecommendationsResponse {
  tutors: RecommendedTutor[];
  pagination: PaginationInfo;
  filters: {
    sortBy: SortOption;
    applied: RecommendationFilters;
  };
}

export interface RequirementRecommendationsResponse {
  tutors: RecommendedTutor[];
  requirement: {
    _id: string;
    requirementId: string;
    studentDetails: {
      studentName: string;
      grade: string;
      board: string;
    };
    subjects: string[];
    tuitionType: string;
    location: {
      city: string;
      address?: string;
    };
  };
  total: number;
}

export interface FullMatchAnalysis {
  subject: {
    requirementSubjects: string[];
    teacherSubjects: string[];
    matchedSubjects: string[];
    score: number;
    weight: number;
  };
  class: {
    requirementClass: string;
    teacherClasses: string[];
    isMatch: boolean;
    score: number;
    weight: number;
  };
  location: {
    distance: number;
    isWithinRadius: boolean;
    score: number;
    weight: number;
  };
  mode: {
    requirementMode: string;
    teacherModes: string[];
    isMatch: boolean;
    score: number;
    weight: number;
  };
  experience: {
    years: number;
    score: number;
    weight: number;
  };
  rating: {
    value: number;
    totalReviews: number;
    score: number;
    weight: number;
  };
}

export interface RecommendationDetail extends RecommendedTutor {
  requirement?: RequirementRecommendationsResponse['requirement'];
  fullMatchAnalysis: FullMatchAnalysis;
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

function buildQueryString(filters: RecommendationFilters & { sortBy?: SortOption; page?: number; limit?: number }): string {
  const params = new URLSearchParams();
  
  if (filters.requirementId) params.append('requirementId', filters.requirementId);
  if (filters.subject) params.append('subject', filters.subject);
  if (filters.class) params.append('class', filters.class);
  if (filters.gender) params.append('gender', filters.gender);
  if (filters.minExperience !== undefined) params.append('minExperience', String(filters.minExperience));
  if (filters.minRating !== undefined) params.append('minRating', String(filters.minRating));
  if (filters.mode) params.append('mode', filters.mode);
  if (filters.city) params.append('city', filters.city);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  
  const query = params.toString();
  return query ? `?${query}` : '';
}

// ── API Functions ────────────────────────────────────────────────────────────

/**
 * GET /api/recommendations/tutors
 * Get all recommended tutors with optional filtering and sorting.
 */
export const getRecommendedTutors = async (
  token: string,
  filters: RecommendationFilters & { sortBy?: SortOption; page?: number; limit?: number } = {}
): Promise<RecommendationsResponse> => {
  const query = buildQueryString(filters);
  const response = await fetch(`${API_BASE_URL}/recommendations/tutors${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<RecommendationsResponse>(response);
};

/**
 * GET /api/recommendations/tutors/:id
 * Get detailed information about a specific tutor recommendation.
 */
export const getRecommendationById = async (
  token: string,
  id: string
): Promise<{ recommendation: RecommendationDetail }> => {
  const response = await fetch(`${API_BASE_URL}/recommendations/tutors/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<{ recommendation: RecommendationDetail }>(response);
};

/**
 * GET /api/recommendations/requirements/:requirementId
 * Get recommendations specifically for a requirement.
 */
export const getRecommendationsByRequirement = async (
  token: string,
  requirementId: string,
  filters: Omit<RecommendationFilters, 'requirementId'> & { sortBy?: SortOption } = {}
): Promise<RequirementRecommendationsResponse> => {
  const query = buildQueryString({ ...filters });
  const response = await fetch(
    `${API_BASE_URL}/recommendations/requirements/${encodeURIComponent(requirementId)}${query}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return handleResponse<RequirementRecommendationsResponse>(response);
};

/**
 * POST /api/recommendations/tutors/:matchId/track
 * Track parent interactions with tutors (viewed, contacted, shortlisted, demo_requested).
 */
export const trackTutorInteraction = async (
  token: string,
  matchId: string,
  action: 'viewed' | 'contacted' | 'shortlisted' | 'demo_requested'
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/recommendations/tutors/${encodeURIComponent(matchId)}/track`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    }
  );

  if (response.status === 401) throw new Error('Unauthorized');
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || `Track failed (${response.status})`);
  }
};

/**
 * Helper to calculate match percentage from breakdown.
 * Uses Sprint 1.6 formula:
 * - Subject Match = 40%
 * - Class Match = 20%
 * - Location Match = 15%
 * - Mode Match = 10%
 * - Experience = 10%
 * - Rating = 5%
 */
export const calculateMatchPercentage = (breakdown: RecommendedTutor['breakdown']): number => {
  const weights = {
    subject: 0.40,
    class: 0.20,
    location: 0.15,
    mode: 0.10,
    experience: 0.10,
    rating: 0.05,
  };

  const weightedScore =
    breakdown.subjectScore * weights.subject +
    breakdown.classScore * weights.class +
    breakdown.locationScore * weights.location +
    breakdown.modeScore * weights.mode +
    breakdown.experienceScore * weights.experience +
    breakdown.ratingScore * weights.rating;

  return Math.round(weightedScore);
};
