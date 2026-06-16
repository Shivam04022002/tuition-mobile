import React, { useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import { useParentDashboard } from '../../hooks/useParentDashboard';
import { useParentProfile } from '../../hooks/useParentProfile';
import { useQuickStats } from '../../hooks/useQuickStats';
import { useRequirements } from '../../hooks/useRequirements';
import { useApplications } from '../../hooks/useApplications';
import { colors } from '../../theme/colors';
import HomeHeader from '../../components/parent/HomeHeader';
import DashboardSkeleton from '../../components/parent/DashboardSkeleton';
import DashboardError from '../../components/parent/DashboardError';
import DashboardContent from '../../components/parent/DashboardContent';
import type { DashboardRecommendedTutor } from '../../services/parentDashboardService';
import type { ParentApplication } from '../../services/applicationApi';

const ParentDashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const token = useAppSelector(selectAuthToken);

  const {
    applications,
    recommendedTutors,
    upcomingDemos,
    isLoading,
    isRefreshing,
    error,
    refresh: refreshDashboard,
    retry,
  } = useParentDashboard(token);

  const {
    requirements: myRequirements,
    isLoading: isRequirementsLoading,
    refresh: refreshRequirements,
    pauseRequirement,
    resumeRequirement,
    closeRequirement,
    deleteRequirement,
  } = useRequirements(token);

  const {
    stats: quickStats,
    isLoading: isQuickStatsLoading,
    error: quickStatsError,
    refresh: refreshQuickStats,
  } = useQuickStats(token);

  const {
    profile,
    notificationSummary,
    isLoading: isProfileLoading,
    refresh: refreshProfile,
  } = useParentProfile();

  useEffect(() => {
    if (error === 'Session expired. Please login again.') {
      dispatch(logout());
      Alert.alert('Session Expired', 'Please login again');
    }
  }, [error, dispatch]);

  const notificationsCount = notificationSummary.count;

  const {
    applications: freshApplications,
    isLoading: isApplicationsLoading,
    refresh: refreshApplications,
    shortlist,
    reject,
    accept,
  } = useApplications(token);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshDashboard(),
      refreshProfile(),
      refreshQuickStats(),
      refreshRequirements(),
      refreshApplications(),
    ]);
  }, [refreshDashboard, refreshProfile, refreshQuickStats, refreshRequirements, refreshApplications]);

  const handleViewApplication = useCallback((applicationId: string) => {
    const app = (freshApplications.length > 0 ? freshApplications : applications).find(
      a => a._id === applicationId || a.applicationId === applicationId
    );
    navigation.navigate('ApplicationDetail', {
      applicationId: app?.applicationId || applicationId,
      onShortlist: async () => {
        const success = await shortlist(applicationId);
        if (success) {
          Alert.alert('Success', 'Tutor shortlisted successfully');
          retry();
          refreshApplications();
        }
      },
      onReject: async () => {
        const success = await reject(applicationId);
        if (success) {
          Alert.alert('Success', 'Application rejected');
          retry();
          refreshApplications();
        }
      },
      onAccept: async () => {
        const success = await accept(applicationId);
        if (success) {
          Alert.alert('Success', 'Tutor selected successfully');
          retry();
          refreshApplications();
        }
      },
      onScheduleDemo: () => {
        refreshApplications();
      },
    });
  }, [navigation, freshApplications, applications, shortlist, reject, accept, retry, refreshApplications]);

  const handleViewTutorMap = useCallback((tutor: DashboardRecommendedTutor) => {
    const coords = tutor.teacherProfileId?.locationAvailability?.coordinates;
    navigation.navigate('LocationMap', {
      teacherLatitude: coords?.latitude || 28.6139,
      teacherLongitude: coords?.longitude || 77.209,
      teacherName: tutor.teacherProfileId?.basicDetails?.fullName || 'Tutor',
      teacherServiceRadius: 5,
      parentLatitude: 28.6139,
      parentLongitude: 77.209,
      parentName: 'Your Location',
      distanceKm: tutor.breakdown?.locationMatchDetails?.distance || 2.5,
      matchScore: tutor.overallScore,
      viewMode: 'parent-viewing-teacher',
    });
  }, [navigation]);

  const handlePostRequirement = useCallback(() => {
    navigation.navigate('ParentRequirementForm', { mode: 'create' });
  }, [navigation]);

  const handleViewHiringDashboard = useCallback(() => {
    navigation.navigate('ParentHiringDashboard');
  }, [navigation]);

  const handleEditRequirement = useCallback((id: string) => {
    const req = myRequirements.find(r => r._id === id);
    if (!req) return;
    navigation.navigate('ParentRequirementForm', {
      mode: 'edit',
      editId: id,
      initialData: {
        studentName: req.studentDetails?.studentName || '',
        grade: req.studentDetails?.grade || '',
        board: req.studentDetails?.board || '',
        subjects: req.subjects || [],
        budgetMin: String(req.budget?.minAmount ?? 0),
        budgetMax: String(req.budget?.maxAmount ?? 0),
      },
    });
  }, [navigation, myRequirements]);

  const handleViewRequirement = useCallback((id: string) => {
    navigation.navigate('RequirementDetail', { requirementId: id });
  }, [navigation]);

  const handleViewAllRecommendedTutors = useCallback(() => {
    navigation.navigate('RecommendedTutors');
  }, [navigation]);

  const handleViewTutorProfile = useCallback((tutorId: string) => {
    navigation.navigate('TutorProfile', { tutorId });
  }, [navigation]);

  const handlePauseRequirement = useCallback((id: string) => {
    Alert.alert(
      'Pause Requirement',
      'Pause this requirement? Tutors will not see it while paused.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause',
          onPress: async () => {
            try {
              await pauseRequirement(id);
              Alert.alert('Paused', 'Requirement paused successfully.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to pause requirement.');
            }
          },
        },
      ],
    );
  }, [pauseRequirement]);

  const handleResumeRequirement = useCallback((id: string) => {
    Alert.alert(
      'Resume Requirement',
      'Resume this requirement? It will be visible to tutors again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resume',
          onPress: async () => {
            try {
              await resumeRequirement(id);
              Alert.alert('Resumed', 'Requirement is now active again.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to resume requirement.');
            }
          },
        },
      ],
    );
  }, [resumeRequirement]);

  const handleCloseRequirement = useCallback((id: string) => {
    Alert.alert(
      'Close Requirement',
      'Close this requirement? It will stop receiving new applications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              await closeRequirement(id);
              Alert.alert('Closed', 'Requirement closed successfully.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to close requirement.');
            }
          },
        },
      ],
    );
  }, [closeRequirement]);

  const handleDeleteRequirement = useCallback((id: string) => {
    Alert.alert(
      'Delete Requirement',
      'Delete this requirement? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRequirement(id);
              Alert.alert('Deleted', 'Requirement deleted successfully.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete requirement.');
            }
          },
        },
      ],
    );
  }, [deleteRequirement]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error && error !== 'Session expired. Please login again.') {
    return <DashboardError error={error} onRetry={retry} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          profile={profile}
          notificationsCount={notificationsCount}
          isLoading={isProfileLoading}
          onNotificationsPress={() => navigation.navigate('Notifications')}
          onAvatarPress={() => navigation.navigate('Profile')}
          onPostRequirementPress={handlePostRequirement}
        />

        <DashboardContent
          stats={quickStats}
          isStatsLoading={isQuickStatsLoading}
          hasStatsError={!!quickStatsError}
          isRequirementsLoading={isRequirementsLoading}
          requirements={myRequirements}
          applications={applications}
          recommendedTutors={recommendedTutors}
          upcomingDemos={upcomingDemos}
          onViewRequirement={handleViewRequirement}
          onEditRequirement={handleEditRequirement}
          onPauseRequirement={handlePauseRequirement}
          onResumeRequirement={handleResumeRequirement}
          onCloseRequirement={handleCloseRequirement}
          onDeleteRequirement={handleDeleteRequirement}
          onPostRequirement={handlePostRequirement}
          onViewApplication={handleViewApplication}
          onShortlistApplication={async (applicationId: string) => {
            const success = await shortlist(applicationId);
            if (success) {
              Alert.alert('Success', 'Tutor shortlisted successfully');
              refreshApplications();
            }
          }}
          onRejectApplication={async (applicationId: string) => {
            const success = await reject(applicationId);
            if (success) {
              Alert.alert('Done', 'Application rejected.');
              refreshApplications();
            }
          }}
          onViewTutorProfile={handleViewTutorProfile}
          onViewTutorMap={handleViewTutorMap}
          onViewAllRequirements={() => navigation.navigate('Requirements')}
          onViewAllApplications={() => navigation.navigate('Applications')}
          onViewAllShortlisted={() => navigation.navigate('Shortlisted')}
          onViewAllDemos={() => navigation.navigate('DemoClasses')}
          onViewAllRecommendedTutors={handleViewAllRecommendedTutors}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
});

export default ParentDashboardScreen;
