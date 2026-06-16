export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RequirementLocation {
  address: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  teachingRadius: number;
}

export interface TeacherPreferredLocation {
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface GeocodedAddress {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city: string;
  pincode: string;
}

export const DEFAULT_REGION: MapRegion = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const INDIA_BOUNDS = {
  minLat: 6.4,
  maxLat: 35.7,
  minLng: 68.1,
  maxLng: 97.4,
};

export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
