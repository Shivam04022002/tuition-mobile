import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UnlockedContact {
  phone: string;
  email: string;
  address: string;
  name?: string;
  parentName?: string;
}

export interface PaymentSummary {
  paymentId: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface UnlockResult {
  unlockId: string;
  contact: UnlockedContact;
  payment: PaymentSummary;
  expiresAt: string;
}

export interface UnlockHistoryItem {
  unlockId: string;
  unlockStatus: 'active' | 'expired' | 'refunded';
  paymentStatus: string;
  amount: number;
  currency: string;
  unlockedAt: string;
  expiresAt: string;
  conversionStatus: string;
  requirement: any;
  tutor: any;
  contact: {
    phone: string;
    email: string;
    address: string;
  };
}

export interface PaymentIntent {
  intentId: string;
  status: 'pending' | 'paid' | 'failed';
  amount: number;
  gstAmount: number;
  totalAmount: number;
  currency: string;
  type: string;
  targetId: string;
  expiresAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher: unlock parent contact for a lead (requirement)
// POST /api/unlock/teacher/:leadId
// ─────────────────────────────────────────────────────────────────────────────
export async function unlockLeadContact(
  token: string,
  leadId: string,
): Promise<UnlockResult> {
  const res = await fetch(`${API_BASE_URL}/unlock/teacher/${leadId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to unlock lead');
  }
  return json.data as UnlockResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parent: unlock tutor contact
// POST /api/unlock/parent/:teacherId
// ─────────────────────────────────────────────────────────────────────────────
export async function unlockTutorContact(
  token: string,
  teacherId: string,
): Promise<UnlockResult> {
  const res = await fetch(`${API_BASE_URL}/unlock/parent/${teacherId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to unlock tutor contact');
  }
  return json.data as UnlockResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Unlock history (teacher or parent)
// GET /api/unlock/history
// ─────────────────────────────────────────────────────────────────────────────
export async function getUnlockHistory(
  token: string,
  page = 1,
  limit = 10,
): Promise<{ items: UnlockHistoryItem[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
  const res = await fetch(
    `${API_BASE_URL}/unlock/history?page=${page}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load unlock history');
  }
  return json.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Create payment intent (simulation fallback)
// POST /api/unlock/payment-intent
// ─────────────────────────────────────────────────────────────────────────────
export async function createPaymentIntent(
  token: string,
  type: 'unlock_lead' | 'unlock_tutor',
  targetId: string,
): Promise<PaymentIntent> {
  const res = await fetch(`${API_BASE_URL}/unlock/payment-intent`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, targetId }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to create payment intent');
  }
  return json.data as PaymentIntent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Razorpay order + verify types
// ─────────────────────────────────────────────────────────────────────────────
export interface RazorpayOrderData {
  orderId: string;          // Razorpay order_XXXXX — pass to RazorpayCheckout
  keyId: string;            // rzp_test_XXXX — pass to RazorpayCheckout
  amount: number;           // in paise
  amountInRupees: number;
  gstAmount: number;
  totalAmount: number;
  currency: string;
  internalPaymentId: string;
  invoiceNumber: string;
  type: string;
  targetId: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: { color: string };
}

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  internalPaymentId: string;
  type: 'unlock_lead' | 'unlock_tutor';
  targetId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Create Razorpay order
// POST /api/unlock/order
// Call this BEFORE opening Razorpay checkout. Returns orderId + keyId.
// ─────────────────────────────────────────────────────────────────────────────
export async function createRazorpayOrder(
  token: string,
  type: 'unlock_lead' | 'unlock_tutor',
  targetId: string,
): Promise<RazorpayOrderData> {
  const res = await fetch(`${API_BASE_URL}/unlock/order`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, targetId }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to create Razorpay order');
  }
  return json.data as RazorpayOrderData;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Verify payment after Razorpay checkout completes
// POST /api/unlock/verify
// Call this from the Razorpay onSuccess handler with the returned signature.
// Returns unlock result with revealed contact details.
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyRazorpayPayment(
  token: string,
  input: VerifyPaymentInput,
): Promise<UnlockResult> {
  const res = await fetch(`${API_BASE_URL}/unlock/verify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Payment verification failed');
  }
  return json.data as UnlockResult;
}
