import React, { useState } from 'react';
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

interface BasicDetails {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  mobileNumber: string;
  email: string;
  languages: string[];
  profilePhoto: string;
}

interface Education {
  highestQualification: string;
  degree: string;
  university: string;
  yearOfCompletion: string;
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
  }>;
  status: 'completed' | 'pursuing';
}

interface EducationData {
  basicDetails: BasicDetails;
  education: Education;
}

interface TeachingDetails {
  subjects: string[];
  classes: string[];
  boards: string[];
  specialization: string;
  teachingModes: string[];
  groupTuitionOption: boolean;
  groupSize: number;
  groupRate: number;
}

interface TeachingData {
  educationData: EducationData;
  teachingDetails: TeachingDetails;
}

interface LocationAvailability {
  address: string;
  city: string;
  pincode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  preferredAreas: string[];
  teachingRadius: number;
  availableDays: string[];
  availableTimeSlots: string[];
  vacationMode: boolean;
}

interface LocationData {
  teachingData: TeachingData;
  locationAvailability: LocationAvailability;
}

type RootStackParamList = {
  Step5PricingRevenue: { locationData: LocationData };
};

type Step4RouteProp = RouteProp<
  { Step4LocationAvailability: { teachingData: TeachingData } },
  'Step4LocationAvailability'
>;

type Step4NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Step5PricingRevenue'>;

