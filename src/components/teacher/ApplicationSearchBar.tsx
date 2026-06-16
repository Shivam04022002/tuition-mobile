import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface ApplicationSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  showFilterButton?: boolean;
  onFilterPress?: () => void;
  hasActiveFilters?: boolean;
  autoFocus?: boolean;
}

const ApplicationSearchBar: React.FC<ApplicationSearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search by ID, subject, class, city...',
  showFilterButton = true,
  onFilterPress,
  hasActiveFilters = false,
  autoFocus = false,
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChangeText(localValue);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [localValue, value, onChangeText]);

  // Sync with external value
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChangeText('');
    Keyboard.dismiss();
  }, [onChangeText]);

  const handleSubmitEditing = useCallback(() => {
    onSubmit?.();
    Keyboard.dismiss();
  }, [onSubmit]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.colors.card,
            borderColor: isFocused ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          value={localValue}
          onChangeText={setLocalValue}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          style={[
            styles.input,
            { color: theme.colors.text },
          ]}
          returnKeyType="search"
          onSubmitEditing={handleSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus={autoFocus}
        />
        {localValue.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {showFilterButton && (
        <TouchableOpacity
          onPress={onFilterPress}
          style={[
            styles.filterButton,
            {
              backgroundColor: hasActiveFilters
                ? theme.colors.primary + '15'
                : theme.colors.card,
              borderColor: hasActiveFilters
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={hasActiveFilters ? theme.colors.primary : theme.colors.textSecondary}
          />
          {hasActiveFilters && (
            <View
              style={[
                styles.filterBadge,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default React.memo(ApplicationSearchBar);
