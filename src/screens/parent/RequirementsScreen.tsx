import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import { useRequirements } from '../../hooks/useRequirements';
import { ParentRequirement, RequirementStatus } from '../../services/requirementApi';

// ── Constants ─────────────────────────────────────────────────────────────────

type StatusFilter = RequirementStatus | 'all';

interface StatusTab {
  key: StatusFilter;
  label: string;
}

const STATUS_TABS: StatusTab[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'closed', label: 'Closed' },
  { key: 'expired', label: 'Expired' },
  { key: 'paused', label: 'Paused' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const getStatusColor = (status: RequirementStatus, theme: any): string => {
  const map: Record<RequirementStatus, string> = {
    active: theme.colors.success,
    closed: theme.colors.textTertiary,
    expired: theme.colors.error,
    paused: theme.colors.warning,
  };
  return map[status] || theme.colors.textTertiary;
};

const getStatusIcon = (status: RequirementStatus): string => {
  const map: Record<RequirementStatus, string> = {
    active: 'checkmark-circle-outline',
    closed: 'lock-closed-outline',
    expired: 'time-outline',
    paused: 'pause-circle-outline',
  };
  return map[status] || 'help-circle-outline';
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

// ── Screen ────────────────────────────────────────────────────────────────────

const RequirementsScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);

  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── API hook ──────────────────────────────────────────────────────────────
  const {
    requirements,
    counts,
    isLoading,
    isRefreshing,
    error,
    deletingId,
    refresh,
    retry,
    deleteRequirement,
    closeRequirement,
  } = useRequirements(token);

  // Session expiry handler
  useEffect(() => {
    if (error === 'Session expired. Please login again.') {
      dispatch(logout());
      Alert.alert('Session Expired', 'Please login again');
    }
  }, [error, dispatch]);

  // ── Client-side filter ────────────────────────────────────────────────────
  const filteredRequirements = requirements.filter(req => {
    const matchesTab = activeTab === 'all' || req.status === activeTab;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      req.subjects?.some(s => s.toLowerCase().includes(q)) ||
      req.studentDetails?.studentName?.toLowerCase().includes(q) ||
      req.studentDetails?.grade?.toLowerCase().includes(q) ||
      req.location?.city?.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDelete = (req: ParentRequirement) => {
    if (req.status === 'active') {
      Alert.alert(
        'Cannot Delete',
        'Close the requirement first before deleting it.',
        [{ text: 'OK' }],
      );
      return;
    }
    Alert.alert(
      'Delete Requirement',
      `Delete requirement for ${req.studentDetails?.studentName || 'this student'}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRequirement(req._id);
              Alert.alert('Deleted', 'Requirement removed successfully.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete requirement');
            }
          },
        },
      ],
    );
  };

  const handleClose = (req: ParentRequirement) => {
    Alert.alert(
      'Close Requirement',
      `Close requirement for ${req.studentDetails?.studentName || 'this student'}? Tutors will no longer see it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              await closeRequirement(req._id);
              Alert.alert('Closed', 'Requirement closed successfully.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to close requirement');
            }
          },
        },
      ],
    );
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderStatCards = () => (
    <View style={styles.statsRow}>
      {[
        { label: 'Total', count: counts.total, color: theme.colors.primary },
        { label: 'Active', count: counts.active, color: theme.colors.success },
        { label: 'Closed', count: counts.closed, color: theme.colors.textTertiary },
        { label: 'Expired', count: counts.expired, color: theme.colors.error },
      ].map(stat => (
        <View
          key={stat.label}
          style={[styles.statCard, { backgroundColor: stat.color + '15', borderColor: stat.color + '40' }]}
        >
          <Text style={[styles.statCount, { color: stat.color }]}>{stat.count}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );

  const renderTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabsContainer}
      contentContainerStyle={styles.tabsContent}
    >
      {STATUS_TABS.map(tab => {
        const isActive = activeTab === tab.key;
        const count = tab.key === 'all' ? counts.total : counts[tab.key as RequirementStatus] || 0;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              {
                backgroundColor: isActive ? theme.colors.primary : 'transparent',
                borderColor: isActive ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, { color: isActive ? theme.colors.textWhite : theme.colors.textSecondary }]}>
              {tab.label}
            </Text>
            {count > 0 && (
              <View style={[styles.countBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : theme.colors.primary + '20' }]}>
                <Text style={[styles.countText, { color: isActive ? theme.colors.textWhite : theme.colors.primary }]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderCard = ({ item: req }: { item: ParentRequirement }) => {
    const statusColor = getStatusColor(req.status, theme);
    const isDeleting = deletingId === req._id;

    return (
      <Card variant="elevated" margin="small" style={styles.requirementCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={getStatusIcon(req.status) as any} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            {formatDate(req.createdAt)}
          </Text>
        </View>

        {/* Student */}
        <Text style={[styles.studentName, { color: theme.colors.text }]}>
          {req.studentDetails?.studentName || 'Student'}
        </Text>
        <Text style={[styles.gradeText, { color: theme.colors.textSecondary }]}>
          {req.studentDetails?.grade}{req.studentDetails?.board ? ` • ${req.studentDetails.board}` : ''}
        </Text>

        {/* Subjects */}
        {req.subjects?.length > 0 && (
          <View style={styles.subjectsRow}>
            {req.subjects.map(s => (
              <View key={s} style={[styles.subjectChip, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={[styles.subjectChipText, { color: theme.colors.primary }]}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              ₹{req.budget?.minAmount || 0} – ₹{req.budget?.maxAmount || 0}/month
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {req.location?.city || '—'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="book-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {req.tuitionType ? req.tuitionType.charAt(0).toUpperCase() + req.tuitionType.slice(1) : '—'} tuition
            </Text>
          </View>
          {req.totalMatches > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={14} color={theme.colors.info} />
              <Text style={[styles.detailText, { color: theme.colors.info }]}>
                {req.totalMatches} tutor{req.totalMatches !== 1 ? 's' : ''} matched
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Button
            title="View"
            variant="outline"
            size="small"
            style={styles.actionButton}
            onPress={() => navigation.navigate('RequirementDetail', { requirementId: req._id })}
            icon="eye"
          />
          {req.status === 'active' && (
            <Button
              title="Close"
              variant="outline"
              size="small"
              style={styles.actionButton}
              onPress={() => handleClose(req)}
              icon="lock-closed"
            />
          )}
          <Button
            title={isDeleting ? 'Deleting…' : 'Delete'}
            variant="outline"
            size="small"
            loading={isDeleting}
            disabled={isDeleting}
            style={styles.actionButton}
            onPress={() => handleDelete(req)}
            icon="trash"
          />
        </View>
      </Card>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab !== 'all' ? 'funnel-outline' : 'document-text-outline'}
        size={64}
        color={theme.colors.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {activeTab !== 'all' ? `No ${activeTab} requirements` : 'No requirements posted yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {activeTab !== 'all'
          ? 'Try switching to a different tab'
          : 'Post your first requirement to start finding tutors'}
      </Text>
      {activeTab === 'all' && (
        <Button
          title="Post Requirement"
          variant="primary"
          size="small"
          onPress={() => navigation.navigate('PostRequirement')}
          style={{ marginTop: 16 }}
          icon="add"
        />
      )}
    </View>
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading requirements...
        </Text>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && error !== 'Session expired. Please login again.') {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 16 }]}>
          Unable to load requirements
        </Text>
        <Button title="Retry" onPress={retry} style={{ marginTop: 16 }} variant="primary" />
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Requirements</Text>
          <TouchableOpacity
            style={[styles.addIconButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('PostRequirement')}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {counts.total} {counts.total === 1 ? 'requirement' : 'requirements'} total
        </Text>
      </View>

      {/* Stat cards */}
      {renderStatCards()}

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search by subject, student, city…"
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status tabs */}
      {renderTabs()}

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsText, { color: theme.colors.textSecondary }]}>
          {filteredRequirements.length} {filteredRequirements.length === 1 ? 'result' : 'results'}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={filteredRequirements}
        renderItem={renderCard}
        keyExtractor={item => item._id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate('PostRequirement')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
        <Text style={styles.fabText}>Post Requirement</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 16, fontSize: 16 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  addIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statCount: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 2 },

  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  tabsContainer: { maxHeight: 56, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tabText: { fontSize: 13, fontWeight: '500' },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: { fontSize: 11, fontWeight: '600' },

  resultsHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  resultsText: { fontSize: 13 },

  listContainer: { padding: 8, paddingBottom: 24 },

  requirementCard: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  dateText: { fontSize: 12 },

  studentName: { fontSize: 17, fontWeight: '600', marginBottom: 2 },
  gradeText: { fontSize: 13, marginBottom: 8 },

  subjectsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  subjectChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  subjectChipText: { fontSize: 12, fontWeight: '500' },

  detailsContainer: { gap: 5, marginBottom: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, flex: 1 },

  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionButton: { flex: 1 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },

  fab: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default RequirementsScreen;
