import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { useApplications } from '../../hooks/useApplications';
import { ProfileAvatar, PrimaryButton } from '../../components/ui';
import type { ParentApplication } from '../../services/applicationApi';

const FILTER_OPTIONS = [
  { label: 'All', value: undefined },
  { label: 'Applied', value: 'pending' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Selected', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
];

const ApplicationsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const token = useAppSelector(selectAuthToken);
  const [selectedFilter, setSelectedFilter] = useState<string | undefined>(undefined);

  const {
    applications,
    total,
    isLoading,
    isRefreshing,
    isActionLoading,
    error,
    refresh,
    retry,
    shortlist,
    reject,
    accept,
  } = useApplications(token);

  const filteredApplications = selectedFilter
    ? applications.filter(app => app.status === selectedFilter)
    : applications;

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleViewApplication = useCallback((application: ParentApplication) => {
    navigation.navigate('ApplicationDetail', {
      applicationId: application.applicationId,
      onShortlist: () => handleShortlist(application.applicationId),
      onReject: () => handleReject(application.applicationId),
      onAccept: () => handleAccept(application.applicationId),
      onScheduleDemo: () => handleRefresh(),
    });
  }, [navigation, handleRefresh]);

  const handleShortlist = useCallback(async (applicationId: string) => {
    const success = await shortlist(applicationId);
    if (success) {
      Alert.alert('Success', 'Tutor shortlisted successfully');
    }
  }, [shortlist]);

  const handleReject = useCallback(async (applicationId: string) => {
    const success = await reject(applicationId);
    if (success) {
      Alert.alert('Success', 'Application rejected');
    }
  }, [reject]);

  const handleAccept = useCallback(async (applicationId: string) => {
    const success = await accept(applicationId);
    if (success) {
      Alert.alert('Success', 'Tutor selected successfully');
    }
  }, [accept]);

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

  const renderApplicationCard = ({ item }: { item: ParentApplication }) => {
    const tutor = item.teacherProfileId;
    const tutorName = tutor?.basicDetails?.fullName || 'Unknown';
    const profilePhoto = tutor?.basicDetails?.profilePhoto || '';
    const subjects = tutor?.teachingDetails?.subjects || [];
    const experience = tutor?.pricingRevenue?.experienceYears || 0;
    const rating = tutor?.stats?.averageRating || 0;
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleViewApplication(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <ProfileAvatar name={tutorName} imageUri={profilePhoto} size={56} />
          <View style={styles.cardInfo}>
            <Text style={styles.tutorName}>{tutorName}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              <Text style={styles.experienceText}>• {experience} yrs exp</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
        </View>

        {subjects.length > 0 && (
          <View style={styles.subjectsRow}>
            {subjects.slice(0, 3).map((subject, index) => (
              <View key={index} style={styles.subjectChip}>
                <Text style={styles.subjectText}>{subject}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            Applied {new Date(item.createdAt).toLocaleDateString('en-IN')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>No Applications Yet</Text>
      <Text style={styles.emptySubtitle}>
        Tutors will appear here when they apply to your requirements
      </Text>
      <PrimaryButton
        label="Post a Requirement"
        onPress={() => navigation.navigate('ParentRequirementForm', { mode: 'create' })}
        variant="primary"
        style={styles.emptyButton}
      />
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
      <Text style={styles.errorTitle}>Unable to load applications</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <PrimaryButton
        label="Retry"
        onPress={retry}
        variant="outline"
        style={styles.emptyButton}
      />
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Applications</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Applications ({total})</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item.label}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === item.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {error && !filteredApplications.length ? (
        renderErrorState()
      ) : filteredApplications.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredApplications}
          keyExtractor={(item) => item._id}
          renderItem={renderApplicationCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {isActionLoading && (
        <View style={styles.actionLoadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterContainer: {
    backgroundColor: colors.card,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tutorName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
  },
  experienceText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subjectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  subjectChip: {
    backgroundColor: colors.primary + '12',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 160,
  },
  actionLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ApplicationsListScreen;
