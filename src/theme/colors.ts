export const colors = {
  // ── Brand Primary (Logo Purple) ──────────────────────────────────────────────
  primary: '#2D0A7D',
  primaryDark: '#1A0550',
  primaryMid: '#3D1299',
  primaryLight: '#5B21B6',

  // ── Brand Secondary Purple ───────────────────────────────────────────────────
  secondary: '#5B21B6',
  secondaryDark: '#3D1299',
  secondaryLight: '#7C3AED',

  // ── Accent Pink ──────────────────────────────────────────────────────────────
  pink: '#EC4899',
  pinkDark: '#BE185D',
  pinkLight: '#F472B6',

  // ── Accent Orange ─────────────────────────────────────────────────────────────
  accent: '#F59E0B',
  accentDark: '#D97706',
  accentLight: '#FCD34D',

  // ── Backgrounds ──────────────────────────────────────────────────────────────
  background: '#F8FAFC',
  backgroundSecondary: '#F1F5F9',
  backgroundTertiary: '#E2E8F0',

  // ── Card ─────────────────────────────────────────────────────────────────────
  card: '#FFFFFF',
  cardShadow: 'rgba(45, 10, 125, 0.08)',

  // ── Text ─────────────────────────────────────────────────────────────────────
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textLight: '#CBD5E1',
  textWhite: '#FFFFFF',

  // ── Borders ──────────────────────────────────────────────────────────────────
  border: '#E2E8F0',
  borderDark: '#CBD5E1',
  borderLight: '#F1F5F9',

  // ── Status ───────────────────────────────────────────────────────────────────
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // ── Gradients (as string tuples for LinearGradient) ──────────────────────────
  gradients: {
    hero: ['#2D0A7D', '#5B21B6', '#EC4899'] as string[],
    primary: ['#2D0A7D', '#5B21B6'] as string[],
    purplePink: ['#5B21B6', '#EC4899'] as string[],
    pinkOrange: ['#EC4899', '#F59E0B'] as string[],
    purpleOrange: ['#2D0A7D', '#EC4899', '#F59E0B'] as string[],
    card: ['#FFFFFF', '#F8FAFC'] as string[],
    dark: ['#1A0550', '#2D0A7D'] as string[],
    accent: ['#F59E0B', '#EC4899'] as string[],
  },

  // ── Overlays ─────────────────────────────────────────────────────────────────
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',
  overlayPurple: 'rgba(45, 10, 125, 0.7)',

  // ── Shadows ──────────────────────────────────────────────────────────────────
  shadow: {
    small: 'rgba(45, 10, 125, 0.06)',
    medium: 'rgba(45, 10, 125, 0.12)',
    large: 'rgba(45, 10, 125, 0.20)',
    dark: 'rgba(0, 0, 0, 0.15)',
  },

  // ── Stat card accent colors ───────────────────────────────────────────────────
  statColors: {
    purple: '#5B21B6',
    pink: '#EC4899',
    orange: '#F59E0B',
    green: '#10B981',
    blue: '#3B82F6',
    indigo: '#6366F1',
  },
};

export type ColorKeys = keyof typeof colors;
