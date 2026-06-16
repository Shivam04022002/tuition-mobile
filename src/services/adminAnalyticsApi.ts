import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface OverviewAnalytics {
  users: {
    totalParents: number;
    totalTeachers: number;
    newParentsThisMonth: number;
    newTeachersThisMonth: number;
  };
  teachers: {
    verifiedTeachers: number;
    pendingTeachers: number;
    blockedTeachers: number;
    verificationRate: number;
  };
  requirements: {
    activeRequirements: number;
    closedRequirements: number;
    newReqsThisMonth: number;
    totalRequirements: number;
  };
  applications: {
    totalApplications: number;
    pendingApplications: number;
    acceptedApplications: number;
    newAppsThisWeek: number;
    conversionRate: number;
  };
  matching: { totalMatches: number };
  demos: {
    totalDemoClasses: number;
    completedDemos: number;
    scheduledDemos: number;
    demoConversionRate: number;
  };
  classes: {
    scheduledClasses: number;
    activeScheduledClasses: number;
  };
  generatedAt: string;
}

export interface TopItem { count: number; }
export interface TopSubject extends TopItem { subject: string; }
export interface TopGrade extends TopItem { grade: string; }
export interface TopBoard extends TopItem { board: string; }
export interface TopCity extends TopItem { city: string; }
export interface TypeBreakdown { type: string; count: number; }
export interface MonthlyCount { year: number; month: number; count: number; }

export interface DemandAnalytics {
  topSubjects: TopSubject[];
  topGrades: TopGrade[];
  topBoards: TopBoard[];
  topCities: TopCity[];
  tuitionTypeBreakdown: TypeBreakdown[];
  budgetDistribution: { _id: number | string; count: number; avgBudget: number }[];
  requirementsByMonth: MonthlyCount[];
}

export interface SupplyItem extends TopItem {
  city?: string;
  subject?: string;
  board?: string;
  mode?: string;
  status?: string;
}

export interface SupplyVsDemand {
  subject: string;
  demand: number;
  supply: number;
  gap: number;
}

export interface CityRate {
  city: string;
  avgHourlyRate: number;
  teacherCount: number;
}

export interface SupplyAnalytics {
  teachersByCity: SupplyItem[];
  teachersBySubject: SupplyItem[];
  teachersByBoard: SupplyItem[];
  teachersByExperience: { _id: number | string; count: number; avgRate: number }[];
  teachersByVerification: SupplyItem[];
  teachersByMode: SupplyItem[];
  avgHourlyRateByCity: CityRate[];
  teachersJoinedByMonth: MonthlyCount[];
  supplyVsDemand: SupplyVsDemand[];
}

export interface RevenueAnalytics {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    monthRevenue: number;
    yearRevenue: number;
    avgTransactionValue: number;
  };
  revenueByType: { type: string; total: number; count: number; avgAmount: number }[];
  revenueByMonth: { year: number; month: number; revenue: number; transactions: number }[];
  leadUnlocks: {
    stats: { status: string; count: number; totalAmount: number }[];
    byMonth: { year: number; month: number; count: number; revenue: number }[];
    conversionStats: { status: string; count: number }[];
  };
  notes: string[];
}

export interface FinancialAnalytics {
  summary: {
    grossRevenue: number;
    gstCollected: number;
    subtotalRevenue: number;
    refundedRevenue: number;
    netRevenue: number;
    completedPayments: number;
    refundedPayments: number;
    pendingRefundAmount: number;
    pendingRefundCount: number;
  };
  gstBreakdown: {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    invoices: number;
  };
  monthlyNet: {
    year: number;
    month: number;
    gross: number;
    gstCollected: number;
    net: number;
    count: number;
  }[];
  monthlyRefunds: {
    year: number;
    month: number;
    refundedAmount: number;
    count: number;
  }[];
  refundStats: { status: string; count: number; totalAmount: number }[];
  promos: {
    summary: {
      activeCodes: number;
      totalCodes: number;
      totalUsage: number;
      totalDiscountGiven: number;
    };
    topCodes: {
      code: string;
      usageCount: number;
      totalDiscountGiven: number;
      discountType: string;
      discountValue: number;
    }[];
  };
}

export interface CityData {
  city: string;
  requirements?: number;
  teachers?: number;
  matches?: number;
  avgBudget?: number;
  avgHourlyRate?: number;
  latitude?: number;
  longitude?: number;
  status: 'high-demand' | 'high-supply' | 'balanced';
  demandSupplyRatio: number;
}

