import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ==================== TYPES ====================

export interface CreditBalance {
  planName: 'free' | 'starter' | 'professional' | 'premium';
  creditsRemaining: number; // -1 = unlimited
  creditsUsed: number;
  totalCredits: number;     // -1 = unlimited
  isUnlimited: boolean;
  creditResetDate: string;
}

export interface CreditTransactionMeta {
  requirementId?: string;
  planName?: string;
  fromPlan?: string;
  toPlan?: string;
  unlockId?: string;
  refundReason?: string;
  bonusReason?: string;
}

export interface CreditTransactionItem {
  _id: string;
  transactionId: string;
  type: 'CREDIT_GRANTED' | 'LEAD_UNLOCK' | 'CREDIT_REFUND' | 'BONUS_CREDIT' | 'PLAN_UPGRADE';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  metadata: CreditTransactionMeta;
  createdAt: string;
}

export interface CreditHistoryResponse {
  transactions: CreditTransactionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ParentContactDetails {
  parentName: string;
  mobileNumber: string;
  email: string;
  address: string;
  alternateNumber?: string;
}

export interface UnlockLeadResult {
  unlockId: string;
  parentContactDetails: ParentContactDetails;
  creditsRemaining: number;
  creditsUsed: number;
}

export interface RefundResult {
  creditsRemaining: number;
  refundedUnlockId: string;
}

// ==================== API FUNCTIONS ====================

export async function getCreditBalance(token: string): Promise<CreditBalance> {
  const res = await fetch(`${API_BASE_URL}/credits/balance`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to fetch credit balance');
  }

  const body = await res.json();
  return body.data;
}

export async function getCreditHistory(
  token: string,
  page: number = 1,
  limit: number = 20,
  type?: string,
): Promise<CreditHistoryResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (type) params.set('type', type);

  const res = await fetch(`${API_BASE_URL}/credits/history?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to fetch credit history');
  }

  const body = await res.json();
  return body.data;
}

export async function unlockLead(token: string, requirementId: string): Promise<UnlockLeadResult> {
  const res = await fetch(`${API_BASE_URL}/credits/unlock-lead`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ requirementId }),
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (res.status === 409) {
    const body = await res.json().catch(() => ({}));
    // Already unlocked — return existing data
    if (body.data) {
      return body.data as UnlockLeadResult;
    }
    throw new Error(body.message || 'Lead already unlocked');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to unlock lead');
  }

  const body = await res.json();
  return body.data;
}

export async function refundCredit(token: string, unlockId: string, reason: string): Promise<RefundResult> {
  const res = await fetch(`${API_BASE_URL}/credits/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ unlockId, reason }),
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to refund credit');
  }

  const body = await res.json();
  return body.data;
}
