import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useTeacherContact } from '../../hooks/useContact';
import { ContactRequest, ContactStatus, RescheduleDemoPayload, CompleteDemoPayload } from '../../services/contactApi';
import DemoRequestCard from '../../components/teacher/DemoRequestCard';
import DemoRescheduleModal from '../../components/teacher/DemoRescheduleModal';
import DemoFeedbackModal from '../../components/teacher/DemoFeedbackModal';
import DemoActionSheet from '../../components/teacher/DemoActionSheet';

// ── Analytics ────────────────────────────────────────────────────────────────
const trackEvent = (event: string, payload?: Record<string, any>) => {
  if (__DEV__) console.log(`[Analytics] ${event}`, payload || '');
};

// ── Filter Tabs ───────────────────────────────────────────────────────────────
type FilterTab = ContactStatus | 'all' | 'upcoming' | 'past';

const FILTER_TABS: Array<{ key: FilterTab; label: string }> = [
  { key: 'all',         label: 'All' },
  { key: 'pending',     label: 'Pending' },
  { key: 'accepted',    label: 'Accepted' },
  { key: 'rescheduled', label: 'Rescheduled' },
  { key: 'completed',   label: 'Completed' },
  { key: 'rejected',    label: 'Rejected' },
  { key: 'upcoming',    label: 'Upcoming' },
  { key: 'past',        label: 'Past' },
];

// ── Summary Cards ─────────────────────────────────────────────────────────────
const SummaryCards: React.FC<{
  total: number; pending: number; accepted: number;
  completed: number; rejected: number; rescheduled: number;
  isLoading: boolean;
}> = React.memo(({ total, pending, accepted, completed, rejected, rescheduled, isLoading }) => {
  const stats = [
    { label: 'Total',       value: total,      color: colors.text },
    { label: 'Pending',     value: pending,    color: '#F59E0B' },
    { label: 'Accepted',    value: accepted,   color: '#10B981' },
    { label: 'Completed',   value: completed,  color: '#3B82F6' },
    { label: 'Rejected',    value: rejected,   color: '#EF4444' },
    { label: 'Rescheduled', value: rescheduled, color: '#8B5CF6' },
  ];

  return (
    <View style={summaryStyles.container}>
      {stats.map((s, i) => (
        <View key={s.label} style={[
          summaryStyles.card,
          i < stats.length - 1 && summaryStyles.cardBorder,
        ]}>
          {isLoading ? (
            <View style={summaryStyles.skeletonValue} />
          ) : (
            <Text style={[summaryStyles.value, { color: s.color }]}>{s.value}</Text>
          )}
          <Text style={summaryStyles.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
});

const summaryStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  cardBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  skeletonValue: {
    width: 24,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: 4,
  },
});

// ── Skeleton Cards ────────────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <View style={skeletonStyles.card}>
    <View style={skeletonStyles.headerRow}>
      <View style={skeletonStyles.circle} />
      <View style={skeletonStyles.headerContent}>
        <View style={[skeletonStyles.bar, { width: '40%', height: 12 }]} />
        <View style={[skeletonStyles.bar, { width: '25%', height: 10, marginTop: 4 }]} />
      </View>
      <View style={skeletonStyles.badge} />
    </View>
    <View style={[skeletonStyles.bar, { width: '70%', height: 11, marginBottom: 6 }]} />
    <View style={[skeletonStyles.bar, { width: '55%', height: 11, marginBottom: 6 }]} />
    <View style={[skeletonStyles.bar, { width: '60%', height: 11, marginBottom: 6 }]} />
    <View style={skeletonStyles.actionsRow}>
      {[1, 2, 3].map(i => <View key={i} style={skeletonStyles.actionBtn} />)}
    </View>
  </View>
);

const SkeletonList: React.FC = () => (
  <View style={{ padding: 16 }}>
    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
  </View>
);

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.backgroundSecondary, marginRight: 10 },
  headerContent: { flex: 1, gap: 4 },
  badge: { width: 70, height: 22, borderRadius: 11, backgroundColor: colors.backgroundSecondary },
  bar: { borderRadius: 4, backgroundColor: colors.backgroundSecondary },
  actionsRow: { flexDirection: 'row', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  actionBtn: { flex: 1, height: 30, borderRadius: 8, backgroundColor: colors.backgroundSecondary },
});

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ filter: FilterTab; onRefresh: () => void }> = ({ filter, onRefresh }) => (
  <View style={emptyStyles.container}>
    <View style={emptyStyles.iconCircle}>
      <Ionicons name="clipboard-outline" size={44} color={colors.primary} />
    </View>
    <Text style={emptyStyles.title}>
      {filter === 'all' ? 'No Demo Requests' : `No ${filter} demos`}
    </Text>
    <Text style={emptyStyles.subtitle}>
      {filter === 'all'
        ? 'When parents request demo classes with you, they will appear here.'
        : `You don't have any ${filter} demo requests right now.`}
    </Text>
    <TouchableOpacity style={emptyStyles.btn} onPress={onRefresh}>
      <Text style={emptyStyles.btnText}>Refresh</Text>
    </TouchableOpacity>
  </View>
);

const emptyStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary + '12',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 12 },
  btnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

const TeacherDemoRequestsDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const token = useAppSelector(selectAuthToken);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchText, setSearchText] = useState('');
  const [actionSheetRequest, setActionSheetRequest] = useState<ContactRequest | null>(null);
  const [rescheduleRequest, setRescheduleRequest] = useState<ContactRequest | null>(null);
  const [feedbackRequest, setFeedbackRequest] = useState<ContactRequest | null>(null);
  const [rejectRequest, setRejectRequest] = useState<ContactRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    contactRequests,
    summaryStats,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    activeFilter,
    refresh,
    loadMore,
    retry,
    setFilter,
    setSearch,
    respondToRequest,
    rescheduleDemo,
    completeDemo,
    isResponding,
    responseError,
    clearResponseError,
  } = useTeacherContact(token);

  useEffect(() => {
    trackEvent('Demo Requests Dashboard Viewed');
  }, []);

  useEffect(() => {
    if (responseError) {
      Alert.alert('Error', responseError, [{ text: 'OK', onPress: clearResponseError }]);
    }
  }, [responseError, clearResponseError]);

  // ── Tab change ──────────────────────────────────────────────────────────────
  const handleTabChange = useCallback((tab: FilterTab) => {
    setActiveTab(tab);
    if (tab === 'upcoming' || tab === 'past') {
      setFilter('all');
    } else {
      setFilter(tab as ContactStatus | 'all');
    }
  }, [setFilter]);

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearch(text);
    }, 400);
  }, [setSearch]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleAccept = useCallback(async (request: ContactRequest) => {
    setActionSheetRequest(null);
    Alert.alert(
      'Accept Demo Request',
      `Accept demo request from ${(request as any).parentId?.profile?.parentName || 'parent'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept', style: 'default',
          onPress: async () => {
            const result = await respondToRequest(request._id, { status: 'accepted' });
            if (result) {
              trackEvent('Demo Accepted', { id: request._id });
              Alert.alert('Accepted', 'Demo request accepted. Parent has been notified.');
            }
          },
        },
      ]
    );
  }, [respondToRequest]);

  const handleReject = useCallback((request: ContactRequest) => {
    setActionSheetRequest(null);
    setRejectReason('');
    setRejectRequest(request);
  }, []);

  const handleRejectSubmit = useCallback(async () => {
    if (!rejectRequest) return;
    const result = await respondToRequest(rejectRequest._id, {
      status: 'rejected',
      responseMessage: rejectReason.trim() || 'Unable to accommodate this request.',
    });
    if (result) {
      setRejectRequest(null);
      setRejectReason('');
      trackEvent('Demo Rejected', { id: rejectRequest._id });
      Alert.alert('Rejected', 'The parent has been notified.');
    }
  }, [rejectRequest, rejectReason, respondToRequest]);

  const handleReschedule = useCallback((request: ContactRequest) => {
    setActionSheetRequest(null);
    setRescheduleRequest(request);
  }, []);

  const handleRescheduleSubmit = useCallback(async (data: RescheduleDemoPayload) => {
    if (!rescheduleRequest) return;
    const result = await rescheduleDemo(rescheduleRequest._id, data);
    if (result) {
      setRescheduleRequest(null);
      trackEvent('Demo Rescheduled', { id: rescheduleRequest._id, newDate: data.newDate });
      Alert.alert('Rescheduled', 'Demo rescheduled. Parent has been notified.');
    }
  }, [rescheduleRequest, rescheduleDemo]);

  const handleComplete = useCallback((request: ContactRequest) => {
    setActionSheetRequest(null);
    setFeedbackRequest(request);
  }, []);

  const handleFeedbackSubmit = useCallback(async (data: CompleteDemoPayload) => {
    if (!feedbackRequest) return;
    const result = await completeDemo(feedbackRequest._id, data);
    if (result) {
      setFeedbackRequest(null);
      trackEvent('Demo Completed', { id: feedbackRequest._id, outcome: data.outcome });
      Alert.alert('Completed', 'Demo marked as complete. Parent has been notified.');
    }
  }, [feedbackRequest, completeDemo]);

  const handleViewDetails = useCallback((request: ContactRequest) => {
    setActionSheetRequest(null);
    trackEvent('Demo Detail Viewed', { id: request._id });
    navigation.navigate('DemoRequestDetail', { requestId: request._id });
  }, [navigation]);

  // ── Render item ─────────────────────────────────────────────────────────────
  const renderItem = useCallback(({ item }: { item: ContactRequest }) => (
    <DemoRequestCard
      request={item}
      onAccept={handleAccept}
      onReject={handleReject}
      onReschedule={handleReschedule}
      onComplete={handleComplete}
      onViewDetails={handleViewDetails}
      isResponding={isResponding}
    />
  ), [handleAccept, handleReject, handleReschedule, handleComplete, handleViewDetails, isResponding]);

  const keyExtractor = useCallback((item: ContactRequest) => item._id, []);

  const ListFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isLoadingMore]);

  // ── Error State ─────────────────────────────────────────────────────────────
  if (error && contactRequests.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Demo Requests</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load requests</Text>
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
        <Text style={styles.headerTitle}>Demo Requests</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={refresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh-outline" size={22} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <SummaryCards
        total={summaryStats?.total ?? 0}
        pending={summaryStats?.pending ?? 0}
        accepted={summaryStats?.accepted ?? 0}
        completed={summaryStats?.completed ?? 0}
        rejected={summaryStats?.rejected ?? 0}
        rescheduled={summaryStats?.rescheduled ?? 0}
        isLoading={isLoading && !summaryStats}
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputRow}>
          <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearchChange}
            placeholder="Requirement ID, student, parent, subject..."
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); setSearch(''); }}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          data={FILTER_TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item: tab }) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTabChange(tab.key)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Content */}
      {isLoading ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={contactRequests}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[styles.listContent, contactRequests.length === 0 && styles.listContentEmpty]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.3}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={<EmptyState filter={activeTab} onRefresh={refresh} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Reject Modal */}
      <Modal
        visible={!!rejectRequest}
        transparent
        animationType="slide"
        onRequestClose={() => !isResponding && setRejectRequest(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <View style={styles.rejectModal}>
            <View style={styles.rejectModalHandle} />
            <Text style={styles.rejectModalTitle}>Reject Demo Request</Text>
            <Text style={styles.rejectModalSubtitle}>Enter a reason (optional):</Text>
            <TextInput
              style={styles.rejectModalInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Reason for rejection..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isResponding}
              autoFocus
            />
            <View style={styles.rejectModalButtons}>
              <TouchableOpacity
                style={[styles.rejectModalBtn, styles.rejectModalCancelBtn]}
                onPress={() => { setRejectRequest(null); setRejectReason(''); }}
                disabled={isResponding}
              >
                <Text style={styles.rejectModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectModalBtn, styles.rejectModalConfirmBtn]}
                onPress={handleRejectSubmit}
                disabled={isResponding}
              >
                {isResponding
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.rejectModalConfirmText}>Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modals */}
      <DemoRescheduleModal
        visible={!!rescheduleRequest}
        onClose={() => setRescheduleRequest(null)}
        onSubmit={handleRescheduleSubmit}
        isSubmitting={isResponding}
        currentDate={rescheduleRequest?.demoDate ? new Date(rescheduleRequest.demoDate).toLocaleDateString('en-IN') : undefined}
        currentTime={rescheduleRequest?.demoTime}
      />

      <DemoFeedbackModal
        visible={!!feedbackRequest}
        onClose={() => setFeedbackRequest(null)}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={isResponding}
      />

      <DemoActionSheet
        visible={!!actionSheetRequest}
        request={actionSheetRequest}
        onClose={() => setActionSheetRequest(null)}
        onAccept={() => actionSheetRequest && handleAccept(actionSheetRequest)}
        onReject={() => actionSheetRequest && handleReject(actionSheetRequest)}
        onReschedule={() => actionSheetRequest && handleReschedule(actionSheetRequest)}
        onComplete={() => actionSheetRequest && handleComplete(actionSheetRequest)}
        onViewDetails={() => actionSheetRequest && handleViewDetails(actionSheetRequest)}
        isResponding={isResponding}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  refreshBtn: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  tabsWrapper: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flex: 1,
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40,
  },
  errorTitle: {
    fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24,
  },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: colors.primary, borderRadius: 12,
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  rejectModal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  rejectModalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  rejectModalTitle: {
    fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6,
  },
  rejectModalSubtitle: {
    fontSize: 13, color: colors.textSecondary, marginBottom: 12,
  },
  rejectModalInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    marginBottom: 16,
  },
  rejectModalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectModalBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
  },
  rejectModalCancelBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rejectModalCancelText: { fontSize: 14, fontWeight: '600', color: colors.text },
  rejectModalConfirmBtn: { backgroundColor: colors.error },
  rejectModalConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

export default React.memo(TeacherDemoRequestsDashboardScreen);
