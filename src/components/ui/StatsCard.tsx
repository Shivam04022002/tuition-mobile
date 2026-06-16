import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadows } from '../../theme/shadows';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: string;
  bgColor: string;
  iconColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  bgColor,
  iconColor = '#FFFFFF',
  onPress,
  style,
  subtitle,
}) => {
  const content = (
    <View style={[styles.card, { backgroundColor: bgColor }, shadows.card, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon as any} size={26} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.82} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  subtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.70)',
    marginTop: 2,
  },
});

export default StatsCard;
