import { useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import * as promoApi from '../services/promoApi';

export interface UsePromoReturn {
  // State
  validationResult: promoApi.PromoValidationResult | null;
  appliedPromo: promoApi.PromoApplyResult | null;
  isValidating: boolean;
  isApplying: boolean;
  error: string | null;

  // Actions
  validatePromo: (input: promoApi.PromoValidationInput) => Promise<boolean>;
  applyPromo: (input: promoApi.PromoApplyInput) => Promise<boolean>;
  clearError: () => void;
  clearValidation: () => void;
}

export const usePromo = (): UsePromoReturn => {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  const [validationResult, setValidationResult] = useState<promoApi.PromoValidationResult | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<promoApi.PromoApplyResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSessionExpired = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const validatePromo = useCallback(async (input: promoApi.PromoValidationInput): Promise<boolean> => {
    if (!token) {
      setError('Authentication required');
      return false;
    }

    setIsValidating(true);
    setError(null);
    setValidationResult(null);

    try {
      if (__DEV__) console.log('[usePromo] Validating promo code:', input.code);
      const response = await promoApi.validatePromoCode(token, input);
      
      if (response.success && response.data?.data) {
        setValidationResult(response.data.data);
        if (__DEV__) console.log('[usePromo] Promo validation successful:', response.data.data);
        return true;
      }
      
      setError(response.message || 'Invalid promo code');
      return false;
    } catch (err: any) {
      const message = err?.message || 'Failed to validate promo code';
      setError(message);
      
      if (message?.includes('401') || message?.includes('session') || message?.includes('expired')) {
        handleSessionExpired();
      }
      
      if (__DEV__) console.log('[usePromo] Promo validation failed:', message);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [token, handleSessionExpired]);

  const applyPromo = useCallback(async (input: promoApi.PromoApplyInput): Promise<boolean> => {
    if (!token) {
      setError('Authentication required');
      return false;
    }

    setIsApplying(true);
    setError(null);

    try {
      if (__DEV__) console.log('[usePromo] Applying promo code:', input.code);
      const response = await promoApi.applyPromoCode(token, input);
      
      if (response.success && response.data?.data) {
        setAppliedPromo(response.data.data);
        if (__DEV__) console.log('[usePromo] Promo applied successfully:', response.data.data);
        return true;
      }
      
      setError(response.message || 'Failed to apply promo code');
      return false;
    } catch (err: any) {
      const message = err?.message || 'Failed to apply promo code';
      setError(message);
      
      if (message?.includes('401') || message?.includes('session') || message?.includes('expired')) {
        handleSessionExpired();
      }
      
      if (__DEV__) console.log('[usePromo] Promo application failed:', message);
      return false;
    } finally {
      setIsApplying(false);
    }
  }, [token, handleSessionExpired]);

  const clearError = useCallback(() => setError(null), []);
  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setAppliedPromo(null);
    setError(null);
  }, []);

  return {
    validationResult,
    appliedPromo,
    isValidating,
    isApplying,
    error,
    validatePromo,
    applyPromo,
    clearError,
    clearValidation,
  };
};
