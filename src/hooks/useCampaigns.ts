import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { logout, selectAuthToken } from '../redux/slices/authSlice';
import {
  listCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  cancelCampaign,
  duplicateCampaign,
  getCampaignStats,
  getCampaignsSummary,
  Campaign,
  CampaignsSummary,
  CampaignStatsResult,
  CreateCampaignInput,
  CampaignStatus,
} from '../services/adminCampaignApi';

const PAGE_SIZE = 20;

interface UseCampaignsState {
  campaigns:       Campaign[];
  summary:         CampaignsSummary | null;
  isLoading:       boolean;
  isRefreshing:    boolean;
  isLoadingMore:   boolean;
  isSaving:        boolean;
  hasMore:         boolean;
  error:           string | null;
  actionError:     string | null;
  statusFilter:    string;
  typeFilter:      string;
  // Actions
  refresh:           () => void;
  retry:             () => void;
  loadMore:          () => void;
  setStatusFilter:   (s: string) => void;
  setTypeFilter:     (t: string) => void;
  createCampaign:    (input: CreateCampaignInput) => Promise<Campaign | null>;
  updateCampaign:    (id: string, input: Partial<CreateCampaignInput>) => Promise<Campaign | null>;
  deleteCampaign:    (id: string) => Promise<boolean>;
  sendCampaign:      (id: string) => Promise<Campaign | null>;
  cancelCampaign:    (id: string, reason?: string) => Promise<Campaign | null>;
  duplicateCampaign: (id: string) => Promise<Campaign | null>;
  getStats:          (id: string) => Promise<CampaignStatsResult | null>;
  clearActionError:  () => void;
}

export function useCampaigns(): UseCampaignsState {
  const dispatch = useAppDispatch();
  const token    = useAppSelector(selectAuthToken) ?? '';

  const [campaigns,    setCampaigns]    = useState<Campaign[]>([]);
  const [summary,      setSummary]      = useState<CampaignsSummary | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore,setIsLoadingMore]= useState(false);
  const [isSaving,     setIsSaving]     = useState(false);
  const [hasMore,      setHasMore]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [actionError,  setActionError]  = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');

  const pageRef = useRef(1);

  // ── Handle 401 ──────────────────────────────────────────────────────────────
  const handle401 = useCallback((err: any) => {
    if (err?.message?.toLowerCase().includes('session') || err?.message?.includes('401')) {
      dispatch(logout());
    }
  }, [dispatch]);

  // ── Core fetch ──────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (page: number, replace: boolean) => {
    try {
      const [listRes, summaryRes] = await Promise.all([
        listCampaigns(token, { page, limit: PAGE_SIZE, status: statusFilter || undefined, type: typeFilter || undefined }),
        page === 1 ? getCampaignsSummary(token) : Promise.resolve(null),
      ]);

      const incoming = listRes.data.campaigns;
      setCampaigns((prev) => replace ? incoming : [...prev, ...incoming]);
      setHasMore(page < listRes.data.pagination.pages);
      pageRef.current = page;

      if (summaryRes) setSummary(summaryRes.data);
      setError(null);
    } catch (err: any) {
      handle401(err);
      setError(err?.message || 'Failed to load campaigns.');
    }
  }, [token, statusFilter, typeFilter, handle401]);

  // ── Initial load + filter change ────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    fetchPage(1, true).finally(() => setIsLoading(false));
  }, [fetchPage]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPage(1, true).finally(() => setIsRefreshing(false));
  }, [fetchPage]);

  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchPage(1, true).finally(() => setIsLoading(false));
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    fetchPage(pageRef.current + 1, false).finally(() => setIsLoadingMore(false));
  }, [isLoadingMore, hasMore, fetchPage]);

  // ── Mutating actions ─────────────────────────────────────────────────────────
  const doCreate = useCallback(async (input: CreateCampaignInput): Promise<Campaign | null> => {
    setIsSaving(true);
    setActionError(null);
    try {
      const res = await createCampaign(token, input);
      setCampaigns((prev) => [res.data, ...prev]);
      refresh();
      if (__DEV__) console.log('[Campaign] Created:', res.data.campaignId);
      return res.data;
    } catch (err: any) {
      handle401(err);
      setActionError(err?.message || 'Failed to create campaign.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [token, handle401, refresh]);

  const doUpdate = useCallback(async (id: string, input: Partial<CreateCampaignInput>): Promise<Campaign | null> => {
    setIsSaving(true);
    setActionError(null);
    try {
      const res = await updateCampaign(token, id, input);
      setCampaigns((prev) => prev.map((c) => c._id === id ? res.data : c));
      return res.data;
    } catch (err: any) {
      handle401(err);
      setActionError(err?.message || 'Failed to update campaign.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [token, handle401]);

  const doDelete = useCallback(async (id: string): Promise<boolean> => {
    setActionError(null);
    try {
      await deleteCampaign(token, id);
      setCampaigns((prev) => prev.filter((c) => c._id !== id));
      if (summary) setSummary({ ...summary, total: summary.total - 1 });
      return true;
    } catch (err: any) {
      handle401(err);
      setActionError(err?.message || 'Failed to delete campaign.');
      return false;
    }
  }, [token, handle401, summary]);

  const doSend = useCallback(async (id: string): Promise<Campaign | null> => {
    setActionError(null);
    try {
      const res = await sendCampaign(token, id);
      setCampaigns((prev) => prev.map((c) => c._id === id ? res.data : c));
      refresh();
      if (__DEV__) console.log('[Campaign] Sent:', res.data.campaignId);
      return res.data;
    } catch (err: any) {
      handle401(err);
      setActionError(err?.message || 'Failed to send campaign.');
      return null;
    }
  }, [token, handle401, refresh]);

  const doCancel = useCallback(async (id: string, reason?: string): Promise<Campaign | null> => {
    setActionError(null);
    try {
      const res = await cancelCampaign(token, id, reason);
      setCampaigns((prev) => prev.map((c) => c._id === id ? res.data : c));
      return res.data;
    } catch (err: any) {
      handle401(err);
      setActionError(err?.message || 'Failed to cancel campaign.');
      return null;
    }
  }, [token, handle401]);

  const doDuplicate = useCallback(async (id: string): Promise<Campaign | null> => {
    setActionError(null);
    try {
      const res = await duplicateCampaign(token, id);
      setCampaigns((prev) => [res.data, ...prev]);
      refresh();
      return res.data;
    } catch (err: any) {
      handle401(err);
      setActionError(err?.message || 'Failed to duplicate campaign.');
      return null;
    }
  }, [token, handle401, refresh]);

  const doGetStats = useCallback(async (id: string): Promise<CampaignStatsResult | null> => {
    try {
      const res = await getCampaignStats(token, id);
      return res.data;
    } catch (err: any) {
      handle401(err);
      setActionError(err?.message || 'Failed to fetch stats.');
      return null;
    }
  }, [token, handle401]);

  return {
    campaigns,
    summary,
    isLoading,
    isRefreshing,
    isLoadingMore,
    isSaving,
    hasMore,
    error,
    actionError,
    statusFilter,
    typeFilter,
    refresh,
    retry,
    loadMore,
    setStatusFilter,
    setTypeFilter,
    createCampaign:    doCreate,
    updateCampaign:    doUpdate,
    deleteCampaign:    doDelete,
    sendCampaign:      doSend,
    cancelCampaign:    doCancel,
    duplicateCampaign: doDuplicate,
    getStats:          doGetStats,
    clearActionError:  () => setActionError(null),
  };
}
