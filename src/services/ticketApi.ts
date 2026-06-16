import { apiConfig } from '../config/api';

const BASE = apiConfig.baseURL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory =
  | 'payment_issue'
  | 'refund_request'
  | 'tutor_issue'
  | 'teacher_issue'
  | 'technical_issue'
  | 'account_issue'
  | 'lead_unlock_issue'
  | 'profile_verification'
  | 'application_issue'
  | 'other';

export interface TicketMessage {
  _id: string;
  sender: 'user' | 'admin' | 'staff';
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userRole: 'parent' | 'teacher' | 'admin' | 'staff';
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  status: TicketStatus;
  assignedTo?: string;
  assignedToName?: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface TicketCounts {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

export interface TicketStats {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  urgent: number;
  pending24h: number;
  recentResolved: number;
  total: number;
}

export interface TicketListResult {
  tickets: Ticket[];
  counts: TicketCounts;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateTicketData {
  category: TicketCategory;
  priority?: TicketPriority;
  subject: string;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Category mapping helpers (for UI display)
// ─────────────────────────────────────────────────────────────────────────────
export const CATEGORY_DISPLAY: Record<TicketCategory, string> = {
  payment_issue: 'Payment Issue',
  refund_request: 'Refund Request',
  tutor_issue: 'Tutor Issue',
  teacher_issue: 'Teacher Issue',
  technical_issue: 'Technical Issue',
  account_issue: 'Account Issue',
  lead_unlock_issue: 'Lead Unlock Issue',
  profile_verification: 'Profile Verification',
  application_issue: 'Application Issue',
  other: 'Other',
};

export const STATUS_DISPLAY: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const PRIORITY_DISPLAY: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Parent categories
export const PARENT_TICKET_CATEGORIES: TicketCategory[] = [
  'payment_issue',
  'refund_request',
  'tutor_issue',
  'technical_issue',
  'account_issue',
  'other',
];

// Teacher categories
export const TEACHER_TICKET_CATEGORIES: TicketCategory[] = [
  'lead_unlock_issue',
  'profile_verification',
  'application_issue',
  'payment_issue',
  'technical_issue',
  'account_issue',
  'other',
];

// Status colors (matching existing UI)
export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  open: '#F59E0B',
  in_progress: '#3B82F6',
  resolved: '#10B981',
  closed: '#94A3B8',
};

// Priority colors (matching existing UI)
export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: '#10B981',
  medium: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444',
};

// Priority constants array for UI
export const TICKET_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tickets
// ─────────────────────────────────────────────────────────────────────────────
export async function getTickets(
  token: string,
  opts?: {
    status?: TicketStatus;
    category?: TicketCategory;
    priority?: TicketPriority;
    page?: number;
    limit?: number;
    mine?: boolean;
  },
): Promise<TicketListResult> {
  const params = new URLSearchParams();
  if (opts?.status) params.set('status', opts.status);
  if (opts?.category) params.set('category', opts.category);
  if (opts?.priority) params.set('priority', opts.priority);
  if (opts?.page) params.set('page', String(opts.page));
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.mine) params.set('mine', 'true');

  const res = await fetch(`${BASE}/tickets?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch tickets');
  return json.data as TicketListResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tickets/stats
// ─────────────────────────────────────────────────────────────────────────────
export async function getTicketStats(token: string): Promise<TicketStats> {
  const res = await fetch(`${BASE}/tickets/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch ticket stats');
  return json.data as TicketStats;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tickets/:id
// ─────────────────────────────────────────────────────────────────────────────
export async function getTicketById(token: string, id: string): Promise<Ticket> {
  const res = await fetch(`${BASE}/tickets/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch ticket');
  return json.data as Ticket;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tickets
// ─────────────────────────────────────────────────────────────────────────────
export async function createTicket(
  token: string,
  data: CreateTicketData,
): Promise<Ticket> {
  const res = await fetch(`${BASE}/tickets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create ticket');
  return json.data as Ticket;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tickets/:id/reply
// ─────────────────────────────────────────────────────────────────────────────
export async function replyToTicket(
  token: string,
  id: string,
  message: string,
): Promise<Ticket> {
  const res = await fetch(`${BASE}/tickets/${id}/reply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to add reply');
  return json.data as Ticket;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tickets/:id/assign
// ─────────────────────────────────────────────────────────────────────────────
export async function assignTicket(
  token: string,
  id: string,
  assigneeId?: string,
  assigneeName?: string,
): Promise<Ticket> {
  const res = await fetch(`${BASE}/tickets/${id}/assign`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assigneeId, assigneeName }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to assign ticket');
  return json.data as Ticket;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tickets/:id/resolve
// ─────────────────────────────────────────────────────────────────────────────
export async function resolveTicket(
  token: string,
  id: string,
  resolutionMessage?: string,
): Promise<Ticket> {
  const res = await fetch(`${BASE}/tickets/${id}/resolve`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resolutionMessage }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to resolve ticket');
  return json.data as Ticket;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tickets/:id/close
// ─────────────────────────────────────────────────────────────────────────────
export async function closeTicket(
  token: string,
  id: string,
  closeMessage?: string,
): Promise<Ticket> {
  const res = await fetch(`${BASE}/tickets/${id}/close`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ closeMessage }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to close ticket');
  return json.data as Ticket;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tickets/:id/reopen
// ─────────────────────────────────────────────────────────────────────────────
export async function reopenTicket(
  token: string,
  id: string,
  reopenMessage?: string,
): Promise<Ticket> {
  const res = await fetch(`${BASE}/tickets/${id}/reopen`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reopenMessage }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to reopen ticket');
  return json.data as Ticket;
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tickets/:id
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteTicket(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/tickets/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete ticket');
}
