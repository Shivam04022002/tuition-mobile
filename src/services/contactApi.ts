import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ── Types ─────────────────────────────────────────────────────────────────────

export type ContactType = 'call' | 'whatsapp' | 'message' | 'demo';
export type ContactStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'rescheduled';

export interface ContactRequest {
  _id: string;
  contactRequestId: string;
  parentId: string;
  teacherId: string;
  teacherProfileId: string;
  requirementId?: string;
  contactType: ContactType;
  status: ContactStatus;
  message?: string;
  demoDate?: string;
  demoTime?: string;
  demoMode?: 'online' | 'offline';
  demoNotes?: string;
  rescheduleHistory?: Array<{
    previousDate: string;
    previousTime: string;
    newDate: string;
    newTime: string;
    reason: string;
    rescheduledAt: string;
    rescheduledBy: 'parent' | 'teacher';
  }>;
  responseMessage?: string;
  respondedAt?: string;
  respondedBy?: string;
  demoFeedback?: {
    outcome: 'interested' | 'not_interested' | 'need_follow_up';
    notes?: string;
    completedAt: string;
  };
  meetingLink?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  teacherProfile?: {
    basicDetails?: {
      fullName?: string;
      profilePhoto?: string;
      mobileNumber?: string;
    };
    teachingDetails?: {
      subjects?: string[];
    };
  };
  parent?: {
    profile?: {
      parentName?: string;
      mobileNumber?: string;
    };
  };
  requirement?: {
    requirementId?: string;
    subjects?: string[];
    studentDetails?: {
      studentName?: string;
      grade?: string;
    };
    location?: {
      city?: string;
    };
  };
}

export interface CreateContactRequestPayload {
  teacherId: string;
  teacherProfileId: string;
  requirementId?: string;
  contactType: Exclude<ContactType, 'demo'>;
  message?: string;
}

export interface CreateDemoRequestPayload {
  teacherId: string;
  teacherProfileId: string;
  requirementId?: string;
  demoDate: string;
  demoTime: string;
  demoMode?: 'online' | 'offline';
  demoNotes?: string;
  message?: string;
}

export interface UpdateContactStatusPayload {
  status: 'accepted' | 'rejected' | 'completed';
  responseMessage?: string;
  outcome?: 'interested' | 'not_interested' | 'need_follow_up';
  feedbackNotes?: string;
}

export interface CompleteDemoPayload {
  outcome: 'interested' | 'not_interested' | 'need_follow_up';
  feedbackNotes?: string;
}

export interface DemoSummaryStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  completed: number;
  rescheduled: number;
}

export interface RescheduleDemoPayload {
  newDate: string;
  newTime: string;
  reason?: string;
}

