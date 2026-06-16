import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import {
  KycStatusData,
  KycDetails,
  KycDocumentType,
  KycQueueResponse,
  KycDetailAdminResponse,
  getKycStatus,
  getKycDetails,
  uploadKycDocument,
  submitKyc,
  updateKycDocument,
  deleteKycDocument,
  getAdminKycQueue,
  getAdminKycDetail,
  approveKyc,
  rejectKyc,
  requestKycReupload,
} from '../services/kycApi';

// ─────────────────────────────────────────────────────────────────────────────
// Teacher KYC Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useTeacherKyc() {
  const token = useSelector(selectAuthToken) ?? '';
  const dispatch = useDispatch();

  const [status, setStatus] = useState<KycStatusData | null>(null);
  const [details, setDetails] = useState<KycDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleAuthError = useCallback((err: Error) => {
    if (err.message === 'SESSION_EXPIRED') {
      dispatch(logout() as any);
      return true;
    }
    return false;
  }, [dispatch]);

  const fetchData = useCallback(async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const [statusData, detailsData] = await Promise.all([
        getKycStatus(token),
        getKycDetails(token),
      ]);
      setStatus(statusData);
      setDetails(detailsData);
    } catch (err: any) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Failed to load KYC data');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, handleAuthError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  const retry = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const upload = useCallback(async (
    documentType: KycDocumentType,
    fileUri: string,
    fileName: string,
  ) => {
    if (!token) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      await uploadKycDocument(token, documentType, fileUri, fileName);
      if (__DEV__) console.log('[KYC] Document uploaded:', documentType);
      await fetchData(false);
    } catch (err: any) {
      if (!handleAuthError(err)) {
        setUploadError(err.message || 'Upload failed');
        throw err;
      }
    } finally {
      setIsUploading(false);
    }
  }, [token, fetchData, handleAuthError]);

  const replaceDocument = useCallback(async (
    documentId: string,
    fileUri: string,
    fileName: string,
  ) => {
    if (!token) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      await updateKycDocument(token, documentId, fileUri, fileName);
      if (__DEV__) console.log('[KYC] Document replaced:', documentId);
      await fetchData(false);
    } catch (err: any) {
      if (!handleAuthError(err)) {
        setUploadError(err.message || 'Replace failed');
        throw err;
      }
    } finally {
      setIsUploading(false);
    }
  }, [token, fetchData, handleAuthError]);

  const removeDocument = useCallback(async (documentId: string) => {
    if (!token) return;

    try {
      await deleteKycDocument(token, documentId);
      if (__DEV__) console.log('[KYC] Document deleted:', documentId);
      await fetchData(false);
    } catch (err: any) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Delete failed');
      }
    }
  }, [token, fetchData, handleAuthError]);

  const submit = useCallback(async () => {
    if (!token) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await submitKyc(token);
      if (__DEV__) console.log('[KYC] KYC Submitted');
      await fetchData(false);
    } catch (err: any) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Submit failed');
        throw err;
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [token, fetchData, handleAuthError]);

  const clearUploadError = useCallback(() => setUploadError(null), []);

  return {
    status,
    details,
    isLoading,
    isRefreshing,
    isUploading,
    isSubmitting,
    error,
    uploadError,
    refresh,
    retry,
    upload,
    replaceDocument,
    removeDocument,
    submit,
    clearUploadError,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin KYC Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAdminKyc() {
  const token = useSelector(selectAuthToken) ?? '';
  const dispatch = useDispatch();

  const [queue, setQueue] = useState<KycQueueResponse | null>(null);
  const [detail, setDetail] = useState<KycDetailAdminResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthError = useCallback((err: Error) => {
    if (err.message === 'SESSION_EXPIRED') {
      dispatch(logout() as any);
      return true;
    }
    return false;
  }, [dispatch]);

  const fetchQueue = useCallback(async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const data = await getAdminKycQueue(token, {
        status: activeFilter === 'all' ? undefined : activeFilter,
      });
      setQueue(data);
    } catch (err: any) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Failed to load queue');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, activeFilter, handleAuthError]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    fetchQueue(false);
  }, [fetchQueue]);

  const retry = useCallback(() => {
    fetchQueue(true);
  }, [fetchQueue]);

  const setFilter = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAdminKycDetail(token, id);
      setDetail(data);
    } catch (err: any) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Failed to load details');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, handleAuthError]);

  const handleApprove = useCallback(async (id: string, notes?: string) => {
    if (!token) return;
    setIsProcessing(true);

    try {
      await approveKyc(token, id, notes);
      if (__DEV__) console.log('[KYC Admin] Approved:', id);
      await fetchQueue(false);
    } catch (err: any) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Approve failed');
        throw err;
      }
    } finally {
      setIsProcessing(false);
    }
  }, [token, fetchQueue, handleAuthError]);

  const handleReject = useCallback(async (id: string, reason: string, notes?: string) => {
    if (!token) return;
    setIsProcessing(true);

    try {
      await rejectKyc(token, id, reason, notes);
      if (__DEV__) console.log('[KYC Admin] Rejected:', id);
      await fetchQueue(false);
    } catch (err: any) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Reject failed');
        throw err;
      }
    } finally {
      setIsProcessing(false);
    }
  }, [token, fetchQueue, handleAuthError]);

  const handleRequestReupload = useCallback(async (id: string, notes: string, documentIds?: string[]) => {
    if (!token) return;
    setIsProcessing(true);

    try {
      await requestKycReupload(token, id, notes, documentIds);
      if (__DEV__) console.log('[KYC Admin] Reupload requested:', id);
      await fetchQueue(false);
    } catch (err: any) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Request reupload failed');
        throw err;
      }
    } finally {
      setIsProcessing(false);
    }
  }, [token, fetchQueue, handleAuthError]);

  return {
    queue,
    detail,
    activeFilter,
    isLoading,
    isRefreshing,
    isProcessing,
    error,
    refresh,
    retry,
    setFilter,
    fetchDetail,
    handleApprove,
    handleReject,
    handleRequestReupload,
  };
}
