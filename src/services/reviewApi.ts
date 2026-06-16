import { apiConfig } from '../config/api';

const BASE = apiConfig.baseURL;
const CACHE_TTL_MS = 60 * 1000;
const reviewCache = new Map<string, { timestamp: number; data: unknown }>();

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TutorReview {
  _id: string;
  reviewId: string;
  tutorId: string;
  parentId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  reviewText: string;
  subject: string;
  studentClass: string;
  parentName: string;
  tutorResponse?: {
    text: string;
    respondedAt: string;
  };
  helpfulVotes: number;
  isVerified: boolean;
  verificationSource: 'demo_completed' | 'active_relationship' | 'manual';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface RatingBreakdownItem {
  count: number;
  percentage: number;
}

export interface TutorRatings {
  averageRating: number;
  totalReviews: number;
  breakdown: Record<string, RatingBreakdownItem>;
}

export interface ReviewsResult {
  reviews: TutorReview[];
  pagination: ReviewPagination;
}

export type ReviewSortOption = 'newest' | 'highest' | 'lowest' | 'helpful';

// ── Helper ─────────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 403) throw new Error(await res.json().then((b) => b?.message || 'Forbidden'));
  if (res.status === 409) throw new Error(await res.json().then((b) => b?.message || 'Conflict'));
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const b = await res.json();
      msg = b?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  const body = await res.json();
  return body.data as T;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function getCached<T>(key: string): T | null {
  const cached = reviewCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    reviewCache.delete(key);
    return null;
  }
  return cached.data as T;
}

function setCached<T>(key: string, data: T): T {
  reviewCache.set(key, { timestamp: Date.now(), data });
  return data;
}

function clearTutorReviewCache(tutorId?: string) {
  Array.from(reviewCache.keys()).forEach((key) => {
    if (!tutorId || key.includes(`:${tutorId}:`)) reviewCache.delete(key);
  });
}

// ── API Functions ───────────────────────────────────────────────────────────

export const getTutorReviews = async (
  tutorId: string,
  params: {
    page?: number;
    limit?: number;
    sort?: ReviewSortOption;
    rating?: number;
    token?: string;
  } = {}
): Promise<ReviewsResult> => {
  const { page = 1, limit = 10, sort = 'newest', rating, token } = params;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit), sort });
  if (rating) qs.set('rating', String(rating));
  const cacheKey = `reviews:${tutorId}:${qs.toString()}:${token ? 'auth' : 'public'}`;
  const cached = getCached<ReviewsResult>(cacheKey);
  if (cached) return cached;
  const res = await fetch(`${BASE}/tutors/${tutorId}/reviews?${qs}`, {
    headers: token ? authHeaders(token) : { 'Content-Type': 'application/json' },
  });
  return setCached(cacheKey, await handleResponse<ReviewsResult>(res));
};

export const getTutorRatings = async (
  tutorId: string,
  token?: string
): Promise<TutorRatings> => {
  const cacheKey = `ratings:${tutorId}:summary:${token ? 'auth' : 'public'}`;
  const cached = getCached<TutorRatings>(cacheKey);
  if (cached) return cached;
  const res = await fetch(`${BASE}/tutors/${tutorId}/ratings`, {
    headers: token ? authHeaders(token) : { 'Content-Type': 'application/json' },
  });
  return setCached(cacheKey, await handleResponse<TutorRatings>(res));
};

export const createReview = async (
  token: string,
  tutorId: string,
  payload: { rating: number; reviewText: string; subject: string; studentClass: string }
): Promise<TutorReview> => {
  const res = await fetch(`${BASE}/tutors/${tutorId}/reviews`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const created = await handleResponse<TutorReview>(res);
  clearTutorReviewCache(tutorId);
  return created;
};

export const updateReview = async (
  token: string,
  reviewId: string,
  payload: { rating?: number; reviewText?: string; subject?: string; studentClass?: string }
): Promise<TutorReview> => {
  const res = await fetch(`${BASE}/reviews/${reviewId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const updated = await handleResponse<TutorReview>(res);
  clearTutorReviewCache(updated.tutorId);
  return updated;
};

export const deleteReview = async (token: string, reviewId: string): Promise<void> => {
  const res = await fetch(`${BASE}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) {
    let msg = `Delete failed (${res.status})`;
    try {
      const b = await res.json();
      msg = b?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  clearTutorReviewCache();
};

export const markReviewHelpful = async (
  token: string,
  reviewId: string
): Promise<{ helpfulVotes: number }> => {
  const res = await fetch(`${BASE}/reviews/${reviewId}/helpful`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const result = await handleResponse<{ helpfulVotes: number }>(res);
  clearTutorReviewCache();
  return result;
};

export const addTutorResponse = async (
  token: string,
  reviewId: string,
  text: string
): Promise<TutorReview> => {
  const res = await fetch(`${BASE}/reviews/${reviewId}/respond`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ text }),
  });
  const updated = await handleResponse<TutorReview>(res);
  clearTutorReviewCache(updated.tutorId);
  return updated;
};

export const getMyReviews = async (token: string): Promise<TutorReview[]> => {
  const res = await fetch(`${BASE}/reviews/my`, { headers: authHeaders(token) });
  const data = await handleResponse<{ reviews: TutorReview[] }>(res);
  return data.reviews;
};
