import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ParentSubscriptionPlan {
  planId: string;
  name: 'monthly' | 'quarterly' | 'annual';
  displayName: string;
  description: string;
  price: number;
  durationDays: number;
  contactLimit: number;
  features: string[];
  badge: string;
  badgeColor: string;
}

export interface ParentSubscriptionPlansResponse {
  plans: ParentSubscriptionPlan[];
}

export interface ParentSubscriptionSummary {
  id: string;
  plan: { id: string; name: string; displayName: string; price: number; duration: number } | null;
  status: string;
  startDate: string;
  endDate: string;
}

export interface ParentSubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription: ParentSubscriptionSummary | null;
}

export interface ParentSubscriptionOrderData {
  orderId: string;
  keyId: string;
  amount: number; // paise
  amountInRupees: number;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  currency: string;
  internalPaymentId: string;
  planId: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
}

export interface VerifyParentSubscriptionInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  internalPaymentId: string;
  planId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

export async function getParentPlans(token: string): Promise<ParentSubscriptionPlansResponse> {
  const res = await fetch(`${API_BASE_URL}/parent-subscriptions/plans`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch subscription plans');
  return json.data;
}

export async function getParentSubscriptionStatus(token: string): Promise<ParentSubscriptionStatus> {
  const res = await fetch(`${API_BASE_URL}/parent-subscriptions/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch subscription status');
  return json.data;
}

export async function createParentSubscriptionOrder(
  token: string,
  planId: string,
): Promise<ParentSubscriptionOrderData> {
  const res = await fetch(`${API_BASE_URL}/parent-subscriptions/order`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ planId }),
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create order');
  return json.data;
}

export async function verifyParentSubscriptionPayment(
  token: string,
  input: VerifyParentSubscriptionInput,
): Promise<ParentSubscriptionSummary> {
  const res = await fetch(`${API_BASE_URL}/parent-subscriptions/verify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Payment verification failed');
  return json.data;
}
