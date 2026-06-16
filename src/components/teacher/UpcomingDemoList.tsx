import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarEvent } from '../../services/contactApi';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import CalendarEventCard from './CalendarEventCard';

// ── Types ────────────────────────────────────────────────────────────────────

type UpcomingTab = 'today' | 'tomorrow' | 'week' | 'all';

interface UpcomingDemoListProps {
  events: CalendarEvent[];
  onEventPress?: (event: CalendarEvent) => void;
  onJoinMeeting?: (event: CalendarEvent) => void;
  onUnblock?: (event: CalendarEvent) => void;
  loading?: boolean;
}

// ── Helper Functions ───────────────────────────────────────────────────────

const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const formatDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = getStartOfDay(new Date());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, tomorrow)) return 'Tomorrow';
  
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const getRelativeTime = (dateStr: string, timeStr?: string): string => {
  const now = new Date();
  const eventDate = new Date(dateStr);
  
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    eventDate.setHours(hours, minutes);
  }
  
  const diffMs = eventDate.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 0) return 'Started';
  if (diffMins < 60) return `In ${diffMins} min`;
  if (diffHours < 24) return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
};

// ── Component ────────────────────────────────────────────────────────────────

export const UpcomingDemoList: React.FC<UpcomingDemoListProps> = React.memo(({
  events,
  onEventPress,
  onJoinMeeting,
  onUnblock,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = React.useState<UpcomingTab>('today');

  const today = useMemo(() => getStartOfDay(new Date()), []);
  const tomorrow = useMemo(() => new Date(today.getTime() + 24 * 60 * 60 * 1000), [today]);
  const weekEnd = useMemo(() => new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), [today]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      
      switch (activeTab) {
        case 'today':
          return isSameDay(eventDate, today);
        case 'tomorrow':
          return isSameDay(eventDate, tomorrow);
        case 'week':
          return eventDate >= today && eventDate <= weekEnd;
        case 'all':
        default:
          return eventDate >= today;
      }
    }).sort((a, b) => {
      // Sort by date first
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      
      // Then by time
      const timeA = a.time || a.startTime || '00:00';
      const timeB = b.time || b.startTime || '00:00';
      return timeA.localeCompare(timeB);
    });
  }, [events, activeTab, today, tomorrow, weekEnd]);

  const tabs: Array<{ key: UpcomingTab; label: string; count: number }> = useMemo(() => {
    const countToday = events.filter(e => isSameDay(new Date(e.date), today)).length;
    const countTomorrow = events.filter(e => isSameDay(new Date(e.date), tomorrow)).length;
    const countWeek = events.filter(e => {
      const d = new Date(e.date);
      return d >= today && d <= weekEnd;
    }).length;
    const countAll = events.filter(e => new Date(e.date) >= today).length;
    
    return [
      { key: 'today', label: 'Today', count: countToday },
      { key: 'tomorrow', label: 'Tomorrow', count: countTomorrow },
      { key: 'week', label: 'This Week', count: countWeek },
      { key: 'all', label: 'All', count: countAll },
    ];
  }, [events, today, tomorrow, weekEnd]);

  const handleEventPress = useCallback((event: CalendarEvent) => {
    onEventPress?.(event);
  }, [onEventPress]);

  const handleJoinMeeting = useCallback((event: CalendarEvent) => {
    onJoinMeeting?.(event);
  }, [onJoinMeeting]);

  const handleUnblock = useCallback((event: CalendarEvent) => {
    onUnblock?.(event);
  }, [onUnblock]);

  const renderEvent = useCallback(({ item }: { item: CalendarEvent }) => {
    return (
      <CalendarEventCard
        event={item}
        onPress={handleEventPress}
        onJoinMeeting={handleJoinMeeting}
        onUnblock={handleUnblock}
        compact={activeTab !== 'today'}
      />
    );
  }, [handleEventPress, handleJoinMeeting, handleUnblock, activeTab]);

  const renderEmptyState = useCallback(() => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="calendar-outline" size={40} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>
          No {activeTab === 'today' ? 'events' : activeTab} scheduled
        </Text>
        <Text style={styles.emptySubtitle}>
          {activeTab === 'today'
            ? 'You have no demos or blocked time scheduled for today.'
            : activeTab === 'tomorrow'
            ? 'Nothing scheduled for tomorrow yet.'
            : activeTab === 'week'
            ? 'No events scheduled for this week.'
            : 'No upcoming events found.'}
        </Text>
      </View>
    );
  }, [activeTab, loading]);

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Stats */}
      {activeTab === 'today' && filteredEvents.length > 0 && (
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Ionicons name="videocam-outline" size={16} color={colors.primary} />
            <Text style={styles.statText}>
              {filteredEvents.filter(e => e.type === 'demo').length} demos
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="ban-outline" size={16} color={colors.error} />
            <Text style={styles.statText}>
              {filteredEvents.filter(e => e.type === 'blocked').length} blocked
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color={colors.success} />
            <Text style={styles.statText}>
              Next: {getRelativeTime(filteredEvents[0]?.date, filteredEvents[0]?.time)}
            </Text>
          </View>
        </View>
      )}

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredEvents.length === 0 ? styles.emptyList : styles.listContent}
      />
    </View>
  );
});

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  badge: {
    backgroundColor: colors.primary + '20',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default UpcomingDemoList;
