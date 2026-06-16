import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../redux/hooks';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { apiConfig } from '../../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HiringMetrics {
  totalRequirements: number;
  totalApplications: number;
  shortlistedCount: number;
  demosScheduled: number;
  demosCompleted: number;
  teachersSelected: number;
  teachersHired: number;
  conversionRates: {
    applicationToShortlist: number;
    shortlistToDemo: number;
    demoToHire: number;
    overall: number;
  };
}

interface TimeSeriesData {
  date: string;
  applications: number;
  shortlisted: number;
  hired: number;
}

interface TopTeacher {
  _id: string;
  fullName: string;
  profilePhoto?: string;
  applicationsCount: number;
  hiredCount: number;
  conversionRate: number;
}

const TIME_RANGES = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'Year', value: 'year' },
];

export default function AdminHiringAnalyticsScreen() {
  const navigation = useNavigation();
  const token = useAppSelector(selectAuthToken);

  const [metrics, setMetrics] = useState<HiringMetrics | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [topTeachers, setTopTeachers] = useState<TopTeacher[]>([]);
  const [selectedRange, setSelectedRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      // In a real implementation, these would be separate API calls
      // For now, we'll simulate the data structure
      const mockMetrics: HiringMetrics = {
        totalRequirements: 156,
        totalApplications: 892,
        shortlistedCount: 312,
        demosScheduled: 198,
        demosCompleted: 156,
        teachersSelected: 89,
        teachersHired: 67,
        conversionRates: {
          applicationToShortlist: 35,
          shortlistToDemo: 63,
          demoToHire: 43,
          overall: 7.5,
        },
      };

      const mockTimeSeries: TimeSeriesData[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        applications: Math.floor(Math.random() * 50) + 10,
        shortlisted: Math.floor(Math.random() * 20) + 5,
        hired: Math.floor(Math.random() * 5) + 1,
      }));

      const mockTopTeachers: TopTeacher[] = [
        { _id: '1', fullName: 'Priya Sharma', applicationsCount: 45, hiredCount: 12, conversionRate: 26.7 },
        { _id: '2', fullName: 'Rajesh Kumar', applicationsCount: 38, hiredCount: 10, conversionRate: 26.3 },
        { _id: '3', fullName: 'Anita Patel', applicationsCount: 52, hiredCount: 14, conversionRate: 26.9 },
        { _id: '4', fullName: 'Suresh Verma', applicationsCount: 29, hiredCount: 7, conversionRate: 24.1 },
        { _id: '5', fullName: 'Meera Gupta', applicationsCount: 41, hiredCount: 9, conversionRate: 22.0 },
      ];

      setMetrics(mockMetrics);
      setTimeSeries(mockTimeSeries);
      setTopTeachers(mockTopTeachers);
    } catch (error) {
      console.error('Fetch analytics error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const renderMetricCard = (title: string, value: number | string, subtitle?: string, color?: string) => (
    <View style={[styles.metricCard, color ? { borderLeftWidth: 4, borderLeftColor: color } : null]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderFunnelVisualization = () => {
    if (!metrics) return null;

    const stages = [
      { label: 'Applications', value: metrics.totalApplications, color: '#3B82F6' },
      { label: 'Shortlisted', value: metrics.shortlistedCount, color: '#8B5CF6' },
      { label: 'Demos Scheduled', value: metrics.demosScheduled, color: '#10B981' },
      { label: 'Demos Completed', value: metrics.demosCompleted, color: '#059669' },
      { label: 'Selected', value: metrics.teachersSelected, color: '#6366F1' },
      { label: 'Hired', value: metrics.teachersHired, color: '#10B981' },
    ];

    const maxValue = Math.max(...stages.map(s => s.value));

    return (
      <View style={styles.funnelContainer}>
        <Text style={styles.sectionTitle}>Hiring Funnel</Text>
        {stages.map((stage, index) => {
          const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          const prevValue = index > 0 ? stages[index - 1].value : stage.value;
          const conversionRate = prevValue > 0 ? ((stage.value / prevValue) * 100).toFixed(1) : '100';

          return (
            <View key={stage.label} style={styles.funnelStage}>
              <View style={styles.funnelRow}>
                <Text style={styles.funnelLabel}>{stage.label}</Text>
                <View style={styles.funnelBarContainer}>
                  <View
                    style={[
                      styles.funnelBar,
                      { width: `${Math.max(width, 5)}%`, backgroundColor: stage.color },
                    ]}
                  />
                </View>
                <Text style={styles.funnelValue}>{stage.value}</Text>
              </View>
              {index > 0 && (
                <Text style={styles.conversionRate}>↓ {conversionRate}% conversion</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderConversionRates = () => {
    if (!metrics) return null;

    return (
      <View style={styles.conversionContainer}>
        <Text style={styles.sectionTitle}>Conversion Rates</Text>
        <View style={styles.conversionGrid}>
          <View style={styles.conversionItem}>
            <Text style={styles.conversionValue}>{metrics.conversionRates.applicationToShortlist}%</Text>
            <Text style={styles.conversionLabel}>App → Shortlist</Text>
          </View>
          <View style={styles.conversionItem}>
            <Text style={styles.conversionValue}>{metrics.conversionRates.shortlistToDemo}%</Text>
            <Text style={styles.conversionLabel}>Shortlist → Demo</Text>
          </View>
          <View style={styles.conversionItem}>
            <Text style={styles.conversionValue}>{metrics.conversionRates.demoToHire}%</Text>
            <Text style={styles.conversionLabel}>Demo → Hire</Text>
          </View>
          <View style={styles.conversionItem}>
            <Text style={[styles.conversionValue, styles.highlightValue]}>{metrics.conversionRates.overall}%</Text>
            <Text style={styles.conversionLabel}>Overall</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTopTeachers = () => {
    return (
      <View style={styles.topTeachersContainer}>
        <Text style={styles.sectionTitle}>Top Performing Teachers</Text>
        {topTeachers.map((teacher, index) => (
          <View key={teacher._id} style={styles.teacherRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <View style={styles.teacherInfo}>
              <Text style={styles.teacherName}>{teacher.fullName}</Text>
              <Text style={styles.teacherStats}>
                {teacher.applicationsCount} apps • {teacher.hiredCount} hired
              </Text>
            </View>
            <View style={styles.conversionBadge}>
              <Text style={styles.conversionBadgeText}>{teacher.conversionRate.toFixed(1)}%</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderTrendChart = () => {
    if (timeSeries.length === 0) return null;

    const maxValue = Math.max(...timeSeries.map(d => d.applications));
    const chartWidth = SCREEN_WIDTH - 64;
    const barWidth = chartWidth / timeSeries.length;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>30-Day Trend</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chart}>
            {timeSeries.map((data, index) => (
              <View key={data.date} style={[styles.chartBar, { width: barWidth - 2 }]}>
                <View
                  style={[
                    styles.chartBarFill,
                    {
                      height: maxValue > 0 ? (data.applications / maxValue) * 100 : 0,
                    },
                  ]}
                />
                {index % 5 === 0 && (
                  <Text style={styles.chartLabel}>{data.date.slice(5)}</Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Applications</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hiring Analytics</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Time Range Selector */}
      <View style={styles.rangeSelector}>
        {TIME_RANGES.map((range) => (
          <TouchableOpacity
            key={range.value}
            style={[
              styles.rangeChip,
              selectedRange === range.value && styles.rangeChipActive,
            ]}
            onPress={() => setSelectedRange(range.value)}
          >
            <Text
              style={[
                styles.rangeChipText,
                selectedRange === range.value && styles.rangeChipTextActive,
              ]}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchAnalytics();
            }}
          />
        }
      >
        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          {renderMetricCard('Requirements', metrics?.totalRequirements || 0, undefined, '#3B82F6')}
          {renderMetricCard('Applications', metrics?.totalApplications || 0, undefined, '#8B5CF6')}
          {renderMetricCard('Shortlisted', metrics?.shortlistedCount || 0, undefined, '#10B981')}
          {renderMetricCard('Hired', metrics?.teachersHired || 0, `${metrics?.conversionRates.overall || 0}% rate`, '#059669')}
        </View>

        {/* Hiring Funnel */}
        {renderFunnelVisualization()}

        {/* Conversion Rates */}
        {renderConversionRates()}

        {/* Trend Chart */}
        {renderTrendChart()}

        {/* Top Teachers */}
        {renderTopTeachers()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  filterButton: {
    padding: 4,
  },
  rangeSelector: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  rangeChipActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  rangeChipText: {
    fontSize: 13,
    color: '#6B7280',
  },
  rangeChipTextActive: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 56) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricTitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  funnelContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  funnelStage: {
    marginBottom: 12,
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  funnelLabel: {
    width: 110,
    fontSize: 12,
    color: '#4B5563',
  },
  funnelBarContainer: {
    flex: 1,
    height: 28,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  funnelBar: {
    height: '100%',
    borderRadius: 4,
  },
  funnelValue: {
    width: 40,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  conversionRate: {
    fontSize: 11,
    color: '#10B981',
    marginLeft: 118,
    marginTop: 2,
  },
  conversionContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  conversionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conversionItem: {
    width: (SCREEN_WIDTH - 72) / 2,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  conversionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
  },
  highlightValue: {
    color: '#10B981',
  },
  conversionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingBottom: 24,
  },
  chartBar: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 4,
    transform: [{ rotate: '-45deg' }],
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  topTeachersContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  teacherInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  teacherStats: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  conversionBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conversionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
