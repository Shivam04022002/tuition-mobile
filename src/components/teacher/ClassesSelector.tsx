import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClassGroup } from '../../services/teacherPreferencesApi';
import { colors } from '../../theme/colors';

interface ClassesSelectorProps {
  classGroups: ClassGroup[];
  selected: string[];
  onChange: (classes: string[]) => void;
}

const GROUP_COLORS: Record<string, string> = {
  'Class 1–5': '#10B981',
  'Class 6–8': '#3B82F6',
  'Class 9–10': '#8B5CF6',
  'Class 11–12': '#EC4899',
  'College': '#F59E0B',
  'Competitive Exams': '#EF4444',
};

const ClassesSelector: React.FC<ClassesSelectorProps> = React.memo(({
  classGroups,
  selected,
  onChange,
}) => {
  const isGroupFullySelected = useCallback((group: ClassGroup) => {
    return group.values.every(v => selected.includes(v));
  }, [selected]);

  const isGroupPartiallySelected = useCallback((group: ClassGroup) => {
    return group.values.some(v => selected.includes(v)) && !isGroupFullySelected(group);
  }, [selected, isGroupFullySelected]);

  const toggleGroup = useCallback((group: ClassGroup) => {
    if (isGroupFullySelected(group)) {
      onChange(selected.filter(s => !group.values.includes(s)));
    } else {
      const newSelected = [...selected];
      group.values.forEach(v => {
        if (!newSelected.includes(v)) newSelected.push(v);
      });
      onChange(newSelected);
    }
  }, [selected, onChange, isGroupFullySelected]);

  const toggleClass = useCallback((cls: string) => {
    if (selected.includes(cls)) {
      onChange(selected.filter(s => s !== cls));
    } else {
      onChange([...selected, cls]);
    }
  }, [selected, onChange]);

  return (
    <View>
      {selected.length > 0 && (
        <View style={styles.selectedCount}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.selectedCountText}>{selected.length} class(es) selected</Text>
        </View>
      )}

      {classGroups.map((group) => {
        const isFullSelected = isGroupFullySelected(group);
        const isPartial = isGroupPartiallySelected(group);
        const groupColor = GROUP_COLORS[group.group] || colors.primary;

        return (
          <View key={group.group} style={styles.groupContainer}>
            <TouchableOpacity
              style={[
                styles.groupHeader,
                { borderLeftColor: groupColor },
                (isFullSelected || isPartial) && { backgroundColor: `${groupColor}15` },
              ]}
              onPress={() => toggleGroup(group)}
              activeOpacity={0.7}
            >
              <View style={styles.groupLeft}>
                <View style={[styles.groupDot, { backgroundColor: groupColor }]} />
                <Text style={[styles.groupTitle, { color: groupColor }]}>{group.group}</Text>
                {isPartial && (
                  <View style={[styles.partialBadge, { backgroundColor: groupColor }]}>
                    <Text style={styles.partialBadgeText}>
                      {group.values.filter(v => selected.includes(v)).length}/{group.values.length}
                    </Text>
                  </View>
                )}
              </View>
              <View style={[
                styles.groupCheckbox,
                { borderColor: groupColor },
                isFullSelected && { backgroundColor: groupColor },
              ]}>
                {isFullSelected && (
                  <Ionicons name="checkmark" size={12} color={colors.textWhite} />
                )}
                {isPartial && !isFullSelected && (
                  <View style={[styles.partialDot, { backgroundColor: groupColor }]} />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.classChips}>
              {group.values.map((cls) => {
                const isSelected = selected.includes(cls);
                return (
                  <TouchableOpacity
                    key={cls}
                    style={[
                      styles.classChip,
                      { borderColor: groupColor },
                      isSelected && { backgroundColor: groupColor, borderColor: groupColor },
                    ]}
                    onPress={() => toggleClass(cls)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.classChipText,
                      isSelected && styles.classChipTextSelected,
                    ]}>
                      {cls}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  selectedCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  selectedCountText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  groupContainer: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 4,
    backgroundColor: colors.backgroundSecondary,
  },
  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  partialBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  partialBadgeText: {
    fontSize: 10,
    color: colors.textWhite,
    fontWeight: '600',
  },
  groupCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partialDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  classChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: colors.card,
  },
  classChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  classChipTextSelected: {
    color: colors.textWhite,
  },
});

export default ClassesSelector;
