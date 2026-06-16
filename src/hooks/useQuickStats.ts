import { useState, useEffect, useCallback, useRef } from 'react';
import { parentDashboardService } from '../services/parentDashboardService';
import type { QuickStats } from '../services/parentDashboardService';

const IS_DEV = __DEV__;

function devLog(message: string): void {
  if (IS_DEV) {
    console.log(`[QuickStats] ${message}`);
  }
}

export interface UseQuickStatsResult {
  stats: QuickStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
}

/**
 * useQuickStats
 *
 * Manages quick stats state: loading, refreshing, error, and data.
 * Fetches via parentDashboardService.getQuickStats().
 * Prevents duplicate in-flight requests with a ref guard.
 * Shows '--' on error, never crashes.
 */
export function useQuickStats(token: string | null): UseQuickStatsResult {
  const [stats, setStats] = useState<QuickStats | null>(null);
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
          setError('Authentication required');
          setIsLoading(false);
          setIsRefreshing(false);
        }
        return;
      }

      isFetching.current = true;

      if (isMounted.current) {
        setError(null);
        if (mode === 'initial') {
          devLog('Loading Quick Stats');
          setIsLoading(true);
        } else {
          devLog('Refreshing Quick Stats');
          setIsRefreshing(true);
        }
      }

      try {
        const data = await parentDashboardService.getQuickStats(token);
        if (!isMounted.current) return;
        setStats(data);
        setError(null);
        devLog(`Quick Stats Loaded: ${JSON.stringify(data)}`);
      } catch (err: any) {
        if (!isMounted.current) return;
        const message = err?.message || 'Failed to load stats';
        setError(message);
        // Keep previous stats on error, don't crash
        devLog(`Quick Stats Error: ${message}`);
      } finally {
        isFetching.current = false;
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [token]
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
    stats,
    isLoading,
    isRefreshing,
    error,
    refresh,
    retry,
  };
}
