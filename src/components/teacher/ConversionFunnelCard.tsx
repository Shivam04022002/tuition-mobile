import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { FunnelStage } from '../../services/teacherAnalyticsApi';

const { width } = Dimensions.get('window');

interface ConversionFunnelCardProps {
  funnel: FunnelStage[];
  overallConversionRate: number;
  isLoading?: boolean;
}

const FunnelStageItem: React.FC<{
  stage: FunnelStage;
  index: number;
  totalStages: number;
  isLast: boolean;
}> = ({ stage, index, totalStages, isLast }) => {
  const theme = useTheme();
  
  // Color gradient based on conversion rate
  const getStageColor = (rate: number): [string, string] => {
    if (rate >= 80) return ['#10B981', '#059669']; // green
    if (rate >= 60) return ['#3B82F6', '#2563EB']; // blue
    if (rate >= 40) return ['#F59E0B', '#D97706']; // amber
    return ['#EF4444', '#DC2626']; // red
  };
  
  const colors = getStageColor(stage.conversionRate);
  const stageWidth = 100 - (index * 15); // Decreasing width for funnel shape
  const minWidth = 40; // Minimum width for last stage
  
  const actualWidth = Math.max(stageWidth, minWidth);
  
  return (
    <View style={styles.stageContainer}>
      <View style={styles.stageInfo}>
        <Text style={[styles.stageName, { color: theme.colors.text }]}>{stage.stage}</Text>
        <View style={styles.stageStats}>
          <Text style={[styles.stageCount, { color: theme.colors.text }]}>{stage.count}</Text>
          <Text style={[styles.conversionRate, { color: theme.colors.textSecondary }]}>
            {stage.conversionRate}%
          </Text>
        </View>
      </View>
      
      <View style={styles.funnelVisual}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.funnelBar,
            {
              width: `${actualWidth}%`,
              height: isLast ? 40 : 45,
            },
          ]}
        />
        
        {!isLast && (
          <View style={styles.connector}>
            <View style={[styles.connectorLine, { backgroundColor: theme.colors.border }]} />
            <View style={styles.arrow}>
              <Text style={[styles.arrowText, { color: theme.colors.textSecondary }]}>↓</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const SkeletonFunnelStage: React.FC<{ index: number; isLast: boolean }> = ({ index, isLast }) => {
  const theme = useTheme();
  const stageWidth = 100 - (index * 15);
  const actualWidth = Math.max(stageWidth, 40);
  
  return (
    <View style={styles.stageContainer}>
      <View style={styles.stageInfo}>
        <View style={[styles.skeletonStageName, { backgroundColor: theme.colors.border }]} />
        <View style={styles.stageStats}>
          <View style={[styles.skeletonCount, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.skeletonRate, { backgroundColor: theme.colors.border }]} />
        </View>
      </View>
      
      <View style={styles.funnelVisual}>
        <View
          style={[
            styles.skeletonFunnelBar,
            {
              width: `${actualWidth}%`,
              height: isLast ? 40 : 45,
              backgroundColor: theme.colors.border,
            },
          ]}
        />
        
        {!isLast && (
          <View style={styles.connector}>
            <View style={[styles.connectorLine, { backgroundColor: theme.colors.border }]} />
            <View style={styles.arrow}>
              <Text style={[styles.arrowText, { color: theme.colors.textSecondary }]}>↓</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export const ConversionFunnelCard: React.FC<ConversionFunnelCardProps> = ({
  funnel,
  overallConversionRate,
  isLoading = false,
}) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <View style={styles.header}>
          <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.skeletonSubtitle, { backgroundColor: theme.colors.border }]} />
        </View>
        
        <View style={styles.funnelContainer}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <SkeletonFunnelStage
              key={index}
              index={index}
              isLast={index === 5}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Conversion Funnel</Text>
        <View style={styles.overallRate}>
          <Text style={[styles.overallRateLabel, { color: theme.colors.textSecondary }]}>
            Overall Conversion
          </Text>
          <Text style={[styles.overallRateValue, { color: theme.colors.text }]}>
            {overallConversionRate}%
          </Text>
        </View>
      </View>
      
      <View style={styles.funnelContainer}>
        {funnel.map((stage, index) => (
          <FunnelStageItem
            key={stage.stage}
            stage={stage}
            index={index}
            totalStages={funnel.length}
            isLast={index === funnel.length - 1}
          />
        ))}
      </View>
      
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Shows your conversion journey from viewing leads to converting students
        </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  overallRate: {
    alignItems: 'flex-end',
  },
  overallRateLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  overallRateValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  funnelContainer: {
    marginBottom: 16,
  },
  stageContainer: {
    marginBottom: 16,
  },
  stageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stageName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  stageStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stageCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  conversionRate: {
    fontSize: 14,
    fontWeight: '500',
  },
  funnelVisual: {
    alignItems: 'center',
  },
  funnelBar: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connector: {
    alignItems: 'center',
    marginVertical: 4,
  },
  connectorLine: {
    width: 2,
    height: 20,
  },
  arrow: {
    marginTop: -2,
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Skeleton styles
  skeletonTitle: {
    width: 120,
    height: 18,
    borderRadius: 9,
  },
  skeletonSubtitle: {
    width: 80,
    height: 20,
    borderRadius: 10,
  },
  skeletonStageName: {
    width: 100,
    height: 14,
    borderRadius: 7,
  },
  skeletonCount: {
    width: 30,
    height: 16,
    borderRadius: 8,
  },
  skeletonRate: {
    width: 30,
    height: 14,
    borderRadius: 7,
  },
  skeletonFunnelBar: {
    borderRadius: 8,
  },
});
