import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useTheme } from '../../theme';
import { SubjectPerformance } from '../../services/teacherAnalyticsApi';

const { width } = Dimensions.get('window');

interface SubjectPerformanceCardProps {
  title?: string;
  subjects: SubjectPerformance[];
  isLoading?: boolean;
}

interface SubjectItemProps {
  item: SubjectPerformance;
  index: number;
  totalRevenue: number;
}

const SubjectItem: React.FC<SubjectItemProps> = ({ item, index, totalRevenue }) => {
  const theme = useTheme();
  
  const revenuePercentage = totalRevenue > 0 ? (item.revenueContribution / totalRevenue) * 100 : 0;
  const conversionRate = item.leads > 0 ? (item.conversions / item.leads) * 100 : 0;

  return (
    <View style={[styles.subjectItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.subjectHeader}>
        <Text style={[styles.subjectName, { color: theme.colors.text }]}>
          {item.subject}
        </Text>
        <Text style={[styles.revenueAmount, { color: theme.colors.text }]}>
          ₹{item.revenueContribution.toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
            Leads
          </Text>
          <Text style={[styles.metricValue, { color: theme.colors.text }]}>
            {item.leads}
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
            Apps
          </Text>
          <Text style={[styles.metricValue, { color: theme.colors.text }]}>
            {item.applications}
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
            Students
          </Text>
          <Text style={[styles.metricValue, { color: theme.colors.text }]}>
            {item.conversions}
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
            Rate
          </Text>
          <Text style={[styles.metricValue, { color: theme.colors.text }]}>
            {conversionRate.toFixed(1)}%
          </Text>
        </View>
      </View>
      
      <View style={styles.revenueBarContainer}>
        <View 
          style={[
            styles.revenueBar,
            { 
              width: `${revenuePercentage}%`,
              backgroundColor: index === 0 ? theme.colors.primary : theme.colors.accent 
            }
          ]} 
        />
      </View>
    </View>
  );
};

export const SubjectPerformanceCard: React.FC<SubjectPerformanceCardProps> = ({
  title = 'Subject Performance',
  subjects,
  isLoading = false,
}) => {
  const theme = useTheme();

  const totalRevenue = subjects.reduce((sum, subject) => sum + subject.revenueContribution, 0);

  const renderSubjectItem = ({ item, index }: { item: SubjectPerformance; index: number }) => (
    <SubjectItem 
      item={item} 
      index={index} 
      totalRevenue={totalRevenue}
    />
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <View style={styles.header}>
          <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.skeletonSubtitle, { backgroundColor: theme.colors.border }]} />
        </View>
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.skeletonSubjectItem}>
            <View style={[styles.skeletonSubjectName, { backgroundColor: theme.colors.border }]} />
            <View style={styles.skeletonMetricsRow}>
              {[1, 2, 3, 4].map((metricIndex) => (
                <View key={metricIndex} style={styles.skeletonMetricItem}>
                  <View style={[styles.skeletonMetricLabel, { backgroundColor: theme.colors.border }]} />
                  <View style={[styles.skeletonMetricValue, { backgroundColor: theme.colors.border }]} />
                </View>
              ))}
            </View>
            <View style={[styles.skeletonRevenueBar, { backgroundColor: theme.colors.border }]} />
          </View>
        ))}
      </View>
    );
  }

  if (subjects.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            No subject data available
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Start teaching subjects to see performance breakdown
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
          Total: ₹{totalRevenue.toLocaleString()} across {subjects.length} subjects
        </Text>
      </View>

      <FlatList
        data={subjects}
        renderItem={renderSubjectItem}
        keyExtractor={(item, index) => `${item.subject}-${index}`}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
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
  listContainer: {
    gap: 12,
  },
  subjectItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  revenueAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  revenueBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  revenueBar: {
    height: '100%',
    borderRadius: 2,
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
  skeletonSubjectItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  skeletonSubjectName: {
    width: 100,
    height: 16,
    borderRadius: 6,
    marginBottom: 12,
  },
  skeletonMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skeletonMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  skeletonMetricLabel: {
    width: 30,
    height: 12,
    borderRadius: 6,
    marginBottom: 2,
  },
  skeletonMetricValue: {
    width: 20,
    height: 14,
    borderRadius: 6,
  },
  skeletonRevenueBar: {
    height: 4,
    borderRadius: 2,
  },
});
