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

type RootStackParamList = {
  Step4LocationAvailability: { teachingData: TeachingData };
};

type Step3RouteProp = RouteProp<
  { Step3TeachingDetails: { educationData: EducationData } },
  'Step3TeachingDetails'
>;

type Step3NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Step4LocationAvailability'>;

const Step3TeachingDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<Step3RouteProp>();
  const navigation = useNavigation<Step3NavigationProp>();
  
  const { educationData } = route.params;
  
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [specialization, setSpecialization] = useState('');
  const [teachingModes, setTeachingModes] = useState<string[]>([]);
  const [groupTuitionOption, setGroupTuitionOption] = useState(false);
  const [groupSize, setGroupSize] = useState('5');
  const [groupRate, setGroupRate] = useState('');
  
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

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'English', 'Hindi', 'History', 'Geography', 'Civics', 'Economics',
    'Physical Education', 'Arts', 'Music', 'Dance', 'Foreign Languages',
    'Science', 'Social Science', 'Environmental Studies', 'Moral Science'
  ];

  const classes = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12', 'Competitive Exams', 'College Level'
  ];

  const boards = [
    'CBSE', 'ICSE', 'IGCSE', 'IB', 'State Board', 'NIOS', 'Other International Boards'
  ];

  const teachingModeOptions = [
    { value: 'online', label: 'Online Classes', icon: '💻', description: 'Teach from anywhere' },
    { value: 'student_home', label: 'Student\'s Home', icon: '🏠', description: 'Visit student\'s location' },
    { value: 'own_home', label: 'Your Home', icon: '🏡', description: 'Students visit your place' },
    { value: 'online_group', label: 'Online Group', icon: '👥', description: 'Multiple students online' },
  ];

  const specializations = [
    'STEM Education', 'Exam Preparation', 'Concept Building', 'Homework Help',
    'Advanced Topics', 'Foundation Building', 'Competitive Exams', 'Language Learning',
    'Practical Training', 'Theory & Concepts', 'Problem Solving', 'Speed Math'
  ];

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const toggleClass = (cls: string) => {
    setSelectedClasses(prev => 
      prev.includes(cls) 
        ? prev.filter(c => c !== cls)
        : [...prev, cls]
    );
  };

  const toggleBoard = (board: string) => {
    setSelectedBoards(prev => 
      prev.includes(board) 
        ? prev.filter(b => b !== board)
        : [...prev, board]
    );
  };

  const toggleTeachingMode = (mode: string) => {
    setTeachingModes(prev => 
      prev.includes(mode) 
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    );
  };

  const validateForm = () => {
    if (selectedSubjects.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one subject');
      return false;
    }
    if (selectedClasses.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one class');
      return false;
    }
    if (selectedBoards.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one board');
      return false;
    }
    if (!specialization) {
      Alert.alert('Validation Error', 'Please select your specialization');
      return false;
    }
    if (teachingModes.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one teaching mode');
      return false;
    }
    if (groupTuitionOption && (!groupSize || !groupRate)) {
      Alert.alert('Validation Error', 'Please fill group tuition details');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    const teachingDetails: TeachingDetails = {
      subjects: selectedSubjects,
      classes: selectedClasses,
      boards: selectedBoards,
      specialization,
      teachingModes,
      groupTuitionOption,
      groupSize: parseInt(groupSize),
      groupRate: parseInt(groupRate),
    };

    const teachingData: TeachingData = {
      educationData,
      teachingDetails,
    };

    navigation.navigate('Step4LocationAvailability', { teachingData });
  };

  const renderSubjectChip = (subject: string) => {
    const isSelected = selectedSubjects.includes(subject);
    return (
      <TouchableOpacity
        key={subject}
        style={[
          styles.subjectChip,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => toggleSubject(subject)}
      >
        <Text style={[
          styles.chipText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {subject}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderClassChip = (cls: string) => {
    const isSelected = selectedClasses.includes(cls);
    return (
      <TouchableOpacity
        key={cls}
        style={[
          styles.classChip,
          {
            backgroundColor: isSelected ? theme.colors.secondary : theme.colors.card,
            borderColor: isSelected ? theme.colors.secondary : theme.colors.border,
          },
        ]}
        onPress={() => toggleClass(cls)}
      >
        <Text style={[
          styles.chipText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {cls}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBoardChip = (board: string) => {
    const isSelected = selectedBoards.includes(board);
    return (
      <TouchableOpacity
        key={board}
        style={[
          styles.boardChip,
          {
            backgroundColor: isSelected ? theme.colors.accent : theme.colors.card,
            borderColor: isSelected ? theme.colors.accent : theme.colors.border,
          },
        ]}
        onPress={() => toggleBoard(board)}
      >
        <Text style={[
          styles.chipText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {board}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTeachingModeCard = (mode: typeof teachingModeOptions[0]) => {
    const isSelected = teachingModes.includes(mode.value);
    return (
      <TouchableOpacity
        key={mode.value}
        style={[
          styles.teachingModeCard,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => toggleTeachingMode(mode.value)}
      >
        <View style={styles.teachingModeHeader}>
          <Text style={styles.teachingModeIcon}>{mode.icon}</Text>
          <Text style={[
            styles.teachingModeLabel,
            { color: isSelected ? theme.colors.textWhite : theme.colors.text }
          ]}>
            {mode.label}
          </Text>
        </View>
        <Text style={[
          styles.teachingModeDescription,
          { color: isSelected ? theme.colors.textWhite : theme.colors.textSecondary }
        ]}>
          {mode.description}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSpecializationOption = (spec: string) => {
    const isSelected = specialization === spec;
    return (
      <TouchableOpacity
        key={spec}
        style={[
          styles.specializationOption,
          {
            backgroundColor: isSelected ? theme.colors.secondary : theme.colors.card,
            borderColor: isSelected ? theme.colors.secondary : theme.colors.border,
          },
        ]}
        onPress={() => setSpecialization(spec)}
      >
        <Text style={[
          styles.specializationText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {spec}
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
            width: '50%', 
            backgroundColor: theme.colors.primary 
          }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          Step 3 of 6 - Teaching Details
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
          Your Teaching Expertise
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Tell us about your teaching preferences and expertise
        </Text>
      </Animated.View>

      {/* Subjects */}
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
          Subjects You Teach
        </Text>
        <Card variant="outlined" margin="small">
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Select all subjects you're comfortable teaching
          </Text>
          <View style={styles.chipsContainer}>
            {subjects.map(renderSubjectChip)}
          </View>
        </Card>
      </Animated.View>

      {/* Classes */}
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
          Classes You Teach
        </Text>
        <Card variant="outlined" margin="small">
          <View style={styles.chipsContainer}>
            {classes.map(renderClassChip)}
          </View>
        </Card>
      </Animated.View>

      {/* Boards */}
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
          Educational Boards
        </Text>
        <Card variant="outlined" margin="small">
          <View style={styles.chipsContainer}>
            {boards.map(renderBoardChip)}
          </View>
        </Card>
      </Animated.View>

      {/* Specialization */}
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
          Your Specialization
        </Text>
        <Card variant="outlined" margin="small">
          <View style={styles.specializationsContainer}>
            {specializations.map(renderSpecializationOption)}
          </View>
        </Card>
      </Animated.View>

      {/* Teaching Modes */}
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
          Teaching Modes
        </Text>
        <View style={styles.teachingModesContainer}>
          {teachingModeOptions.map(renderTeachingModeCard)}
        </View>
      </Animated.View>

      {/* Group Tuition Option */}
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
            style={styles.groupTuitionOption}
            onPress={() => setGroupTuitionOption(!groupTuitionOption)}
          >
            <View style={[
              styles.checkbox,
              { 
                backgroundColor: groupTuitionOption ? theme.colors.primary : theme.colors.card,
                borderColor: theme.colors.border 
              }
            ]}>
              {groupTuitionOption && (
                <Text style={[styles.checkmark, { color: theme.colors.textWhite }]}>
                  ✓
                </Text>
              )}
            </View>
            <View style={styles.groupTuitionText}>
              <Text style={[styles.groupTuitionTitle, { color: theme.colors.text }]}>
                Offer Group Tuition
              </Text>
              <Text style={[styles.groupTuitionSubtitle, { color: theme.colors.textSecondary }]}>
                Teach multiple students together at discounted rates
              </Text>
            </View>
          </TouchableOpacity>

          {groupTuitionOption && (
            <View style={styles.groupTuitionDetails}>
              <View style={styles.groupInputRow}>
                <Text style={[styles.groupInputLabel, { color: theme.colors.text }]}>
                  Group Size:
                </Text>
                <Text style={[styles.groupInputValue, { color: theme.colors.text }]}>
                  {groupSize} students
                </Text>
              </View>
              <View style={styles.groupInputRow}>
                <Text style={[styles.groupInputLabel, { color: theme.colors.text }]}>
                  Group Rate:
                </Text>
                <Text style={[styles.groupInputValue, { color: theme.colors.text }]}>
                  ₹{groupRate || '0'}/hour per student
                </Text>
              </View>
            </View>
          )}
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
          title="Continue to Location & Availability"
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  classChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  boardChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  specializationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  specializationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  teachingModesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  teachingModeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  teachingModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  teachingModeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  teachingModeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  teachingModeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  groupTuitionOption: {
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
  groupTuitionText: {
    flex: 1,
  },
  groupTuitionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  groupTuitionSubtitle: {
    fontSize: 14,
  },
  groupTuitionDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  groupInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  groupInputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  groupInputValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

export default Step3TeachingDetailsScreen;
