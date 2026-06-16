import { useState, useEffect, useCallback, useRef } from 'react';
import { parentDashboardService } from '../services/parentDashboardService';
import type {
  ParentDashboardData,
  DashboardStats,
  DashboardRequirement,
  DashboardApplication,
  DashboardRecommendedTutor,
  DashboardDemoClass,
  DashboardShortlistedTutor,
} from '../services/parentDashboardService';

const IS_DEV = __DEV__;

function devLog(message: string): void {
  if (IS_DEV) {
    console.log(`[ParentDashboard] ${message}`);
  }
}

export interface UseParentDashboardResult {
  dashboardData: ParentDashboardData | null;
  stats: DashboardStats | null;
  activeRequirements: DashboardRequirement[];
  applications: DashboardApplication[];
  recommendedTutors: DashboardRecommendedTutor[];
  shortlistedTutors: DashboardShortlistedTutor[];
  upcomingDemos: DashboardDemoClass[];
  notificationsCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
}

/**
 * useParentDashboard
 *
 * Manages all dashboard state: loading, refreshing, error, and data.
 * Fetches via parentDashboardService.getDashboardData().
 * Prevents duplicate in-flight requests with a ref guard.
 */
export function useParentDashboard(token: string | null): UseParentDashboardResult {
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const isFetching = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (isFetching.current) return;

      if (!token) {
        if (isMounted.current) {
          setError('Authentication required. Please login again.');
          setIsLoading(false);
          setIsRefreshing(false);
        }
        return;
      }

      isFetching.current = true;

      if (isMounted.current) {
        setError(null);
        if (mode === 'initial') {
          devLog('Dashboard Loading');
          setIsLoading(true);
        } else {
          devLog('Dashboard Refresh Started');
          setIsRefreshing(true);
        }
      }

      try {
        const data = await parentDashboardService.getDashboardData(token);
        if (!isMounted.current) return;
        setDashboardData(data);
        setError(null);
        devLog(mode === 'refresh' ? 'Dashboard Refresh Completed' : 'Dashboard Loaded');
      } catch (err: any) {
        if (!isMounted.current) return;
        const message =
          err?.message === 'Unauthorized'
            ? 'Session expired. Please login again.'
            : err?.message || 'Failed to load dashboard. Please try again.';
        setError(message);
        devLog(`Dashboard Error: ${message}`);
      } finally {
        isFetching.current = false;
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [token],
  );

  useEffect(() => {
    fetchData('initial');
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData('refresh');
  }, [fetchData]);

  const retry = useCallback(() => {
    fetchData('initial');
  }, [fetchData]);

  return {
    dashboardData,
    stats: dashboardData?.stats ?? null,
    activeRequirements: dashboardData?.activeRequirements ?? [],
    applications: dashboardData?.applications ?? [],
    recommendedTutors: dashboardData?.recommendedTutors ?? [],
    shortlistedTutors: dashboardData?.shortlistedTutors ?? [],
    upcomingDemos: dashboardData?.upcomingDemos ?? [],
    notificationsCount: dashboardData?.notificationsCount ?? 0,
    isLoading,
    isRefreshing,
    error,
    refresh,
    retry,
  };
}
