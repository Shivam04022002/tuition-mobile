import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import { TeacherApplication } from '../../services/teacherApi';
import { getTeacherApplicationById, withdrawApplication } from '../../services/applicationApi';
import ApplicationTimeline from '../../components/teacher/ApplicationTimeline';

// ── Route Params ───────────────────────────────────────────────────────────────
type RouteParams = {
  ApplicationDetail: {
    applicationId: string;
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
type ApplicationStatus = 'pending' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn';

const getStatusConfig = (status: ApplicationStatus) => {
  const configs: Record<ApplicationStatus, { color: string; icon: string; label: string; description: string }> = {
    pending: {
      color: colors.warning,
      icon: 'time-outline',
      label: 'Application Pending',
      description: 'Your application is under review by the parent',
    },
    shortlisted: {
      color: colors.info,
      icon: 'star-outline',
      label: 'Shortlisted',
      description: 'Parent has shortlisted your application. A demo may be scheduled soon.',
    },
    rejected: {
      color: colors.error,
      icon: 'close-circle-outline',
      label: 'Not Selected',
      description: 'Parent has chosen another tutor for this requirement',
    },
    accepted: {
      color: colors.success,
      icon: 'checkmark-circle-outline',
      label: 'Selected!',
      description: 'Congratulations! You have been selected for this tuition.',
    },
    withdrawn: {
      color: colors.textSecondary,
      icon: 'remove-circle-outline',
      label: 'Withdrawn',
      description: 'You withdrew this application',
    },
  };
  return configs[status] || configs.pending;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const tuitionLabel = (type?: string): string =>
  type ? ({ home: 'Home Tuition', online: 'Online', group: 'Group', crash: 'Crash Course' }[type] || type) : '—';

// ── Components ────────────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <View style={sectionStyles.container}>
    <View style={sectionStyles.header}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
    {children}
  </View>
);

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
});

const InfoRow: React.FC<{ label: string; value: string | number; chip?: boolean; chipColor?: string }> = ({
  label,
  value,
  chip,
  chipColor,
}) => (
  <View style={infoRowStyles.row}>
    <Text style={infoRowStyles.label}>{label}</Text>
    {chip ? (
      <View style={[infoRowStyles.chip, { backgroundColor: (chipColor || colors.primary) + '18', borderColor: (chipColor || colors.primary) + '40' }]}>
        <Text style={[infoRowStyles.chipText, { color: chipColor || colors.primary }]}>{value}</Text>
      </View>
    ) : (
      <Text style={infoRowStyles.value}>{value}</Text>
    )}
  </View>
);

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

const Skeleton: React.FC = () => (
  <View style={skeletonStyles.container}>
    {[1, 2, 3, 4].map((i) => (
      <View key={i} style={skeletonStyles.card}>
        <View style={skeletonStyles.header} />
        <View style={skeletonStyles.line} />
        <View style={skeletonStyles.line} />
        <View style={skeletonStyles.lineShort} />
      </View>
    ))}
  </View>
);

