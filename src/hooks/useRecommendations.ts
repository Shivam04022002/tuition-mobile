import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  getRecommendedTutors,
  getRecommendationById,
  getRecommendationsByRequirement,
  trackTutorInteraction,
  RecommendedTutor,
  RecommendationDetail,
  RecommendationFilters,
  SortOption,
  RequirementRecommendationsResponse,
} from '../services/recommendationApi';

const IS_DEV = __DEV__;

function devLog(message: string): void {
  if (IS_DEV) {
    console.log(`[Recommendations] ${message}`);
  }
}

// ─── Hook: useRecommendationsList ────────────────────────────────────────────

export interface UseRecommendationsListResult {
  tutors: RecommendedTutor[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  filters: RecommendationFilters;
  sortBy: SortOption;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => void;
  setFilters: (filters: RecommendationFilters) => void;
  setSortBy: (sort: SortOption) => void;
  clearFilters: () => void;
}

export function useRecommendationsList(
  token: string | null,
  initialFilters: RecommendationFilters = {},
  initialSort: SortOption = 'match'
): UseRecommendationsListResult {
  const [tutors, setTutors] = useState<RecommendedTutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFiltersState] = useState<RecommendationFilters>(initialFilters);
  const [sortBy, setSortByState] = useState<SortOption>(initialSort);

  const isMounted = useRef(true);
  const isFetching = useRef(false);
  const limit = 20;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(
    async (mode: 'initial' | 'refresh' | 'loadMore') => {
      if (isFetching.current) return;

      if (!token) {
        if (isMounted.current) {
          setError('Authentication required. Please login again.');
          setIsLoading(false);
        }
        return;
      }

      isFetching.current = true;

      const targetPage = mode === 'loadMore' ? page + 1 : 1;

      if (isMounted.current) {
        setError(null);
        if (mode === 'initial') {
          devLog('Loading recommendations');
          setIsLoading(true);
        } else if (mode === 'refresh') {
          devLog('Refreshing recommendations');
          setIsRefreshing(true);
        } else {
          devLog('Loading more recommendations');
          setIsLoadingMore(true);
        }
      }

      try {
        const response = await getRecommendedTutors(token, {
          ...filters,
          sortBy,
          page: targetPage,
          limit,
        });

        if (!isMounted.current) return;

        if (mode === 'loadMore') {
          setTutors((prev) => [...prev, ...response.tutors]);
          setPage(targetPage);
        } else {
          setTutors(response.tutors);
          setPage(1);
        }

        setTotal(response.pagination.total);
        setError(null);

        devLog(
          mode === 'loadMore'
            ? `Loaded ${response.tutors.length} more tutors`
            : `Loaded ${response.tutors.length} tutors (total: ${response.pagination.total})`
        );
      } catch (err: any) {
        if (!isMounted.current) return;
        const message =
          err?.message === 'Unauthorized'
            ? 'Session expired. Please login again.'
            : err?.message || 'Failed to load recommendations. Please try again.';
        setError(message);
        devLog(`Error: ${message}`);
      } finally {
        isFetching.current = false;
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }
    },
    [token, filters, sortBy, page]
  );

  // Initial fetch
  useEffect(() => {
    fetchData('initial');
  }, []);

  // Refetch when filters or sort changes
  useEffect(() => {
    if (!isLoading) {
      fetchData('refresh');
    }
  }, [filters, sortBy]);

  const refresh = useCallback(async () => {
    await fetchData('refresh');
  }, [fetchData]);

  const loadMore = useCallback(async () => {
    if (tutors.length < total && !isLoadingMore) {
      await fetchData('loadMore');
    }
  }, [fetchData, tutors.length, total, isLoadingMore]);

  const retry = useCallback(() => {
    fetchData('initial');
  }, [fetchData]);

  const setFilters = useCallback((newFilters: RecommendationFilters) => {
    setFiltersState(newFilters);
  }, []);

