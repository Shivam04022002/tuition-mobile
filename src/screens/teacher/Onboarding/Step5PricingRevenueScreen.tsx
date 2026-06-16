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

interface PricingRevenue {
  hourlyRate: number;
  monthlyRate: number;
  currentRevenue: string;
  experienceYears: number;
  pricingStrategy: string;
  negotiationAllowed: boolean;
}

interface PricingData {
  locationData: LocationData;
  pricingRevenue: PricingRevenue;
}

type RootStackParamList = {
  Step6VerificationUpload: { pricingData: PricingData };
};

type Step5RouteProp = RouteProp<
  { Step5PricingRevenue: { locationData: LocationData } },
  'Step5PricingRevenue'
>;

type Step5NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Step6VerificationUpload'>;

const Step5PricingRevenueScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<Step5RouteProp>();
  const navigation = useNavigation<Step5NavigationProp>();
  
  const { locationData } = route.params;
  
  const [hourlyRate, setHourlyRate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [currentRevenue, setCurrentRevenue] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [pricingStrategy, setPricingStrategy] = useState('competitive');
  const [negotiationAllowed, setNegotiationAllowed] = useState(true);
  
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

  const pricingStrategies = [
    { value: 'competitive', label: 'Competitive', description: 'Market-aligned pricing' },
    { value: 'premium', label: 'Premium', description: 'Higher rates for quality' },
    { value: 'flexible', label: 'Flexible', description: 'Adjust based on requirements' },
    { value: 'value_based', label: 'Value-based', description: 'Based on student outcomes' },
  ];

  const experienceOptions = [
    { value: '0', label: 'Just Started' },
    { value: '1', label: '1 Year' },
    { value: '2', label: '2 Years' },
    { value: '3', label: '3 Years' },
    { value: '5', label: '5 Years' },
    { value: '7', label: '7 Years' },
    { value: '10', label: '10+ Years' },
  ];

  const revenueRanges = [
    { value: '0', label: 'Just Starting' },
    { value: '10000', label: 'Up to ₹10,000/month' },
    { value: '25000', label: '₹10,000 - ₹25,000/month' },
    { value: '50000', label: '₹25,000 - ₹50,000/month' },
    { value: '100000', label: '₹50,000 - ₹1,00,000/month' },
    { value: '100000+', label: '₹1,00,000+/month' },
  ];

  const validateForm = () => {
    if (!hourlyRate || parseInt(hourlyRate) < 50) {
      Alert.alert('Validation Error', 'Please enter a valid hourly rate (minimum ₹50)');
      return false;
    }
    if (!monthlyRate || parseInt(monthlyRate) < 1000) {
      Alert.alert('Validation Error', 'Please enter a valid monthly rate (minimum ₹1,000)');
      return false;
    }
    if (!experienceYears) {
      Alert.alert('Validation Error', 'Please select your experience level');
      return false;
    }
    if (parseInt(hourlyRate) > parseInt(monthlyRate)) {
      Alert.alert('Validation Error', 'Hourly rate should not exceed monthly rate');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    const pricingRevenue: PricingRevenue = {
      hourlyRate: parseInt(hourlyRate),
      monthlyRate: parseInt(monthlyRate),
      currentRevenue,
      experienceYears: parseInt(experienceYears),
      pricingStrategy,
      negotiationAllowed,
    };

    const pricingData: PricingData = {
      locationData,
      pricingRevenue,
    };

    navigation.navigate('Step6VerificationUpload', { pricingData });
  };

  const renderPricingStrategy = (strategy: typeof pricingStrategies[0]) => {
    const isSelected = pricingStrategy === strategy.value;
    return (
      <TouchableOpacity
        key={strategy.value}
        style={[
          styles.strategyCard,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setPricingStrategy(strategy.value)}
      >
        <Text style={[
          styles.strategyTitle,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {strategy.label}
        </Text>
        <Text style={[
          styles.strategyDescription,
          { color: isSelected ? theme.colors.textWhite : theme.colors.textSecondary }
        ]}>
          {strategy.description}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderExperienceOption = (option: typeof experienceOptions[0]) => {
    const isSelected = experienceYears === option.value;
    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.experienceOption,
          {
            backgroundColor: isSelected ? theme.colors.secondary : theme.colors.card,
            borderColor: isSelected ? theme.colors.secondary : theme.colors.border,
          },
        ]}
        onPress={() => setExperienceYears(option.value)}
      >
        <Text style={[
          styles.experienceText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRevenueOption = (option: typeof revenueRanges[0]) => {
    const isSelected = currentRevenue === option.value;
    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.revenueOption,
          {
            backgroundColor: isSelected ? theme.colors.accent : theme.colors.card,
            borderColor: isSelected ? theme.colors.accent : theme.colors.border,
          },
        ]}
        onPress={() => setCurrentRevenue(option.value)}
      >
        <Text style={[
          styles.revenueText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const calculateSuggestedRates = () => {
    const baseRate = parseInt(experienceYears) * 100 + 200;
    const suggestedHourly = Math.max(baseRate, 300);
    const suggestedMonthly = suggestedHourly * 20;
    
    return {
      hourly: suggestedHourly,
      monthly: suggestedMonthly,
    };
  };

  const suggestedRates = calculateSuggestedRates();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress Indicator */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { 
            width: '83.33%', 
            backgroundColor: theme.colors.primary 
          }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          Step 5 of 6 - Pricing & Revenue
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
          Set Your Pricing
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Define your rates and revenue expectations
        </Text>
      </Animated.View>

      {/* Experience Level */}
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
          Teaching Experience
        </Text>
        <Card variant="outlined" margin="small">
          <View style={styles.experienceContainer}>
            {experienceOptions.map(renderExperienceOption)}
          </View>
        </Card>
      </Animated.View>

      {/* Current Revenue */}
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
          Current Monthly Revenue
        </Text>
        <Card variant="outlined" margin="small">
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            This helps us understand your current market position
          </Text>
          <View style={styles.revenueContainer}>
            {revenueRanges.map(renderRevenueOption)}
          </View>
        </Card>
      </Animated.View>

      {/* Pricing */}
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
          Your Rates
        </Text>
        <Card variant="outlined" margin="small">
          <View style={styles.pricingInputRow}>
            <View style={styles.pricingInput}>
              <Text style={[styles.pricingLabel, { color: theme.colors.textSecondary }]}>
                Hourly Rate
              </Text>
              <Input
                placeholder="₹500"
                value={hourlyRate}
                onChangeText={setHourlyRate}
                leftIcon="currency-rupee"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.pricingInput}>
              <Text style={[styles.pricingLabel, { color: theme.colors.textSecondary }]}>
                Monthly Rate
              </Text>
              <Input
                placeholder="₹8000"
                value={monthlyRate}
                onChangeText={setMonthlyRate}
                leftIcon="currency-rupee"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Suggested Rates */}
          <View style={[styles.suggestedRates, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.suggestedTitle, { color: theme.colors.text }]}>
              💡 Suggested Rates Based on Your Experience
            </Text>
            <View style={styles.suggestedRow}>
              <Text style={[styles.suggestedRate, { color: theme.colors.text }]}>
                Hourly: ₹{suggestedRates.hourly}
              </Text>
              <Text style={[styles.suggestedRate, { color: theme.colors.text }]}>
                Monthly: ₹{suggestedRates.monthly}
              </Text>
            </View>
            <TouchableOpacity onPress={() => {
              setHourlyRate(suggestedRates.hourly.toString());
              setMonthlyRate(suggestedRates.monthly.toString());
            }}>
              <Text style={[styles.useSuggestedText, { color: theme.colors.primary }]}>
                Use Suggested Rates
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </Animated.View>

      {/* Pricing Strategy */}
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
          Pricing Strategy
        </Text>
        <View style={styles.strategiesContainer}>
          {pricingStrategies.map(renderPricingStrategy)}
        </View>
      </Animated.View>

      {/* Negotiation Option */}
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
            style={styles.negotiationOption}
            onPress={() => setNegotiationAllowed(!negotiationAllowed)}
          >
            <View style={[
              styles.checkbox,
              { 
                backgroundColor: negotiationAllowed ? theme.colors.primary : theme.colors.card,
                borderColor: theme.colors.border 
              }
            ]}>
              {negotiationAllowed && (
                <Text style={[styles.checkmark, { color: theme.colors.textWhite }]}>
                  ✓
                </Text>
              )}
            </View>
            <View style={styles.negotiationText}>
              <Text style={[styles.negotiationTitle, { color: theme.colors.text }]}>
                Open to Negotiation
              </Text>
              <Text style={[styles.negotiationSubtitle, { color: theme.colors.textSecondary }]}>
                Parents can propose different rates within reasonable limits
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
      </Animated.View>

      {/* Pricing Tips */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Card variant="elevated" margin="small" style={[styles.tipsCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
            💰 Pricing Tips
          </Text>
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            • Research market rates in your area
          </Text>
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            • Consider your qualification and experience
          </Text>
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            • Higher rates for specialized subjects
          </Text>
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            • Offer package deals for long-term commitments
          </Text>
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
          title="Continue to Verification Upload"
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
  experienceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  experienceOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  experienceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  revenueContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  revenueOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  revenueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pricingInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pricingInput: {
    flex: 1,
  },
  pricingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  suggestedRates: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  suggestedRate: {
    fontSize: 16,
    fontWeight: '600',
  },
  useSuggestedText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  strategiesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  strategyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  strategyDescription: {
    fontSize: 14,
  },
  negotiationOption: {
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
  negotiationText: {
    flex: 1,
  },
  negotiationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  negotiationSubtitle: {
    fontSize: 14,
  },
  tipsCard: {
    marginHorizontal: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

export default Step5PricingRevenueScreen;
