import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { selectAuthToken } from '../redux/slices/authSlice';
import { logout } from '../redux/slices/authSlice';
import {
  selectParentSubscriptionState,
  setSubscriptionLoading,
  setSubscriptionStatus,
  setSubscriptionError,
  resetParentSubscription,
} from '../redux/slices/parentSubscriptionSlice';
import { getParentSubscriptionStatus } from '../services/parentSubscriptionApi';

export interface UseParentSubscriptionResult {
  isLoading: boolean;
  hasActiveSubscription: boolean;
  subscription: ReturnType<typeof selectParentSubscriptionState>['subscription'];
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Reads/refreshes the parent's subscription status into the shared
 * parentSubscriptionSlice. Every screen that gates a "Contact" button calls
 * this hook and reads from the same cache, so a successful purchase
 * (verifyParentSubscriptionPayment dispatching setSubscriptionStatus) unlocks
 * every mounted screen at once — see useParentPayment.ts.
 */
export function useParentSubscription(): UseParentSubscriptionResult {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();
  const { status, hasActiveSubscription, subscription, error } = useAppSelector(selectParentSubscriptionState);

  const refresh = useCallback(async () => {
    if (!token) return;
    dispatch(setSubscriptionLoading());
    try {
      const data = await getParentSubscriptionStatus(token);
      dispatch(setSubscriptionStatus(data));
    } catch (err: any) {
      if (err?.message === 'SESSION_EXPIRED') {
        dispatch(logout());
        return;
      }
      dispatch(setSubscriptionError(err?.message || 'Failed to load subscription status'));
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (!token) {
      dispatch(resetParentSubscription());
      return;
    }
    if (status === 'idle') {
      refresh();
    }
  }, [token, status, refresh, dispatch]);

  return {
    isLoading: status === 'loading',
    hasActiveSubscription,
    subscription,
    error,
    refresh,
  };
}
