import { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import {
  getMyReviews,
  TutorReview,
} from '../services/reviewApi';

export interface UseMyReviewsResult {
  reviews: TutorReview[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
}

export function useMyReviews(): UseMyReviewsResult {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  const [reviews, setReviews] = useState<TutorReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSessionExpired = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const fetchReviews = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      try {
        if (mode === 'initial') setIsLoading(true);
        else if (mode === 'refresh') setIsRefreshing(true);

        setError(null);

        const reviewsData = await getMyReviews(token);
        setReviews(reviewsData);
      } catch (err: any) {
        if (err.message === 'Unauthorized') {
          handleSessionExpired();
          return;
        }
        setError(err.message || 'Failed to load your reviews');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, handleSessionExpired],
  );

  // Initial load
  useEffect(() => {
    fetchReviews('initial');
  }, [fetchReviews]);

  // Pull-to-refresh
  const refresh = useCallback(async () => {
    await fetchReviews('refresh');
  }, [fetchReviews]);

  // Retry after error
  const retry = useCallback(() => {
    setReviews([]);
    fetchReviews('initial');
  }, [fetchReviews]);

  return {
    reviews,
    isLoading,
    isRefreshing,
    error,
    refresh,
    retry,
  };
}
