import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  StyleProp,
} from 'react-native';
import { useTheme } from '../../theme';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  shadow?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  margin = 'none',
  borderRadius = 12,
  onPress,
  style,
  shadow = true,
  ...touchableProps
}) => {
  const theme = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.card,
      borderRadius,
      ...styles[padding],
      ...styles[`margin${margin.charAt(0).toUpperCase() + margin.slice(1)}`],
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          shadowColor: shadow ? 'rgba(45, 10, 125, 0.12)' : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: shadow ? 0.1 : 0,
          shadowRadius: shadow ? 8 : 0,
          elevation: shadow ? 4 : 0,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'default':
      default:
        return {
          ...baseStyle,
          shadowColor: shadow ? 'rgba(45, 10, 125, 0.06)' : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: shadow ? 0.05 : 0,
          shadowRadius: shadow ? 4 : 0,
          elevation: shadow ? 2 : 0,
        };
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[getCardStyle(), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      {...(onPress ? touchableProps : {})}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  none: {
    padding: 0,
  },
  small: {
    padding: 8,
  },
  medium: {
    padding: 16,
  },
  large: {
    padding: 24,
  },
  marginNone: {
    margin: 0,
  },
  marginSmall: {
    margin: 8,
  },
  marginMedium: {
    margin: 12,
  },
  marginLarge: {
    margin: 16,
  },
});

export default Card;
