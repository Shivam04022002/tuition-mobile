import { colors } from './colors';
import { typography, textStyles } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';
import { gradients } from './gradients';

export const theme = {
  colors,
  typography,
  textStyles,
  spacing,
  shadows,
  gradients,
};

// Export theme types
export type Theme = typeof theme;
export type { ColorKeys } from './colors';
export type { TextStyles } from './typography';
export type { SpacingKeys } from './spacing';
export type { GradientKey } from './gradients';

// Export useTheme hook for components
export const useTheme = () => theme;

// Default export
export default theme;
