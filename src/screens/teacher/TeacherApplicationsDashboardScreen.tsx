import React, { useState, useCallback } from 'react';
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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import { TeacherApplication } from '../../services/teacherApi';
import { 
  useTeacherApplications, 
  ApplicationFilterType,
  SortOption,
} from '../../hooks/useTeacherApplications';

// Components
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ApplicationStatusBadge from '../../components/teacher/ApplicationStatusBadge';
import ApplicationSearchBar from '../../components/teacher/ApplicationSearchBar';
import ApplicationSortSheet from '../../components/teacher/ApplicationSortSheet';
import ApplicationsSummaryCards from '../../components/teacher/ApplicationsSummaryCards';

const { width } = Dimensions.get('window');

type ExtendedApplicationStatus = ApplicationFilterType;

// Filter tabs configuration
const FILTER_TABS: { key: ExtendedApplicationStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'accepted', label: 'Selected' },
  { key: 'demo_scheduled', label: 'Demo' },
  { key: 'withdrawn', label: 'Withdrawn' },
];

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TeacherApplicationsDashboardScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);

  const [sortSheetVisible, setSortSheetVisible] = useState(false);

  // ── Hook with enhanced filtering ─────────────────────────────────────────────
  const {
    filteredApplications,
    counts,
    isLoading,
    isRefreshing,
    error,
    activeFilter,
    searchQuery,
    sortBy,
    setActiveFilter,
    setSearchQuery,
    setSortBy,
    refresh,
    retry,
    withdraw,
    withdrawingId,
    clearSearch,
  } = useTeacherApplications(token);

  // Handle session expiry
  React.useEffect(() => {
    if (error === 'Session expired. Please login again.') {
      dispatch(logout());
      Alert.alert('Session Expired', 'Please login again');
    }
  }, [error, dispatch]);

  // Handle withdraw action
  const handleWithdraw = useCallback((application: TeacherApplication) => {
    const canWithdraw = ['pending', 'shortlisted'].includes(application.status);
    
    if (!canWithdraw) {
      Alert.alert(
        'Cannot Withdraw',
        application.status === 'accepted' 
          ? 'You cannot withdraw an accepted application.' 
          : 'This application cannot be withdrawn.'
      );
      return;
    }

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
  }, [withdraw]);

  // Navigate to application detail
  const handleViewApplication = useCallback((app: TeacherApplication) => {
    navigation.navigate('ApplicationDetail', { applicationId: app.applicationId });
  }, [navigation]);

  // Render filter tabs
  const renderFilterTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsContainer}
    >
      {FILTER_TABS.map((tab) => {
        const isActive = activeFilter === tab.key;
        const count = counts[tab.key as keyof typeof counts] || 0;
        
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              isActive && { 
                backgroundColor: theme.colors.primary + '15',
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                { color: isActive ? theme.colors.primary : theme.colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
            {count > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  { backgroundColor: isActive ? theme.colors.primary : theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    { color: isActive ? '#FFF' : theme.colors.textSecondary },
                  ]}
                >
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // Render application card
  const renderApplicationCard = ({ item: app }: { item: TeacherApplication }) => {
    const req = app.parentRequirement;
    const canWithdraw = ['pending', 'shortlisted'].includes(app.status) && !app.demoScheduled;
    
    // Calculate match score display (placeholder until we have actual match data)
    const matchScore = app.status === 'shortlisted' || app.status === 'accepted' ? 85 : 
                       app.status === 'pending' ? 70 : 0;

    return (
      <TouchableOpacity 
        onPress={() => handleViewApplication(app)} 
        activeOpacity={0.9}
      >
        <Card variant="elevated" margin="small" style={styles.card}>
          {/* Header: Status and Date */}
          <View style={styles.cardHeader}>
            <ApplicationStatusBadge 
              status={app.status} 
              demoScheduled={app.demoScheduled}
              size="medium"
            />
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={12} color={theme.colors.textTertiary} />
              <Text style={[styles.dateText, { color: theme.colors.textTertiary }]}>
                {formatDate(app.createdAt)}
              </Text>
            </View>
          </View>

          {/* Requirement ID */}
          <View style={styles.reqIdContainer}>
            <Ionicons name="document-text-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.reqIdText, { color: theme.colors.textSecondary }]}>
              {req?.requirementId || 'REQ-XXXX'}
            </Text>
          </View>

          {/* Student Info */}
          <View style={styles.studentSection}>
            <Text style={[styles.studentName, { color: theme.colors.text }]}>
              {req?.studentDetails?.studentName || 'Student'}
            </Text>
            <Text style={[styles.gradeSubject, { color: theme.colors.textSecondary }]}>
              {req?.studentDetails?.grade} • {req?.subjects?.slice(0, 2).join(', ')}
            </Text>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>            
            {/* Budget */}
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                ₹{req?.budget?.minAmount || 0}-{req?.budget?.maxAmount || 0}/mo
              </Text>
            </View>

            {/* Location */}
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                {req?.location?.city || 'Unknown'}
              </Text>
            </View>

            {/* Match Score */}
            {matchScore > 0 && (
              <View style={styles.detailItem}>
                <Ionicons name="fitness-outline" size={14} color={theme.colors.success} />
                <Text style={[styles.detailText, { color: theme.colors.success, fontWeight: '600' }]}>
                  {matchScore}% Match
                </Text>
              </View>
            )}
          </View>

          {/* Application Message Preview */}
          {app.message && (
            <View style={[styles.messagePreview, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Text style={[styles.messageLabel, { color: theme.colors.textTertiary }]}>
                Your Message:
              </Text>
              <Text 
                style={[styles.messageText, { color: theme.colors.text }]} 
                numberOfLines={2}
              >
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
                ₹{app.proposedFee.toLocaleString()}/month
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Button
              title="View Details"
              variant="primary"
              size="small"
              onPress={() => handleViewApplication(app)}
              style={styles.viewButton}
              icon="eye-outline"
            />
            {canWithdraw && (
              <Button
                title={withdrawingId === app._id ? 'Withdrawing...' : 'Withdraw'}
                variant="outline"
                size="small"
                loading={withdrawingId === app._id}
                disabled={withdrawingId === app._id}
                onPress={() => handleWithdraw(app)}
                style={styles.withdrawButton}
                icon="close-circle-outline"
              />
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Empty state
  const renderEmptyState = () => {
    const hasSearch = searchQuery.length > 0;
    const hasFilter = activeFilter !== 'all';
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={hasSearch ? 'search-outline' : hasFilter ? 'funnel-outline' : 'mail-outline'}
          size={64}
          color={theme.colors.textSecondary}
        />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          {hasSearch 
            ? 'No results found' 
            : hasFilter 
              ? `No ${activeFilter.replace('_', ' ')} applications`
              : 'No applications yet'
          }
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
          {hasSearch 
            ? `Try adjusting your search for "${searchQuery}"`
            : hasFilter
              ? 'Try switching to a different filter'
              : 'Start applying to requirements to see your applications here'
          }
        </Text>
        {(hasSearch || hasFilter) && (
          <Button
            title={hasSearch ? 'Clear Search' : 'Show All'}
            variant="primary"
            size="small"
            onPress={hasSearch ? clearSearch : () => setActiveFilter('all')}
            style={{ marginTop: 16 }}
          />
        )}
        {!hasSearch && !hasFilter && (
          <Button
            title="Browse Requirements"
            variant="primary"
            size="small"
            onPress={() => navigation.navigate('Leads')}
            style={{ marginTop: 16 }}
            icon="people-outline"
          />
        )}
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading applications...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && error !== 'Session expired. Please login again.') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Unable to load applications
          </Text>
          <Text style={[styles.errorSubtitle, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <Button
            title="Retry"
            onPress={retry}
            style={{ marginTop: 20 }}
            variant="primary"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              My Applications
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Track all your submitted applications
            </Text>
          </View>
          
          {/* Sort Button */}
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: theme.colors.card }]}            
            onPress={() => setSortSheetVisible(true)}
          >
            <Ionicons name="swap-vertical-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <ApplicationsSummaryCards
          counts={counts}
          selectedFilter={activeFilter}
          onSelectFilter={setActiveFilter}
        />
      </View>

      {/* Search Bar */}
      <ApplicationSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by ID, subject, class, city, parent name..."
        showFilterButton={false}
      />

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Active Filters Indicator */}
      {(searchQuery || activeFilter !== 'all') && (
        <View style={styles.activeFiltersContainer}>
          <Text style={[styles.activeFiltersText, { color: theme.colors.textSecondary }]}>
            Showing {filteredApplications.length} of {counts.all} applications
            {searchQuery ? ` matching "${searchQuery}"` : ''}
          </Text>
        </View>
      )}

      {/* Applications List */}
      <FlatList
        data={filteredApplications}
        renderItem={renderApplicationCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.listContainer, 
          { paddingBottom: insets.bottom + 20 }
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Sort Sheet */}
      <ApplicationSortSheet
        visible={sortSheetVisible}
        selectedSort={sortBy}
        onSelect={setSortBy}
        onClose={() => setSortSheetVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    marginRight: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeFiltersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  activeFiltersText: {
    fontSize: 12,
  },
  listContainer: {
    paddingTop: 8,
  },
  card: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
  },
  reqIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  reqIdText: {
    fontSize: 13,
    fontWeight: '500',
  },
  studentSection: {
    marginBottom: 12,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  gradeSubject: {
    fontSize: 14,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
  },
  messagePreview: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  proposedFeeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    marginBottom: 12,
  },
  proposedFeeLabel: {
    fontSize: 13,
  },
  proposedFeeValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  viewButton: {
    flex: 1,
  },
  withdrawButton: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});

export default TeacherApplicationsDashboardScreen;
