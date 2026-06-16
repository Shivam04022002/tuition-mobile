import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { searchTutors, SearchTutor, SearchResponse } from '../services/tutorSearchApi';

// Simple in-memory storage for search history (replace with AsyncStorage for persistence)
const memoryStorage = {
  data: new Map<string, string>(),
  async getItem(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  },
  async setItem(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    this.data.delete(key);
  },
};

const IS_DEV = __DEV__;
const SEARCH_HISTORY_KEY = '@tutor_search_history';
const MAX_HISTORY_ITEMS = 10;
const DEBOUNCE_MS = 300;

function devLog(message: string): void {
  if (IS_DEV) {
    console.log(`[TutorSearch] ${message}`);
  }
}

// Analytics events (placeholder - integrate with your analytics provider)
const analytics = {
  trackSearchStarted: (term: string) => devLog(`Analytics: Search started - ${term}`),
  trackSearchCompleted: (term: string, resultCount: number) => devLog(`Analytics: Search completed - ${term} (${resultCount} results)`),
  trackTutorOpened: (tutorId: string, fromSearch: string) => devLog(`Analytics: Tutor opened ${tutorId} from search "${fromSearch}"`),
};

// ─── Hook: useTutorSearch ────────────────────────────────────────────────────

export type SearchState = 'idle' | 'typing' | 'loading' | 'results' | 'noResults' | 'error';

export interface UseTutorSearchResult {
  // Search state
  query: string;
  setQuery: (query: string) => void;
  searchState: SearchState;
  
  // Results
  tutors: SearchTutor[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  
  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  
  // Error
  error: string | null;
  
  // Actions
  search: (term: string) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
  clearSearch: () => void;
  
  // Search history
  recentSearches: string[];
  addToHistory: (term: string) => Promise<void>;
  removeFromHistory: (term: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  
  // Analytics
  trackTutorOpen: (tutorId: string) => void;
}

export function useTutorSearch(token: string | null): UseTutorSearchResult {
  // Query state
  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Results state
  const [tutors, setTutors] = useState<SearchTutor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Search history
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Refs for cleanup
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSearchedRef = useRef(false);

  // Derived state
  const searchState: SearchState = useMemo(() => {
    if (error) return 'error';
    if (isLoading) return 'loading';
    if (debouncedQuery && !hasSearchedRef.current) return 'typing';
    if (!debouncedQuery) return 'idle';
    if (tutors.length === 0 && !isLoading) return 'noResults';
    return 'results';
  }, [error, isLoading, debouncedQuery, tutors.length]);

  const hasMore = useMemo(() => {
    return page < totalPages;
  }, [page, totalPages]);

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
    
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Debounce query changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setDebouncedQuery('');
      hasSearchedRef.current = false;
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      if (isMounted.current) {
        setDebouncedQuery(query.trim());
        hasSearchedRef.current = false;
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery && token) {
      performSearch(debouncedQuery, 1, 'initial');
    } else if (!debouncedQuery) {
      // Clear results when query is empty
      setTutors([]);
      setTotal(0);
      setPage(1);
      setTotalPages(1);
      setError(null);
    }
  }, [debouncedQuery, token]);

  // Load search history from AsyncStorage
  const loadSearchHistory = async () => {
    try {
      const history = await memoryStorage.getItem(SEARCH_HISTORY_KEY);
      if (history && isMounted.current) {
        setRecentSearches(JSON.parse(history));
      }
    } catch (err) {
      devLog(`Failed to load search history: ${err}`);
    }
  };

  // Save search history to AsyncStorage
  const saveSearchHistory = async (history: string[]) => {
    try {
      await memoryStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (err) {
      devLog(`Failed to save search history: ${err}`);
    }
  };

  // Perform search
  const performSearch = async (
    searchTerm: string,
    targetPage: number,
    mode: 'initial' | 'refresh' | 'loadMore'
  ) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Set loading state
    if (isMounted.current) {
      setError(null);
      if (mode === 'initial') {
        setIsLoading(true);
      } else if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoadingMore(true);
      }
    }

