import { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import {
  getPaymentHistory,
  PaymentHistoryItem,
} from '../services/paymentApi';

export interface UsePaymentHistoryResult {
  payments: PaymentHistoryItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => void;
}

export function usePaymentHistory(): UsePaymentHistoryResult {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const handleSessionExpired = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const fetchPayments = useCallback(
    async (targetPage: number, mode: 'initial' | 'refresh' | 'loadMore') => {
      if (!token) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      try {
        if (mode === 'initial') setIsLoading(true);
        else if (mode === 'refresh') setIsRefreshing(true);
        else if (mode === 'loadMore') setIsLoadingMore(true);

        setError(null);

        const response = await getPaymentHistory(token, targetPage, 20);

        if (mode === 'loadMore') {
          setPayments((prev) => [...prev, ...response.payments]);
        } else {
          setPayments(response.payments);
        }

        setPage(targetPage);
        setHasMore(targetPage < response.pagination.totalPages);
      } catch (err: any) {
        if (err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        setError(err.message || 'Failed to load payment history');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [token, handleSessionExpired],
  );

  // Initial load
  useEffect(() => {
    fetchPayments(1, 'initial');
  }, [fetchPayments]);

  // Pull-to-refresh
  const refresh = useCallback(async () => {
    await fetchPayments(1, 'refresh');
  }, [fetchPayments]);

  // Load more pagination
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    await fetchPayments(page + 1, 'loadMore');
  }, [fetchPayments, page, isLoadingMore, hasMore]);

  // Retry after error
  const retry = useCallback(() => {
    setPayments([]);
    setPage(1);
    fetchPayments(1, 'initial');
  }, [fetchPayments]);

  return {
    payments,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    page,
    refresh,
    loadMore,
    retry,
  };
}
