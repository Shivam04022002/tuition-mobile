import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getParentApplications,
  getApplicationById,
  shortlistApplication,
  rejectApplication,
  acceptApplication,
  scheduleDemo,
  type ParentApplication,
  type ParentApplicationsResponse,
  type ApplicationDetailResponse,
  type ScheduleDemoPayload,
} from '../services/applicationApi';

const IS_DEV = __DEV__;

function devLog(message: string): void {
  if (IS_DEV) {
    console.log(`[Applications] ${message}`);
  }
}

export interface UseApplicationsResult {
  applications: ParentApplication[];
  total: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isActionLoading: boolean;
  error: string | null;
  actionError: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
  fetchApplication: (applicationId: string) => Promise<ParentApplication | null>;
  shortlist: (applicationId: string) => Promise<boolean>;
  reject: (applicationId: string, reason?: string) => Promise<boolean>;
  accept: (applicationId: string) => Promise<boolean>;
  scheduleDemoClass: (applicationId: string, payload: ScheduleDemoPayload) => Promise<boolean>;
  clearActionError: () => void;
}

/**
 * useApplications
 *
 * Manages all parent applications state: loading, refreshing, error, and data.
 * Provides actions for shortlisting, rejecting, accepting, and scheduling demos.
 */
export function useApplications(token: string | null): UseApplicationsResult {
  const [applications, setApplications] = useState<ParentApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const isFetching = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (isFetching.current) return;

      if (!token) {
        if (isMounted.current) {
          setError('Authentication required. Please login again.');
          setIsLoading(false);
          setIsRefreshing(false);
        }
        return;
      }

      isFetching.current = true;

      if (isMounted.current) {
        setError(null);
        if (mode === 'initial') {
          devLog('Loading applications');
          setIsLoading(true);
        } else {
          devLog('Refreshing applications');
          setIsRefreshing(true);
        }
      }

      try {
        const response: ParentApplicationsResponse = await getParentApplications(token);
        if (!isMounted.current) return;
        setApplications(response.applications);
        setTotal(response.total);
        setError(null);
        devLog(`Loaded ${response.applications.length} applications`);
      } catch (err: any) {
        if (!isMounted.current) return;
        const message =
          err?.message === 'Unauthorized'
            ? 'Session expired. Please login again.'
            : err?.message || 'Failed to load applications. Please try again.';
        setError(message);
        devLog(`Error: ${message}`);
      } finally {
        isFetching.current = false;
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [token],
  );

  useEffect(() => {
    fetchData('initial');
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData('refresh');
  }, [fetchData]);

  const retry = useCallback(() => {
    fetchData('initial');
  }, [fetchData]);

  const fetchApplication = useCallback(
    async (applicationId: string): Promise<ParentApplication | null> => {
      if (!token) {
        setActionError('Authentication required');
        return null;
      }

      try {
        const response: ApplicationDetailResponse = await getApplicationById(token, applicationId);
        return response.application;
      } catch (err: any) {
        const message = err?.message || 'Failed to fetch application details';
        setActionError(message);
        return null;
      }
    },
    [token],
  );

  const shortlist = useCallback(
    async (applicationId: string): Promise<boolean> => {
      if (!token) {
        setActionError('Authentication required');
        return false;
      }

      setIsActionLoading(true);
      setActionError(null);

      try {
        await shortlistApplication(token, applicationId);
        // Optimistically update local state
        setApplications(prev =>
          prev.map(app =>
            app._id === applicationId || app.applicationId === applicationId
              ? { ...app, status: 'shortlisted' as const, shortlistedAt: new Date().toISOString() }
              : app,
          ),
        );
        devLog(`Shortlisted application ${applicationId}`);
        return true;
      } catch (err: any) {
        const message = err?.message || 'Failed to shortlist application';
        setActionError(message);
        return false;
      } finally {
        setIsActionLoading(false);
      }
    },
    [token],
  );

  const reject = useCallback(
    async (applicationId: string, reason?: string): Promise<boolean> => {
      if (!token) {
        setActionError('Authentication required');
        return false;
      }

      setIsActionLoading(true);
      setActionError(null);

      try {
        await rejectApplication(token, applicationId, reason);
        // Optimistically update local state
        setApplications(prev =>
          prev.map(app =>
            app._id === applicationId || app.applicationId === applicationId
              ? { ...app, status: 'rejected' as const, rejectedAt: new Date().toISOString(), rejectionReason: reason }
              : app,
          ),
        );
        devLog(`Rejected application ${applicationId}`);
        return true;
      } catch (err: any) {
        const message = err?.message || 'Failed to reject application';
        setActionError(message);
        return false;
      } finally {
        setIsActionLoading(false);
      }
    },
    [token],
  );

  const accept = useCallback(
    async (applicationId: string): Promise<boolean> => {
      if (!token) {
        setActionError('Authentication required');
        return false;
      }

      setIsActionLoading(true);
      setActionError(null);

      try {
        await acceptApplication(token, applicationId);
        // Optimistically update local state
        setApplications(prev =>
          prev.map(app =>
            app._id === applicationId || app.applicationId === applicationId
              ? { ...app, status: 'accepted' as const, acceptedAt: new Date().toISOString() }
              : app,
          ),
        );
        devLog(`Accepted application ${applicationId}`);
        return true;
      } catch (err: any) {
        const message = err?.message || 'Failed to accept application';
        setActionError(message);
        return false;
      } finally {
        setIsActionLoading(false);
      }
    },
    [token],
  );

  const scheduleDemoClass = useCallback(
    async (applicationId: string, payload: ScheduleDemoPayload): Promise<boolean> => {
      if (!token) {
        setActionError('Authentication required');
        return false;
      }

      setIsActionLoading(true);
      setActionError(null);

      try {
        await scheduleDemo(token, applicationId, payload);
        // Optimistically update local state
        setApplications(prev =>
          prev.map(app =>
            app._id === applicationId || app.applicationId === applicationId
              ? { ...app, demoScheduled: true }
              : app,
          ),
        );
        devLog(`Scheduled demo for application ${applicationId}`);
        return true;
      } catch (err: any) {
        const message = err?.message || 'Failed to schedule demo';
        setActionError(message);
        return false;
      } finally {
        setIsActionLoading(false);
      }
    },
    [token],
  );

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  return {
    applications,
    total,
    isLoading,
    isRefreshing,
    isActionLoading,
    error,
    actionError,
    refresh,
    retry,
    fetchApplication,
    shortlist,
    reject,
    accept,
    scheduleDemoClass,
    clearActionError,
  };
}

export default useApplications;
