import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface LocationMarkerProps {
  latitude: number;
  longitude: number;
  type: 'parent' | 'teacher';
  title?: string;
  description?: string;
  onPress?: () => void;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({
  latitude,
  longitude,
  type,
  title,
  description,
  onPress,
}) => {
  const isParent = type === 'parent';
  
  const markerColor = isParent ? colors.accent : colors.primary;
  const iconName = isParent ? 'home' : 'school';
  const label = isParent ? 'Parent' : 'Tutor';

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      title={title || label}
      description={description}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.container}>
        <View style={[styles.markerBubble, { backgroundColor: markerColor }]}>
          <Ionicons name={iconName as any} size={16} color="#FFFFFF" />
        </View>
        <View style={[styles.markerArrow, { borderTopColor: markerColor }]} />
        {title && (
          <View style={styles.labelContainer}>
            <Text style={styles.labelText} numberOfLines={1}>
              {title}
            </Text>
          </View>
        )}
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  markerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -3,
  },
  labelContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    maxWidth: 120,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
});

export default LocationMarker;