const skeletonStyles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    width: '40%',
    height: 16,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 12,
  },
  line: {
    width: '100%',
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginTop: 8,
  },
  lineShort: {
    width: '60%',
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginTop: 8,
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

const TeacherApplicationDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'ApplicationDetail'>>();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);

  const { applicationId } = route.params;

  const [application, setApplication] = useState<TeacherApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApplication = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!token) return;

    if (mode === 'initial') setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const data = await getTeacherApplicationById(token, applicationId);
      setApplication(data);
    } catch (err: any) {
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
        return;
      }
      setError(err?.message || 'Failed to load application');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, applicationId, dispatch]);

  useEffect(() => {
    fetchApplication('initial');
  }, [fetchApplication]);

  const handleWithdraw = useCallback(() => {
    if (!application || !token) return;

    Alert.alert(
      'Withdraw Application?',
      `Are you sure you want to withdraw your application for ${application.parentRequirement?.studentDetails?.studentName || 'this student'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            setIsWithdrawing(true);
            try {
              await withdrawApplication(token, applicationId);
              await fetchApplication('refresh');
              Alert.alert('Success', 'Application withdrawn successfully');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to withdraw application');
            } finally {
              setIsWithdrawing(false);
            }
          },
        },
      ],
    );
  }, [application, applicationId, token, fetchApplication]);

  const handleViewRequirement = useCallback(() => {
    if (!application?.parentRequirementId) return;
    const req = application.parentRequirementId as any;
    const reqId = typeof req === 'string' ? req : req?._id;
    if (reqId) {
      navigation.navigate('RequirementDetail', { requirementId: reqId });
    }
  }, [application, navigation]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Application Details" />
        <Skeleton />
      </View>
    );
  }

  if (error || !application) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Application Details" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load application</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchApplication('initial')}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const status = application.status as ApplicationStatus;
  const statusConfig = getStatusConfig(status);
  const canWithdraw = status === 'pending';

  const req = application.parentRequirementId;
  const parent = application.parentId;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Application Details" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchApplication('refresh')} tintColor={colors.primary} />}
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: statusConfig.color + '40' }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIconBox, { backgroundColor: statusConfig.color + '15' }]}>
              <Ionicons name={statusConfig.icon as any} size={28} color={statusConfig.color} />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusLabel, { color: statusConfig.color }]}>{statusConfig.label}</Text>
              <Text style={styles.statusDescription}>{statusConfig.description}</Text>
            </View>
          </View>
          <View style={styles.appIdRow}>
            <Text style={styles.appIdLabel}>Application ID:</Text>
            <Text style={styles.appIdValue}>{application.applicationId}</Text>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.dateText}>Submitted on {formatDate(application.createdAt)}</Text>
          </View>
        </View>

        {/* Requirement Details */}
        {req && (
          <Section title="Requirement Details" icon="school-outline">
            <InfoRow label="Requirement ID" value={typeof req === 'string' ? req : (req as any).requirementId || '—'} />
            <InfoRow label="Student" value={typeof req === 'string' ? '—' : (req as any).studentDetails?.studentName || '—'} />
            <InfoRow label="Grade" value={typeof req === 'string' ? '—' : (req as any).studentDetails?.grade || '—'} />
            <InfoRow
              label="Subjects"
              value={typeof req === 'string' ? '—' : (req as any).subjects?.slice(0, 2).join(', ') || '—'}
            />
            <InfoRow label="Mode" value={tuitionLabel(typeof req === 'string' ? undefined : (req as any).tuitionType)} chip chipColor={colors.secondary} />
            <InfoRow label="Location" value={typeof req === 'string' ? '—' : (req as any).location?.city || '—'} />
            {typeof req !== 'string' && (req as any).budget && (
              <InfoRow
                label="Budget"
                value={`₹${(req as any).budget.minAmount?.toLocaleString() || 0}–₹${(req as any).budget.maxAmount?.toLocaleString() || 0}/mo`}
              />
            )}

            <TouchableOpacity style={styles.viewRequirementBtn} onPress={handleViewRequirement}>
              <Text style={styles.viewRequirementText}>View Full Requirement</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </Section>
        )}

        {/* Application Details */}
        <Section title="Your Application" icon="document-text-outline">
          {application.message ? (
            <View style={styles.messageContainer}>
              <Text style={styles.messageLabel}>Cover Message</Text>
              <Text style={styles.messageText}>{application.message}</Text>
            </View>
          ) : (
            <Text style={styles.noMessageText}>No cover message provided</Text>
          )}

          {application.proposedFee && (
            <View style={styles.proposedFeeContainer}>
              <Text style={styles.proposedFeeLabel}>Your Proposed Fee</Text>
              <Text style={styles.proposedFeeValue}>₹{application.proposedFee.toLocaleString()}/month</Text>
            </View>
          )}
        </Section>

        {/* Timeline */}
        <Section title="Application Timeline" icon="time-outline">
          <ApplicationTimeline
            currentStatus={status}
            createdAt={application.createdAt}
            shortlistedAt={application.shortlistedAt}
            rejectedAt={application.rejectedAt}
            acceptedAt={application.acceptedAt}
            rejectionReason={application.rejectionReason}
            viewedByParent={application.viewedByParent}
            viewedAt={application.viewedAt}
            demoScheduled={application.demoScheduled}
            demoDetails={application.demoId ? {
              demoId: (application.demoId as any)?.demoId,
              scheduledDate: (application.demoId as any)?.scheduledDate,
              scheduledTime: (application.demoId as any)?.scheduledTime,
              duration: (application.demoId as any)?.duration,
              mode: (application.demoId as any)?.mode,
              status: (application.demoId as any)?.status,
            } : undefined}
          />
        </Section>

        {/* Parent Info (only if shortlisted/accepted) */}
        {(status === 'shortlisted' || status === 'accepted') && parent && typeof parent !== 'string' && (
          <Section title="Parent Contact" icon="person-outline">
            <InfoRow label="Name" value={(parent as any).profile?.parentName || '—'} />
            <InfoRow label="Phone" value={(parent as any).profile?.mobileNumber || '—'} />
            <Text style={styles.contactNote}>
              Contact details are shared once your application is shortlisted or accepted.
            </Text>
          </Section>
        )}

        {/* Match Breakdown Section */}
        <Section title="Match Analysis" icon="fitness-outline">
          <View style={styles.matchContainer}>
            {/* Overall Match Score */}
            <View style={styles.matchScoreBox}>
              <Text style={styles.matchScoreLabel}>Match Score</Text>
              <Text style={styles.matchScoreValue}>85%</Text>
              <Text style={styles.matchScoreSubtext}>Good Match</Text>
            </View>
            
            {/* Breakdown Items */}
            <View style={styles.breakdownList}>
              {[
                { label: 'Subject', score: 100, color: '#10B981' },
                { label: 'Class/Grade', score: 90, color: '#10B981' },
                { label: 'Location', score: 80, color: '#F59E0B' },
                { label: 'Budget', score: 75, color: '#F59E0B' },
                { label: 'Teaching Mode', score: 95, color: '#10B981' },
              ].map((item, index) => (
                <View key={index} style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>{item.label}</Text>
                  <View style={styles.breakdownBarContainer}>
                    <View 
                      style={[
                        styles.breakdownBar, 
                        { 
                          width: `${item.score}%`, 
                          backgroundColor: item.color 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.breakdownScore, { color: item.color }]}>
                    {item.score}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Section>

        {/* Demo Details Section */}
        {application.demoScheduled && application.demoId && (
          <Section title="Demo Class Details" icon="videocam-outline">
            <InfoRow 
              label="Status" 
              value={((application.demoId as any)?.status || 'Scheduled').replace('_', ' ').toUpperCase()} 
              chip 
              chipColor={
                (application.demoId as any)?.status === 'completed' ? colors.success :
                (application.demoId as any)?.status === 'cancelled' ? colors.error :
                colors.info
              } 
            />
            <InfoRow 
              label="Date" 
              value={formatDate((application.demoId as any)?.scheduledDate)} 
            />
            <InfoRow 
              label="Time" 
              value={(application.demoId as any)?.scheduledTime || 'TBD'} 
            />
            <InfoRow 
              label="Duration" 
              value={`${(application.demoId as any)?.duration || 60} minutes`} 
            />
            <InfoRow 
              label="Mode" 
              value={(application.demoId as any)?.mode === 'online' ? 'Online' : 'Offline'} 
              chip 
              chipColor={colors.secondary}
            />
            {(application.demoId as any)?.meetingDetails?.meetingLink && (
              <InfoRow 
                label="Meeting Link" 
                value={(application.demoId as any).meetingDetails.meetingLink}
              />
            )}
            {(application.demoId as any)?.feedback?.parentFeedback && (
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackLabel}>Parent Feedback</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {(application.demoId as any).feedback.parentFeedback.rating}/5
                  </Text>
                </View>
                {(application.demoId as any).feedback.parentFeedback.comments && (
                  <Text style={styles.feedbackText}>
                    "{(application.demoId as any).feedback.parentFeedback.comments}"
                  </Text>
                )}
              </View>
            )}
          </Section>
        )}
      </ScrollView>

      {/* Action Footer */}
      {canWithdraw && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.withdrawButton, isWithdrawing && styles.withdrawButtonDisabled]}
            onPress={handleWithdraw}
            disabled={isWithdrawing}
          >
            {isWithdrawing ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Ionicons name="remove-circle-outline" size={18} color={colors.error} />
                <Text style={styles.withdrawButtonText}>Withdraw Application</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const ScreenHeader: React.FC<{ onBack: () => void; title: string }> = ({ onBack, title }) => (
  <View style={headerStyles.container}>
    <TouchableOpacity onPress={onBack} style={headerStyles.backBtn}>
      <Ionicons name="arrow-back" size={22} color={colors.text} />
    </TouchableOpacity>
    <Text style={headerStyles.title}>{title}</Text>
    <View style={headerStyles.right} />
  </View>
);

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  right: {
    width: 30,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  errorSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 20,
    gap: 6,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '800',
  },
  statusDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  appIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  appIdLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  appIdValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    marginLeft: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  viewRequirementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewRequirementText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  messageContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    padding: 12,
  },
  messageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  noMessageText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  proposedFeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  proposedFeeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  proposedFeeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  contactNote: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  demoNote: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  withdrawButtonDisabled: {
    opacity: 0.6,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  // Match Breakdown Styles
  matchContainer: {
    paddingVertical: 8,
  },
  matchScoreBox: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 16,
  },
  matchScoreLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  matchScoreValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.success,
  },
  matchScoreSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  breakdownList: {
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownLabel: {
    width: 100,
    fontSize: 13,
    color: colors.textSecondary,
  },
  breakdownBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownScore: {
    width: 40,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  // Demo Feedback Styles
  feedbackContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
  },
  feedbackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});

export default TeacherApplicationDetailScreen;