const Step4LocationAvailabilityScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<Step4RouteProp>();
  const navigation = useNavigation<Step4NavigationProp>();
  
  const { teachingData } = route.params;
  
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);
  const [teachingRadius, setTeachingRadius] = useState(5);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [vacationMode, setVacationMode] = useState(false);
  
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

  const areas = [
    'Connaught Place', 'Karol Bagh', 'Rohini', 'Dwarka', 'Lajpat Nagar',
    'South Extension', 'Greater Kailash', 'Vasant Kunj', 'Saket', 'Janakpuri',
    'Pitampura', 'Paschim Vihar', 'Rajouri Garden', 'Vikas Puri', 'Uttam Nagar'
  ];

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const timeSlots = [
    '6AM - 8AM', '8AM - 10AM', '10AM - 12PM', '12PM - 2PM',
    '2PM - 4PM', '4PM - 6PM', '6PM - 8PM', '8PM - 10PM'
  ];

  const radiusOptions = [1, 2, 3, 5, 8, 10, 15, 20];

  const toggleArea = (area: string) => {
    setPreferredAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const toggleDay = (day: string) => {
    setAvailableDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const toggleTimeSlot = (slot: string) => {
    setAvailableTimeSlots(prev => 
      prev.includes(slot) 
        ? prev.filter(s => s !== slot)
        : [...prev, slot]
    );
  };

  const handleOpenMap = () => {
    Alert.alert(
      'Google Maps',
      'This would open Google Maps for location selection. For demo, using default location.',
      [{ text: 'OK' }]
    );
  };

  const validateForm = () => {
    if (!address) {
      Alert.alert('Validation Error', 'Please enter your complete address');
      return false;
    }
    if (!city) {
      Alert.alert('Validation Error', 'Please select your city');
      return false;
    }
    if (!pincode || pincode.length !== 6) {
      Alert.alert('Validation Error', 'Please enter a valid 6-digit pincode');
      return false;
    }
    if (availableDays.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one available day');
      return false;
    }
    if (availableTimeSlots.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one time slot');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    const locationAvailability: LocationAvailability = {
      address,
      city,
      pincode,
      coordinates: {
        latitude: 28.6139, // Default: Delhi
        longitude: 77.2090,
      },
      preferredAreas,
      teachingRadius,
      availableDays,
      availableTimeSlots,
      vacationMode,
    };

    const locationData: LocationData = {
      teachingData,
      locationAvailability,
    };

    navigation.navigate('Step5PricingRevenue', { locationData });
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

  const renderAreaChip = (area: string) => {
    const isSelected = preferredAreas.includes(area);
    return (
      <TouchableOpacity
        key={area}
        style={[
          styles.areaChip,
          {
            backgroundColor: isSelected ? theme.colors.secondary : theme.colors.card,
            borderColor: isSelected ? theme.colors.secondary : theme.colors.border,
          },
        ]}
        onPress={() => toggleArea(area)}
      >
        <Text style={[
          styles.areaChipText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {area}
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
            backgroundColor: isSelected ? theme.colors.accent : theme.colors.card,
            borderColor: isSelected ? theme.colors.accent : theme.colors.border,
          },
        ]}
        onPress={() => setTeachingRadius(radius)}
      >
        <Text style={[
          styles.radiusOptionText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {radius} km
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDayOption = (day: string) => {
    const isSelected = availableDays.includes(day);
    return (
      <TouchableOpacity
        key={day}
        style={[
          styles.dayOption,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => toggleDay(day)}
      >
        <Text style={[
          styles.dayOptionText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {day.slice(0, 3)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTimeSlotOption = (slot: string) => {
    const isSelected = availableTimeSlots.includes(slot);
    return (
      <TouchableOpacity
        key={slot}
        style={[
          styles.timeSlotOption,
          {
            backgroundColor: isSelected ? theme.colors.secondary : theme.colors.card,
            borderColor: isSelected ? theme.colors.secondary : theme.colors.border,
          },
        ]}
        onPress={() => toggleTimeSlot(slot)}
      >
        <Text style={[
          styles.timeSlotOptionText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {slot}
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
            width: '66.67%', 
            backgroundColor: theme.colors.primary 
          }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          Step 4 of 6 - Location & Availability
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
          Where and When You Teach
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Set your location preferences and teaching schedule
        </Text>
      </Animated.View>

      {/* Location Section */}
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
          Your Location
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
          
          <TouchableOpacity
            style={[styles.mapButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={handleOpenMap}
          >
            <Text style={styles.mapIcon}>🗺️</Text>
            <Text style={[styles.mapText, { color: theme.colors.textSecondary }]}>
              Select Location on Map
            </Text>
          </TouchableOpacity>
        </Card>
      </Animated.View>

      {/* Preferred Teaching Areas */}
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
          Preferred Teaching Areas
        </Text>
        <Card variant="outlined" margin="small">
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Select areas where you prefer to teach
          </Text>
          <View style={styles.chipsContainer}>
            {areas.map(renderAreaChip)}
          </View>
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
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Maximum distance you're willing to travel
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
          </View>
        </Card>
      </Animated.View>

      {/* Availability */}
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
          Your Availability
        </Text>
        <Card variant="outlined" margin="small">
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Select your preferred teaching days and time slots
          </Text>
          
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Available Days
          </Text>
          <View style={styles.daysContainer}>
            {daysOfWeek.map(renderDayOption)}
          </View>
          
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Available Time Slots
          </Text>
          <View style={styles.timeSlotsContainer}>
            {timeSlots.map(renderTimeSlotOption)}
          </View>
        </Card>
      </Animated.View>

      {/* Vacation Mode */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Card variant="outlined" margin="small">
          <TouchableOpacity
            style={styles.vacationModeOption}
            onPress={() => setVacationMode(!vacationMode)}
          >
            <View style={[
              styles.checkbox,
              { 
                backgroundColor: vacationMode ? theme.colors.primary : theme.colors.card,
                borderColor: theme.colors.border 
              }
            ]}>
              {vacationMode && (
                <Text style={[styles.checkmark, { color: theme.colors.textWhite }]}>
                  ✓
                </Text>
              )}
            </View>
            <View style={styles.vacationModeText}>
              <Text style={[styles.vacationModeTitle, { color: theme.colors.text }]}>
                Vacation Mode
              </Text>
              <Text style={[styles.vacationModeSubtitle, { color: theme.colors.textSecondary }]}>
                Temporarily hide your profile from new students
              </Text>
            </View>
          </TouchableOpacity>
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
          title="Continue to Pricing & Revenue"
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
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    marginHorizontal: 16,
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
  areaChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  areaChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  mapIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mapText: {
    fontSize: 14,
    fontWeight: '500',
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
  radiusOptionText: {
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
  },
  radiusValue: {
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  dayOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  dayOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  timeSlotOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  timeSlotOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  vacationModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  vacationModeText: {
    flex: 1,
  },
  vacationModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  vacationModeSubtitle: {
    fontSize: 14,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

export default Step4LocationAvailabilityScreen;
