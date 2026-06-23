import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useMyReviews } from '../../hooks/useMyReviews';
import { TutorReview } from '../../services/reviewApi';
import { EmptyState } from '../../components/ui';
import Card from '../../components/common/Card';

// Star rating component
const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color={star <= rating ? colors.warning : colors.textTertiary}
          style={styles.starIcon}
        />
      ))}
    </View>
  );
};

// Format date to "15 Jun 2026"
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Review Item Component
const ReviewItem: React.FC<{ item: TutorReview }> = ({ item }) => {
  return (
    <Card variant="outlined" margin="small" style={styles.reviewCard}>
      {/* Header with Tutor Info */}
      <View style={styles.reviewHeader}>
        <View style={styles.tutorInfo}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={20} color={colors.textTertiary} />
          </View>
          <View style={styles.tutorTextContainer}>
            <Text style={styles.tutorName}>Tutor ID: {item.tutorId.substring(0, 8)}...</Text>
            <Text style={styles.subjectText}>{item.subject} • Class {item.studentClass}</Text>
          </View>
        </View>
        <StarRating rating={item.rating} />
      </View>

      {/* Review Text */}
      <View style={styles.reviewBody}>
        <Text style={styles.reviewText} numberOfLines={3}>
          {item.reviewText}
        </Text>
      </View>

      {/* Footer with Date and Verification */}
      <View style={styles.reviewFooter}>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        {item.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      {/* Tutor Response (if exists) */}
      {item.tutorResponse && (
        <View style={styles.tutorResponseContainer}>
          <View style={styles.responseHeader}>
            <Ionicons name="return-down-forward" size={14} color={colors.info} />
            <Text style={styles.responseLabel}>Tutor Response</Text>
          </View>
          <Text style={styles.responseText} numberOfLines={2}>
            {item.tutorResponse.text}
          </Text>
        </View>
      )}
    </Card>
  );
};

// Loading Skeleton
const LoadingSkeleton: React.FC = () => (
  <View style={styles.container}>
    <View style={styles.header}>
      <View style={styles.skeletonLine} />
    </View>
    {[1, 2, 3].map((i) => (
      <Card key={i} variant="outlined" margin="small" style={[styles.reviewCard, { opacity: 0.5 }]}>
        <View style={styles.skeletonRow}>
          <View style={styles.avatarPlaceholder} />
          <View style={{ flex: 1 }}>
            <View style={[styles.skeletonLine, { width: '60%' }]} />
            <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
          </View>
        </View>
        <View style={[styles.skeletonLine, { width: '100%', marginTop: 12 }]} />
        <View style={[styles.skeletonLine, { width: '80%', marginTop: 8 }]} />
      </Card>
    ))}
  </View>
);

// Main Screen
const ParentReviewHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

  const {
    reviews,
    isLoading,
    isRefreshing,
    error,
    refresh,
    retry,
  } = useMyReviews();

  // Render item callback
  const renderItem = useCallback(({ item }: { item: TutorReview }) => {
    return <ReviewItem item={item} />;
  }, []);

  // Key extractor
  const keyExtractor = useCallback((item: TutorReview) => item._id, []);

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Reviews</Text>
          <View style={styles.placeholder} />
        </View>
        <EmptyState
          icon="alert-circle-outline"
          title="Failed to load"
          description={error}
          ctaLabel="Retry"
          onCta={retry}
          iconColor={colors.error}
        />
      </View>
    );
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Reviews</Text>
          <View style={styles.placeholder} />
        </View>
        <EmptyState
          icon="chatbubble-outline"
          title="No reviews yet"
          description="You haven't written any reviews yet. Reviews appear here after you rate tutors."
          iconColor={colors.textTertiary}
        />
      </View>
    );
  }

  // Success state with list
  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Reviews List */}
      <FlatList
        data={reviews}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  reviewCard: {
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tutorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tutorTextContainer: {
    flex: 1,
  },
  tutorName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  subjectText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  starContainer: {
    flexDirection: 'row',
  },
  starIcon: {
    marginLeft: 2,
  },
  reviewBody: {
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  tutorResponseContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.info + '10',
    borderRadius: 8,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.info,
  },
  responseText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  // Skeleton styles
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonLine: {
    height: 14,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
});

export default ParentReviewHistoryScreen;
