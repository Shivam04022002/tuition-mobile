import React, { useState, useCallback, useMemo } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useTickets } from '../../hooks/useTickets';
import {
  Ticket,
  TicketStatus,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_COLORS,
  STATUS_DISPLAY,
  PRIORITY_DISPLAY,
  CATEGORY_DISPLAY,
} from '../../services/ticketApi';

const STATUS_FILTERS: Array<TicketStatus | 'All'> = ['All', 'open', 'in_progress', 'resolved', 'closed'];

const TicketCard: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  const statusColor = TICKET_STATUS_COLORS[ticket.status];
  const priorityColor = TICKET_PRIORITY_COLORS[ticket.priority];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <View style={cardStyles.card}>
      {/* Top row */}
      <View style={cardStyles.topRow}>
        <Text style={cardStyles.ticketId}>{ticket.ticketId}</Text>
        <View style={[cardStyles.statusBadge, { backgroundColor: statusColor + '18' }]}>
          <View style={[cardStyles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[cardStyles.statusText, { color: statusColor }]}>{STATUS_DISPLAY[ticket.status]}</Text>
        </View>
      </View>

      {/* Subject */}
      <Text style={cardStyles.subject} numberOfLines={2}>{ticket.subject}</Text>

      {/* Meta row */}
      <View style={cardStyles.metaRow}>
        <View style={[cardStyles.priorityChip, { borderColor: priorityColor + '60' }]}>
          <Text style={[cardStyles.priorityText, { color: priorityColor }]}>{PRIORITY_DISPLAY[ticket.priority]}</Text>
        </View>
        <View style={cardStyles.metaItem}>
          <Ionicons name="folder-outline" size={12} color={colors.textTertiary} />
          <Text style={cardStyles.metaText}>{CATEGORY_DISPLAY[ticket.category]}</Text>
        </View>
      </View>

      {/* Footer row */}
      <View style={cardStyles.footerRow}>
        <View style={cardStyles.metaItem}>
          <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
          <Text style={cardStyles.metaText}>{formatDate(ticket.createdAt)}</Text>
        </View>
        <View style={cardStyles.metaItem}>
          <Ionicons name="chatbubble-outline" size={12} color={colors.textTertiary} />
          <Text style={cardStyles.metaText}>{ticket.messages?.length || 0} messages</Text>
        </View>
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    ...shadows.card,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ticketId: { fontSize: 12, fontWeight: '700', color: colors.primary, fontFamily: 'monospace' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  subject: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10, lineHeight: 21 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  priorityChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  priorityText: { fontSize: 11, fontWeight: '700' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textTertiary, fontWeight: '500' },
  footerRow: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 10 },
});

const MyTicketsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const topPad =
    insets.top > 0 ? insets.top : Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;

  const role: 'parent' | 'teacher' = route.params?.role ?? 'parent';

  const [activeFilter, setActiveFilter] = useState<TicketStatus | 'All'>('All');

  const statusFilter = activeFilter === 'All' ? undefined : activeFilter;
  const { tickets, counts, isLoading, isRefreshing, error, refresh } = useTickets({
    status: statusFilter,
  });

  const filteredTickets = useMemo(() => {
    if (activeFilter === 'All') return tickets;
    return tickets.filter((t) => t.status === activeFilter);
  }, [tickets, activeFilter]);

  const totalCount = tickets.length;
  const displayCounts: Record<TicketStatus | 'All', number> = {
    All: totalCount,
    open: counts.open,
    in_progress: counts.in_progress,
    resolved: counts.resolved,
    closed: counts.closed,
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>My Tickets</Text>
          <Text style={styles.headerSub}>{totalCount} total tickets</Text>
        </View>
        <TouchableOpacity
          style={styles.newTicketBtn}
          onPress={() => navigation.navigate('CreateTicket', { role })}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: TICKET_STATUS_COLORS.open }]}>
          <Text style={[styles.statCount, { color: TICKET_STATUS_COLORS.open }]}>
            {displayCounts.open}
          </Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: TICKET_STATUS_COLORS.in_progress }]}>
          <Text style={[styles.statCount, { color: TICKET_STATUS_COLORS.in_progress }]}>
            {displayCounts.in_progress}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: TICKET_STATUS_COLORS.resolved }]}>
          <Text style={[styles.statCount, { color: TICKET_STATUS_COLORS.resolved }]}>
            {displayCounts.resolved}
          </Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: TICKET_STATUS_COLORS.closed }]}>
          <Text style={[styles.statCount, { color: TICKET_STATUS_COLORS.closed }]}>
            {displayCounts.closed}
          </Text>
          <Text style={styles.statLabel}>Closed</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.chipWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            const dotColor =
              filter === 'All' ? colors.primary : TICKET_STATUS_COLORS[filter as TicketStatus];
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.chip, isActive && { backgroundColor: dotColor + '18', borderColor: dotColor }]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.75}
              >
                {filter !== 'All' && (
                  <View style={[styles.chipDot, { backgroundColor: dotColor }]} />
                )}
                <Text style={[styles.chipText, isActive && { color: dotColor, fontWeight: '700' }]}>
                  {filter === 'All' ? 'All' : STATUS_DISPLAY[filter as TicketStatus]} ({displayCounts[filter]})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Ticket List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
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
            <TouchableOpacity style={styles.retryBtn} onPress={refresh} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="ticket-outline" size={48} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No tickets found</Text>
            <Text style={styles.emptySub}>
              {activeFilter !== 'All'
                ? `No ${STATUS_DISPLAY[activeFilter]} tickets at the moment.`
                : 'No tickets yet. Create your first support ticket!'}
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('CreateTicket', { role })}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>Raise a Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTickets.map((ticket) => <TicketCard key={ticket._id} ticket={ticket} />)
        )}
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
  newTicketBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 3,
    alignItems: 'center',
  },
  statCount: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  chipWrapper: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
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
  scroll: { padding: 16 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  emptyBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  errorState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  errorSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 14,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

export default MyTicketsScreen;
