import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getMarketplaceLeads,
  getLeadStats,
  MarketplaceFilters,
  MarketplaceStats,
} from '../services/leadMarketplaceApi';
import { TutorMatch } from '../services/teacherApi';

const PAGE_SIZE = 10;

export interface UseLeadMarketplaceResult {
  leads: TutorMatch[];
  stats: MarketplaceStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  retry: () => void;
  loadMore: () => void;
  applyFilters: (filters: MarketplaceFilters) => void;
  currentFilters: MarketplaceFilters;
  totalCount: number;
}

/**
 * useLeadMarketplace
 *
 * Manages the full lifecycle of the lead marketplace feed:
 *  - Initial load   → GET /api/matches/marketplace?page=1
 *  - Pull-to-refresh → resets page to 1, refetches leads + stats
 *  - Pagination      → loadMore() appends next page
 *  - Filters         → applyFilters() resets to page 1 with new params
 *  - Error/retry     → retry() re-runs from page 1
 */
export function useLeadMarketplace(token: string | null): UseLeadMarketplaceResult {
  const [leads, setLeads] = useState<TutorMatch[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [currentFilters, setCurrentFilters] = useState<MarketplaceFilters>({});
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ── Core fetch ─────────────────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (
      targetPage: number,
      filters: MarketplaceFilters,
      mode: 'initial' | 'refresh' | 'more',
    ) => {
      if (!token) {
        if (isMounted.current) {
          setError('Authentication required. Please login again.');
          setIsLoading(false);
          setIsRefreshing(false);
        }
        return;
      }

      if (isMounted.current) {
        setError(null);
        if (mode === 'initial') setIsLoading(true);
        if (mode === 'refresh') setIsRefreshing(true);
        if (mode === 'more')    setIsLoadingMore(true);
      }

      try {
        // Fetch leads + stats in parallel on initial/refresh
        const leadsPromise = getMarketplaceLeads(token, filters, targetPage, PAGE_SIZE);
        const statsPromise =
          mode !== 'more' ? getLeadStats(token) : Promise.resolve(null);

        const [leadsData, statsData] = await Promise.all([leadsPromise, statsPromise]);

        if (!isMounted.current) return;

        if (mode === 'more') {
          // Append — deduplicate by _id to be safe
          setLeads(prev => {
            const existingIds = new Set(prev.map(l => l._id));
            const newOnes = leadsData.matches.filter(l => !existingIds.has(l._id));
            return [...prev, ...newOnes];
          });
        } else {
          setLeads(leadsData.matches);
          if (statsData) setStats(statsData);
        }

        setPage(targetPage);
        setTotalCount(leadsData.pagination.total);
        setTotalPages(leadsData.pagination.totalPages);
        setError(null);
      } catch (err: any) {
        if (!isMounted.current) return;
        const message =
          err?.message === 'Unauthorized'
            ? 'Session expired. Please login again.'
            : err?.message || 'Failed to load leads. Please try again.';
        setError(message);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [token],
  );

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchPage(1, currentFilters, 'initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage]);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    await fetchPage(1, currentFilters, 'refresh');
  }, [fetchPage, currentFilters]);

  // ── Retry (from error state) ───────────────────────────────────────────────
  const retry = useCallback(() => {
    fetchPage(1, currentFilters, 'initial');
  }, [fetchPage, currentFilters]);

  // ── Load next page ─────────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (loadingMoreRef.current) return;
    if (isLoading || isRefreshing || isLoadingMore) return;
    if (page >= totalPages) return;

    loadingMoreRef.current = true;
    fetchPage(page + 1, currentFilters, 'more');
  }, [fetchPage, page, totalPages, currentFilters, isLoading, isRefreshing, isLoadingMore]);

  // ── Apply filters (resets to page 1) ──────────────────────────────────────
  const applyFilters = useCallback(
    (filters: MarketplaceFilters) => {
      setCurrentFilters(filters);
      setLeads([]);
      setPage(1);
      fetchPage(1, filters, 'initial');
    },
    [fetchPage],
  );

  return {
    leads,
    stats,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore: page < totalPages,
    refresh,
    retry,
    loadMore,
    applyFilters,
    currentFilters,
    totalCount,
  };
}
