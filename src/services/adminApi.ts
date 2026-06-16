import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface PlatformStats {
  totalParents: number;
  totalTeachers: number;
  pendingTeachers: number;
  activeRequirements: number;
  totalApplications: number;
  totalDemoClasses: number;
}

export interface AdminUser {
  _id: string;
  email: string;
  phoneNumber: string;
  role: 'parent' | 'teacher' | 'admin';
  profile: {
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface AdminTeacher {
  _id: string;
  userId: string | { _id: string; email: string; phoneNumber: string; isActive: boolean };
  basicDetails: {
    fullName: string;
    email: string;
    mobileNumber: string;
    profilePhoto: string;
  };
  teachingDetails: {
    subjects: string[];
    classes: string[];
  };
  locationAvailability: {
    city: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  isBlocked: boolean;
  blockReason?: string;
  stats: {
    averageRating: number;
  };
  pricingRevenue: {
    hourlyRate: number;
  };
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminUsersResponse {
  success: boolean;
  data: AdminUser[];
  pagination: Pagination;
}

export interface AdminTeachersResponse {
  success: boolean;
  data: AdminTeacher[];
  pagination: Pagination;
}

export interface AdminTeacherDetailResponse {
  success: boolean;
  data: AdminTeacher;
}

export interface AdminActionResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface AdminParent {
  _id: string;
  email: string;
  phoneNumber: string;
  role: 'parent';
  profile: {
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  isActive: boolean;
  isVerified: boolean;
  requirementsCount: number;
  createdAt: string;
}

export interface AdminParentDetail extends AdminParent {
  requirements: Array<{
    _id: string;
    requirementId: string;
    subjects: string[];
    studentDetails: { grade: string };
    status: string;
    createdAt: string;
  }>;
}

export interface AdminParentsResponse {
  success: boolean;
  data: AdminParent[];
  pagination: Pagination;
}

export interface AdminParentDetailResponse {
  success: boolean;
  data: AdminParentDetail;
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

async function adminFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Request failed with status ${response.status}`);
  }

  return result as T;
}

// ─────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────

export const getPlatformStats = (token: string): Promise<{ success: boolean; data: PlatformStats }> =>
  adminFetch('/stats', token);

export const getUsers = (
  token: string,
  params?: { role?: string; search?: string; isActive?: boolean; page?: number; limit?: number }
): Promise<AdminUsersResponse> => {
  const query = new URLSearchParams();
  if (params?.role) query.append('role', params.role);
  if (params?.search) query.append('search', params.search);
  if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  const qs = query.toString();
  return adminFetch(`/users${qs ? `?${qs}` : ''}`, token);
};

export const getTeachers = (
  token: string,
  params?: {
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<AdminTeachersResponse> => {
  const query = new URLSearchParams();
  if (params?.verificationStatus) query.append('verificationStatus', params.verificationStatus);
  if (params?.city) query.append('city', params.city);
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  const qs = query.toString();
  return adminFetch(`/teachers${qs ? `?${qs}` : ''}`, token);
};

export const getTeacherDetails = (token: string, id: string): Promise<AdminTeacherDetailResponse> =>
  adminFetch(`/teachers/${id}`, token);

export const approveTeacher = (token: string, id: string): Promise<AdminActionResponse> =>
  adminFetch(`/teachers/${id}/approve`, token, { method: 'PATCH' });

export const rejectTeacher = (token: string, id: string, reason: string): Promise<AdminActionResponse> =>
  adminFetch(`/teachers/${id}/reject`, token, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });

export const blockTeacher = (token: string, id: string, reason: string): Promise<AdminActionResponse> =>
  adminFetch(`/teachers/${id}/block`, token, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });

export const unblockTeacher = (token: string, id: string): Promise<AdminActionResponse> =>
  adminFetch(`/teachers/${id}/unblock`, token, { method: 'PATCH' });

export const getParents = (
  token: string,
  params?: { search?: string; isActive?: boolean; page?: number; limit?: number }
): Promise<AdminParentsResponse> => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  const qs = query.toString();
  return adminFetch(`/parents${qs ? `?${qs}` : ''}`, token);
};

export const getParent = (token: string, id: string): Promise<AdminParentDetailResponse> =>
  adminFetch(`/parents/${id}`, token);

export const updateParent = (
  token: string,
  id: string,
  data: { profile?: { firstName?: string; lastName?: string }; isActive?: boolean }
): Promise<AdminActionResponse> =>
  adminFetch(`/parents/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteParent = (token: string, id: string): Promise<AdminActionResponse> =>
  adminFetch(`/parents/${id}`, token, { method: 'DELETE' });

// ─────────────────────────────────────────────
// Import Types
// ─────────────────────────────────────────────

export interface ImportRowError {
  rowNumber: number;
  errorMessage: string;
}

export interface ImportResult {
  importId: string;
  fileName: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  duplicates: number;
  status: 'processing' | 'completed' | 'failed' | 'partial';
  errors: ImportRowError[];
}

export interface ImportHistoryRecord {
  _id: string;
  fileName: string;
  importType: 'parents' | 'teachers';
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  duplicates: number;
  status: 'processing' | 'completed' | 'failed' | 'partial';
  uploadedBy: { profile: { firstName: string; lastName: string }; email: string } | string;
  createdAt: string;
}

export interface ImportHistoryResponse {
  success: boolean;
  data: ImportHistoryRecord[];
  pagination: Pagination;
}

// ─────────────────────────────────────────────
// Import API — uses FormData, NOT JSON
// ─────────────────────────────────────────────

export const importParents = async (
  token: string,
  fileUri: string,
  fileName: string
): Promise<{ success: boolean; data: ImportResult }> => {
  const formData = new FormData();
  formData.append('file', { uri: fileUri, name: fileName, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } as any);

  const response = await fetch(`${API_BASE_URL}/admin/import/parents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Import failed');
  return result;
};

export const importTeachers = async (
  token: string,
  fileUri: string,
  fileName: string
): Promise<{ success: boolean; data: ImportResult }> => {
  const formData = new FormData();
  formData.append('file', { uri: fileUri, name: fileName, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } as any);

  const response = await fetch(`${API_BASE_URL}/admin/import/teachers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Import failed');
  return result;
};

export const getImportHistory = (
  token: string,
  params?: { importType?: 'parents' | 'teachers'; status?: string; page?: number; limit?: number }
): Promise<ImportHistoryResponse> => {
  const query = new URLSearchParams();
  if (params?.importType) query.append('importType', params.importType);
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  const qs = query.toString();
  return adminFetch(`/import/history${qs ? `?${qs}` : ''}`, token);
};

// ─────────────────────────────────────────────
// Analytics Types
// ─────────────────────────────────────────────

export interface OverviewAnalytics {
  users: { totalParents: number; totalTeachers: number; newParentsThisMonth: number; newTeachersThisMonth: number };
  teachers: { verifiedTeachers: number; pendingTeachers: number; blockedTeachers: number; verificationRate: number };
  requirements: { activeRequirements: number; closedRequirements: number; newReqsThisMonth: number; totalRequirements: number };
  applications: { totalApplications: number; pendingApplications: number; acceptedApplications: number; newAppsThisWeek: number; conversionRate: number };
  matching: { totalMatches: number };
  demos: { totalDemoClasses: number; completedDemos: number; scheduledDemos: number; demoConversionRate: number };
  classes: { scheduledClasses: number; activeScheduledClasses: number };
  generatedAt: string;
}

export interface TopItem { count: number }
export interface TopSubject extends TopItem { subject: string }
export interface TopGrade extends TopItem { grade: string }
export interface TopBoard extends TopItem { board: string }
export interface TopCity extends TopItem { city: string }
export interface TypeBreakdown { type: string; count: number }
export interface MonthlyCount { year: number; month: number; count: number }

export interface DemandAnalytics {
  topSubjects: TopSubject[];
  topGrades: TopGrade[];
  topBoards: TopBoard[];
  topCities: TopCity[];
  tuitionTypeBreakdown: TypeBreakdown[];
  budgetDistribution: { _id: number | string; count: number; avgBudget: number }[];
  requirementsByMonth: MonthlyCount[];
}

export interface SupplyItem extends TopItem { city?: string; subject?: string; board?: string; mode?: string; status?: string }
export interface SupplyVsDemand { subject: string; demand: number; supply: number; gap: number }
export interface CityRate { city: string; avgHourlyRate: number; teacherCount: number }

export interface SupplyAnalytics {
  teachersByCity: SupplyItem[];
  teachersBySubject: SupplyItem[];
  teachersByBoard: SupplyItem[];
  teachersByExperience: { _id: number | string; count: number; avgRate: number }[];
  teachersByVerification: SupplyItem[];
  teachersByMode: SupplyItem[];
  avgHourlyRateByCity: CityRate[];
  teachersJoinedByMonth: MonthlyCount[];
  supplyVsDemand: SupplyVsDemand[];
}

export interface RevenueAnalytics {
  summary: { totalRevenue: number; totalTransactions: number; monthRevenue: number; yearRevenue: number; avgTransactionValue: number };
  revenueByType: { type: string; total: number; count: number; avgAmount: number }[];
  revenueByMonth: { year: number; month: number; revenue: number; transactions: number }[];
  leadUnlocks: {
    stats: { status: string; count: number; totalAmount: number }[];
    byMonth: { year: number; month: number; count: number; revenue: number }[];
    conversionStats: { status: string; count: number }[];
  };
  notes: string[];
}

// ─────────────────────────────────────────────
// Analytics API Functions
// ─────────────────────────────────────────────

export const getOverviewAnalytics = (token: string): Promise<{ success: boolean; data: OverviewAnalytics }> =>
  adminFetch('/analytics/overview', token);

export const getDemandAnalytics = (token: string): Promise<{ success: boolean; data: DemandAnalytics }> =>
  adminFetch('/analytics/demand', token);

export const getSupplyAnalytics = (token: string): Promise<{ success: boolean; data: SupplyAnalytics }> =>
  adminFetch('/analytics/supply', token);

export const getRevenueAnalytics = (token: string): Promise<{ success: boolean; data: RevenueAnalytics }> =>
  adminFetch('/analytics/revenue', token);
