import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { EarningsKPIs } from '../../services/teacherAnalyticsApi';

const { width } = Dimensions.get('window');

interface RevenueSummaryCardsProps {
  kpis: EarningsKPIs;
  isLoading?: boolean;
}

const RevenueCard: React.FC<{
  title: string;
  value: number | string;
  icon: string;
  color: string;
  subtitle?: string;
  isLoading?: boolean;
}> = ({ title, value, icon, color, subtitle, isLoading }) => {
  const theme = useTheme();
  
  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <View style={[styles.skeletonIcon, { backgroundColor: theme.colors.border }]} />
        </View>
        <View style={styles.textContainer}>
          <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.skeletonValue, { backgroundColor: theme.colors.border }]} />
          {subtitle && <View style={[styles.skeletonSubtitle, { backgroundColor: theme.colors.border }]} />}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
      </View>
    </View>
  );
};

export const RevenueSummaryCards: React.FC<RevenueSummaryCardsProps> = ({
  kpis,
  isLoading = false,
}) => {
  const theme = useTheme();

  const kpiCards = [
    {
      title: 'Leads Generated',
      value: kpis.leadsGenerated,
      icon: 'people-outline',
      color: '#3B82F6', // blue
    },
    {
      title: 'Applications',
      value: kpis.applicationsSubmitted,
      icon: 'document-text-outline',
      color: '#10B981', // green
    },
    {
      title: 'Shortlisted',
      value: kpis.shortlisted,
      icon: 'star-outline',
      color: '#F59E0B', // orange
    },
    {
      title: 'Demo Scheduled',
      value: kpis.demoScheduled,
      icon: 'calendar-outline',
      color: '#8B5CF6', // purple
    },
    {
      title: 'Demo Completed',
      value: kpis.demoCompleted,
      icon: 'checkmark-circle-outline',
      color: '#06B6D4', // cyan
    },
    {
      title: 'Students Converted',
      value: kpis.studentsConverted,
      icon: 'school-outline',
      color: '#EC4899', // pink
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Revenue Overview</Text>
      
      {/* Top 4 KPIs in grid */}
      <View style={styles.grid}>
        {kpiCards.slice(0, 4).map((card, index) => (
          <RevenueCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            isLoading={isLoading}
          />
        ))}
      </View>

      {/* Bottom 2 metrics in full width */}
      <View style={styles.bottomRow}>
        {kpiCards.slice(4).map((card, index) => (
          <View key={index} style={[styles.fullWidthCard, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${card.color}20` }]}>
              <Ionicons name={card.icon as any} size={20} color={card.color} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{card.title}</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{card.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
  },
  bottomRow: {
    marginTop: 8,
  },
  fullWidthCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  // Skeleton loading styles
  skeletonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  skeletonTitle: {
    width: 60,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  skeletonValue: {
    width: 40,
    height: 20,
    borderRadius: 6,
    marginBottom: 2,
  },
  skeletonSubtitle: {
    width: 50,
    height: 11,
    borderRadius: 6,
  },
});
