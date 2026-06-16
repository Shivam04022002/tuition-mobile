import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { shadows } from '../../theme/shadows';

interface GradientCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  borderRadius?: number;
  padding?: number;
  elevation?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'card';
}

const GradientCard: React.FC<GradientCardProps> = ({
  children,
  style,
  onPress,
  borderRadius = 20,
  padding = 20,
  elevation = 'card',
}) => {
  const shadowStyle = elevation === 'none' ? {} : shadows[elevation];

  const container: ViewStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius,
    padding,
    ...shadowStyle,
  };

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[container, style]}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[container, style]}>{children}</View>;
};

export default GradientCard;
