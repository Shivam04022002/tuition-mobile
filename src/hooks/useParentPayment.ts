import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { selectAuthToken, logout } from '../redux/slices/authSlice';
import { setSubscriptionStatus } from '../redux/slices/parentSubscriptionSlice';
import {
  createParentSubscriptionOrder,
  verifyParentSubscriptionPayment,
  ParentSubscriptionSummary,
} from '../services/parentSubscriptionApi';

// ─────────────────────────────────────────────────────────────────────────────
// Hook: useParentPayment
// Razorpay checkout flow for a parent subscription purchase. Sibling to
// usePayment.ts (same checkout-opening pattern) rather than sharing it
// directly — the two hooks serve different roles/backends and this codebase
// does not cross-share role-specific payment hooks.
// ─────────────────────────────────────────────────────────────────────────────

export interface UseParentPaymentResult {
  isProcessing: boolean;
  error: string | null;
  purchaseParentSubscription: (planId: string) => Promise<ParentSubscriptionSummary | null>;
}

export function useParentPayment(): UseParentPaymentResult {
  const token = useAppSelector(selectAuthToken);
  const dispatch = useAppDispatch();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSessionExpired = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

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

  const purchaseParentSubscription = useCallback(async (
    planId: string,
  ): Promise<ParentSubscriptionSummary | null> => {
    if (!token) return null;
    setIsProcessing(true);
    setError(null);

    try {
      const order = await createParentSubscriptionOrder(token, planId);

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

      const result = await verifyParentSubscriptionPayment(token, {
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
        internalPaymentId: order.internalPaymentId,
        planId,
      });

      // Unlock every mounted screen immediately — no refetch, no restart needed.
      dispatch(setSubscriptionStatus({ hasActiveSubscription: true, subscription: result }));

      if (__DEV__) console.log('[Payment] Parent subscription purchased:', { planId });
      return result;
    } catch (err: any) {
      if (err?.message === 'SESSION_EXPIRED') { handleSessionExpired(); return null; }
      // Razorpay checkout dismissed (user cancelled)
      if (err?.code === 0 || err?.description?.includes('cancelled')) {
        Alert.alert('Payment Cancelled', 'You cancelled the payment.');
        return null;
      }
      setError(err?.message || 'Payment failed');
      Alert.alert('Payment Failed', err?.message || 'Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [token, dispatch, handleSessionExpired, openRazorpayCheckout]);

  return { isProcessing, error, purchaseParentSubscription };
}
