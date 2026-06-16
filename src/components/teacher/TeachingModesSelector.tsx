import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  TEACHING_MODE_OPTIONS,
  STUDENT_TYPE_OPTIONS,
  TEACHING_LEVEL_OPTIONS,
  EXAM_PREPARATION_OPTIONS,
} from '../../services/teacherPreferencesApi';
import { colors } from '../../theme/colors';

interface TeachingModesSelectorProps {
  selectedModes: string[];
  selectedStudentTypes: string[];
  selectedLevels: string[];
  selectedExamPrep: string[];
  onModesChange: (modes: string[]) => void;
  onStudentTypesChange: (types: string[]) => void;
  onLevelsChange: (levels: string[]) => void;
  onExamPrepChange: (exams: string[]) => void;
}

const TeachingModesSelector: React.FC<TeachingModesSelectorProps> = React.memo(({
  selectedModes,
  selectedStudentTypes,
  selectedLevels,
  selectedExamPrep,
  onModesChange,
  onStudentTypesChange,
  onLevelsChange,
  onExamPrepChange,
}) => {
  const toggleItem = useCallback((
    value: string,
    current: string[],
    setter: (v: string[]) => void
  ) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  }, []);

  return (
    <View>
      {/* Teaching Modes */}
      <Text style={styles.subSectionTitle}>Teaching Modes</Text>
      <View style={styles.modeGrid}>
        {TEACHING_MODE_OPTIONS.map((mode) => {
          const isSelected = selectedModes.includes(mode.value);
          return (
            <TouchableOpacity
              key={mode.value}
              style={[styles.modeCard, isSelected && styles.modeCardSelected]}
              onPress={() => toggleItem(mode.value, selectedModes, onModesChange)}
              activeOpacity={0.75}
            >
              <View style={[styles.modeIconBox, isSelected && styles.modeIconBoxSelected]}>
                <Ionicons
                  name={mode.icon as any}
                  size={22}
                  color={isSelected ? colors.textWhite : colors.primary}
                />
              </View>
              <Text style={[styles.modeLabel, isSelected && styles.modeLabelSelected]}>
                {mode.label}
              </Text>
              <Text style={[styles.modeDesc, isSelected && styles.modeDescSelected]}>
                {mode.description}
              </Text>
              {isSelected && (
                <View style={styles.modeCheck}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.textWhite} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Student Types */}
      <Text style={styles.subSectionTitle}>Student Types</Text>
      <View style={styles.typeGrid}>
        {STUDENT_TYPE_OPTIONS.map((type) => {
          const isSelected = selectedStudentTypes.includes(type.value);
          return (
            <TouchableOpacity
              key={type.value}
              style={[styles.typeChip, isSelected && styles.typeChipSelected]}
              onPress={() => toggleItem(type.value, selectedStudentTypes, onStudentTypesChange)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={type.icon as any}
                size={16}
                color={isSelected ? colors.textWhite : colors.secondary}
              />
              <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Teaching Levels */}
      <Text style={styles.subSectionTitle}>Teaching Levels</Text>
      <View style={styles.levelRow}>
        {TEACHING_LEVEL_OPTIONS.map((level) => {
          const isSelected = selectedLevels.includes(level.value);
          return (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.levelChip,
                { borderColor: level.color },
                isSelected && { backgroundColor: level.color },
              ]}
              onPress={() => toggleItem(level.value, selectedLevels, onLevelsChange)}
              activeOpacity={0.75}
            >
              <View style={[styles.levelDot, { backgroundColor: isSelected ? colors.textWhite : level.color }]} />
              <Text style={[styles.levelText, isSelected && styles.levelTextSelected]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Exam Preparation */}
      <Text style={styles.subSectionTitle}>Exam Preparation</Text>
      <View style={styles.examGrid}>
        {EXAM_PREPARATION_OPTIONS.map((exam) => {
          const isSelected = selectedExamPrep.includes(exam);
          return (
            <TouchableOpacity
              key={exam}
              style={[styles.examChip, isSelected && styles.examChipSelected]}
              onPress={() => toggleItem(exam, selectedExamPrep, onExamPrepChange)}
              activeOpacity={0.75}
            >
              {isSelected && (
                <Ionicons name="trophy" size={12} color={colors.textWhite} style={styles.examIcon} />
              )}
              <Text style={[styles.examText, isSelected && styles.examTextSelected]}>
                {exam}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  modeCard: {
    width: '47%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    position: 'relative',
  },
  modeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  modeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modeIconBoxSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  modeLabelSelected: {
    color: colors.textWhite,
  },
  modeDesc: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  modeDescSelected: {
    color: 'rgba(255,255,255,0.7)',
  },
  modeCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    backgroundColor: colors.card,
  },
  typeChipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  typeLabelSelected: {
    color: colors.textWhite,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  levelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colors.card,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  levelTextSelected: {
    color: colors.textWhite,
  },
  examGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  examChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: colors.card,
  },
  examChipSelected: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  examIcon: {
    marginRight: 4,
  },
  examText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
  examTextSelected: {
    color: colors.textWhite,
  },
});

export default TeachingModesSelector;
