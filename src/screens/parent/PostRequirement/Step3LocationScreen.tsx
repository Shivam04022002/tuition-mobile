import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../theme';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import MapPicker from '../../../components/maps/MapPicker';
import LocationSearch from '../../../components/maps/LocationSearch';
import { Coordinates, MapRegion, GeocodedAddress } from '../../../types/location';

interface StudentDetails {
  studentName: string;
  grade: string;
  board: string;
  genderPreference: string;
  multipleChildren: boolean;
  children: Array<{
    name: string;
    grade: string;
    board: string;
  }>;
}

interface RequirementData {
  studentDetails: StudentDetails;
  subjects: string[];
  languagePreference: string[];
  tuitionType: string;
}

interface LocationData {
  requirementData: RequirementData;
  location: {
    address: string;
    city: string;
    pincode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    teachingRadius: number;
  };
}

type RootStackParamList = {
  Step4ScheduleBudget: { locationData: LocationData };
};

type Step3RouteProp = RouteProp<
  { Step3Location: { requirementData: RequirementData } },
  'Step3Location'
>;

type Step3NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Step4ScheduleBudget'>;

const Step3LocationScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<Step3RouteProp>();
  const navigation = useNavigation<Step3NavigationProp>();
  
  const { requirementData } = route.params;
  
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [teachingRadius, setTeachingRadius] = useState(5);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [mapKey, setMapKey] = useState(0);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cities = [
    'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata',
    'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
    'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal'
  ];

  const radiusOptions = [1, 2, 3, 5, 8, 10, 15, 20];

  const handleLocationSelected = useCallback((coords: Coordinates, _region: MapRegion) => {
    setCoordinates(coords);
  }, []);

  const handleSearchResult = useCallback((result: GeocodedAddress) => {
    if (result.city) setCity(result.city);
    if (result.pincode) setPincode(result.pincode);
    if (result.formattedAddress) setAddress(result.formattedAddress);
    setCoordinates({ latitude: result.latitude, longitude: result.longitude });
    setMapKey(k => k + 1);
  }, []);

  const validateForm = () => {
    return address.trim().length > 0 && city.trim().length > 0 && pincode.length === 6 && coordinates !== null;
  };

  const handleNext = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all location details correctly');
      return;
    }

    if (!coordinates) {
      Alert.alert('Location Required', 'Please select a location on the map or search for one.');
      return;
    }

    const locationData: LocationData = {
      requirementData,
      location: {
        address,
        city,
        pincode,
        coordinates,
        teachingRadius,
      },
    };

    navigation.navigate('Step4ScheduleBudget', { locationData });
  };

  const renderCityOption = (cityName: string) => {
    const isSelected = city === cityName;
    return (
      <TouchableOpacity
        key={cityName}
        style={[
          styles.cityChip,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setCity(cityName)}
      >
        <Text style={[
          styles.cityChipText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {cityName}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRadiusOption = (radius: number) => {
    const isSelected = teachingRadius === radius;
    return (
      <TouchableOpacity
        key={radius}
        style={[
          styles.radiusOption,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setTeachingRadius(radius)}
      >
        <Text style={[
          styles.radiusText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {radius} km
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress Indicator */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { 
            width: '60%', 
            backgroundColor: theme.colors.primary 
          }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          Step 3 of 5 - Location
        </Text>
      </View>

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Where do you need the tutor?
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Help us find tutors near your location
        </Text>
      </Animated.View>

      {/* Map Section */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Search or Pin Location
        </Text>
        <Card variant="elevated" margin="small">
          <View style={styles.mapContainer}>
            <View style={styles.searchWrapper}>
              <LocationSearch
                onLocationSelected={handleSearchResult}
                placeholder="Search area, street or landmark…"
                currentLatitude={coordinates?.latitude}
                currentLongitude={coordinates?.longitude}
              />
            </View>
            <MapPicker
              key={mapKey}
              initialCoordinates={coordinates ?? undefined}
              radiusKm={teachingRadius}
              onLocationSelected={handleLocationSelected}
              label="Tap to pin your location"
              showRadius
              height={220}
            />
          </View>
        </Card>
      </Animated.View>

      {/* Address Details */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Address Details
        </Text>
        <Card variant="outlined" margin="small">
          <Input
            label="Complete Address"
            placeholder="Enter your complete address"
            value={address}
            onChangeText={setAddress}
            leftIcon="location-on"
            required
          />
          
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            City
          </Text>
          <View style={styles.chipsContainer}>
            {cities.map(renderCityOption)}
          </View>
          
          <Input
            label="Pincode"
            placeholder="Enter 6-digit pincode"
            value={pincode}
            onChangeText={setPincode}
            leftIcon="mail"
            keyboardType="numeric"
            maxLength={6}
            required
          />
        </Card>
      </Animated.View>

      {/* Teaching Radius */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Teaching Radius
        </Text>
        <Card variant="outlined" margin="small">
          <Text style={[styles.radiusDescription, { color: theme.colors.textSecondary }]}>
            Find tutors within this distance from your location
          </Text>
          <View style={styles.radiusContainer}>
            {radiusOptions.map(renderRadiusOption)}
          </View>
          <View style={styles.radiusInfo}>
            <Text style={[styles.radiusInfoText, { color: theme.colors.textSecondary }]}>
              Selected: <Text style={[styles.radiusValue, { color: theme.colors.primary }]}>
                {teachingRadius} km
              </Text>
            </Text>
            <Text style={[styles.radiusNote, { color: theme.colors.textLight }]}>
              Larger radius = More tutor options
            </Text>
          </View>
        </Card>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View
        style={[
          styles.actions,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Button
          title="Continue to Schedule & Budget"
          variant="primary"
          size="large"
          onPress={handleNext}
          fullWidth
        />
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressSection: {
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  mapContainer: {
    overflow: 'hidden',
  },
  searchWrapper: {
    padding: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  cityChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  radiusDescription: {
    fontSize: 14,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  radiusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  radiusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  radiusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  radiusInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  radiusInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  radiusValue: {
    fontWeight: '600',
  },
  radiusNote: {
    fontSize: 12,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

export default Step3LocationScreen;
