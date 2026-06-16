import React, { useState, useMemo } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useTickets } from '../../hooks/useTickets';
import {
  Ticket,
  TicketPriority,
  TicketStatus,
  TICKET_PRIORITY_COLORS,
  TICKET_STATUS_COLORS,
  PRIORITY_DISPLAY,
  STATUS_DISPLAY,
  CATEGORY_DISPLAY,
} from '../../services/ticketApi';

const { width } = Dimensions.get('window');

const PRIORITY_CONFIG: Record<TicketPriority, { color: string; bg: string }> = {
  high:   { color: TICKET_PRIORITY_COLORS.high,   bg: TICKET_PRIORITY_COLORS.high   + '18' },
  medium: { color: TICKET_PRIORITY_COLORS.medium,  bg: TICKET_PRIORITY_COLORS.medium  + '18' },
  low:    { color: TICKET_PRIORITY_COLORS.low, bg: TICKET_PRIORITY_COLORS.low + '18' },
  urgent: { color: TICKET_PRIORITY_COLORS.urgent, bg: TICKET_PRIORITY_COLORS.urgent + '18' },
};

const STATUS_CONFIG: Record<TicketStatus, { color: string; bg: string }> = {
  open:        { color: TICKET_STATUS_COLORS.open,    bg: TICKET_STATUS_COLORS.open    + '18' },
  in_progress: { color: TICKET_STATUS_COLORS.in_progress,  bg: TICKET_STATUS_COLORS.in_progress  + '18' },
  resolved:    { color: TICKET_STATUS_COLORS.resolved, bg: TICKET_STATUS_COLORS.resolved + '18' },
  closed:      { color: TICKET_STATUS_COLORS.closed, bg: TICKET_STATUS_COLORS.closed + '18' },
};

const FILTER_OPTIONS: Array<TicketStatus | 'All'> = ['All', 'open', 'in_progress', 'resolved', 'closed'];

const StaffTicketsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<TicketStatus | 'All'>('All');

  const statusFilter = activeFilter === 'All' ? undefined : activeFilter;
  const { tickets, counts, isLoading, isRefreshing, error, refresh } = useTickets({
    status: statusFilter,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return tickets;
    const s = search.toLowerCase();
    return tickets.filter((t) =>
      t.subject.toLowerCase().includes(s) ||
      t.ticketId.toLowerCase().includes(s) ||
      t.userName.toLowerCase().includes(s) ||
      CATEGORY_DISPLAY[t.category].toLowerCase().includes(s)
    );
  }, [tickets, search]);

  const displayCounts = {
    All: tickets.length,
    open: counts.open,
    in_progress: counts.in_progress,
    resolved: counts.resolved,
    closed: counts.closed,
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const renderTicket = ({ item }: { item: Ticket }) => {
    const pCfg = PRIORITY_CONFIG[item.priority];
    const sCfg = STATUS_CONFIG[item.status];
    return (
      <TouchableOpacity
        style={styles.ticketCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('StaffTicketDetail', { ticketId: item._id })}
      >
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketId}>{item.ticketId}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: pCfg.bg }]}>
              <Text style={[styles.badgeText, { color: pCfg.color }]}>{PRIORITY_DISPLAY[item.priority]}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: sCfg.bg }]}>
              <Text style={[styles.badgeText, { color: sCfg.color }]}>{STATUS_DISPLAY[item.status]}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.ticketSubject}>{item.subject}</Text>
        <View style={styles.ticketFooter}>
          <View style={styles.ticketMeta}>
            <Ionicons name="person-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.ticketMetaText}>{item.userName}</Text>
          </View>
          <View style={styles.ticketMeta}>
            <Ionicons name="folder-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.ticketMetaText}>{CATEGORY_DISPLAY[item.category]}</Text>
          </View>
          <View style={styles.ticketMeta}>
            <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.ticketMetaText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ticket Management</Text>
          <Text style={styles.headerSub}>{tickets.length} total tickets</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="ticket-outline" size={22} color="#FFF" />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets, users, IDs..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_OPTIONS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>{f}</Text>
            <View style={[styles.filterCount, activeFilter === f && styles.filterCountActive]}>
              <Text style={[styles.filterCountText, activeFilter === f && styles.filterCountTextActive]}>
                {displayCounts[f as keyof typeof displayCounts]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Ticket List */}
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load tickets</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i._id}
          renderItem={renderTicket}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="ticket-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>
                {search ? 'No tickets match your search' : 'No tickets assigned to you'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerBadge: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center', alignItems: 'center',
  },

  searchRow: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border,
    ...shadows.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },

  filterScroll: { maxHeight: 52 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterTabActive: { backgroundColor: colors.error, borderColor: colors.error },
  filterTabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTabTextActive: { color: '#FFF' },
  filterCount: {
    backgroundColor: colors.backgroundSecondary, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterCountText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  filterCountTextActive: { color: '#FFF' },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 12 },
  ticketCard: {
    backgroundColor: colors.card, borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: colors.border,
    ...shadows.sm, gap: 10,
  },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketId: { fontSize: 12, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.5 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  ticketSubject: { fontSize: 15, fontWeight: '700', color: colors.text },
  ticketFooter: { flexDirection: 'row', gap: 14 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ticketMetaText: { fontSize: 11, color: colors.textTertiary },
  ticketActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  ticketAction: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10,
  },
  ticketActionText: { fontSize: 12, fontWeight: '600' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textTertiary, fontWeight: '600' },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
    paddingHorizontal: 20,
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

export default StaffTicketsScreen;
