import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { getApplicationById, type ParentApplication } from '../../services/applicationApi';
import { ProfileAvatar, PrimaryButton } from '../../components/ui';

interface RouteParams {
  applicationId: string;
  onShortlist?: () => void;
  onReject?: () => void;
  onAccept?: () => void;
  onScheduleDemo?: () => void;
}

const ApplicationDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { applicationId, onShortlist, onReject, onAccept, onScheduleDemo } = route.params as RouteParams;
  const token = useAppSelector(selectAuthToken);

  const [application, setApplication] = useState<ParentApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  const fetchApplication = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await getApplicationById(token, applicationId);
      setApplication(response.application);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load application');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, applicationId]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchApplication();
  }, [fetchApplication]);

  const handleShortlist = useCallback(() => {
    Alert.alert(
      'Shortlist Tutor',
      'Shortlist this tutor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Shortlist',
          onPress: () => {
            onShortlist?.();
            navigation.goBack();
          },
        },
      ]
    );
  }, [navigation, onShortlist]);

  const handleReject = useCallback(() => {
    if (!showRejectionInput) {
      setShowRejectionInput(true);
      return;
    }

    Alert.alert(
      'Reject Tutor',
      'Reject this tutor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            onReject?.();
            navigation.goBack();
          },
        },
      ]
    );
  }, [navigation, onReject, showRejectionInput]);

  const handleAccept = useCallback(() => {
    Alert.alert(
      'Select Tutor',
      'Select this tutor? The requirement will be closed and classes will be scheduled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select',
          onPress: () => {
            onAccept?.();
            navigation.goBack();
          },
        },
      ]
    );
  }, [navigation, onAccept]);

  const handleScheduleDemo = useCallback(() => {
    navigation.navigate('DemoScheduling', {
      applicationId,
      tutorName: application?.teacherProfileId?.basicDetails?.fullName || 'Tutor',
      onComplete: () => {
        onScheduleDemo?.();
        fetchApplication();
      },
    });
  }, [navigation, applicationId, application, onScheduleDemo, fetchApplication]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return colors.warning ?? '#F59E0B';
      case 'shortlisted': return colors.info ?? '#3B82F6';
      case 'rejected': return colors.error;
      case 'accepted': return colors.success;
      case 'withdrawn': return colors.textTertiary;
      default: return colors.textTertiary;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'Applied';
      case 'shortlisted': return 'Shortlisted';
      case 'rejected': return 'Rejected';
      case 'accepted': return 'Selected';
      case 'withdrawn': return 'Withdrawn';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading application...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !application) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error || 'Application not found'}</Text>
          <PrimaryButton
            label="Retry"
            onPress={fetchApplication}
            variant="outline"
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const tutor = application.teacherProfileId;
  const tutorName = tutor?.basicDetails?.fullName || 'Unknown';
  const profilePhoto = tutor?.basicDetails?.profilePhoto || '';
  const bio = tutor?.basicDetails?.bio || 'No bio available';
  const languages = tutor?.basicDetails?.languages || [];
  const subjects = tutor?.teachingDetails?.subjects || [];
  const classes = tutor?.teachingDetails?.classes || [];
  const teachingModes = tutor?.teachingDetails?.teachingModes || [];
  const education = tutor?.education?.highestQualification || 'Not specified';
  const institutions = tutor?.education?.institutions || [];
  const hourlyRate = tutor?.pricingRevenue?.hourlyRate || 0;
  const experience = tutor?.pricingRevenue?.experienceYears || 0;
  const rating = tutor?.stats?.averageRating || 0;
  const totalReviews = tutor?.stats?.totalReviews || 0;
  const verificationStatus = tutor?.verificationStatus || 'pending';

  const requirement = application.parentRequirementId;
  const studentName = requirement?.studentDetails?.studentName || 'Student';
  const grade = requirement?.studentDetails?.grade || '';
  const reqSubjects = requirement?.subjects || [];

  const canShortlist = application.status === 'pending';
  const canReject = application.status === 'pending' || application.status === 'shortlisted';
  const canAccept = application.status === 'shortlisted' || application.status === 'pending';
  const canScheduleDemo = application.status !== 'rejected' && application.status !== 'withdrawn';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Tutor Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <ProfileAvatar name={tutorName} imageUri={profilePhoto} size={80} />
            <View style={styles.profileInfo}>
              <Text style={styles.tutorName}>{tutorName}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                <Text style={styles.reviewText}>({totalReviews} reviews)</Text>
                {verificationStatus === 'verified' && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.experienceText}>{experience} years experience</Text>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(application.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
              {getStatusLabel(application.status)}
            </Text>
            {application.demoScheduled && (
              <View style={styles.demoBadge}>
                <Ionicons name="videocam-outline" size={12} color={colors.info} />
                <Text style={styles.demoBadgeText}>Demo Scheduled</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Tutor</Text>
          <Text style={styles.bioText}>{bio}</Text>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={20} color={colors.primary} />
            <Text style={styles.detailLabel}>Hourly Rate</Text>
            <Text style={styles.detailValue}>₹{hourlyRate}/hr</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="school-outline" size={20} color={colors.primary} />
            <Text style={styles.detailLabel}>Education</Text>
            <Text style={styles.detailValue}>{education}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="language-outline" size={20} color={colors.primary} />
            <Text style={styles.detailLabel}>Languages</Text>
            <Text style={styles.detailValue}>{languages.slice(0, 2).join(', ') || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.detailLabel}>Applied</Text>
            <Text style={styles.detailValue}>
              {new Date(application.createdAt).toLocaleDateString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Subjects */}
        {subjects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subjects</Text>
            <View style={styles.chipContainer}>
              {subjects.map((subject, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{subject}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Classes */}
        {classes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Classes</Text>
            <View style={styles.chipContainer}>
              {classes.map((cls, index) => (
                <View key={index} style={[styles.chip, styles.chipSecondary]}>
                  <Text style={[styles.chipText, styles.chipTextSecondary]}>{cls}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Teaching Modes */}
        {teachingModes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teaching Modes</Text>
            <View style={styles.chipContainer}>
              {teachingModes.map((mode, index) => (
                <View key={index} style={[styles.chip, styles.chipOutline]}>
                  <Text style={styles.chipText}>{mode}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Institutions */}
        {institutions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {institutions.map((inst, index) => (
              <View key={index} style={styles.institutionItem}>
                <Ionicons name="school" size={16} color={colors.textSecondary} />
                <View style={styles.institutionInfo}>
                  <Text style={styles.institutionName}>{inst.name}</Text>
                  <Text style={styles.institutionDegree}>{inst.degree}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Applied Requirement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Applied For</Text>
          <View style={styles.requirementCard}>
            <Text style={styles.reqStudent}>{studentName} {grade && `• ${grade}`}</Text>
            <Text style={styles.reqSubjects}>{reqSubjects.join(', ')}</Text>
            {application.message && (
              <View style={styles.messageBox}>
                <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.messageText}>{application.message}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Proposed Details */}
        {application.proposedFee && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proposed Fee</Text>
            <Text style={styles.proposedFee}>₹{application.proposedFee}/month</Text>
          </View>
        )}

        {/* Rejection Reason Input */}
        {showRejectionInput && canReject && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rejection Reason (Optional)</Text>
            <TextInput
              style={styles.rejectionInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter reason for rejection..."
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {canShortlist && (
            <PrimaryButton
              label="Shortlist Tutor"
              onPress={handleShortlist}
              variant="primary"
              style={styles.actionButton}
            />
          )}
          {canScheduleDemo && !application.demoScheduled && (
            <PrimaryButton
              label="Schedule Demo"
              onPress={handleScheduleDemo}
              variant="outline"
              style={styles.actionButton}
            />
          )}
          {application.demoScheduled && (
            <View style={styles.demoScheduledBox}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.demoScheduledText}>Demo Already Scheduled</Text>
            </View>
          )}
          {canAccept && (
            <PrimaryButton
              label="Select Tutor"
              onPress={handleAccept}
              variant="primary"
              style={{...styles.actionButton, ...styles.selectButton}}
            />
          )}
          {canReject && (
            <PrimaryButton
              label={showRejectionInput ? "Confirm Reject" : "Reject Tutor"}
              onPress={handleReject}
              variant="danger"
              style={styles.actionButton}
            />
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    minWidth: 120,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...shadows.card,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  tutorName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 2,
  },
  experienceText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: colors.info + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  demoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.info,
    marginLeft: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  detailItem: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    ...shadows.card,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  chipSecondary: {
    backgroundColor: colors.secondary + '15',
  },
  chipTextSecondary: {
    color: colors.secondary,
  },
  chipOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  institutionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  institutionInfo: {
    marginLeft: 10,
    flex: 1,
  },
  institutionName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  institutionDegree: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  requirementCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    ...shadows.card,
  },
  reqStudent: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  reqSubjects: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  messageText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  proposedFee: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success,
  },
  rejectionInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  actionsSection: {
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
  selectButton: {
    backgroundColor: colors.success,
  },
  demoScheduledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success + '10',
    borderRadius: 12,
    padding: 16,
  },
  demoScheduledText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 8,
  },
  bottomSpace: {
    height: 32,
  },
});

export default ApplicationDetailScreen;
