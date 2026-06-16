import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { ProfileCompletionSection } from '../../services/teacherOnboardingApi';

interface SectionItem {
  key: keyof ProfileCompletionSection;
  label: string;
  icon: string;
  step: number;
}

const SECTIONS: SectionItem[] = [
  { key: 'basicDetails', label: 'Basic Details', icon: 'person-outline', step: 1 },
  { key: 'profilePhoto', label: 'Profile Photo', icon: 'camera-outline', step: 1 },
  { key: 'education', label: 'Education', icon: 'school-outline', step: 2 },
  { key: 'subjects', label: 'Subjects', icon: 'book-outline', step: 3 },
  { key: 'classes', label: 'Classes', icon: 'library-outline', step: 3 },
  { key: 'teachingModes', label: 'Teaching Modes', icon: 'laptop-outline', step: 3 },
  { key: 'location', label: 'Location', icon: 'location-outline', step: 4 },
  { key: 'availability', label: 'Availability', icon: 'time-outline', step: 4 },
  { key: 'pricing', label: 'Pricing', icon: 'cash-outline', step: 5 },
  { key: 'documents', label: 'Documents', icon: 'document-outline', step: 6 },
];

interface ProfileCompletionCardProps {
  percentage: number;
  completedCount: number;
  totalCount: number;
  sections: ProfileCompletionSection;
  canApply: boolean;
  onEditSection?: (step: number) => void;
  compact?: boolean;
}

const getCompletionColor = (pct: number): string => {
  if (pct >= 100) return colors.success;
  if (pct >= 70) return colors.primary;
  if (pct >= 40) return colors.accent;
  return colors.error;
};

const getCompletionLabel = (pct: number): string => {
  if (pct >= 100) return 'Profile Complete!';
  if (pct >= 70) return 'Almost Ready';
  if (pct >= 40) return 'In Progress';
  return 'Just Started';
};

const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  percentage,
  completedCount,
  totalCount,
  sections,
  canApply,
  onEditSection,
  compact = false,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: percentage / 100,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage, progressAnim]);

  const barColor = getCompletionColor(percentage);
  const label = getCompletionLabel(percentage);

  const incompleteSections = SECTIONS.filter(s => !sections[s.key]);

  return (
    <View style={[styles.card, shadows.sm]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>Profile Completion</Text>
          <Text style={[styles.completionLabel, { color: barColor }]}>{label}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: barColor + '20', borderColor: barColor }]}>
          <Text style={[styles.badgeText, { color: barColor }]}>{percentage}%</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: barColor,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressCaption}>
        {completedCount} of {totalCount} sections complete
      </Text>

      {/* Threshold hint */}
      {!canApply && (
        <View style={[styles.hintBox, { backgroundColor: colors.accent + '15' }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
          <Text style={[styles.hintText, { color: colors.accent }]}>
            Complete 70% of your profile to apply for requirements
          </Text>
        </View>
      )}
      {canApply && percentage < 100 && (
        <View style={[styles.hintBox, { backgroundColor: colors.success + '15' }]}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
          <Text style={[styles.hintText, { color: colors.success }]}>
            You can now apply for requirements
          </Text>
        </View>
      )}

      {/* Section checklist — hidden in compact mode */}
      {!compact && (
        <View style={styles.sectionList}>
          {SECTIONS.map(section => {
            const done = sections[section.key];
            return (
              <TouchableOpacity
                key={section.key}
                style={styles.sectionRow}
                onPress={() => onEditSection?.(section.step)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.sectionIconBox,
                  { backgroundColor: done ? colors.success + '20' : colors.error + '10' },
                ]}>
                  <Ionicons
                    name={section.icon as any}
                    size={16}
                    color={done ? colors.success : colors.textTertiary}
                  />
                </View>
                <Text style={[styles.sectionLabel, { color: done ? colors.text : colors.textSecondary }]}>
                  {section.label}
                </Text>
                <Ionicons
                  name={done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={done ? colors.success : colors.border}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Compact mode: only show incomplete */}
      {compact && incompleteSections.length > 0 && (
        <View style={styles.incompleteRow}>
          {incompleteSections.slice(0, 3).map(section => (
            <TouchableOpacity
              key={section.key}
              style={styles.incompleteChip}
              onPress={() => onEditSection?.(section.step)}
            >
              <Text style={styles.incompleteChipText}>{section.label}</Text>
            </TouchableOpacity>
          ))}
          {incompleteSections.length > 3 && (
            <View style={styles.incompleteChip}>
              <Text style={styles.incompleteChipText}>+{incompleteSections.length - 3}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  completionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressCaption: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  sectionList: {
    gap: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '60',
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  incompleteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  incompleteChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.error + '15',
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  incompleteChipText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
  },
});

export default ProfileCompletionCard;
