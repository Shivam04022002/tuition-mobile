export const gradients = {
  hero:          ['#2D0A7D', '#5B21B6', '#EC4899'] as string[],
  primary:       ['#2D0A7D', '#5B21B6'] as string[],
  purplePink:    ['#5B21B6', '#EC4899'] as string[],
  pinkOrange:    ['#EC4899', '#F59E0B'] as string[],
  heroFull:      ['#2D0A7D', '#EC4899', '#F59E0B'] as string[],
  dark:          ['#1A0550', '#2D0A7D'] as string[],
  accentWarm:    ['#F59E0B', '#EC4899'] as string[],

  statPurple:    ['#5B21B6', '#7C3AED'] as string[],
  statPink:      ['#EC4899', '#F472B6'] as string[],
  statOrange:    ['#F59E0B', '#FCD34D'] as string[],
  statGreen:     ['#10B981', '#34D399'] as string[],
  statBlue:      ['#3B82F6', '#60A5FA'] as string[],
  statIndigo:    ['#6366F1', '#818CF8'] as string[],

  tabActive:     ['#2D0A7D', '#5B21B6'] as string[],
  cardGlass:     ['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.98)'] as string[],
  shimmer:       ['#F1F5F9', '#E2E8F0', '#F1F5F9'] as string[],
};

export type GradientKey = keyof typeof gradients;
