import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export type SortOption = 
  | 'newest' 
  | 'oldest' 
  | 'highest_budget' 
  | 'lowest_budget' 
  | 'highest_match';

interface SortConfig {
  key: SortOption;
  label: string;
  icon: string;
}

const SORT_OPTIONS: SortConfig[] = [
  { key: 'newest', label: 'Newest First', icon: 'time-outline' },
  { key: 'oldest', label: 'Oldest First', icon: 'calendar-outline' },
  { key: 'highest_budget', label: 'Highest Budget', icon: 'trending-up-outline' },
  { key: 'lowest_budget', label: 'Lowest Budget', icon: 'trending-down-outline' },
  { key: 'highest_match', label: 'Highest Match %', icon: 'fitness-outline' },
];

interface ApplicationSortSheetProps {
  visible: boolean;
  selectedSort: SortOption;
  onSelect: (sort: SortOption) => void;
  onClose: () => void;
}

const ApplicationSortSheet: React.FC<ApplicationSortSheetProps> = ({
  visible,
  selectedSort,
  onSelect,
  onClose,
}) => {
  const theme = useTheme();

  const handleSelect = (sort: SortOption) => {
    onSelect(sort);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  Sort By
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.optionsContainer}>
                {SORT_OPTIONS.map((option) => {
                  const isSelected = selectedSort === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.option,
                        isSelected && {
                          backgroundColor: theme.colors.primary + '10',
                        },
                      ]}
                      onPress={() => handleSelect(option.key)}
                    >
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.primary + '20'
                              : theme.colors.backgroundSecondary,
                          },
                        ]}
                      >
                        <Ionicons
                          name={option.icon as any}
                          size={20}
                          color={
                            isSelected
                              ? theme.colors.primary
                              : theme.colors.textSecondary
                          }
                        />
                      </View>
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: isSelected
                              ? theme.colors.primary
                              : theme.colors.text,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={theme.colors.primary}
                          style={styles.checkIcon}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 32,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 8,
  },
});

export default ApplicationSortSheet;
