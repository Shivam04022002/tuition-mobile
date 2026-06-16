import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'parent' | 'teacher' | 'admin';

interface UserState {
  role: UserRole | null;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    profileImage?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
  } | null;
  profileCompleted: boolean;
  onboardingCompleted: boolean;
  preferences: {
    notifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    language: string;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  role: null,
  profile: null,
  profileCompleted: false,
  onboardingCompleted: false,
  preferences: {
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    language: 'en',
  },
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setRole: (state, action: PayloadAction<UserRole>) => {
      state.role = action.payload;
    },
    setProfile: (state, action: PayloadAction<UserState['profile']>) => {
      state.profile = action.payload;
      state.profileCompleted = !!action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserState['profile']>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    setProfileCompleted: (state, action: PayloadAction<boolean>) => {
      state.profileCompleted = action.payload;
    },
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      state.onboardingCompleted = action.payload;
    },
    setPreferences: (state, action: PayloadAction<Partial<UserState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearUser: (state) => {
      state.role = null;
      state.profile = null;
      state.profileCompleted = false;
      state.onboardingCompleted = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setRole,
  setProfile,
  updateProfile,
  setProfileCompleted,
  setOnboardingCompleted,
  setPreferences,
  setLoading,
  setError,
  clearUser,
  clearError,
} = userSlice.actions;

export default userSlice.reducer;

// Selectors
export const selectUser = (state: { user: UserState }) => state.user;
export const selectUserRole = (state: { user: UserState }) => state.user.role;
export const selectUserProfile = (state: { user: UserState }) => state.user.profile;
export const selectProfileCompleted = (state: { user: UserState }) => state.user.profileCompleted;
export const selectOnboardingCompleted = (state: { user: UserState }) => state.user.onboardingCompleted;
export const selectUserPreferences = (state: { user: UserState }) => state.user.preferences;
export const selectUserLoading = (state: { user: UserState }) => state.user.isLoading;
export const selectUserError = (state: { user: UserState }) => state.user.error;

// Combined selector for login status
export const selectIsLoggedIn = (state: { user: UserState }) => {
  return state.user.profileCompleted && state.user.onboardingCompleted;
};
