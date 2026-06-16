import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { getContactRequestById, ContactRequest, RescheduleDemoPayload, CompleteDemoPayload } from '../../services/contactApi';
import { useTeacherContact } from '../../hooks/useContact';
import DemoStatusBadge from '../../components/teacher/DemoStatusBadge';
import DemoRescheduleModal from '../../components/teacher/DemoRescheduleModal';
import DemoFeedbackModal from '../../components/teacher/DemoFeedbackModal';
import { logout } from '../../redux/slices/authSlice';
import { useAppDispatch } from '../../redux/store';

// ── Analytics ────────────────────────────────────────────────────────────────
const trackEvent = (event: string, payload?: Record<string, any>) => {
  if (__DEV__) console.log(`[Analytics] ${event}`, payload || '');
};

// ── Route Params ─────────────────────────────────────────────────────────────
type RouteParams = { requestId: string };

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return dateStr; }
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

// ── Section Component ─────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; icon: string; iconColor: string; children: React.ReactNode }> = ({
  title, icon, iconColor, children,
}) => (
  <View style={sectionStyles.container}>
    <View style={sectionStyles.titleRow}>
      <View style={[sectionStyles.iconBg, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon as any} size={16} color={iconColor} />
      </View>
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
    {children}
  </View>
);

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    ...shadows.card,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  iconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});

// ── Info Row ──────────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ label: string; value: string; valueColor?: string }> = React.memo(({
  label, value, valueColor,
}) => (
  <View style={infoRowStyles.row}>
    <Text style={infoRowStyles.label}>{label}</Text>
    <Text style={[infoRowStyles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
  </View>
));

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1.5,
    textAlign: 'right',
  },
});

// ── Timeline ──────────────────────────────────────────────────────────────────
interface TimelineEntry {
  label: string;
  date: string;
  icon: string;
  iconColor: string;
  active: boolean;
}

const Timeline: React.FC<{ entries: TimelineEntry[] }> = ({ entries }) => (
  <View style={timelineStyles.container}>
    {entries.map((entry, i) => (
      <View key={i} style={timelineStyles.row}>
        <View style={timelineStyles.left}>
          <View style={[
            timelineStyles.dot,
            { backgroundColor: entry.active ? entry.iconColor : colors.border },
          ]}>
            <Ionicons name={entry.icon as any} size={10} color="#fff" />
          </View>
          {i < entries.length - 1 && (
            <View style={[
              timelineStyles.line,
              { backgroundColor: entry.active ? entry.iconColor + '40' : colors.border },
            ]} />
          )}
        </View>
        <View style={timelineStyles.right}>
          <Text style={[
            timelineStyles.label,
            { color: entry.active ? colors.text : colors.textSecondary },
          ]}>{entry.label}</Text>
          <Text style={timelineStyles.date}>{entry.date}</Text>
        </View>
      </View>
    ))}
  </View>
);

const timelineStyles = StyleSheet.create({
  container: { gap: 0 },
  row: { flexDirection: 'row', minHeight: 52 },
  left: { width: 28, alignItems: 'center' },
  dot: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 2,
    marginBottom: 0,
    alignSelf: 'center',
  },
  right: { flex: 1, paddingLeft: 12, paddingBottom: 10 },
  label: { fontSize: 13, fontWeight: '600' },
  date: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});

// ── Loading Skeleton ──────────────────────────────────────────────────────────
const DetailSkeleton: React.FC = () => (
  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
    {[1, 2, 3, 4].map(i => (
      <View key={i} style={[{ borderRadius: 14, padding: 16, marginBottom: 12, backgroundColor: colors.card }]}>
        <View style={{ width: '40%', height: 14, borderRadius: 4, backgroundColor: colors.backgroundSecondary, marginBottom: 14 }} />
        {[1, 2, 3].map(j => (
          <View key={j} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border + '40' }}>
            <View style={{ width: '30%', height: 12, borderRadius: 3, backgroundColor: colors.backgroundSecondary }} />
            <View style={{ width: '40%', height: 12, borderRadius: 3, backgroundColor: colors.backgroundSecondary }} />
          </View>
        ))}
      </View>
    ))}
  </ScrollView>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

const TeacherDemoRequestDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ DemoRequestDetail: RouteParams }, 'DemoRequestDetail'>>();
  const { requestId } = route.params;
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  const [request, setRequest] = useState<ContactRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { respondToRequest, rescheduleDemo, completeDemo, isResponding, responseError, clearResponseError } =
    useTeacherContact(token);

  const fetchDetail = useCallback(async (mode: 'initial' | 'refresh') => {
    if (!token) { setError('Authentication required'); setIsLoading(false); return; }
    if (mode === 'initial') setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const data = await getContactRequestById(token, requestId);
      setRequest(data.contactRequest);
      trackEvent('Demo Detail Viewed', { id: requestId });
    } catch (err: any) {
      setError(err?.message || 'Failed to load demo request');
      if (err?.message === 'Unauthorized') dispatch(logout());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, requestId, dispatch]);

  useEffect(() => { fetchDetail('initial'); }, [fetchDetail]);

  useEffect(() => {
    if (responseError) {
      Alert.alert('Error', responseError, [{ text: 'OK', onPress: clearResponseError }]);
    }
  }, [responseError, clearResponseError]);

  const handleAccept = useCallback(async () => {
    if (!request) return;
    Alert.alert('Accept Demo', 'Accept this demo request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept', onPress: async () => {
          const result = await respondToRequest(request._id, { status: 'accepted' });
          if (result) {
            setRequest(result);
            trackEvent('Demo Accepted', { id: request._id });
            Alert.alert('Accepted', 'Parent has been notified.');
          }
        },
      },
    ]);
  }, [request, respondToRequest]);

  const handleReject = useCallback(() => {
    if (!request) return;
    setRejectReason('');
    setRejectVisible(true);
  }, [request]);

  const handleRejectSubmit = useCallback(async () => {
    if (!request) return;
    const result = await respondToRequest(request._id, {
      status: 'rejected',
      responseMessage: rejectReason.trim() || 'Unable to accommodate this request.',
    });
    if (result) {
      setRequest(result);
      setRejectVisible(false);
      setRejectReason('');
      trackEvent('Demo Rejected', { id: request._id });
      Alert.alert('Rejected', 'Parent has been notified.');
    }
  }, [request, rejectReason, respondToRequest]);

  const handleRescheduleSubmit = useCallback(async (data: RescheduleDemoPayload) => {
    if (!request) return;
    const result = await rescheduleDemo(request._id, data);
    if (result) {
      setRequest(result);
      setRescheduleVisible(false);
      trackEvent('Demo Rescheduled', { id: request._id, newDate: data.newDate });
      Alert.alert('Rescheduled', 'Parent has been notified.');
    }
  }, [request, rescheduleDemo]);

  const handleFeedbackSubmit = useCallback(async (data: CompleteDemoPayload) => {
    if (!request) return;
    const result = await completeDemo(request._id, data);
    if (result) {
      setRequest(result);
      setFeedbackVisible(false);
      trackEvent('Demo Completed', { id: request._id, outcome: data.outcome });
      Alert.alert('Completed', 'Parent has been notified.');
    }
  }, [request, completeDemo]);

  const handleOpenMeetingLink = useCallback(() => {
    if (request?.meetingLink) {
      Linking.openURL(request.meetingLink).catch(() => Alert.alert('Error', 'Could not open link.'));
    }
  }, [request]);

  // Compute timeline
  const timelineEntries: TimelineEntry[] = request ? [
    {
      label: 'Request Created',
      date: formatDateTime(request.createdAt),
      icon: 'add-circle-outline',
      iconColor: colors.primary,
      active: true,
    },
    {
      label: request.status === 'accepted' || request.status === 'completed' ? 'Accepted' : 'Response',
      date: request.respondedAt ? formatDateTime(request.respondedAt) : 'Pending',
      icon: request.status === 'rejected' ? 'close-circle-outline' : 'checkmark-circle-outline',
      iconColor: request.status === 'rejected' ? colors.error : '#10B981',
      active: ['accepted', 'rejected', 'completed'].includes(request.status),
    },
    {
      label: 'Demo Scheduled',
      date: request.demoDate ? `${formatDate(request.demoDate)} ${request.demoTime || ''}`.trim() : 'Not scheduled',
      icon: 'calendar-outline',
      iconColor: colors.accent,
      active: !!request.demoDate,
    },
    {
      label: 'Demo Completed',
      date: request.demoFeedback?.completedAt ? formatDateTime(request.demoFeedback.completedAt) : 'Pending',
      icon: 'checkmark-done-outline',
      iconColor: '#3B82F6',
      active: request.status === 'completed',
    },
  ] : [];

  const parentName = (request as any)?.parentId?.profile?.parentName || '—';
  const parentPhone = (request as any)?.parentId?.profile?.mobileNumber || '—';
  const studentName = (request as any)?.requirementId?.studentDetails?.studentName || '—';
  const grade = (request as any)?.requirementId?.studentDetails?.grade || '—';
  const subjects = ((request as any)?.requirementId?.subjects || []) as string[];
  const city = (request as any)?.requirementId?.location?.city || '—';
  const area = (request as any)?.requirementId?.location?.area || '';
  const requirementId = (request as any)?.requirementId?.requirementId || '—';

  const canAccept = request && (request.status === 'pending' || request.status === 'rescheduled');
  const canReject = request && (request.status === 'pending' || request.status === 'accepted' || request.status === 'rescheduled');
  const canReschedule = request && (request.status === 'pending' || request.status === 'accepted');
  const canComplete = request && request.status === 'accepted';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Demo Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <DetailSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Demo Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load details</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDetail('initial')}>
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
        <Text style={styles.headerTitle}>Demo Details</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => fetchDetail('refresh')}>
          <Ionicons name="refresh-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchDetail('refresh')} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardLeft}>
            <View style={styles.demoIcon}>
              <Ionicons name="videocam-outline" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.statusCardReqId}>{requirementId}</Text>
              <Text style={styles.statusCardDate}>
                {formatDate(request.demoDate)} {request.demoTime ? `· ${request.demoTime}` : ''}
              </Text>
            </View>
          </View>
          <DemoStatusBadge status={request.status} />
        </View>

        {/* Requirement Details */}
        <Section title="Requirement Details" icon="document-text-outline" iconColor={colors.primary}>
          <InfoRow label="Requirement ID" value={requirementId} valueColor={colors.primary} />
          <InfoRow label="Subjects" value={subjects.join(', ') || '—'} />
          <InfoRow label="Class" value={grade} />
        </Section>

        {/* Parent Details */}
        <Section title="Parent Details" icon="people-outline" iconColor="#7C3AED">
          <InfoRow label="Parent Name" value={parentName} />
          <InfoRow label="Phone" value={parentPhone} />
        </Section>

        {/* Student Details */}
        <Section title="Student Details" icon="person-outline" iconColor="#059669">
          <InfoRow label="Student Name" value={studentName} />
          <InfoRow label="Class" value={grade} />
          {subjects.length > 0 && (
            <View style={styles.subjectsContainer}>
              <Text style={styles.subjectsLabel}>Subjects</Text>
              <View style={styles.subjectChips}>
                {subjects.map((s, i) => (
                  <View key={i} style={styles.subjectChip}>
                    <Text style={styles.subjectChipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Section>

        {/* Scheduled Time */}
        <Section title="Demo Schedule" icon="calendar-outline" iconColor={colors.accent}>
          <InfoRow label="Date" value={formatDate(request.demoDate)} />
          <InfoRow label="Time" value={request.demoTime || '—'} />
          <InfoRow label="Mode" value={request.demoMode === 'offline' ? 'Offline' : 'Online'} />
          <InfoRow label="Location" value={area ? `${area}, ${city}` : city} />
          {request.meetingLink && (
            <TouchableOpacity style={styles.meetingLinkBtn} onPress={handleOpenMeetingLink}>
              <Ionicons name="videocam-outline" size={14} color={colors.primary} />
              <Text style={styles.meetingLinkText}>Join Meeting</Text>
              <Ionicons name="open-outline" size={12} color={colors.primary} />
            </TouchableOpacity>
          )}
        </Section>

        {/* Notes */}
        {(request.demoNotes || request.message) && (
          <Section title="Notes" icon="chatbubble-outline" iconColor="#6B7280">
            {request.message && <Text style={styles.notesText}>{request.message}</Text>}
            {request.demoNotes && request.demoNotes !== request.message && (
              <Text style={styles.notesText}>{request.demoNotes}</Text>
            )}
          </Section>
        )}

        {/* Demo Feedback (if completed) */}
        {request.status === 'completed' && request.demoFeedback && (
          <Section title="Demo Feedback" icon="star-outline" iconColor="#F59E0B">
            <InfoRow
              label="Outcome"
              value={
                request.demoFeedback.outcome === 'interested' ? '✅ Interested' :
                request.demoFeedback.outcome === 'not_interested' ? '❌ Not Interested' :
                '🔄 Need Follow-up'
              }
            />
            {request.demoFeedback.notes && (
              <View style={styles.feedbackNotes}>
                <Text style={styles.feedbackNotesLabel}>Notes</Text>
                <Text style={styles.feedbackNotesText}>{request.demoFeedback.notes}</Text>
              </View>
            )}
            <InfoRow label="Completed On" value={formatDateTime(request.demoFeedback.completedAt)} />
          </Section>
        )}

        {/* Reschedule History */}
        {request.rescheduleHistory && request.rescheduleHistory.length > 0 && (
          <Section title="Reschedule History" icon="time-outline" iconColor="#8B5CF6">
            {request.rescheduleHistory.map((entry, i) => (
              <View key={i} style={styles.rescheduleEntry}>
                <Text style={styles.rescheduleIdx}>#{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rescheduleFrom}>
                    {formatDate(entry.previousDate)} {entry.previousTime} → {formatDate(entry.newDate)} {entry.newTime}
                  </Text>
                  {entry.reason && <Text style={styles.rescheduleReason}>{entry.reason}</Text>}
                  <Text style={styles.rescheduleBy}>by {entry.rescheduledBy} · {formatDateTime(entry.rescheduledAt)}</Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Timeline */}
        <Section title="Request Timeline" icon="git-branch-outline" iconColor="#3B82F6">
          <Timeline entries={timelineEntries} />
        </Section>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Action Bar */}
      {(canAccept || canReject || canReschedule || canComplete) && (
        <View style={styles.actionBar}>
          {canReschedule && (
            <TouchableOpacity
              style={[styles.actionBarBtn, styles.rescheduleBarBtn]}
              onPress={() => setRescheduleVisible(true)}
              disabled={isResponding}
            >
              {isResponding ? <ActivityIndicator size="small" color={colors.accent} /> : (
                <>
                  <Ionicons name="calendar-outline" size={16} color={colors.accent} />
                  <Text style={styles.rescheduleBarBtnText}>Reschedule</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {canReject && (
            <TouchableOpacity
              style={[styles.actionBarBtn, styles.rejectBarBtn]}
              onPress={handleReject}
              disabled={isResponding}
            >
              <Ionicons name="close-outline" size={16} color={colors.error} />
              <Text style={styles.rejectBarBtnText}>Reject</Text>
            </TouchableOpacity>
          )}
          {canComplete && (
            <TouchableOpacity
              style={[styles.actionBarBtn, styles.completeBarBtn]}
              onPress={() => setFeedbackVisible(true)}
              disabled={isResponding}
            >
              {isResponding ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
                  <Text style={styles.completeBarBtnText}>Mark Complete</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {canAccept && (
            <TouchableOpacity
              style={[styles.actionBarBtn, styles.acceptBarBtn]}
              onPress={handleAccept}
              disabled={isResponding}
            >
              {isResponding ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-outline" size={16} color="#fff" />
                  <Text style={styles.acceptBarBtnText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Reject Modal */}
      <Modal
        visible={rejectVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isResponding && setRejectVisible(false)}
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
                onPress={() => { setRejectVisible(false); setRejectReason(''); }}
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
        visible={rescheduleVisible}
        onClose={() => setRescheduleVisible(false)}
        onSubmit={handleRescheduleSubmit}
        isSubmitting={isResponding}
        currentDate={request.demoDate ? new Date(request.demoDate).toLocaleDateString('en-IN') : undefined}
        currentTime={request.demoTime}
      />
      <DemoFeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={isResponding}
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  headerSpacer: { width: 40 },
  content: { padding: 16 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    ...shadows.card,
  },
  statusCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  demoIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  statusCardReqId: { fontSize: 13, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  statusCardDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  subjectsContainer: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border + '50' },
  subjectsLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  subjectChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subjectChip: { backgroundColor: colors.primary + '12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  subjectChipText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  meetingLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '10',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  meetingLinkText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.primary },
  notesText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  feedbackNotes: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border + '50' },
  feedbackNotesLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  feedbackNotesText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  rescheduleEntry: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  rescheduleIdx: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: 2 },
  rescheduleFrom: { fontSize: 12, fontWeight: '600', color: colors.text },
  rescheduleReason: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rescheduleBy: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 16,
    gap: 8,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 5,
  },
  rescheduleBarBtn: {
    backgroundColor: colors.accent + '12',
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  rescheduleBarBtnText: { fontSize: 13, fontWeight: '600', color: colors.accent },
  rejectBarBtn: {
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '25',
  },
  rejectBarBtnText: { fontSize: 13, fontWeight: '600', color: colors.error },
  completeBarBtn: { backgroundColor: colors.primary },
  completeBarBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  acceptBarBtn: { backgroundColor: colors.success },
  acceptBarBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8 },
  errorSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 12 },
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
  rejectModalTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 },
  rejectModalSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
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
  rejectModalButtons: { flexDirection: 'row', gap: 10 },
  rejectModalBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 12,
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

export default React.memo(TeacherDemoRequestDetailScreen);
