import React from 'react';
import { Circle } from 'react-native-maps';
import { colors } from '../../theme/colors';

interface ServiceRadiusProps {
  latitude: number;
  longitude: number;
  radiusKm: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

const ServiceRadius: React.FC<ServiceRadiusProps> = ({
  latitude,
  longitude,
  radiusKm,
  fillColor = `${colors.primary}20`,
  strokeColor = colors.primary,
  strokeWidth = 2,
}) => {
  const radiusMeters = radiusKm * 1000;

  return (
    <Circle
      center={{ latitude, longitude }}
      radius={radiusMeters}
      fillColor={fillColor}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
    />
  );
};

export default ServiceRadius;
