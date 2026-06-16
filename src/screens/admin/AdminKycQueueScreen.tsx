import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAdminKyc } from '../../hooks/useKyc';
import { KycQueueRecord } from '../../services/kycApi';

// ─────────────────────────────────────────────────────────────────────────────
// Status Config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280',
  submitted: '#3B82F6',
  under_review: '#3B82F6',
  approved: '#10B981',
  rejected: '#EF4444',
  reupload_required: '#F59E0B',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  reupload_required: 'Reupload',
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Reviewing' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'reupload_required', label: 'Reupload' },
];

// ─────────────────────────────────────────────────────────────────────────────
// KYC Card Component
// ─────────────────────────────────────────────────────────────────────────────

const KycCard: React.FC<{ record: KycQueueRecord; onPress: () => void }> = ({ record, onPress }) => {
  const teacherName = record.teacherId?.basicDetails?.fullName
    || `${record.teacherId?.userId?.profile?.firstName || ''} ${record.teacherId?.userId?.profile?.lastName || ''}`.trim()
    || 'Unknown Teacher';

  const color = STATUS_COLORS[record.status] || '#6B7280';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.avatar, { backgroundColor: color + '20' }]}>
            <Text style={[styles.avatarText, { color }]}>
              {teacherName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{teacherName}</Text>
            <Text style={styles.cardId}>{record.kycId}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: color + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={[styles.statusText, { color }]}>{STATUS_LABELS[record.status] || record.status}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.cardStat}>
          <Ionicons name="document-outline" size={14} color="#6B7280" />
          <Text style={styles.cardStatText}>{record.documents?.length || 0} docs</Text>
        </View>
        {record.submittedAt && (
          <View style={styles.cardStat}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.cardStatText}>{new Date(record.submittedAt).toLocaleDateString('en-IN')}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color="#6B7280" />
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

const AdminKycQueueScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const {
    queue,
    activeFilter,
    isLoading,
    isRefreshing,
    error,
    refresh,
    retry,
    setFilter,
  } = useAdminKyc();

  const handleCardPress = useCallback((record: KycQueueRecord) => {
    navigation.navigate('AdminKycDetail', { kycId: record._id });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: KycQueueRecord }) => (
    <KycCard record={item} onPress={() => handleCardPress(item)} />
  ), [handleCardPress]);

  const keyExtractor = useCallback((item: KycQueueRecord) => item._id, []);

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={styles.loadingText}>Loading KYC Queue...</Text>
      </View>
    );
  }

  if (error && !queue) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.colors.secondary }]} onPress={retry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.secondary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification Queue</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Counts Strip */}
      {queue?.counts && (
        <View style={styles.countsStrip}>
          <View style={styles.countItem}>
            <Text style={styles.countNumber}>{queue.counts.submitted}</Text>
            <Text style={styles.countLabel}>Pending</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={styles.countNumber}>{queue.counts.under_review}</Text>
            <Text style={styles.countLabel}>Reviewing</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={[styles.countNumber, { color: '#10B981' }]}>{queue.counts.approved}</Text>
            <Text style={styles.countLabel}>Approved</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={[styles.countNumber, { color: '#EF4444' }]}>{queue.counts.rejected}</Text>
            <Text style={styles.countLabel}>Rejected</Text>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <FlatList
        horizontal
        data={TABS}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, activeFilter === item.key && { backgroundColor: theme.colors.secondary }]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[styles.tabText, activeFilter === item.key && styles.tabTextActive]}>
              {item.label}
              {queue?.counts && item.key !== 'all'
                ? ` (${(queue.counts as any)[item.key] || 0})`
                : item.key === 'all' ? ` (${queue?.counts?.all || 0})` : ''}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Records List */}
      <FlatList
        data={queue?.records || []}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shield-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No KYC records found</Text>
          </View>
        }
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  errorText: { marginTop: 12, color: '#EF4444', fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  countsStrip: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  countItem: { flex: 1, alignItems: 'center' },
  countNumber: { fontSize: 18, fontWeight: '700', color: '#111827' },
  countLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  tabsContainer: { paddingHorizontal: 12, paddingVertical: 10 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#FFFFFF' },

  listContent: { padding: 12 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cardId: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { fontSize: 12, color: '#6B7280' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
});

export default AdminKycQueueScreen;