export interface ContactHistoryResponse {
  contactRequests: ContactRequest[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  summaryStats?: DemoSummaryStats;
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

// ── Parent API Functions ───────────────────────────────────────────────────

/**
 * POST /api/contact/request
 * Create a new contact request (call, whatsapp, message)
 */
export const createContactRequest = async (
  token: string,
  payload: CreateContactRequestPayload,
): Promise<{ contactRequest: ContactRequest }> => {
  const response = await fetch(`${API_BASE_URL}/contact/request`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<{ contactRequest: ContactRequest }>(response);
};

/**
 * POST /api/contact/demo
 * Create a new demo request
 */
export const createDemoRequest = async (
  token: string,
  payload: CreateDemoRequestPayload,
): Promise<{ contactRequest: ContactRequest }> => {
  const response = await fetch(`${API_BASE_URL}/contact/demo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<{ contactRequest: ContactRequest }>(response);
};

/**
 * GET /api/contact/history
 * Get parent's contact history
 */
export const getContactHistory = async (
  token: string,
  params?: {
    status?: ContactStatus;
    contactType?: ContactType;
    page?: number;
    limit?: number;
  },
): Promise<ContactHistoryResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.contactType) queryParams.append('contactType', params.contactType);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = queryParams.toString()
    ? `${API_BASE_URL}/contact/history?${queryParams.toString()}`
    : `${API_BASE_URL}/contact/history`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<ContactHistoryResponse>(response);
};

/**
 * GET /api/contact/:id
 * Get single contact request details
 */
export const getContactRequestById = async (
  token: string,
  id: string,
): Promise<{ contactRequest: ContactRequest }> => {
  const response = await fetch(`${API_BASE_URL}/contact/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<{ contactRequest: ContactRequest }>(response);
};

/**
 * PATCH /api/contact/:id/status
 * Update contact request status (accept/reject/complete)
 */
export const updateContactRequestStatus = async (
  token: string,
  id: string,
  payload: UpdateContactStatusPayload,
): Promise<{ contactRequest: ContactRequest }> => {
  const response = await fetch(`${API_BASE_URL}/contact/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<{ contactRequest: ContactRequest }>(response);
};

// ── Teacher API Functions ────────────────────────────────────────────────────

/**
 * GET /api/contact/teacher-requests
 * Get teacher's contact requests (with search, filter, stats)
 */
export const getTeacherContactRequests = async (
  token: string,
  params?: {
    status?: ContactStatus | 'all';
    contactType?: ContactType;
    page?: number;
    limit?: number;
    search?: string;
    upcoming?: boolean;
    past?: boolean;
  },
): Promise<ContactHistoryResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
  if (params?.contactType) queryParams.append('contactType', params.contactType);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.upcoming) queryParams.append('upcoming', 'true');
  if (params?.past) queryParams.append('past', 'true');

  const url = queryParams.toString()
    ? `${API_BASE_URL}/contact/teacher-requests?${queryParams.toString()}`
    : `${API_BASE_URL}/contact/teacher-requests`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<ContactHistoryResponse>(response);
};

/**
 * PATCH /api/contact/:id/status (complete demo with feedback)
 * Teacher marks demo as completed with outcome
 */
export const completeDemoRequest = async (
  token: string,
  id: string,
  payload: CompleteDemoPayload,
): Promise<{ contactRequest: ContactRequest }> => {
  const response = await fetch(`${API_BASE_URL}/contact/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'completed', ...payload }),
  });

  return handleResponse<{ contactRequest: ContactRequest }>(response);
};

/**
 * PATCH /api/contact/demo/:id
 * Reschedule demo request
 */
export const rescheduleDemoRequest = async (
  token: string,
  id: string,
  payload: RescheduleDemoPayload,
): Promise<{ contactRequest: ContactRequest }> => {
  const response = await fetch(`${API_BASE_URL}/contact/demo/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<{ contactRequest: ContactRequest }>(response);
};

// ── Utility Functions ────────────────────────────────────────────────────────

/**
 * Get status color for UI
 */
export const getContactStatusColor = (status: ContactStatus): string => {
  const statusColors: Record<string, string> = {
    pending: '#F59E0B',
    accepted: '#10B981',
    rejected: '#EF4444',
    completed: '#3B82F6',
    rescheduled: '#8B5CF6',
  };
  return statusColors[status] || '#9CA3AF';
};

/**
 * Get status label for UI
 */
export const getContactStatusLabel = (status: ContactStatus): string => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    completed: 'Completed',
    rescheduled: 'Rescheduled',
  };
  return labels[status] || status;
};

/**
 * Get contact type icon name (Ionicons)
 */
export const getContactTypeIcon = (type: ContactType): string => {
  const icons: Record<ContactType, string> = {
    call: 'call-outline',
    whatsapp: 'logo-whatsapp',
    message: 'chatbubble-outline',
    demo: 'videocam-outline',
  };
  return icons[type];
};

/**
 * Get contact type label
 */
export const getContactTypeLabel = (type: ContactType): string => {
  const labels: Record<ContactType, string> = {
    call: 'Phone Call',
    whatsapp: 'WhatsApp',
    message: 'Message',
    demo: 'Demo Class',
  };
  return labels[type];
};

// ─────────────────────────────────────────────
// Calendar Types
// ─────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  type: 'demo' | 'blocked';
  title: string;
  date: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  mode?: 'online' | 'offline';
  status?: ContactStatus;
  studentName?: string;
  parentName?: string;
  subjects?: string[];
  requirementId?: string;
  contactRequestId?: string;
  meetingLink?: string;
  duration?: number;
  isFullDay?: boolean;
  reasonType?: 'vacation' | 'exam' | 'personal' | 'medical' | 'other';
  blockedTimeId?: string;
  isRecurring?: boolean;
  recurringDays?: string[];
  backgroundColor?: string;
  borderColor?: string;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  demos: CalendarEvent[];
  blockedTimes: CalendarEvent[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  stats: {
    today: number;
    tomorrow: number;
    thisWeek: number;
    totalUpcoming: number;
    blockedDays: number;
  };
}

export interface BlockTimePayload {
  date: string;
  startTime?: string;
  endTime?: string;
  isFullDay?: boolean;
  reason: string;
  reasonType?: 'vacation' | 'exam' | 'personal' | 'medical' | 'other';
  isRecurring?: boolean;
  recurringDays?: string[];
}

export interface BlockedTimeResponse {
  blockedTime: {
    _id: string;
    blockedTimeId: string;
    date: string;
    reason: string;
    reasonType: string;
    isFullDay: boolean;
    startTime?: string;
    endTime?: string;
    isRecurring: boolean;
    recurringDays?: string[];
  };
  conflicts?: {
    warning: string;
    demos: Array<{
      id: string;
      time?: string;
      requirementId?: string;
    }>;
  };
}

export interface ConflictInfo {
  type: 'demo' | 'blocked';
  id: string;
  contactRequestId?: string;
  blockedTimeId?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  subject?: string;
  studentName?: string;
  reason?: string;
  isFullDay?: boolean;
  overlapMinutes?: number;
}

export interface ConflictCheckResponse {
  date: string;
  hasConflicts: boolean;
  conflictCount: number;
  conflicts: ConflictInfo[];
  demosOnDate: Array<{
    id: string;
    time?: string;
    subject?: string;
  }>;
  blockedTimesOnDate: Array<{
    id: string;
    isFullDay: boolean;
    startTime?: string;
    endTime?: string;
    reason: string;
  }>;
}

// ─────────────────────────────────────────────
// Calendar API Functions
// ─────────────────────────────────────────────

/**
 * GET /api/contact/calendar
 * Get teacher's calendar data (demos + blocked time) for date range
 */
export const getTeacherCalendar = async (
  token: string,
  params?: {
    startDate?: string;
    endDate?: string;
  },
): Promise<CalendarResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const url = queryParams.toString()
    ? `${API_BASE_URL}/contact/calendar?${queryParams.toString()}`
    : `${API_BASE_URL}/contact/calendar`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<CalendarResponse>(response);
};

/**
 * POST /api/contact/calendar/block
 * Block a date/time slot
 */
export const blockTimeSlot = async (
  token: string,
  payload: BlockTimePayload,
): Promise<BlockedTimeResponse> => {
  const response = await fetch(`${API_BASE_URL}/contact/calendar/block`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<BlockedTimeResponse>(response);
};

/**
 * DELETE /api/contact/calendar/block/:id
 * Remove a blocked time entry
 */
export const unblockTimeSlot = async (
  token: string,
  id: string,
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/contact/calendar/block/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<{ success: boolean; message: string }>(response);
};

/**
 * GET /api/contact/calendar/conflicts
 * Check for availability conflicts
 */
export const checkAvailabilityConflicts = async (
  token: string,
  params: {
    date: string;
    startTime?: string;
    endTime?: string;
    excludeDemoId?: string;
  },
): Promise<ConflictCheckResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('date', params.date);
  if (params.startTime) queryParams.append('startTime', params.startTime);
  if (params.endTime) queryParams.append('endTime', params.endTime);
  if (params.excludeDemoId) queryParams.append('excludeDemoId', params.excludeDemoId);

  const response = await fetch(`${API_BASE_URL}/contact/calendar/conflicts?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<ConflictCheckResponse>(response);
};
