import { apiConfig } from '../config/api';
import { TeacherApplication } from './teacherApi';

const API_BASE_URL = apiConfig.baseURL;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApplicationsResponse {
  applications: TeacherApplication[];
  total: number;
}

export interface ApplyToRequirementPayload {
  message?: string;
  teachingApproach?: string;
  relevantExperience?: string;
  proposedFee?: number;
  isNegotiable?: boolean;
  demoProposal?: {
    suggestedDate?: string;
    suggestedTime?: string;
    mode?: 'online' | 'offline';
  };
  proposedSchedule?: {
    daysPerWeek: string;
    preferredTimeSlots: string[];
  };
}

export interface ApplyToRequirementResponse {
  applicationId: string;
  application: TeacherApplication;
}

export interface ParentApplication {
  _id: string;
  applicationId: string;
  status: 'pending' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn';
  message?: string;
  proposedFee?: number;
  proposedSchedule?: {
    daysPerWeek: string;
    preferredTimeSlots: string[];
  };
  viewedByParent: boolean;
  viewedAt?: string;
  shortlistedAt?: string;
  rejectedAt?: string;
  acceptedAt?: string;
  rejectionReason?: string;
  demoScheduled: boolean;
  demoId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teacherProfileId?: {
    basicDetails?: {
      fullName?: string;
      profilePhoto?: string;
      bio?: string;
      languages?: string[];
    };
    teachingDetails?: {
      subjects?: string[];
      classes?: string[];
      teachingModes?: string[];
    };
    education?: {
      highestQualification?: string;
      institutions?: Array<{
        name?: string;
        degree?: string;
        year?: string;
      }>;
    };
    pricingRevenue?: {
      hourlyRate?: number;
      experienceYears?: number;
    };
    stats?: {
      averageRating?: number;
      totalReviews?: number;
    };
    verificationStatus?: 'pending' | 'verified' | 'rejected';
  };
  parentRequirementId?: {
    requirementId?: string;
    studentDetails?: {
      studentName?: string;
      grade?: string;
    };
    subjects?: string[];
    budget?: {
      minAmount?: number;
      maxAmount?: number;
    };
    tuitionType?: string;
    location?: {
      city?: string;
      address?: string;
    };
    schedule?: {
      daysPerWeek?: string;
      preferredTimings?: string[];
    };
  };
}

export interface ParentApplicationsResponse {
  applications: ParentApplication[];
  total: number;
}

export interface ApplicationDetailResponse {
  application: ParentApplication;
}

export interface ScheduleDemoPayload {
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  mode?: 'online' | 'offline';
  notes?: string;
}

export interface ScheduleDemoResponse {
  demoId: string;
  demoClass: any;
  application: ParentApplication;
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
 * GET /api/applications/teacher
 * Returns all applications sent by the authenticated teacher.
 * Optional status filter is accepted by the backend.
 */
export const getTeacherApplications = async (
  token: string,
  status?: string,
): Promise<ApplicationsResponse> => {
  const url = status
    ? `${API_BASE_URL}/applications/teacher?status=${encodeURIComponent(status)}`
    : `${API_BASE_URL}/applications/teacher`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<ApplicationsResponse>(response);
};

/**
 * POST /api/applications/:applicationId/withdraw
 * Withdraws a pending application by its applicationId string.
 */
export const withdrawApplication = async (
  token: string,
  applicationId: string,
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/applications/${encodeURIComponent(applicationId)}/withdraw`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 401) throw new Error('Unauthorized');
  if (response.status === 400) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || 'Cannot withdraw this application');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || `Withdraw failed (${response.status})`);
  }
};

// ── Parent Application Functions ───────────────────────────────────────────────

/**
 * GET /api/applications/parent
 * Returns all applications received by the authenticated parent.
 * Optional status filter is accepted by the backend.
 */
export const getParentApplications = async (
  token: string,
  status?: string,
): Promise<ParentApplicationsResponse> => {
  const url = status
    ? `${API_BASE_URL}/applications/parent?status=${encodeURIComponent(status)}`
    : `${API_BASE_URL}/applications/parent`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<ParentApplicationsResponse>(response);
};

/**
 * GET /api/applications/:applicationId
 * Returns a single application by its ID for the parent.
 */
export const getApplicationById = async (
  token: string,
  applicationId: string,
): Promise<ApplicationDetailResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/applications/${encodeURIComponent(applicationId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return handleResponse<ApplicationDetailResponse>(response);
};

/**
 * POST /api/applications/:applicationId/shortlist
 * Shortlists an application for the parent.
 */
export const shortlistApplication = async (
  token: string,
  applicationId: string,
): Promise<ApplicationDetailResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/applications/${encodeURIComponent(applicationId)}/shortlist`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return handleResponse<ApplicationDetailResponse>(response);
};

/**
 * POST /api/applications/:applicationId/reject
 * Rejects an application for the parent.
 */
export const rejectApplication = async (
  token: string,
  applicationId: string,
  reason?: string,
): Promise<ApplicationDetailResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/applications/${encodeURIComponent(applicationId)}/reject`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    },
  );

  return handleResponse<ApplicationDetailResponse>(response);
};

/**
 * POST /api/applications/:applicationId/accept
 * Accepts an application and creates a scheduled class.
 */
export const acceptApplication = async (
  token: string,
  applicationId: string,
): Promise<ApplicationDetailResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/applications/${encodeURIComponent(applicationId)}/accept`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return handleResponse<ApplicationDetailResponse>(response);
};

/**
 * POST /api/applications/:applicationId/demo
 * Schedules a demo class for an application.
 */
export const scheduleDemo = async (
  token: string,
  applicationId: string,
  payload: ScheduleDemoPayload,
): Promise<ScheduleDemoResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/applications/${encodeURIComponent(applicationId)}/demo`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<ScheduleDemoResponse>(response);
};

// ── Teacher Application Functions ────────────────────────────────────────────

/**
 * POST /api/applications/apply/:requirementId
 * Submits an application to a requirement.
 */
export const applyToRequirement = async (
  token: string,
  requirementId: string,
  payload: ApplyToRequirementPayload,
): Promise<ApplyToRequirementResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/applications/apply/${encodeURIComponent(requirementId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (response.status === 401) throw new Error('Unauthorized');
  if (response.status === 409) throw new Error('You have already applied to this requirement');
  if (response.status === 400) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || 'Invalid application data');
  }
  if (response.status === 403) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || 'Profile incomplete or verification pending');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || `Application failed (${response.status})`);
  }

  const body = await response.json();
  return body.data as ApplyToRequirementResponse;
};

/**
 * GET /api/applications/:applicationId
 * Returns a single application by its ID for the teacher.
 */
export const getTeacherApplicationById = async (
  token: string,
  applicationId: string,
): Promise<TeacherApplication> => {
  const response = await fetch(
    `${API_BASE_URL}/applications/${encodeURIComponent(applicationId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 401) throw new Error('Unauthorized');
  if (response.status === 404) throw new Error('Application not found');
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || `Failed to fetch application (${response.status})`);
  }

  const body = await response.json();
  return body.data?.application as TeacherApplication;
};
