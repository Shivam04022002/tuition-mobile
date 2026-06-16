import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  isNetworkConnected: boolean;
  isAppLoading: boolean;
  appVersion: string;
  buildNumber: string;
  currentScreen: string;
  previousScreen: string | null;
  theme: 'light' | 'dark' | 'system';
  isSplashScreenVisible: boolean;
  maintenanceMode: boolean;
  forceUpdateRequired: boolean;
  notifications: {
    unreadCount: number;
    lastNotificationId: string | null;
  };
}

const initialState: AppState = {
  isNetworkConnected: true,
  isAppLoading: false,
  appVersion: '1.0.0',
  buildNumber: '1',
  currentScreen: 'Splash',
  previousScreen: null,
  theme: 'system',
  isSplashScreenVisible: true,
  maintenanceMode: false,
  forceUpdateRequired: false,
  notifications: {
    unreadCount: 0,
    lastNotificationId: null,
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setNetworkStatus: (state, action: PayloadAction<boolean>) => {
      state.isNetworkConnected = action.payload;
    },
    setAppLoading: (state, action: PayloadAction<boolean>) => {
      state.isAppLoading = action.payload;
    },
    setCurrentScreen: (state, action: PayloadAction<string>) => {
      state.previousScreen = state.currentScreen;
      state.currentScreen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setSplashScreenVisible: (state, action: PayloadAction<boolean>) => {
      state.isSplashScreenVisible = action.payload;
    },
    setMaintenanceMode: (state, action: PayloadAction<boolean>) => {
      state.maintenanceMode = action.payload;
    },
    setForceUpdateRequired: (state, action: PayloadAction<boolean>) => {
      state.forceUpdateRequired = action.payload;
    },
    setUnreadNotificationCount: (state, action: PayloadAction<number>) => {
      state.notifications.unreadCount = action.payload;
    },
    incrementUnreadNotifications: (state) => {
      state.notifications.unreadCount += 1;
    },
    decrementUnreadNotifications: (state) => {
      if (state.notifications.unreadCount > 0) {
        state.notifications.unreadCount -= 1;
      }
    },
    setLastNotificationId: (state, action: PayloadAction<string | null>) => {
      state.notifications.lastNotificationId = action.payload;
    },
    resetAppState: (state) => {
      state.currentScreen = 'Splash';
      state.previousScreen = null;
      state.notifications.unreadCount = 0;
      state.notifications.lastNotificationId = null;
    },
  },
});

export const {
  setNetworkStatus,
  setAppLoading,
  setCurrentScreen,
  setTheme,
  setSplashScreenVisible,
  setMaintenanceMode,
  setForceUpdateRequired,
  setUnreadNotificationCount,
  incrementUnreadNotifications,
  decrementUnreadNotifications,
  setLastNotificationId,
  resetAppState,
} = appSlice.actions;

export default appSlice.reducer;

// Selectors
export const selectApp = (state: { app: AppState }) => state.app;
export const selectNetworkStatus = (state: { app: AppState }) => state.app.isNetworkConnected;
export const selectAppLoading = (state: { app: AppState }) => state.app.isAppLoading;
export const selectCurrentScreen = (state: { app: AppState }) => state.app.currentScreen;
export const selectTheme = (state: { app: AppState }) => state.app.theme;
export const selectSplashScreenVisible = (state: { app: AppState }) => state.app.isSplashScreenVisible;
export const selectMaintenanceMode = (state: { app: AppState }) => state.app.maintenanceMode;
export const selectForceUpdateRequired = (state: { app: AppState }) => state.app.forceUpdateRequired;
export const selectUnreadNotificationCount = (state: { app: AppState }) => state.app.notifications.unreadCount;
export const selectLastNotificationId = (state: { app: AppState }) => state.app.notifications.lastNotificationId;
