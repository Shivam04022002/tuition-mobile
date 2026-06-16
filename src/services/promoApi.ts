import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DiscountType = 'flat' | 'percent';
export type ApplicableTo = 'unlock_lead' | 'unlock_tutor' | 'subscription' | 'credit_pack' | 'all';

export interface PromoCode {
  _id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  applicableTo: ApplicableTo;
  applicablePlans?: string[];
  applicablePacks?: string[];
  minOrderAmount: number;
  usageLimit: number;
  usageCount: number;
  perUserLimit: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  restrictedToUserIds?: string[];
  totalDiscountGiven: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoValidationInput {
  code: string;
  type: ApplicableTo;
  baseAmount: number;
  planName?: string;
  packId?: string;
}

export interface PromoValidationResult {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  discount: number;
  discountedBase: number;
  gstAmount: number;
  totalAmount: number;
  validTo: string;
}

export interface PromoApplyInput extends PromoValidationInput {
  orderId?: string;
}

export interface PromoApplyResult extends PromoValidationResult {
  savingsPercentage: number;
  appliedAt: string;
}

export interface CreatePromoInput {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  applicableTo: ApplicableTo;
  applicablePlans?: string[];
  applicablePacks?: string[];
  minOrderAmount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom: string;
  validTo: string;
  restrictedToUserIds?: string[];
}

export interface UpdatePromoInput {
  description?: string;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
  usageLimit?: number;
  perUserLimit?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  restrictedToUserIds?: string[];
  applicablePlans?: string[];
  applicablePacks?: string[];
  applicableTo?: ApplicableTo;
}

export interface PromoListResponse {
  promos: PromoCode[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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

export const validatePromoCode = (token: string, input: PromoValidationInput) =>
  request<{ data: PromoValidationResult }>('POST', `${API_BASE_URL}/promos/validate`, token, input);

export const applyPromoCode = (token: string, input: PromoApplyInput) =>
  request<{ data: PromoApplyResult }>('POST', `${API_BASE_URL}/promos/apply`, token, input);

// ─────────────────────────────────────────────────────────────────────────────
// API Functions - Admin
// ─────────────────────────────────────────────────────────────────────────────

export const listPromoCodes = (token: string, page = 1, limit = 20, isActive?: boolean) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (isActive !== undefined) params.append('isActive', String(isActive));
  return request<PromoListResponse>('GET', `${API_BASE_URL}/admin/promos?${params}`, token);
};

export const createPromoCode = (token: string, input: CreatePromoInput) =>
  request<{ data: PromoCode }>('POST', `${API_BASE_URL}/admin/promos`, token, input);

export const updatePromoCode = (token: string, id: string, input: UpdatePromoInput) =>
  request<{ data: PromoCode }>('PATCH', `${API_BASE_URL}/admin/promos/${id}`, token, input);

export const deactivatePromoCode = (token: string, id: string) =>
  request<{ data: { code: string } }>('DELETE', `${API_BASE_URL}/admin/promos/${id}`, token);
