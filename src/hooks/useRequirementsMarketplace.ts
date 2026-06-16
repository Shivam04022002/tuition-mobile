import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import {
  getAvailableRequirements,
  getRecommendedRequirements,
  RequirementListItem,
  RequirementsFilters,
  RequirementsPagination,
} from '../services/requirementsMarketplaceApi';

const PAGE_SIZE = 15;

export interface UseRequirementsMarketplaceResult {
  requirements: RequirementListItem[];
  recommended: RequirementListItem[];
  pagination: RequirementsPagination | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  isLoadingRecommended: boolean;
  error: string | null;
  hasMore: boolean;
  currentFilters: RequirementsFilters;
  refresh: () => Promise<void>;
  retry: () => void;
  loadMore: () => void;
  applyFilters: (filters: RequirementsFilters) => void;
  clearFilters: () => void;
}

export function useRequirementsMarketplace(): UseRequirementsMarketplaceResult {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);

  const [requirements, setRequirements] = useState<RequirementListItem[]>([]);
  const [recommended, setRecommended]   = useState<RequirementListItem[]>([]);
  const [pagination, setPagination]     = useState<RequirementsPagination | null>(null);
  const [currentFilters, setCurrentFilters] = useState<RequirementsFilters>({});
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading]                   = useState(true);
  const [isRefreshing, setIsRefreshing]             = useState(false);
  const [isLoadingMore, setIsLoadingMore]           = useState(false);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [error, setError]                           = useState<string | null>(null);

  const isMounted     = useRef(true);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Fetch recommended (fire once) ─────────────────────────────────────────
  const fetchRecommended = useCallback(async () => {
    if (!token) return;
    if (!isMounted.current) return;
    setIsLoadingRecommended(true);
    try {
      const data = await getRecommendedRequirements(token, 10);
      if (isMounted.current) setRecommended(data.requirements);
    } catch (err: any) {
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
      }
    } finally {
      if (isMounted.current) setIsLoadingRecommended(false);
    }
  }, [token, dispatch]);

  // ── Core fetch ─────────────────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (
      targetPage: number,
      filters: RequirementsFilters,
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
        const data = await getAvailableRequirements(token, filters, targetPage, PAGE_SIZE);

        if (!isMounted.current) return;

        if (mode === 'more') {
          setRequirements(prev => {
            const existingIds = new Set(prev.map(r => r._id));
            const newOnes = data.requirements.filter(r => !existingIds.has(r._id));
            return [...prev, ...newOnes];
          });
        } else {
          setRequirements(data.requirements);
        }

        setPagination(data.pagination);
        setPage(targetPage);
        setError(null);
      } catch (err: any) {
        if (!isMounted.current) return;
        if (err?.message === 'Unauthorized') {
          dispatch(logout());
          return;
        }
        setError(err?.message || 'Failed to load requirements. Please try again.');
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [token, dispatch],
  );

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchPage(1, {}, 'initial');
    fetchRecommended();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, fetchRecommended]);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchPage(1, currentFilters, 'refresh'),
      fetchRecommended(),
    ]);
  }, [fetchPage, fetchRecommended, currentFilters]);

  // ── Retry ──────────────────────────────────────────────────────────────────
  const retry = useCallback(() => {
    fetchPage(1, currentFilters, 'initial');
  }, [fetchPage, currentFilters]);

  // ── Load next page ─────────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (loadingMoreRef.current) return;
    if (isLoading || isRefreshing || isLoadingMore) return;
    if (!pagination) return;
    if (page >= pagination.totalPages) return;
    loadingMoreRef.current = true;
    fetchPage(page + 1, currentFilters, 'more');
  }, [fetchPage, page, pagination, currentFilters, isLoading, isRefreshing, isLoadingMore]);

  // ── Apply filters ──────────────────────────────────────────────────────────
  const applyFilters = useCallback(
    (filters: RequirementsFilters) => {
      setCurrentFilters(filters);
      setRequirements([]);
      setPage(1);
      fetchPage(1, filters, 'initial');
    },
    [fetchPage],
  );

  const clearFilters = useCallback(() => {
    applyFilters({});
  }, [applyFilters]);

  return {
    requirements,
    recommended,
    pagination,
    isLoading,
    isRefreshing,
    isLoadingMore,
    isLoadingRecommended,
    error,
    hasMore: pagination ? page < pagination.totalPages : false,
    currentFilters,
    refresh,
    retry,
    loadMore,
    applyFilters,
    clearFilters,
  };
}
