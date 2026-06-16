export const spacing = {
  // Base spacing unit (4px)
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 56,
  '7xl': 64,
  '8xl': 72,
  '9xl': 80,
  '10xl': 96,
  
  // Component-specific spacing
  padding: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
  },
  
  margin: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
  },
  
  // Screen-specific spacing
  screen: {
    horizontal: {
      sm: 16,
      md: 20,
      lg: 24,
    },
    vertical: {
      sm: 16,
      md: 20,
      lg: 24,
    },
  },
  
  // Card spacing
  card: {
    padding: {
      sm: 12,
      md: 16,
      lg: 20,
    },
    margin: {
      sm: 8,
      md: 12,
      lg: 16,
    },
  },
  
  // Button spacing
  button: {
    padding: {
      horizontal: {
        sm: 16,
        md: 20,
        lg: 24,
      },
      vertical: {
        sm: 8,
        md: 12,
        lg: 16,
      },
    },
    margin: {
      sm: 8,
      md: 12,
      lg: 16,
    },
  },
  
  // Input spacing
  input: {
    padding: {
      horizontal: 16,
      vertical: 12,
    },
    margin: {
      vertical: 8,
    },
  },
  
  // List spacing
  list: {
    item: {
      vertical: 8,
      horizontal: 16,
    },
    section: {
      vertical: 24,
    },
  },
};

export type SpacingKeys = keyof typeof spacing;
