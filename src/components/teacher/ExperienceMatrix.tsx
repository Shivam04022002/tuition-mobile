import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SubjectExperience } from '../../services/teacherPreferencesApi';
import { colors } from '../../theme/colors';

interface ExperienceMatrixProps {
  subjects: string[];
  subjectExperience: SubjectExperience[];
  onChange: (experience: SubjectExperience[]) => void;
}

const YEAR_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20];

const ExperienceMatrix: React.FC<ExperienceMatrixProps> = React.memo(({
  subjects,
  subjectExperience,
  onChange,
}) => {
  const getYears = useCallback((subject: string): number => {
    return subjectExperience.find(e => e.subject === subject)?.yearsExperience ?? 0;
  }, [subjectExperience]);

  const setYears = useCallback((subject: string, years: number) => {
    const existing = subjectExperience.filter(e => e.subject !== subject);
    if (years > 0) {
      onChange([...existing, { subject, yearsExperience: years }]);
    } else {
      onChange(existing);
    }
  }, [subjectExperience, onChange]);

  const increment = useCallback((subject: string) => {
    const current = getYears(subject);
    const idx = YEAR_OPTIONS.indexOf(current);
    const next = idx < YEAR_OPTIONS.length - 1 ? YEAR_OPTIONS[idx + 1] : current;
    setYears(subject, next);
  }, [getYears, setYears]);

  const decrement = useCallback((subject: string) => {
    const current = getYears(subject);
    const idx = YEAR_OPTIONS.indexOf(current);
    const prev = idx > 0 ? YEAR_OPTIONS[idx - 1] : 0;
    setYears(subject, prev);
  }, [getYears, setYears]);

  const getYearColor = (years: number): string => {
    if (years === 0) return colors.textTertiary;
    if (years <= 2) return colors.info;
    if (years <= 5) return colors.success;
    if (years <= 10) return colors.warning;
    return colors.error;
  };

  const getYearLabel = (years: number): string => {
    if (years === 0) return 'Not set';
    if (years === 1) return '1 year';
    return `${years} years`;
  };

  if (subjects.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Ionicons name="book-outline" size={32} color={colors.textTertiary} />
        <Text style={styles.emptyText}>Select subjects first to set experience</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerSubject}>Subject</Text>
        <Text style={styles.headerYears}>Years of Experience</Text>
      </View>

      {subjects.map((subject) => {
        const years = getYears(subject);
        const yearColor = getYearColor(years);

        return (
          <View key={subject} style={styles.row}>
            <View style={styles.subjectCol}>
              <View style={[styles.subjectDot, { backgroundColor: yearColor }]} />
              <Text style={styles.subjectName} numberOfLines={1}>{subject}</Text>
            </View>

            <View style={styles.yearsCol}>
              <TouchableOpacity
                style={[styles.stepBtn, years === 0 && styles.stepBtnDisabled]}
                onPress={() => decrement(subject)}
                disabled={years === 0}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="remove"
                  size={16}
                  color={years === 0 ? colors.textTertiary : colors.primary}
                />
              </TouchableOpacity>

              <View style={[styles.yearBadge, { borderColor: yearColor }]}>
                <Text style={[styles.yearText, { color: yearColor }]}>
                  {getYearLabel(years)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => increment(subject)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Experience Guide:</Text>
        <View style={styles.legendItems}>
          {[
            { color: colors.info, label: '1–2 yrs: Junior' },
            { color: colors.success, label: '3–5 yrs: Mid' },
            { color: colors.warning, label: '6–10 yrs: Senior' },
            { color: colors.error, label: '10+ yrs: Expert' },
          ].map(item => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  headerSubject: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerYears: {
    width: 180,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  subjectCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  subjectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subjectName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  yearsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 180,
    justifyContent: 'center',
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    backgroundColor: colors.backgroundSecondary,
  },
  yearBadge: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  yearText: {
    fontSize: 12,
    fontWeight: '700',
  },
  legend: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default ExperienceMatrix;
