import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ParentSubscriptionSummary } from '../../services/parentSubscriptionApi';

// ─────────────────────────────────────────────────────────────────────────────
// Shared cache for the parent's subscription status. Kept in Redux (not a
// per-screen hook) so every screen that renders a "Contact" button — the
// tutor search results, recommended tutors, and the tutor profile action
// bar — unlocks immediately after a purchase without needing to remount,
// matching how authSlice is already the shared cross-screen source of truth
// for auth state.
// ─────────────────────────────────────────────────────────────────────────────

interface ParentSubscriptionState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  hasActiveSubscription: boolean;
  subscription: ParentSubscriptionSummary | null;
  error: string | null;
}

const initialState: ParentSubscriptionState = {
  status: 'idle',
  hasActiveSubscription: false,
  subscription: null,
  error: null,
};

const parentSubscriptionSlice = createSlice({
  name: 'parentSubscription',
  initialState,
  reducers: {
    setSubscriptionLoading: (state) => {
      state.status = 'loading';
      state.error = null;
    },
    setSubscriptionStatus: (
      state,
      action: PayloadAction<{ hasActiveSubscription: boolean; subscription: ParentSubscriptionSummary | null }>
    ) => {
      state.status = 'loaded';
      state.hasActiveSubscription = action.payload.hasActiveSubscription;
      state.subscription = action.payload.subscription;
      state.error = null;
    },
    setSubscriptionError: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
    },
    resetParentSubscription: () => initialState,
  },
});

export const {
  setSubscriptionLoading,
  setSubscriptionStatus,
  setSubscriptionError,
  resetParentSubscription,
} = parentSubscriptionSlice.actions;

export default parentSubscriptionSlice.reducer;

// Selectors
export const selectParentSubscriptionState = (state: { parentSubscription: ParentSubscriptionState }) =>
  state.parentSubscription;
export const selectHasActiveSubscription = (state: { parentSubscription: ParentSubscriptionState }) =>
  state.parentSubscription.hasActiveSubscription;
export const selectParentSubscription = (state: { parentSubscription: ParentSubscriptionState }) =>
  state.parentSubscription.subscription;
