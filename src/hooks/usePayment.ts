import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import {
  getCreditPacks,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  createCreditPackOrder,
  verifyCreditPackPayment,
  CreditPack,
  SubscriptionPaymentResult,
  CreditPackPaymentResult,
} from '../services/paymentApi';

// ─────────────────────────────────────────────────────────────────────────────
// Hook: usePayment
// Provides Razorpay checkout flow for subscriptions and credit packs.
// ─────────────────────────────────────────────────────────────────────────────

export interface UsePaymentResult {
  creditPacks: CreditPack[];
  gstRate: number;
  isLoadingPacks: boolean;
  isProcessing: boolean;
  error: string | null;
  refreshPacks: () => Promise<void>;
  purchaseSubscription: (planName: string, billingCycle?: 'monthly' | 'annual') => Promise<SubscriptionPaymentResult | null>;
  purchaseCreditPack: (packId: string) => Promise<CreditPackPaymentResult | null>;
}

export function usePayment(): UsePaymentResult {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [gstRate, setGstRate] = useState(18);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSessionExpired = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  // Load credit packs on mount
  const fetchPacks = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoadingPacks(true);
      setError(null);
      const data = await getCreditPacks(token);
      setCreditPacks(data.packs);
      setGstRate(data.gstRate);
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') { handleSessionExpired(); return; }
      setError(err.message || 'Failed to load credit packs');
    } finally {
      setIsLoadingPacks(false);
    }
  }, [token, handleSessionExpired]);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  // Open Razorpay checkout helper
  const openRazorpayCheckout = useCallback(async (options: {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill: { name: string; email: string; contact: string };
    theme: { color: string };
  }): Promise<{ razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }> => {
    let RazorpayCheckout: any;
    try {
      RazorpayCheckout = require('react-native-razorpay').default;
    } catch {
      throw new Error('Payment module not available. Please reinstall the app.');
    }
    return RazorpayCheckout.open(options);
  }, []);

  // Purchase subscription via Razorpay
  const purchaseSubscription = useCallback(async (
    planName: string,
    billingCycle: 'monthly' | 'annual' = 'monthly',
    promoCode?: string,
  ): Promise<SubscriptionPaymentResult | null> => {
    if (!token) return null;
    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Create order (with promo code if provided)
      const order = await createSubscriptionOrder(token, planName, billingCycle, promoCode);

      // Step 2: Open Razorpay checkout
      const paymentResponse = await openRazorpayCheckout({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Tuition Marketplace',
        description: order.description,
        order_id: order.orderId,
        prefill: order.prefill,
        theme: order.theme,
      });

      // Step 3: Verify on backend
      const result = await verifySubscriptionPayment(token, {
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
        internalPaymentId: order.internalPaymentId,
        planName,
        billingCycle,
      });

      if (__DEV__) console.log('[Payment] Subscription purchased:', { planName, billingCycle });
      return result;
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') { handleSessionExpired(); return null; }
      // Razorpay checkout dismissed (user cancelled)
      if (err?.code === 0 || err?.description?.includes('cancelled')) {
        Alert.alert('Payment Cancelled', 'You cancelled the payment.');
        return null;
      }
      setError(err.message || 'Payment failed');
      Alert.alert('Payment Failed', err.message || 'Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [token, handleSessionExpired, openRazorpayCheckout]);

  // Purchase credit pack via Razorpay
  const purchaseCreditPack = useCallback(async (
    packId: string,
    promoCode?: string,
  ): Promise<CreditPackPaymentResult | null> => {
    if (!token) return null;
    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Create order (with promo code if provided)
      const order = await createCreditPackOrder(token, packId, promoCode);

      // Step 2: Open Razorpay checkout
      const paymentResponse = await openRazorpayCheckout({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Tuition Marketplace',
        description: order.description,
        order_id: order.orderId,
        prefill: order.prefill,
        theme: order.theme,
      });

      // Step 3: Verify on backend
      const result = await verifyCreditPackPayment(token, {
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
        internalPaymentId: order.internalPaymentId,
        packId,
      });

      if (__DEV__) console.log('[Payment] Credit pack purchased:', { packId, creditsAdded: result.creditsAdded });
      return result;
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') { handleSessionExpired(); return null; }
      if (err?.code === 0 || err?.description?.includes('cancelled')) {
        Alert.alert('Payment Cancelled', 'You cancelled the payment.');
        return null;
      }
      setError(err.message || 'Payment failed');
      Alert.alert('Payment Failed', err.message || 'Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [token, handleSessionExpired, openRazorpayCheckout]);

  return {
    creditPacks,
    gstRate,
    isLoadingPacks,
    isProcessing,
    error,
    refreshPacks: fetchPacks,
    purchaseSubscription,
    purchaseCreditPack,
  };
}
