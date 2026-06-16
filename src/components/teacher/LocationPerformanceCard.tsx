import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { LocationPerformance } from '../../services/teacherAnalyticsApi';

const { width } = Dimensions.get('window');

interface LocationPerformanceCardProps {
  title?: string;
  locations: LocationPerformance[];
  isLoading?: boolean;
}

interface LocationItemProps {
  item: LocationPerformance;
  index: number;
  totalRevenue: number;
}

const LocationItem: React.FC<LocationItemProps> = ({ item, index, totalRevenue }) => {
  const theme = useTheme();
  
  const revenuePercentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
  const conversionRate = item.applications > 0 ? (item.students / item.applications) * 100 : 0;

  return (
    <View style={[styles.locationItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.locationHeader}>
        <View style={styles.locationInfo}>
          <View style={styles.locationRow}>
            <Ionicons 
              name="location-outline" 
              size={16} 
              color={theme.colors.textSecondary} 
              style={styles.locationIcon}
            />
            <Text style={[styles.cityName, { color: theme.colors.text }]}>
              {item.city}
            </Text>
          </View>
          <Text style={[styles.revenueAmount, { color: theme.colors.text }]}>
            ₹{item.revenue.toLocaleString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
            Applications
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
            {item.students}
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
        
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
            Share
          </Text>
          <Text style={[styles.metricValue, { color: theme.colors.text }]}>
            {revenuePercentage.toFixed(1)}%
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

export const LocationPerformanceCard: React.FC<LocationPerformanceCardProps> = ({
  title = 'Location Performance',
  locations,
  isLoading = false,
}) => {
  const theme = useTheme();

  const totalRevenue = locations.reduce((sum, location) => sum + location.revenue, 0);
  const totalStudents = locations.reduce((sum, location) => sum + location.students, 0);

  const renderLocationItem = ({ item, index }: { item: LocationPerformance; index: number }) => (
    <LocationItem 
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
          <View key={index} style={styles.skeletonLocationItem}>
            <View style={styles.skeletonLocationHeader}>
              <View style={[styles.skeletonCityName, { backgroundColor: theme.colors.border }]} />
              <View style={[styles.skeletonRevenueAmount, { backgroundColor: theme.colors.border }]} />
            </View>
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

  if (locations.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            No location data available
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Start teaching in different areas to see location performance
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
          ₹{totalRevenue.toLocaleString()} from {totalStudents} students across {locations.length} cities
        </Text>
      </View>

      <FlatList
        data={locations}
        renderItem={renderLocationItem}
        keyExtractor={(item, index) => `${item.city}-${index}`}
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
  locationItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  locationHeader: {
    marginBottom: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    marginRight: 8,
  },
  cityName: {
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
  skeletonLocationItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  skeletonLocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonCityName: {
    width: 100,
    height: 16,
    borderRadius: 6,
  },
  skeletonRevenueAmount: {
    width: 60,
    height: 16,
    borderRadius: 6,
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
    width: 40,
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
