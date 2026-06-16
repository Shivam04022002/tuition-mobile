import { apiConfig } from '../config/api';
import { store } from '../redux/store';

const BASE_URL = `${apiConfig.baseURL}/admin`;

export interface Subscription {
  _id: string;
  subscriptionId: string;
  planName: 'free' | 'starter' | 'professional' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'suspended';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  credits: { creditsRemaining: number; creditsUsed: number; creditResetDate: string };
  usage: { applicationsUsed: number; leadUnlocksUsed: number; periodStart: string; periodEnd: string };
  teacher: {
    teacherId: string;
    fullName: string;
    email: string;
    phone: string;
    verificationStatus: string;
    profilePhoto?: string;
  };
}

export interface SubscriptionFilters {
  page?: number;
  limit?: number;
  plan?: string;
  status?: string;
  search?: string;
  kycStatus?: string;
  minCredits?: number;
  expiryBefore?: string;
  expiryAfter?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SubscriptionDetail {
  subscription: any;
  payments: any[];
  creditTransactions: any[];
  auditHistory: AuditLogEntry[];
}

export interface AuditLogEntry {
  adminId: string;
  teacherId: string;
  action: string;
  entityType: string;
  oldValue: any;
  newValue: any;
  reason: string;
  timestamp: string;
  metadata?: any;
}

export interface SubscriptionSummary {
  planDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  upcomingExpirations: number;
  suspendedCount: number;
  topPayingTeachers: any[];
  mostActiveSubscribers: any[];
}

function getAuthHeaders() {
  const token = store.getState().auth.token;
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function buildQuery(filters?: SubscriptionFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== null) params.append(key, String(value)); });
  return params.toString() ? `?${params.toString()}` : '';
}

export async function getSubscriptions(filters?: SubscriptionFilters): Promise<{ success: boolean; data: { subscriptions: Subscription[]; pagination: any } }> {
  const response = await fetch(`${BASE_URL}/subscriptions${buildQuery(filters)}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch subscriptions');
  return response.json();
}

export async function getSubscriptionDetail(teacherId: string): Promise<{ success: boolean; data: SubscriptionDetail }> {
  const response = await fetch(`${BASE_URL}/subscriptions/${teacherId}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch subscription details');
  return response.json();
}

export async function upgradeSubscription(teacherId: string, targetPlan: string, reason: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BASE_URL}/subscriptions/upgrade`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ teacherId, targetPlan, reason }) });
  if (!response.ok) throw new Error('Failed to upgrade subscription');
  return response.json();
}

export async function downgradeSubscription(teacherId: string, targetPlan: string, reason: string, atPeriodEnd?: boolean): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BASE_URL}/subscriptions/downgrade`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ teacherId, targetPlan, reason, atPeriodEnd }) });
  if (!response.ok) throw new Error('Failed to downgrade subscription');
  return response.json();
}

export async function extendSubscription(teacherId: string, extensionDays: number, reason: string, extendFrom?: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BASE_URL}/subscriptions/extend`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ teacherId, extensionDays, reason, extendFrom }) });
  if (!response.ok) throw new Error('Failed to extend subscription');
  return response.json();
}

export async function suspendSubscription(teacherId: string, reason: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BASE_URL}/subscriptions/suspend`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ teacherId, reason }) });
  if (!response.ok) throw new Error('Failed to suspend subscription');
  return response.json();
}

export async function reactivateSubscription(teacherId: string, reason: string, extendIfExpired?: boolean): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BASE_URL}/subscriptions/reactivate`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ teacherId, reason, extendIfExpired }) });
  if (!response.ok) throw new Error('Failed to reactivate subscription');
  return response.json();
}

export async function cancelSubscription(teacherId: string, reason: string, atPeriodEnd?: boolean): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BASE_URL}/subscriptions/cancel`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ teacherId, reason, atPeriodEnd }) });
  if (!response.ok) throw new Error('Failed to cancel subscription');
  return response.json();
}

export async function getSubscriptionSummary(): Promise<{ success: boolean; data: SubscriptionSummary }> {
  const response = await fetch(`${BASE_URL}/subscriptions/summary`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch subscription summary');
  return response.json();
}

export async function getSubscriptionAuditLogs(teacherId?: string): Promise<{ success: boolean; data: { logs: AuditLogEntry[] } }> {
  const query = teacherId ? `?teacherId=${teacherId}` : '';
  const response = await fetch(`${BASE_URL}/subscriptions/audit-logs${query}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch audit logs');
  return response.json();
}
