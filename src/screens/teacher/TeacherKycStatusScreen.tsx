import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useTeacherKyc } from '../../hooks/useKyc';
import { KycStatus } from '../../services/kycApi';

// ─────────────────────────────────────────────────────────────────────────────
// Status Config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string; description: string }> = {
  not_started: { icon: 'document-outline', color: colors.textSecondary, label: 'Not Started', description: 'Upload your KYC documents to get verified.' },
  draft: { icon: 'create-outline', color: colors.accent, label: 'Draft', description: 'Documents uploaded but not yet submitted for review.' },
  submitted: { icon: 'time-outline', color: colors.info, label: 'Submitted', description: 'Your KYC is submitted and awaiting review. Typically takes 24-48 hours.' },
  under_review: { icon: 'eye-outline', color: colors.info, label: 'Under Review', description: 'An admin is currently reviewing your documents.' },
  approved: { icon: 'checkmark-circle', color: colors.success, label: 'Approved', description: 'Your KYC is verified! You are now a verified teacher on the platform.' },
  rejected: { icon: 'close-circle', color: '#EF4444', label: 'Rejected', description: 'Your KYC was not approved. Please review the reason and re-submit.' },
  reupload_required: { icon: 'refresh-circle', color: colors.accent, label: 'Re-upload Required', description: 'Some documents need to be re-uploaded. Check the notes below.' },
};

