import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city: string;
  pincode: string;
  state: string;
  country: string;
}

export interface ReverseGeocodingResult {
  formattedAddress: string;
  city: string;
  pincode: string;
  state: string;
  country: string;
  neighborhood?: string;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

// ─────────────────────────────────────────────
// Helper — these are public (no auth) endpoints, used pre-signup.
// ─────────────────────────────────────────────

async function locationFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/location${path}`);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || `Request failed with status ${response.status}`);
  }
  return result as T;
}

// ─────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────

export const getLocationStatus = (): Promise<{ success: boolean; data: { enabled: boolean } }> =>
  locationFetch('/status');

export const reverseGeocodeCoords = (
  latitude: number,
  longitude: number
): Promise<{ success: boolean; data: ReverseGeocodingResult }> =>
  locationFetch(`/reverse-geocode?lat=${latitude}&lng=${longitude}`);

export const searchPlaces = (
  query: string
): Promise<{ success: boolean; data: PlaceSuggestion[] }> =>
  locationFetch(`/places/search?query=${encodeURIComponent(query)}`);

export const getPlaceDetails = (
  placeId: string
): Promise<{ success: boolean; data: GeocodingResult }> =>
  locationFetch(`/places/details?placeId=${encodeURIComponent(placeId)}`);
