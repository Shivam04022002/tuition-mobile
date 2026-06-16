import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken } from '../redux/slices/authSlice';
import { logout } from '../redux/slices/authSlice';
import {
  getTutorReviews,
  getTutorRatings,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  ReviewSortOption,
  TutorRatings,
  TutorReview,
} from '../services/reviewApi';

const PAGE_SIZE = 10;

export interface UseReviewsResult {
  reviews: TutorReview[];
  ratings: TutorRatings | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  isSubmitting: boolean;
  hasMore: boolean;
  error: string | null;
  submitError: string | null;
  sort: ReviewSortOption;
  ratingFilter: number | undefined;
  setSort: (sort: ReviewSortOption) => void;
  setRatingFilter: (rating: number | undefined) => void;
  refresh: () => Promise<void>;
  loadMore: () => void;
  submitReview: (payload: { rating: number; reviewText: string; subject: string; studentClass: string }) => Promise<void>;
  editReview: (reviewId: string, payload: { rating?: number; reviewText?: string; subject?: string; studentClass?: string }) => Promise<void>;
  removeReview: (reviewId: string) => Promise<void>;
  toggleHelpful: (reviewId: string) => Promise<void>;
  clearSubmitError: () => void;
}

export const useReviews = (tutorId: string): UseReviewsResult => {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  const [reviews, setReviews] = useState<TutorReview[]>([]);
  const [ratings, setRatings] = useState<TutorRatings | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sort, setSort] = useState<ReviewSortOption>('newest');
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleUnauthorized = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const fetchReviews = useCallback(
    async (mode: 'initial' | 'refresh' | 'more') => {
      if (!tutorId) return;
      const targetPage = mode === 'more' ? page + 1 : 1;
      if (mode === 'initial') setIsLoading(true);
      if (mode === 'refresh') setIsRefreshing(true);
      if (mode === 'more') setIsLoadingMore(true);
      setError(null);

      try {
        const [ratingsData, reviewsData] = await Promise.all([
          getTutorRatings(tutorId, token || undefined),
          getTutorReviews(tutorId, {
            page: targetPage,
            limit: PAGE_SIZE,
            sort,
            rating: ratingFilter,
            token: token || undefined,
          }),
        ]);

        if (!isMounted.current) return;

        setRatings(ratingsData);
        setReviews((prev) =>
          mode === 'more' ? [...prev, ...reviewsData.reviews] : reviewsData.reviews
        );
        setPage(reviewsData.pagination.page);
        setHasMore(reviewsData.pagination.hasMore);
      } catch (err: any) {
        if (!isMounted.current) return;
        if (err?.message === 'Unauthorized') {
          handleUnauthorized();
          return;
        }
        setError(err?.message || 'Unable to load reviews.');
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }
    },
    [page, ratingFilter, sort, token, tutorId, handleUnauthorized]
  );

  useEffect(() => {
    fetchReviews('initial');
  }, [sort, ratingFilter, tutorId]);

  const refresh = useCallback(async () => {
    await fetchReviews('refresh');
  }, [fetchReviews]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchReviews('more');
    }
  }, [hasMore, isLoadingMore, isLoading, fetchReviews]);

  const submitReview = useCallback(
    async (payload: { rating: number; reviewText: string; subject: string; studentClass: string }) => {
      if (!token) {
        setSubmitError('Please login to write a review.');
        return;
      }
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        await createReview(token, tutorId, payload);
        if (__DEV__) console.log('[Analytics] Review Created', { tutorId });
        await fetchReviews('refresh');
      } catch (err: any) {
        if (!isMounted.current) return;
        if (err?.message === 'Unauthorized') { handleUnauthorized(); return; }
        setSubmitError(err?.message || 'Unable to submit review.');
        throw err;
      } finally {
        if (isMounted.current) setIsSubmitting(false);
      }
    },
    [token, tutorId, fetchReviews, handleUnauthorized]
  );

  const editReview = useCallback(
    async (reviewId: string, payload: { rating?: number; reviewText?: string; subject?: string; studentClass?: string }) => {
      if (!token) {
        setSubmitError('Please login to edit a review.');
        return;
      }
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        await updateReview(token, reviewId, payload);
        if (__DEV__) console.log('[Analytics] Review Updated', { tutorId, reviewId });
        await fetchReviews('refresh');
      } catch (err: any) {
        if (!isMounted.current) return;
        if (err?.message === 'Unauthorized') { handleUnauthorized(); return; }
        setSubmitError(err?.message || 'Unable to update review.');
        throw err;
      } finally {
        if (isMounted.current) setIsSubmitting(false);
      }
    },
    [token, tutorId, fetchReviews, handleUnauthorized]
  );

  const removeReview = useCallback(
    async (reviewId: string) => {
      if (!token) return;
      try {
        await deleteReview(token, reviewId);
        if (__DEV__) console.log('[Analytics] Review Deleted', { tutorId, reviewId });
        await fetchReviews('refresh');
      } catch (err: any) {
        if (err?.message === 'Unauthorized') { handleUnauthorized(); return; }
        throw err;
      }
    },
    [token, tutorId, fetchReviews, handleUnauthorized]
  );

  const toggleHelpful = useCallback(
    async (reviewId: string) => {
      if (!token) return;
      try {
        const result = await markReviewHelpful(token, reviewId);
        if (__DEV__) console.log('[Analytics] Review Helpful Clicked', { tutorId, reviewId });
        setReviews((prev) =>
          prev.map((r) => (r._id === reviewId ? { ...r, helpfulVotes: result.helpfulVotes } : r))
        );
      } catch (err: any) {
        if (err?.message === 'Unauthorized') { handleUnauthorized(); return; }
        throw err;
      }
    },
    [token, tutorId, handleUnauthorized]
  );

  const clearSubmitError = useCallback(() => setSubmitError(null), []);

  return {
    reviews,
    ratings,
    isLoading,
    isRefreshing,
    isLoadingMore,
    isSubmitting,
    hasMore,
    error,
    submitError,
    sort,
    ratingFilter,
    setSort,
    setRatingFilter,
    refresh,
    loadMore,
    submitReview,
    editReview,
    removeReview,
    toggleHelpful,
    clearSubmitError,
  };
};
