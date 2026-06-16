import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useTickets, useTicketStats } from '../../hooks/useTickets';
import {
  Ticket,
  TicketStatus,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_COLORS,
  STATUS_DISPLAY,
  PRIORITY_DISPLAY,
  CATEGORY_DISPLAY,
} from '../../services/ticketApi';

type FilterChip = 'All' | TicketStatus;

const FILTER_CHIPS: FilterChip[] = ['All', 'open', 'in_progress', 'resolved', 'closed'];

interface StatCardProps {
  icon: string;
  label: string;
  count: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, count, color }) => (
  <View style={[statStyles.card, { borderTopColor: color }]}>
    <View style={[statStyles.iconBox, { backgroundColor: color + '14' }]}>
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
    <Text style={[statStyles.count, { color }]}>{count}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    ...shadows.card,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  count: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginTop: 3, textAlign: 'center' },
});

interface TicketRowProps {
  ticket: Ticket;
  onPress: (ticket: Ticket) => void;
}

const TicketRow: React.FC<TicketRowProps> = ({ ticket, onPress }) => {
  const statusColor = TICKET_STATUS_COLORS[ticket.status];
  const priorityColor = TICKET_PRIORITY_COLORS[ticket.priority];

  return (
    <TouchableOpacity style={rowStyles.row} onPress={() => onPress(ticket)} activeOpacity={0.75}>
      {/* Left: ID + subject */}
      <View style={rowStyles.left}>
        <View style={rowStyles.topLine}>
          <Text style={rowStyles.ticketId}>{ticket.ticketId}</Text>
          <View style={[rowStyles.priorityBadge, { backgroundColor: priorityColor + '14' }]}>
            <Text style={[rowStyles.priorityText, { color: priorityColor }]}>{PRIORITY_DISPLAY[ticket.priority]}</Text>
          </View>
        </View>
        <Text style={rowStyles.subject} numberOfLines={1}>{ticket.subject}</Text>
        <View style={rowStyles.metaLine}>
          <Ionicons name="person-outline" size={11} color={colors.textTertiary} />
          <Text style={rowStyles.metaText}>{ticket.userName}</Text>
          <Text style={rowStyles.metaDot}>·</Text>
          <Text style={rowStyles.metaText}>{CATEGORY_DISPLAY[ticket.category]}</Text>
        </View>
      </View>
      {/* Right: Status */}
      <View style={[rowStyles.statusBadge, { backgroundColor: statusColor + '14' }]}>
        <View style={[rowStyles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[rowStyles.statusText, { color: statusColor }]}>{STATUS_DISPLAY[ticket.status]}</Text>
      </View>
    </TouchableOpacity>
  );
};

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 10,
  },
  left: { flex: 1 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  ticketId: { fontSize: 11, fontWeight: '700', color: colors.primary, fontFamily: 'monospace' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  subject: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },
  metaDot: { fontSize: 11, color: colors.textTertiary },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexShrink: 0,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
});

const TicketDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad =
    insets.top > 0 ? insets.top : Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;

  const [activeFilter, setActiveFilter] = useState<FilterChip>('All');

  const statusFilter = activeFilter === 'All' ? undefined : activeFilter;
  const { tickets, counts, isLoading: ticketsLoading, isRefreshing, error, refresh } = useTickets({
    status: statusFilter,
  });
  const { stats, isLoading: statsLoading, refresh: refreshStats } = useTicketStats();

  const isLoading = ticketsLoading || statsLoading;

  const filteredTickets = useMemo(() => {
    if (activeFilter === 'All') return tickets;
    return tickets.filter((t) => t.status === activeFilter);
  }, [tickets, activeFilter]);

  const onRefresh = async () => {
    await refresh();
    await refreshStats();
  };

  const filterCounts: Record<FilterChip, number> = {
    All: tickets.length,
    open: counts.open,
    in_progress: counts.in_progress,
    resolved: counts.resolved,
    closed: counts.closed,
  };

  // Stats from API
  const openCount = stats?.open ?? 0;
  const inProgressCount = stats?.in_progress ?? 0;
  const resolvedCount = stats?.recentResolved ?? 0;
  const pending24h = stats?.pending24h ?? 0;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Ticket Center</Text>
          <Text style={styles.headerSub}>Admin — Support Dashboard</Text>
        </View>
        <View style={styles.headerIconBox}>
          <Ionicons name="ticket-outline" size={26} color="rgba(255,255,255,0.8)" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        {/* Stat Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <StatCard icon="alert-circle-outline" label="Open Tickets" count={openCount} color={TICKET_STATUS_COLORS.open} />
            <StatCard icon="hourglass-outline" label="Assigned" count={inProgressCount} color={TICKET_STATUS_COLORS.in_progress} />
          </View>
          <View style={styles.statsRow}>
            <StatCard icon="checkmark-circle-outline" label="Resolved Today" count={resolvedCount} color={TICKET_STATUS_COLORS.resolved} />
            <StatCard icon="warning-outline" label="Pending >24h" count={pending24h} color={colors.error} />
          </View>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading tickets...</Text>
          </View>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <View style={styles.errorState}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.errorTitle}>Unable to load tickets</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRefresh} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ticket List */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>All Tickets</Text>
            <Text style={styles.listCount}>{filteredTickets.length} results</Text>
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
            style={styles.chipRow}
          >
            {FILTER_CHIPS.map((chip) => {
              const isActive = activeFilter === chip;
              const chipColor = chip === 'All' ? colors.primary : TICKET_STATUS_COLORS[chip as TicketStatus];
              return (
                <TouchableOpacity
                  key={chip}
                  style={[styles.chip, isActive && { backgroundColor: chipColor + '14', borderColor: chipColor }]}
                  onPress={() => setActiveFilter(chip)}
                  activeOpacity={0.75}
                >
                  {chip !== 'All' && (
                    <View style={[styles.chipDot, { backgroundColor: chipColor }]} />
                  )}
                  <Text style={[styles.chipText, isActive && { color: chipColor, fontWeight: '700' }]}>
                    {chip === 'All' ? 'All' : STATUS_DISPLAY[chip]} ({filterCounts[chip]})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Tickets */}
          <View style={styles.ticketsCard}>
            {filteredTickets.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.success} />
                <Text style={styles.emptyTitle}>All clear!</Text>
                <Text style={styles.emptySub}>
                  {activeFilter !== 'All' ? `No ${STATUS_DISPLAY[activeFilter]} tickets.` : 'No tickets at the moment.'}
                </Text>
              </View>
            ) : (
              filteredTickets.map((ticket) => (
                <TicketRow
                  key={ticket._id}
                  ticket={ticket}
                  onPress={(t) => navigation.navigate('TicketDetail', { ticketId: t._id })}
                />
              ))
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextBox: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.70)', fontWeight: '500', marginTop: 2 },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: { padding: 16, gap: 10 },
  statsRow: { flexDirection: 'row', gap: 10 },
  listSection: { paddingHorizontal: 16 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  listTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  listCount: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipRow: { marginBottom: 12 },
  chipScroll: { gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  ticketsCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.card,
    marginBottom: 16,
  },
  emptyState: { padding: 40, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textSecondary },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  errorState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
    paddingHorizontal: 16,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  errorSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 14,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

export default TicketDashboardScreen;
