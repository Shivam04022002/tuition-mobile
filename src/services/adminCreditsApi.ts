import { apiConfig } from '../config/api';
import { store } from '../redux/store';

const BASE_URL = `${apiConfig.baseURL}/admin`;

export interface CreditBalance {
  _id: string;
  subscriptionId: string;
  planName: string;
  status: string;
  credits: { creditsRemaining: number; creditsUsed: number; creditResetDate: string };
  usage: { applicationsUsed: number; leadUnlocksUsed: number };
  teacher: {
    teacherId: string;
    fullName: string;
    email: string;
    phone: string;
    profilePhoto?: string;
    verificationStatus: string;
  };
}

export interface CreditFilters {
  page?: number;
  limit?: number;
  search?: string;
  minBalance?: number;
  maxBalance?: number;
  plan?: string;
}

export interface CreditDetail {
  subscription: any;
  transactions: any[];
  summary: { granted: number; consumed: number; refunded: number; bonus: number };
  auditHistory: CreditAuditEntry[];
}

export interface CreditAuditEntry {
  adminId: string;
  teacherId: string;
  action: 'grant' | 'deduct' | 'bonus' | 'correction';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  timestamp: string;
  metadata?: any;
}

export interface CreditTransaction {
  _id: string;
  transactionId: string;
  teacherId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  teacher?: { basicDetails?: { fullName?: string } };
}

function getAuthHeaders() {
  const token = store.getState().auth.token;
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function buildQuery(filters?: CreditFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== null) params.append(key, String(value)); });
  return params.toString() ? `?${params.toString()}` : '';
}

export async function getAllCredits(filters?: CreditFilters): Promise<{ success: boolean; data: { teachers: CreditBalance[]; pagination: any } }> {
  const response = await fetch(`${BASE_URL}/credits${buildQuery(filters)}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch credits');
  return response.json();
}

export async function getTeacherCredits(teacherId: string): Promise<{ success: boolean; data: CreditDetail }> {
  const response = await fetch(`${BASE_URL}/credits/${teacherId}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch credit details');
  return response.json();
}

export async function grantCredits(teacherId: string, amount: number, reason: string, expiresAt?: string): Promise<{ success: boolean; message: string; data: any }> {
  const response = await fetch(`${BASE_URL}/credits/grant`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ teacherId, amount, reason, expiresAt }) });
  if (!response.ok) throw new Error('Failed to grant credits');
  return response.json();
}

export async function deductCredits(teacherId: string, amount: number, reason: string): Promise<{ success: boolean; message: string; data: any }> {
  const response = await fetch(`${BASE_URL}/credits/deduct`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ teacherId, amount, reason }) });
  if (!response.ok) throw new Error('Failed to deduct credits');
  return response.json();
}

export async function grantBonusCredits(teacherId: string, amount: number, reason: string, bonusType?: string): Promise<{ success: boolean; message: string; data: any }> {
  const response = await fetch(`${BASE_URL}/credits/bonus`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ teacherId, amount, reason, bonusType }) });
  if (!response.ok) throw new Error('Failed to grant bonus credits');
  return response.json();
}

export async function correctCredits(teacherId: string, newBalance: number, reason: string): Promise<{ success: boolean; message: string; data: any }> {
  const response = await fetch(`${BASE_URL}/credits/correct`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ teacherId, newBalance, reason }) });
  if (!response.ok) throw new Error('Failed to correct credits');
  return response.json();
}

export async function getCreditsSummary(): Promise<{ success: boolean; data: any }> {
  const response = await fetch(`${BASE_URL}/credits/summary`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch credits summary');
  return response.json();
}

export async function getCreditTransactions(page?: number, limit?: number, teacherId?: string): Promise<{ success: boolean; data: { transactions: CreditTransaction[]; pagination: any } }> {
  const params = new URLSearchParams();
  if (page) params.append('page', String(page));
  if (limit) params.append('limit', String(limit));
  if (teacherId) params.append('teacherId', teacherId);
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${BASE_URL}/credits/transactions${query}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch transactions');
  return response.json();
}

export async function getCreditAuditLogs(teacherId?: string): Promise<{ success: boolean; data: { logs: CreditAuditEntry[] } }> {
  const query = teacherId ? `?teacherId=${teacherId}` : '';
  const response = await fetch(`${BASE_URL}/credits/audit-logs${query}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch audit logs');
  return response.json();
}