  const setSortBy = useCallback((newSort: SortOption) => {
    setSortByState(newSort);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const hasMore = useMemo(() => {
    return tutors.length < total;
  }, [tutors.length, total]);

  return {
    tutors,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    pagination: {
      page,
      limit,
      total,
    },
    filters,
    sortBy,
    refresh,
    loadMore,
    retry,
    setFilters,
    setSortBy,
    clearFilters,
  };
}

// ─── Hook: useRecommendationDetail ───────────────────────────────────────────

export interface UseRecommendationDetailResult {
  recommendation: RecommendationDetail | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
}

export function useRecommendationDetail(
  token: string | null,
  id: string | null
): UseRecommendationDetailResult {
  const [recommendation, setRecommendation] = useState<RecommendationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDetail = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token || !id) {
        if (isMounted.current) {
          setIsLoading(false);
          if (!token) setError('Authentication required');
        }
        return;
      }

      if (isMounted.current) {
        setError(null);
        if (mode === 'initial') {
          setIsLoading(true);
        }
      }

      try {
        const response = await getRecommendationById(token, id);
        if (!isMounted.current) return;
        setRecommendation(response.recommendation);
        setError(null);
        devLog(`Loaded recommendation detail: ${response.recommendation.matchId}`);
      } catch (err: any) {
        if (!isMounted.current) return;
        const message =
          err?.message === 'Unauthorized'
            ? 'Session expired. Please login again.'
            : err?.message || 'Failed to load tutor details. Please try again.';
        setError(message);
        devLog(`Error: ${message}`);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    [token, id]
  );

  useEffect(() => {
    if (id) {
      fetchDetail('initial');
    }
  }, [fetchDetail, id]);

  const refresh = useCallback(async () => {
    await fetchDetail('refresh');
  }, [fetchDetail]);

  const retry = useCallback(() => {
    fetchDetail('initial');
  }, [fetchDetail]);

  return {
    recommendation,
    isLoading,
    error,
    refresh,
    retry,
  };
}

// ─── Hook: useRequirementRecommendations ─────────────────────────────────────

export interface UseRequirementRecommendationsResult {
  tutors: RecommendedTutor[];
  requirement: RequirementRecommendationsResponse['requirement'] | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
}

export function useRequirementRecommendations(
  token: string | null,
  requirementId: string | null
): UseRequirementRecommendationsResult {
  const [tutors, setTutors] = useState<RecommendedTutor[]>([]);
  const [requirement, setRequirement] = useState<RequirementRecommendationsResponse['requirement'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchRecommendations = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token || !requirementId) {
        if (isMounted.current) {
          setIsLoading(false);
          if (!token) setError('Authentication required');
        }
        return;
      }

      if (isMounted.current) {
        setError(null);
        if (mode === 'initial') {
          setIsLoading(true);
        }
      }

      try {
        const response = await getRecommendationsByRequirement(token, requirementId);
        if (!isMounted.current) return;
        setTutors(response.tutors);
        setRequirement(response.requirement);
        setError(null);
        devLog(`Loaded ${response.tutors.length} tutors for requirement ${requirementId}`);
      } catch (err: any) {
        if (!isMounted.current) return;
        const message =
          err?.message === 'Unauthorized'
            ? 'Session expired. Please login again.'
            : err?.message || 'Failed to load recommendations. Please try again.';
        setError(message);
        devLog(`Error: ${message}`);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    [token, requirementId]
  );

  useEffect(() => {
    if (requirementId) {
      fetchRecommendations('initial');
    }
  }, [fetchRecommendations, requirementId]);

  const refresh = useCallback(async () => {
    await fetchRecommendations('refresh');
  }, [fetchRecommendations]);

  const retry = useCallback(() => {
    fetchRecommendations('initial');
  }, [fetchRecommendations]);

  return {
    tutors,
    requirement,
    isLoading,
    error,
    refresh,
    retry,
  };
}

// ─── Hook: useTutorInteraction ───────────────────────────────────────────────

export interface UseTutorInteractionResult {
  isTracking: boolean;
  error: string | null;
  trackInteraction: (matchId: string, action: 'viewed' | 'contacted' | 'shortlisted' | 'demo_requested') => Promise<boolean>;
}

export function useTutorInteraction(token: string | null): UseTutorInteractionResult {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackInteraction = useCallback(
    async (matchId: string, action: 'viewed' | 'contacted' | 'shortlisted' | 'demo_requested'): Promise<boolean> => {
      if (!token) {
        setError('Authentication required');
        return false;
      }

      setIsTracking(true);
      setError(null);

      try {
        await trackTutorInteraction(token, matchId, action);
        devLog(`Tracked ${action} for ${matchId}`);
        return true;
      } catch (err: any) {
        const message = err?.message || 'Failed to track interaction';
        setError(message);
        devLog(`Track error: ${message}`);
        return false;
      } finally {
        setIsTracking(false);
      }
    },
    [token]
  );

  return {
    isTracking,
    error,
    trackInteraction,
  };
}
