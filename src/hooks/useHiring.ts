import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch } from '../redux/hooks';
import { logout } from '../redux/slices/authSlice';
import {
  getRequirementApplications,
  viewApplication,
  shortlistApplication,
  rejectApplication,
  selectTeacher,
  hireTeacher,
  closeRequirement,
  getApplicationById,
  Application,
  RequirementSummary,
  StatusBreakdown,
} from '../services/hiringApi';

interface UseHiringProps {
  token: string | null;
}

interface UseHiringReturn {
  // Data
  applications: Application[];
  selectedApplication: Application | null;
  requirements: RequirementSummary[];
  selectedRequirement: RequirementSummary | null;
  statusBreakdown: StatusBreakdown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isProcessing: boolean;

  // Error states
  error: string | null;
  actionError: string | null;

  // Actions
  selectRequirement: (req: RequirementSummary) => void;
  refresh: () => void;
  loadMore: () => void;
  fetchApplication: (applicationId: string) => Promise<void>;
  
  // Application actions
  view: (applicationId: string) => Promise<void>;
  shortlist: (applicationId: string) => Promise<void>;
  reject: (applicationId: string, reason?: string) => Promise<void>;
  select: (applicationId: string, reason?: string) => Promise<void>;
  hire: (applicationId: string, notes?: string, startDate?: string) => Promise<void>;
  close: (requirementId: string, reason?: string) => Promise<void>;

  // Utils
  clearActionError: () => void;
  getStatusCount: (status: string) => number;
}

