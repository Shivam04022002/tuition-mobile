import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import {
  fetchParentProfile,
  fetchNotificationCount,
} from '../services/parentProfileService';
import type { ParentProfile, NotificationSummary } from '../services/parentProfileService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface HeaderProps {
  profile: ParentProfile | null;
  notificationSummary: NotificationSummary;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dev-only logger
// ─────────────────────────────────────────────────────────────────────────────

const IS_DEV = __DEV__;

function devLog(message: string): void {
  if (IS_DEV) {
    console.log(`[ParentProfile] ${message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK values used on API error
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_PROFILE: ParentProfile = {
  _id: '',
  name: 'Parent',
  email: '',
  phone: '',
  profileImage: null,
  role: 'parent',
};

const FALLBACK_SUMMARY: NotificationSummary = { count: 0 };

// ─────────────────────────────────────────────────────────────────────────────
// useParentProfile
// ─────────────────────────────────────────────────────────────────────────────

export function useParentProfile(): HeaderProps {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);

  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [notificationSummary, setNotificationSummary] = useState<NotificationSummary>(FALLBACK_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const isFetching = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchAll = useCallback(
    async (isRefresh = false): Promise<void> => {
      if (isFetching.current) return;
      if (!token) {
        if (isMounted.current) {
          setError('Authentication required');
          setIsLoading(false);
        }
        return;
      }

      isFetching.current = true;

      if (isMounted.current) {
        setError(null);
        if (!isRefresh) {
          devLog('Profile Loading');
          setIsLoading(true);
        }
      }

      try {
        // Fetch profile and notification count in parallel
        const [profileData, count] = await Promise.all([
          fetchParentProfile(token),
          fetchNotificationCount(token),
        ]);

        if (!isMounted.current) return;

        setProfile(profileData);
        setNotificationSummary({ count });
        setError(null);

        devLog(`Profile Loaded: ${profileData.name}`);
        devLog(`Notification Count Loaded: ${count}`);
      } catch (err: any) {
        if (!isMounted.current) return;

        if (err?.status === 401) {
          devLog('Header Error: Session expired');
          dispatch(logout());
          return;
        }

        const message = err?.message || 'Failed to load profile';
        devLog(`Header Error: ${message}`);
        setError(message);

        // Apply fallbacks so the app does not crash
        if (!profile) setProfile(FALLBACK_PROFILE);
        setNotificationSummary(FALLBACK_SUMMARY);
      } finally {
        isFetching.current = false;
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, dispatch],
  );

  // Initial fetch
  useEffect(() => {
    fetchAll(false);
  }, [fetchAll]);

  const refresh = useCallback(async (): Promise<void> => {
    devLog('Header Refresh');
    await fetchAll(true);
  }, [fetchAll]);

  return {
    profile: profile ?? (error ? FALLBACK_PROFILE : null),
    notificationSummary,
    isLoading,
    error,
    refresh,
  };
}
