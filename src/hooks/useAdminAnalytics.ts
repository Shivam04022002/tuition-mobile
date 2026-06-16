import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { selectAuthToken } from '../redux/slices/authSlice';
import { logout } from '../redux/slices/authSlice';
import * as adminAnalyticsApi from '../services/adminAnalyticsApi';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface UseAdminAnalyticsReturn {
  // Overview
  overview: adminAnalyticsApi.OverviewAnalytics | null;
  overviewLoading: boolean;
  overviewError: string | null;
  refreshOverview: () => Promise<void>;

  // Revenue
  revenue: adminAnalyticsApi.RevenueAnalytics | null;
  revenueLoading: boolean;
  revenueError: string | null;
  refreshRevenue: () => Promise<void>;

  // Financial (for wallet dashboard)
  financial: adminAnalyticsApi.FinancialAnalytics | null;
  financialLoading: boolean;
  financialError: string | null;
  refreshFinancial: () => Promise<void>;

  // Geography
  geography: adminAnalyticsApi.GeographyAnalytics | null;
  geographyLoading: boolean;
  geographyError: string | null;
  refreshGeography: () => Promise<void>;

  // Subjects
  subjects: adminAnalyticsApi.SubjectAnalytics | null;
  subjectsLoading: boolean;
  subjectsError: string | null;
  refreshSubjects: () => Promise<void>;

  // Supply/Demand
  supplyDemand: adminAnalyticsApi.SupplyDemandAnalytics | null;
  supplyDemandLoading: boolean;
  supplyDemandError: string | null;
  refreshSupplyDemand: (days?: number) => Promise<void>;

  // Demand (detailed)
  demand: adminAnalyticsApi.DemandAnalytics | null;
  demandLoading: boolean;
  demandError: string | null;
  refreshDemand: () => Promise<void>;

  // Supply (detailed)
  supply: adminAnalyticsApi.SupplyAnalytics | null;
  supplyLoading: boolean;
  supplyError: string | null;
  refreshSupply: () => Promise<void>;

  // Refresh all
  refreshAll: () => Promise<void>;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export const useAdminAnalytics = (): UseAdminAnalyticsReturn => {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  // Overview state
  const [overview, setOverview] = useState<adminAnalyticsApi.OverviewAnalytics | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Revenue state
  const [revenue, setRevenue] = useState<adminAnalyticsApi.RevenueAnalytics | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  // Financial state
  const [financial, setFinancial] = useState<adminAnalyticsApi.FinancialAnalytics | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState<string | null>(null);

  // Geography state
  const [geography, setGeography] = useState<adminAnalyticsApi.GeographyAnalytics | null>(null);
  const [geographyLoading, setGeographyLoading] = useState(false);
  const [geographyError, setGeographyError] = useState<string | null>(null);

  // Subjects state
  const [subjects, setSubjects] = useState<adminAnalyticsApi.SubjectAnalytics | null>(null);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  // Supply/Demand state
  const [supplyDemand, setSupplyDemand] = useState<adminAnalyticsApi.SupplyDemandAnalytics | null>(null);
  const [supplyDemandLoading, setSupplyDemandLoading] = useState(false);
  const [supplyDemandError, setSupplyDemandError] = useState<string | null>(null);

  // Demand state
  const [demand, setDemand] = useState<adminAnalyticsApi.DemandAnalytics | null>(null);
  const [demandLoading, setDemandLoading] = useState(false);
  const [demandError, setDemandError] = useState<string | null>(null);

  // Supply state
  const [supply, setSupply] = useState<adminAnalyticsApi.SupplyAnalytics | null>(null);
  const [supplyLoading, setSupplyLoading] = useState(false);
  const [supplyError, setSupplyError] = useState<string | null>(null);

  // Global states
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle auth errors
  const handleError = useCallback((err: any) => {
    if (err?.message?.includes('401') || err?.message?.includes('unauthorized')) {
      dispatch(logout());
    }
  }, [dispatch]);

  // Fetch overview
  const fetchOverview = useCallback(async (isRefresh = false) => {
    if (!token) {
      setOverviewError('Authentication required');
      return;
    }
    if (!isRefresh) setOverviewLoading(true);
    setOverviewError(null);
    try {
      const response = await adminAnalyticsApi.getOverview(token);
      if (response.success) {
        setOverview(response.data);
      } else {
        setOverviewError(response.message || 'Failed to load overview');
      }
    } catch (err: any) {
      setOverviewError(err.message || 'Network error');
      handleError(err);
    } finally {
      setOverviewLoading(false);
    }
  }, [token, handleError]);

  // Fetch revenue
  const fetchRevenue = useCallback(async (isRefresh = false) => {
    if (!token) {
      setRevenueError('Authentication required');
      return;
    }
    if (!isRefresh) setRevenueLoading(true);
    setRevenueError(null);
    try {
      const response = await adminAnalyticsApi.getRevenue(token);
      if (response.success) {
        setRevenue(response.data);
      } else {
        setRevenueError(response.message || 'Failed to load revenue');
      }
    } catch (err: any) {
      setRevenueError(err.message || 'Network error');
      handleError(err);
    } finally {
      setRevenueLoading(false);
    }
  }, [token, handleError]);

  // Fetch financial
  const fetchFinancial = useCallback(async (isRefresh = false) => {
    if (!token) {
      setFinancialError('Authentication required');
      return;
    }
    if (!isRefresh) setFinancialLoading(true);
    setFinancialError(null);
    try {
      const response = await adminAnalyticsApi.getFinancial(token);
      if (response.success) {
        setFinancial(response.data);
      } else {
        setFinancialError(response.message || 'Failed to load financial data');
      }
    } catch (err: any) {
      setFinancialError(err.message || 'Network error');
      handleError(err);
    } finally {
      setFinancialLoading(false);
    }
  }, [token, handleError]);

  // Fetch geography
  const fetchGeography = useCallback(async (isRefresh = false) => {
    if (!token) {
      setGeographyError('Authentication required');
      return;
    }
    if (!isRefresh) setGeographyLoading(true);
    setGeographyError(null);
    try {
      const response = await adminAnalyticsApi.getGeography(token);
      if (response.success) {
        setGeography(response.data);
      } else {
        setGeographyError(response.message || 'Failed to load geography data');
      }
    } catch (err: any) {
      setGeographyError(err.message || 'Network error');
      handleError(err);
    } finally {
      setGeographyLoading(false);
    }
  }, [token, handleError]);

  // Fetch subjects
  const fetchSubjects = useCallback(async (isRefresh = false) => {
    if (!token) {
      setSubjectsError('Authentication required');
      return;
    }
    if (!isRefresh) setSubjectsLoading(true);
    setSubjectsError(null);
    try {
      const response = await adminAnalyticsApi.getSubjectAnalytics(token);
      if (response.success) {
        setSubjects(response.data);
      } else {
        setSubjectsError(response.message || 'Failed to load subject data');
      }
    } catch (err: any) {
      setSubjectsError(err.message || 'Network error');
      handleError(err);
    } finally {
      setSubjectsLoading(false);
    }
  }, [token, handleError]);

  // Fetch supply/demand
  const fetchSupplyDemand = useCallback(async (days?: number, isRefresh = false) => {
    if (!token) {
      setSupplyDemandError('Authentication required');
      return;
    }
    if (!isRefresh) setSupplyDemandLoading(true);
    setSupplyDemandError(null);
    try {
      const response = await adminAnalyticsApi.getSupplyDemand(token, days);
      if (response.success) {
        setSupplyDemand(response.data);
      } else {
        setSupplyDemandError(response.message || 'Failed to load supply/demand data');
      }
    } catch (err: any) {
      setSupplyDemandError(err.message || 'Network error');
      handleError(err);
    } finally {
      setSupplyDemandLoading(false);
    }
  }, [token, handleError]);

  // Fetch demand
  const fetchDemand = useCallback(async (isRefresh = false) => {
    if (!token) {
      setDemandError('Authentication required');
      return;
    }
    if (!isRefresh) setDemandLoading(true);
    setDemandError(null);
    try {
      const response = await adminAnalyticsApi.getDemand(token);
      if (response.success) {
        setDemand(response.data);
      } else {
        setDemandError(response.message || 'Failed to load demand data');
      }
    } catch (err: any) {
      setDemandError(err.message || 'Network error');
      handleError(err);
    } finally {
      setDemandLoading(false);
    }
  }, [token, handleError]);

  // Fetch supply
  const fetchSupply = useCallback(async (isRefresh = false) => {
    if (!token) {
      setSupplyError('Authentication required');
      return;
    }
    if (!isRefresh) setSupplyLoading(true);
    setSupplyError(null);
    try {
      const response = await adminAnalyticsApi.getSupply(token);
      if (response.success) {
        setSupply(response.data);
      } else {
        setSupplyError(response.message || 'Failed to load supply data');
      }
    } catch (err: any) {
      setSupplyError(err.message || 'Network error');
      handleError(err);
    } finally {
      setSupplyLoading(false);
    }
  }, [token, handleError]);

  // Refresh functions exposed to consumers
  const refreshOverview = useCallback(() => fetchOverview(true), [fetchOverview]);
  const refreshRevenue = useCallback(() => fetchRevenue(true), [fetchRevenue]);
  const refreshFinancial = useCallback(() => fetchFinancial(true), [fetchFinancial]);
  const refreshGeography = useCallback(() => fetchGeography(true), [fetchGeography]);
  const refreshSubjects = useCallback(() => fetchSubjects(true), [fetchSubjects]);
  const refreshSupplyDemand = useCallback((days?: number) => fetchSupplyDemand(days, true), [fetchSupplyDemand]);
  const refreshDemand = useCallback(() => fetchDemand(true), [fetchDemand]);
  const refreshSupply = useCallback(() => fetchSupply(true), [fetchSupply]);

  // Refresh all analytics
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshOverview(),
      refreshRevenue(),
      refreshFinancial(),
      refreshGeography(),
      refreshSubjects(),
      refreshSupplyDemand(),
      refreshDemand(),
      refreshSupply(),
    ]);
    setIsRefreshing(false);
  }, [refreshOverview, refreshRevenue, refreshFinancial, refreshGeography, refreshSubjects, refreshSupplyDemand, refreshDemand, refreshSupply]);

  // Global loading and error states
  const isLoading =
    overviewLoading ||
    revenueLoading ||
    financialLoading ||
    geographyLoading ||
    subjectsLoading ||
    supplyDemandLoading ||
    demandLoading ||
    supplyLoading;

  const error =
    overviewError ||
    revenueError ||
    financialError ||
    geographyError ||
    subjectsError ||
    supplyDemandError ||
    demandError ||
    supplyError;

  return {
    // Overview
    overview,
    overviewLoading,
    overviewError,
    refreshOverview,

    // Revenue
    revenue,
    revenueLoading,
    revenueError,
    refreshRevenue,

    // Financial
    financial,
    financialLoading,
    financialError,
    refreshFinancial,

    // Geography
    geography,
    geographyLoading,
    geographyError,
    refreshGeography,

    // Subjects
    subjects,
    subjectsLoading,
    subjectsError,
    refreshSubjects,

    // Supply/Demand
    supplyDemand,
    supplyDemandLoading,
    supplyDemandError,
    refreshSupplyDemand,

    // Demand
    demand,
    demandLoading,
    demandError,
    refreshDemand,

    // Supply
    supply,
    supplyLoading,
    supplyError,
    refreshSupply,

    // All
    refreshAll,

    // States
    isLoading,
    isRefreshing,
    error,
  };
};

export default useAdminAnalytics;
