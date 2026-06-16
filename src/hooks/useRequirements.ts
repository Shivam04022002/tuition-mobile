import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getRequirements,
  deleteRequirement as apiDeleteRequirement,
  closeRequirement as apiCloseRequirement,
  pauseRequirement as apiPauseRequirement,
  resumeRequirement as apiResumeRequirement,
  ParentRequirement,
  RequirementCounts,
  RequirementStatus,
} from '../services/requirementApi';

const EMPTY_COUNTS: RequirementCounts = {
  total: 0,
  active: 0,
  closed: 0,
  expired: 0,
  paused: 0,
};

export interface UseRequirementsResult {
  requirements: ParentRequirement[];
  counts: RequirementCounts;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  deletingId: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
  deleteRequirement: (id: string) => Promise<void>;
  closeRequirement: (id: string) => Promise<void>;
  pauseRequirement: (id: string) => Promise<void>;
  resumeRequirement: (id: string) => Promise<void>;
}

/**
 * useRequirements
 *
 * Manages the full lifecycle of the parent's requirements list:
 *  - Initial load  → GET /api/parents/my-requirements
 *  - Refresh       → pull-to-refresh handler
 *  - Retry         → re-fetches from loading state on error
 *  - Delete        → soft-delete with optimistic removal + server sync
 *  - Close         → marks active requirement as closed + refresh
 */
export function useRequirements(token: string | null): UseRequirementsResult {
  const [requirements, setRequirements] = useState<ParentRequirement[]>([]);
  const [counts, setCounts] = useState<RequirementCounts>(EMPTY_COUNTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ── Core fetch ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token) {
        if (isMounted.current) {
          setError('Authentication required. Please login again.');
          setIsLoading(false);
          setIsRefreshing(false);
        }
        return;
      }

      if (isMounted.current) {
        setError(null);
        if (mode === 'initial') setIsLoading(true);
        else setIsRefreshing(true);
      }

      try {
        const result = await getRequirements(token);
        if (!isMounted.current) return;
        setRequirements(result.requirements);
        setCounts(result.counts);
        setError(null);
      } catch (err: any) {
        if (!isMounted.current) return;
        const message =
          err?.message === 'Unauthorized'
            ? 'Session expired. Please login again.'
            : err?.message || 'Failed to load requirements. Please try again.';
        setError(message);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [token],
  );

  // Initial load
  useEffect(() => {
    fetchData('initial');
  }, [fetchData]);

  // Pull-to-refresh
  const refresh = useCallback(async () => {
    await fetchData('refresh');
  }, [fetchData]);

  // Retry from error state
  const retry = useCallback(() => {
    fetchData('initial');
  }, [fetchData]);

  // Delete: optimistic removal → server → full refresh
  const deleteRequirement = useCallback(
    async (id: string) => {
      if (!token) return;
      setDeletingId(id);
      try {
        // Optimistic: remove from list immediately
        setRequirements(prev => {
          const updated = prev.filter(r => r._id !== id);
          const newCounts: RequirementCounts = {
            total: updated.length,
            active: updated.filter(r => r.status === 'active').length,
            closed: updated.filter(r => r.status === 'closed').length,
            expired: updated.filter(r => r.status === 'expired').length,
            paused: updated.filter(r => r.status === 'paused').length,
          };
          setCounts(newCounts);
          return updated;
        });
        await apiDeleteRequirement(token, id);
        // Full refresh to sync
        await fetchData('refresh');
      } finally {
        if (isMounted.current) setDeletingId(null);
      }
    },
    [token, fetchData],
  );

  // Close: calls close endpoint then refreshes
  const closeRequirement = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await apiCloseRequirement(token, id);
        setRequirements(prev => {
          const updated = prev.map(r =>
            r._id === id ? { ...r, status: 'closed' as RequirementStatus } : r,
          );
          const newCounts: RequirementCounts = {
            total: updated.length,
            active: updated.filter(r => r.status === 'active').length,
            closed: updated.filter(r => r.status === 'closed').length,
            expired: updated.filter(r => r.status === 'expired').length,
            paused: updated.filter(r => r.status === 'paused').length,
          };
          setCounts(newCounts);
          return updated;
        });
        await fetchData('refresh');
      } catch (err: any) {
        throw err;
      }
    },
    [token, fetchData],
  );

  // Pause: sets status to 'paused' optimistically then syncs
  const pauseRequirement = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await apiPauseRequirement(token, id);
        setRequirements(prev => {
          const updated = prev.map(r =>
            r._id === id ? { ...r, status: 'paused' as RequirementStatus } : r,
          );
          setCounts({
            total: updated.length,
            active: updated.filter(r => r.status === 'active').length,
            closed: updated.filter(r => r.status === 'closed').length,
            expired: updated.filter(r => r.status === 'expired').length,
            paused: updated.filter(r => r.status === 'paused').length,
          });
          return updated;
        });
        await fetchData('refresh');
      } catch (err: any) {
        throw err;
      }
    },
    [token, fetchData],
  );

  // Resume: sets status back to 'active' optimistically then syncs
  const resumeRequirement = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await apiResumeRequirement(token, id);
        setRequirements(prev => {
          const updated = prev.map(r =>
            r._id === id ? { ...r, status: 'active' as RequirementStatus } : r,
          );
          setCounts({
            total: updated.length,
            active: updated.filter(r => r.status === 'active').length,
            closed: updated.filter(r => r.status === 'closed').length,
            expired: updated.filter(r => r.status === 'expired').length,
            paused: updated.filter(r => r.status === 'paused').length,
          });
          return updated;
        });
        await fetchData('refresh');
      } catch (err: any) {
        throw err;
      }
    },
    [token, fetchData],
  );

  return {
    requirements,
    counts,
    isLoading,
    isRefreshing,
    error,
    deletingId,
    refresh,
    retry,
    deleteRequirement,
    closeRequirement,
    pauseRequirement,
    resumeRequirement,
  };
}
