import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle, MapPressEvent, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Coordinates, MapRegion, DEFAULT_REGION, isValidCoordinates } from '../../types/location';

interface MapPickerProps {
  initialCoordinates?: Coordinates;
  radiusKm?: number;
  onLocationSelected: (coords: Coordinates, region: MapRegion) => void;
  label?: string;
  showRadius?: boolean;
  height?: number;
  disabled?: boolean;
}

const MapPicker: React.FC<MapPickerProps> = ({
  initialCoordinates,
  radiusKm = 5,
  onLocationSelected,
  label = 'Tap on the map to select location',
  showRadius = true,
  height = 260,
  disabled = false,
}) => {
  const hasValidInitial =
    initialCoordinates && isValidCoordinates(initialCoordinates.latitude, initialCoordinates.longitude);

  const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(
    hasValidInitial ? initialCoordinates! : null
  );
  const [region, setRegion] = useState<MapRegion>(
    hasValidInitial
      ? {
          latitude: initialCoordinates!.latitude,
          longitude: initialCoordinates!.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }
      : DEFAULT_REGION
  );
  const [loading, setLoading] = useState(false);

  const mapRef = useRef<MapView>(null);

  const handleMapPress = useCallback(
    (event: MapPressEvent) => {
      if (disabled) return;

      const { latitude, longitude } = event.nativeEvent.coordinate;
      const coords: Coordinates = { latitude, longitude };
      const newRegion: MapRegion = {
        latitude,
        longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      };

      setSelectedCoords(coords);
      setRegion(newRegion);
      onLocationSelected(coords, newRegion);
    },
    [disabled, region, onLocationSelected]
  );

  const handleRegionChange = useCallback((newRegion: Region) => {
    setRegion(newRegion);
  }, []);

  const handleCenterOnMarker = useCallback(() => {
    if (!selectedCoords || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: selectedCoords.latitude,
        longitude: selectedCoords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      400
    );
  }, [selectedCoords]);

  const handleClearSelection = useCallback(() => {
    Alert.alert('Clear Location', 'Remove the selected pin?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => setSelectedCoords(null),
      },
    ]);
  }, []);

  const radiusMeters = radiusKm * 1000;

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapType="standard"
        provider={Platform.OS === 'android' ? 'google' : undefined}
      >
        {selectedCoords && (
          <Marker
            coordinate={selectedCoords}
            anchor={{ x: 0.5, y: 1 }}
            draggable={!disabled}
            onDragEnd={e => {
              const coords = e.nativeEvent.coordinate;
              setSelectedCoords(coords);
              onLocationSelected(coords, { ...region, ...coords });
            }}
          />
        )}

        {selectedCoords && showRadius && (
          <Circle
            center={selectedCoords}
            radius={radiusMeters}
            fillColor="rgba(15, 118, 110, 0.12)"
            strokeColor="rgba(15, 118, 110, 0.4)"
            strokeWidth={1.5}
          />
        )}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#0F766E" />
        </View>
      )}

      {!disabled && (
        <View style={styles.labelContainer} pointerEvents="none">
          <Text style={styles.label}>{label}</Text>
        </View>
      )}

      {selectedCoords && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleCenterOnMarker}>
            <Ionicons name="locate-outline" size={18} color="#0F766E" />
          </TouchableOpacity>
          {!disabled && (
            <TouchableOpacity style={styles.controlButton} onPress={handleClearSelection}>
              <Ionicons name="close-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {selectedCoords && (
        <View style={styles.coordsBar}>
          <Ionicons name="location-outline" size={12} color="#0F766E" />
          <Text style={styles.coordsText}>
            {selectedCoords.latitude.toFixed(5)}, {selectedCoords.longitude.toFixed(5)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    alignItems: 'center',
  },
  label: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  controls: {
    position: 'absolute',
    right: 10,
    top: 10,
    gap: 8,
    flexDirection: 'column',
  },
  controlButton: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  coordsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  coordsText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default MapPicker;
