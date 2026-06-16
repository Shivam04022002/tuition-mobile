import { useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import * as referralApi from '../services/referralApi';

export interface UseReferralReturn {
  // My referral data
  myReferralCode: string | null;
  referralStats: referralApi.ReferralStats | null;
  referrals: referralApi.Referral[];
  shareMessage: string;
  
  // Loading states
  isLoading: boolean;
  isLoadingReferrals: boolean;
  isSharing: boolean;
  error: string | null;
  
  // Pagination
  hasMore: boolean;
  page: number;
  
  // Actions
  refreshMyCode: () => Promise<void>;
  refreshReferrals: (status?: referralApi.ReferralStatus) => Promise<void>;
  loadMoreReferrals: () => Promise<void>;
  shareReferral: () => Promise<void>;
  clearError: () => void;
}

export const useReferral = (): UseReferralReturn => {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<referralApi.ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<referralApi.Referral[]>([]);
  const [shareMessage, setShareMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<referralApi.ReferralStatus | undefined>();

  const handleSessionExpired = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const refreshMyCode = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (__DEV__) console.log('[useReferral] Fetching referral code');
      const response = await referralApi.getMyReferralCode(token);
      
      if (response.success && response.data?.data) {
        setMyReferralCode(response.data.data.referralCode);
        setReferralStats(response.data.data.stats);
        setShareMessage(response.data.data.shareMessage);
        if (__DEV__) console.log('[useReferral] Referral code loaded:', response.data.data.referralCode);
      } else {
        setError(response.message || 'Failed to load referral code');
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to load referral code';
      setError(message);
      
      if (message?.includes('401') || message?.includes('session') || message?.includes('expired')) {
        handleSessionExpired();
      }
      
      if (__DEV__) console.log('[useReferral] Error loading referral code:', message);
    } finally {
      setIsLoading(false);
    }
  }, [token, handleSessionExpired]);

  const refreshReferrals = useCallback(async (status?: referralApi.ReferralStatus) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setIsLoadingReferrals(true);
    setError(null);
    setPage(1);
    setCurrentStatus(status);

    try {
      if (__DEV__) console.log('[useReferral] Fetching referrals, status:', status);
      const response = await referralApi.getMyReferrals(token, 1, 20, status);
      
      if (response.success && response.data?.referrals) {
        setReferrals(response.data.referrals);
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
        if (__DEV__) console.log('[useReferral] Referrals loaded:', response.data.referrals.length);
      } else {
        setError(response.message || 'Failed to load referrals');
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to load referrals';
      setError(message);
      
      if (message?.includes('401') || message?.includes('session') || message?.includes('expired')) {
        handleSessionExpired();
      }
      
      if (__DEV__) console.log('[useReferral] Error loading referrals:', message);
    } finally {
      setIsLoadingReferrals(false);
    }
  }, [token, handleSessionExpired]);

  const loadMoreReferrals = useCallback(async () => {
    if (!token || !hasMore || isLoadingReferrals) return;

    const nextPage = page + 1;
    setIsLoadingReferrals(true);

    try {
      const response = await referralApi.getMyReferrals(token, nextPage, 20, currentStatus);
      
      if (response.success && response.data?.referrals) {
        setReferrals(prev => [...prev, ...response.data!.referrals]);
        setPage(nextPage);
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
      }
    } catch (err: any) {
      const message = err?.message;
      if (message?.includes('401') || message?.includes('session') || message?.includes('expired')) {
        handleSessionExpired();
      }
    } finally {
      setIsLoadingReferrals(false);
    }
  }, [token, page, hasMore, isLoadingReferrals, currentStatus, handleSessionExpired]);

  const shareReferral = useCallback(async () => {
    if (!shareMessage) return;
    
    setIsSharing(true);
    try {
      const { Share } = await import('react-native');
      await Share.share({
        message: shareMessage,
        title: 'Join me on Tuition Marketplace',
      });
      if (__DEV__) console.log('[useReferral] Referral shared');
    } catch (err) {
      if (__DEV__) console.log('[useReferral] Share cancelled or failed:', err);
    } finally {
      setIsSharing(false);
    }
  }, [shareMessage]);

  const clearError = useCallback(() => setError(null), []);

  return {
    myReferralCode,
    referralStats,
    referrals,
    shareMessage,
    isLoading,
    isLoadingReferrals,
    isSharing,
    error,
    hasMore,
    page,
    refreshMyCode,
    refreshReferrals,
    loadMoreReferrals,
    shareReferral,
    clearError,
  };
};
