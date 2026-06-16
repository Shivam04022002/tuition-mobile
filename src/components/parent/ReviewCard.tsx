import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import type { TutorReview } from '../../services/reviewApi';

interface ReviewCardProps {
  review: TutorReview;
  canManage?: boolean;
  onEdit?: (review: TutorReview) => void;
  onDelete?: (review: TutorReview) => void;
  onHelpful?: (review: TutorReview) => void;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const ReviewCard: React.FC<ReviewCardProps> = ({ review, canManage, onEdit, onDelete, onHelpful }) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{review.parentName?.charAt(0)?.toUpperCase() || 'P'}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.parentName}>{review.parentName || 'Parent'}</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={13} color={colors.accent} />
          ))}
          {review.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark-outline" size={11} color={colors.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
    </View>

    <Text style={styles.reviewText}>{review.reviewText}</Text>

    <View style={styles.contextRow}>
      <View style={styles.contextChip}>
        <Text style={styles.contextText}>{review.subject}</Text>
      </View>
      <View style={styles.contextChip}>
        <Text style={styles.contextText}>{review.studentClass}</Text>
      </View>
    </View>

    {review.tutorResponse?.text ? (
      <View style={styles.responseBox}>
        <Text style={styles.responseLabel}>Tutor response</Text>
        <Text style={styles.responseText}>{review.tutorResponse.text}</Text>
      </View>
    ) : null}

    <View style={styles.actions}>
      <TouchableOpacity style={styles.helpfulButton} onPress={() => onHelpful?.(review)}>
        <Ionicons name="thumbs-up-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.helpfulText}>Helpful ({review.helpfulVotes || 0})</Text>
      </TouchableOpacity>

      {canManage && (
        <View style={styles.manageActions}>
          <TouchableOpacity onPress={() => onEdit?.(review)}>
            <Text style={styles.manageText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete?.(review)}>
            <Text style={[styles.manageText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800', color: colors.primary },
  meta: { flex: 1 },
  parentName: { fontSize: 14, fontWeight: '700', color: colors.text },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 },
  date: { fontSize: 11, color: colors.textTertiary },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 6 },
  verifiedText: { fontSize: 10, fontWeight: '600', color: colors.success },
  reviewText: { fontSize: 14, color: colors.text, lineHeight: 21, marginTop: 12 },
  contextRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  contextChip: { backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  contextText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  responseBox: { marginTop: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: colors.primary, backgroundColor: colors.primary + '08', borderRadius: 8 },
  responseLabel: { fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  responseText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  helpfulButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  helpfulText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  manageActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  manageText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  deleteText: { color: colors.error },
});

export default memo(ReviewCard);
