import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface RecentSearchesProps {
  searches: string[];
  onSelect: (search: string) => void;
  onRemove: (search: string) => void;
  onClearAll: () => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({
  searches,
  onSelect,
  onRemove,
  onClearAll,
}) => {
  const [showClearModal, setShowClearModal] = useState(false);

  const handleClearAll = useCallback(() => {
    setShowClearModal(false);
    onClearAll();
  }, [onClearAll]);

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={styles.searchItem}>
        <TouchableOpacity
          style={styles.searchContent}
          onPress={() => onSelect(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.searchText} numberOfLines={1}>
            {item}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    ),
    [onSelect, onRemove]
  );

  if (searches.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Searches</Text>
        <TouchableOpacity onPress={() => setShowClearModal(true)} activeOpacity={0.7}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={searches}
        renderItem={renderItem}
        keyExtractor={(item, index) => `search-${index}-${item}`}
        scrollEnabled={false}
      />

      {/* Clear All Confirmation Modal */}
      <Modal
        visible={showClearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clear Search History?</Text>
            <Text style={styles.modalSubtitle}>
              This will remove all your recent searches. This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowClearModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleClearAll}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  clearAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  searchText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RecentSearches;
