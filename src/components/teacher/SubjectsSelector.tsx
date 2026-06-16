import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface SubjectsSelectorProps {
  allSubjects: string[];
  selected: string[];
  onChange: (subjects: string[]) => void;
  customSubjects?: string[];
  onCustomSubjectAdd?: (subject: string) => void;
}

const SubjectsSelector: React.FC<SubjectsSelectorProps> = React.memo(({
  allSubjects,
  selected,
  onChange,
  customSubjects = [],
  onCustomSubjectAdd,
}) => {
  const [search, setSearch] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const combinedSubjects = useMemo(() => {
    const custom = customSubjects.filter(s => !allSubjects.includes(s));
    return [...allSubjects, ...custom];
  }, [allSubjects, customSubjects]);

  const filtered = useMemo(() => {
    if (!search.trim()) return combinedSubjects;
    return combinedSubjects.filter(s =>
      s.toLowerCase().includes(search.toLowerCase())
    );
  }, [combinedSubjects, search]);

  const toggle = useCallback((subject: string) => {
    if (selected.includes(subject)) {
      onChange(selected.filter(s => s !== subject));
    } else {
      onChange([...selected, subject]);
    }
  }, [selected, onChange]);

  const handleAddCustom = useCallback(() => {
    const trimmed = customInput.trim();
    if (!trimmed || trimmed.length < 2) return;
    if (!selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    onCustomSubjectAdd?.(trimmed);
    setCustomInput('');
    setShowCustomInput(false);
  }, [customInput, selected, onChange, onCustomSubjectAdd]);

  const renderChip = useCallback(({ item }: { item: string }) => {
    const isSelected = selected.includes(item);
    const isCustom = !allSubjects.includes(item);
    return (
      <TouchableOpacity
        style={[
          styles.chip,
          isSelected && styles.chipSelected,
          isCustom && styles.chipCustom,
          isSelected && isCustom && styles.chipCustomSelected,
        ]}
        onPress={() => toggle(item)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <Ionicons name="checkmark" size={12} color={colors.textWhite} style={styles.chipCheck} />
        )}
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {item}
        </Text>
        {isCustom && (
          <View style={styles.customBadge}>
            <Text style={styles.customBadgeText}>Custom</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selected, allSubjects, toggle]);

  return (
    <View>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subjects..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCustomInput(v => !v)}
        >
          <Ionicons name={showCustomInput ? 'close' : 'add'} size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showCustomInput && (
        <View style={styles.customInputRow}>
          <TextInput
            style={styles.customInput}
            placeholder="e.g. French, IELTS, Robotics..."
            placeholderTextColor={colors.textTertiary}
            value={customInput}
            onChangeText={setCustomInput}
            maxLength={40}
            autoFocus
            onSubmitEditing={handleAddCustom}
          />
          <TouchableOpacity
            style={[styles.addCustomBtn, !customInput.trim() && styles.addCustomBtnDisabled]}
            onPress={handleAddCustom}
            disabled={!customInput.trim()}
          >
            <Text style={styles.addCustomBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      {selected.length > 0 && (
        <View style={styles.selectedCount}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.selectedCountText}>{selected.length} selected</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        renderItem={renderChip}
        keyExtractor={(item) => item}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={styles.chipRow}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No subjects match "{search}"</Text>
        }
      />
    </View>
  );
});

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    backgroundColor: colors.infoLight,
    borderRadius: 10,
    padding: 10,
  },
  customInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.info,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.card,
  },
  addCustomBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addCustomBtnDisabled: {
    backgroundColor: colors.textTertiary,
  },
  addCustomBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '600',
  },
  selectedCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  selectedCountText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  chipRow: {
    marginBottom: 8,
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    minHeight: 36,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipCustom: {
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  chipCustomSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    borderStyle: 'solid',
  },
  chipCheck: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  chipTextSelected: {
    color: colors.textWhite,
  },
  customBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    paddingHorizontal: 4,
    marginLeft: 4,
  },
  customBadgeText: {
    fontSize: 9,
    color: colors.textWhite,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
});

export default SubjectsSelector;
