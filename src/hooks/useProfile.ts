import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, selectAuthRole, logout } from '../redux/slices/authSlice';
import {
  getProfile,
  updateProfile as apiUpdateProfile,
  uploadProfileImage as apiUploadImage,
  ParentProfileData,
  TeacherProfileData,
  AdminProfileData,
  StaffProfileData,
} from '../services/profileApi';

type AnyProfile = ParentProfileData | TeacherProfileData | AdminProfileData | StaffProfileData;

export interface UseProfileReturn {
  profile: AnyProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refresh: () => void;
  retry: () => void;
  updateProfile: (updates: Record<string, any>) => Promise<boolean>;
  uploadProfileImage: (imageUri: string, fileName?: string) => Promise<string | null>;
}

export function useProfile(): UseProfileReturn {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);
  const role = useAppSelector(selectAuthRole);

  const [profile, setProfile] = useState<AnyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!token || !role) {
      if (mountedRef.current) {
        setError('Authentication required');
        setIsLoading(false);
      }
      return;
    }

    if (mountedRef.current) {
      setError(null);
      setIsLoading(true);
    }

    try {
      const data = await getProfile(token, role);
      if (mountedRef.current) {
        setProfile(data);
        setError(null);
      }
    } catch (err: any) {
      if (!mountedRef.current) return;

      if (err.status === 401) {
        dispatch(logout());
        return;
      }
      setError(err.message || 'Unable to load profile');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [token, role, dispatch]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refresh = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  const retry = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Record<string, any>): Promise<boolean> => {
    if (!token || !role) return false;

    setIsSaving(true);
    const prev = profile;

    try {
      const updated = await apiUpdateProfile(token, role, updates);
      if (mountedRef.current) setProfile(updated);
      return true;
    } catch (err: any) {
      if (mountedRef.current) {
        setProfile(prev);
        if (err.status === 401) dispatch(logout());
      }
      return false;
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  }, [token, role, profile, dispatch]);

  const uploadProfileImage = useCallback(async (
    imageUri: string,
    fileName?: string
  ): Promise<string | null> => {
    if (!token || !role) return null;

    setIsSaving(true);
    const prevProfile = profile;

    // Optimistic preview — patch profilePhoto locally before upload completes
    if (profile && role === 'teacher') {
      setProfile({ ...(profile as TeacherProfileData), basicDetails: { ...(profile as TeacherProfileData).basicDetails, profilePhoto: imageUri } } as TeacherProfileData);
    }

    try {
      const url = await apiUploadImage(token, role, imageUri, fileName);
      if (mountedRef.current) {
        // Update profile with returned URL
        if (role === 'teacher' && profile) {
          setProfile({ ...(profile as TeacherProfileData), basicDetails: { ...(profile as TeacherProfileData).basicDetails, profilePhoto: url } } as TeacherProfileData);
        }
      }
      return url;
    } catch (err: any) {
      // Rollback on failure
      if (mountedRef.current) {
        setProfile(prevProfile);
        if (err.status === 401) dispatch(logout());
      }
      return null;
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  }, [token, role, profile, dispatch]);

  return {
    profile,
    isLoading,
    isSaving,
    error,
    refresh,
    retry,
    updateProfile,
    uploadProfileImage,
  };
}
