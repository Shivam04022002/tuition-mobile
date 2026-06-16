import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import {
  getPreferences,
  updatePreferences,
  getSubjectsReference,
  getClassesReference,
  TeachingPreferences,
  ReferenceData,
  ClassesReferenceData,
  FALLBACK_SUBJECTS,
  FALLBACK_BOARDS,
  FALLBACK_CLASS_GROUPS,
  TEACHING_MODE_OPTIONS,
  STUDENT_TYPE_OPTIONS,
  TEACHING_LEVEL_OPTIONS,
  EXAM_PREPARATION_OPTIONS,
} from '../services/teacherPreferencesApi';

interface UseTeacherPreferencesResult {
  preferences: TeachingPreferences | null;
  referenceData: ReferenceData;
  classesData: ClassesReferenceData;
  isLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;
  error: string | null;
  saveError: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
  savePreferences: (updates: Partial<TeachingPreferences>) => Promise<boolean>;
  clearSaveError: () => void;
}

const DEFAULT_PREFERENCES: TeachingPreferences = {
  subjects: [],
  classes: [],
  boards: [],
  teachingModes: [],
  subjectExperience: [],
  studentTypes: [],
  teachingLevel: [],
  examPreparation: [],
  specialization: '',
  groupTuitionOption: false,
  groupSize: 5,
  groupRate: 0,
  experienceYears: 0,
};

const DEFAULT_REFERENCE: ReferenceData = {
  subjects: FALLBACK_SUBJECTS,
  boards: FALLBACK_BOARDS,
  teachingModes: TEACHING_MODE_OPTIONS.map(m => m.value),
  studentTypes: STUDENT_TYPE_OPTIONS.map(s => s.value),
  teachingLevels: TEACHING_LEVEL_OPTIONS.map(l => l.value),
  examPreparation: EXAM_PREPARATION_OPTIONS,
};

const DEFAULT_CLASSES: ClassesReferenceData = {
  classGroups: FALLBACK_CLASS_GROUPS,
  allClasses: FALLBACK_CLASS_GROUPS.flatMap(g => g.values),
};

export function useTeacherPreferences(): UseTeacherPreferencesResult {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);

  const [preferences, setPreferences] = useState<TeachingPreferences | null>(null);
  const [referenceData, setReferenceData] = useState<ReferenceData>(DEFAULT_REFERENCE);
  const [classesData, setClassesData] = useState<ClassesReferenceData>(DEFAULT_CLASSES);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadData = useCallback(async (showRefresh = false) => {
    if (!token) {
      if (mountedRef.current) {
        setError('Authentication required');
        setIsLoading(false);
      }
      return;
    }

    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const [prefs, subjects, classes] = await Promise.all([
        getPreferences(token),
        getSubjectsReference().catch(() => DEFAULT_REFERENCE),
        getClassesReference().catch(() => DEFAULT_CLASSES),
      ]);

      if (!mountedRef.current) return;

      setPreferences(prefs);
      setReferenceData(subjects);
      setClassesData(classes);

      if (__DEV__) {
        console.log('[useTeacherPreferences] Loaded', {
          subjectsCount: prefs.subjects.length,
          classesCount: prefs.classes.length,
          boardsCount: prefs.boards.length,
          modesCount: prefs.teachingModes.length,
        });
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      if (err.message === 'Unauthorized') {
        dispatch(logout());
        return;
      }
      setError(err.message || 'Failed to load teaching preferences');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [token, dispatch]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const retry = useCallback(() => {
    loadData(false);
  }, [loadData]);

  const savePreferences = useCallback(async (updates: Partial<TeachingPreferences>): Promise<boolean> => {
    if (!token) {
      setSaveError('Authentication required');
      return false;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      const updated = await updatePreferences(token, updates);

      if (mountedRef.current) {
        setPreferences(updated);
        if (__DEV__) {
          console.log('[useTeacherPreferences] Preferences Saved', {
            subjects: updated.subjects.length,
            classes: updated.classes.length,
            boards: updated.boards.length,
          });
        }
      }

      return true;
    } catch (err: any) {
      if (!mountedRef.current) return false;
      if (err.message === 'Unauthorized') {
        dispatch(logout());
        return false;
      }
      setSaveError(err.message || 'Failed to save preferences');
      return false;
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  }, [token, dispatch]);

  const clearSaveError = useCallback(() => {
    setSaveError(null);
  }, []);

  return {
    preferences: preferences ?? DEFAULT_PREFERENCES,
    referenceData,
    classesData,
    isLoading,
    isRefreshing,
    isSaving,
    error,
    saveError,
    refresh,
    retry,
    savePreferences,
    clearSaveError,
  };
}
