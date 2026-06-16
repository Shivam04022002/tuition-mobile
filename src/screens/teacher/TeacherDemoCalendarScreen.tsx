import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useDemoCalendar } from '../../hooks/useDemoCalendar';
import { CalendarEvent } from '../../services/contactApi';
import CalendarEventCard from '../../components/teacher/CalendarEventCard';
import UpcomingDemoList from '../../components/teacher/UpcomingDemoList';
import BlockTimeModal from '../../components/teacher/BlockTimeModal';

// ── Analytics ─────────────────────────────────────────────────────────────
const trackEvent = (event: string, payload?: Record<string, any>) => {
  if (__DEV__) console.log(`[Analytics] ${event}`, payload || '');
};

// ── Types ───────────────────────────────────────────────────────────────────

type CalendarView = 'month' | 'week' | 'day' | 'agenda';

// ── Helper Functions ───────────────────────────────────────────────────────

const getMonthName = (date: Date): string => {
  return date.toLocaleString('default', { month: 'long' });
};

const getYear = (date: Date): number => date.getFullYear();

const isSameDay = (d1: Date, d2: Date): boolean =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

// ── Month View Component ────────────────────────────────────────────────────

interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
}

const MonthView: React.FC<MonthViewProps> = React.memo(({
  currentDate,
  selectedDate,
  onSelectDate,
  events,
  onEventPress,
}) => {
  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay() || 7;
    const daysInMonth = lastDay.getDate();
    
    const days: Array<{ date: Date; isCurrentMonth: boolean; events: CalendarEvent[] }> = [];
    
    // Previous month days
    const prevMonthDays = startDayOfWeek - 1;
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false, events: [] });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dayEvents = events.filter(e => isSameDay(new Date(e.date), d));
      days.push({ date: d, isCurrentMonth: true, events: dayEvents });
    }
    
    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, events: [] });
    }
    
    return days;
  }, [currentDate, events]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <View style={monthStyles.container}>
      <View style={monthStyles.weekDays}>
        {weekDays.map(d => (
          <Text key={d} style={monthStyles.weekDay}>{d}</Text>
        ))}
      </View>
      <View style={monthStyles.grid}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              monthStyles.day,
              !day.isCurrentMonth && monthStyles.dayOtherMonth,
              isSameDay(day.date, selectedDate) && monthStyles.daySelected,
              isSameDay(day.date, new Date()) && monthStyles.dayToday,
            ]}
            onPress={() => onSelectDate(day.date)}
          >
            <Text style={[
              monthStyles.dayText,
              !day.isCurrentMonth && monthStyles.dayTextOtherMonth,
              isSameDay(day.date, selectedDate) && monthStyles.dayTextSelected,
              isSameDay(day.date, new Date()) && monthStyles.dayTextToday,
            ]}>
              {day.date.getDate()}
            </Text>
            {day.events.length > 0 && (
              <View style={monthStyles.dots}>
                {day.events.slice(0, 3).map((e, i) => (
                  <View
                    key={i}
                    style={[
                      monthStyles.dot,
                      { backgroundColor: e.type === 'blocked' ? '#EF4444' : colors.primary },
                    ]}
                  />
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

const monthStyles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  weekDays: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 2,
  },
  dayOtherMonth: { opacity: 0.4 },
  daySelected: { backgroundColor: colors.primary },
  dayToday: { borderWidth: 1, borderColor: colors.primary },
  dayText: { fontSize: 14, color: colors.text },
  dayTextOtherMonth: { color: colors.textSecondary },
  dayTextSelected: { color: '#fff', fontWeight: '600' },
  dayTextToday: { color: colors.primary, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});

// ── Week View Component ─────────────────────────────────────────────────────

interface WeekViewProps {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: CalendarEvent[];
}

const WeekView: React.FC<WeekViewProps> = React.memo(({
  currentDate,
  selectedDate,
  onSelectDate,
  events,
}) => {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      const dayEvents = events.filter(e => isSameDay(new Date(e.date), d));
      return { date: d, events: dayEvents };
    });
  }, [currentDate, events]);

  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  return (
    <View style={weekStyles.container}>
      {/* Header */}
      <View style={weekStyles.header}>
        {weekDays.map((day, i) => (
          <TouchableOpacity
            key={i}
            style={[
              weekStyles.dayHeader,
              isSameDay(day.date, selectedDate) && weekStyles.dayHeaderSelected,
            ]}
            onPress={() => onSelectDate(day.date)}
          >
            <Text style={weekStyles.dayName}>{day.date.toLocaleDateString('en-US', { weekday: 'narrow' })}</Text>
            <Text style={[
              weekStyles.dayNumber,
              isSameDay(day.date, selectedDate) && weekStyles.dayNumberSelected,
            ]}>
              {day.date.getDate()}
            </Text>
            {day.events.length > 0 && (
              <View style={[
                weekStyles.indicator,
                { backgroundColor: day.events.some(e => e.type === 'blocked') ? '#EF4444' : colors.primary },
              ]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Time Grid */}
      <ScrollView style={weekStyles.timeGrid} showsVerticalScrollIndicator={false}>
        {timeSlots.map(hour => (
          <View key={hour} style={weekStyles.timeRow}>
            <Text style={weekStyles.timeLabel}>{hour}:00</Text>
            <View style={weekStyles.timeLine} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

const weekStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  dayHeader: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  dayHeaderSelected: { backgroundColor: colors.primary + '15' },
  dayName: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  dayNumber: { fontSize: 16, fontWeight: '600', color: colors.text },
  dayNumberSelected: { color: colors.primary },
  indicator: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  timeGrid: { flex: 1 },
  timeRow: { flexDirection: 'row', height: 50, alignItems: 'center' },
  timeLabel: { width: 50, fontSize: 12, color: colors.textSecondary, textAlign: 'right', paddingRight: 8 },
  timeLine: { flex: 1, height: 1, backgroundColor: colors.border },
});

// ── Day View Component ──────────────────────────────────────────────────────

interface DayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onJoinMeeting: (event: CalendarEvent) => void;
  onUnblock: (event: CalendarEvent) => void;
}

const DayView: React.FC<DayViewProps> = React.memo(({
  selectedDate,
  events,
  onEventPress,
  onJoinMeeting,
  onUnblock,
}) => {
  const dayEvents = useMemo(() => {
    return events
      .filter(e => isSameDay(new Date(e.date), selectedDate))
      .sort((a, b) => {
        const tA = a.time || a.startTime || '00:00';
        const tB = b.time || b.startTime || '00:00';
        return tA.localeCompare(tB);
      });
  }, [selectedDate, events]);

  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  return (
    <View style={dayStyles.container}>
      <Text style={dayStyles.dateTitle}>
        {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {dayEvents.length === 0 ? (
          <View style={dayStyles.empty}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text style={dayStyles.emptyText}>No events scheduled</Text>
          </View>
        ) : (
          <View style={dayStyles.eventsList}>
            {dayEvents.map(event => (
              <CalendarEventCard
                key={event.id}
                event={event}
                onPress={onEventPress}
                onJoinMeeting={onJoinMeeting}
                onUnblock={onUnblock}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
});

const dayStyles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  dateTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 16 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 12 },
  eventsList: { gap: 12 },
});

// ── Main Screen ─────────────────────────────────────────────────────────────

const TeacherDemoCalendarScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const token = useAppSelector(selectAuthToken);
  
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const {
    events,
    stats,
    isLoading,
    isRefreshing,
    isBlocking,
    error,
    refresh,
    retry,
    blockTime,
    unblockTime,
    loadCalendar,
    getEventsForDate,
  } = useDemoCalendar(token);

  useEffect(() => {
    trackEvent('Demo Calendar Viewed', { view: currentView });
  }, [currentView]);

  const navigateMonth = useCallback((direction: number) => {
    setCurrentDate(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  }, []);

  const navigateWeek = useCallback((direction: number) => {
    setCurrentDate(d => addDays(d, direction * 7));
  }, []);

  const navigateDay = useCallback((direction: number) => {
    setSelectedDate(d => addDays(d, direction));
  }, []);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setCurrentView('day');
  }, []);

  const handleEventPress = useCallback((event: CalendarEvent) => {
    if (event.type === 'demo' && event.contactRequestId) {
      navigation.navigate('DemoRequestDetail', { requestId: event.contactRequestId });
    } else {
      setSelectedEvent(event);
    }
  }, [navigation]);

  const handleJoinMeeting = useCallback((event: CalendarEvent) => {
    if (event.meetingLink) {
      Linking.openURL(event.meetingLink);
      trackEvent('Demo Joined', { id: event.id, source: 'calendar' });
    } else {
      Alert.alert('No Meeting Link', 'Meeting link not available for this demo.');
    }
  }, []);

  const handleBlockTime = useCallback(async (data: {
    date: string;
    startTime?: string;
    endTime?: string;
    isFullDay: boolean;
    reason: string;
    reasonType: 'vacation' | 'exam' | 'personal' | 'medical' | 'other';
    isRecurring: boolean;
    recurringDays?: string[];
  }) => {
    const result = await blockTime(data);
    if (result) {
      setShowBlockModal(false);
      Alert.alert('Success', 'Time blocked successfully');
      trackEvent('Time Blocked', { reasonType: data.reasonType });
    }
  }, [blockTime]);

  const handleUnblock = useCallback((event: CalendarEvent) => {
    Alert.alert(
      'Unblock Time',
      'Are you sure you want to unblock this time?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: async () => {
            const id = event.blockedTimeId || event.id;
            const success = await unblockTime(id);
            if (success) {
              Alert.alert('Success', 'Time unblocked successfully');
              trackEvent('Time Unblocked', { id });
            }
          },
        },
      ]
    );
  }, [unblockTime]);

  const renderContent = () => {
    switch (currentView) {
      case 'month':
        return (
          <MonthView
            currentDate={currentDate}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            events={events}
            onEventPress={handleEventPress}
          />
        );
      case 'week':
        return (
          <WeekView
            currentDate={currentDate}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            events={events}
          />
        );
      case 'day':
        return (
          <DayView
            selectedDate={selectedDate}
            events={events}
            onEventPress={handleEventPress}
            onJoinMeeting={handleJoinMeeting}
            onUnblock={handleUnblock}
          />
        );
      case 'agenda':
        return (
          <UpcomingDemoList
            events={events}
            onEventPress={handleEventPress}
            onJoinMeeting={handleJoinMeeting}
            onUnblock={handleUnblock}
            loading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  if (error && events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Demo Calendar</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load calendar</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={retry}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Demo Calendar</Text>
          {currentView === 'month' && (
            <Text style={styles.headerSubtitle}>
              {getMonthName(currentDate)} {getYear(currentDate)}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={refresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh-outline" size={22} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.today}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.tomorrow}</Text>
            <Text style={styles.statLabel}>Tomorrow</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalUpcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>
      )}

      {/* View Tabs */}
      <View style={styles.viewTabs}>
        {(['month', 'week', 'day', 'agenda'] as const).map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.viewTab, currentView === v && styles.viewTabActive]}
            onPress={() => setCurrentView(v)}
          >
            <Ionicons
              name={
                v === 'month' ? 'calendar-outline' :
                v === 'week' ? 'calendar-number-outline' :
                v === 'day' ? 'today-outline' : 'list-outline'
              }
              size={16}
              color={currentView === v ? '#fff' : colors.textSecondary}
            />
            <Text style={[styles.viewTabText, currentView === v && styles.viewTabTextActive]}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Navigation Bar (for Month/Week/Day views) */}
      {currentView !== 'agenda' && (
        <View style={styles.navBar}>
          <View style={styles.navLeft}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => {
                if (currentView === 'month') navigateMonth(-1);
                else if (currentView === 'week') navigateWeek(-1);
                else navigateDay(-1);
              }}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.navDate}>
              {currentView === 'month'
                ? `${getMonthName(currentDate)} ${getYear(currentDate)}`
                : currentView === 'week'
                ? `Week of ${formatDate(currentDate)}`
                : formatDate(selectedDate)}
            </Text>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => {
                if (currentView === 'month') navigateMonth(1);
                else if (currentView === 'week') navigateWeek(1);
                else navigateDay(1);
              }}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.todayBtn}
            onPress={() => {
              const today = new Date();
              setCurrentDate(today);
              setSelectedDate(today);
            }}
          >
            <Text style={styles.todayBtnText}>Today</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {isLoading && events.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />
            }
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </ScrollView>
        )}
      </View>

      {/* Block Time FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowBlockModal(true)}
      >
        <Ionicons name="ban-outline" size={24} color="#fff" />
        <Text style={styles.fabText}>Block Time</Text>
      </TouchableOpacity>

      {/* Block Time Modal */}
      <BlockTimeModal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onSubmit={handleBlockTime}
        isSubmitting={isBlocking}
        initialDate={formatDate(selectedDate)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  refreshBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  viewTabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  viewTab: {
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
  viewTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  viewTabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  viewTabTextActive: { color: '#fff' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: { padding: 4 },
  navDate: { fontSize: 14, fontWeight: '600', color: colors.text, minWidth: 120, textAlign: 'center' },
  todayBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary + '15', borderRadius: 6 },
  todayBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8 },
  errorSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 12 },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 8,
    ...shadows.md,
  },
  fabText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

export default TeacherDemoCalendarScreen;
