import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken, selectAuthUser } from '../../redux/slices/authSlice';
import { colors } from '../../theme/colors';
import { PrimaryButton } from '../../components/ui';
import RatingBreakdown from '../../components/parent/RatingBreakdown';
import ReviewCard from '../../components/parent/ReviewCard';
import WriteReviewModal from '../../components/parent/WriteReviewModal';
import {
  createReview,
  deleteReview,
  getTutorRatings,
  getTutorReviews,
  markReviewHelpful,
  updateReview,
  ReviewSortOption,
  TutorRatings,
  TutorReview,
} from '../../services/reviewApi';

const PAGE_SIZE = 10;

const SORT_OPTIONS: Array<{ label: string; value: ReviewSortOption }> = [
  { label: 'Newest', value: 'newest' },
  { label: 'Highest Rating', value: 'highest' },
  { label: 'Lowest Rating', value: 'lowest' },
  { label: 'Most Helpful', value: 'helpful' },
];

const FILTER_OPTIONS = [5, 4, 3, 2, 1];

const trackReviewEvent = (event: string, payload?: Record<string, unknown>) => {
  if (__DEV__) console.log(`[Analytics] ${event}`, payload || '');
};

const RatingSkeleton = () => (
  <View style={styles.ratingSkeleton}>
    <View style={styles.skeletonBig} />
    <View style={styles.skeletonBars}>
      {[1, 2, 3, 4, 5].map((item) => <View key={item} style={styles.skeletonLine} />)}
    </View>
  </View>
);

const ReviewSkeleton = () => (
  <View style={styles.reviewSkeleton}>
    <View style={styles.skeletonHeaderRow}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonMeta}>
        <View style={[styles.skeletonLine, { width: '55%' }]} />
        <View style={[styles.skeletonLine, { width: '35%' }]} />
      </View>
    </View>
    <View style={[styles.skeletonLine, { width: '92%', marginTop: 14 }]} />
    <View style={[styles.skeletonLine, { width: '78%', marginTop: 8 }]} />
  </View>
);

const TutorReviewsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<any, 'TutorReviews'>>();
  const token = useAppSelector(selectAuthToken);
  const user = useAppSelector(selectAuthUser);
  const tutorId = route.params?.tutorId as string;
  const tutorName = route.params?.tutorName as string | undefined;

  const [ratings, setRatings] = useState<TutorRatings | null>(null);
  const [reviews, setReviews] = useState<TutorReview[]>([]);
  const [sort, setSort] = useState<ReviewSortOption>('newest');
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState<TutorReview | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReviews = useCallback(
    async (mode: 'initial' | 'refresh' | 'more' = 'initial') => {
      if (!tutorId) return;
      const targetPage = mode === 'more' ? page + 1 : 1;
      if (mode === 'initial') setIsLoading(true);
      if (mode === 'refresh') setIsRefreshing(true);
      if (mode === 'more') setIsLoadingMore(true);
      setError(null);

      try {
        const [ratingsData, reviewData] = await Promise.all([
          getTutorRatings(tutorId, token || undefined),
          getTutorReviews(tutorId, {
            page: targetPage,
            limit: PAGE_SIZE,
            sort,
            rating: ratingFilter,
            token: token || undefined,
          }),
        ]);
        setRatings(ratingsData);
        setReviews((prev) => (mode === 'more' ? [...prev, ...reviewData.reviews] : reviewData.reviews));
        setPage(reviewData.pagination.page);
        setHasMore(reviewData.pagination.hasMore);
      } catch (err: any) {
        setError(err?.message || 'Unable to load reviews.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [page, ratingFilter, sort, token, tutorId]
  );

  useEffect(() => {
    loadReviews('initial');
    trackReviewEvent('Review Viewed', { tutorId });
  }, [sort, ratingFilter, tutorId]);

  const currentParentReview = useMemo(() => {
    if (!user?.id) return null;
    return reviews.find((review) => String(review.parentId) === String(user.id)) || null;
  }, [reviews, user?.id]);

  const openCreate = () => {
    setEditingReview(null);
    setSubmitError(null);
    setModalVisible(true);
  };

  const openEdit = (review: TutorReview) => {
    setEditingReview(review);
    setSubmitError(null);
    setModalVisible(true);
  };

  const handleSubmit = async (payload: { rating: number; reviewText: string; subject: string; studentClass: string }) => {
    if (!token) {
      setSubmitError('Please login to write a review.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (editingReview) {
        await updateReview(token, editingReview._id, payload);
        trackReviewEvent('Review Updated', { tutorId, reviewId: editingReview._id });
      } else {
        await createReview(token, tutorId, payload);
        trackReviewEvent('Review Created', { tutorId });
      }
      setModalVisible(false);
      await loadReviews('refresh');
    } catch (err: any) {
      setSubmitError(err?.message || 'Unable to save review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (review: TutorReview) => {
    if (!token) return;
    Alert.alert('Delete Review', 'Are you sure you want to delete your review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReview(token, review._id);
            trackReviewEvent('Review Deleted', { tutorId, reviewId: review._id });
            await loadReviews('refresh');
          } catch (err: any) {
            Alert.alert('Unable to delete review', err?.message || 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleHelpful = async (review: TutorReview) => {
    if (!token) {
      Alert.alert('Login required', 'Please login to mark a review as helpful.');
      return;
    }
    try {
      const result = await markReviewHelpful(token, review._id);
      trackReviewEvent('Review Helpful Clicked', { tutorId, reviewId: review._id });
      setReviews((prev) => prev.map((item) => (item._id === review._id ? { ...item, helpfulVotes: result.helpfulVotes } : item)));
    } catch (err: any) {
      Alert.alert('Unable to update review', err?.message || 'Please try again.');
    }
  };

  const renderReview = useCallback(
    ({ item }: { item: TutorReview }) => (
      <ReviewCard
        review={item}
        canManage={String(item.parentId) === String(user?.id)}
        onEdit={openEdit}
        onDelete={handleDelete}
        onHelpful={handleHelpful}
      />
    ),
    [token, user?.id]
  );

  const header = (
    <View>
      {ratings ? <RatingBreakdown ratings={ratings} /> : <RatingSkeleton />}

      <View style={styles.controls}>
        <Text style={styles.controlTitle}>Sort</Text>
        <View style={styles.chipsRow}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity key={option.value} style={[styles.chip, sort === option.value && styles.chipActive]} onPress={() => setSort(option.value)}>
              <Text style={[styles.chipText, sort === option.value && styles.chipTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.controlTitle}>Filter by rating</Text>
        <View style={styles.chipsRow}>
          <TouchableOpacity style={[styles.chip, !ratingFilter && styles.chipActive]} onPress={() => setRatingFilter(undefined)}>
            <Text style={[styles.chipText, !ratingFilter && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {FILTER_OPTIONS.map((value) => (
            <TouchableOpacity key={value} style={[styles.chip, ratingFilter === value && styles.chipActive]} onPress={() => setRatingFilter(value)}>
              <Text style={[styles.chipText, ratingFilter === value && styles.chipTextActive]}>{value} Star</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const footer = isLoadingMore ? (
    <View style={styles.footerLoader}>
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : null;

  const empty = !isLoading ? (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>No Reviews Yet</Text>
      <Text style={styles.emptyText}>Be the first parent to review this tutor.</Text>
      <PrimaryButton label="Write Review" onPress={openCreate} style={styles.emptyButton} />
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Reviews</Text>
          {tutorName ? <Text style={styles.headerSub} numberOfLines={1}>{tutorName}</Text> : null}
        </View>
        <TouchableOpacity onPress={openCreate} style={styles.writeIcon}>
          <Ionicons name={currentParentReview ? 'create-outline' : 'add'} size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {error && !reviews.length && !isLoading ? (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load reviews.</Text>
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton label="Retry" onPress={() => loadReviews('initial')} style={styles.emptyButton} />
        </View>
      ) : (
        <FlatList
          data={isLoading ? [] : reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={header}
          ListEmptyComponent={isLoading ? <><ReviewSkeleton /><ReviewSkeleton /><ReviewSkeleton /></> : empty}
          ListFooterComponent={footer}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadReviews('refresh')} colors={[colors.primary]} />}
          onEndReached={() => {
            if (hasMore && !isLoadingMore && !isLoading) loadReviews('more');
          }}
          onEndReachedThreshold={0.5}
          removeClippedSubviews
          maxToRenderPerBatch={8}
          windowSize={8}
        />
      )}

      <View style={styles.floatingCta}>
        <PrimaryButton label={currentParentReview ? 'Edit Your Review' : 'Write Review'} onPress={() => (currentParentReview ? openEdit(currentParentReview) : openCreate())} />
      </View>

      <WriteReviewModal
        visible={modalVisible}
        initialReview={editingReview}
        isSubmitting={isSubmitting}
        error={submitError}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  writeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary + '10' },
  controls: { backgroundColor: colors.card, paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.border },
  controlTitle: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 14, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.primary },
  ratingSkeleton: { flexDirection: 'row', gap: 20, backgroundColor: colors.card, padding: 16 },
  skeletonBig: { width: 82, height: 82, borderRadius: 12, backgroundColor: colors.border },
  skeletonBars: { flex: 1, gap: 8, justifyContent: 'center' },
  reviewSkeleton: { backgroundColor: colors.card, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  skeletonHeaderRow: { flexDirection: 'row', gap: 12 },
  skeletonAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.border },
  skeletonMeta: { flex: 1, gap: 8, justifyContent: 'center' },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: colors.border },
  emptyState: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 14 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  emptyButton: { minWidth: 150 },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 14 },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  footerLoader: { paddingVertical: 18 },
  floatingCta: { padding: 16, paddingBottom: 28, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
});

export default TutorReviewsScreen;
