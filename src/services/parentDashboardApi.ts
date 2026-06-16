import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  activeRequirements: number;
  applicationsReceived: number;
  shortlistedTutors: number;
  demosScheduled: number;
  closedRequirements?: number;
}

export interface QuickStats {
  activeRequirements: number;
  applications: number;
  shortlisted: number;
  demoClasses: number;
}

export interface DashboardRequirement {
  _id: string;
  requirementId: string;
  subjects: string[];
  studentDetails?: {
    studentName?: string;
    grade?: string;
    board?: string;
  };
  budget?: {
    minAmount: number;
    maxAmount: number;
  };
  status: 'active' | 'closed' | 'expired' | 'paused';
  createdAt: string;
  totalMatches?: number;
}

export interface DashboardApplication {
  _id: string;
  applicationId?: string;
  status: 'pending' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn';
  createdAt: string;
  teacherProfileId?: {
    basicDetails?: {
      fullName?: string;
      profilePhoto?: string;
    };
    teachingDetails?: {
      subjects?: string[];
    };
    pricingRevenue?: {
      hourlyRate?: number;
      experienceYears?: number;
    };
    stats?: {
      averageRating?: number;
    };
  };
  parentRequirementId?: {
    requirementId?: string;
    studentDetails?: {
      studentName?: string;
      grade?: string;
    };
    subjects?: string[];
  };
}

export interface DashboardRecommendedTutor {
  _id: string;
  overallScore: number;
  teacherId?: {
    _id?: string;
  };
  teacherProfileId?: {
    basicDetails?: {
      fullName?: string;
      profilePhoto?: string;
    };
    teachingDetails?: {
      subjects?: string[];
    };
    pricingRevenue?: {
      experienceYears?: number;
    };
    stats?: {
      averageRating?: number;
    };
    locationAvailability?: {
      city?: string;
      coordinates?: {
        latitude?: number;
        longitude?: number;
      };
    };
  };
  breakdown?: {
    locationMatchDetails?: {
      distance?: number;
    };
  };
}

export interface DashboardDemoClass {
  _id: string;
  demoId?: string;
  status: 'scheduled' | 'rescheduled' | 'completed' | 'cancelled';
  scheduledDate?: string;
  scheduledTime?: string;
  subject?: string;
  teacherProfileId?: {
    basicDetails?: {
      fullName?: string;
      profilePhoto?: string;
    };
  };
}

export interface DashboardShortlistedTutor {
  _id: string;
  teacherProfileId?: {
    basicDetails?: {
      fullName?: string;
      profilePhoto?: string;
    };
    teachingDetails?: {
      subjects?: string[];
    };
    pricingRevenue?: {
      hourlyRate?: number;
    };
    stats?: {
      averageRating?: number;
    };
  };
}

export interface ParentDashboardData {
  stats: DashboardStats;
  activeRequirements: DashboardRequirement[];
  applications: DashboardApplication[];
  shortlistedTutors: DashboardShortlistedTutor[];
  upcomingDemos: DashboardDemoClass[];
  recommendedTutors: DashboardRecommendedTutor[];
  notificationsCount: number;
}

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

// ── API Function ──────────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/parent
 * Returns all dashboard data for the authenticated parent in one call.
 */
export const getParentDashboard = async (token: string): Promise<ParentDashboardData> => {
  const response = await fetch(`${API_BASE_URL}/dashboard/parent`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<ParentDashboardData>(response);
};

/**
 * GET /api/dashboard/parent/stats
 * Returns lightweight quick stats for the parent dashboard.
 */
export const getQuickStats = async (token: string): Promise<QuickStats> => {
  const response = await fetch(`${API_BASE_URL}/dashboard/parent/stats`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<QuickStats>(response);
};
