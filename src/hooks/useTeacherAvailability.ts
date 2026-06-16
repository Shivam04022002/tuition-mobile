import { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { logout } from '../redux/slices/authSlice';
import {
  LocationAvailability,
  Discoverability,
  MatchingEligibility,
  CustomTimeSlot,
  getAvailability,
  updateAvailability,
  getDiscoverability,
  updateDiscoverability,
  getMatchingEligibility,
  generateTimeSlotId,
  validateTimeFormat,
  validateTimeRange,
  DAYS_OF_WEEK,
} from '../services/teacherAvailabilityApi';

interface UseTeacherAvailabilityReturn {
  // Availability
  availability: LocationAvailability | null;
  discoverability: Discoverability | null;
  matchingEligibility: MatchingEligibility | null;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;
  
  // Error states
  error: string | null;
  saveError: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
  
  // Availability actions
  updateAvailabilityData: (data: Partial<LocationAvailability>) => Promise<void>;
  addTimeSlot: (timeSlot: Omit<CustomTimeSlot, 'id'>) => Promise<void>;
  updateTimeSlot: (id: string, timeSlot: Partial<CustomTimeSlot>) => Promise<void>;
  removeTimeSlot: (id: string) => Promise<void>;
  toggleDay: (day: string, isEnabled: boolean) => Promise<void>;
  updateTimeSlotForDay: (day: string, timeSlotIds: string[]) => Promise<void>;
  updateMaxStudents: (maxStudents: { active?: number; daily?: number }) => Promise<void>;
  toggleVacationMode: (vacationMode: boolean) => Promise<void>;
  
  // Discoverability actions
  updateDiscoverabilityData: (data: Partial<Discoverability>) => Promise<void>;
  toggleAvailableForNewStudents: (available: boolean) => Promise<void>;
  toggleVisibleInMarketplace: (visible: boolean) => Promise<void>;
  updateOnlineStatus: (status: 'online' | 'offline' | 'hybrid') => Promise<void>;
  updateTravelSettings: (settings: { maxTravelDistance?: number; preferredTravelModes?: string[] }) => Promise<void>;
  updateLocationCoverage: (coverage: { state?: string; city?: string; areas?: string[]; pincodes?: string[] }) => Promise<void>;
  
  // Utility actions
  clearSaveError: () => void;
  validateAvailability: () => string[];
  validateTimeSlot: (timeSlot: CustomTimeSlot) => string[];
}

export const useTeacherAvailability = (): UseTeacherAvailabilityReturn => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.auth.token);

  const [availability, setAvailability] = useState<LocationAvailability | null>(null);
  const [discoverability, setDiscoverability] = useState<Discoverability | null>(null);
  const [matchingEligibility, setMatchingEligibility] = useState<MatchingEligibility | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async (refresh = false) => {
    if (!token) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const [availabilityData, discoverabilityData, eligibilityData] = await Promise.all([
        getAvailability(token),
        getDiscoverability(token),
        getMatchingEligibility(token),
      ]);

      setAvailability(availabilityData);
      setDiscoverability(discoverabilityData);
      setMatchingEligibility(eligibilityData);
    } catch (err: any) {
      console.error('Load availability error:', err);
      
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        dispatch(logout());
        return;
      }
      
      setError(err.message || 'Failed to load availability data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, dispatch]);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  // Retry on error
  const retry = useCallback(async () => {
    await loadData(false);
  }, [loadData]);

  // Update availability
  const updateAvailabilityData = useCallback(async (data: Partial<LocationAvailability>) => {
    if (!token || !availability) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      const updatedAvailability = await updateAvailability(token, data);
      setAvailability(updatedAvailability);
    } catch (err: any) {
      console.error('Update availability error:', err);
      
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        dispatch(logout());
        return;
      }
      
      setSaveError(err.message || 'Failed to update availability');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [token, availability, dispatch]);

  // Time slot management
  const addTimeSlot = useCallback(async (timeSlot: Omit<CustomTimeSlot, 'id'>) => {
    if (!availability) return;

    const validationErrors = validateTimeSlot({ ...timeSlot, id: 'temp' });
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    const newTimeSlot: CustomTimeSlot = {
      ...timeSlot,
      id: generateTimeSlotId(),
    };

    await updateAvailabilityData({
      customTimeSlots: [...availability.customTimeSlots, newTimeSlot],
    });
  }, [availability, updateAvailabilityData]);

  const updateTimeSlot = useCallback(async (id: string, updates: Partial<CustomTimeSlot>) => {
    if (!availability) return;

    const updatedTimeSlots = availability.customTimeSlots.map(slot =>
      slot.id === id ? { ...slot, ...updates } : slot
    );

    const updatedSlot = updatedTimeSlots.find(slot => slot.id === id);
    if (updatedSlot) {
      const validationErrors = validateTimeSlot(updatedSlot);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }
    }

    await updateAvailabilityData({
      customTimeSlots: updatedTimeSlots,
    });
  }, [availability, updateAvailabilityData]);

  const removeTimeSlot = useCallback(async (id: string) => {
    if (!availability) return;

    // Remove time slot from all days
    const updatedWeeklySchedule = { ...availability.weeklySchedule };
    Object.keys(updatedWeeklySchedule).forEach(day => {
      updatedWeeklySchedule[day] = {
        ...updatedWeeklySchedule[day],
        timeSlots: updatedWeeklySchedule[day].timeSlots.filter(slotId => slotId !== id),
      };
    });

    await updateAvailabilityData({
      customTimeSlots: availability.customTimeSlots.filter(slot => slot.id !== id),
      weeklySchedule: updatedWeeklySchedule,
    });
  }, [availability, updateAvailabilityData]);

  // Day management
  const toggleDay = useCallback(async (day: string, isEnabled: boolean) => {
    if (!availability) return;

    const updatedWeeklySchedule = {
      ...availability.weeklySchedule,
      [day]: {
        ...availability.weeklySchedule[day],
        isEnabled,
      },
    };

    const availableDays = isEnabled
      ? [...availability.availableDays, day]
      : availability.availableDays.filter(d => d !== day);

    await updateAvailabilityData({
      weeklySchedule: updatedWeeklySchedule,
      availableDays,
    });
  }, [availability, updateAvailabilityData]);

  const updateTimeSlotForDay = useCallback(async (day: string, timeSlotIds: string[]) => {
    if (!availability) return;

    const updatedWeeklySchedule = {
      ...availability.weeklySchedule,
      [day]: {
        ...availability.weeklySchedule[day],
        timeSlots: timeSlotIds,
      },
    };

    await updateAvailabilityData({
      weeklySchedule: updatedWeeklySchedule,
    });
  }, [availability, updateAvailabilityData]);

  // Max students management
  const updateMaxStudents = useCallback(async (maxStudents: { active?: number; daily?: number }) => {
    await updateAvailabilityData({
      maxStudents: {
        ...availability?.maxStudents,
        ...maxStudents,
      },
    });
  }, [availability, updateAvailabilityData]);

  // Vacation mode
  const toggleVacationMode = useCallback(async (vacationMode: boolean) => {
    await updateAvailabilityData({ vacationMode });
  }, [updateAvailabilityData]);

  // Discoverability actions
  const updateDiscoverabilityData = useCallback(async (data: Partial<Discoverability>) => {
    if (!token || !discoverability) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      const updatedDiscoverability = await updateDiscoverability(token, data);
      setDiscoverability(updatedDiscoverability);
    } catch (err: any) {
      console.error('Update discoverability error:', err);
      
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        dispatch(logout());
        return;
      }
      
      setSaveError(err.message || 'Failed to update discoverability');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [token, discoverability, dispatch]);

  const toggleAvailableForNewStudents = useCallback(async (available: boolean) => {
    await updateDiscoverabilityData({ availableForNewStudents: available });
  }, [updateDiscoverabilityData]);

  const toggleVisibleInMarketplace = useCallback(async (visible: boolean) => {
    await updateDiscoverabilityData({ visibleInMarketplace: visible });
  }, [updateDiscoverabilityData]);

  const updateOnlineStatus = useCallback(async (status: 'online' | 'offline' | 'hybrid') => {
    await updateDiscoverabilityData({ onlineStatus: status });
  }, [updateDiscoverabilityData]);

  const updateTravelSettings = useCallback(async (settings: { maxTravelDistance?: number; preferredTravelModes?: string[] }) => {
    await updateDiscoverabilityData({
      travelSettings: {
        ...discoverability?.travelSettings,
        ...settings,
      },
    });
  }, [discoverability, updateDiscoverabilityData]);

  const updateLocationCoverage = useCallback(async (coverage: { state?: string; city?: string; areas?: string[]; pincodes?: string[] }) => {
    await updateDiscoverabilityData({
      locationCoverage: {
        ...discoverability?.locationCoverage,
        ...coverage,
      },
    });
  }, [discoverability, updateDiscoverabilityData]);

  // Validation
  const validateAvailability = useCallback((): string[] => {
    const errors: string[] = [];

    if (!availability) {
      errors.push('Availability data not loaded');
      return errors;
    }

    if (availability.availableDays.length === 0) {
      errors.push('At least one active day is required');
    }

    if (availability.customTimeSlots.length === 0) {
      errors.push('At least one time slot is required');
    }

    // Validate each time slot
    availability.customTimeSlots.forEach((slot, index) => {
      const slotErrors = validateTimeSlot(slot);
      slotErrors.forEach(error => {
        errors.push(`Time slot ${index + 1}: ${error}`);
      });
    });

    // Validate that each enabled day has time slots
    availability.availableDays.forEach(day => {
      const daySchedule = availability.weeklySchedule[day];
      if (daySchedule?.isEnabled && (!daySchedule.timeSlots || daySchedule.timeSlots.length === 0)) {
        errors.push(`${day} is enabled but has no time slots assigned`);
      }
    });

    return errors;
  }, [availability]);

  const validateTimeSlot = useCallback((timeSlot: CustomTimeSlot): string[] => {
    const errors: string[] = [];

    if (!timeSlot.label.trim()) {
      errors.push('Label is required');
    }

    if (!validateTimeFormat(timeSlot.startTime)) {
      errors.push('Invalid start time format (use HH:mm)');
    }

    if (!validateTimeFormat(timeSlot.endTime)) {
      errors.push('Invalid end time format (use HH:mm)');
    }

    if (!validateTimeRange(timeSlot.startTime, timeSlot.endTime)) {
      errors.push('End time must be after start time');
    }

    return errors;
  }, []);

  // Clear save error
  const clearSaveError = useCallback(() => {
    setSaveError(null);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    availability,
    discoverability,
    matchingEligibility,
    isLoading,
    isRefreshing,
    isSaving,
    error,
    saveError,
    refresh,
    retry,
    updateAvailabilityData,
    addTimeSlot,
    updateTimeSlot,
    removeTimeSlot,
    toggleDay,
    updateTimeSlotForDay,
    updateMaxStudents,
    toggleVacationMode,
    updateDiscoverabilityData,
    toggleAvailableForNewStudents,
    toggleVisibleInMarketplace,
    updateOnlineStatus,
    updateTravelSettings,
    updateLocationCoverage,
    clearSaveError,
    validateAvailability,
    validateTimeSlot,
  };
};
