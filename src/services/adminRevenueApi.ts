import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ─────────────────────────────────────────────────────────────────────────────
// Filter Types
// ─────────────────────────────────────────────────────────────────────────────

export type RevenueRange = 'today' | '7d' | '30d' | '90d' | 'year' | 'custom';

export interface RevenueFilters {
  range: RevenueRange;
  from?: string;
  to?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RevenueOverviewData {
  period:       { startDate: string; endDate: string; range: string };
  revenue: {
    total:    number;
    monthly:  number;
    today:    number;
    growth:   number;
    previous: number;
  };
  transactions: {
    total:      number;
    previous:   number;
    growth:     number;
    successful: number;
    failed:     number;
    refunded:   number;
    pending:    number;
  };
  amounts: {
    successAmount:  number;
    failedAmount:   number;
    refundedAmount: number;
  };
}

export interface SubscriptionMetricsData {
  period: { startDate: string; endDate: string };
  plans: {
    free:         number;
    starter:      number;
    professional: number;
    premium:      number;
    totalActive:  number;
  };
  activity: {
    newSubscriptions:     number;
    cancelledSubscriptions: number;
    renewals:             number;
    upgrades:             number;
    upgradeRate:          number;
    churnRate:            number;
  };
  revenue: { total: number; count: number; avg: number };
}

export interface CreditMetricsData {
  period: { startDate: string; endDate: string };
  summary: {
    creditsSold:          number;
    creditsConsumed:      number;
    creditsRefunded:      number;
    netCredits:           number;
    topPack:              string;
    avgCreditsPurchased:  number;
  };
  byType: {
    granted:  number;
    unlocks:  number;
    refunds:  number;
    bonuses:  number;
    upgrades: number;
  };
  packBreakdown: Array<{ pack: string; purchases: number; totalCredits: number }>;
  revenue: { total: number; count: number };
}

export interface PaymentItem {
  paymentId:     string;
  type:          string;
  status:        string;
  amount:        number;
  totalAmount:   number;
  gstAmount:     number;
  paymentMethod: string;
  paymentDate:   string | null;
  createdAt:     string;
  invoiceNumber?: string;
  user:          { profile?: { firstName?: string; lastName?: string }; email?: string } | null;
}

export interface PaymentMetricsData {
  period: { startDate: string; endDate: string };
  summary: {
    total:        number;
    completed:    number;
    failed:       number;
    refunded:     number;
    pending:      number;
    successRate:  number;
    failureRate:  number;
    totalRevenue: number;
    avgTxValue:   number;
  };
  byType:   Array<{ type: string; count: number; amount: number }>;
  byMethod: Array<{ method: string; count: number; amount: number }>;
  payments: PaymentItem[];
  pagination: { page: number; limit: number; total: number; pages: number; hasMore: boolean };
}

export interface InvoiceItem {
  _id:           string;
  invoiceNumber: string;
  invoiceDate:   string;
  status:        string;
  grandTotal:    number;
  gstTotal:      number;
  buyer:         { name: string; email: string; phone: string };
  user:          { profile?: { firstName?: string; lastName?: string }; email?: string } | null;
  createdAt:     string;
}

export interface InvoiceMetricsData {
  period: { startDate: string; endDate: string };
  summary: {
    total:         number;
    issued:        number;
    draft:         number;
    cancelled:     number;
    grandTotal:    number;
    subtotal:      number;
    gstTotal:      number;
    promoDiscount: number;
  };
  invoices:   InvoiceItem[];
  pagination: { page: number; limit: number; total: number; pages: number; hasMore: boolean };
}

export interface DailyPoint  { date: string; revenue: number; transactions: number }
export interface MonthlyPoint { month: string; revenue: number; transactions: number }

export interface RevenueChartsData {
  period:  { startDate: string; endDate: string };
  daily:   DailyPoint[];
  monthly: MonthlyPoint[];
  byType:  Array<{ type: string; revenue: number; count: number }>;
  subscriptionDistribution: Array<{ plan: string; count: number }>;
  creditTrend: Array<{ date: string; unlocks: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildQuery(filters: RevenueFilters, extra: Record<string, string | number> = {}): string {
  const params: Record<string, string> = { range: filters.range };
  if (filters.from) params.from = filters.from;
  if (filters.to)   params.to   = filters.to;
  Object.entries(extra).forEach(([k, v]) => { params[k] = String(v); });
  return new URLSearchParams(params).toString();
}

async function get<T>(url: string, token: string): Promise<{ success: boolean; data: T; message?: string }> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

export const getRevenueOverview = (token: string, filters: RevenueFilters) =>
  get<RevenueOverviewData>(`${API_BASE_URL}/admin/revenue/overview?${buildQuery(filters)}`, token);

export const getSubscriptionMetrics = (token: string, filters: RevenueFilters) =>
  get<SubscriptionMetricsData>(`${API_BASE_URL}/admin/revenue/subscriptions?${buildQuery(filters)}`, token);

export const getCreditMetrics = (token: string, filters: RevenueFilters) =>
  get<CreditMetricsData>(`${API_BASE_URL}/admin/revenue/credits?${buildQuery(filters)}`, token);

export const getPaymentMetrics = (token: string, filters: RevenueFilters, page = 1, limit = 20) =>
  get<PaymentMetricsData>(
    `${API_BASE_URL}/admin/revenue/payments?${buildQuery(filters, { page, limit })}`,
    token,
  );

export const getInvoiceMetrics = (token: string, filters: RevenueFilters, page = 1, limit = 20) =>
  get<InvoiceMetricsData>(
    `${API_BASE_URL}/admin/revenue/invoices?${buildQuery(filters, { page, limit })}`,
    token,
  );

export const getRevenueCharts = (token: string, filters: RevenueFilters) =>
  get<RevenueChartsData>(`${API_BASE_URL}/admin/revenue/charts?${buildQuery(filters)}`, token);
