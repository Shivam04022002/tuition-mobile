import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch } from '../redux/store';
import { logout } from '../redux/slices/authSlice';
import {
  CalendarEvent,
  CalendarResponse,
  BlockTimePayload,
  BlockedTimeResponse,
  ConflictCheckResponse,
  getTeacherCalendar,
  blockTimeSlot,
  unblockTimeSlot,
  checkAvailabilityConflicts,
} from '../services/contactApi';

// ── Analytics (dev logging) ──────────────────────────────────────────────────
const trackEvent = (event: string, payload?: Record<string, any>) => {
  if (__DEV__) {
    console.log(`[Analytics] ${event}`, payload || '');
  }
};

// ── Hook Result Types ────────────────────────────────────────────────────────

export interface UseDemoCalendarResult {
  // Calendar data
  events: CalendarEvent[];
  demos: CalendarEvent[];
  blockedTimes: CalendarEvent[];
  stats: CalendarResponse['stats'] | null;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isBlocking: boolean;
  isUnblocking: boolean;
  
  // Error states
  error: string | null;
  blockError: string | null;
  
  // Date range
  startDate: Date;
  endDate: Date;
  
  // Actions
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
  loadCalendar: (start?: Date, end?: Date) => Promise<void>;
  
  // Block time actions
  blockTime: (payload: BlockTimePayload) => Promise<BlockedTimeResponse | null>;
  unblockTime: (id: string) => Promise<boolean>;
  clearBlockError: () => void;
  
  // Conflict detection
  checkConflicts: (date: string, startTime?: string, endTime?: string) => Promise<ConflictCheckResponse | null>;
  
  // Utility
  getEventsForDate: (date: Date) => CalendarEvent[];
  getUpcomingEvents: (days?: number) => CalendarEvent[];
  hasEventsOnDate: (date: Date) => boolean;
}

// ── Helper Functions ───────────────────────────────────────────────────────

const getDefaultDateRange = () => {
  const startDate = new Date();
  startDate.setDate(1); // Start of current month
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 2); // 2 months ahead
  endDate.setDate(0); // Last day of previous month
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
};

const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// ── Hook ───────────────────────────────────────────────────────────────────

export const useDemoCalendar = (token: string | null): UseDemoCalendarResult => {
  const dispatch = useAppDispatch();
  
  // Data state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [demos, setDemos] = useState<CalendarEvent[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<CalendarResponse['stats'] | null>(null);
  
  // Date range
  const [startDate, setStartDate] = useState<Date>(() => getDefaultDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultDateRange().endDate);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);

  // Load calendar data
  const loadCalendar = useCallback(async (start?: Date, end?: Date) => {
    if (!token) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }

    const loadStart = start || startDate;
    const loadEnd = end || endDate;

    try {
      setError(null);
      
      const response = await getTeacherCalendar(token, {
        startDate: formatDateForAPI(loadStart),
        endDate: formatDateForAPI(loadEnd),
      });

      setEvents(response.events);
      setDemos(response.demos);
      setBlockedTimes(response.blockedTimes);
      setStats(response.stats);
      
      if (start) setStartDate(start);
      if (end) setEndDate(end);
      
      trackEvent('Calendar Loaded', {
        eventCount: response.events.length,
        demoCount: response.demos.length,
        blockedCount: response.blockedTimes.length,
      });
    } catch (err: any) {
      console.error('Load calendar error:', err);
      
      const msg = err?.message || 'Failed to load calendar';
      setError(msg);
      
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
      }
      
      trackEvent('Calendar Load Error', { error: msg });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, dispatch, startDate, endDate]);

  // Refresh data
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadCalendar();
  }, [loadCalendar]);

  // Retry on error
  const retry = useCallback(async () => {
    setIsLoading(true);
    await loadCalendar();
  }, [loadCalendar]);

  // Block time slot
  const blockTime = useCallback(async (payload: BlockTimePayload): Promise<BlockedTimeResponse | null> => {
    if (!token) {
      setBlockError('Authentication required');
      return null;
    }

    setIsBlocking(true);
    setBlockError(null);

    try {
      const response = await blockTimeSlot(token, payload);
      
      trackEvent('Time Blocked', {
        date: payload.date,
        isFullDay: payload.isFullDay,
        reasonType: payload.reasonType,
      });
      
      // Refresh calendar to include new blocked time
      await loadCalendar();
      
      return response;
    } catch (err: any) {
      const msg = err?.message || 'Failed to block time';
      setBlockError(msg);
      
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
      }
      
      trackEvent('Block Time Error', { error: msg });
      return null;
    } finally {
      setIsBlocking(false);
    }
  }, [token, dispatch, loadCalendar]);

  // Unblock time slot
  const unblockTime = useCallback(async (id: string): Promise<boolean> => {
    if (!token) {
      setBlockError('Authentication required');
      return false;
    }

    setIsUnblocking(true);

    try {
      await unblockTimeSlot(token, id);
      
      trackEvent('Time Unblocked', { id });
      
      // Optimistically update local state
      setBlockedTimes(prev => prev.filter(bt => bt.id !== id && bt.blockedTimeId !== id));
      setEvents(prev => prev.filter(e => e.id !== id && e.blockedTimeId !== id));
      
      // Refresh to ensure consistency
      await loadCalendar();
      
      return true;
    } catch (err: any) {
      const msg = err?.message || 'Failed to unblock time';
      setBlockError(msg);
      
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
      }
      
      trackEvent('Unblock Time Error', { error: msg });
      return false;
    } finally {
      setIsUnblocking(false);
    }
  }, [token, dispatch, loadCalendar]);

  // Check for conflicts
  const checkConflicts = useCallback(async (
    date: string,
    startTime?: string,
    endTime?: string,
  ): Promise<ConflictCheckResponse | null> => {
    if (!token) return null;

    try {
      const response = await checkAvailabilityConflicts(token, {
        date,
        startTime,
        endTime,
      });
      
      trackEvent('Conflicts Checked', {
        date,
        hasConflicts: response.hasConflicts,
        conflictCount: response.conflictCount,
      });
      
      return response;
    } catch (err: any) {
      console.error('Check conflicts error:', err);
      
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
      }
      
      return null;
    }
  }, [token, dispatch]);

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    }).sort((a, b) => {
      // Sort by time if available
      const timeA = a.time || a.startTime || '00:00';
      const timeB = b.time || b.startTime || '00:00';
      return timeA.localeCompare(timeB);
    });
  }, [events]);

  // Get upcoming events within N days
  const getUpcomingEvents = useCallback((days: number = 7): CalendarEvent[] => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= cutoff;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  // Check if date has any events
  const hasEventsOnDate = useCallback((date: Date): boolean => {
    return events.some(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  }, [events]);

  // Clear block error
  const clearBlockError = useCallback(() => {
    setBlockError(null);
  }, []);

  // Load data on mount
  useEffect(() => {
    if (token) {
      loadCalendar();
    }
  }, [token]);

  return {
    events,
    demos,
    blockedTimes,
    stats,
    isLoading,
    isRefreshing,
    isBlocking,
    isUnblocking,
    error,
    blockError,
    startDate,
    endDate,
    refresh,
    retry,
    loadCalendar,
    blockTime,
    unblockTime,
    clearBlockError,
    checkConflicts,
    getEventsForDate,
    getUpcomingEvents,
    hasEventsOnDate,
  };
};

export default useDemoCalendar;
