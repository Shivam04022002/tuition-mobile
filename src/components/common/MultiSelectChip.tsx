import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

interface MultiSelectChipProps {
  options: string[];
  selected: string[];
  onSelect: (selected: string[]) => void;
  multiple?: boolean;
  maxSelect?: number;
  containerStyle?: ViewStyle;
  chipStyle?: ViewStyle;
}

const MultiSelectChip: React.FC<MultiSelectChipProps> = ({
  options,
  selected,
  onSelect,
  multiple = true,
  maxSelect,
  containerStyle,
  chipStyle,
}) => {
  const theme = useTheme();

  const handlePress = (option: string) => {
    if (multiple) {
      if (selected.includes(option)) {
        onSelect(selected.filter((item) => item !== option));
      } else {
        if (!maxSelect || selected.length < maxSelect) {
          onSelect([...selected, option]);
        }
      }
    } else {
      onSelect(selected.includes(option) ? [] : [option]);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected
                  ? theme.colors.primary
                  : theme.colors.backgroundSecondary,
                borderColor: isSelected
                  ? theme.colors.primary
                  : theme.colors.border,
              },
              chipStyle,
            ]}
            onPress={() => handlePress(option)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected
                    ? theme.colors.textWhite
                    : theme.colors.text,
                },
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default MultiSelectChip;
