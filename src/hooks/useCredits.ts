import { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import {
  getCreditBalance,
  getCreditHistory,
  unlockLead as apiUnlockLead,
  refundCredit as apiRefundCredit,
  CreditBalance,
  CreditTransactionItem,
  UnlockLeadResult,
} from '../services/creditApi';

export interface UseCreditsResult {
  balance: CreditBalance | null;
  transactions: CreditTransactionItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isUnlocking: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  unlockError: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
  loadMore: () => Promise<void>;
  unlockLead: (requirementId: string) => Promise<UnlockLeadResult | null>;
  refundCredit: (unlockId: string, reason: string) => Promise<boolean>;
  clearUnlockError: () => void;
}

export function useCredits(): UseCreditsResult {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const handleSessionExpired = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const fetchData = useCallback(async (showLoading = true) => {
    if (!token) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }

    try {
      if (showLoading) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const [balData, histData] = await Promise.all([
        getCreditBalance(token),
        getCreditHistory(token, 1, 20),
      ]);

      setBalance(balData);
      setTransactions(histData.transactions);
      setHasMore(histData.pagination.page < histData.pagination.totalPages);
      setPage(1);
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      setError(err.message || 'Failed to load credit data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, handleSessionExpired]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  const retry = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const loadMore = useCallback(async () => {
    if (!token || isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const histData = await getCreditHistory(token, nextPage, 20);
      setTransactions(prev => [...prev, ...histData.transactions]);
      setHasMore(histData.pagination.page < histData.pagination.totalPages);
      setPage(nextPage);
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [token, page, isLoadingMore, hasMore, handleSessionExpired]);

  const unlockLead = useCallback(async (requirementId: string): Promise<UnlockLeadResult | null> => {
    if (!token) return null;
    try {
      setIsUnlocking(true);
      setUnlockError(null);

      const result = await apiUnlockLead(token, requirementId);

      // Refresh balance after unlock
      try {
        const balData = await getCreditBalance(token);
        setBalance(balData);
      } catch (_) {}

      if (__DEV__) {
        console.log('[Credits] Lead Unlocked', { requirementId, creditsRemaining: result.creditsRemaining });
      }

      return result;
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return null;
      }
      setUnlockError(err.message || 'Failed to unlock lead');
      return null;
    } finally {
      setIsUnlocking(false);
    }
  }, [token, handleSessionExpired]);

  const refundCreditFn = useCallback(async (unlockId: string, reason: string): Promise<boolean> => {
    if (!token) return false;
    try {
      setUnlockError(null);
      await apiRefundCredit(token, unlockId, reason);

      // Refresh all data
      await fetchData(false);

      if (__DEV__) {
        console.log('[Credits] Credit Refunded', { unlockId });
      }

      return true;
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return false;
      }
      setUnlockError(err.message || 'Failed to refund credit');
      return false;
    }
  }, [token, handleSessionExpired, fetchData]);

  const clearUnlockError = useCallback(() => {
    setUnlockError(null);
  }, []);

  return {
    balance,
    transactions,
    isLoading,
    isRefreshing,
    isUnlocking,
    isLoadingMore,
    hasMore,
    error,
    unlockError,
    refresh,
    retry,
    loadMore,
    unlockLead,
    refundCredit: refundCreditFn,
    clearUnlockError,
  };
}
