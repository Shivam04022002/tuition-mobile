import { apiConfig } from '../config/api';

const BASE = apiConfig.baseURL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface StaffDashboardData {
  pendingVerifications: number;
  openTickets: number;
  resolvedToday: number;
  urgentTickets: number;
}

export interface VerificationTeacher {
  _id: string;
  basicDetails: {
    fullName: string;
    email: string;
    mobileNumber: string;
    profilePhoto?: string;
  };
  teachingDetails: {
    subjects: string[];
  };
  education?: {
    highestQualification?: string;
  };
  locationAvailability?: {
    city?: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  isVerified: boolean;
  verificationDocuments?: Record<string, any>;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  userId?: {
    email: string;
    phoneNumber: string;
    isActive: boolean;
    createdAt: string;
  };
}

export interface VerificationCounts {
  pending: number;
  verified: number;
  rejected: number;
}

export interface VerificationQueueResult {
  teachers: VerificationTeacher[];
  counts: VerificationCounts;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}


export interface DailyActivity {
  label: string;
  value: number;
}

export interface BarItem {
  label: string;
  value: number;
}

export interface StaffReportsData {
  kpis: {
    totalResolved: number;
    avgResolutionHours: string;
    verifications: number;
  };
  tickets: {
    totalResolved: number;
    resolvedToday: number;
    avgResolutionHours: string;
    slaCompliance: number;
  };
  verifications: {
    approved: number;
    rejected: number;
    pending: number;
    bySubject: BarItem[];
  };
  dailyActivity: DailyActivity[];
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/staff/dashboard
// ─────────────────────────────────────────────────────────────────────────────
export async function getDashboard(token: string): Promise<StaffDashboardData> {
  const res = await fetch(`${BASE}/staff/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch dashboard');
  return json.data as StaffDashboardData;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/staff/verification-queue
// ─────────────────────────────────────────────────────────────────────────────
export async function getVerificationQueue(
  token: string,
  opts?: {
    status?: 'pending' | 'verified' | 'rejected';
    search?: string;
    page?: number;
    limit?: number;
  },
): Promise<VerificationQueueResult> {
  const params = new URLSearchParams();
  if (opts?.status) params.set('status', opts.status);
  if (opts?.search) params.set('search', opts.search);
  if (opts?.page) params.set('page', String(opts.page));
  if (opts?.limit) params.set('limit', String(opts.limit));

  const res = await fetch(`${BASE}/staff/verification-queue?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch verification queue');
  return {
    teachers: json.data as VerificationTeacher[],
    counts: json.counts as VerificationCounts,
    pagination: json.pagination,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/staff/verification-queue/:id
// ─────────────────────────────────────────────────────────────────────────────
export async function getTeacherDetails(token: string, id: string): Promise<VerificationTeacher> {
  const res = await fetch(`${BASE}/staff/verification-queue/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch teacher details');
  return json.data as VerificationTeacher;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/staff/verification-queue/:id/approve
// ─────────────────────────────────────────────────────────────────────────────
export async function approveTeacher(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/staff/verification-queue/${id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to approve teacher');
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/staff/verification-queue/:id/reject
// Body: { reason }
// ─────────────────────────────────────────────────────────────────────────────
export async function rejectTeacher(token: string, id: string, reason: string): Promise<void> {
  const res = await fetch(`${BASE}/staff/verification-queue/${id}/reject`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to reject teacher');
}


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/staff/reports
// ─────────────────────────────────────────────────────────────────────────────
export async function getReports(token: string): Promise<StaffReportsData> {
  const res = await fetch(`${BASE}/staff/reports`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch reports');
  return json.data as StaffReportsData;
}
