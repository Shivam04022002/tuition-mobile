import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAppSelector } from '../../redux/hooks';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { apiConfig } from '../../config/api';

interface TeacherProfile {
  _id: string;
  basicDetails: {
    fullName: string;
    profilePhoto?: string;
    mobileNumber?: string;
    email?: string;
  };
  teachingDetails: {
    subjects: string[];
    classes: string[];
    teachingModes: string[];
  };
  education: {
    highestQualification: string;
  };
  pricingRevenue: {
    hourlyRate: number;
    monthlyRate: number;
    experienceYears: number;
  };
  stats: {
    averageRating: number;
    totalReviews: number;
    totalStudents: number;
  };
  verificationStatus: string;
}

interface Application {
  _id: string;
  applicationId: string;
  status: string;
  message?: string;
  proposedFee?: number;
  viewedByParent: boolean;
  viewedAt?: string;
  shortlistedAt?: string;
  rejectedAt?: string;
  selectedAt?: string;
  hiredAt?: string;
  rejectionReason?: string;
  selectionReason?: string;
  demoScheduled: boolean;
  demoId?: string;
  createdAt: string;
  teacherProfileId: TeacherProfile;
}

type RouteParams = {
  ParentApplicationReview: {
    requirementId: string;
    applicationId: string;
  };
};

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  pending: { color: '#F59E0B', icon: 'time-outline', label: 'Pending' },
  viewed: { color: '#3B82F6', icon: 'eye-outline', label: 'Viewed' },
  shortlisted: { color: '#8B5CF6', icon: 'star-outline', label: 'Shortlisted' },
  rejected: { color: '#EF4444', icon: 'close-circle-outline', label: 'Not Selected' },
  demo_scheduled: { color: '#10B981', icon: 'videocam-outline', label: 'Demo Scheduled' },
  demo_completed: { color: '#059669', icon: 'checkmark-circle-outline', label: 'Demo Completed' },
  selected: { color: '#6366F1', icon: 'checkmark-done-outline', label: 'Selected' },
  hired: { color: '#10B981', icon: 'trophy-outline', label: 'Hired' },
  withdrawn: { color: '#6B7280', icon: 'arrow-undo-outline', label: 'Withdrawn' },
};

