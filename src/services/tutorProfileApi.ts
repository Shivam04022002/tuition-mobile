import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TutorProfileData {
  _id: string;
  basicDetails: {
    fullName: string;
    profilePhoto?: string;
    gender?: 'male' | 'female' | 'other';
    languages?: string[];
    mobileNumber?: string;
    email?: string;
  };
  education: {
    highestQualification: string;
    degree: string;
    university: string;
    yearOfCompletion?: number;
    certifications?: Array<{
      name: string;
      issuer: string;
      year: number;
      certificateUrl?: string;
    }>;
    status?: 'completed' | 'pursuing';
  };
  teachingDetails: {
    subjects: string[];
    classes: string[];
    boards?: string[];
    specialization?: string;
    teachingModes: string[];
    groupTuitionOption?: boolean;
  };
  locationAvailability: {
    city: string;
    address?: string;
    preferredAreas?: string[];
    availableDays?: string[];
    availableTimeSlots?: string[];
    teachingRadius?: number;
  };
  pricingRevenue: {
    hourlyRate: number;
    monthlyRate: number;
    experienceYears: number;
  };
  stats: {
    totalStudents: number;
    activeStudents: number;
    completedClasses: number;
    averageRating: number;
    totalReviews: number;
    responseRate: number;
    responseTime?: string;
  };
  bio?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isVerified: boolean;
  createdAt: string;
}

export interface TutorGalleryData {
  certificates: Array<{
    name: string;
    issuer: string;
    year: number;
    url: string | null;
  }>;
  qualificationImages: string[];
  portfolioPhotos: string[];
  introVideo: string | null;
  tutorName: string;
}

export interface TutorStatsData {
  totalStudents: number;
  activeStudents: number;
  completedClasses: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  responseTime: string;
  experienceYears: number;
  memberSince: string;
  tutorName: string;
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
 * GET /api/teachers/:id
 * Get full tutor profile by ID
 */
export const getTutorProfile = async (
  token: string,
  tutorId: string
): Promise<TutorProfileData> => {
  const response = await fetch(`${API_BASE_URL}/teachers/${tutorId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<TutorProfileData>(response);
};

/**
 * GET /api/teachers/:id/gallery
 * Get tutor gallery (certificates, portfolio photos, intro video)
 */
export const getTutorGallery = async (
  token: string,
  tutorId: string
): Promise<TutorGalleryData> => {
  const response = await fetch(`${API_BASE_URL}/teachers/${tutorId}/gallery`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<TutorGalleryData>(response);
};

/**
 * GET /api/teachers/:id/stats
 * Get tutor statistics
 */
export const getTutorStats = async (
  token: string,
  tutorId: string
): Promise<TutorStatsData> => {
  const response = await fetch(`${API_BASE_URL}/teachers/${tutorId}/stats`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<TutorStatsData>(response);
};

/**
 * POST /api/shortlists
 * Add tutor to parent's shortlist
 */
export const shortlistTutor = async (
  token: string,
  teacherId: string,
  teacherProfileId: string,
  requirementId?: string,
  notes?: string
): Promise<{ shortlistId: string }> => {
  const response = await fetch(`${API_BASE_URL}/shortlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      teacherId,
      teacherProfileId: teacherProfileId,
      requirementId: requirementId || undefined,
      notes: notes || undefined,
    }),
  });
  return handleResponse<{ shortlistId: string }>(response);
};

/**
 * DELETE /api/shortlists/:id
 * Remove tutor from shortlist
 */
export const removeFromShortlist = async (
  token: string,
  shortlistId: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/shortlists/${shortlistId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.status === 401) throw new Error('Unauthorized');
  if (!response.ok) throw new Error('Failed to remove from shortlist');
};
