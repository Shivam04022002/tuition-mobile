import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../theme';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

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

interface ScheduleBudgetData {
  locationData: LocationData;
  schedule: {
    daysPerWeek: string;
    preferredTimings: string[];
    startDate: string;
  };
  budget: {
    minAmount: number;
    maxAmount: number;
    negotiationAllowed: boolean;
  };
}

type RootStackParamList = {
  Step5RequirementPreview: { scheduleBudgetData: ScheduleBudgetData };
};

type Step4RouteProp = RouteProp<
  { Step4ScheduleBudget: { locationData: LocationData } },
  'Step4ScheduleBudget'
>;

type Step4NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Step5RequirementPreview'>;

const Step4ScheduleBudgetScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<Step4RouteProp>();
  const navigation = useNavigation<Step4NavigationProp>();
  
  const { locationData } = route.params;
  
  const [daysPerWeek, setDaysPerWeek] = useState('3');
  const [preferredTimings, setPreferredTimings] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [minAmount, setMinAmount] = useState('300');
  const [maxAmount, setMaxAmount] = useState('800');
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

  const daysOptions = [
    { value: '1', label: '1 day/week' },
    { value: '2', label: '2 days/week' },
    { value: '3', label: '3 days/week' },
    { value: '4', label: '4 days/week' },
    { value: '5', label: '5 days/week' },
    { value: '6', label: '6 days/week' },
    { value: '7', label: '7 days/week' },
  ];

  const timeSlots = [
    'Morning (6AM - 9AM)',
    'Late Morning (9AM - 12PM)',
    'Afternoon (12PM - 3PM)',
    'Late Afternoon (3PM - 6PM)',
    'Evening (6PM - 9PM)',
    'Night (9PM - 12AM)',
  ];

  const budgetRanges = [
    { min: 200, max: 400, label: '₹200-400/hr' },
    { min: 400, max: 600, label: '₹400-600/hr' },
    { min: 600, max: 800, label: '₹600-800/hr' },
    { min: 800, max: 1000, label: '₹800-1000/hr' },
    { min: 1000, max: 1500, label: '₹1000-1500/hr' },
    { min: 1500, max: 2000, label: '₹1500-2000/hr' },
  ];

  const toggleTiming = (timing: string) => {
    setPreferredTimings(prev => 
      prev.includes(timing) 
        ? prev.filter(t => t !== timing)
        : [...prev, timing]
    );
  };

  const selectBudgetRange = (min: number, max: number) => {
    setMinAmount(min.toString());
    setMaxAmount(max.toString());
  };

  const validateForm = () => {
    return (
      daysPerWeek &&
      preferredTimings.length > 0 &&
      startDate &&
      minAmount &&
      maxAmount &&
      parseInt(minAmount) < parseInt(maxAmount)
    );
  };

  const handleNext = () => {
    if (!validateForm()) {
      alert('Please fill all schedule and budget details correctly');
      return;
    }

    const scheduleBudgetData: ScheduleBudgetData = {
      locationData,
      schedule: {
        daysPerWeek,
        preferredTimings,
        startDate,
      },
      budget: {
        minAmount: parseInt(minAmount),
        maxAmount: parseInt(maxAmount),
        negotiationAllowed,
      },
    };

    navigation.navigate('Step5RequirementPreview', { scheduleBudgetData });
  };

  const renderDayOption = (option: typeof daysOptions[0]) => {
    const isSelected = daysPerWeek === option.value;
    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.dayOption,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setDaysPerWeek(option.value)}
      >
        <Text style={[
          styles.dayOptionText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTimingChip = (timing: string) => {
    const isSelected = preferredTimings.includes(timing);
    return (
      <TouchableOpacity
        key={timing}
        style={[
          styles.timingChip,
          {
            backgroundColor: isSelected ? theme.colors.secondary : theme.colors.card,
            borderColor: isSelected ? theme.colors.secondary : theme.colors.border,
          },
        ]}
        onPress={() => toggleTiming(timing)}
      >
        <Text style={[
          styles.timingChipText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {timing}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBudgetRange = (range: typeof budgetRanges[0]) => {
    const isSelected = 
      parseInt(minAmount) === range.min && 
      parseInt(maxAmount) === range.max;
    
    return (
      <TouchableOpacity
        key={`${range.min}-${range.max}`}
        style={[
          styles.budgetRange,
          {
            backgroundColor: isSelected ? theme.colors.accent : theme.colors.card,
            borderColor: isSelected ? theme.colors.accent : theme.colors.border,
          },
        ]}
        onPress={() => selectBudgetRange(range.min, range.max)}
      >
        <Text style={[
          styles.budgetRangeText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {range.label}
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
            width: '80%', 
            backgroundColor: theme.colors.primary 
          }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          Step 4 of 5 - Schedule & Budget
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
          When do you need classes?
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Set your preferred schedule and budget
        </Text>
      </Animated.View>

      {/* Schedule Section */}
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
          Schedule Preferences
        </Text>
        <Card variant="outlined" margin="small">
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Days per week
          </Text>
          <View style={styles.daysContainer}>
            {daysOptions.map(renderDayOption)}
          </View>
          
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Preferred timings (Select multiple)
          </Text>
          <View style={styles.timingsContainer}>
            {timeSlots.map(renderTimingChip)}
          </View>
          
          <Input
            label="Start Date"
            placeholder="When do you want to start?"
            value={startDate}
            onChangeText={setStartDate}
            leftIcon="calendar-today"
            required
          />
        </Card>
      </Animated.View>

      {/* Budget Section */}
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
          Budget Range
        </Text>
        <Card variant="outlined" margin="small">
          <Text style={[styles.budgetDescription, { color: theme.colors.textSecondary }]}>
            Select your budget range per hour
          </Text>
          <View style={styles.budgetRangesContainer}>
            {budgetRanges.map(renderBudgetRange)}
          </View>
          
          <View style={styles.customBudgetContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Custom Budget Range
            </Text>
            <View style={styles.budgetInputs}>
              <Input
                placeholder="Min"
                value={minAmount}
                onChangeText={setMinAmount}
                keyboardType="numeric"
                leftIcon="currency-rupee"
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <Text style={[styles.budgetSeparator, { color: theme.colors.text }]}>
                to
              </Text>
              <Input
                placeholder="Max"
                value={maxAmount}
                onChangeText={setMaxAmount}
                keyboardType="numeric"
                leftIcon="currency-rupee"
                containerStyle={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
          
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
                Tutors can propose different rates
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
          title="Review Requirement"
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  dayOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  dayOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  timingChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  timingChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  budgetDescription: {
    fontSize: 14,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  budgetRangesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  budgetRange: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  budgetRangeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  customBudgetContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  budgetInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetSeparator: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  negotiationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
    fontWeight: '500',
    marginBottom: 2,
  },
  negotiationSubtitle: {
    fontSize: 14,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

export default Step4ScheduleBudgetScreen;
