import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { FilterParams } from '../../services/tutorFilterApi';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Filter Options (Static - can be fetched from API) ─────────────────────

const FILTER_OPTIONS = {
  subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Science', 'Social Studies'],
  classes: ['Class 1–5', 'Class 6–8', 'Class 9–10', 'Class 11–12'],
  modes: [
    { value: 'online', label: 'Online', icon: 'wifi-outline' },
    { value: 'offline', label: 'Offline', icon: 'home-outline' },
    { value: 'hybrid', label: 'Hybrid', icon: 'git-compare-outline' },
  ],
  genders: [
    { value: 'any', label: 'Any' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ],
  experienceRanges: [
    { value: '0-2', label: '0–2 Years' },
    { value: '3-5', label: '3–5 Years' },
    { value: '6-10', label: '6–10 Years' },
    { value: '10+', label: '10+ Years' },
  ],
  ratings: [
    { value: '4.5', label: '4.5+ Stars' },
    { value: '4.0', label: '4.0+ Stars' },
    { value: '3.5', label: '3.5+ Stars' },
  ],
  languages: ['Hindi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Punjabi'],
  availabilityOptions: [
    { value: 'weekdays', label: 'Weekdays' },
    { value: 'weekends', label: 'Weekends' },
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
  ],
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface FilterModalProps {
  visible: boolean;
  filters: FilterParams;
  onClose: () => void;
  onApply: (filters: FilterParams) => void;
  onReset: () => void;
}

type FilterSection = 
  | 'subject'
  | 'class'
  | 'mode'
  | 'gender'
  | 'experience'
  | 'rating'
  | 'budget'
  | 'language'
  | 'availability'
  | 'location';

// ─── Components ─────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const MultiSelectGrid: React.FC<{
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}> = ({ options, selected, onToggle }) => (
  <View style={styles.gridContainer}>
    {options.map((option) => {
      const isSelected = selected.includes(option);
      return (
        <TouchableOpacity
          key={option}
          style={[styles.gridItem, isSelected && styles.gridItemSelected]}
          onPress={() => onToggle(option)}
          activeOpacity={0.7}
        >
          <Text style={[styles.gridItemText, isSelected && styles.gridItemTextSelected]}>
            {option}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const SingleSelectRow: React.FC<{
  options: { value: string; label: string; icon?: string }[];
  selected: string | undefined;
  onSelect: (value: string) => void;
}> = ({ options, selected, onSelect }) => (
  <View style={styles.rowContainer}>
    {options.map((option) => {
      const isSelected = selected === option.value;
      return (
        <TouchableOpacity
          key={option.value}
          style={[styles.rowItem, isSelected && styles.rowItemSelected]}
          onPress={() => onSelect(option.value)}
          activeOpacity={0.7}
        >
          {option.icon && (
            <Ionicons
              name={option.icon as any}
              size={16}
              color={isSelected ? colors.primary : colors.textSecondary}
              style={styles.rowItemIcon}
            />
          )}
          <Text style={[styles.rowItemText, isSelected && styles.rowItemTextSelected]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const BudgetInput: React.FC<{
  minValue: string;
  maxValue: string;
  onChangeMin: (value: string) => void;
  onChangeMax: (value: string) => void;
}> = ({ minValue, maxValue, onChangeMin, onChangeMax }) => (
  <View style={styles.budgetContainer}>
    <View style={styles.budgetInputWrapper}>
      <Text style={styles.budgetLabel}>Min</Text>
      <View style={styles.budgetInputContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        <TextInput
          style={styles.budgetInput}
          value={minValue}
          onChangeText={onChangeMin}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </View>
    <Text style={styles.budgetSeparator}>–</Text>
    <View style={styles.budgetInputWrapper}>
      <Text style={styles.budgetLabel}>Max</Text>
      <View style={styles.budgetInputContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        <TextInput
          style={styles.budgetInput}
          value={maxValue}
          onChangeText={onChangeMax}
          keyboardType="numeric"
          placeholder="∞"
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </View>
  </View>
);

// ─── Main Filter Modal Component ────────────────────────────────────────────

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}) => {
  const insets = useSafeAreaInsets();
  
  // Local state for filter values
  const [localFilters, setLocalFilters] = useState<FilterParams>(filters);
  const [minBudget, setMinBudget] = useState(filters.minBudget?.toString() || '');
  const [maxBudget, setMaxBudget] = useState(filters.maxBudget?.toString() || '');

  // Update local state when filters prop changes
  React.useEffect(() => {
    setLocalFilters(filters);
    setMinBudget(filters.minBudget?.toString() || '');
    setMaxBudget(filters.maxBudget?.toString() || '');
  }, [filters, visible]);

  const handleToggleMultiSelect = useCallback((key: 'subjects' | 'classes' | 'languages' | 'availability', value: string) => {
    setLocalFilters((prev) => {
      const currentArray = prev[key] || [];
      const exists = currentArray.includes(value);
      
      if (exists) {
        return { ...prev, [key]: currentArray.filter((item) => item !== value) };
      } else {
        return { ...prev, [key]: [...currentArray, value] };
      }
    });
  }, []);

  const handleSetValue = useCallback(<K extends keyof FilterParams>(key: K, value: FilterParams[K]) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleApply = useCallback(() => {
    const finalFilters: FilterParams = {
      ...localFilters,
      minBudget: minBudget ? parseInt(minBudget, 10) : undefined,
      maxBudget: maxBudget ? parseInt(maxBudget, 10) : undefined,
    };
    onApply(finalFilters);
    onClose();
  }, [localFilters, minBudget, maxBudget, onApply, onClose]);

  const handleReset = useCallback(() => {
    setLocalFilters({
      subjects: [],
      classes: [],
      languages: [],
      availability: [],
      mode: undefined,
      gender: 'any',
      city: undefined,
      area: undefined,
      experience: undefined,
      rating: undefined,
      minBudget: undefined,
      maxBudget: undefined,
    });
    setMinBudget('');
    setMaxBudget('');
    onReset();
  }, [onReset]);

  const activeCount = useMemo(() => {
    let count = 0;
    if (localFilters.subjects?.length) count++;
    if (localFilters.classes?.length) count++;
    if (localFilters.mode) count++;
    if (localFilters.gender && localFilters.gender !== 'any') count++;
    if (localFilters.experience) count++;
    if (localFilters.rating) count++;
    if (minBudget || maxBudget) count++;
    if (localFilters.languages?.length) count++;
    if (localFilters.availability?.length) count++;
    if (localFilters.city) count++;
    if (localFilters.area) count++;
    return count;
  }, [localFilters, minBudget, maxBudget]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter Tutors</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Subject Section */}
            <SectionHeader title="Subjects" />
            <MultiSelectGrid
              options={FILTER_OPTIONS.subjects}
              selected={localFilters.subjects || []}
              onToggle={(value) => handleToggleMultiSelect('subjects', value)}
            />

            {/* Class Section */}
            <SectionHeader title="Classes" />
            <MultiSelectGrid
              options={FILTER_OPTIONS.classes}
              selected={localFilters.classes || []}
              onToggle={(value) => handleToggleMultiSelect('classes', value)}
            />

            {/* Teaching Mode Section */}
            <SectionHeader title="Teaching Mode" />
            <SingleSelectRow
              options={FILTER_OPTIONS.modes}
              selected={localFilters.mode}
              onSelect={(value) => handleSetValue('mode', value as any)}
            />

            {/* Gender Section */}
            <SectionHeader title="Gender Preference" />
            <SingleSelectRow
              options={FILTER_OPTIONS.genders}
              selected={localFilters.gender || 'any'}
              onSelect={(value) => handleSetValue('gender', value as any)}
            />

            {/* Experience Section */}
            <SectionHeader title="Experience" />
            <SingleSelectRow
              options={FILTER_OPTIONS.experienceRanges}
              selected={localFilters.experience}
              onSelect={(value) => handleSetValue('experience', value as any)}
            />

            {/* Rating Section */}
            <SectionHeader title="Minimum Rating" />
            <SingleSelectRow
              options={FILTER_OPTIONS.ratings}
              selected={localFilters.rating}
              onSelect={(value) => handleSetValue('rating', value as any)}
            />

            {/* Budget Section */}
            <SectionHeader title="Budget Range (Monthly)" />
            <BudgetInput
              minValue={minBudget}
              maxValue={maxBudget}
              onChangeMin={setMinBudget}
              onChangeMax={setMaxBudget}
            />

            {/* Language Section */}
            <SectionHeader title="Languages" />
            <MultiSelectGrid
              options={FILTER_OPTIONS.languages}
              selected={localFilters.languages || []}
              onToggle={(value) => handleToggleMultiSelect('languages', value)}
            />

            {/* Availability Section */}
            <SectionHeader title="Availability" />
            <MultiSelectGrid
              options={FILTER_OPTIONS.availabilityOptions.map(o => o.label)}
              selected={localFilters.availability || []}
              onToggle={(value) => {
                const optionValue = FILTER_OPTIONS.availabilityOptions.find(o => o.label === value)?.value;
                if (optionValue) {
                  handleToggleMultiSelect('availability', optionValue);
                }
              }}
            />

            {/* Location Section */}
            <SectionHeader title="Location" />
            <View style={styles.locationContainer}>
              <TextInput
                style={styles.locationInput}
                value={localFilters.city}
                onChangeText={(value) => handleSetValue('city', value || undefined)}
                placeholder="City (e.g., Varanasi)"
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput
                style={styles.locationInput}
                value={localFilters.area}
                onChangeText={(value) => handleSetValue('area', value || undefined)}
                placeholder="Area/Locality (optional)"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Bottom Spacer */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.7}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.7}>
              <Text style={styles.applyButtonText}>
                Apply {activeCount > 0 && `(${activeCount})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  // Grid styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridItemSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  gridItemText: {
    fontSize: 13,
    color: colors.text,
  },
  gridItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Row styles
  rowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  rowItemSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  rowItemIcon: {
    marginRight: 2,
  },
  rowItemText: {
    fontSize: 14,
    color: colors.text,
  },
  rowItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Budget styles
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetInputWrapper: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 44,
  },
  currencySymbol: {
    fontSize: 16,
    color: colors.textSecondary,
    marginRight: 4,
  },
  budgetInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: 44,
    paddingVertical: 0,
  },
  budgetSeparator: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 20,
  },
  // Location styles
  locationContainer: {
    gap: 10,
  },
  locationInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    height: 48,
  },
  // Footer styles
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FilterModal;
