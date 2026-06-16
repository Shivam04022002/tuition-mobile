import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Benchmarks } from '../../services/teacherAnalyticsApi';

interface BenchmarkComparisonProps {
  title?: string;
  benchmarks: Benchmarks;
  isLoading?: boolean;
  onBenchmarkViewed?: () => void;
}

interface BenchmarkBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  isHighlight?: boolean;
}

const BenchmarkBar: React.FC<BenchmarkBarProps> = ({ 
  label, 
  value, 
  maxValue, 
  color, 
  isHighlight = false 
}) => {
  const theme = useTheme();
  
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  
  return (
    <View style={styles.benchmarkItem}>
      <View style={styles.benchmarkHeader}>
        <Text style={[
          styles.benchmarkLabel, 
          { 
            color: isHighlight ? theme.colors.text : theme.colors.textSecondary,
            fontWeight: isHighlight ? '600' : '500'
          }
        ]}>
          {label}
        </Text>
        <Text style={[
          styles.benchmarkValue,
          { 
            color: isHighlight ? theme.colors.text : theme.colors.textSecondary,
            fontWeight: isHighlight ? '700' : '600'
          }
        ]}>
          {value.toFixed(1)}%
        </Text>
      </View>
      
      <View style={styles.barContainer}>
        <View 
          style={[
            styles.bar,
            { 
              width: `${percentage}%`,
              backgroundColor: color,
              height: isHighlight ? 8 : 6
            }
          ]} 
        />
      </View>
    </View>
  );
};

export const BenchmarkComparison: React.FC<BenchmarkComparisonProps> = ({
  title = 'Performance Benchmarks',
  benchmarks,
  isLoading = false,
  onBenchmarkViewed,
}) => {
  const theme = useTheme();

  const maxValue = Math.max(
    benchmarks.yourConversionRate,
    benchmarks.platformAverage,
    benchmarks.topTeacherAverage
  );

  const getPerformanceLevel = () => {
    if (benchmarks.yourConversionRate >= benchmarks.topTeacherAverage) {
      return { level: 'Top Performer', color: theme.colors.success, icon: 'trophy' };
    } else if (benchmarks.yourConversionRate >= benchmarks.platformAverage) {
      return { level: 'Above Average', color: theme.colors.primary, icon: 'trending-up' };
    } else {
      return { level: 'Below Average', color: theme.colors.accent, icon: 'trending-down' };
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <View style={styles.header}>
          <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.skeletonSubtitle, { backgroundColor: theme.colors.border }]} />
        </View>
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.skeletonBenchmarkItem}>
            <View style={styles.skeletonBenchmarkHeader}>
              <View style={[styles.skeletonLabel, { backgroundColor: theme.colors.border }]} />
              <View style={[styles.skeletonValue, { backgroundColor: theme.colors.border }]} />
            </View>
            <View style={[styles.skeletonBar, { backgroundColor: theme.colors.border }]} />
          </View>
        ))}
      </View>
    );
  }

  const performance = getPerformanceLevel();

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.colors.card }]}
      onPress={onBenchmarkViewed}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Compare your performance with platform averages
        </Text>
      </View>

      <View style={styles.performanceIndicator}>
        <View style={[styles.performanceBadge, { backgroundColor: `${performance.color}20` }]}>
          <Ionicons name={performance.icon as any} size={16} color={performance.color} />
          <Text style={[styles.performanceText, { color: performance.color }]}>
            {performance.level}
          </Text>
        </View>
      </View>

      <View style={styles.benchmarksList}>
        <BenchmarkBar
          label="Your Conversion Rate"
          value={benchmarks.yourConversionRate}
          maxValue={maxValue}
          color={theme.colors.primary}
          isHighlight={true}
        />
        
        <BenchmarkBar
          label="Platform Average"
          value={benchmarks.platformAverage}
          maxValue={maxValue}
          color={theme.colors.textSecondary}
        />
        
        <BenchmarkBar
          label="Top Teacher Average"
          value={benchmarks.topTeacherAverage}
          maxValue={maxValue}
          color={theme.colors.success}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          {benchmarks.yourConversionRate >= benchmarks.platformAverage 
            ? `You're ${(benchmarks.yourConversionRate - benchmarks.platformAverage).toFixed(1)}% above platform average!`
            : `You're ${(benchmarks.platformAverage - benchmarks.yourConversionRate).toFixed(1)}% below platform average. Keep improving!`
          }
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  performanceIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  performanceText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  benchmarksList: {
    gap: 16,
  },
  benchmarkItem: {
    marginBottom: 4,
  },
  benchmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  benchmarkLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  benchmarkValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  barContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Skeleton loading styles
  skeletonTitle: {
    width: 120,
    height: 18,
    borderRadius: 6,
    marginBottom: 4,
  },
  skeletonSubtitle: {
    width: 80,
    height: 14,
    borderRadius: 6,
  },
  skeletonBenchmarkItem: {
    marginBottom: 16,
  },
  skeletonBenchmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skeletonLabel: {
    width: 100,
    height: 14,
    borderRadius: 6,
  },
  skeletonValue: {
    width: 40,
    height: 16,
    borderRadius: 6,
  },
  skeletonBar: {
    height: 6,
    borderRadius: 3,
  },
});
