import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { filterTutors, FilterParams, FilterTutor, FilterResponse, countActiveFilters } from '../services/tutorFilterApi';

const IS_DEV = __DEV__;

function devLog(message: string): void {
  if (IS_DEV) {
    console.log(`[TutorFilters] ${message}`);
  }
}

// Analytics events
const analytics = {
  trackFilterOpened: () => devLog('Analytics: Filter opened'),
  trackFilterApplied: (filterCount: number) => devLog(`Analytics: Filter applied (${filterCount} filters)`),
  trackFilterReset: () => devLog('Analytics: Filter reset'),
  trackFilterCombination: (filters: string[]) => devLog(`Analytics: Filter combination [${filters.join(', ')}]`),
};

// ─── Hook: useTutorFilters ─────────────────────────────────────────────────

export type FilterState = 'idle' | 'loading' | 'results' | 'noResults' | 'error';

export interface UseTutorFiltersResult {
  // Filter params
  filters: FilterParams;
  
  // Results
  tutors: FilterTutor[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  
  // State
  filterState: FilterState;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
  activeFilterCount: number;
  
  // Filter actions
  setFilter: <K extends keyof FilterParams>(key: K, value: FilterParams[K]) => void;
  setFilters: (newFilters: Partial<FilterParams>) => void;
  toggleMultiSelect: (key: 'subjects' | 'classes' | 'languages' | 'availability', value: string) => void;
  clearFilter: (key: keyof FilterParams) => void;
  resetFilters: () => void;
  
  // Data actions
  applyFilters: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
}

const INITIAL_FILTERS: FilterParams = {
  subjects: [],
  classes: [],
  languages: [],
  availability: [],
  mode: undefined,
  gender: 'any',
  city: undefined,
  area: undefined,
  experience: undefined,
  rating: undefined,
  minBudget: undefined,
  maxBudget: undefined,
  page: 1,
  limit: 20,
};

export function useTutorFilters(token: string | null): UseTutorFiltersResult {
  // Filter state
  const [filters, setFiltersState] = useState<FilterParams>(INITIAL_FILTERS);
  const appliedFiltersRef = useRef<FilterParams>(INITIAL_FILTERS);
  
  // Results state
  const [tutors, setTutors] = useState<FilterTutor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for cleanup
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Derived state
  const filterState: FilterState = useMemo(() => {
    if (error) return 'error';
    if (isLoading) return 'loading';
    if (tutors.length === 0 && !isLoading && !error) return 'noResults';
    if (tutors.length > 0) return 'results';
    return 'idle';
  }, [error, isLoading, tutors.length]);
  
  const hasMore = useMemo(() => {
    return page < totalPages;
  }, [page, totalPages]);
  
  const activeFilterCount = useMemo(() => {
    return countActiveFilters(appliedFiltersRef.current);
  }, [appliedFiltersRef.current]);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Set a single filter value
  const setFilter = useCallback(<K extends keyof FilterParams>(key: K, value: FilterParams[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);
  
  // Set multiple filters at once
  const setFilters = useCallback((newFilters: Partial<FilterParams>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);
  
  // Toggle multi-select filter (add/remove from array)
  const toggleMultiSelect = useCallback((
    key: 'subjects' | 'classes' | 'languages' | 'availability',
    value: string
  ) => {
    setFiltersState((prev) => {
      const currentArray = prev[key] || [];
      const exists = currentArray.includes(value);
      
      if (exists) {
        return {
          ...prev,
          [key]: currentArray.filter((item) => item !== value),
        };
      } else {
        return {
          ...prev,
          [key]: [...currentArray, value],
        };
      }
    });
  }, []);
  
  // Clear a specific filter
  const clearFilter = useCallback((key: keyof FilterParams) => {
    setFiltersState((prev) => {
      const resetValue = INITIAL_FILTERS[key];
      return { ...prev, [key]: resetValue };
    });
  }, []);
  
  // Reset all filters
  const resetFilters = useCallback(() => {
    setFiltersState(INITIAL_FILTERS);
    analytics.trackFilterReset();
  }, []);
  
  // Apply filters and fetch results
  const applyFilters = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      return;
    }
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    // Update applied filters reference
    appliedFiltersRef.current = { ...filters, page: 1 };
    
    if (isMounted.current) {
      setError(null);
      setIsLoading(true);
    }
    
    // Track analytics
    const filterCount = countActiveFilters(filters);
    analytics.trackFilterApplied(filterCount);
    
    const activeKeys = Object.entries(filters)
      .filter(([key, value]) => {
        if (key === 'page' || key === 'limit') return false;
        if (key === 'gender' && value === 'any') return false;
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined;
      })
      .map(([key]) => key);
    analytics.trackFilterCombination(activeKeys);
    
    devLog(`Applying filters: ${JSON.stringify(filters)}`);
    
    try {
      const response: FilterResponse = await filterTutors(
        token,
        { ...filters, page: 1 },
        abortControllerRef.current.signal
      );
      
      if (!isMounted.current) return;
      
      setTutors(response.tutors);
      setTotal(response.total);
      setPage(response.page);
      setTotalPages(response.totalPages);
      setError(null);
      
      devLog(`Filtered: ${response.total} tutors found`);
    } catch (err: any) {
      if (!isMounted.current) return;
      
      if (err.name === 'AbortError') {
        devLog('Filter request cancelled');
        return;
      }
      
      const message =
        err?.message === 'Unauthorized'
          ? 'Session expired. Please login again.'
          : err?.message || 'Failed to apply filters. Please try again.';
      
      setError(message);
      setTutors([]);
      setTotal(0);
      devLog(`Error: ${message}`);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [token, filters]);
  
  // Refresh with current filters
  const refresh = useCallback(async () => {
    if (!token) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    if (isMounted.current) {
      setIsRefreshing(true);
      setError(null);
    }
    
    try {
      const response: FilterResponse = await filterTutors(
        token,
        { ...appliedFiltersRef.current, page: 1 },
        abortControllerRef.current.signal
      );
      
      if (!isMounted.current) return;
      
      setTutors(response.tutors);
      setTotal(response.total);
      setPage(1);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      if (!isMounted.current || err.name === 'AbortError') return;
      setError(err?.message || 'Failed to refresh');
    } finally {
      if (isMounted.current) {
        setIsRefreshing(false);
      }
    }
  }, [token]);
  
  // Load more results
  const loadMore = useCallback(async () => {
    if (!token || !hasMore || isLoadingMore) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    const nextPage = page + 1;
    
    if (isMounted.current) {
      setIsLoadingMore(true);
    }
    
    try {
      const response: FilterResponse = await filterTutors(
        token,
        { ...appliedFiltersRef.current, page: nextPage },
        abortControllerRef.current.signal
      );
      
      if (!isMounted.current) return;
      
      setTutors((prev) => [...prev, ...response.tutors]);
      setPage(nextPage);
    } catch (err: any) {
      if (!isMounted.current || err.name === 'AbortError') return;
      devLog(`Load more error: ${err?.message}`);
    } finally {
      if (isMounted.current) {
        setIsLoadingMore(false);
      }
    }
  }, [token, page, hasMore, isLoadingMore]);
  
  // Retry failed request
  const retry = useCallback(async () => {
    await applyFilters();
  }, [applyFilters]);
  
  return {
    filters,
    tutors,
    total,
    page,
    totalPages,
    hasMore,
    filterState,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    activeFilterCount,
    setFilter,
    setFilters,
    toggleMultiSelect,
    clearFilter,
    resetFilters,
    applyFilters,
    refresh,
    loadMore,
    retry,
  };
}
