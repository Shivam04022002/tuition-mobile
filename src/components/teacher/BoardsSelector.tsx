import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface BoardsSelectorProps {
  boards: string[];
  selected: string[];
  onChange: (boards: string[]) => void;
}

const BOARD_INFO: Record<string, { icon: string; description: string; color: string }> = {
  CBSE: { icon: 'school-outline', description: 'Central Board of Secondary Education', color: '#2D0A7D' },
  ICSE: { icon: 'ribbon-outline', description: 'Indian Certificate of Secondary Education', color: '#5B21B6' },
  'State Board': { icon: 'map-outline', description: 'State-level curriculum boards', color: '#3B82F6' },
  IB: { icon: 'globe-outline', description: 'International Baccalaureate', color: '#10B981' },
  IGCSE: { icon: 'earth-outline', description: 'Cambridge International', color: '#F59E0B' },
  NIOS: { icon: 'book-outline', description: 'National Institute of Open Schooling', color: '#EC4899' },
};

const BoardsSelector: React.FC<BoardsSelectorProps> = React.memo(({
  boards,
  selected,
  onChange,
}) => {
  const toggle = useCallback((board: string) => {
    if (selected.includes(board)) {
      onChange(selected.filter(b => b !== board));
    } else {
      onChange([...selected, board]);
    }
  }, [selected, onChange]);

  return (
    <View>
      {selected.length > 0 && (
        <View style={styles.selectedCount}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.selectedCountText}>{selected.length} board(s) selected</Text>
        </View>
      )}

      <View style={styles.grid}>
        {boards.map((board) => {
          const isSelected = selected.includes(board);
          const info = BOARD_INFO[board] || {
            icon: 'document-outline',
            description: '',
            color: colors.primary,
          };

          return (
            <TouchableOpacity
              key={board}
              style={[
                styles.card,
                isSelected && { borderColor: info.color, backgroundColor: `${info.color}12` },
              ]}
              onPress={() => toggle(board)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: isSelected ? info.color : `${info.color}20` }]}>
                <Ionicons
                  name={info.icon as any}
                  size={20}
                  color={isSelected ? colors.textWhite : info.color}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.boardName, isSelected && { color: info.color }]}>{board}</Text>
                {info.description ? (
                  <Text style={styles.boardDesc} numberOfLines={1}>{info.description}</Text>
                ) : null}
              </View>
              <View style={[
                styles.checkbox,
                { borderColor: info.color },
                isSelected && { backgroundColor: info.color },
              ]}>
                {isSelected && <Ionicons name="checkmark" size={12} color={colors.textWhite} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
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
  grid: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  boardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  boardDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BoardsSelector;
