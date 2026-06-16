import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  seeAllLabel?: string;
  onSeeAll?: () => void;
  icon?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  seeAllLabel = 'See All',
  onSeeAll,
  icon,
}) => (
  <View style={styles.row}>
    <View style={styles.left}>
      {icon ? (
        <View style={[styles.iconDot, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name={icon as any} size={16} color={colors.primary} />
        </View>
      ) : null}
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
    {onSeeAll ? (
      <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn} activeOpacity={0.7}>
        <Text style={styles.seeAll}>{seeAllLabel}</Text>
        <Ionicons name="chevron-forward" size={11} color={colors.primary} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default SectionHeader;