export default function ParentApplicationReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'ParentApplicationReview'>>();
  const { requirementId, applicationId } = route.params;
  const token = useAppSelector(selectAuthToken);

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchApplication = useCallback(async () => {
    try {
      const response = await fetch(
        `${apiConfig.baseURL}/applications/${applicationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setApplication(data.data.application);
      }
    } catch (error) {
      console.error('Fetch application error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [applicationId, token]);

  React.useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleAction = async (action: string, reason?: string) => {
    setIsProcessing(true);
    try {
      const endpoint = `${apiConfig.baseURL}/applications/${applicationId}/${action}`;
      const body = reason ? JSON.stringify({ reason }) : undefined;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body,
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', data.message);
        fetchApplication();
      } else {
        Alert.alert('Error', data.message || 'Action failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process action');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderActionButtons = () => {
    if (!application) return null;

    const status = application.status;

    if (status === 'hired' || status === 'rejected' || status === 'withdrawn') {
      return (
        <View style={styles.actionBar}>
          <Text style={[styles.statusText, { color: STATUS_CONFIG[status].color }]}>
            Application {STATUS_CONFIG[status].label}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.actionBar}>
        {status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={() => handleAction('view')}
              disabled={isProcessing}
            >
              <Ionicons name="eye-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Mark Viewed</Text>
            </TouchableOpacity>
          </>
        )}

        {(status === 'pending' || status === 'viewed') && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.shortlistButton]}
              onPress={() => handleAction('shortlist')}
              disabled={isProcessing}
            >
              <Ionicons name="star-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Shortlist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => {
                Alert.prompt(
                  'Reject Application',
                  'Add a reason (optional):',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Reject', onPress: (reason) => handleAction('reject', reason) },
                  ]
                );
              }}
              disabled={isProcessing}
            >
              <Ionicons name="close-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}

        {(status === 'shortlisted' || status === 'demo_completed') && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.selectButton]}
              onPress={() => {
                Alert.prompt(
                  'Select Teacher',
                  'Add a selection note (optional):',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Select', onPress: (reason) => handleAction('select', reason) },
                  ]
                );
              }}
              disabled={isProcessing}
            >
              <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Select Teacher</Text>
            </TouchableOpacity>
          </>
        )}

        {status === 'selected' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.hireButton]}
            onPress={() => {
              Alert.alert(
                'Hire Teacher',
                'Are you sure you want to hire this teacher? This will close the requirement.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Hire',
                    onPress: () => {
                      Alert.prompt(
                        'Hire Notes',
                        'Add any notes about the hire (optional):',
                        [
                          { text: 'Skip', onPress: () => handleAction('hire') },
                          { text: 'Hire', onPress: (notes) => handleAction('hire', notes) },
                        ]
                      );
                    },
                  },
                ]
              );
            }}
            disabled={isProcessing}
          >
            <Ionicons name="trophy-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Hire Teacher</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.container}>
        <Text>Application not found</Text>
      </View>
    );
  }

  const teacher = application.teacherProfileId;
  const statusConfig = STATUS_CONFIG[application.status];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => {
          setIsRefreshing(true);
          fetchApplication();
        }} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Review</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
        <Ionicons name={statusConfig.icon as any} size={16} color={statusConfig.color} />
        <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>
      </View>

      {/* Teacher Card */}
      <View style={styles.teacherCard}>
        {teacher.basicDetails.profilePhoto ? (
          <Image
            source={{ uri: teacher.basicDetails.profilePhoto }}
            style={styles.teacherPhoto}
          />
        ) : (
          <View style={[styles.teacherPhoto, styles.placeholderPhoto]}>
            <Text style={styles.placeholderText}>
              {teacher.basicDetails.fullName
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>{teacher.basicDetails.fullName}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {teacher.stats.averageRating.toFixed(1)} ({teacher.stats.totalReviews} reviews)
            </Text>
          </View>
          <Text style={styles.teacherDetail}>
            {teacher.pricingRevenue.experienceYears} years experience
          </Text>
          {teacher.verificationStatus === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#10B981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>

      {/* Application Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Application ID</Text>
          <Text style={styles.detailValue}>{application.applicationId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Proposed Fee</Text>
          <Text style={styles.detailValue}>
            ₹{application.proposedFee || teacher.pricingRevenue.monthlyRate}/month
          </Text>
        </View>
        {application.message && (
          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>Message from Teacher:</Text>
            <Text style={styles.messageText}>{application.message}</Text>
          </View>
        )}
      </View>

      {/* Teaching Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Teaching Information</Text>
        <View style={styles.chipGrid}>
          {teacher.teachingDetails.subjects.map((subject) => (
            <View key={subject} style={styles.chip}>
              <Text style={styles.chipText}>{subject}</Text>
            </View>
          ))}
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="school-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{teacher.education.highestQualification}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="book-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>Classes: {teacher.teachingDetails.classes.join(', ')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>
            Modes: {teacher.teachingDetails.teachingModes.join(', ')}
          </Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application Timeline</Text>
        {application.viewedAt && (
          <View style={styles.timelineItem}>
            <Ionicons name="eye-outline" size={16} color="#3B82F6" />
            <Text style={styles.timelineText}>
              Viewed on {new Date(application.viewedAt).toLocaleDateString('en-IN')}
            </Text>
          </View>
        )}
        {application.shortlistedAt && (
          <View style={styles.timelineItem}>
            <Ionicons name="star-outline" size={16} color="#8B5CF6" />
            <Text style={styles.timelineText}>
              Shortlisted on {new Date(application.shortlistedAt).toLocaleDateString('en-IN')}
            </Text>
          </View>
        )}
        {application.demoScheduled && (
          <View style={styles.timelineItem}>
            <Ionicons name="videocam-outline" size={16} color="#10B981" />
            <Text style={styles.timelineText}>Demo scheduled</Text>
          </View>
        )}
        {application.selectedAt && (
          <View style={styles.timelineItem}>
            <Ionicons name="checkmark-done-outline" size={16} color="#6366F1" />
            <Text style={styles.timelineText}>
              Selected on {new Date(application.selectedAt).toLocaleDateString('en-IN')}
            </Text>
          </View>
        )}
        {application.hiredAt && (
          <View style={styles.timelineItem}>
            <Ionicons name="trophy-outline" size={16} color="#10B981" />
            <Text style={styles.timelineText}>
              Hired on {new Date(application.hiredAt).toLocaleDateString('en-IN')}
            </Text>
          </View>
        )}
        {application.rejectedAt && (
          <View style={styles.timelineItem}>
            <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.timelineText}>
              Not selected on {new Date(application.rejectedAt).toLocaleDateString('en-IN')}
            </Text>
            {application.rejectionReason && (
              <Text style={styles.rejectionReason}>Reason: {application.rejectionReason}</Text>
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {renderActionButtons()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 32,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 16,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  teacherCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teacherPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
  },
  placeholderPhoto: {
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  teacherInfo: {
    flex: 1,
    marginLeft: 16,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  teacherDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  messageBox: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#1F2937',
    fontStyle: 'italic',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    color: '#3B82F6',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timelineText: {
    fontSize: 14,
    color: '#4B5563',
  },
  rejectionReason: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 28,
  },
  actionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: '#3B82F6',
  },
  shortlistButton: {
    backgroundColor: '#8B5CF6',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  selectButton: {
    backgroundColor: '#6366F1',
  },
  hireButton: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
