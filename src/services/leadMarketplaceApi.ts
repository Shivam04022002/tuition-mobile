import { apiConfig } from '../config/api';
import { TutorMatch } from './teacherApi';

const API_BASE_URL = apiConfig.baseURL;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MarketplaceFilters {
  subject?: string;
  city?: string;
  teachingMode?: string;
  sortBy?: 'score' | 'distance' | 'recent' | 'budget';
}

export interface MarketplacePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MarketplaceStats {
  availableLeads: number;
  highMatchLeads: number;
  nearbyLeads: number;
  unlockedLeads: number;
}

export interface MarketplaceResponse {
  matches: TutorMatch[];
  pagination: MarketplacePagination;
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) throw new Error('Unauthorized');
  if (response.status === 404) throw new Error('Not found');
  if (!response.ok) {
    let msg = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      msg = body?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  const body = await response.json();
  return body.data as T;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * GET /api/matches/marketplace
 * Paginated, filtered lead marketplace feed for the authenticated teacher.
 */
export const getMarketplaceLeads = async (
  token: string,
  filters: MarketplaceFilters = {},
  page: number = 1,
  limit: number = 10,
): Promise<MarketplaceResponse> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filters.subject?.trim())      params.set('subject',      filters.subject.trim());
  if (filters.city?.trim())         params.set('city',         filters.city.trim());
  if (filters.teachingMode?.trim()) params.set('teachingMode', filters.teachingMode.trim());
  if (filters.sortBy)               params.set('sortBy',       filters.sortBy);

  const response = await fetch(`${API_BASE_URL}/matches/marketplace?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<MarketplaceResponse>(response);
};

/**
 * GET /api/matches/marketplace/stats
 * Returns real-time stats: availableLeads, highMatchLeads, nearbyLeads, unlockedLeads.
 */
export const getLeadStats = async (token: string): Promise<MarketplaceStats> => {
  const response = await fetch(`${API_BASE_URL}/matches/marketplace/stats`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<MarketplaceStats>(response);
};
