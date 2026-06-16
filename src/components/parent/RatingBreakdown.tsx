import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import type { TutorRatings } from '../../services/reviewApi';

interface RatingBreakdownProps {
  ratings: TutorRatings;
}

const RatingBreakdown: React.FC<RatingBreakdownProps> = ({ ratings }) => {
  const { averageRating, totalReviews, breakdown } = ratings;

  return (
    <View style={styles.container}>
      {/* Left: Big average */}
      <View style={styles.leftPanel}>
        <Text style={styles.bigRating}>{averageRating.toFixed(1)}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons
              key={s}
              name={s <= Math.round(averageRating) ? 'star' : 'star-outline'}
              size={14}
              color={colors.accent}
            />
          ))}
        </View>
        <Text style={styles.totalText}>{totalReviews} reviews</Text>
      </View>

      {/* Right: Bar breakdown */}
      <View style={styles.rightPanel}>
        {[5, 4, 3, 2, 1].map((star) => {
          const item = breakdown?.[String(star)] || { count: 0, percentage: 0 };
          return (
            <View key={star} style={styles.barRow}>
              <View style={styles.starLabel}>
                <Text style={styles.starNum}>{star}</Text>
                <Ionicons name="star" size={11} color={colors.accent} />
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${item.percentage}%`,
                      backgroundColor: star >= 4 ? colors.success : star === 3 ? colors.warning : colors.error,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barCount}>{item.count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    gap: 20,
  },
  leftPanel: {
    alignItems: 'center',
    minWidth: 72,
  },
  bigRating: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 44,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  totalText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  rightPanel: {
    flex: 1,
    gap: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 24,
  },
  starNum: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barCount: {
    fontSize: 11,
    color: colors.textTertiary,
    width: 22,
    textAlign: 'right',
    fontWeight: '500',
  },
});

export default memo(RatingBreakdown);
