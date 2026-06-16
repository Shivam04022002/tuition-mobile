import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type UserRole = 'parent' | 'teacher' | 'admin' | 'staff';

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: {
    id: string;
    uid?: string;
    email: string | null;
    phoneNumber: string | null;
    role: UserRole;
    profile?: {
      firstName: string;
      lastName: string;
      profileImage?: string;
    };
    profileCompleted?: boolean;
    onboardingCompleted?: boolean;
  } | null;
  token: string | null;
  role: UserRole | null;
  onboardingCompleted: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  isLoading: false,
  user: null,
  token: null,
  role: null,
  onboardingCompleted: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      state.user = action.payload;
      state.isLoggedIn = !!action.payload;
      if (action.payload) {
        state.role = action.payload.role;
        state.onboardingCompleted = action.payload.onboardingCompleted ?? false;
      }
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    setRole: (state, action: PayloadAction<UserRole | null>) => {
      state.role = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.user = null;
      state.token = null;
      state.role = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setUser,
  setToken,
  setRole,
  setError,
  logout,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsLoggedIn = (state: { auth: AuthState }) => state.auth.isLoggedIn;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthToken = (state: { auth: AuthState }) => state.auth.token;
export const selectAuthRole = (state: { auth: AuthState }) => state.auth.role;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
