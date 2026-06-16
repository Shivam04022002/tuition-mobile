import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getTeacherApplications, withdrawApplication } from '../services/applicationApi';
import { TeacherApplication } from '../services/teacherApi';

export type ApplicationFilterType = 
  | 'all' 
  | 'pending' 
  | 'shortlisted' 
  | 'rejected' 
  | 'accepted'
  | 'demo_scheduled'
  | 'demo_completed'
  | 'withdrawn';

export type SortOption = 
  | 'newest' 
  | 'oldest' 
  | 'highest_budget' 
  | 'lowest_budget' 
  | 'highest_match';

export interface ApplicationCounts {
  all: number;
  pending: number;
  shortlisted: number;
  accepted: number;
  rejected: number;
  demoScheduled: number;
  demoCompleted: number;
  withdrawn: number;
}

export interface UseTeacherApplicationsResult {
  // Data
  applications: TeacherApplication[];
  filteredApplications: TeacherApplication[];
  counts: ApplicationCounts;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Filter & Search state
  activeFilter: ApplicationFilterType;
  searchQuery: string;
  sortBy: SortOption;
  
  // Actions
  setActiveFilter: (filter: ApplicationFilterType) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortOption) => void;
  refresh: () => Promise<void>;
  retry: () => void;
  withdraw: (applicationId: string, appMongoId: string) => Promise<void>;
  withdrawingId: string | null;
  clearSearch: () => void;
}

const EMPTY_COUNTS: ApplicationCounts = {
  all: 0,
  pending: 0,
  shortlisted: 0,
  accepted: 0,
  rejected: 0,
  demoScheduled: 0,
  demoCompleted: 0,
  withdrawn: 0,
};

function buildCounts(apps: TeacherApplication[]): ApplicationCounts {
  const counts = { ...EMPTY_COUNTS, all: apps.length };
  for (const app of apps) {
    // Standard status counts (only for valid status keys)
    const validStatuses: Array<keyof Omit<ApplicationCounts, 'all' | 'demoScheduled' | 'demoCompleted'>> = 
      ['pending', 'shortlisted', 'rejected', 'accepted', 'withdrawn'];
    
    if (validStatuses.includes(app.status as any)) {
      counts[app.status as keyof Omit<ApplicationCounts, 'all' | 'demoScheduled' | 'demoCompleted'>] += 1;
    }
    
    // Demo status counts
    if (app.demoScheduled) {
      // Check if demo is completed (would need demo status from populated data)
      // For now, we count demoScheduled separately
      counts.demoScheduled += 1;
    }
  }
  return counts;
}

/**
 * Filter applications based on active filter
 */
function filterApplications(
  apps: TeacherApplication[],
  filter: ApplicationFilterType
): TeacherApplication[] {
  if (filter === 'all') return apps;
  
  return apps.filter(app => {
    switch (filter) {
      case 'pending':
        return app.status === 'pending' && !app.demoScheduled;
      case 'shortlisted':
        return app.status === 'shortlisted' && !app.demoScheduled;
      case 'rejected':
        return app.status === 'rejected';
      case 'accepted':
        return app.status === 'accepted';
      case 'withdrawn':
        return app.status === 'withdrawn';
      case 'demo_scheduled':
        return app.demoScheduled && app.status !== 'accepted' && app.status !== 'rejected';
      case 'demo_completed':
        // This would need demo status from populated data
        // For now, return empty array until we have demo completion data
        return false;
      default:
        return true;
    }
  });
}

/**
 * Search applications by query
 */
function searchApplications(
  apps: TeacherApplication[],
  query: string
): TeacherApplication[] {
  if (!query.trim()) return apps;
  
  const lowerQuery = query.toLowerCase().trim();
  
  return apps.filter(app => {
    const req = app.parentRequirement;
    const parent = app.parent;
    
    // Search by requirement ID
    if (req?.requirementId?.toLowerCase().includes(lowerQuery)) return true;
    
    // Search by subject
    if (req?.subjects?.some(s => s.toLowerCase().includes(lowerQuery))) return true;
    
    // Search by class/grade
    if (req?.studentDetails?.grade?.toLowerCase().includes(lowerQuery)) return true;
    
    // Search by city
    if (req?.location?.city?.toLowerCase().includes(lowerQuery)) return true;
    
    // Search by parent name
    if (parent?.profile?.parentName?.toLowerCase().includes(lowerQuery)) return true;
    
    // Search by application ID
    if (app.applicationId?.toLowerCase().includes(lowerQuery)) return true;
    
    // Search by student name
    if (req?.studentDetails?.studentName?.toLowerCase().includes(lowerQuery)) return true;
    
    return false;
  });
}

