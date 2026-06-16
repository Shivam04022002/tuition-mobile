import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import {
  getProfileCompletion,
  updateOnboardingSection,
  uploadTeacherDocument,
  uploadProfilePhoto,
  ProfileCompletionData,
  OnboardingUpdatePayload,
} from '../services/teacherOnboardingApi';

export interface UseTeacherOnboardingResult {
  completion: ProfileCompletionData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveError: string | null;
  refresh: () => Promise<void>;
  saveSection: (payload: OnboardingUpdatePayload) => Promise<boolean>;
  uploadDocument: (
    fieldName: 'certificates' | 'portfolio',
    fileUri: string,
    fileName: string,
    mimeType: string
  ) => Promise<string[]>;
  uploadPhoto: (
    fileUri: string,
    fileName: string,
    mimeType: string
  ) => Promise<string>;
  clearSaveError: () => void;
}

export function useTeacherOnboarding(): UseTeacherOnboardingResult {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);

  const [completion, setCompletion] = useState<ProfileCompletionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchCompletion = useCallback(async () => {
    if (!token) {
      if (isMounted.current) {
        setError('Authentication required');
        setIsLoading(false);
      }
      return;
    }

    try {
      if (isMounted.current) {
        setError(null);
        setIsLoading(true);
      }
      const data = await getProfileCompletion(token);
      if (isMounted.current) {
        setCompletion(data);
        setIsLoading(false);
        if (__DEV__) console.log('[TeacherOnboarding] Completion loaded:', data.percentage + '%');
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      if (err.message === 'Unauthorized') {
        dispatch(logout());
        return;
      }
      setError(err.message || 'Failed to load profile completion');
      setIsLoading(false);
      if (__DEV__) console.warn('[TeacherOnboarding] Completion load error:', err.message);
    }
  }, [token, dispatch]);

  useEffect(() => {
    fetchCompletion();
  }, [fetchCompletion]);

  const saveSection = useCallback(async (payload: OnboardingUpdatePayload): Promise<boolean> => {
    if (!token) return false;
    try {
      setIsSaving(true);
      setSaveError(null);
      await updateOnboardingSection(token, payload);
      await fetchCompletion();
      if (__DEV__) console.log('[TeacherOnboarding] Section saved successfully');
      return true;
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        dispatch(logout());
        return false;
      }
      const msg = err.message || 'Failed to save. Please try again.';
      setSaveError(msg);
      if (__DEV__) console.warn('[TeacherOnboarding] Save error:', msg);
      return false;
    } finally {
      if (isMounted.current) setIsSaving(false);
    }
  }, [token, dispatch, fetchCompletion]);

  const uploadDocument = useCallback(async (
    fieldName: 'certificates' | 'portfolio',
    fileUri: string,
    fileName: string,
    mimeType: string
  ): Promise<string[]> => {
    if (!token) return [];
    try {
      setIsSaving(true);
      setSaveError(null);
      const urls = await uploadTeacherDocument(token, fieldName, fileUri, fileName, mimeType);
      await fetchCompletion();
      if (__DEV__) console.log('[TeacherOnboarding] Document uploaded:', fieldName);
      return urls;
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        dispatch(logout());
        return [];
      }
      const msg = err.message || 'Document upload failed. Please try again.';
      setSaveError(msg);
      if (__DEV__) console.warn('[TeacherOnboarding] Upload error:', msg);
      return [];
    } finally {
      if (isMounted.current) setIsSaving(false);
    }
  }, [token, dispatch, fetchCompletion]);

  const uploadPhoto = useCallback(async (
    fileUri: string,
    fileName: string,
    mimeType: string
  ): Promise<string> => {
    if (!token) return fileUri;
    try {
      setIsSaving(true);
      setSaveError(null);
      const url = await uploadProfilePhoto(token, fileUri, fileName, mimeType);
      await fetchCompletion();
      if (__DEV__) console.log('[TeacherOnboarding] Photo uploaded');
      return url;
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        dispatch(logout());
        return fileUri;
      }
      const msg = err.message || 'Photo upload failed. Please try again.';
      setSaveError(msg);
      return fileUri;
    } finally {
      if (isMounted.current) setIsSaving(false);
    }
  }, [token, dispatch, fetchCompletion]);

  const clearSaveError = useCallback(() => setSaveError(null), []);

  return {
    completion,
    isLoading,
    isSaving,
    error,
    saveError,
    refresh: fetchCompletion,
    saveSection,
    uploadDocument,
    uploadPhoto,
    clearSaveError,
  };
}
