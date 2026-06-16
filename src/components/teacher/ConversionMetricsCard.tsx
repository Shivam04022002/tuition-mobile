import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { ConversionMetrics } from '../../services/teacherAnalyticsApi';

const { width } = Dimensions.get('window');

interface ConversionMetricsCardProps {
  metrics: ConversionMetrics;
  isLoading?: boolean;
}

const ConversionStage: React.FC<{
  stage: string;
  rate: number;
  color: string;
  isLoading?: boolean;
}> = ({ stage, rate, color, isLoading }) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={styles.stageContainer}>
        <View style={[styles.skeletonStage, { backgroundColor: theme.colors.border }]} />
      </View>
    );
  }

  const getRateColor = (rate: number) => {
    if (rate >= 70) return theme.colors.success;
    if (rate >= 50) return theme.colors.primary;
    if (rate >= 30) return theme.colors.accent;
    return theme.colors.textSecondary;
  };

  return (
    <View style={styles.stageContainer}>
      <View style={styles.stageHeader}>
        <Text style={[styles.stageText, { color: theme.colors.text }]}>{stage}</Text>
        <Text style={[styles.rateText, { color: getRateColor(rate) }]}>{rate.toFixed(1)}%</Text>
      </View>
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${Math.min(rate, 100)}%`,
              backgroundColor: color 
            }
          ]} 
        />
      </View>
    </View>
  );
};

export const ConversionMetricsCard: React.FC<ConversionMetricsCardProps> = ({
  metrics,
  isLoading = false,
}) => {
  const theme = useTheme();

  const stages = [
    { name: 'Lead → Application', rate: metrics.leadToApplicationRate, color: '#3B82F6' },
    { name: 'Application → Shortlist', rate: metrics.applicationToShortlistRate, color: '#10B981' },
    { name: 'Shortlist → Demo', rate: metrics.shortlistToDemoRate, color: '#F59E0B' },
    { name: 'Demo → Student', rate: metrics.demoToStudentRate, color: '#8B5CF6' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Conversion Metrics</Text>
        <Text style={[styles.overallRate, { color: theme.colors.textSecondary }]}>
          Overall: <Text style={[styles.overallRateValue, { color: theme.colors.text }]}>
            {metrics.overallConversionRate.toFixed(1)}%
          </Text>
        </Text>
      </View>

      <View style={[styles.funnelContainer, { backgroundColor: theme.colors.card }]}>
        {stages.map((stage, index) => (
          <View key={stage.name}>
            <ConversionStage
              stage={stage.name}
              rate={stage.rate}
              color={stage.color}
              isLoading={isLoading}
            />
            {index < stages.length - 1 && (
              <View style={styles.connector}>
                <View style={[styles.connectorLine, { backgroundColor: theme.colors.border }]} />
                <View style={styles.arrow}>
                  <Text style={[styles.arrowText, { color: theme.colors.textSecondary }]}>↓</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={[styles.footer, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Track your conversion rates to optimize your lead-to-student pipeline
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  overallRate: {
    fontSize: 14,
    fontWeight: '500',
  },
  overallRateValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  funnelContainer: {
    padding: 20,
  },
  stageContainer: {
    marginBottom: 20,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stageText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  rateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  connector: {
    alignItems: 'center',
    marginVertical: 8,
  },
  connectorLine: {
    width: 2,
    height: 20,
    borderRadius: 1,
  },
  arrow: {
    marginTop: 4,
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Skeleton loading styles
  skeletonStage: {
    height: 40,
    borderRadius: 8,
    marginBottom: 16,
  },
});
