import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppDispatch } from '../redux/store';
import { logout } from '../redux/slices/authSlice';
import {
  ContactRequest,
  ContactStatus,
  ContactType,
  CreateContactRequestPayload,
  CreateDemoRequestPayload,
  UpdateContactStatusPayload,
  RescheduleDemoPayload,
  CompleteDemoPayload,
  DemoSummaryStats,
  ContactHistoryResponse,
  getContactHistory,
  getTeacherContactRequests,
  createContactRequest,
  createDemoRequest,
  updateContactRequestStatus,
  rescheduleDemoRequest,
  completeDemoRequest,
} from '../services/contactApi';

// ── Analytics (dev logging) ──────────────────────────────────────────────────
const trackEvent = (event: string, payload?: Record<string, any>) => {
  if (__DEV__) {
    console.log(`[Analytics] ${event}`, payload || '');
  }
};

// ── Hook Result Types ────────────────────────────────────────────────────────

interface UseParentContactResult {
  contactRequests: ContactRequest[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  page: number;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
  createRequest: (payload: CreateContactRequestPayload) => Promise<ContactRequest | null>;
  createDemo: (payload: CreateDemoRequestPayload) => Promise<ContactRequest | null>;
  isSubmitting: boolean;
  submitError: string | null;
  clearSubmitError: () => void;
}

interface UseTeacherContactResult {
  contactRequests: ContactRequest[];
  summaryStats: DemoSummaryStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  page: number;
  activeFilter: ContactStatus | 'all';
  searchQuery: string;
  setFilter: (filter: ContactStatus | 'all') => void;
  setSearch: (q: string) => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
  respondToRequest: (id: string, payload: UpdateContactStatusPayload) => Promise<ContactRequest | null>;
  rescheduleDemo: (id: string, payload: RescheduleDemoPayload) => Promise<ContactRequest | null>;
  completeDemo: (id: string, payload: CompleteDemoPayload) => Promise<ContactRequest | null>;
  isResponding: boolean;
  responseError: string | null;
  clearResponseError: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ── Parent Hook ─────────────────────────────────────────────────────────────

export const useParentContact = (token: string | null): UseParentContactResult => {
  const dispatch = useAppDispatch();
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Track if component is mounted
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const fetchRequests = useCallback(async (
    mode: 'initial' | 'refresh' | 'load-more',
    targetPage?: number,
  ) => {
    if (!token) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }

    if (mode === 'initial') setIsLoading(true);
    else if (mode === 'refresh') setIsRefreshing(true);
    else if (mode === 'load-more') setIsLoadingMore(true);

    setError(null);

    try {
      const currentPage = targetPage || (mode === 'load-more' ? page + 1 : 1);
      const response = await getContactHistory(token, {
        page: currentPage,
        limit: PAGE_SIZE,
      });

      if (!isMounted.current) return;

      if (mode === 'load-more') {
        setContactRequests(prev => [...prev, ...response.contactRequests]);
      } else {
        setContactRequests(response.contactRequests);
      }

      setHasMore(response.hasMore);
      setPage(currentPage);
      
      trackEvent('Contact History Loaded', { 
        count: response.contactRequests.length,
        total: response.total,
        page: currentPage,
      });
    } catch (err: any) {
      if (!isMounted.current) return;
      
      const msg = err?.message || 'Failed to load contact history';
      setError(msg);
      
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
      }
      
      trackEvent('Contact History Error', { error: msg });
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    }
  }, [token, dispatch, page]);

