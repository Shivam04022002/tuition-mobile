import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface TutorStatsProps {
  totalStudents: number;
  completedClasses: number;
  experienceYears: number;
  averageRating: number;
}

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color }) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <Ionicons name={icon as any} size={22} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TutorStats: React.FC<TutorStatsProps> = ({
  totalStudents,
  completedClasses,
  experienceYears,
  averageRating,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Statistics</Text>
      <View style={styles.grid}>
        <StatCard
          icon="people-outline"
          value={String(totalStudents)}
          label="Students Taught"
          color={colors.statColors.purple}
        />
        <StatCard
          icon="book-outline"
          value={String(completedClasses)}
          label="Classes Done"
          color={colors.statColors.blue}
        />
        <StatCard
          icon="time-outline"
          value={`${experienceYears}+`}
          label="Years Exp."
          color={colors.statColors.orange}
        />
        <StatCard
          icon="star-outline"
          value={averageRating.toFixed(1)}
          label="Avg Rating"
          color={colors.statColors.green}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    ...shadows.xs,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default memo(TutorStats);