/**
 * Sort applications
 */
function sortApplications(
  apps: TeacherApplication[],
  sortBy: SortOption
): TeacherApplication[] {
  const sorted = [...apps];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'oldest':
      return sorted.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    case 'highest_budget':
      return sorted.sort((a, b) => {
        const aMax = a.parentRequirement?.budget?.maxAmount || 0;
        const bMax = b.parentRequirement?.budget?.maxAmount || 0;
        return bMax - aMax;
      });
    case 'lowest_budget':
      return sorted.sort((a, b) => {
        const aMin = a.parentRequirement?.budget?.minAmount || 0;
        const bMin = b.parentRequirement?.budget?.minAmount || 0;
        return aMin - bMin;
      });
    case 'highest_match':
      // Match score would need to be populated from TutorMatch data
      // For now, sort by other criteria
      return sorted.sort((a, b) => {
        // Prioritize shortlisted and pending over rejected/withdrawn
        const statusPriority: Record<string, number> = {
          accepted: 5,
          shortlisted: 4,
          pending: 3,
          rejected: 2,
          withdrawn: 1,
        };
        return (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
      });
    default:
      return sorted;
  }
}

/**
 * useTeacherApplications
 *
 * Enhanced hook for teacher application tracking with:
 *  - Search by requirement ID, subject, class, city, parent name
 *  - Sort by newest, oldest, highest/lowest budget, highest match
 *  - Filter by all statuses including demo scheduled/completed
 *  - Real-time filtering and sorting (client-side)
 */
export function useTeacherApplications(token: string | null): UseTeacherApplicationsResult {
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [counts, setCounts] = useState<ApplicationCounts>(EMPTY_COUNTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  
  // Filter & Search state
  const [activeFilter, setActiveFilter] = useState<ApplicationFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ── Core fetch ──
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
        const result = await getTeacherApplications(token);
        if (!isMounted.current) return;
        setApplications(result.applications);
        setCounts(buildCounts(result.applications));
        setError(null);
      } catch (err: any) {
        if (!isMounted.current) return;
        const message =
          err?.message === 'Unauthorized'
            ? 'Session expired. Please login again.'
            : err?.message || 'Failed to load applications. Please try again.';
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

  // Compute filtered and sorted applications
  const filteredApplications = useMemo(() => {
    let result = applications;
    
    // Apply status filter
    result = filterApplications(result, activeFilter);
    
    // Apply search
    result = searchApplications(result, searchQuery);
    
    // Apply sort
    result = sortApplications(result, sortBy);
    
    return result;
  }, [applications, activeFilter, searchQuery, sortBy]);

  // Pull-to-refresh
  const refresh = useCallback(async () => {
    await fetchData('refresh');
  }, [fetchData]);

  // Retry from error state
  const retry = useCallback(() => {
    fetchData('initial');
  }, [fetchData]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Withdraw + optimistic update
  const withdraw = useCallback(
    async (applicationId: string, appMongoId: string) => {
      if (!token) return;
      setWithdrawingId(appMongoId);
      try {
        await withdrawApplication(token, applicationId);
        // Optimistic: flip status immediately so UI updates without a full refetch
        if (isMounted.current) {
          setApplications(prev => {
            const updated = prev.map(a =>
              a.applicationId === applicationId
                ? { ...a, status: 'withdrawn' as const, isActive: false }
                : a,
            );
            setCounts(buildCounts(updated));
            return updated;
          });
        }
        // Full refresh to sync with server
        await fetchData('refresh');
      } finally {
        if (isMounted.current) setWithdrawingId(null);
      }
    },
    [token, fetchData],
  );

  return {
    // Data
    applications,
    filteredApplications,
    counts,
    
    // Loading states
    isLoading,
    isRefreshing,
    error,
    
    // Filter & Search state
    activeFilter,
    searchQuery,
    sortBy,
    
    // Actions
    setActiveFilter,
    setSearchQuery,
    setSortBy,
    refresh,
    retry,
    withdraw,
    withdrawingId,
    clearSearch,
  };
}
