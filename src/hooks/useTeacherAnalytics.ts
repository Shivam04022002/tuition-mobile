import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import {
  teacherAnalyticsApi,
  TeacherAnalyticsResponse,
  TeacherFunnelResponse,
  TeacherTrendsResponse,
  TeacherPerformanceResponse,
} from '../services/teacherAnalyticsApi';

export type TimePeriod = 'today' | '7days' | '30days' | '90days';

interface UseTeacherAnalyticsReturn {
  // Data
  analytics: TeacherAnalyticsResponse | null;
  funnel: TeacherFunnelResponse | null;
  trends: TeacherTrendsResponse | null;
  performance: TeacherPerformanceResponse | null;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingFunnel: boolean;
  isLoadingTrends: boolean;
  isLoadingPerformance: boolean;
  
  // Error states
  error: string | null;
  funnelError: string | null;
  trendsError: string | null;
  performanceError: string | null;
  
  // Period
  period: TimePeriod;
  setPeriod: (period: TimePeriod) => void;
  
  // Actions
  refresh: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  refreshFunnel: () => Promise<void>;
  refreshTrends: () => Promise<void>;
  refreshPerformance: () => Promise<void>;
  clearErrors: () => void;
}

export const useTeacherAnalytics = (initialPeriod: TimePeriod = '30days'): UseTeacherAnalyticsReturn => {
  const dispatch = useDispatch();
  
  // Data states
  const [analytics, setAnalytics] = useState<TeacherAnalyticsResponse | null>(null);
  const [funnel, setFunnel] = useState<TeacherFunnelResponse | null>(null);
  const [trends, setTrends] = useState<TeacherTrendsResponse | null>(null);
  const [performance, setPerformance] = useState<TeacherPerformanceResponse | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingFunnel, setIsLoadingFunnel] = useState(false);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [funnelError, setFunnelError] = useState<string | null>(null);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [performanceError, setPerformanceError] = useState<string | null>(null);
  
  // Period state
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod);
  
  // Clear all errors
  const clearErrors = useCallback(() => {
    setError(null);
    setFunnelError(null);
    setTrendsError(null);
    setPerformanceError(null);
  }, []);
  
  // Fetch main analytics
  const fetchAnalytics = useCallback(async (refresh = false) => {
    try {
      if (!refresh) setIsLoading(true);
      else setIsRefreshing(true);
      
      clearErrors();
      const data = await teacherAnalyticsApi.getAnalytics(period);
      setAnalytics(data);
      
      if (__DEV__) {
        console.log('Teacher Analytics loaded:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
      
      if (errorMessage === 'Authentication expired') {
        dispatch(logout());
      }
      
      if (__DEV__) {
        console.error('Teacher Analytics error:', err);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [period, dispatch, clearErrors]);
  
  // Fetch funnel data
  const fetchFunnel = useCallback(async () => {
    try {
      setIsLoadingFunnel(true);
      setFunnelError(null);
      
      const data = await teacherAnalyticsApi.getFunnelAnalytics(period);
      setFunnel(data);
      
      if (__DEV__) {
        console.log('Teacher Funnel loaded:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load funnel data';
      setFunnelError(errorMessage);
      
      if (errorMessage === 'Authentication expired') {
        dispatch(logout());
      }
      
      if (__DEV__) {
        console.error('Teacher Funnel error:', err);
      }
    } finally {
      setIsLoadingFunnel(false);
    }
  }, [period, dispatch]);
  
  // Fetch trends data
  const fetchTrends = useCallback(async () => {
    try {
      setIsLoadingTrends(true);
      setTrendsError(null);
      
      const data = await teacherAnalyticsApi.getTrendsAnalytics(period);
      setTrends(data);
      
      if (__DEV__) {
        console.log('Teacher Trends loaded:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load trends data';
      setTrendsError(errorMessage);
      
      if (errorMessage === 'Authentication expired') {
        dispatch(logout());
      }
      
      if (__DEV__) {
        console.error('Teacher Trends error:', err);
      }
    } finally {
      setIsLoadingTrends(false);
    }
  }, [period, dispatch]);
  
  // Fetch performance data
  const fetchPerformance = useCallback(async () => {
    try {
      setIsLoadingPerformance(true);
      setPerformanceError(null);
      
      const data = await teacherAnalyticsApi.getPerformanceAnalytics(period);
      setPerformance(data);
      
      if (__DEV__) {
        console.log('Teacher Performance loaded:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load performance data';
      setPerformanceError(errorMessage);
      
      if (errorMessage === 'Authentication expired') {
        dispatch(logout());
      }
      
      if (__DEV__) {
        console.error('Teacher Performance error:', err);
      }
    } finally {
      setIsLoadingPerformance(false);
    }
  }, [period, dispatch]);
  
  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchAnalytics(true),
      fetchFunnel(),
      fetchTrends(),
      fetchPerformance(),
    ]);
  }, [fetchAnalytics, fetchFunnel, fetchTrends, fetchPerformance]);
  
  // Individual refresh functions
  const refreshAnalytics = useCallback(() => fetchAnalytics(true), [fetchAnalytics]);
  const refreshFunnel = useCallback(() => fetchFunnel(), [fetchFunnel]);
  const refreshTrends = useCallback(() => fetchTrends(), [fetchTrends]);
  const refreshPerformance = useCallback(() => fetchPerformance(), [fetchPerformance]);
  
  // Initial data fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);
  
  // Fetch other data when main analytics loads
  useEffect(() => {
    if (analytics && !isLoading) {
      fetchFunnel();
      fetchTrends();
      fetchPerformance();
    }
  }, [analytics, isLoading, fetchFunnel, fetchTrends, fetchPerformance]);
  
  // Refetch all data when period changes
  useEffect(() => {
    if (analytics) {
      refresh();
    }
  }, [period, refresh]);
  
  return {
    // Data
    analytics,
    funnel,
    trends,
    performance,
    
    // Loading states
    isLoading,
    isRefreshing,
    isLoadingFunnel,
    isLoadingTrends,
    isLoadingPerformance,
    
    // Error states
    error,
    funnelError,
    trendsError,
    performanceError,
    
    // Period
    period,
    setPeriod,
    
    // Actions
    refresh,
    refreshAnalytics,
    refreshFunnel,
    refreshTrends,
    refreshPerformance,
    clearErrors,
  };
};
