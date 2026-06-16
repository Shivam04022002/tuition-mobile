import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreditPack {
  packId: string;
  name: string;
  credits: number;
  price: number;
  originalPrice: number;
  savings: number;
  popular: boolean;
  description: string;
}

export interface CreditPacksResponse {
  packs: CreditPack[];
  gstRate: number;
}

export interface RazorpayOrderData {
  orderId: string;
  keyId: string;
  amount: number;           // paise
  amountInRupees: number;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  currency: string;
  internalPaymentId: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: { color: string };
}

export interface SubscriptionOrderData extends RazorpayOrderData {
  planName: string;
  billingCycle: 'monthly' | 'annual';
}

export interface CreditPackOrderData extends RazorpayOrderData {
  packId: string;
  credits: number;
}

export interface VerifySubscriptionInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  internalPaymentId: string;
  planName: string;
  billingCycle: 'monthly' | 'annual';
}

export interface VerifyCreditPackInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  internalPaymentId: string;
  packId: string;
}

export interface SubscriptionPaymentResult {
  subscriptionId: string;
  planName: string;
  displayName: string;
  status: string;
  startDate: string;
  endDate: string;
  credits: { remaining: number; total: number };
  payment: {
    paymentId: string;
    amount: number;
    gstAmount: number;
    totalAmount: number;
    status: string;
    razorpayPaymentId: string;
  };
}

export interface CreditPackPaymentResult {
  creditsAdded: number;
  creditsRemaining: number;
  packId: string;
  packName: string;
  payment: {
    paymentId: string;
    amount: number;
    gstAmount: number;
    totalAmount: number;
    status: string;
    razorpayPaymentId: string;
  };
}

export interface PaymentHistoryItem {
  paymentId: string;
  type: 'lead_unlock' | 'subscription' | 'featured_profile' | 'verification' | 'refund';
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  paymentDate?: string;
  createdAt: string;
  invoiceDetails: {
    invoiceNumber: string;
    items: Array<{ description: string; total: number }>;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

export async function getCreditPacks(token: string): Promise<CreditPacksResponse> {
  const res = await fetch(`${API_BASE_URL}/payments/credit-packs`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch credit packs');
  return json.data;
}

export async function createSubscriptionOrder(
  token: string,
  planName: string,
  billingCycle: 'monthly' | 'annual' = 'monthly',
  promoCode?: string,
): Promise<SubscriptionOrderData> {
  const res = await fetch(`${API_BASE_URL}/payments/subscription/order`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ planName, billingCycle, promoCode }),
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create subscription order');
  return json.data;
}

export async function verifySubscriptionPayment(
  token: string,
  input: VerifySubscriptionInput,
): Promise<SubscriptionPaymentResult> {
  const res = await fetch(`${API_BASE_URL}/payments/subscription/verify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Subscription payment verification failed');
  return json.data;
}

export async function createCreditPackOrder(
  token: string,
  packId: string,
  promoCode?: string,
): Promise<CreditPackOrderData> {
  const res = await fetch(`${API_BASE_URL}/payments/credits/order`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ packId, promoCode }),
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create credit pack order');
  return json.data;
}

export async function verifyCreditPackPayment(
  token: string,
  input: VerifyCreditPackInput,
): Promise<CreditPackPaymentResult> {
  const res = await fetch(`${API_BASE_URL}/payments/credits/verify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Credit pack payment verification failed');
  return json.data;
}

export async function getPaymentHistory(
  token: string,
  page: number = 1,
  limit: number = 20,
  type?: string,
): Promise<{ payments: PaymentHistoryItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (type) params.set('type', type);

  const res = await fetch(`${API_BASE_URL}/payments/history?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch payment history');
  return json.data;
}
