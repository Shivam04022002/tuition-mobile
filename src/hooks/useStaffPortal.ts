import { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import {
  getDashboard,
  getVerificationQueue,
  approveTeacher,
  rejectTeacher,
  getReports,
  StaffDashboardData,
  VerificationTeacher,
  VerificationCounts,
  StaffReportsData,
} from '../services/staffApi';

// ─────────────────────────────────────────────────────────────────────────────
// useStaffDashboard
// ─────────────────────────────────────────────────────────────────────────────
export function useStaffDashboard() {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  const [dashboard, setDashboard] = useState<StaffDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) setIsLoading(true);
      setError(null);
      try {
        const data = await getDashboard(token);
        setDashboard(data);
      } catch (err: any) {
        if (err?.message?.includes('401') || err?.message?.toLowerCase().includes('unauthorized')) {
          dispatch(logout());
          return;
        }
        setError(err?.message || 'Unable to load dashboard');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, dispatch],
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    load(true);
  }, [load]);

  const retry = useCallback(() => {
    load();
  }, [load]);

  return { dashboard, isLoading, isRefreshing, error, refresh, retry };
}

// ─────────────────────────────────────────────────────────────────────────────
// useVerificationQueue
// ─────────────────────────────────────────────────────────────────────────────
export function useVerificationQueue() {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  const [teachers, setTeachers] = useState<VerificationTeacher[]>([]);
  const [counts, setCounts] = useState<VerificationCounts>({ pending: 0, verified: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'verified' | 'rejected' | undefined>(undefined);
  const [search, setSearch] = useState('');

  const load = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) setIsLoading(true);
      setError(null);
      try {
        const result = await getVerificationQueue(token, {
          status: statusFilter,
          search: search.trim() || undefined,
          limit: 50,
        });
        setTeachers(result.teachers);
        setCounts(result.counts);
      } catch (err: any) {
        if (err?.message?.includes('401') || err?.message?.toLowerCase().includes('unauthorized')) {
          dispatch(logout());
          return;
        }
        setError(err?.message || 'Unable to load verifications');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, dispatch, statusFilter, search],
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    load(true);
  }, [load]);

  const retry = useCallback(() => {
    load();
  }, [load]);

  const handleApprove = useCallback(
    async (id: string): Promise<void> => {
      if (!token) throw new Error('Not authenticated');
      await approveTeacher(token, id);
      setTeachers((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, verificationStatus: 'verified' as const, isVerified: true } : t,
        ),
      );
      setCounts((prev) => ({
        ...prev,
        pending: Math.max(0, (prev?.pending ?? 0) - 1),
        verified: (prev?.verified ?? 0) + 1,
      }));
    },
    [token],
  );

  const handleReject = useCallback(
    async (id: string, reason: string): Promise<void> => {
      if (!token) throw new Error('Not authenticated');
      await rejectTeacher(token, id, reason);
      setTeachers((prev) =>
        prev.map((t) =>
          t._id === id
            ? { ...t, verificationStatus: 'rejected' as const, isVerified: false, rejectionReason: reason }
            : t,
        ),
      );
      setCounts((prev) => ({
        ...prev,
        pending: Math.max(0, (prev?.pending ?? 0) - 1),
        rejected: (prev?.rejected ?? 0) + 1,
      }));
    },
    [token],
  );

  return {
    teachers,
    counts,
    isLoading,
    isRefreshing,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    refresh,
    retry,
    handleApprove,
    handleReject,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// useStaffReports
// ─────────────────────────────────────────────────────────────────────────────
export function useStaffReports() {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  const [reports, setReports] = useState<StaffReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) setIsLoading(true);
      setError(null);
      try {
        const data = await getReports(token);
        setReports(data);
      } catch (err: any) {
        if (err?.message?.includes('401') || err?.message?.toLowerCase().includes('unauthorized')) {
          dispatch(logout());
          return;
        }
        setError(err?.message || 'Unable to load reports');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, dispatch],
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    load(true);
  }, [load]);

  const retry = useCallback(() => {
    load();
  }, [load]);

  return { reports, isLoading, isRefreshing, error, refresh, retry };
}
