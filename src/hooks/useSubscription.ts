import { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  selectPlan as apiSelectPlan,
  cancelSubscription as apiCancelSubscription,
  SubscriptionPlan,
  CurrentSubscriptionData,
  SelectPlanResult,
} from '../services/subscriptionApi';

export interface UseSubscriptionResult {
  plans: SubscriptionPlan[];
  currentData: CurrentSubscriptionData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isSelecting: boolean;
  isCancelling: boolean;
  error: string | null;
  selectError: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
  selectPlan: (planName: string) => Promise<SelectPlanResult | null>;
  cancelPlan: (reason?: string) => Promise<boolean>;
  clearSelectError: () => void;
}

export function useSubscription(): UseSubscriptionResult {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentData, setCurrentData] = useState<CurrentSubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);

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

      const [plansData, subData] = await Promise.all([
        getSubscriptionPlans(token),
        getCurrentSubscription(token),
      ]);

      setPlans(plansData);
      setCurrentData(subData);
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      setError(err.message || 'Failed to load subscription data');
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

  const selectPlan = useCallback(async (planName: string): Promise<SelectPlanResult | null> => {
    if (!token) return null;
    try {
      setIsSelecting(true);
      setSelectError(null);

      const result = await apiSelectPlan(token, planName);

      // Refresh current data after selection
      const subData = await getCurrentSubscription(token);
      setCurrentData(subData);

      if (__DEV__) {
        console.log(`[Subscription] Plan ${result.action}: ${result.plan.displayName}`);
      }

      return result;
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return null;
      }
      setSelectError(err.message || 'Failed to select plan');
      return null;
    } finally {
      setIsSelecting(false);
    }
  }, [token, handleSessionExpired]);

  const cancelPlan = useCallback(async (reason?: string): Promise<boolean> => {
    if (!token) return false;
    try {
      setIsCancelling(true);
      setSelectError(null);

      await apiCancelSubscription(token, reason);

      // Refresh current data after cancellation
      const subData = await getCurrentSubscription(token);
      setCurrentData(subData);

      if (__DEV__) {
        console.log('[Subscription] Plan cancelled');
      }

      return true;
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return false;
      }
      setSelectError(err.message || 'Failed to cancel subscription');
      return false;
    } finally {
      setIsCancelling(false);
    }
  }, [token, handleSessionExpired]);

  const clearSelectError = useCallback(() => {
    setSelectError(null);
  }, []);

  return {
    plans,
    currentData,
    isLoading,
    isRefreshing,
    isSelecting,
    isCancelling,
    error,
    selectError,
    refresh,
    retry,
    selectPlan,
    cancelPlan,
    clearSelectError,
  };
}
