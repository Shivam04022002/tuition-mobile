import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getParentShortlists,
  createShortlist,
  removeShortlist,
  markShortlistContacted,
  checkIsShortlisted,
  type Shortlist,
  type CreateShortlistInput,
} from '../services/shortlistApi';

const IS_DEV = __DEV__;

function devLog(message: string): void {
  if (IS_DEV) {
    console.log(`[Shortlists] ${message}`);
  }
}

export interface UseShortlistsResult {
  // Data
  shortlists: Shortlist[];
  total: number;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isAdding: boolean;
  isRemoving: string | null; // shortlistId being removed
  isMarkingContacted: string | null; // shortlistId being marked

  // Error
  error: string | null;
  actionError: string | null;

  // Actions
  refresh: () => Promise<void>;
  retry: () => void;
  addToShortlist: (input: CreateShortlistInput) => Promise<boolean>;
  removeFromShortlist: (shortlistId: string) => Promise<boolean>;
  markContacted: (shortlistId: string, method?: 'call' | 'whatsapp' | 'email' | 'sms') => Promise<boolean>;
  checkIsShortlisted: (teacherId: string, requirementId?: string) => Promise<{ isShortlisted: boolean; shortlistId?: string }>;
  clearActionError: () => void;
}

/**
 * useShortlists
 *
 * Manages parent shortlist state: loading, refreshing, error, and data.
 * Provides actions for adding, removing, and marking tutors as contacted.
 */
export function useShortlists(token: string | null): UseShortlistsResult {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isMarkingContacted, setIsMarkingContacted] = useState<string | null>(null);
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
          devLog('Loading shortlists');
          setIsLoading(true);
        } else {
          devLog('Refreshing shortlists');
          setIsRefreshing(true);
        }
      }

      try {
        const response = await getParentShortlists(token);
        if (!isMounted.current) return;
        setShortlists(response.data.shortlists);
        setTotal(response.data.total);
        setError(null);
        devLog(`Loaded ${response.data.shortlists.length} shortlists`);
      } catch (err: any) {
        if (!isMounted.current) return;
        const message =
          err?.message === 'Unauthorized'
            ? 'Session expired. Please login again.'
            : err?.message || 'Failed to load saved tutors. Please try again.';
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

  const addToShortlist = useCallback(
    async (input: CreateShortlistInput): Promise<boolean> => {
      if (!token) {
        setActionError('Authentication required');
        return false;
      }

      setIsAdding(true);
      setActionError(null);

      try {
        const response = await createShortlist(token, input);
        if (!isMounted.current) return false;

        // Add new shortlist to local state
        setShortlists(prev => [response.data.shortlist, ...prev]);
        setTotal(prev => prev + 1);
        devLog(`Added tutor ${input.teacherId} to shortlist`);
        return true;
      } catch (err: any) {
        if (!isMounted.current) return false;

        // Handle duplicate case (409)
        if (err?.status === 409) {
          devLog(`Tutor already shortlisted: ${err?.shortlistId}`);
          return true; // Consider it success since tutor is already saved
        }

        const message = err?.message || 'Failed to save tutor. Please try again.';
        setActionError(message);
        return false;
      } finally {
        if (isMounted.current) {
          setIsAdding(false);
        }
      }
    },
    [token],
  );

  const removeFromShortlist = useCallback(
    async (shortlistId: string): Promise<boolean> => {
      if (!token) {
        setActionError('Authentication required');
        return false;
      }

      setIsRemoving(shortlistId);
      setActionError(null);

      // Optimistically remove from local state
      const removedShortlist = shortlists.find(s => s._id === shortlistId);
      setShortlists(prev => prev.filter(s => s._id !== shortlistId));
      setTotal(prev => prev - 1);

      try {
        await removeShortlist(token, shortlistId);
        if (!isMounted.current) return false;
        devLog(`Removed shortlist ${shortlistId}`);
        return true;
      } catch (err: any) {
        if (!isMounted.current) return false;

        // Rollback on error
        if (removedShortlist) {
          setShortlists(prev => [...prev, removedShortlist]);
          setTotal(prev => prev + 1);
        }

        const message = err?.message || 'Failed to remove tutor. Please try again.';
        setActionError(message);
        return false;
      } finally {
        if (isMounted.current) {
          setIsRemoving(null);
        }
      }
    },
    [token, shortlists],
  );

  const markContacted = useCallback(
    async (
      shortlistId: string,
      method?: 'call' | 'whatsapp' | 'email' | 'sms'
    ): Promise<boolean> => {
      if (!token) {
        setActionError('Authentication required');
        return false;
      }

      setIsMarkingContacted(shortlistId);
      setActionError(null);

      try {
        const response = await markShortlistContacted(token, shortlistId, method);
        if (!isMounted.current) return false;

        // Update local state
        setShortlists(prev =>
          prev.map(s =>
            s._id === shortlistId
              ? {
                  ...s,
                  isContacted: response.data.shortlist.isContacted,
                  contactedAt: response.data.shortlist.contactedAt,
                  contactMethod: response.data.shortlist.contactMethod,
                }
              : s
          )
        );
        devLog(`Marked shortlist ${shortlistId} as contacted`);
        return true;
      } catch (err: any) {
        if (!isMounted.current) return false;
        const message = err?.message || 'Failed to update contact status. Please try again.';
        setActionError(message);
        return false;
      } finally {
        if (isMounted.current) {
          setIsMarkingContacted(null);
        }
      }
    },
    [token],
  );

  const checkIsShortlistedCallback = useCallback(
    async (teacherId: string, requirementId?: string): Promise<{ isShortlisted: boolean; shortlistId?: string }> => {
      if (!token) {
        return { isShortlisted: false };
      }
      return checkIsShortlisted(token, teacherId, requirementId);
    },
    [token],
  );

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  return {
    shortlists,
    total,
    isLoading,
    isRefreshing,
    isAdding,
    isRemoving,
    isMarkingContacted,
    error,
    actionError,
    refresh,
    retry,
    addToShortlist,
    removeFromShortlist,
    markContacted,
    checkIsShortlisted: checkIsShortlistedCallback,
    clearActionError,
  };
}

export default useShortlists;
