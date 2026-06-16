import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthToken } from '../redux/slices/authSlice';
import {
  AppNotification,
  NotificationListResult,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as apiDeleteNotification,
} from '../services/notificationApi';

// ─────────────────────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────────────────────
interface UseNotificationsOptions {
  category?: string;
  limit?: number;
  pollIntervalMs?: number; // default 30 s
}

// ─────────────────────────────────────────────────────────────────────────────
// Return type
// ─────────────────────────────────────────────────────────────────────────────
export interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;

  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;

  hasMore: boolean;

  error: string | null;

  refresh: () => Promise<void>;
  retry: () => void;
  loadMore: () => Promise<void>;

  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;

  deleteNotification: (id: string) => Promise<void>;

  setCategory: (cat: string) => void;
  category: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useNotifications(opts?: UseNotificationsOptions): UseNotificationsResult {
  const token       = useSelector(selectAuthToken) ?? '';
  const PAGE_LIMIT  = opts?.limit ?? 20;
  const POLL_MS     = opts?.pollIntervalMs ?? 30000;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore,       setHasMore]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [category,      setCategory]      = useState(opts?.category ?? '');
  const [page,          setPage]          = useState(1);

  const loadingMoreRef = useRef(false);

  // ── Core fetch ─────────────────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (pg: number, cat: string, replace: boolean): Promise<void> => {
      const result: NotificationListResult = await getNotifications(token, {
        page: pg,
        limit: PAGE_LIMIT,
        category: cat || undefined,
      });
      setUnreadCount(result.unreadCount);
      setHasMore(pg < result.pagination.pages);
      setNotifications((prev) =>
        replace ? result.notifications : [...prev, ...result.notifications],
      );
    },
    [token, PAGE_LIMIT],
  );

  // ── Initial load / category change ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setPage(1);

    fetchPage(1, category, true)
      .catch((e: any) => {
        if (!cancelled) setError(e?.message ?? 'Failed to load notifications');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [category, fetchPage]);

  // ── 30-second unread count polling ────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const id = setInterval(async () => {
      try {
        const n = await getUnreadCount(token);
        setUnreadCount(n);
      } catch {}
    }, POLL_MS);
    return () => clearInterval(id);
  }, [token, POLL_MS]);

  // ── Refresh ───────────────────────────────────────────────────────────────
  const refresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    setError(null);
    try {
      await fetchPage(1, category, true);
      setPage(1);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPage, category]);

  // ── Retry (re-trigger initial load) ──────────────────────────────────────
  const retry = useCallback((): void => {
    setIsLoading(true);
    setError(null);
    fetchPage(1, category, true)
      .catch((e: any) => setError(e?.message ?? 'Failed to load notifications'))
      .finally(() => setIsLoading(false));
    setPage(1);
  }, [fetchPage, category]);

  // ── Load more (pagination) ────────────────────────────────────────────────
  const loadMore = useCallback(async (): Promise<void> => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const next = page + 1;
      await fetchPage(next, category, false);
      setPage(next);
    } catch {}
    finally {
      setIsLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [fetchPage, hasMore, page, category]);

  // ── Mark single read (optimistic) ────────────────────────────────────────
  const markRead = useCallback(async (id: string): Promise<void> => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(token, id);
    } catch {
      // Revert optimistic update on failure
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: false } : n)),
      );
      setUnreadCount((c) => c + 1);
    }
  }, [token]);

  // ── Mark all read (optimistic) ────────────────────────────────────────────
  const markAllRead = useCallback(async (): Promise<void> => {
    const prev = notifications;
    setNotifications((ns) => ns.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead(token);
    } catch {
      // Revert
      setNotifications(prev);
      setUnreadCount(prev.filter((n) => !n.isRead).length);
    }
  }, [token, notifications]);

  // ── Delete (optimistic) ───────────────────────────────────────────────────
  const deleteNotification = useCallback(async (id: string): Promise<void> => {
    const target = notifications.find((n) => n._id === id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await apiDeleteNotification(token, id);
    } catch {
      // Revert
      if (target) {
        setNotifications((prev) => {
          const idx = prev.findIndex((n) => n.createdAt < target.createdAt);
          const copy = [...prev];
          copy.splice(idx === -1 ? copy.length : idx, 0, target);
          return copy;
        });
        if (!target.isRead) setUnreadCount((c) => c + 1);
      }
    }
  }, [token, notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    refresh,
    retry,
    loadMore,
    markRead,
    markAllRead,
    deleteNotification,
    setCategory,
    category,
  };
}
