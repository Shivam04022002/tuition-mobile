import { useState, useEffect, useCallback } from 'react';
import { 
  teacherAnalyticsApi, 
  TeacherEarningsResponse,
  EarningsKPIs,
  ConversionMetrics,
  EstimatedEarnings,
  SubjectPerformance,
  LocationPerformance,
  RevenueTrend,
  Benchmarks,
} from '../services/teacherAnalyticsApi';

export type TimePeriod = 'today' | '7days' | '30days' | '90days' | '1year' | 'custom';

interface UseTeacherEarningsResult {
  data: TeacherEarningsResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPeriod: (period: TimePeriod) => void;
  period: TimePeriod;
}

export const useTeacherEarnings = (token: string, initialPeriod: TimePeriod = '30days'): UseTeacherEarningsResult => {
  const [data, setData] = useState<TeacherEarningsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod);

  const fetchEarningsData = useCallback(async () => {
    if (!token) {
      setError('Authentication token required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const earningsData = await teacherAnalyticsApi.getEarningsAnalytics(period);
      setData(earningsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch earnings data';
      setError(errorMessage);
      console.error('Error fetching earnings data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, period]);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  const refetch = useCallback(async () => {
    await fetchEarningsData();
  }, [fetchEarningsData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    setPeriod,
    period,
  };
};

// Export individual hooks for specific data if needed
export const useEarningsKPIs = (token: string, period: TimePeriod = '30days') => {
  const { data, isLoading, error } = useTeacherEarnings(token, period);
  return {
    kpis: data?.kpis,
    isLoading,
    error,
  };
};

export const useConversionMetrics = (token: string, period: TimePeriod = '30days') => {
  const { data, isLoading, error } = useTeacherEarnings(token, period);
  return {
    metrics: data?.conversionMetrics,
    isLoading,
    error,
  };
};

export const useEstimatedEarnings = (token: string, period: TimePeriod = '30days') => {
  const { data, isLoading, error } = useTeacherEarnings(token, period);
  return {
    earnings: data?.estimatedEarnings,
    isLoading,
    error,
  };
};

export const useSubjectPerformance = (token: string, period: TimePeriod = '30days') => {
  const { data, isLoading, error } = useTeacherEarnings(token, period);
  return {
    subjects: data?.subjectPerformance,
    isLoading,
    error,
  };
};

export const useLocationPerformance = (token: string, period: TimePeriod = '30days') => {
  const { data, isLoading, error } = useTeacherEarnings(token, period);
  return {
    locations: data?.locationPerformance,
    isLoading,
    error,
  };
};

export const useRevenueTrends = (token: string, period: TimePeriod = '30days') => {
  const { data, isLoading, error } = useTeacherEarnings(token, period);
  return {
    trends: data?.revenueTrends,
    isLoading,
    error,
  };
};

export const useBenchmarks = (token: string, period: TimePeriod = '30days') => {
  const { data, isLoading, error } = useTeacherEarnings(token, period);
  return {
    benchmarks: data?.benchmarks,
    isLoading,
    error,
  };
};
