import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface Props {
  score: number;
  size?: 'small' | 'medium' | 'large';
}

export function getMatchLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Low';
}

export function getMatchColor(score: number, colors: any): string {
  if (score >= 90) return colors.success;
  if (score >= 75) return colors.primary;
  if (score >= 60) return colors.accent || '#F59E0B';
  return colors.textSecondary;
}

const RequirementMatchBadge: React.FC<Props> = ({ score, size = 'medium' }) => {
  const { colors } = useTheme();
  const color = getMatchColor(score, colors);
  const label = getMatchLabel(score);

  const isSmall  = size === 'small';
  const isLarge  = size === 'large';

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: color + '18',
        borderColor: color + '40',
        paddingHorizontal: isSmall ? 8 : isLarge ? 16 : 10,
        paddingVertical:   isSmall ? 4 : isLarge ? 10 : 6,
        borderRadius:      isSmall ? 8  : isLarge ? 14 : 10,
      },
    ]}>
      <Text style={[
        styles.score,
        {
          color,
          fontSize: isSmall ? 13 : isLarge ? 22 : 16,
          lineHeight: isSmall ? 17 : isLarge ? 28 : 20,
        },
      ]}>
        {score}%
      </Text>
      <Text style={[
        styles.label,
        {
          color,
          fontSize: isSmall ? 10 : isLarge ? 13 : 11,
        },
      ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: 1,
  },
  score: {
    fontWeight: '700',
  },
  label: {
    fontWeight: '600',
    marginTop: 1,
  },
});

export default React.memo(RequirementMatchBadge);
