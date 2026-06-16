import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import {
  getDocuments,
  uploadDocument,
  updateDocument,
  deleteDocument,
  submitForVerification,
  getVerificationStatus,
  TeacherDocument,
  DocumentsResponse,
  VerificationStatusResponse,
  DocumentType,
} from '../services/documentApi';

export interface UseTeacherDocumentsResult {
  documents: TeacherDocument[];
  grouped: {
    identity: TeacherDocument[];
    qualification: TeacherDocument[];
    profile: TeacherDocument[];
  } | null;
  summary: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    draft: number;
    completionPercentage: number;
  } | null;
  verificationStatus: VerificationStatusResponse | null;
  isLoading: boolean;
  isUploading: boolean;
  isSubmitting: boolean;
  isRefreshing: boolean;
  error: string | null;
  uploadError: string | null;
  submitError: string | null;
  refresh: () => Promise<void>;
  refreshVerification: () => Promise<void>;
  uploadNewDocument: (
    type: DocumentType,
    name: string,
    fileUri: string,
    fileName: string,
    mimeType: string
  ) => Promise<TeacherDocument | null>;
  updateExistingDocument: (
    documentId: string,
    updates: { name?: string; fileUri?: string; fileName?: string; mimeType?: string }
  ) => Promise<TeacherDocument | null>;
  deleteExistingDocument: (documentId: string) => Promise<boolean>;
  submitVerification: () => Promise<boolean>;
  clearErrors: () => void;
}

export function useTeacherDocuments(): UseTeacherDocumentsResult {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);

  const [documents, setDocuments] = useState<TeacherDocument[]>([]);
  const [grouped, setGrouped] = useState<UseTeacherDocumentsResult['grouped']>(null);
  const [summary, setSummary] = useState<UseTeacherDocumentsResult['summary']>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchDocuments = useCallback(async () => {
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

      const data = await getDocuments(token);

      if (isMounted.current) {
        setDocuments(data.documents);
        setGrouped(data.grouped);
        setSummary(data.summary);
        setIsLoading(false);

        if (process.env.NODE_ENV === 'development') {
          console.log('[TeacherDocuments] Loaded:', data.documents.length, 'documents');
        }
      }
    } catch (err: any) {
      if (!isMounted.current) return;

      if (err.message === 'Unauthorized') {
        dispatch(logout());
        return;
      }

      setError(err.message || 'Failed to load documents');
      setIsLoading(false);

      if (process.env.NODE_ENV === 'development') {
        console.warn('[TeacherDocuments] Load error:', err.message);
      }
    }
  }, [token, dispatch]);

  const fetchVerificationStatus = useCallback(async () => {
    if (!token) return;

    try {
      const data = await getVerificationStatus(token);

      if (isMounted.current) {
        setVerificationStatus(data);

        if (process.env.NODE_ENV === 'development') {
          console.log('[TeacherDocuments] Verification status:', data.status);
        }
      }
    } catch (err: any) {
      if (!isMounted.current) return;

      if (err.message === 'Unauthorized') {
        dispatch(logout());
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.warn('[TeacherDocuments] Verification status error:', err.message);
      }
    }
  }, [token, dispatch]);

  useEffect(() => {
    fetchDocuments();
    fetchVerificationStatus();
  }, [fetchDocuments, fetchVerificationStatus]);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    await Promise.all([fetchDocuments(), fetchVerificationStatus()]);
    if (isMounted.current) {
      setIsRefreshing(false);
    }
  }, [fetchDocuments, fetchVerificationStatus, isRefreshing]);

  const refreshVerification = useCallback(async () => {
    await fetchVerificationStatus();
  }, [fetchVerificationStatus]);

  const uploadNewDocument = useCallback(async (
    type: DocumentType,
    name: string,
    fileUri: string,
    fileName: string,
    mimeType: string
  ): Promise<TeacherDocument | null> => {
    if (!token) return null;

    try {
      setIsUploading(true);
      setUploadError(null);

      const document = await uploadDocument(token, type, name, fileUri, fileName, mimeType);

      await fetchDocuments();
      await fetchVerificationStatus();

      if (process.env.NODE_ENV === 'development') {
        console.log('[TeacherDocuments] Uploaded:', document.name);
      }

      return document;
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        dispatch(logout());
        return null;
      }

      const msg = err.message || 'Upload failed. Please try again.';
      setUploadError(msg);

      if (process.env.NODE_ENV === 'development') {
        console.warn('[TeacherDocuments] Upload error:', msg);
      }

      return null;
    } finally {
      if (isMounted.current) setIsUploading(false);
    }
  }, [token, dispatch, fetchDocuments, fetchVerificationStatus]);

  const updateExistingDocument = useCallback(async (
    documentId: string,
    updates: { name?: string; fileUri?: string; fileName?: string; mimeType?: string }
  ): Promise<TeacherDocument | null> => {
    if (!token) return null;

    try {
      setIsUploading(true);
      setUploadError(null);

      const document = await updateDocument(token, documentId, updates);

      await fetchDocuments();
      await fetchVerificationStatus();

      if (process.env.NODE_ENV === 'development') {
        console.log('[TeacherDocuments] Updated:', document.name);
      }

      return document;
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        dispatch(logout());
        return null;
      }

      const msg = err.message || 'Update failed. Please try again.';
      setUploadError(msg);

      if (process.env.NODE_ENV === 'development') {
        console.warn('[TeacherDocuments] Update error:', msg);
      }

      return null;
    } finally {
      if (isMounted.current) setIsUploading(false);
    }
  }, [token, dispatch, fetchDocuments, fetchVerificationStatus]);

  const deleteExistingDocument = useCallback(async (documentId: string): Promise<boolean> => {
    if (!token) return false;

    try {
      await deleteDocument(token, documentId);

      await fetchDocuments();
      await fetchVerificationStatus();

      if (process.env.NODE_ENV === 'development') {
        console.log('[TeacherDocuments] Deleted:', documentId);
      }

      return true;
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        dispatch(logout());
        return false;
      }

      const msg = err.message || 'Delete failed. Please try again.';
      setUploadError(msg);

      if (process.env.NODE_ENV === 'development') {
        console.warn('[TeacherDocuments] Delete error:', msg);
      }

      return false;
    }
  }, [token, dispatch, fetchDocuments, fetchVerificationStatus]);

  const submitVerification = useCallback(async (): Promise<boolean> => {
    if (!token) return false;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await submitForVerification(token);

      await fetchDocuments();
      await fetchVerificationStatus();

      if (process.env.NODE_ENV === 'development') {
        console.log('[TeacherDocuments] Verification submitted');
      }

      return true;
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        dispatch(logout());
        return false;
      }

      const msg = err.message || 'Submission failed. Please try again.';
      setSubmitError(msg);

      if (process.env.NODE_ENV === 'development') {
        console.warn('[TeacherDocuments] Submit error:', msg);
      }

      return false;
    } finally {
      if (isMounted.current) setIsSubmitting(false);
    }
  }, [token, dispatch, fetchDocuments, fetchVerificationStatus]);

  const clearErrors = useCallback(() => {
    setError(null);
    setUploadError(null);
    setSubmitError(null);
  }, []);

  return {
    documents,
    grouped,
    summary,
    verificationStatus,
    isLoading,
    isUploading,
    isSubmitting,
    isRefreshing,
    error,
    uploadError,
    submitError,
    refresh,
    refreshVerification,
    uploadNewDocument,
    updateExistingDocument,
    deleteExistingDocument,
    submitVerification,
    clearErrors,
  };
}