    // Track search started
    if (mode === 'initial') {
      analytics.trackSearchStarted(searchTerm);
    }

    devLog(`Searching for "${searchTerm}" (page ${targetPage})`);

    try {
      const response: SearchResponse = await searchTutors(
        token,
        searchTerm,
        targetPage,
        20,
        abortControllerRef.current.signal
      );

      if (!isMounted.current) return;

      // Update results
      if (mode === 'loadMore') {
        setTutors((prev) => [...prev, ...response.tutors]);
        setPage(targetPage);
      } else {
        setTutors(response.tutors);
        setPage(1);
      }

      setTotal(response.total);
      setTotalPages(response.totalPages);
      setError(null);
      hasSearchedRef.current = true;

      // Track search completed
      if (mode === 'initial') {
        analytics.trackSearchCompleted(searchTerm, response.total);
        // Add to history if we got results
        if (response.total > 0) {
          await addToHistory(searchTerm);
        }
      }

      devLog(`Found ${response.total} tutors (showing ${response.tutors.length})`);
    } catch (err: any) {
      if (!isMounted.current) return;

      // Don't show error for cancelled requests
      if (err.name === 'AbortError') {
        devLog('Search request cancelled');
        return;
      }

      const message =
        err?.message === 'Unauthorized'
          ? 'Session expired. Please login again.'
          : err?.message || 'Failed to search tutors. Please try again.';
      
      setError(message);
      devLog(`Error: ${message}`);

      // Clear tutors on initial search error
      if (mode === 'initial') {
        setTutors([]);
        setTotal(0);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    }
  };

  // Manual search trigger
  const search = useCallback(async (term: string) => {
    setQueryState(term);
    setDebouncedQuery(term);
    hasSearchedRef.current = false;
    await performSearch(term, 1, 'initial');
  }, [token]);

  // Refresh current search
  const refresh = useCallback(async () => {
    if (debouncedQuery) {
      await performSearch(debouncedQuery, 1, 'refresh');
    }
  }, [debouncedQuery]);

  // Load more results
  const loadMore = useCallback(async () => {
    if (debouncedQuery && hasMore && !isLoadingMore) {
      await performSearch(debouncedQuery, page + 1, 'loadMore');
    }
  }, [debouncedQuery, page, hasMore, isLoadingMore]);

  // Retry failed search
  const retry = useCallback(async () => {
    if (debouncedQuery) {
      await performSearch(debouncedQuery, 1, 'initial');
    }
  }, [debouncedQuery]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQueryState('');
    setDebouncedQuery('');
    setTutors([]);
    setTotal(0);
    setPage(1);
    setTotalPages(1);
    setError(null);
    hasSearchedRef.current = false;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Set query
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    hasSearchedRef.current = false;
  }, []);

  // Add to search history
  const addToHistory = useCallback(async (term: string) => {
    if (!term.trim()) return;
    
    const normalizedTerm = term.trim();
    setRecentSearches((prev) => {
      // Remove if already exists
      const filtered = prev.filter((s) => s.toLowerCase() !== normalizedTerm.toLowerCase());
      // Add to beginning
      const updated = [normalizedTerm, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveSearchHistory(updated);
      return updated;
    });
  }, []);

  // Remove from search history
  const removeFromHistory = useCallback(async (term: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== term);
      saveSearchHistory(updated);
      return updated;
    });
  }, []);

  // Clear search history
  const clearHistory = useCallback(async () => {
    setRecentSearches([]);
    await memoryStorage.removeItem(SEARCH_HISTORY_KEY);
    devLog('Search history cleared');
  }, []);

  // Track tutor open from search
  const trackTutorOpen = useCallback((tutorId: string) => {
    if (debouncedQuery) {
      analytics.trackTutorOpened(tutorId, debouncedQuery);
    }
  }, [debouncedQuery]);

  return {
    query,
    setQuery,
    searchState,
    tutors,
    total,
    page,
    totalPages,
    hasMore,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    search,
    refresh,
    loadMore,
    retry,
    clearSearch,
    recentSearches,
    addToHistory,
    removeFromHistory,
    clearHistory,
    trackTutorOpen,
  };
}
