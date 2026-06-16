import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { FilterParams, getFilterLabel } from '../../services/tutorFilterApi';

interface ActiveFilterChipsProps {
  filters: FilterParams;
  onRemoveFilter: (key: keyof FilterParams) => void;
  onClearAll: () => void;
}

interface ChipConfig {
  key: keyof FilterParams;
  label: string;
  value: string | string[] | number | undefined;
}

const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
}) => {
  // Generate chips from active filters
  const chips: ChipConfig[] = React.useMemo(() => {
    const activeChips: ChipConfig[] = [];

    // Subjects
    if (filters.subjects?.length) {
      activeChips.push({
        key: 'subjects',
        label: getFilterLabel('subjects', filters.subjects),
        value: filters.subjects,
      });
    }

    // Classes
    if (filters.classes?.length) {
      activeChips.push({
        key: 'classes',
        label: getFilterLabel('classes', filters.classes),
        value: filters.classes,
      });
    }

    // Mode
    if (filters.mode) {
      activeChips.push({
        key: 'mode',
        label: filters.mode.charAt(0).toUpperCase() + filters.mode.slice(1),
        value: filters.mode,
      });
    }

    // Gender (not 'any')
    if (filters.gender && filters.gender !== 'any') {
      activeChips.push({
        key: 'gender',
        label: filters.gender.charAt(0).toUpperCase() + filters.gender.slice(1),
        value: filters.gender,
      });
    }

    // Experience
    if (filters.experience) {
      const expLabels: Record<string, string> = {
        '0-2': '0–2 Years',
        '3-5': '3–5 Years',
        '6-10': '6–10 Years',
        '10+': '10+ Years',
      };
      activeChips.push({
        key: 'experience',
        label: expLabels[filters.experience] || filters.experience,
        value: filters.experience,
      });
    }

    // Rating
    if (filters.rating) {
      activeChips.push({
        key: 'rating',
        label: `${filters.rating}+ Stars`,
        value: filters.rating,
      });
    }

    // Budget
    if (filters.minBudget !== undefined || filters.maxBudget !== undefined) {
      const min = filters.minBudget !== undefined ? `₹${filters.minBudget}` : '₹0';
      const max = filters.maxBudget !== undefined ? `₹${filters.maxBudget}` : '∞';
      activeChips.push({
        key: 'minBudget',
        label: `${min} – ${max}`,
        value: `${min}-${max}`,
      });
    }

    // Languages
    if (filters.languages?.length) {
      activeChips.push({
        key: 'languages',
        label: getFilterLabel('languages', filters.languages),
        value: filters.languages,
      });
    }

    // Availability
    if (filters.availability?.length) {
      activeChips.push({
        key: 'availability',
        label: getFilterLabel('availability', filters.availability),
        value: filters.availability,
      });
    }

    // City
    if (filters.city) {
      activeChips.push({
        key: 'city',
        label: filters.city,
        value: filters.city,
      });
    }

    // Area
    if (filters.area) {
      activeChips.push({
        key: 'area',
        label: filters.area,
        value: filters.area,
      });
    }

    return activeChips;
  }, [filters]);

  const handleRemove = useCallback((key: keyof FilterParams) => {
    onRemoveFilter(key);
  }, [onRemoveFilter]);

  if (chips.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chips.map((chip, index) => (
          <View key={`${chip.key}-${index}`} style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={1}>
              {chip.label}
            </Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemove(chip.key)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.clearAllChip} onPress={onClearAll} activeOpacity={0.7}>
          <Text style={styles.clearAllText}>Clear All</Text>
          <Ionicons name="close" size={14} color={colors.error} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '12',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
    maxWidth: 120,
  },
  removeButton: {
    marginLeft: 2,
  },
  clearAllChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.error,
  },
});

export default ActiveFilterChips;
