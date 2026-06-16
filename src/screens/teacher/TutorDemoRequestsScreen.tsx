import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useTeacherContact } from '../../hooks/useContact';
import ContactHistoryCard from '../../components/parent/ContactHistoryCard';
import { PrimaryButton } from '../../components/ui';
import { ContactRequest, ContactStatus, RescheduleDemoPayload } from '../../services/contactApi';

// ── Skeleton Component ─────────────────────────────────────────────────────────

const RequestsSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.skeletonCard}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonContent}>
          <View style={[styles.skeletonBar, { width: '50%', height: 16 }]} />
          <View style={[styles.skeletonBar, { width: '40%', height: 12, marginTop: 8 }]} />
          <View style={[styles.skeletonBar, { width: '70%', height: 12, marginTop: 8 }]} />
        </View>
      </View>
    ))}
  </View>
);

// ── Empty State Component ─────────────────────────────────────────────────────

const EmptyState: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name="clipboard-outline" size={48} color={colors.primary} />
    </View>
    <Text style={styles.emptyTitle}>No Demo Requests Yet</Text>
    <Text style={styles.emptySubtitle}>
      When parents request demo classes with you, they will appear here.
    </Text>
    <TouchableOpacity style={styles.emptyButton} onPress={onRefresh}>
      <Text style={styles.emptyButtonText}>Refresh</Text>
    </TouchableOpacity>
  </View>
);

// ── Reschedule Modal Component ──────────────────────────────────────────────────

interface RescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: RescheduleDemoPayload) => void;
  isSubmitting: boolean;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = useCallback(() => {
    if (!newDate || !newTime) {
      Alert.alert('Error', 'Please enter both date and time');
      return;
    }
    onSubmit({ newDate, newTime, reason: reason || 'Rescheduled by tutor' });
    setNewDate('');
    setNewTime('');
    setReason('');
  }, [newDate, newTime, reason, onSubmit]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setNewDate('');
      setNewTime('');
      setReason('');
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Reschedule Demo</Text>
          <Text style={styles.modalSubtitle}>
            Propose a new date and time for this demo class.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={newDate}
              onChangeText={setNewDate}
              placeholder="2026-01-15"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Time</Text>
            <TextInput
              style={styles.input}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="04:00 PM"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reason (Optional)</Text>
            <TextInput
              style={styles.input}
              value={reason}
              onChangeText={setReason}
              placeholder="Explain why you need to reschedule..."
              multiline
              numberOfLines={2}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.textWhite} />
              ) : (
                <Text style={styles.submitButtonText}>Reschedule</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────

const TutorDemoRequestsScreen: React.FC = () => {
  const navigation = useNavigation();
  const token = useAppSelector(selectAuthToken);

  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);

  const {
    contactRequests,
    isLoading,
    isRefreshing,
    isResponding,
    error,
    refresh,
    respondToRequest,
    rescheduleDemo,
    clearResponseError,
  } = useTeacherContact(token);

  // Filter only demo requests
  const demoRequests = contactRequests.filter(r => r.contactType === 'demo');

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAccept = useCallback(async (request: ContactRequest) => {
    Alert.alert(
      'Accept Demo Request',
      `Accept demo request from ${request.parent?.profile?.parentName || 'parent'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            const result = await respondToRequest(request._id, { status: 'accepted' });
            if (result) {
              Alert.alert('Success', 'Demo request accepted!');
            }
          },
        },
      ]
    );
  }, [respondToRequest]);

  const handleReject = useCallback(async (request: ContactRequest) => {
    Alert.alert(
      'Decline Demo Request',
      `Are you sure you want to decline this demo request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            const result = await respondToRequest(request._id, {
              status: 'rejected',
              responseMessage: 'Unable to accommodate this request at this time.',
            });
            if (result) {
              Alert.alert('Request Declined', 'The parent has been notified.');
            }
          },
        },
      ]
    );
  }, [respondToRequest]);

  const handleReschedule = useCallback((request: ContactRequest) => {
    setSelectedRequest(request);
    setRescheduleModalVisible(true);
  }, []);

  const handleRescheduleSubmit = useCallback(async (data: RescheduleDemoPayload) => {
    if (!selectedRequest) return;
    
    const result = await rescheduleDemo(selectedRequest._id, data);
    if (result) {
      setRescheduleModalVisible(false);
      setSelectedRequest(null);
      Alert.alert('Success', 'Demo rescheduled. Parent will be notified.');
    }
  }, [selectedRequest, rescheduleDemo]);

  const renderItem = useCallback(({ item }: { item: ContactRequest }) => (
    <View style={styles.requestCard}>
      <ContactHistoryCard
        request={item}
        variant="teacher"
      />
      
      {/* Action Buttons */}
      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => handleAccept(item)}
            disabled={isResponding}
          >
            <Ionicons name="checkmark-outline" size={16} color={colors.textWhite} />
            <Text style={styles.actionBtnText}>Accept</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionBtn, styles.rescheduleBtn]}
            onPress={() => handleReschedule(item)}
            disabled={isResponding}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.rescheduleBtnText}>Reschedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleReject(item)}
            disabled={isResponding}
          >
            <Ionicons name="close-outline" size={16} color={colors.error} />
            <Text style={styles.rejectBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ), [handleAccept, handleReject, handleReschedule, isResponding]);

  const keyExtractor = useCallback((item: ContactRequest) => item._id, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Demo Requests</Text>
          <View style={styles.headerRight} />
        </View>
        <RequestsSkeleton />
      </SafeAreaView>
    );
  }

  if (error && demoRequests.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Demo Requests</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load requests</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Demo Requests</Text>
        <TouchableOpacity style={styles.headerRight} onPress={refresh}>
          <Ionicons name="refresh-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{demoRequests.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {demoRequests.filter(r => r.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {demoRequests.filter(r => r.status === 'accepted').length}
          </Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
      </View>

      {/* Content */}
      {demoRequests.length === 0 ? (
        <EmptyState onRefresh={refresh} />
      ) : (
        <FlatList
          data={demoRequests}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        visible={rescheduleModalVisible}
        onClose={() => {
          setRescheduleModalVisible(false);
          setSelectedRequest(null);
        }}
        onSubmit={handleRescheduleSubmit}
        isSubmitting={isResponding}
      />
    </SafeAreaView>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  requestCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    ...shadows.card,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 0,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  acceptBtn: {
    backgroundColor: colors.success,
  },
  rescheduleBtn: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  rejectBtn: {
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textWhite,
  },
  rescheduleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonCard: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 10,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonBar: {
    borderRadius: 4,
    backgroundColor: colors.backgroundSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textWhite,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textWhite,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    ...shadows.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textWhite,
  },
});

export default React.memo(TutorDemoRequestsScreen);
