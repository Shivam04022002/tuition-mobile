import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { RequirementsFilters } from '../../services/requirementsMarketplaceApi';

interface Props {
  visible: boolean;
  currentFilters: RequirementsFilters;
  onApply: (filters: RequirementsFilters) => void;
  onClose: () => void;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'match',  label: 'Best Match' },
  { value: 'budget', label: 'Highest Budget' },
] as const;

const MODE_OPTIONS = [
  { value: '',       label: 'All Modes' },
  { value: 'home',   label: 'Home Tuition' },
  { value: 'online', label: 'Online' },
  { value: 'group',  label: 'Group' },
  { value: 'crash',  label: 'Crash Course' },
] as const;

const MIN_MATCH_OPTIONS = [
  { value: '',   label: 'Any Match' },
  { value: '90', label: '90%+ Excellent' },
  { value: '75', label: '75%+ Good' },
  { value: '60', label: '60%+ Fair' },
] as const;

const POSTED_DAYS_OPTIONS = [
  { value: '',   label: 'Any time' },
  { value: '1',  label: 'Today' },
  { value: '7',  label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
] as const;

const RequirementFilters: React.FC<Props> = ({ visible, currentFilters, onApply, onClose }) => {
  const { colors } = useTheme();
  const [local, setLocal] = useState<RequirementsFilters>(currentFilters);

  const update = (key: keyof RequirementsFilters, val: string) =>
    setLocal(prev => ({ ...prev, [key]: val }));

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleClear = () => {
    const empty: RequirementsFilters = {};
    setLocal(empty);
    onApply(empty);
    onClose();
  };

  const chipRow = (
    label: string,
    options: readonly { value: string; label: string }[],
    key: keyof RequirementsFilters,
  ) => (
    <View style={styles.filterSection}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {options.map(opt => {
            const active = (local[key] || '') === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.background,
                    borderColor:     active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => update(key, opt.value)}
              >
                <Text style={[styles.chipText, { color: active ? '#FFF' : colors.textSecondary }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Filters</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Sort */}
          {chipRow('Sort By', SORT_OPTIONS, 'sortBy')}

          {/* Teaching Mode */}
          {chipRow('Teaching Mode', MODE_OPTIONS, 'mode')}

          {/* Min Match */}
          {chipRow('Minimum Match', MIN_MATCH_OPTIONS, 'minMatch')}

          {/* Posted Date */}
          {chipRow('Posted Date', POSTED_DAYS_OPTIONS, 'postedDays')}

          {/* Text filters */}
          <View style={styles.filterSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Subject</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="e.g. Mathematics"
              placeholderTextColor={colors.textTertiary}
              value={local.subject || ''}
              onChangeText={v => update('subject', v)}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Board</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="e.g. CBSE, ICSE"
              placeholderTextColor={colors.textTertiary}
              value={local.board || ''}
              onChangeText={v => update('board', v)}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Class / Grade</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="e.g. Class 10"
              placeholderTextColor={colors.textTertiary}
              value={local.grade || ''}
              onChangeText={v => update('grade', v)}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>City</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="e.g. Mumbai"
              placeholderTextColor={colors.textTertiary}
              value={local.city || ''}
              onChangeText={v => update('city', v)}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Area / Locality</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="e.g. Bandra West"
              placeholderTextColor={colors.textTertiary}
              value={local.area || ''}
              onChangeText={v => update('area', v)}
            />
          </View>

          {/* Budget range */}
          <View style={styles.filterSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Budget Range (₹/month)</Text>
            <View style={styles.budgetRow}>
              <TextInput
                style={[styles.budgetInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="Min"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={local.minBudget || ''}
                onChangeText={v => update('minBudget', v)}
              />
              <Text style={[styles.budgetSep, { color: colors.textSecondary }]}>–</Text>
              <TextInput
                style={[styles.budgetInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="Max"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={local.maxBudget || ''}
                onChangeText={v => update('maxBudget', v)}
              />
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.clearBtn, { borderColor: colors.border }]}
            onPress={handleClear}
          >
            <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: colors.primary }]}
            onPress={handleApply}
          >
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  budgetInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  budgetSep: {
    fontSize: 18,
    fontWeight: '300',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  clearBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default RequirementFilters;
