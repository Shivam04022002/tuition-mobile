import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { TrendDataPoint } from '../../services/teacherAnalyticsApi';

const { width: screenWidth } = Dimensions.get('window');

interface TrendChartProps {
  title: string;
  data: TrendDataPoint[];
  dataKey: string;
  color: string;
  subtitle?: string;
  isLoading?: boolean;
}

const formatDate = (date: { year: number; month: number; day: number }) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.month - 1]} ${date.day}`;
};

const SkeletonChart: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
        {subtitle && <View style={[styles.skeletonSubtitle, { backgroundColor: theme.colors.border }]} />}
      </View>
      
      <View style={styles.chartContainer}>
        <View style={[styles.skeletonChart, { backgroundColor: theme.colors.border }]} />
        <View style={styles.skeletonXAxis}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.skeletonTick, { backgroundColor: theme.colors.border }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

export const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  dataKey,
  color,
  subtitle,
  isLoading = false,
}) => {
  const theme = useTheme();

  if (isLoading) {
    return <SkeletonChart title={title} subtitle={subtitle} />;
  }

  // Format data for chart
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      formattedDate: formatDate(point.date),
      [dataKey]: point[dataKey as keyof TrendDataPoint] || 0,
    }));
  }, [data, dataKey]);

  // Calculate trend statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return { trend: 0, change: 0, isPositive: false };
    
    const values = chartData.map(d => d[dataKey] as number);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = lastValue - firstValue;
    const trend = firstValue > 0 ? Math.round((change / firstValue) * 100) : 0;
    
    return {
      trend,
      change,
      isPositive: change >= 0,
    };
  }, [chartData, dataKey]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Trend</Text>
          <Text style={[styles.statValue, { color: stats.isPositive ? '#10B981' : '#EF4444' }]}>
            {stats.isPositive ? '+' : ''}{stats.trend}%
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Change</Text>
          <Text style={[styles.statValue, { color: stats.isPositive ? '#10B981' : '#EF4444' }]}>
            {stats.isPositive ? '+' : ''}{stats.change}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Latest</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {chartData.length > 0 ? String(chartData[chartData.length - 1][dataKey as keyof typeof chartData[0]] ?? 0) : '0'}
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {chartData.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.barsWrapper}>
              {(() => {
                const vals = chartData.map(d => Number(d[dataKey as keyof typeof d] ?? 0));
                const maxVal = Math.max(...vals, 1);
                const barH = 140;
                return chartData.map((item, index) => (
                  <View key={index} style={styles.barColumn}>
                    <Text style={[styles.barValueLabel, { color: theme.colors.textSecondary }]}>
                      {vals[index]}
                    </Text>
                    <View style={[styles.barTrack, { height: barH }]}>
                      <View style={[styles.bar, { height: Math.max(4, (vals[index] / maxVal) * barH), backgroundColor: color }]} />
                    </View>
                    <Text style={[styles.barPeriod, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {item.formattedDate}
                    </Text>
                  </View>
                ));
              })()}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No data available for this period
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Multi-trend chart component for comparing multiple metrics
export const MultiTrendChart: React.FC<{
  title: string;
  data: TrendDataPoint[];
  lines: Array<{
    dataKey: string;
    color: string;
    name: string;
  }>;
  isLoading?: boolean;
}> = ({ title, data, lines, isLoading = false }) => {
  const theme = useTheme();

  if (isLoading) {
    return <SkeletonChart title={title} />;
  }

  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      formattedDate: formatDate(point.date),
      ...lines.reduce((acc, line) => ({
        ...acc,
        [line.dataKey]: point[line.dataKey as keyof TrendDataPoint] || 0,
      }), {}),
    }));
  }, [data, lines]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      </View>

      <View style={styles.legend}>
        {lines.map((line) => (
          <View key={line.dataKey} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: line.color }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>{line.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.chartContainer}>
        {chartData.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.barsWrapper}>
              {chartData.map((item, index) => {
                const allMaxVals = lines.map(l =>
                  Math.max(...chartData.map(d => Number(d[l.dataKey as keyof typeof d] ?? 0)), 1)
                );
                return (
                  <View key={index} style={styles.barGroupColumn}>
                    <View style={styles.barGroup}>
                      {lines.map((line, li) => {
                        const val = Number(item[line.dataKey as keyof typeof item] ?? 0);
                        const barH = 120;
                        return (
                          <View key={line.dataKey} style={[styles.barTrack, { height: barH }]}>
                            <View style={[styles.bar, { height: Math.max(4, (val / allMaxVals[li]) * barH), backgroundColor: line.color }]} />
                          </View>
                        );
                      })}
                    </View>
                    <Text style={[styles.barPeriod, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {item.formattedDate}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No data available for this period
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartContainer: {
    alignItems: 'center',
  },
  barsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
  barColumn: {
    alignItems: 'center',
    marginHorizontal: 5,
    width: 36,
  },
  barGroupColumn: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barValueLabel: {
    fontSize: 9,
    marginBottom: 2,
    textAlign: 'center',
  },
  barTrack: {
    width: 16,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 16,
    borderRadius: 3,
  },
  barPeriod: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 44,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Skeleton styles
  skeletonTitle: {
    width: 120,
    height: 18,
    borderRadius: 9,
    marginBottom: 4,
  },
  skeletonSubtitle: {
    width: 150,
    height: 14,
    borderRadius: 7,
  },
  skeletonChart: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  skeletonXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  skeletonTick: {
    width: 20,
    height: 10,
    borderRadius: 5,
  },
});