export function useHiring({ token }: UseHiringProps): UseHiringReturn {
  const dispatch = useAppDispatch();

  // Data states
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [requirements, setRequirements] = useState<RequirementSummary[]>([]);
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementSummary | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Helper to handle auth errors
  const handleAuthError = useCallback((err: any) => {
    if (err.message === 'SESSION_EXPIRED') {
      dispatch(logout());
    }
  }, [dispatch]);

  // Fetch applications for selected requirement
  const fetchApplications = useCallback(async (page = 1, isRefresh = false) => {
    if (!token || !selectedRequirement) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else if (page === 1) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await getRequirementApplications(
        selectedRequirement._id,
        token,
        { page, limit: pagination.limit }
      );

      if (response.success) {
        if (page === 1 || isRefresh) {
          setApplications(response.data.applications);
        } else {
          setApplications(prev => [...prev, ...response.data.applications]);
        }
        setStatusBreakdown(response.data.statusBreakdown);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      handleAuthError(err);
      setError(err.message || 'Failed to fetch applications');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, selectedRequirement, pagination.limit, handleAuthError]);

  // Fetch single application
  const fetchApplication = useCallback(async (applicationId: string) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getApplicationById(applicationId, token);
      if (response.success) {
        setSelectedApplication(response.data.application);
      }
    } catch (err: any) {
      handleAuthError(err);
      setError(err.message || 'Failed to fetch application');
    } finally {
      setIsLoading(false);
    }
  }, [token, handleAuthError]);

  // Select requirement
  const selectRequirement = useCallback((req: RequirementSummary) => {
    setSelectedRequirement(req);
    setApplications([]);
    setPagination({ page: 1, limit: 20, total: 0, hasMore: false });
  }, []);

  // Refresh
  const refresh = useCallback(() => {
    fetchApplications(1, true);
  }, [fetchApplications]);

  // Load more
  const loadMore = useCallback(() => {
    if (pagination.hasMore && !isLoading) {
      fetchApplications(pagination.page + 1);
    }
  }, [fetchApplications, pagination.hasMore, pagination.page, isLoading]);

  // Application actions
  const view = useCallback(async (applicationId: string) => {
    if (!token) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const response = await viewApplication(applicationId, token);
      if (response.success) {
        setApplications(prev =>
          prev.map(app =>
            app._id === applicationId ? { ...app, status: 'viewed', viewedByParent: true } : app
          )
        );
      }
    } catch (err: any) {
      handleAuthError(err);
      setActionError(err.message || 'Failed to view application');
    } finally {
      setIsProcessing(false);
    }
  }, [token, handleAuthError]);

  const shortlist = useCallback(async (applicationId: string) => {
    if (!token) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const response = await shortlistApplication(applicationId, token);
      if (response.success) {
        setApplications(prev =>
          prev.map(app =>
            app._id === applicationId ? { ...app, status: 'shortlisted' } : app
          )
        );
        if (selectedRequirement) {
          setSelectedRequirement({
            ...selectedRequirement,
            shortlistedCount: selectedRequirement.shortlistedCount + 1,
          });
        }
      }
    } catch (err: any) {
      handleAuthError(err);
      setActionError(err.message || 'Failed to shortlist');
    } finally {
      setIsProcessing(false);
    }
  }, [token, selectedRequirement, handleAuthError]);

  const reject = useCallback(async (applicationId: string, reason?: string) => {
    if (!token) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const response = await rejectApplication(applicationId, token, reason);
      if (response.success) {
        setApplications(prev =>
          prev.map(app =>
            app._id === applicationId
              ? { ...app, status: 'rejected', rejectionReason: reason }
              : app
          )
        );
      }
    } catch (err: any) {
      handleAuthError(err);
      setActionError(err.message || 'Failed to reject');
    } finally {
      setIsProcessing(false);
    }
  }, [token, handleAuthError]);

  const select = useCallback(async (applicationId: string, reason?: string) => {
    if (!token) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const response = await selectTeacher(applicationId, token, reason);
      if (response.success) {
        // Update selected application
        setApplications(prev =>
          prev.map(app =>
            app._id === applicationId
              ? { ...app, status: 'selected', selectionReason: reason }
              : app.status === 'pending' || app.status === 'viewed' || app.status === 'shortlisted'
              ? { ...app, status: 'rejected', rejectionReason: 'Another teacher was selected' }
              : app
          )
        );
      }
    } catch (err: any) {
      handleAuthError(err);
      setActionError(err.message || 'Failed to select teacher');
    } finally {
      setIsProcessing(false);
    }
  }, [token, handleAuthError]);

  const hire = useCallback(async (applicationId: string, notes?: string, startDate?: string) => {
    if (!token) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const response = await hireTeacher(applicationId, token, notes, startDate);
      if (response.success) {
        setApplications(prev =>
          prev.map(app =>
            app._id === applicationId
              ? { ...app, status: 'hired', hireNotes: notes }
              : app
          )
        );
        if (selectedRequirement) {
          setSelectedRequirement({
            ...selectedRequirement,
            status: 'hired',
            hiredTeacherId: response.data.application.teacherId,
          });
        }
      }
    } catch (err: any) {
      handleAuthError(err);
      setActionError(err.message || 'Failed to hire teacher');
    } finally {
      setIsProcessing(false);
    }
  }, [token, selectedRequirement, handleAuthError]);

  const close = useCallback(async (requirementId: string, reason?: string) => {
    if (!token) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const response = await closeRequirement(requirementId, token, reason);
      if (response.success) {
        if (selectedRequirement && selectedRequirement._id === requirementId) {
          setSelectedRequirement({
            ...selectedRequirement,
            status: 'closed',
          });
        }
        // Reject all pending applications
        setApplications(prev =>
          prev.map(app =>
            ['pending', 'viewed', 'shortlisted'].includes(app.status)
              ? { ...app, status: 'rejected', rejectionReason: 'Requirement closed' }
              : app
          )
        );
      }
    } catch (err: any) {
      handleAuthError(err);
      setActionError(err.message || 'Failed to close requirement');
    } finally {
      setIsProcessing(false);
    }
  }, [token, selectedRequirement, handleAuthError]);

  // Get status count from breakdown
  const getStatusCount = useCallback((status: string) => {
    const item = statusBreakdown.find(sb => sb.status === status);
    return item?.count || 0;
  }, [statusBreakdown]);

  // Clear action error
  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  // Auto-fetch when requirement changes
  useEffect(() => {
    if (selectedRequirement) {
      fetchApplications(1);
    }
  }, [selectedRequirement?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    applications,
    selectedApplication,
    requirements,
    selectedRequirement,
    statusBreakdown,
    pagination,
    isLoading,
    isRefreshing,
    isProcessing,
    error,
    actionError,
    selectRequirement,
    refresh,
    loadMore,
    fetchApplication,
    view,
    shortlist,
    reject,
    select,
    hire,
    close,
    clearActionError,
    getStatusCount,
  };
}
