import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { ProfileAvatar, PrimaryButton } from '../ui';
import type { RecommendedTutor } from '../../services/recommendationApi';

interface TutorCardProps {
  tutor: RecommendedTutor;
  onPress: (tutor: RecommendedTutor) => void;
  onContact: (tutor: RecommendedTutor) => void;
}

/**
 * Get match score badge color based on percentage
 * 90+ = Green (Excellent Match)
 * 75-89 = Blue (Good Match)
 * 60-74 = Orange (Fair Match)
 * Below 60 = Grey (Low Match)
 */
const getMatchBadgeColors = (percentage: number) => {
  if (percentage >= 90) {
    return { bg: colors.success + '20', text: colors.success };
  }
  if (percentage >= 75) {
    return { bg: colors.info + '20', text: colors.info };
  }
  if (percentage >= 60) {
    return { bg: colors.warning + '20', text: colors.warning };
  }
  return { bg: colors.textTertiary + '20', text: colors.textTertiary };
};

const TutorCard: React.FC<TutorCardProps> = React.memo(({ tutor, onPress, onContact }) => {
  const teacher = tutor.teacherProfileId;
  const name = teacher?.basicDetails?.fullName || 'Unknown';
  const photo = teacher?.basicDetails?.profilePhoto;
  const experience = teacher?.pricingRevenue?.experienceYears || 0;
  const rating = teacher?.stats?.averageRating || 0;
  const subjects = teacher?.teachingDetails?.subjects || [];
  const teachingModes = teacher?.teachingDetails?.teachingModes || [];
  const city = teacher?.locationAvailability?.city || '';
  const matchPercentage = tutor.matchPercentage || 0;
  const badgeColors = getMatchBadgeColors(matchPercentage);

  const formatMode = (mode: string): string => {
    const modeMap: Record<string, string> = {
      online: 'Online',
      student_home: 'Home',
      own_home: 'Institute',
      group: 'Group',
    };
    return modeMap[mode] || mode;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(tutor)} activeOpacity={0.9}>
      <View style={[styles.matchBadge, { backgroundColor: badgeColors.bg }]}>
        <Text style={[styles.matchPercentage, { color: badgeColors.text }]}>{matchPercentage}%</Text>
        <Text style={[styles.matchLabel, { color: badgeColors.text }]}>Match</Text>
      </View>

      <View style={styles.profileSection}>
        <ProfileAvatar name={name} imageUri={photo} size={70} />
        <View style={styles.profileInfo}>
          <Text style={styles.tutorName} numberOfLines={1}>{name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({teacher?.stats?.totalReviews || 0})</Text>
            <View style={styles.dot} />
            <Text style={styles.experienceText}>{experience} yrs exp</Text>
          </View>
          {city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.locationText}>{city}</Text>
              {tutor.distanceKm !== undefined && (
                <Text style={styles.distanceText}>• {tutor.distanceKm.toFixed(1)} km</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {subjects.length > 0 && (
        <View style={styles.subjectsRow}>
          {subjects.slice(0, 4).map((subject, index) => (
            <View key={index} style={styles.subjectChip}>
              <Text style={styles.subjectText}>{subject}</Text>
            </View>
          ))}
          {subjects.length > 4 && (
            <View style={[styles.subjectChip, styles.subjectChipMore]}>
              <Text style={styles.subjectTextMore}>+{subjects.length - 4}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.modesRow}>
        {teachingModes.slice(0, 3).map((mode, index) => (
          <View key={index} style={styles.modeChip}>
            <Ionicons name={mode === 'online' ? 'wifi-outline' : 'home-outline'} size={10} color={colors.textSecondary} />
            <Text style={styles.modeText}>{formatMode(mode)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="View Profile" onPress={() => onPress(tutor)} variant="outline" size="sm" style={styles.actionButton} />
        <PrimaryButton label="Contact" onPress={() => onContact(tutor)} variant="primary" size="sm" style={styles.actionButton} />
      </View>
    </TouchableOpacity>
  );
});

TutorCard.displayName = 'TutorCard';

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, ...shadows.card },
  matchBadge: { position: 'absolute', top: 16, right: 16, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  matchPercentage: { fontSize: 16, fontWeight: '800' },
  matchLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  profileSection: { flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 60, marginBottom: 12 },
  profileInfo: { flex: 1 },
  tutorName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '700', color: colors.text },
  reviewCount: { fontSize: 12, color: colors.textSecondary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textSecondary, marginHorizontal: 4 },
  experienceText: { fontSize: 12, color: colors.textSecondary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: 12, color: colors.textSecondary },
  distanceText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  subjectsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  subjectChip: { backgroundColor: colors.primary + '12', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  subjectText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  subjectChipMore: { backgroundColor: colors.secondary + '15' },
  subjectTextMore: { color: colors.secondary },
  modesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  modeText: { fontSize: 11, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1 },
});

export default TutorCard;
