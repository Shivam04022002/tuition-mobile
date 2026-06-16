import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useTeacherAnalytics, TimePeriod } from '../../hooks/useTeacherAnalytics';
import { AnalyticsSummaryCards } from '../../components/teacher/AnalyticsSummaryCards';
import { ConversionFunnelCard } from '../../components/teacher/ConversionFunnelCard';
import { TrendChart, MultiTrendChart } from '../../components/teacher/TrendChart';
import { GoalTracker } from '../../components/teacher/GoalTracker';
import { RecentActivityFeed } from '../../components/teacher/RecentActivityFeed';

const { width } = Dimensions.get('window');

interface SubjectAnalytics {
  subject: string;
  applications: number;
  selections: number;
  conversionRate: number;
}

interface LocationAnalytics {
  city: string;
  applications: number;
  conversions: number;
}

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
  { value: '90days', label: '90 Days' },
];

const TeacherAnalyticsDashboardScreen: React.FC = () => {
  const theme = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30days');
  
  const {
    analytics,
    funnel,
    trends,
    performance,
    isLoading,
    isRefreshing,
    isLoadingFunnel,
    isLoadingTrends,
    isLoadingPerformance,
    error,
    funnelError,
    trendsError,
    performanceError,
    period,
    setPeriod,
    refresh,
    clearErrors,
  } = useTeacherAnalytics(selectedPeriod);

  // Sync period with hook
  useFocusEffect(
    useCallback(() => {
      if (period !== selectedPeriod) {
        setPeriod(selectedPeriod);
      }
    }, [selectedPeriod, period, setPeriod])
  );

  // Handle period change
  const handlePeriodChange = useCallback((newPeriod: TimePeriod) => {
    setSelectedPeriod(newPeriod);
    clearErrors();
  }, [clearErrors]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // Handle error retry
  const handleRetry = useCallback(() => {
    clearErrors();
    refresh();
  }, [refresh, clearErrors]);

  // Memoized data for charts
  const subjectData = useMemo((): SubjectAnalytics[] => {
    return trends?.topSubjects || [];
  }, [trends]);

  const locationData = useMemo((): LocationAnalytics[] => {
    return trends?.topLocations || [];
  }, [trends]);

  // Show error state
  if (error && !analytics) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Unable to Load Analytics
          </Text>
          <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleRetry}
          >
            <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show loading state
  if (isLoading && !analytics) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={styles.skeletonHeader} />
          <View style={styles.skeletonPeriods} />
          <AnalyticsSummaryCards kpis={
            {
              totalLeadsViewed: 0,
              applicationsSubmitted: 0,
              applicationsShortlisted: 0,
              applicationsSelected: 0,
              demoRequests: 0,
              completedDemos: 0,
              activeStudents: 0,
              savedRequirements: 0,
              averageMatchScore: 0,
              responseRate: 0,
            }
          } isLoading={true} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Analytics Dashboard
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Track your performance and growth
          </Text>
        </View>
        
        {/* Period Selector */}
        <View style={styles.periodContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodScroll}
          >
            {TIME_PERIODS.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.periodChip,
                  {
                    backgroundColor: selectedPeriod === period.value ? theme.colors.primary : theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => handlePeriodChange(period.value)}
              >
                <Text
                  style={[
                    styles.periodText,
                    {
                      color: selectedPeriod === period.value ? '#FFFFFF' : theme.colors.text,
                    },
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* KPI Cards */}
      {analytics && (
        <AnalyticsSummaryCards kpis={analytics.kpis} isLoading={isLoading} />
      )}

      {/* Conversion Funnel */}
      {funnel && !funnelError && (
        <ConversionFunnelCard
          funnel={funnel.funnel}
          overallConversionRate={funnel.overallConversionRate}
          isLoading={isLoadingFunnel}
        />
      )}

      {/* Performance Metrics */}
      {performance && !performanceError && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Performance Metrics
          </Text>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                Application Success Rate
              </Text>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                {performance.performance.applicationSuccessRate}%
              </Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                Shortlist Rate
              </Text>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                {performance.performance.shortlistRate}%
              </Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                Demo Conversion Rate
              </Text>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                {performance.performance.demoConversionRate}%
              </Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                Response Rate
              </Text>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                {performance.performance.responseRate}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Trend Charts */}
      {trends && !trendsError && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Trends & Analytics
          </Text>
          
          {/* Applications Trend */}
          <TrendChart
            title="Applications Trend"
            data={trends.trends.applications}
            dataKey="applications"
            color="#3B82F6"
            subtitle="Your application submissions over time"
            isLoading={isLoadingTrends}
          />

          {/* Multi-Trend Chart */}
          <MultiTrendChart
            title="Performance Overview"
            data={trends.trends.applications}
            lines={[
              { dataKey: 'applications', color: '#3B82F6', name: 'Applications' },
              { dataKey: 'shortlisted', color: '#F59E0B', name: 'Shortlisted' },
              { dataKey: 'accepted', color: '#10B981', name: 'Accepted' },
            ]}
            isLoading={isLoadingTrends}
          />

          {/* Demo Trend */}
          <TrendChart
            title="Demo Sessions Trend"
            data={trends.trends.demos}
            dataKey="requests"
            color="#8B5CF6"
            subtitle="Demo requests and completions"
            isLoading={isLoadingTrends}
          />

          {/* Conversion Trend */}
          <TrendChart
            title="Conversion Rate Trend"
            data={trends.trends.conversions}
            dataKey="conversionRate"
            color="#059669"
            subtitle="Your conversion rate over time"
            isLoading={isLoadingTrends}
          />
        </View>
      )}

      {/* Top Subjects */}
      {subjectData.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Top Subjects
          </Text>
          <View style={[styles.topSubjectsContainer, { backgroundColor: theme.colors.card }]}>
            {subjectData.slice(0, 5).map((subject, index) => (
              <View key={index} style={styles.subjectItem}>
                <Text style={[styles.subjectName, { color: theme.colors.text }]}>
                  {subject.subject}
                </Text>
                <View style={styles.subjectStats}>
                  <Text style={[styles.subjectApplications, { color: theme.colors.textSecondary }]}>
                    {subject.applications} apps
                  </Text>
                  <Text style={[styles.subjectConversion, { color: theme.colors.primary }]}>
                    {subject.conversionRate}% conv.
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Top Locations */}
      {locationData.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Top Locations
          </Text>
          <View style={[styles.topLocationsContainer, { backgroundColor: theme.colors.card }]}>
            {locationData.slice(0, 5).map((location, index) => (
              <View key={index} style={styles.locationItem}>
                <Text style={[styles.locationName, { color: theme.colors.text }]}>
                  {location.city}
                </Text>
                <View style={styles.locationStats}>
                  <Text style={[styles.locationApplications, { color: theme.colors.textSecondary }]}>
                    {location.applications} apps
                  </Text>
                  <Text style={[styles.locationConversions, { color: theme.colors.primary }]}>
                    {location.conversions} conv.
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Goals Section */}
      {performance && !performanceError && (
        <GoalTracker
          goals={performance.goals}
          goalProgress={performance.goalProgress}
          isLoading={isLoadingPerformance}
        />
      )}

      {/* Recent Activity */}
      {performance && !performanceError && (
        <RecentActivityFeed
          activities={performance.recentActivity}
          isLoading={isLoadingPerformance}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Last updated: {analytics ? new Date(analytics.generatedAt).toLocaleString() : 'Never'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  periodContainer: {
    marginBottom: 8,
  },
  periodScroll: {
    paddingRight: 16,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  topSubjectsContainer: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  subjectStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subjectApplications: {
    fontSize: 12,
    fontWeight: '400',
  },
  subjectConversion: {
    fontSize: 12,
    fontWeight: '600',
  },
  topLocationsContainer: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  locationName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  locationStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationApplications: {
    fontSize: 12,
    fontWeight: '400',
  },
  locationConversions: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
  },
  // Loading and error states
  loadingContainer: {
    padding: 16,
  },
  skeletonHeader: {
    width: 150,
    height: 24,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#E5E7EB',
  },
  skeletonPeriods: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TeacherAnalyticsDashboardScreen;
