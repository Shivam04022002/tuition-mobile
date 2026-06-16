import { Platform, ViewStyle } from 'react-native';

export const shadows = {
  none: {} as ViewStyle,

  xs: Platform.select({
    ios: {
      shadowColor: 'rgba(45, 10, 125, 0.08)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  }) as ViewStyle,

  sm: Platform.select({
    ios: {
      shadowColor: 'rgba(45, 10, 125, 0.10)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
    },
    android: { elevation: 3 },
    default: {},
  }) as ViewStyle,

  md: Platform.select({
    ios: {
      shadowColor: 'rgba(45, 10, 125, 0.14)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle,

  lg: Platform.select({
    ios: {
      shadowColor: 'rgba(45, 10, 125, 0.18)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 20,
    },
    android: { elevation: 10 },
    default: {},
  }) as ViewStyle,

  xl: Platform.select({
    ios: {
      shadowColor: 'rgba(45, 10, 125, 0.22)',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 1,
      shadowRadius: 28,
    },
    android: { elevation: 16 },
    default: {},
  }) as ViewStyle,

  card: Platform.select({
    ios: {
      shadowColor: 'rgba(45, 10, 125, 0.10)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
    },
    android: { elevation: 5 },
    default: {},
  }) as ViewStyle,

  float: Platform.select({
    ios: {
      shadowColor: 'rgba(0, 0, 0, 0.20)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 24,
    },
    android: { elevation: 12 },
    default: {},
  }) as ViewStyle,
};
