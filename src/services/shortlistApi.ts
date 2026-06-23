import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TeacherProfileSummary {
  _id: string;
  basicDetails?: {
    fullName?: string;
    profilePhoto?: string;
    mobileNumber?: string;
    email?: string;
  };
  teachingDetails?: {
    subjects?: string[];
    classes?: string[];
    experienceYears?: number;
  };
  pricingRevenue?: {
    hourlyRate?: number;
  };
  stats?: {
    averageRating?: number;
    totalReviews?: number;
  };
  education?: {
    highestQualification?: string;
  };
}

export interface RequirementSummary {
  _id: string;
  requirementId?: string;
  studentDetails?: {
    studentName?: string;
    grade?: string;
  };
  subjects?: string[];
  status?: string;
}

export interface Shortlist {
  _id: string;
  parentId: string;
  teacherId: string;
  teacherProfileId: TeacherProfileSummary;
  requirementId?: RequirementSummary;
  className?: string;
  notes?: string;
  matchScore?: number;
  isContacted: boolean;
  contactedAt?: string;
  contactMethod?: 'call' | 'whatsapp' | 'email' | 'sms';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShortlistInput {
  teacherId: string;
  teacherProfileId: string;
  requirementId?: string;
  notes?: string;
}

export interface CreateShortlistResponse {
  success: boolean;
  message: string;
  data: {
    shortlist: Shortlist;
  };
}

export interface GetParentShortlistsResponse {
  success: boolean;
  data: {
    shortlists: Shortlist[];
    total: number;
  };
}

export interface MarkContactedInput {
  method?: 'call' | 'whatsapp' | 'email' | 'sms';
}

export interface MarkContactedResponse {
  success: boolean;
  message: string;
  data: {
    shortlist: Shortlist;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  data?: {
    shortlistId?: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as ApiErrorResponse;
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function getAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ── API Methods ───────────────────────────────────────────────────────────────

/**
 * GET /api/shortlists/parent
 * Fetch all shortlisted tutors for the authenticated parent
 */
export async function getParentShortlists(
  token: string,
  requirementId?: string
): Promise<GetParentShortlistsResponse> {
  const url = new URL(`${API_BASE_URL}/shortlists/parent`);
  if (requirementId) {
    url.searchParams.append('requirementId', requirementId);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(token),
  });

  return handleResponse<GetParentShortlistsResponse>(response);
}

/**
 * POST /api/shortlists
 * Add a tutor to the parent's shortlist
 */
export async function createShortlist(
  token: string,
  input: CreateShortlistInput
): Promise<CreateShortlistResponse> {
  const response = await fetch(`${API_BASE_URL}/shortlists`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      teacherId: input.teacherId,
      teacherProfileId: input.teacherProfileId,
      requirementId: input.requirementId,
      notes: input.notes,
    }),
  });

  if (response.status === 409) {
    const errorData = await response.json().catch(() => ({})) as ApiErrorResponse;
    const error = new Error(errorData.message || 'Teacher already shortlisted');
    (error as any).status = 409;
    (error as any).shortlistId = errorData.data?.shortlistId;
    throw error;
  }

  return handleResponse<CreateShortlistResponse>(response);
}

/**
 * DELETE /api/shortlists/:id
 * Remove a tutor from the shortlist (soft delete)
 */
export async function removeShortlist(
  token: string,
  shortlistId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/shortlists/${shortlistId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });

  return handleResponse<{ success: boolean; message: string }>(response);
}

/**
 * POST /api/shortlists/:id/contacted
 * Mark a shortlisted tutor as contacted
 */
export async function markShortlistContacted(
  token: string,
  shortlistId: string,
  method?: 'call' | 'whatsapp' | 'email' | 'sms'
): Promise<MarkContactedResponse> {
  const response = await fetch(`${API_BASE_URL}/shortlists/${shortlistId}/contacted`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      method: method || 'call',
    }),
  });

  return handleResponse<MarkContactedResponse>(response);
}

/**
 * Check if a specific tutor is already shortlisted
 * Uses GET /api/shortlists/parent with filtering
 */
export async function checkIsShortlisted(
  token: string,
  teacherId: string,
  requirementId?: string
): Promise<{ isShortlisted: boolean; shortlistId?: string }> {
  try {
    const response = await getParentShortlists(token, requirementId);
    const shortlist = response.data.shortlists.find(
      s => s.teacherId === teacherId && !s.isDeleted
    );
    return {
      isShortlisted: !!shortlist,
      shortlistId: shortlist?._id,
    };
  } catch (error) {
    return { isShortlisted: false };
  }
}
