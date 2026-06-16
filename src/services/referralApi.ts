import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ReferralStatus = 'pending' | 'registered' | 'first_purchase' | 'rewarded' | 'expired';
export type RewardType = 'credits' | 'subscription_discount';

export interface Referral {
  _id: string;
  referralId: string;
  referrerId: string;
  referrerUserId: string;
  referrerCode: string;
  referredId?: string;
  referredUserId?: string;
  referredName?: string;
  referredEmail?: string;
  status: ReferralStatus;
  registeredAt?: string;
  firstPurchaseAt?: string;
  rewardedAt?: string;
  rewardType: RewardType;
  rewardValue: number;
  rewardGranted: boolean;
  creditTransactionId?: string;
  promoCodeId?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralStats {
  totalReferrals: number;
  pending: number;
  registered: number;
  rewarded: number;
  totalRewardsEarned: number;
}

export interface MyReferralCodeData {
  referralCode: string;
  stats: ReferralStats;
  shareMessage: string;
}

export interface ReferralListResponse {
  referrals: Referral[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TrackReferralInput {
  code: string;
  source?: string;
}

export interface RegisterReferralInput {
  code: string;
  newTeacherId: string;
  newTeacherName: string;
  newTeacherEmail: string;
}

export interface RegisterReferralResult {
  message: string;
  welcomePromoCode: string;
  discount: number;
}

// Admin types
export interface AdminReferralStats {
  totalReferrals: number;
  pending: number;
  registered: number;
  rewarded: number;
  expired: number;
  totalCreditsGranted: number;
}

export interface AdminReferralListResponse {
  referrals: Referral[];
  stats: AdminReferralStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TopReferrer {
  teacherId: string;
  fullName: string;
  email: string;
  referralCode: string;
  totalReferrals: number;
  rewarded: number;
  totalCreditsEarned: number;
  conversionRate: number;
}

export interface TopReferrersResponse {
  topReferrers: TopReferrer[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  token: string,
  body?: any
): Promise<{ success: boolean; data?: T; message?: string }> {
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({ success: false, message: 'Invalid JSON' }));

  if (!res.ok) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions - Teacher
// ─────────────────────────────────────────────────────────────────────────────

export const getMyReferralCode = (token: string) =>
  request<{ data: MyReferralCodeData }>('GET', `${API_BASE_URL}/referrals/my-code`, token);

export const getMyReferrals = (token: string, page = 1, limit = 20, status?: ReferralStatus) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.append('status', status);
  return request<ReferralListResponse>('GET', `${API_BASE_URL}/referrals/my-referrals?${params}`, token);
};

// ─────────────────────────────────────────────────────────────────────────────
// API Functions - Public (No Auth Required)
// ─────────────────────────────────────────────────────────────────────────────

export const trackReferralClick = (input: TrackReferralInput) =>
  request<{ data: { referralId: string; message: string } }>('POST', `${API_BASE_URL}/referrals/track-click`, '', input);

export const registerWithReferral = (input: RegisterReferralInput) =>
  request<{ data: RegisterReferralResult }>('POST', `${API_BASE_URL}/referrals/register`, '', input);

// ─────────────────────────────────────────────────────────────────────────────
// API Functions - Admin
// ─────────────────────────────────────────────────────────────────────────────

export const getAllReferrals = (token: string, page = 1, limit = 20, status?: ReferralStatus, referrerCode?: string) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.append('status', status);
  if (referrerCode) params.append('referrerCode', referrerCode);
  return request<AdminReferralListResponse>('GET', `${API_BASE_URL}/referrals/admin/all?${params}`, token);
};

export const getTopReferrers = (token: string, limit = 10) =>
  request<TopReferrersResponse>('GET', `${API_BASE_URL}/referrals/admin/top-referrers?limit=${limit}`, token);

export const processReferralReward = (token: string, referredTeacherId: string) =>
  request<{ data: { message: string; creditsGranted: number; referralId: string } }>(
    'POST',
    `${API_BASE_URL}/referrals/process-reward`,
    token,
    { referredTeacherId }
  );
