import React, { memo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { colors } from '../../theme/colors';
import DashboardStatCard from './DashboardStatCard';

const { width } = Dimensions.get('window');
const GAP = 12;
const CARD_WIDTH = (width - 32 - GAP) / 2;

export interface QuickStats {
  activeRequirements: number;
  applications: number;
  shortlisted: number;
  demoClasses: number;
}

interface DashboardStatsGridProps {
  stats: QuickStats | null;
  isLoading?: boolean;
  hasError?: boolean;
  onActiveRequirementsPress?: () => void;
  onApplicationsPress?: () => void;
  onShortlistedPress?: () => void;
  onDemoClassesPress?: () => void;
}

const statConfig = [
  {
    key: 'activeRequirements' as const,
    label: 'Active Requirements',
    icon: 'document-text-outline',
    bgColor: colors.primary,
  },
  {
    key: 'applications' as const,
    label: 'Applications',
    icon: 'people-outline',
    bgColor: colors.secondary,
  },
  {
    key: 'shortlisted' as const,
    label: 'Shortlisted',
    icon: 'bookmark-outline',
    bgColor: colors.pink || '#EC4899',
  },
  {
    key: 'demoClasses' as const,
    label: 'Demo Classes',
    icon: 'videocam-outline',
    bgColor: colors.accent,
  },
];

const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  stats,
  isLoading = false,
  hasError = false,
  onActiveRequirementsPress,
  onApplicationsPress,
  onShortlistedPress,
  onDemoClassesPress,
}) => {
  const getValue = useCallback((key: keyof QuickStats): number | null => {
    if (isLoading || hasError || !stats) return null;
    return stats[key];
  }, [stats, isLoading, hasError]);

  const getOnPress = useCallback((key: keyof QuickStats): (() => void) | undefined => {
    switch (key) {
      case 'activeRequirements':
        return onActiveRequirementsPress;
      case 'applications':
        return onApplicationsPress;
      case 'shortlisted':
        return onShortlistedPress;
      case 'demoClasses':
        return onDemoClassesPress;
      default:
        return undefined;
    }
  }, [onActiveRequirementsPress, onApplicationsPress, onShortlistedPress, onDemoClassesPress]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {statConfig.slice(0, 2).map((config) => (
          <DashboardStatCard
            key={config.key}
            label={config.label}
            value={getValue(config.key)}
            icon={config.icon}
            bgColor={config.bgColor}
            onPress={getOnPress(config.key)}
            isLoading={isLoading}
            hasError={hasError}
          />
        ))}
      </View>
      <View style={styles.row}>
        {statConfig.slice(2, 4).map((config) => (
          <DashboardStatCard
            key={config.key}
            label={config.label}
            value={getValue(config.key)}
            icon={config.icon}
            bgColor={config.bgColor}
            onPress={getOnPress(config.key)}
            isLoading={isLoading}
            hasError={hasError}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: GAP,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
});

export default memo(DashboardStatsGrid);