  const refresh = useCallback(async () => {
    setPage(1);
    await fetchRequests('refresh', 1);
  }, [fetchRequests]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    await fetchRequests('load-more');
  }, [fetchRequests, isLoadingMore, hasMore]);

  const retry = useCallback(async () => {
    if (contactRequests.length === 0) {
      await fetchRequests('initial', 1);
    } else {
      await refresh();
    }
  }, [fetchRequests, refresh, contactRequests.length]);

  const createRequest = useCallback(async (
    payload: CreateContactRequestPayload,
  ): Promise<ContactRequest | null> => {
    if (!token) {
      setSubmitError('Authentication required');
      return null;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await createContactRequest(token, payload);
      
      trackEvent('Contact Request Created', {
        contactType: payload.contactType,
        teacherId: payload.teacherId,
      });
      
      // Optimistically add to list
      setContactRequests(prev => [response.contactRequest, ...prev]);
      
      return response.contactRequest;
    } catch (err: any) {
      const msg = err?.message || 'Failed to send contact request';
      setSubmitError(msg);
      
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
      }
      
      trackEvent('Contact Request Error', { error: msg });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [token, dispatch]);

  const createDemo = useCallback(async (
    payload: CreateDemoRequestPayload,
  ): Promise<ContactRequest | null> => {
    if (!token) {
      setSubmitError('Authentication required');
      return null;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await createDemoRequest(token, payload);
      
      trackEvent('Demo Request Created', {
        teacherId: payload.teacherId,
        demoDate: payload.demoDate,
      });
      
      // Optimistically add to list
      setContactRequests(prev => [response.contactRequest, ...prev]);
      
      return response.contactRequest;
    } catch (err: any) {
      const msg = err?.message || 'Failed to send demo request';
      setSubmitError(msg);
      
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
      }
      
      trackEvent('Demo Request Error', { error: msg });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [token, dispatch]);

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  useEffect(() => {
    if (token) {
      fetchRequests('initial', 1);
    }
  }, [token, fetchRequests]);

  return {
    contactRequests,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    page,
    refresh,
    loadMore,
    retry,
    createRequest,
    createDemo,
    isSubmitting,
    submitError,
    clearSubmitError,
  };
};

// ── Teacher Hook ─────────────────────────────────────────────────────────────

export const useTeacherContact = (token: string | null): UseTeacherContactResult => {
  const dispatch = useAppDispatch();
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [summaryStats, setSummaryStats] = useState<DemoSummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isResponding, setIsResponding] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ContactStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const fetchRequests = useCallback(async (
    mode: 'initial' | 'refresh' | 'load-more',
    targetPage?: number,
    filter?: ContactStatus | 'all',
    search?: string,
  ) => {
    if (!token) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }

    if (mode === 'initial') setIsLoading(true);
    else if (mode === 'refresh') setIsRefreshing(true);
    else if (mode === 'load-more') setIsLoadingMore(true);

    setError(null);

    try {
      const currentPage = targetPage || (mode === 'load-more' ? page + 1 : 1);
      const currentFilter = filter !== undefined ? filter : activeFilter;
      const currentSearch = search !== undefined ? search : searchQuery;

      const response = await getTeacherContactRequests(token, {
        page: currentPage,
        limit: PAGE_SIZE,
        contactType: 'demo',
        status: currentFilter !== 'all' ? currentFilter : undefined,
        search: currentSearch || undefined,
      });

      if (!isMounted.current) return;

      if (mode === 'load-more') {
        setContactRequests(prev => [...prev, ...response.contactRequests]);
      } else {
        setContactRequests(response.contactRequests);
      }

      if (response.summaryStats) {
        setSummaryStats(response.summaryStats);
      }

      setHasMore(response.hasMore);
      setPage(currentPage);
      
      trackEvent('Teacher Demo Requests Loaded', { 
        count: response.contactRequests.length,
        total: response.total,
        page: currentPage,
        filter: currentFilter,
      });
    } catch (err: any) {
      if (!isMounted.current) return;
      
      const msg = err?.message || 'Failed to load demo requests';
      setError(msg);
      
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
      }
      
      trackEvent('Teacher Demo Requests Error', { error: msg });
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    }
  }, [token, dispatch, page, activeFilter, searchQuery]);

  const refresh = useCallback(async () => {
    setPage(1);
    await fetchRequests('refresh', 1);
  }, [fetchRequests]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    await fetchRequests('load-more');
  }, [fetchRequests, isLoadingMore, hasMore]);

  const retry = useCallback(async () => {
    if (contactRequests.length === 0) {
      await fetchRequests('initial', 1);
    } else {
      await refresh();
    }
  }, [fetchRequests, refresh, contactRequests.length]);

  const setFilter = useCallback((filter: ContactStatus | 'all') => {
    setActiveFilter(filter);
    setPage(1);
    fetchRequests('initial', 1, filter, searchQuery);
  }, [fetchRequests, searchQuery]);

  const setSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setPage(1);
    fetchRequests('initial', 1, activeFilter, q);
  }, [fetchRequests, activeFilter]);

  const respondToRequest = useCallback(async (
    id: string,
    payload: UpdateContactStatusPayload,
  ): Promise<ContactRequest | null> => {
    if (!token) {
      setResponseError('Authentication required');
      return null;
    }

    setIsResponding(true);
    setResponseError(null);

    try {
      const response = await updateContactRequestStatus(token, id, payload);
      
      trackEvent('Demo Request Responded', {
        id,
        status: payload.status,
      });
      
      setContactRequests(prev =>
        prev.map(req =>
          req._id === id || req.contactRequestId === id
            ? response.contactRequest
            : req
        )
      );
      
      return response.contactRequest;
    } catch (err: any) {
      const msg = err?.message || 'Failed to respond to request';
      setResponseError(msg);
      
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
      }
      
      trackEvent('Demo Response Error', { error: msg });
      return null;
    } finally {
      setIsResponding(false);
    }
  }, [token, dispatch]);

  const rescheduleDemo = useCallback(async (
    id: string,
    payload: RescheduleDemoPayload,
  ): Promise<ContactRequest | null> => {
    if (!token) {
      setResponseError('Authentication required');
      return null;
    }

    setIsResponding(true);
    setResponseError(null);

    try {
      const response = await rescheduleDemoRequest(token, id, payload);
      
      trackEvent('Demo Rescheduled', { id, newDate: payload.newDate });
      
      setContactRequests(prev =>
        prev.map(req =>
          req._id === id || req.contactRequestId === id
            ? response.contactRequest
            : req
        )
      );
      
      return response.contactRequest;
    } catch (err: any) {
      const msg = err?.message || 'Failed to reschedule demo';
      setResponseError(msg);
      
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
      }
      
      trackEvent('Demo Reschedule Error', { error: msg });
      return null;
    } finally {
      setIsResponding(false);
    }
  }, [token, dispatch]);

  const completeDemo = useCallback(async (
    id: string,
    payload: CompleteDemoPayload,
  ): Promise<ContactRequest | null> => {
    if (!token) {
      setResponseError('Authentication required');
      return null;
    }

    setIsResponding(true);
    setResponseError(null);

    try {
      const response = await completeDemoRequest(token, id, payload);
      
      trackEvent('Demo Completed', { id, outcome: payload.outcome });
      
      setContactRequests(prev =>
        prev.map(req =>
          req._id === id || req.contactRequestId === id
            ? response.contactRequest
            : req
        )
      );
      
      return response.contactRequest;
    } catch (err: any) {
      const msg = err?.message || 'Failed to complete demo';
      setResponseError(msg);
      
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
      }
      
      trackEvent('Demo Complete Error', { error: msg });
      return null;
    } finally {
      setIsResponding(false);
    }
  }, [token, dispatch]);

  const clearResponseError = useCallback(() => {
    setResponseError(null);
  }, []);

  useEffect(() => {
    if (token) {
      fetchRequests('initial', 1);
    }
  }, [token]);

  return {
    contactRequests,
    summaryStats,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    page,
    activeFilter,
    searchQuery,
    setFilter,
    setSearch,
    refresh,
    loadMore,
    retry,
    respondToRequest,
    rescheduleDemo,
    completeDemo,
    isResponding,
    responseError,
    clearResponseError,
  };
};
