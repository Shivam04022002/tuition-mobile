import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import { TeacherApplication } from '../../services/teacherApi';
import { useTeacherApplications } from '../../hooks/useTeacherApplications';

type ApplicationStatus = 'pending' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn';

interface TabConfig {
  key: ApplicationStatus | 'all';
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { key: 'all', label: 'All', icon: 'list-outline' },
  { key: 'pending', label: 'Pending', icon: 'time-outline' },
  { key: 'shortlisted', label: 'Shortlisted', icon: 'star-outline' },
  { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle-outline' },
  { key: 'rejected', label: 'Rejected', icon: 'close-circle-outline' },
];

const getStatusColor = (status: ApplicationStatus, theme: any): string => {
  const colors: Record<ApplicationStatus, string> = {
    pending: theme.colors.warning,
    shortlisted: theme.colors.info,
    accepted: theme.colors.success,
    rejected: theme.colors.error,
    withdrawn: theme.colors.textTertiary,
  };
  return colors[status] || theme.colors.textTertiary;
};

const getStatusIcon = (status: ApplicationStatus): string => {
  const icons: Record<ApplicationStatus, string> = {
    pending: 'time-outline',
    shortlisted: 'star-outline',
    accepted: 'checkmark-circle-outline',
    rejected: 'close-circle-outline',
    withdrawn: 'remove-circle-outline',
  };
  return icons[status] || 'help-circle-outline';
};

const TeacherApplicationsScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);

  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'all'>('all');

  // ── API hook ────────────────────────────────────────────────────────────────
  const {
    applications,
    counts,
    isLoading: loading,
    isRefreshing: refreshing,
    error,
    refresh: onRefresh,
    retry: loadApplications,
    withdraw,
    withdrawingId,
  } = useTeacherApplications(token);

  // Handle session expiry
  useEffect(() => {
    if (error === 'Session expired. Please login again.') {
      dispatch(logout());
      Alert.alert('Session Expired', 'Please login again');
    }
  }, [error, dispatch]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleWithdraw = (application: TeacherApplication) => {
    Alert.alert(
      'Withdraw Application',
      `Are you sure you want to withdraw your application for ${application.parentRequirement?.studentDetails?.studentName || 'this student'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await withdraw(application.applicationId, application._id);
              Alert.alert('Success', 'Application withdrawn successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to withdraw application');
            }
          },
        },
      ]
    );
  };

  // Client-side tab filter — all statuses fetched in one call
  const filteredApplications = activeTab === 'all'
    ? applications
    : applications.filter(app => app.status === activeTab);

  const renderTab = (tab: TabConfig) => {
    const isActive = activeTab === tab.key;
    const count = counts[tab.key as keyof typeof counts] || 0;

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
        <Ionicons 
          name={tab.icon as any} 
          size={16} 
          color={isActive ? theme.colors.textWhite : theme.colors.textSecondary} 
        />
        <Text style={[
          styles.tabText,
          { color: isActive ? theme.colors.textWhite : theme.colors.textSecondary }
        ]}>
          {tab.label}
        </Text>
        {count > 0 && (
          <View style={[
            styles.countBadge,
            { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : theme.colors.primary + '20' }
          ]}>
            <Text style={[
              styles.countText,
              { color: isActive ? theme.colors.textWhite : theme.colors.primary }
            ]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleViewApplication = (app: TeacherApplication) => {
    navigation.navigate('ApplicationDetail', { applicationId: app.applicationId });
  };

  const renderApplicationCard = ({ item: app }: { item: TeacherApplication }) => {
    const canWithdraw = app.status === 'pending';

    return (
      <TouchableOpacity onPress={() => handleViewApplication(app)} activeOpacity={0.9}>
      <Card variant="elevated" margin="small" style={styles.applicationCard}>
        {/* Header with Status */}
        <View style={styles.cardHeader}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(app.status, theme) + '20' }
          ]}>
            <Ionicons 
              name={getStatusIcon(app.status) as any} 
              size={16} 
              color={getStatusColor(app.status, theme)} 
            />
            <Text style={[
              styles.statusText,
              { color: getStatusColor(app.status, theme) }
            ]}>
              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            {formatDate(app.createdAt)}
          </Text>
        </View>

        {/* Student Info */}
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: theme.colors.text }]}>
            {app.parentRequirement?.studentDetails?.studentName || 'Student'}
          </Text>
          <Text style={[styles.gradeText, { color: theme.colors.textSecondary }]}>
            {app.parentRequirement?.studentDetails?.grade} • {app.parentRequirement?.subjects?.join(', ')}
          </Text>
        </View>

        {/* Parent Info */}
        <View style={styles.parentInfo}>
          <Ionicons name="person-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.parentText, { color: theme.colors.textSecondary }]}>
            Parent: {app.parent?.profile?.parentName || 'Unknown'}
          </Text>
        </View>

        {/* Budget & Location */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              Budget: ₹{app.parentRequirement?.budget?.minAmount || 0} - ₹{app.parentRequirement?.budget?.maxAmount || 0}/month
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {app.parentRequirement?.location?.city}
            </Text>
          </View>
        </View>

        {/* Application Message */}
        {app.message && (
          <View style={[styles.messageContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.messageLabel, { color: theme.colors.textSecondary }]}>
              Your Message:
            </Text>
            <Text style={[styles.messageText, { color: theme.colors.text }]}>
              {app.message}
            </Text>
          </View>
        )}

        {/* Proposed Fee */}
        {app.proposedFee && (
          <View style={styles.proposedFeeContainer}>
            <Text style={[styles.proposedFeeLabel, { color: theme.colors.textSecondary }]}>
              Your Proposed Fee:
            </Text>
            <Text style={[styles.proposedFeeValue, { color: theme.colors.primary }]}>
              ₹{app.proposedFee}/month
            </Text>
          </View>
        )}

        {/* Rejection Reason */}
        {app.status === 'rejected' && app.rejectionReason && (
          <View style={[styles.rejectionContainer, { backgroundColor: theme.colors.error + '10' }]}>
            <Text style={[styles.rejectionLabel, { color: theme.colors.error }]}>
              Rejection Reason:
            </Text>
            <Text style={[styles.rejectionText, { color: theme.colors.textSecondary }]}>
              {app.rejectionReason}
            </Text>
          </View>
        )}

        {/* Demo Scheduled */}
        {app.demoScheduled && (
          <View style={[styles.demoBadge, { backgroundColor: theme.colors.info + '20' }]}>
            <Ionicons name="videocam-outline" size={14} color={theme.colors.info} />
            <Text style={[styles.demoText, { color: theme.colors.info }]}>
              Demo Scheduled
            </Text>
          </View>
        )}

        {/* Actions */}
        {canWithdraw && (
          <Button
            title={withdrawingId === app._id ? "Withdrawing..." : "Withdraw Application"}
            variant="outline"
            size="small"
            loading={withdrawingId === app._id}
            disabled={withdrawingId === app._id}
            onPress={() => handleWithdraw(app)}
            style={styles.withdrawButton}
            icon="delete"
          />
        )}
      </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const isFiltered = activeTab !== 'all';
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name={isFiltered ? 'funnel-outline' : 'mail-outline'} 
          size={64} 
          color={theme.colors.textSecondary} 
        />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          {isFiltered ? `No ${activeTab} applications` : 'No applications yet'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
          {isFiltered 
            ? 'Try switching to a different tab to see more applications'
            : 'Start applying to student leads to see your applications here'}
        </Text>
        {!isFiltered && (
          <Button
            title="Browse Leads"
            variant="primary"
            size="small"
            onPress={() => navigation.navigate('Leads')}
            style={{ marginTop: 16 }}
            icon="people"
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading applications...
        </Text>
      </View>
    );
  }

  if (error && error !== 'Session expired. Please login again.') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 16 }]}>
          Unable to load applications
        </Text>
        <Button
          title="Retry"
          onPress={loadApplications}
          style={{ marginTop: 16 }}
          variant="primary"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, paddingTop: insets.top + 8 }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          My Applications
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {applications.length} {applications.length === 1 ? 'application' : 'applications'} total
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map(renderTab)}
      </ScrollView>

      {/* Applications List */}
      <FlatList
        data={filteredApplications}
        renderItem={renderApplicationCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  tabsContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 8,
    paddingBottom: 24,
  },
  applicationCard: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
  },
  studentInfo: {
    marginBottom: 8,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  gradeText: {
    fontSize: 14,
  },
  parentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  parentText: {
    fontSize: 13,
  },
  detailsContainer: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  proposedFeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  proposedFeeLabel: {
    fontSize: 13,
  },
  proposedFeeValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  rejectionContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 13,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  demoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  withdrawButton: {
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TeacherApplicationsScreen;
