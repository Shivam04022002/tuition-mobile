import React from 'react';
import { Polyline } from 'react-native-maps';
import { colors } from '../../theme/colors';

interface RouteLineProps {
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
  color?: string;
  strokeWidth?: number;
  dashed?: boolean;
}

const RouteLine: React.FC<RouteLineProps> = ({
  fromLatitude,
  fromLongitude,
  toLatitude,
  toLongitude,
  color = colors.primary,
  strokeWidth = 3,
  dashed = false,
}) => {
  const coordinates = [
    { latitude: fromLatitude, longitude: fromLongitude },
    { latitude: toLatitude, longitude: toLongitude },
  ];

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={color}
      strokeWidth={strokeWidth}
      lineDashPattern={dashed ? [10, 10] : undefined}
    />
  );
};

export default RouteLine;
