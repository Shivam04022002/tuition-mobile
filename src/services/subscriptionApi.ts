import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ==================== TYPES ====================

export interface PlanLimits {
  applicationsPerMonth: number;   // -1 = unlimited
  leadUnlocksPerMonth: number;    // -1 = unlimited
  creditsPerMonth: number;          // -1 = unlimited
  profileVisibilityBoost: number;
  analyticsAccess: 'none' | 'basic' | 'advanced' | 'full';
  priorityPlacement: boolean;
  prioritySupport: boolean;
  demoInsights: boolean;
}

export interface SubscriptionPlan {
  _id: string;
  planId: string;
  name: 'free' | 'starter' | 'professional' | 'premium';
  displayName: string;
  description: string;
  price: number;
  annualPrice: number;
  currency: string;
  limits: PlanLimits;
  features: string[];
  badge: string;
  badgeColor: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
}

export interface SubscriptionInfo {
  subscriptionId: string;
  planName: 'free' | 'starter' | 'professional' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

export interface SubscriptionUsage {
  applicationsUsed: number;
  leadUnlocksUsed: number;
  periodStart: string;
  periodEnd: string;
}

export interface SubscriptionRemaining {
  applications: number;  // -1 = unlimited
  leadUnlocks: number;   // -1 = unlimited
}

export interface CurrentSubscriptionData {
  subscription: SubscriptionInfo | null;
  currentPlan: 'free' | 'starter' | 'professional' | 'premium';
  plan: SubscriptionPlan;
  usage: SubscriptionUsage;
  limits: PlanLimits;
  remaining: SubscriptionRemaining;
}

export interface SelectPlanResult {
  subscription: SubscriptionInfo;
  plan: {
    name: string;
    displayName: string;
    limits: PlanLimits;
    features: string[];
    badge: string;
    badgeColor: string;
  };
  action: 'subscribed' | 'upgraded' | 'downgraded';
}

export interface CancelResult {
  previousPlan: string;
  currentPlan: string;
  cancelledAt: string;
}

// ==================== API FUNCTIONS ====================

export async function getSubscriptionPlans(token: string): Promise<SubscriptionPlan[]> {
  const res = await fetch(`${API_BASE_URL}/subscriptions/plans`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to fetch plans');
  }

  const body = await res.json();
  return body.data.plans;
}

export async function getCurrentSubscription(token: string): Promise<CurrentSubscriptionData> {
  const res = await fetch(`${API_BASE_URL}/subscriptions/current`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to fetch subscription');
  }

  const body = await res.json();
  return body.data;
}

export async function selectPlan(token: string, planName: string): Promise<SelectPlanResult> {
  const res = await fetch(`${API_BASE_URL}/subscriptions/select`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planName }),
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to select plan');
  }

  const body = await res.json();
  return body.data;
}

export async function cancelSubscription(token: string, reason?: string): Promise<CancelResult> {
  const res = await fetch(`${API_BASE_URL}/subscriptions/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });

  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to cancel subscription');
  }

  const body = await res.json();
  return body.data;
}
