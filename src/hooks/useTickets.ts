import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthToken } from '../redux/slices/authSlice';
import {
  Ticket,
  TicketCounts,
  TicketStats,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketListResult,
  CreateTicketData,
  getTickets,
  getTicketById,
  getTicketStats,
  createTicket,
  replyToTicket,
  assignTicket,
  resolveTicket,
  closeTicket,
  reopenTicket,
} from '../services/ticketApi';

// ─────────────────────────────────────────────────────────────────────────────
// Return Types
// ─────────────────────────────────────────────────────────────────────────────
export interface UseTicketsResult {
  tickets: Ticket[];
  counts: TicketCounts;
  isLoading: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
  create: (data: CreateTicketData) => Promise<Ticket>;
}

export interface UseTicketDetailResult {
  ticket: Ticket | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
  reply: (message: string) => Promise<void>;
  assign: (assigneeId?: string, assigneeName?: string) => Promise<void>;
  resolve: (message?: string) => Promise<void>;
  close: (message?: string) => Promise<void>;
  reopen: (message?: string) => Promise<void>;
}

export interface UseTicketStatsResult {
  stats: TicketStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// useTickets - Hook for ticket list (MyTicketsScreen, StaffTicketsScreen)
// ─────────────────────────────────────────────────────────────────────────────
export function useTickets(opts?: {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  mine?: boolean;
}): UseTicketsResult {
  const token = useSelector(selectAuthToken) ?? '';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState<TicketCounts>({
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    const result: TicketListResult = await getTickets(token, opts);
    setTickets(result.tickets);
    setCounts(result.counts);
  }, [token, opts]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchTickets()
      .catch((e: any) => {
        if (!cancelled) setError(e?.message ?? 'Failed to load tickets');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [fetchTickets]);

  // Refresh
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await fetchTickets();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchTickets]);

  // Retry (full reload)
  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchTickets()
      .catch((e: any) => setError(e?.message ?? 'Failed to load tickets'))
      .finally(() => setIsLoading(false));
  }, [fetchTickets]);

  // Create ticket
  const create = useCallback(async (data: CreateTicketData): Promise<Ticket> => {
    setIsSubmitting(true);
    try {
      const ticket = await createTicket(token, data);
      // Refresh list after creation
      await fetchTickets();
      return ticket;
    } finally {
      setIsSubmitting(false);
    }
  }, [token, fetchTickets]);

  return {
    tickets,
    counts,
    isLoading,
    isRefreshing,
    isSubmitting,
    error,
    refresh,
    retry,
    create,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useTicketDetail - Hook for single ticket view with actions
// ─────────────────────────────────────────────────────────────────────────────
export function useTicketDetail(ticketId: string): UseTicketDetailResult {
  const token = useSelector(selectAuthToken) ?? '';

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(async () => {
    const result = await getTicketById(token, ticketId);
    setTicket(result);
  }, [token, ticketId]);

  // Initial load
  useEffect(() => {
    if (!ticketId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchTicket()
      .catch((e: any) => {
        if (!cancelled) setError(e?.message ?? 'Failed to load ticket');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [ticketId, fetchTicket]);

  // Refresh
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await fetchTicket();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchTicket]);

  // Retry
  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchTicket()
      .catch((e: any) => setError(e?.message ?? 'Failed to load ticket'))
      .finally(() => setIsLoading(false));
  }, [fetchTicket]);

  // Reply to ticket
  const reply = useCallback(async (message: string) => {
    if (!ticketId) return;
    setIsSubmitting(true);
    try {
      const updated = await replyToTicket(token, ticketId, message);
      setTicket(updated);
    } finally {
      setIsSubmitting(false);
    }
  }, [token, ticketId]);

  // Assign ticket
  const assign = useCallback(async (assigneeId?: string, assigneeName?: string) => {
    if (!ticketId) return;
    setIsSubmitting(true);
    try {
      const updated = await assignTicket(token, ticketId, assigneeId, assigneeName);
      setTicket(updated);
    } finally {
      setIsSubmitting(false);
    }
  }, [token, ticketId]);

  // Resolve ticket
  const resolve = useCallback(async (message?: string) => {
    if (!ticketId) return;
    setIsSubmitting(true);
    try {
      const updated = await resolveTicket(token, ticketId, message);
      setTicket(updated);
    } finally {
      setIsSubmitting(false);
    }
  }, [token, ticketId]);

  // Close ticket
  const close = useCallback(async (message?: string) => {
    if (!ticketId) return;
    setIsSubmitting(true);
    try {
      const updated = await closeTicket(token, ticketId, message);
      setTicket(updated);
    } finally {
      setIsSubmitting(false);
    }
  }, [token, ticketId]);

  // Reopen ticket
  const reopen = useCallback(async (message?: string) => {
    if (!ticketId) return;
    setIsSubmitting(true);
    try {
      const updated = await reopenTicket(token, ticketId, message);
      setTicket(updated);
    } finally {
      setIsSubmitting(false);
    }
  }, [token, ticketId]);

  return {
    ticket,
    isLoading,
    isRefreshing,
    isSubmitting,
    error,
    refresh,
    retry,
    reply,
    assign,
    resolve,
    close,
    reopen,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useTicketStats - Hook for dashboard statistics
// ─────────────────────────────────────────────────────────────────────────────
export function useTicketStats(): UseTicketStatsResult {
  const token = useSelector(selectAuthToken) ?? '';

  const [stats, setStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const result = await getTicketStats(token);
    setStats(result);
  }, [token]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchStats()
      .catch((e: any) => {
        if (!cancelled) setError(e?.message ?? 'Failed to load stats');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [fetchStats]);

  // Refresh
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchStats();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  }, [fetchStats]);

  // Retry
  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchStats()
      .catch((e: any) => setError(e?.message ?? 'Failed to load stats'))
      .finally(() => setIsLoading(false));
  }, [fetchStats]);

  return { stats, isLoading, error, refresh, retry };
}
