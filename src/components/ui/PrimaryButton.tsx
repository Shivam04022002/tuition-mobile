import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconRight?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const sizeStyles: Record<Size, { px: number; py: number; fs: number; br: number }> = {
    xs: { px: 12, py: 7,  fs: 11, br: 8  },
    sm: { px: 16, py: 10, fs: 13, br: 10 },
    md: { px: 22, py: 13, fs: 14, br: 13 },
    lg: { px: 28, py: 16, fs: 16, br: 16 },
  };
  const s = sizeStyles[size];

  const variantStyle: Record<Variant, ViewStyle> = {
    primary:   { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.secondary },
    outline:   { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
    ghost:     { backgroundColor: colors.primary + '12' },
    danger:    { backgroundColor: colors.error },
  };

  const textColor: Record<Variant, string> = {
    primary:   '#FFFFFF',
    secondary: '#FFFFFF',
    outline:   colors.primary,
    ghost:     colors.primary,
    danger:    '#FFFFFF',
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyle[variant],
        variant === 'primary' || variant === 'secondary' || variant === 'danger' ? shadows.sm : {},
        { paddingHorizontal: s.px, paddingVertical: s.py, borderRadius: s.br },
        fullWidth && { width: '100%' },
        isDisabled && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor[variant]} />
      ) : (
        <View style={styles.inner}>
          {icon && !iconRight ? (
            <Ionicons name={icon as any} size={s.fs + 2} color={textColor[variant]} style={{ marginRight: 6 }} />
          ) : null}
          <Text style={[styles.label, { fontSize: s.fs, color: textColor[variant] }, textStyle]}>
            {label}
          </Text>
          {icon && iconRight ? (
            <Ionicons name={icon as any} size={s.fs + 2} color={textColor[variant]} style={{ marginLeft: 6 }} />
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default PrimaryButton;
