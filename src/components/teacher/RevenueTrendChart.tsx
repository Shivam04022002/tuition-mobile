import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { RevenueTrend } from '../../services/teacherAnalyticsApi';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 64; // Account for padding and margins

interface RevenueTrendChartProps {
  title?: string;
  trends: RevenueTrend[];
  isLoading?: boolean;
  onChartViewed?: () => void;
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({
  title = 'Revenue Trends',
  trends,
  isLoading = false,
  onChartViewed,
}) => {
  const theme = useTheme();

  const chartData = useMemo(() => {
    return trends.map(trend => ({
      period: trend.period,
      students: trend.students,
      revenue: trend.revenue,
    }));
  }, [trends]);

  const totalRevenue = useMemo(() => {
    return trends.reduce((sum, trend) => sum + trend.revenue, 0);
  }, [trends]);

  const totalStudents = useMemo(() => {
    return trends.reduce((sum, trend) => sum + trend.students, 0);
  }, [trends]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <View style={styles.header}>
          <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.skeletonSubtitle, { backgroundColor: theme.colors.border }]} />
        </View>
        <View style={styles.skeletonChart}>
          <View style={[styles.skeletonLine, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.skeletonLine, { backgroundColor: theme.colors.border }]} />
        </View>
      </View>
    );
  }

  if (trends.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            No trend data available
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Start converting leads to see revenue trends
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Total: ₹{totalRevenue.toLocaleString()} • {totalStudents} students
        </Text>
      </View>

      <TouchableOpacity
        style={styles.chartContainer}
        onPress={onChartViewed}
        activeOpacity={0.8}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.barsWrapper}>
            {(() => {
              const maxVal = Math.max(...chartData.map(d => d.revenue), 1);
              const barHeight = 160;
              return chartData.map((item, index) => (
                <View key={index} style={styles.barColumn}>
                  <Text style={[styles.barLabel, { color: theme.colors.textSecondary }]}>
                    ₹{item.revenue > 999 ? `${Math.round(item.revenue / 1000)}k` : item.revenue}
                  </Text>
                  <View style={[styles.barTrack, { height: barHeight }]}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(4, (item.revenue / maxVal) * barHeight),
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barPeriod, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {item.period}
                  </Text>
                </View>
              ));
            })()}
          </View>
        </ScrollView>
      </TouchableOpacity>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            Revenue
          </Text>
        </View>
      </View>
    </View>
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
  chartContainer: {
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  barsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
  barColumn: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 40,
  },
  barLabel: {
    fontSize: 9,
    marginBottom: 4,
    textAlign: 'center',
  },
  barTrack: {
    width: 28,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  bar: {
    width: 28,
    borderRadius: 4,
  },
  barPeriod: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
    width: 40,
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
  skeletonChart: {
    height: 200,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  skeletonLine: {
    width: '100%',
    height: 2,
    borderRadius: 1,
  },
});
