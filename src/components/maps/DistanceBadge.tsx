import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Coordinates, formatDistance, isValidCoordinates } from '../../types/location';

function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinDLon * sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

type BadgeVariant = 'default' | 'compact' | 'pill' | 'card';
type BadgeSize = 'small' | 'medium' | 'large';

interface DistanceBadgeProps {
  from: Coordinates;
  to: Coordinates;
  radiusKm?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  showIcon?: boolean;
  showWithinLabel?: boolean;
  style?: object;
}

const SIZE_CONFIGS: Record<BadgeSize, { fontSize: number; iconSize: number; padding: [number, number] }> = {
  small: { fontSize: 11, iconSize: 12, padding: [3, 7] },
  medium: { fontSize: 13, iconSize: 14, padding: [5, 10] },
  large: { fontSize: 15, iconSize: 16, padding: [7, 14] },
};

const DistanceBadge: React.FC<DistanceBadgeProps> = ({
  from,
  to,
  radiusKm,
  variant = 'default',
  size = 'medium',
  showIcon = true,
  showWithinLabel = false,
  style,
}) => {
  const validFrom = isValidCoordinates(from.latitude, from.longitude);
  const validTo = isValidCoordinates(to.latitude, to.longitude);

  if (!validFrom || !validTo) {
    return null;
  }

  const distanceKm = Math.round(haversineKm(from, to) * 10) / 10;
  const label = formatDistance(distanceKm);
  const isWithin = radiusKm != null ? distanceKm <= radiusKm : null;

  const sizeConf = SIZE_CONFIGS[size];
  const color = isWithin === null ? '#0F766E' : isWithin ? '#16A34A' : '#EF4444';
  const bg = isWithin === null ? '#F0FDF9' : isWithin ? '#F0FDF4' : '#FEF2F2';

  const containerStyle = [
    styles.base,
    variant === 'pill' && styles.pill,
    variant === 'card' && styles.card,
    variant === 'compact' && styles.compact,
    { backgroundColor: bg, paddingVertical: sizeConf.padding[0], paddingHorizontal: sizeConf.padding[1] },
    style,
  ];

  return (
    <View style={containerStyle}>
      {showIcon && (
        <Ionicons
          name={isWithin === false ? 'navigate-circle-outline' : 'navigate-outline'}
          size={sizeConf.iconSize}
          color={color}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { fontSize: sizeConf.fontSize, color }]}>
        {label}
        {showWithinLabel && isWithin !== null
          ? isWithin
            ? ' · Nearby'
            : ' · Far'
          : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  pill: {
    borderRadius: 20,
  },
  card: {
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  compact: {
    borderRadius: 4,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});

export default DistanceBadge;
