import { apiConfig } from '../config/api';

// Types
export interface TeacherProfile {
  _id: string;
  basicDetails: {
    fullName: string;
    profilePhoto?: string;
    mobileNumber?: string;
    email?: string;
  };
  teachingDetails: {
    subjects: string[];
    classes: string[];
    teachingModes: string[];
  };
  education: {
    highestQualification: string;
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
  };
  verificationStatus: string;
}

export interface Application {
  _id: string;
  applicationId: string;
  parentRequirementId: string;
  teacherId: string;
  teacherProfileId: TeacherProfile;
  status: 'pending' | 'viewed' | 'shortlisted' | 'rejected' | 'demo_scheduled' | 'demo_completed' | 'selected' | 'hired' | 'withdrawn';
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
  selectedAt?: string;
  hiredAt?: string;
  rejectionReason?: string;
  selectionReason?: string;
  hireNotes?: string;
  demoScheduled: boolean;
  demoId?: string;
  demoCompletedAt?: string;
  demoOutcome?: 'interested' | 'not_interested' | 'need_follow_up';
  createdAt: string;
  updatedAt: string;
}

export interface RequirementSummary {
  _id: string;
  requirementId: string;
  studentDetails: {
    studentName: string;
    grade: string;
  };
  subjects: string[];
  status: string;
  applicationsCount: number;
  shortlistedCount: number;
  demosScheduledCount: number;
  hiredTeacherId?: string;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface GetRequirementApplicationsResponse {
  success: boolean;
  data: {
    applications: Application[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
    statusBreakdown: StatusBreakdown[];
    requirement: RequirementSummary;
  };
}

export interface ApplicationActionResponse {
  success: boolean;
  message: string;
  data: {
    application: Application;
  };
}

export interface HiringDashboardData {
  requirements: RequirementSummary[];
  selectedRequirement: RequirementSummary | null;
  applications: Application[];
  totalApplications: number;
  statusBreakdown: StatusBreakdown[];
}

// Helper function for API calls
async function fetchWithAuth(endpoint: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`${apiConfig.baseURL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// API Functions

export async function getRequirementApplications(
  requirementId: string,
  token: string,
  params?: { status?: string; page?: number; limit?: number }
): Promise<GetRequirementApplicationsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchWithAuth(`/parents/requirements/${requirementId}/applications${query}`, token);
}

export async function viewApplication(
  applicationId: string,
  token: string
): Promise<ApplicationActionResponse> {
  return fetchWithAuth(`/applications/${applicationId}/view`, token, {
    method: 'POST',
  });
}

export async function shortlistApplication(
  applicationId: string,
  token: string
): Promise<ApplicationActionResponse> {
  return fetchWithAuth(`/applications/${applicationId}/shortlist`, token, {
    method: 'POST',
  });
}

export async function rejectApplication(
  applicationId: string,
  token: string,
  reason?: string
): Promise<ApplicationActionResponse> {
  return fetchWithAuth(`/applications/${applicationId}/reject`, token, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function selectTeacher(
  applicationId: string,
  token: string,
  reason?: string
): Promise<ApplicationActionResponse> {
  return fetchWithAuth(`/applications/${applicationId}/select`, token, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function hireTeacher(
  applicationId: string,
  token: string,
  notes?: string,
  startDate?: string
): Promise<ApplicationActionResponse> {
  return fetchWithAuth(`/applications/${applicationId}/hire`, token, {
    method: 'POST',
    body: JSON.stringify({ notes, startDate }),
  });
}

export async function closeRequirement(
  requirementId: string,
  token: string,
  reason?: string
): Promise<{ success: boolean; message: string; data: { requirement: any } }> {
  return fetchWithAuth(`/parents/requirements/${requirementId}/close-hire`, token, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function getApplicationById(
  applicationId: string,
  token: string
): Promise<{ success: boolean; data: { application: Application } }> {
  return fetchWithAuth(`/applications/${applicationId}`, token);
}

// Status helpers
export const APPLICATION_STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  pending: { color: '#F59E0B', icon: 'time-outline', label: 'Pending' },
  viewed: { color: '#3B82F6', icon: 'eye-outline', label: 'Viewed' },
  shortlisted: { color: '#8B5CF6', icon: 'star-outline', label: 'Shortlisted' },
  rejected: { color: '#EF4444', icon: 'close-circle-outline', label: 'Not Selected' },
  demo_scheduled: { color: '#10B981', icon: 'videocam-outline', label: 'Demo Scheduled' },
  demo_completed: { color: '#059669', icon: 'checkmark-circle-outline', label: 'Demo Completed' },
  selected: { color: '#6366F1', icon: 'checkmark-done-outline', label: 'Selected' },
  hired: { color: '#10B981', icon: 'trophy-outline', label: 'Hired' },
  withdrawn: { color: '#6B7280', icon: 'arrow-undo-outline', label: 'Withdrawn' },
};

export const REQUIREMENT_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  draft: { color: '#9CA3AF', label: 'Draft' },
  published: { color: '#3B82F6', label: 'Published' },
  receiving_applications: { color: '#8B5CF6', label: 'Receiving Applications' },
  shortlisted: { color: '#EC4899', label: 'Shortlisted' },
  demo_scheduled: { color: '#10B981', label: 'Demo Scheduled' },
  teacher_selected: { color: '#6366F1', label: 'Teacher Selected' },
  hired: { color: '#059669', label: 'Hired' },
  closed: { color: '#6B7280', label: 'Closed' },
  cancelled: { color: '#EF4444', label: 'Cancelled' },
  expired: { color: '#9CA3AF', label: 'Expired' },
  paused: { color: '#F59E0B', label: 'Paused' },
};

export function getApplicationStatusColor(status: string): string {
  return APPLICATION_STATUS_CONFIG[status]?.color || '#6B7280';
}

export function getApplicationStatusLabel(status: string): string {
  return APPLICATION_STATUS_CONFIG[status]?.label || status;
}

export function getApplicationStatusIcon(status: string): string {
  return APPLICATION_STATUS_CONFIG[status]?.icon || 'help-circle-outline';
}

export function getRequirementStatusColor(status: string): string {
  return REQUIREMENT_STATUS_CONFIG[status]?.color || '#6B7280';
}

export function getRequirementStatusLabel(status: string): string {
  return REQUIREMENT_STATUS_CONFIG[status]?.label || status;
}
