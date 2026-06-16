import { apiConfig } from '../config/api';

const API_BASE_URL = apiConfig.baseURL;

// Types for Availability
export interface CustomTimeSlot {
  id: string;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  label: string;
  isActive: boolean;
}

export interface WeeklySchedule {
  [key: string]: {
    isEnabled: boolean;
    timeSlots: string[]; // References to customTimeSlots IDs
  };
}

export interface MaxStudents {
  active: number;
  daily: number;
}

export interface LocationAvailability {
  address: string;
  city: string;
  pincode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  preferredAreas: string[];
  preferredLocations: Array<{
    area: string;
    city: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
  }>;
  teachingRadius: number;
  availableDays: string[];
  availableTimeSlots: string[];
  customTimeSlots: CustomTimeSlot[];
  weeklySchedule: WeeklySchedule;
  maxStudents: MaxStudents;
  vacationMode: boolean;
}

// Types for Discoverability
export interface TravelSettings {
  maxTravelDistance: number; // in KM
  preferredTravelModes: string[];
}

export interface LocationCoverage {
  state: string;
  city: string;
  areas: string[];
  pincodes: string[];
}

export interface Discoverability {
  availableForNewStudents: boolean;
  visibleInMarketplace: boolean;
  onlineStatus: 'online' | 'offline' | 'hybrid';
  travelSettings: TravelSettings;
  locationCoverage: LocationCoverage;
}

// Types for Matching Eligibility
export interface MatchingEligibility {
  isEligible: boolean;
  profileCompletionPercentage: number;
  verificationStatus: string;
  visibleInMarketplace: boolean;
  availableForNewStudents: boolean;
  hasActiveDays: boolean;
  hasTimeSlots: boolean;
}

// API Functions
export const getAvailability = async (token: string): Promise<LocationAvailability> => {
  const response = await fetch(`${API_BASE_URL}/api/teachers/availability`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch availability');
  }

  return data.data;
};

export const updateAvailability = async (
  token: string,
  availability: Partial<LocationAvailability>
): Promise<LocationAvailability> => {
  const response = await fetch(`${API_BASE_URL}/api/teachers/availability`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(availability),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to update availability');
  }

  return data.data;
};

export const getDiscoverability = async (token: string): Promise<Discoverability> => {
  const response = await fetch(`${API_BASE_URL}/api/teachers/discoverability`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch discoverability');
  }

  return data.data;
};

export const updateDiscoverability = async (
  token: string,
  discoverability: Partial<Discoverability>
): Promise<Discoverability> => {
  const response = await fetch(`${API_BASE_URL}/api/teachers/discoverability`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(discoverability),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to update discoverability');
  }

  return data.data;
};

export const getMatchingEligibility = async (token: string): Promise<MatchingEligibility> => {
  const response = await fetch(`${API_BASE_URL}/api/teachers/matching-eligibility`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch matching eligibility');
  }

  return data.data;
};

// Helper function to generate time slot ID
export const generateTimeSlotId = (): string => {
  return `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to validate time format (HH:mm)
export const validateTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Helper function to validate time range
export const validateTimeRange = (startTime: string, endTime: string): boolean => {
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return false;
  }

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return endMinutes > startMinutes;
};

// Default time slot templates
export const DEFAULT_TIME_SLOTS = [
  { id: 'morning', label: 'Morning', startTime: '06:00', endTime: '12:00' },
  { id: 'afternoon', label: 'Afternoon', startTime: '12:00', endTime: '18:00' },
  { id: 'evening', label: 'Evening', startTime: '18:00', endTime: '22:00' },
  { id: 'night', label: 'Night', startTime: '22:00', endTime: '23:59' },
];

// Days of week
export const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

// Online status options
export const ONLINE_STATUS_OPTIONS = [
  { value: 'online', label: 'Online Only' },
  { value: 'offline', label: 'Offline Only' },
  { value: 'hybrid', label: 'Hybrid (Online + Offline)' },
];

// Travel distance options
export const TRAVEL_DISTANCE_OPTIONS = [
  { value: 2, label: '2 KM' },
  { value: 5, label: '5 KM' },
  { value: 10, label: '10 KM' },
  { value: 20, label: '20 KM' },
  { value: 50, label: '50 KM' },
];

// Travel mode options
export const TRAVEL_MODE_OPTIONS = [
  { value: 'walking', label: 'Walking' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'public_transport', label: 'Public Transport' },
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
];
