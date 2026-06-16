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

type Step5RouteProp = RouteProp<
  { Step5RequirementPreview: { scheduleBudgetData: ScheduleBudgetData } },
  'Step5RequirementPreview'
>;

type RootStackParamList = {
  ParentDashboard: undefined;
};

type Step5NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ParentDashboard'>;

const Step5RequirementPreviewScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<Step5RouteProp>();
  const navigation = useNavigation<Step5NavigationProp>();
  
  const { scheduleBudgetData } = route.params;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success!',
        'Your requirement has been posted successfully. Tutors will contact you soon.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to post requirement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (step: string) => {
    Alert.alert('Edit', `Would navigate to ${step} for editing`);
  };

  const getTuitionTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      home: 'Home Tuition',
      online: 'Online Tuition',
      group: 'Group Tuition',
      crash: 'Crash Course',
    };
    return types[type] || type;
  };

  const getGenderLabel = (gender: string) => {
    const labels: { [key: string]: string } = {
      any: 'No Preference',
      male: 'Male Tutor',
      female: 'Female Tutor',
    };
    return labels[gender] || gender;
  };

  const renderSummaryCard = (title: string, children: React.ReactNode, editStep?: string) => (
    <Card variant="outlined" margin="small" style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        {editStep && (
          <TouchableOpacity onPress={() => handleEdit(editStep)}>
            <Text style={[styles.editText, { color: theme.colors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </Card>
  );

  const renderStudentDetails = () => {
    const { studentDetails } = scheduleBudgetData.locationData.requirementData;
    
    return (
      <View style={styles.summaryContent}>
        {studentDetails.multipleChildren ? (
          studentDetails.children.map((child, index) => (
            <View key={index} style={styles.childItem}>
              <Text style={[styles.childName, { color: theme.colors.text }]}>
                {child.name}
              </Text>
              <Text style={[styles.childDetails, { color: theme.colors.textSecondary }]}>
                {child.grade} • {child.board}
              </Text>
            </View>
          ))
        ) : (
          <View>
            <Text style={[styles.childName, { color: theme.colors.text }]}>
              {studentDetails.studentName}
            </Text>
            <Text style={[styles.childDetails, { color: theme.colors.textSecondary }]}>
              {studentDetails.grade} • {studentDetails.board}
            </Text>
          </View>
        )}
        <View style={styles.genderRow}>
          <Text style={[styles.genderLabel, { color: theme.colors.textSecondary }]}>
            Gender Preference:
          </Text>
          <Text style={[styles.genderValue, { color: theme.colors.text }]}>
            {getGenderLabel(studentDetails.genderPreference)}
          </Text>
        </View>
      </View>
    );
  };

  const renderSubjectsPreferences = () => {
    const { subjects, languagePreference, tuitionType } = scheduleBudgetData.locationData.requirementData;
    
    return (
      <View style={styles.summaryContent}>
        <View style={styles.subjectRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Subjects:</Text>
          <View style={styles.chipsRow}>
            {subjects.map((subject, index) => (
              <View key={index} style={[styles.chip, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.chipText, { color: theme.colors.textWhite }]}>
                  {subject}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.subjectRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Languages:</Text>
          <View style={styles.chipsRow}>
            {languagePreference.map((language, index) => (
              <View key={index} style={[styles.chip, { backgroundColor: theme.colors.secondary }]}>
                <Text style={[styles.chipText, { color: theme.colors.textWhite }]}>
                  {language}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.subjectRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Tuition Type:</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {getTuitionTypeLabel(tuitionType)}
          </Text>
        </View>
      </View>
    );
  };

  const renderLocation = () => {
    const { location } = scheduleBudgetData.locationData;
    
    return (
      <View style={styles.summaryContent}>
        <Text style={[styles.address, { color: theme.colors.text }]}>
          {location.address}
        </Text>
        <Text style={[styles.locationDetails, { color: theme.colors.textSecondary }]}>
          {location.city}, {location.pincode}
        </Text>
        <View style={styles.radiusRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Teaching Radius:
          </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {location.teachingRadius} km
          </Text>
        </View>
      </View>
    );
  };

  const renderScheduleBudget = () => {
    const { schedule, budget } = scheduleBudgetData;
    
    return (
      <View style={styles.summaryContent}>
        <View style={styles.scheduleRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Days/Week:</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {schedule.daysPerWeek} days
          </Text>
        </View>
        
        <View style={styles.scheduleRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Timings:</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {schedule.preferredTimings.join(', ')}
          </Text>
        </View>
        
        <View style={styles.scheduleRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Start Date:</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {schedule.startDate}
          </Text>
        </View>
        
        <View style={styles.budgetRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Budget:</Text>
          <Text style={[styles.budgetValue, { color: theme.colors.accent }]}>
            ₹{budget.minAmount} - ₹{budget.maxAmount}/hour
          </Text>
        </View>
        
        {budget.negotiationAllowed && (
          <View style={[styles.negotiationBadge, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.negotiationText, { color: theme.colors.textSecondary }]}>
              Open to negotiation
            </Text>
          </View>
        )}
      </View>
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
            width: '100%', 
            backgroundColor: theme.colors.primary 
          }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          Step 5 of 5 - Review & Post
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
          Review your requirement
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Check all details before posting
        </Text>
      </Animated.View>

      {/* Summary Cards */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {renderSummaryCard('Student Details', renderStudentDetails(), 'Step 1')}
        {renderSummaryCard('Subjects & Preferences', renderSubjectsPreferences(), 'Step 2')}
        {renderSummaryCard('Location', renderLocation(), 'Step 3')}
        {renderSummaryCard('Schedule & Budget', renderScheduleBudget(), 'Step 4')}
      </Animated.View>

      {/* Important Notice */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Card variant="elevated" margin="small" style={[styles.noticeCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.noticeTitle, { color: theme.colors.text }]}>
            📋 Important Notice
          </Text>
          <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
            • Your requirement will be visible to verified tutors only
          </Text>
          <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
            • Tutors typically respond within 24-48 hours
          </Text>
          <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
            • You can shortlist tutors before unlocking contact details
          </Text>
          <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
            • Contact details require payment to unlock
          </Text>
        </Card>
      </Animated.View>

      {/* Disclaimer */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Card variant="outlined" margin="small" style={styles.disclaimerCard}>
          <Text style={[styles.disclaimerText, { color: theme.colors.textTertiary }]}>
            "We connect tutors and parents. We do not provide tutoring services or guarantee academic results."
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
          title={isSubmitting ? 'Posting...' : 'Post Requirement'}
          variant="primary"
          size="large"
          onPress={handleSubmit}
          disabled={isSubmitting}
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
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryContent: {
    paddingLeft: 4,
  },
  childItem: {
    marginBottom: 12,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  childDetails: {
    fontSize: 14,
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  genderLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  genderValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  subjectRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  address: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  locationDetails: {
    fontSize: 14,
    marginBottom: 8,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  scheduleRowText: {
    flex: 1,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  negotiationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  negotiationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noticeCard: {
    marginHorizontal: 20,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  disclaimerCard: {
    marginHorizontal: 20,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

export default Step5RequirementPreviewScreen;
