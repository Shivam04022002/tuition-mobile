import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTeacherDashboard } from '../services/dashboardApi';
import { DashboardData } from '../services/teacherApi';

export type DashboardLoadState = 'idle' | 'loading' | 'refreshing' | 'success' | 'error';

export interface UseTeacherDashboardResult {
  data: DashboardData | null;
  loadState: DashboardLoadState;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  retry: () => void;
}

/**
 * useTeacherDashboard
 *
 * Fetches GET /api/dashboard/teacher and exposes:
 *  - data          → full DashboardData (stats, matches, applications, upcomingDemos, activeStudents)
 *  - loadState     → 'idle' | 'loading' | 'refreshing' | 'success' | 'error'
 *  - isLoading     → true on first load
 *  - isRefreshing  → true on pull-to-refresh
 *  - error         → error message string or null
 *  - refresh()     → pull-to-refresh handler (sets isRefreshing)
 *  - retry()       → resets to loading and re-fetches
 */
export function useTeacherDashboard(token: string | null): UseTeacherDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadState, setLoadState] = useState<DashboardLoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token) {
        if (isMounted.current) {
          setError('Authentication required. Please login again.');
          setLoadState('error');
        }
        return;
      }

      if (isMounted.current) {
        setError(null);
        setLoadState(mode === 'initial' ? 'loading' : 'refreshing');
      }

      try {
        const result = await fetchTeacherDashboard(token);
        if (isMounted.current) {
          setData(result);
          setLoadState('success');
          setError(null);
        }
      } catch (err: any) {
        if (isMounted.current) {
          const message =
            err?.message === 'Unauthorized'
              ? 'Session expired. Please login again.'
              : err?.message || 'Failed to load dashboard. Please try again.';
          setError(message);
          setLoadState('error');
        }
      }
    },
    [token],
  );

  // Initial load
  useEffect(() => {
    fetchData('initial');
  }, [fetchData]);

  // Pull-to-refresh handler
  const refresh = useCallback(async () => {
    await fetchData('refresh');
  }, [fetchData]);

  // Retry resets to initial loading state
  const retry = useCallback(() => {
    fetchData('initial');
  }, [fetchData]);

  return {
    data,
    loadState,
    error,
    isLoading: loadState === 'loading' || loadState === 'idle',
    isRefreshing: loadState === 'refreshing',
    refresh,
    retry,
  };
}
