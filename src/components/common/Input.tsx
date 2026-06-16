import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  size = 'medium',
  containerStyle,
  inputStyle,
  labelStyle,
  required = false,
  ...textInputProps
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...theme.textStyles.body,
      ...styles[size],
      borderRadius: 8,
    };

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 2,
          borderColor: error
            ? theme.colors.error
            : isFocused
            ? theme.colors.primary
            : theme.colors.border,
          backgroundColor: theme.colors.card,
          paddingHorizontal: leftIcon ? 48 : 16,
          paddingRight: rightIcon ? 48 : 16,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.backgroundSecondary,
          borderBottomWidth: 2,
          borderBottomColor: error
            ? theme.colors.error
            : isFocused
            ? theme.colors.primary
            : theme.colors.border,
          paddingHorizontal: leftIcon ? 48 : 16,
          paddingRight: rightIcon ? 48 : 16,
        };
      case 'default':
      default:
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: error
            ? theme.colors.error
            : isFocused
            ? theme.colors.primary
            : theme.colors.border,
          backgroundColor: theme.colors.card,
          paddingHorizontal: leftIcon ? 48 : 16,
          paddingRight: rightIcon ? 48 : 16,
        };
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }, labelStyle]}>
          {label}
          {required && <Text style={[styles.required, { color: theme.colors.error }]}> *</Text>}
        </Text>
      )}
      
      <View style={styles.inputContainer}>
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={20}
            color={theme.colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[getInputStyle(), inputStyle]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={theme.colors.textLight}
          {...textInputProps}
        />
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon as any}
              size={20}
              color={onRightIconPress ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    fontSize: 14,
  },
  inputContainer: {
    position: 'relative',
  },
  leftIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -10,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
    zIndex: 1,
  },
  small: {
    fontSize: 14,
    paddingVertical: 8,
  },
  medium: {
    fontSize: 16,
    paddingVertical: 12,
  },
  large: {
    fontSize: 18,
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input;