export interface GeographyAnalytics {
  cities: CityData[];
  totalCities: number;
  highDemandCities: number;
  balancedCities: number;
  generatedAt: string;
}

export interface SubjectGapData {
  subject: string;
  demand: number;
  supply: number;
  gap: number;
  gapPercentage: number;
  status: 'shortage' | 'surplus' | 'balanced';
  avgBudget?: number;
  avgHourlyRate?: number;
}

export interface SubjectAnalytics {
  subjectDemand: { subject: string; demand: number; avgBudget: number; cityCount: number }[];
  subjectSupply: { subject: string; supply: number; verifiedTeachers: number; avgHourlyRate: number }[];
  supplyDemandGap: SubjectGapData[];
  subjectByCity: { subject: string; city: string; requirements: number }[];
  topShortages: SubjectGapData[];
  topSurpluses: SubjectGapData[];
  generatedAt: string;
}

export interface GrowthCity {
  city: string;
  last7Days: number;
  last30Days: number;
  last90Days: number;
  growthRate30d?: number;
}

export interface SupplyDemandAnalytics {
  overall: {
    totalRequirements: number;
    totalTeachers: number;
    newRequirements: number;
    newTeachers: number;
    supplyDemandRatio: number;
  };
  demandTrend: { date: { year: number; month: number; day: number }; newRequirements: number }[];
  supplyTrend: { date: { year: number; month: number; day: number }; newTeachers: number }[];
  fastGrowingCities: GrowthCity[];
  periodDays: number;
  generatedAt: string;
}

export interface CityAnalytics {
  cityGrowth: {
    city: string;
    totalNewRequirements: number;
    dailyGrowth: { date: { year: number; month: number; day: number }; count: number }[];
  }[];
  topCitiesByRevenue: { city: string; revenue: number; leadUnlocks: number }[];
  periodDays: number;
  generatedAt: string;
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

async function analyticsFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<AnalyticsResponse<T>> {
  const response = await fetch(`${API_BASE_URL}/admin/analytics${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Request failed with status ${response.status}`);
  }

  return result as AnalyticsResponse<T>;
}

// ─────────────────────────────────────────────
// Analytics API Functions
// ─────────────────────────────────────────────

export const getOverview = (token: string): Promise<AnalyticsResponse<OverviewAnalytics>> =>
  analyticsFetch('/overview', token);

export const getRevenue = (token: string): Promise<AnalyticsResponse<RevenueAnalytics>> =>
  analyticsFetch('/revenue', token);

export const getFinancial = (token: string): Promise<AnalyticsResponse<FinancialAnalytics>> =>
  analyticsFetch('/financial', token);

export const getUserAnalytics = (token: string): Promise<AnalyticsResponse<OverviewAnalytics>> =>
  analyticsFetch('/overview', token);

export const getMatchingAnalytics = (token: string): Promise<AnalyticsResponse<OverviewAnalytics>> =>
  analyticsFetch('/overview', token);

export const getDemand = (token: string): Promise<AnalyticsResponse<DemandAnalytics>> =>
  analyticsFetch('/demand', token);

export const getSupply = (token: string): Promise<AnalyticsResponse<SupplyAnalytics>> =>
  analyticsFetch('/supply', token);

export const getGeography = (token: string): Promise<AnalyticsResponse<GeographyAnalytics>> =>
  analyticsFetch('/geography', token);

export const getCityAnalytics = (
  token: string,
  days?: number
): Promise<AnalyticsResponse<CityAnalytics>> => {
  const query = days ? `?days=${days}` : '';
  return analyticsFetch(`/cities${query}`, token);
};

export const getSubjectAnalytics = (token: string): Promise<AnalyticsResponse<SubjectAnalytics>> =>
  analyticsFetch('/subjects', token);

export const getSupplyDemand = (
  token: string,
  days?: number
): Promise<AnalyticsResponse<SupplyDemandAnalytics>> => {
  const query = days ? `?days=${days}` : '';
  return analyticsFetch(`/supply-demand${query}`, token);
};

export default {
  getOverview,
  getRevenue,
  getFinancial,
  getUserAnalytics,
  getMatchingAnalytics,
  getDemand,
  getSupply,
  getGeography,
  getCityAnalytics,
  getSubjectAnalytics,
  getSupplyDemand,
};
