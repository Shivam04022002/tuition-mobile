import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import LocationMarker from '../../components/maps/LocationMarker';
import RouteLine from '../../components/maps/RouteLine';
import ServiceRadius from '../../components/maps/ServiceRadius';
import { formatDistance, isValidCoordinates } from '../../types/location';

const { width, height } = Dimensions.get('window');

// Navigation params type
export interface LocationMapScreenParams {
  // Teacher (Tutor) location
  teacherLatitude: number;
  teacherLongitude: number;
  teacherName?: string;
  teacherServiceRadius?: number;
  
  // Parent (Lead) location
  parentLatitude: number;
  parentLongitude: number;
  parentName?: string;
  
  // Match details
  distanceKm: number;
  matchScore?: number;
  
  // View mode
  viewMode: 'parent-viewing-teacher' | 'teacher-viewing-lead';
}

type LocationMapRouteProp = RouteProp<{ LocationMap: LocationMapScreenParams }, 'LocationMap'>;

const LocationMapScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<LocationMapRouteProp>();
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  const {
    teacherLatitude,
    teacherLongitude,
    teacherName = 'Tutor',
    teacherServiceRadius = 5,
    parentLatitude,
    parentLongitude,
    parentName = 'Student',
    distanceKm,
    matchScore,
    viewMode,
  } = route.params || {};

  // Validate coordinates
  const hasValidTeacherLocation = isValidCoordinates(teacherLatitude, teacherLongitude);
  const hasValidParentLocation = isValidCoordinates(parentLatitude, parentLongitude);
  const hasBothLocations = hasValidTeacherLocation && hasValidParentLocation;

  // Calculate initial region to fit both markers
  const initialRegion = useMemo((): Region => {
    if (hasBothLocations) {
      const minLat = Math.min(teacherLatitude, parentLatitude);
      const maxLat = Math.max(teacherLatitude, parentLatitude);
      const minLng = Math.min(teacherLongitude, parentLongitude);
      const maxLng = Math.max(teacherLongitude, parentLongitude);
      
      const latDelta = (maxLat - minLat) * 1.5 + 0.02;
      const lngDelta = (maxLng - minLng) * 1.5 + 0.02;
      
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(latDelta, 0.05),
        longitudeDelta: Math.max(lngDelta, 0.05),
      };
    } else if (hasValidTeacherLocation) {
      return {
        latitude: teacherLatitude,
        longitude: teacherLongitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    } else if (hasValidParentLocation) {
      return {
        latitude: parentLatitude,
        longitude: parentLongitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    
    // Default to India center
    return {
      latitude: 28.6139,
      longitude: 77.209,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };
  }, [hasBothLocations, hasValidTeacherLocation, hasValidParentLocation, 
      teacherLatitude, teacherLongitude, parentLatitude, parentLongitude]);

  // Fit map to show both markers
  const fitToMarkers = useCallback(() => {
    if (!mapRef.current || !hasBothLocations) return;
    
    mapRef.current.fitToCoordinates(
      [
        { latitude: teacherLatitude, longitude: teacherLongitude },
        { latitude: parentLatitude, longitude: parentLongitude },
      ],
      {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      }
    );
  }, [hasBothLocations, teacherLatitude, teacherLongitude, parentLatitude, parentLongitude]);

  useEffect(() => {
    // Small delay to ensure map is ready
    const timer = setTimeout(fitToMarkers, 500);
    return () => clearTimeout(timer);
  }, [fitToMarkers]);

  // Determine if parent is inside teacher's service radius
  const isInsideRadius = useMemo(() => {
    if (!hasBothLocations || !teacherServiceRadius) return null;
    return distanceKm <= teacherServiceRadius;
  }, [hasBothLocations, teacherServiceRadius, distanceKm]);

  const topPad = insets.top;

  // Card content based on view mode
  const cardTitle = viewMode === 'parent-viewing-teacher' ? teacherName : parentName;
  const cardSubtitle = viewMode === 'parent-viewing-teacher' 
    ? 'Tutor Location'
    : 'Lead Location';

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        mapType="standard"
        provider={Platform.OS === 'android' ? 'google' : undefined}
      >
        {/* Teacher Service Radius */}
        {hasValidTeacherLocation && teacherServiceRadius && (
          <ServiceRadius
            latitude={teacherLatitude}
            longitude={teacherLongitude}
            radiusKm={teacherServiceRadius}
            fillColor={`${colors.primary}15`}
            strokeColor={colors.primary}
            strokeWidth={2}
          />
        )}

        {/* Route Line between locations */}
        {hasBothLocations && (
          <RouteLine
            fromLatitude={teacherLatitude}
            fromLongitude={teacherLongitude}
            toLatitude={parentLatitude}
            toLongitude={parentLongitude}
            color={colors.secondary}
            strokeWidth={3}
            dashed
          />
        )}

        {/* Teacher Marker */}
        {hasValidTeacherLocation && (
          <LocationMarker
            latitude={teacherLatitude}
            longitude={teacherLongitude}
            type="teacher"
            title={teacherName}
            description={`Service radius: ${teacherServiceRadius} km`}
          />
        )}

        {/* Parent Marker */}
        {hasValidParentLocation && (
          <LocationMarker
            latitude={parentLatitude}
            longitude={parentLongitude}
            type="parent"
            title={parentName}
            description="Student location"
          />
        )}
      </MapView>

      {/* Top Bar with Back Button */}
      <View style={[styles.topBar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Location Map</Text>
        </View>

        <TouchableOpacity 
          style={styles.fitButton}
          onPress={fitToMarkers}
          disabled={!hasBothLocations}
        >
          <Ionicons 
            name="expand" 
            size={22} 
            color={hasBothLocations ? colors.primary : colors.textTertiary} 
          />
        </TouchableOpacity>
      </View>

      {/* Distance Badge */}
      {hasBothLocations && (
        <View style={[styles.distanceBadge, { top: topPad + 72 }]}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={styles.distanceText}>{formatDistance(distanceKm)}</Text>
          {isInsideRadius !== null && (
            <View style={[
              styles.radiusStatus,
              { backgroundColor: isInsideRadius ? colors.success : colors.error }
            ]}>
              <Text style={styles.radiusStatusText}>
                {isInsideRadius ? 'Inside Radius' : 'Outside Radius'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Bottom Info Card */}
      <View style={styles.bottomCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Ionicons 
              name={viewMode === 'parent-viewing-teacher' ? 'school' : 'home'} 
              size={24} 
              color={colors.primary} 
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{cardTitle}</Text>
            <Text style={styles.cardSubtitle}>{cardSubtitle}</Text>
          </View>
          {matchScore !== undefined && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchValue}>{Math.round(matchScore)}%</Text>
              <Text style={styles.matchLabel}>Match</Text>
            </View>
          )}
        </View>

        {hasBothLocations && (
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="navigate-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>{formatDistance(distanceKm)} away</Text>
            </View>
            {teacherServiceRadius && (
              <View style={styles.detailItem}>
                <Ionicons name="radio-button-on" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>{teacherServiceRadius} km radius</Text>
              </View>
            )}
          </View>
        )}

        {/* Radius Indicator */}
        {isInsideRadius !== null && (
          <View style={[
            styles.radiusIndicator,
            { backgroundColor: isInsideRadius ? `${colors.success}15` : `${colors.error}15` }
          ]}>
            <Ionicons 
              name={isInsideRadius ? 'checkmark-circle' : 'alert-circle'} 
              size={18} 
              color={isInsideRadius ? colors.success : colors.error} 
            />
            <Text style={[
              styles.radiusIndicatorText,
              { color: isInsideRadius ? colors.success : colors.error }
            ]}>
              {isInsideRadius 
                ? 'Location is within service radius'
                : 'Location is outside service radius'
              }
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // Top Bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...shadows.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  fitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Distance Badge
  distanceBadge: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    ...shadows.md,
  },
  distanceText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  radiusStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  radiusStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Bottom Card
  bottomCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    ...shadows.float,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  matchBadge: {
    backgroundColor: `${colors.success}15`,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  matchValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.success,
    lineHeight: 20,
  },
  matchLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
    letterSpacing: 0.5,
  },

  // Details Row
  detailsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Radius Indicator
  radiusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  radiusIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default LocationMapScreen;
