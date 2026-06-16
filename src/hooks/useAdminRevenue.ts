import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch } from '../redux/store';
import { useSelector } from 'react-redux';
import { selectAuthToken } from '../redux/slices/authSlice';
import { logout } from '../redux/slices/authSlice';
import {
  RevenueFilters,
  RevenueOverviewData,
  SubscriptionMetricsData,
  CreditMetricsData,
  PaymentMetricsData,
  InvoiceMetricsData,
  RevenueChartsData,
  getRevenueOverview,
  getSubscriptionMetrics,
  getCreditMetrics,
  getPaymentMetrics,
  getInvoiceMetrics,
  getRevenueCharts,
} from '../services/adminRevenueApi';

export interface AdminRevenueResult {
  overview:       RevenueOverviewData | null;
  subscriptions:  SubscriptionMetricsData | null;
  credits:        CreditMetricsData | null;
  payments:       PaymentMetricsData | null;
  invoices:       InvoiceMetricsData | null;
  charts:         RevenueChartsData | null;

  filters:        RevenueFilters;
  isLoading:      boolean;
  isRefreshing:   boolean;
  error:          string | null;

  setFilters:     (f: RevenueFilters) => void;
  refresh:        () => Promise<void>;
  retry:          () => void;
}

const DEFAULT_FILTERS: RevenueFilters = { range: '30d' };

export function useAdminRevenue(): AdminRevenueResult {
  const dispatch   = useAppDispatch();
  const token      = useSelector(selectAuthToken) ?? '';

  const [filters,       setFiltersState] = useState<RevenueFilters>(DEFAULT_FILTERS);
  const [overview,      setOverview]     = useState<RevenueOverviewData | null>(null);
  const [subscriptions, setSubscriptions]= useState<SubscriptionMetricsData | null>(null);
  const [credits,       setCredits]      = useState<CreditMetricsData | null>(null);
  const [payments,      setPayments]     = useState<PaymentMetricsData | null>(null);
  const [invoices,      setInvoices]     = useState<InvoiceMetricsData | null>(null);
  const [charts,        setCharts]       = useState<RevenueChartsData | null>(null);

  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setIsRefreshing(true);
    else           setIsLoading(true);
    setError(null);

    try {
      const [ovRes, subRes, credRes, payRes, invRes, chartRes] = await Promise.allSettled([
        getRevenueOverview(token, filters),
        getSubscriptionMetrics(token, filters),
        getCreditMetrics(token, filters),
        getPaymentMetrics(token, filters),
        getInvoiceMetrics(token, filters),
        getRevenueCharts(token, filters),
      ]);

      if (ovRes.status    === 'fulfilled' && ovRes.value.success)    setOverview(ovRes.value.data);
      if (subRes.status   === 'fulfilled' && subRes.value.success)   setSubscriptions(subRes.value.data);
      if (credRes.status  === 'fulfilled' && credRes.value.success)  setCredits(credRes.value.data);
      if (payRes.status   === 'fulfilled' && payRes.value.success)   setPayments(payRes.value.data);
      if (invRes.status   === 'fulfilled' && invRes.value.success)   setInvoices(invRes.value.data);
      if (chartRes.status === 'fulfilled' && chartRes.value.success) setCharts(chartRes.value.data);

      const firstRejection = [ovRes, subRes, credRes, payRes, invRes, chartRes].find(r => r.status === 'rejected');
      if (firstRejection && firstRejection.status === 'rejected') {
        const msg: string = (firstRejection.reason as Error)?.message ?? 'Unknown error';
        if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
          dispatch(logout());
          return;
        }
        setError(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        dispatch(logout());
        return;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, filters, dispatch]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refresh = useCallback(() => fetchAll(true), [fetchAll]);
  const retry   = useCallback(() => fetchAll(),     [fetchAll]);

  const setFilters = useCallback((f: RevenueFilters) => {
    setFiltersState(f);
  }, []);

  return {
    overview,
    subscriptions,
    credits,
    payments,
    invoices,
    charts,
    filters,
    isLoading,
    isRefreshing,
    error,
    setFilters,
    refresh,
    retry,
  };
}
