import React, { memo, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface DashboardStatCardProps {
  label: string;
  value: number | null;
  icon: string;
  bgColor: string;
  iconColor?: string;
  onPress?: () => void;
  isLoading?: boolean;
  hasError?: boolean;
}

const ANIMATION_DURATION = 800;

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  label,
  value,
  icon,
  bgColor,
  iconColor = '#FFFFFF',
  onPress,
  isLoading = false,
  hasError = false,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  // Count animation effect
  useEffect(() => {
    if (isLoading || hasError || value === null) {
      setDisplayValue(0);
      return;
    }

    animatedValue.setValue(0);
    setDisplayValue(0);

    Animated.timing(animatedValue, {
      toValue: value,
      duration: ANIMATION_DURATION,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, isLoading, hasError, animatedValue]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.skeletonContainer}>
          <View style={[styles.skeletonIcon, { backgroundColor: `${bgColor}40` }]} />
          <View style={styles.skeletonValue} />
          <View style={styles.skeletonLabel} />
        </View>
      );
    }

    const displayText = hasError ? '--' : displayValue.toString();

    return (
      <>
        <View style={[styles.iconContainer, { backgroundColor: `${bgColor}20` }]}>
          <Ionicons name={icon as any} size={22} color={bgColor} />
        </View>
        <Text style={[styles.value, { color: bgColor }]}>
          {displayText}
        </Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </>
    );
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[styles.container, shadows.sm]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress || isLoading}
    >
      {renderContent()}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    minHeight: 100,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  // Skeleton styles
  skeletonContainer: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    marginBottom: 8,
  },
  skeletonValue: {
    width: 40,
    height: 28,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  skeletonLabel: {
    width: 80,
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginTop: 8,
  },
});

export default memo(DashboardStatCard);
