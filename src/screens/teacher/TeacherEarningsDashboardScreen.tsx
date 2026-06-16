import React, { useState, useCallback } from 'react';
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
import { useTeacherEarnings, TimePeriod } from '../../hooks/useTeacherEarnings';
import { RevenueSummaryCards } from '../../components/teacher/RevenueSummaryCards';
import { ConversionMetricsCard } from '../../components/teacher/ConversionMetricsCard';
import { EstimatedEarningsCard } from '../../components/teacher/EstimatedEarningsCard';
import { RevenueTrendChart } from '../../components/teacher/RevenueTrendChart';
import { SubjectPerformanceCard } from '../../components/teacher/SubjectPerformanceCard';
import { LocationPerformanceCard } from '../../components/teacher/LocationPerformanceCard';
import { BenchmarkComparison } from '../../components/teacher/BenchmarkComparison';
import { GoalProgressCard } from '../../components/teacher/GoalProgressCard';

const { width } = Dimensions.get('window');

interface SubjectAnalytics {
  subject: string;
  leads: number;
  applications: number;
  conversions: number;
  revenueContribution: number;
}

interface LocationAnalytics {
  city: string;
  applications: number;
  students: number;
  revenue: number;
}

const TeacherEarningsDashboardScreen: React.FC = () => {
  const theme = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30days');
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    data,
    isLoading,
    error,
    refetch,
    setPeriod,
  } = useTeacherEarnings('your-token-here', selectedPeriod);

  const periods: { value: TimePeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: '90days', label: '90 Days' },
    { value: '1year', label: '1 Year' },
  ];

  const handlePeriodChange = useCallback((period: TimePeriod) => {
    setSelectedPeriod(period);
    setPeriod(period);
  }, [setPeriod]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleGoalUpdate = useCallback((goalType: string, value: number) => {
    Alert.alert(
      'Update Goal',
      `Set your ${goalType} goal to ${value}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update', onPress: () => console.log('Goal updated:', goalType, value) },
      ]
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Log analytics event
      console.log('Earnings Dashboard Viewed');
    }, [])
  );

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Unable To Load Metrics
          </Text>
          <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!data && !isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="trending-up-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No Conversion Data Yet
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
            Complete demos to generate metrics and see your earnings potential.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header with Period Selector */}
      <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Earnings Dashboard
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Track your performance and revenue potential
        </Text>
        
        {/* Period Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.periodSelector}
          contentContainerStyle={styles.periodSelectorContent}
        >
          {periods.map((period) => (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.periodChip,
                {
                  backgroundColor: selectedPeriod === period.value 
                    ? theme.colors.primary 
                    : theme.colors.backgroundSecondary,
                },
              ]}
              onPress={() => handlePeriodChange(period.value)}
            >
              <Text
                style={[
                  styles.periodChipText,
                  {
                    color: selectedPeriod === period.value 
                      ? '#FFFFFF' 
                      : theme.colors.text,
                  },
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Revenue Summary Cards */}
      <RevenueSummaryCards 
        kpis={data?.kpis || {
          leadsGenerated: 0,
          applicationsSubmitted: 0,
          shortlisted: 0,
          demoScheduled: 0,
          demoCompleted: 0,
          studentsConverted: 0,
        }}
        isLoading={isLoading}
      />

      {/* Conversion Metrics */}
      <ConversionMetricsCard
        metrics={data?.conversionMetrics || {
          leadToApplicationRate: 0,
          applicationToShortlistRate: 0,
          shortlistToDemoRate: 0,
          demoToStudentRate: 0,
          overallConversionRate: 0,
        }}
        isLoading={isLoading}
      />

      {/* Estimated Earnings */}
      <EstimatedEarningsCard
        earnings={data?.estimatedEarnings || {
          monthlyPotentialRevenue: 0,
          quarterlyPotentialRevenue: 0,
          annualPotentialRevenue: 0,
          averageStudentValue: 0,
        }}
        isLoading={isLoading}
      />

      {/* Revenue Trends Chart */}
      <RevenueTrendChart
        trends={data?.revenueTrends || []}
        isLoading={isLoading}
        onChartViewed={() => console.log('Revenue Chart Viewed')}
      />

      {/* Subject Performance */}
      <SubjectPerformanceCard
        subjects={data?.subjectPerformance || []}
        isLoading={isLoading}
      />

      {/* Location Performance */}
      <LocationPerformanceCard
        locations={data?.locationPerformance || []}
        isLoading={isLoading}
      />

      {/* Benchmarks */}
      <BenchmarkComparison
        benchmarks={data?.benchmarks || {
          yourConversionRate: 0,
          platformAverage: 0,
          topTeacherAverage: 0,
        }}
        isLoading={isLoading}
        onBenchmarkViewed={() => console.log('Benchmark Viewed')}
      />

      {/* Goals */}
      <GoalProgressCard
        isLoading={isLoading}
        onGoalUpdate={handleGoalUpdate}
      />

      {/* Bottom padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 16,
  },
  periodSelector: {
    marginBottom: 8,
  },
  periodSelectorContent: {
    paddingRight: 16,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  periodChipText: {
    fontSize: 14,
    fontWeight: '500',
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
    fontWeight: '400',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomPadding: {
    height: 20,
  },
});

export default TeacherEarningsDashboardScreen;
