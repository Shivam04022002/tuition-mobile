import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useVerificationQueue } from '../../hooks/useStaffPortal';
import { VerificationTeacher } from '../../services/staffApi';

const STATUS_CONFIG = {
  pending:  { color: colors.accent,  bg: colors.accent  + '18', icon: 'time-outline' as const },
  verified: { color: colors.success, bg: colors.success + '18', icon: 'checkmark-circle-outline' as const },
  rejected: { color: colors.error,   bg: colors.error   + '18', icon: 'close-circle-outline' as const },
};

const FILTER_OPTIONS = ['All', 'Pending', 'Verified', 'Rejected'];
const FILTER_MAP: Record<string, 'pending' | 'verified' | 'rejected' | undefined> = {
  All: undefined,
  Pending: 'pending',
  Verified: 'verified',
  Rejected: 'rejected',
};

const StaffVerificationQueueScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const {
    teachers,
    counts,
    isLoading,
    isRefreshing,
    error,
    search,
    setSearch,
    refresh,
    retry,
    handleApprove,
    handleReject,
  } = useVerificationQueue();

  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedTeacher, setSelectedTeacher] = useState<VerificationTeacher | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectInput, setRejectInput] = useState('');
  const [isActioning, setIsActioning] = useState(false);

  const filtered = useMemo(() => {
    const statusKey = FILTER_MAP[activeFilter];
    return teachers.filter((t) => {
      const matchFilter = !statusKey || t.verificationStatus === statusKey;
      return matchFilter;
    });
  }, [teachers, activeFilter]);

  const displayCounts = {
    All: teachers.length,
    Pending: counts?.pending ?? 0,
    Verified: counts?.verified ?? 0,
    Rejected: counts?.rejected ?? 0,
  };

  const openDetails = (teacher: VerificationTeacher) => {
    setSelectedTeacher(teacher);
    setRejectInput('');
    setModalVisible(true);
  };

  const onApprove = async (teacher: VerificationTeacher) => {
    setIsActioning(true);
    try {
      await handleApprove(teacher._id);
      Alert.alert('Approved', `${teacher.basicDetails.fullName} has been approved.`);
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to approve teacher');
    } finally {
      setIsActioning(false);
    }
  };

  const onReject = async (teacher: VerificationTeacher) => {
    const reason = rejectInput.trim();
    if (!reason) {
      Alert.alert('Required', 'Please enter a rejection reason.');
      return;
    }
    setIsActioning(true);
    try {
      await handleReject(teacher._id, reason);
      Alert.alert('Rejected', `${teacher.basicDetails.fullName} has been rejected.`);
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to reject teacher');
    } finally {
      setIsActioning(false);
    }
  };

  const renderTeacher = ({ item }: { item: VerificationTeacher }) => {
    const cfg = STATUS_CONFIG[item.verificationStatus] ?? STATUS_CONFIG.pending;
    const statusLabel = item.verificationStatus.charAt(0).toUpperCase() + item.verificationStatus.slice(1);
    const subjects = item.teachingDetails?.subjects?.join(', ') || '—';
    const city = item.locationAvailability?.city || '—';
    const education = item.education?.highestQualification || '—';
    const docKeys = item.verificationDocuments ? Object.keys(item.verificationDocuments).filter((k) => item.verificationDocuments![k]) : [];
    const submittedAt = new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.basicDetails.fullName.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.basicDetails.fullName}</Text>
            <Text style={styles.subject}>{subjects}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={12} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.detailText}>{city}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="school-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.detailText}>{education}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.detailText}>{docKeys.length > 0 ? `${docKeys.length} documents` : 'No documents'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.detailText}>Submitted {submittedAt}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.info + '15', borderColor: colors.info + '30' }]}
            onPress={() => openDetails(item)}
          >
            <Ionicons name="document-outline" size={14} color={colors.info} />
            <Text style={[styles.actionBtnText, { color: colors.info }]}>View Docs</Text>
          </TouchableOpacity>
          {item.verificationStatus === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}
                onPress={() => onApprove(item)}
              >
                <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                <Text style={[styles.actionBtnText, { color: colors.success }]}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}
                onPress={() => openDetails(item)}
              >
                <Ionicons name="close-circle-outline" size={14} color={colors.error} />
                <Text style={[styles.actionBtnText, { color: colors.error }]}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
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
          <Text style={styles.headerTitle}>Verification Queue</Text>
          <Text style={styles.headerSub}>{counts?.pending ?? 0} pending review</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#FFF" />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teachers, subjects..."
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
                {displayCounts[f as keyof typeof displayCounts] ?? 0}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {isLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.stateText}>Loading verifications...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={styles.stateText}>Unable to load verifications</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={retry} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i._id}
          renderItem={renderTeacher}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.accent]} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="shield-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No teachers awaiting verification</Text>
            </View>
          }
        />
      )}

      {/* Document / Action Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {selectedTeacher?.basicDetails.fullName}
            </Text>
            <Text style={styles.modalSub}>
              {selectedTeacher?.teachingDetails?.subjects?.join(', ') || '—'} • {selectedTeacher?.locationAvailability?.city || '—'}
            </Text>

            {/* Documents */}
            <View style={styles.docList}>
              {selectedTeacher?.verificationDocuments && Object.keys(selectedTeacher.verificationDocuments).filter((k) => selectedTeacher.verificationDocuments![k]).length > 0 ? (
                Object.keys(selectedTeacher.verificationDocuments)
                  .filter((k) => selectedTeacher.verificationDocuments![k])
                  .map((doc) => (
                    <View key={doc} style={styles.docRow}>
                      <View style={styles.docIcon}>
                        <Ionicons name="document-text-outline" size={18} color={colors.accent} />
                      </View>
                      <Text style={styles.docName}>{doc.replace(/([A-Z])/g, ' $1').trim()}</Text>
                      <View style={[styles.docStatus, { backgroundColor: colors.success + '18' }]}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                        <Text style={[styles.docStatusText, { color: colors.success }]}>Uploaded</Text>
                      </View>
                    </View>
                  ))
              ) : (
                <View style={styles.empty}>
                  <Ionicons name="document-outline" size={32} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { fontSize: 13 }]}>No documents uploaded</Text>
                </View>
              )}
            </View>

            {/* Reject reason input (only for pending) */}
            {selectedTeacher?.verificationStatus === 'pending' && (
              <View style={styles.rejectInputWrap}>
                <TextInput
                  style={styles.rejectInput}
                  placeholder="Rejection reason (required to reject)"
                  placeholderTextColor={colors.textTertiary}
                  value={rejectInput}
                  onChangeText={setRejectInput}
                  multiline
                  numberOfLines={2}
                />
              </View>
            )}

            {selectedTeacher?.verificationStatus === 'pending' && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtnReject, isActioning && { opacity: 0.6 }]}
                  onPress={() => selectedTeacher && onReject(selectedTeacher)}
                  disabled={isActioning}
                >
                  {isActioning ? <ActivityIndicator size="small" color={colors.error} /> : <Ionicons name="close-circle-outline" size={18} color={colors.error} />}
                  <Text style={[styles.modalBtnText, { color: colors.error }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtnApprove, isActioning && { opacity: 0.6 }]}
                  onPress={() => selectedTeacher && onApprove(selectedTeacher)}
                  disabled={isActioning}
                >
                  {isActioning ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />}
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Approve</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.accent,
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
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.80)', marginTop: 2 },
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
  filterTabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterTabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTabTextActive: { color: '#FFF' },
  filterCount: { backgroundColor: colors.backgroundSecondary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterCountText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  filterCountTextActive: { color: '#FFF' },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 12 },
  card: {
    backgroundColor: colors.card, borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: colors.border,
    ...shadows.sm, gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: colors.accent + '18',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: colors.accent },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  subject: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardDetails: { gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 12, color: colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textTertiary, fontWeight: '600' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 16,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalSub: { fontSize: 13, color: colors.textSecondary },
  docList: { gap: 10 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.accent + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  docName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  docStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  docStatusText: { fontSize: 11, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalBtnReject: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  modalBtnApprove: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: colors.success,
  },
  modalBtnText: { fontSize: 14, fontWeight: '700' },
  modalClose: { alignItems: 'center', paddingVertical: 8 },
  modalCloseText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },

  centeredState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 60 },
  stateText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  retryBtn: {
    marginTop: 4, paddingHorizontal: 28, paddingVertical: 10,
    backgroundColor: colors.accent, borderRadius: 12,
  },
  retryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  rejectInputWrap: {
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary, padding: 2,
  },
  rejectInput: {
    fontSize: 13, color: colors.text,
    paddingHorizontal: 12, paddingVertical: 8, minHeight: 56,
    textAlignVertical: 'top',
  },
});

export default StaffVerificationQueueScreen;
