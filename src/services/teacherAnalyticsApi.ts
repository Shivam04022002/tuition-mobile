import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/api';

// Types for Teacher Analytics
export interface TeacherAnalyticsKPIs {
  totalLeadsViewed: number;
  applicationsSubmitted: number;
  applicationsShortlisted: number;
  applicationsSelected: number;
  demoRequests: number;
  completedDemos: number;
  activeStudents: number;
  savedRequirements: number;
  averageMatchScore: number;
  responseRate: number;
}

// Earnings Analytics Types
export interface EarningsKPIs {
  leadsGenerated: number;
  applicationsSubmitted: number;
  shortlisted: number;
  demoScheduled: number;
  demoCompleted: number;
  studentsConverted: number;
}

export interface ConversionMetrics {
  leadToApplicationRate: number;
  applicationToShortlistRate: number;
  shortlistToDemoRate: number;
  demoToStudentRate: number;
  overallConversionRate: number;
}

export interface EstimatedEarnings {
  monthlyPotentialRevenue: number;
  quarterlyPotentialRevenue: number;
  annualPotentialRevenue: number;
  averageStudentValue: number;
}

export interface SubjectPerformance {
  subject: string;
  leads: number;
  applications: number;
  conversions: number;
  revenueContribution: number;
}

export interface LocationPerformance {
  city: string;
  applications: number;
  students: number;
  revenue: number;
}

export interface RevenueTrend {
  period: string;
  students: number;
  revenue: number;
}

export interface Benchmarks {
  yourConversionRate: number;
  platformAverage: number;
  topTeacherAverage: number;
}

export interface TeacherEarningsResponse {
  period: string;
  kpis: EarningsKPIs;
  conversionMetrics: ConversionMetrics;
  estimatedEarnings: EstimatedEarnings;
  subjectPerformance: SubjectPerformance[];
  locationPerformance: LocationPerformance[];
  revenueTrends: RevenueTrend[];
  benchmarks: Benchmarks;
}

export interface TeacherAnalyticsResponse {
  period: string;
  kpis: TeacherAnalyticsKPIs;
  generatedAt: string;
}

export interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
}

export interface TeacherFunnelResponse {
  period: string;
  funnel: FunnelStage[];
  overallConversionRate: number;
  generatedAt: string;
}

export interface TrendDataPoint {
  date: {
    year: number;
    month: number;
    day: number;
  };
  applications?: number;
  shortlisted?: number;
  accepted?: number;
  requests?: number;
  completed?: number;
  totalApplications?: number;
  converted?: number;
  conversionRate?: number;
}

export interface SubjectAnalytics {
  subject: string;
  applications: number;
  selections: number;
  conversionRate: number;
}

export interface LocationAnalytics {
  city: string;
  applications: number;
  conversions: number;
}

export interface TeacherTrendsResponse {
  period: string;
  trends: {
    applications: TrendDataPoint[];
    demos: TrendDataPoint[];
    conversions: TrendDataPoint[];
  };
  topSubjects: SubjectAnalytics[];
  topLocations: LocationAnalytics[];
  generatedAt: string;
}

export interface PerformanceMetrics {
  applicationSuccessRate: number;
  shortlistRate: number;
  demoConversionRate: number;
  responseRate: number;
  averageMatchScore: number;
}

export interface GoalProgress {
  current: number;
  target: number;
  percentage: number;
}

export interface Goals {
  monthlyApplicationGoal: number;
  monthlyDemoGoal: number;
  monthlyConversionGoal: number;
}

export interface RecentActivity {
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface TeacherPerformanceResponse {
  period: string;
  performance: PerformanceMetrics;
  goals: Goals;
  goalProgress: {
    applications: GoalProgress;
    demos: GoalProgress;
    conversions: GoalProgress;
  };
  recentActivity: RecentActivity[];
  generatedAt: string;
}

// API Functions
class TeacherAnalyticsAPI {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${BASE_URL}/api/teachers${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear storage and redirect to login
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userRole');
        throw new Error('Authentication expired');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Get main analytics KPIs
  async getAnalytics(period: string = '30days'): Promise<TeacherAnalyticsResponse> {
    return this.makeRequest<TeacherAnalyticsResponse>(`/analytics?period=${period}`);
  }

  // Get conversion funnel data
  async getFunnelAnalytics(period: string = '30days'): Promise<TeacherFunnelResponse> {
    return this.makeRequest<TeacherFunnelResponse>(`/analytics/funnel?period=${period}`);
  }

  // Get trends data
  async getTrendsAnalytics(period: string = '30days'): Promise<TeacherTrendsResponse> {
    return this.makeRequest<TeacherTrendsResponse>(`/analytics/trends?period=${period}`);
  }

  // Get performance metrics and goals
  async getPerformanceAnalytics(period: string = '30days'): Promise<TeacherPerformanceResponse> {
    return this.makeRequest<TeacherPerformanceResponse>(`/analytics/performance?period=${period}`);
  }

  // Get earnings and conversion analytics
  async getEarningsAnalytics(period: string = '30days'): Promise<TeacherEarningsResponse> {
    return this.makeRequest<TeacherEarningsResponse>(`/earnings?period=${period}`);
  }
}

// Export singleton instance
export const teacherAnalyticsApi = new TeacherAnalyticsAPI();
