import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import RequirementMatchBadge, { getMatchColor } from './RequirementMatchBadge';
import { RequirementListItem } from '../../services/requirementsMarketplaceApi';

interface Props {
  item: RequirementListItem;
  onPress: (item: RequirementListItem) => void;
  onApply?: (item: RequirementListItem) => void;
  showApplyButton?: boolean;
}

const MODE_LABELS: Record<string, string> = {
  home:   'Home Tuition',
  online: 'Online',
  group:  'Group',
  crash:  'Crash Course',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const RequirementCard: React.FC<Props> = ({ item, onPress, onApply, showApplyButton = false }) => {
  const { colors } = useTheme();
  const matchColor = getMatchColor(item.matchScore, colors);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress(item)}
      activeOpacity={0.82}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.reqId, { color: colors.textSecondary }]}>
            {item.requirementId}
          </Text>
          <Text style={[styles.gradeBoard, { color: colors.text }]}>
            {item.studentDetails.grade} • {item.studentDetails.board}
          </Text>
        </View>
        <RequirementMatchBadge score={item.matchScore} size="medium" />
      </View>

      {/* Subjects */}
      <View style={styles.subjectRow}>
        {item.subjects.slice(0, 4).map((s, i) => (
          <View key={i} style={[styles.subjectChip, { backgroundColor: colors.primary + '14' }]}>
            <Text style={[styles.subjectChipText, { color: colors.primary }]}>{s}</Text>
          </View>
        ))}
        {item.subjects.length > 4 && (
          <View style={[styles.subjectChip, { backgroundColor: colors.border }]}>
            <Text style={[styles.subjectChipText, { color: colors.textSecondary }]}>
              +{item.subjects.length - 4}
            </Text>
          </View>
        )}
      </View>

      {/* Details row */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.location.city}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            ₹{item.budget.minAmount.toLocaleString()}–₹{item.budget.maxAmount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="desktop-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {MODE_LABELS[item.tuitionType] || item.tuitionType}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {item.schedule.daysPerWeek}d/wk
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              {item.applicationsCount} applied
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              {timeAgo(item.createdAt)}
            </Text>
          </View>
        </View>

        {showApplyButton && onApply ? (
          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: matchColor }]}
            onPress={() => onApply(item)}
          >
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.viewHint}>
            <Text style={[styles.viewHintText, { color: colors.primary }]}>View details</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  reqId: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  gradeBoard: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  subjectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  subjectChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  subjectChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: '45%',
  },
  detailText: {
    fontSize: 13,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  footerLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  viewHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewHintText: {
    fontSize: 13,
    fontWeight: '600',
  },
  applyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default React.memo(RequirementCard);