const TIMELINE_STEPS = [
  { key: 'created', label: 'KYC Created', icon: 'add-circle-outline' },
  { key: 'submitted', label: 'Documents Submitted', icon: 'cloud-upload-outline' },
  { key: 'reviewed', label: 'Admin Review', icon: 'eye-outline' },
  { key: 'completed', label: 'Verification Complete', icon: 'shield-checkmark-outline' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TeacherKycStatusScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    status,
    details,
    isLoading,
    isRefreshing,
    error,
    refresh,
    retry,
  } = useTeacherKyc();

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading status...</Text>
      </View>
    );
  }

  if (error && !status) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatus = status?.status || 'not_started';
  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.not_started;

  // Timeline progress
  const getTimelineStep = (): number => {
    switch (currentStatus) {
      case 'not_started': return 0;
      case 'draft': return 0;
      case 'submitted': return 1;
      case 'under_review': return 2;
      case 'approved': return 3;
      case 'rejected': return 2;
      case 'reupload_required': return 2;
      default: return 0;
    }
  };

  const timelineStep = getTimelineStep();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Status</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      >
        {/* Status Hero */}
        <View style={[styles.statusCard, { borderLeftColor: config.color }]}>
          <View style={[styles.statusIconCircle, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon as any} size={32} color={config.color} />
          </View>
          <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
          <Text style={styles.statusDescription}>{config.description}</Text>
        </View>

        {/* Key Dates */}
        <View style={styles.datesCard}>
          <Text style={styles.cardTitle}>Timeline</Text>
          {status?.submittedAt && (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.dateLabel}>Submitted:</Text>
              <Text style={styles.dateValue}>{new Date(status.submittedAt).toLocaleDateString('en-IN')}</Text>
            </View>
          )}
          {status?.reviewedAt && (
            <View style={styles.dateRow}>
              <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.dateLabel}>Reviewed:</Text>
              <Text style={styles.dateValue}>{new Date(status.reviewedAt).toLocaleDateString('en-IN')}</Text>
            </View>
          )}
          {status?.approvedAt && (
            <View style={styles.dateRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={styles.dateLabel}>Approved:</Text>
              <Text style={styles.dateValue}>{new Date(status.approvedAt).toLocaleDateString('en-IN')}</Text>
            </View>
          )}
          {status?.rejectedAt && (
            <View style={styles.dateRow}>
              <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.dateLabel}>Rejected:</Text>
              <Text style={styles.dateValue}>{new Date(status.rejectedAt).toLocaleDateString('en-IN')}</Text>
            </View>
          )}
          {!status?.submittedAt && !status?.reviewedAt && (
            <Text style={styles.noDataText}>No timeline events yet</Text>
          )}
        </View>

        {/* Rejection Reason */}
        {status?.rejectionReason && (
          <View style={styles.rejectionCard}>
            <View style={styles.rejectionHeader}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.rejectionTitle}>Rejection Reason</Text>
            </View>
            <Text style={styles.rejectionText}>{status.rejectionReason}</Text>
          </View>
        )}

        {/* Admin Notes */}
        {status?.verificationNotes && (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.info} />
              <Text style={styles.notesTitle}>Admin Notes</Text>
            </View>
            <Text style={styles.notesText}>{status.verificationNotes}</Text>
          </View>
        )}

        {/* Missing Documents */}
        {status?.missingDocuments && status.missingDocuments.length > 0 && currentStatus !== 'approved' && (
          <View style={styles.missingCard}>
            <Text style={styles.cardTitle}>Missing Documents</Text>
            {status.missingDocuments.map((doc, idx) => (
              <View key={idx} style={styles.missingRow}>
                <Ionicons name="warning-outline" size={16} color={colors.accent} />
                <Text style={styles.missingText}>{doc.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Progress Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.cardTitle}>Verification Progress</Text>
          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < timelineStep;
            const isCurrent = idx === timelineStep;
            const isRejected = (currentStatus === 'rejected' || currentStatus === 'reupload_required') && idx === timelineStep;

            return (
              <View key={step.key} style={styles.timelineRow}>
                <View style={styles.timelineLeftCol}>
                  <View style={[
                    styles.timelineDot,
                    isCompleted && styles.timelineDotCompleted,
                    isCurrent && !isRejected && styles.timelineDotCurrent,
                    isRejected && styles.timelineDotRejected,
                  ]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : (
                      <Ionicons name={step.icon as any} size={12} color={isCurrent ? '#FFFFFF' : colors.textSecondary} />
                    )}
                  </View>
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <View style={[styles.timelineLine, isCompleted && styles.timelineLineCompleted]} />
                  )}
                </View>
                <Text style={[
                  styles.timelineLabel,
                  isCompleted && styles.timelineLabelCompleted,
                  isCurrent && styles.timelineLabelCurrent,
                ]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          {(currentStatus === 'not_started' || currentStatus === 'draft' || currentStatus === 'reupload_required' || currentStatus === 'rejected') && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('TeacherKyc')}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {currentStatus === 'reupload_required' ? 'Re-upload Documents' : 'Upload Documents'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: colors.textSecondary, fontSize: 14 },
  errorText: { marginTop: 12, color: '#EF4444', fontSize: 14, textAlign: 'center' },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  scrollContent: { padding: 16 },

  statusCard: { backgroundColor: colors.card, borderRadius: 12, padding: 20, marginBottom: 16, borderLeftWidth: 4, alignItems: 'center' },
  statusIconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statusLabel: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  statusDescription: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  datesCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dateLabel: { fontSize: 13, color: colors.textSecondary, width: 80 },
  dateValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  noDataText: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },

  rejectionCard: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 16, marginBottom: 12 },
  rejectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rejectionTitle: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  rejectionText: { fontSize: 13, color: '#991B1B', lineHeight: 20 },

  notesCard: { backgroundColor: '#DBEAFE', borderRadius: 12, padding: 16, marginBottom: 12 },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  notesTitle: { fontSize: 14, fontWeight: '700', color: colors.info },
  notesText: { fontSize: 13, color: '#1E40AF', lineHeight: 20 },

  missingCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12 },
  missingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  missingText: { fontSize: 13, color: colors.accent, textTransform: 'capitalize' },

  timelineCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  timelineLeftCol: { alignItems: 'center', width: 30 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  timelineDotCompleted: { backgroundColor: colors.success },
  timelineDotCurrent: { backgroundColor: colors.info },
  timelineDotRejected: { backgroundColor: '#EF4444' },
  timelineLine: { width: 2, height: 20, backgroundColor: colors.border, marginVertical: 2 },
  timelineLineCompleted: { backgroundColor: colors.success },
  timelineLabel: { fontSize: 13, color: colors.textSecondary, marginLeft: 12, marginTop: 3 },
  timelineLabelCompleted: { color: colors.success, fontWeight: '600' },
  timelineLabelCurrent: { color: colors.text, fontWeight: '600' },

  actionsCard: { marginBottom: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, gap: 8 },
  actionButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});

export default TeacherKycStatusScreen;
