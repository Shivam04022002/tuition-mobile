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

type RootStackParamList = {
  Step3Location: { requirementData: RequirementData };
};

type Step2RouteProp = RouteProp<
  { Step2SubjectsPreferences: { studentDetails: StudentDetails } },
  'Step2SubjectsPreferences'
>;

type Step2NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Step3Location'>;

const Step2SubjectsPreferencesScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<Step2RouteProp>();
  const navigation = useNavigation<Step2NavigationProp>();
  
  const { studentDetails } = route.params;
  
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [tuitionType, setTuitionType] = useState('home');
  
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
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'English', 'Hindi', 'History', 'Geography',
    'Civics', 'Economics', 'Computer Science', 'Physical Education',
    'Arts', 'Music', 'Dance', 'Foreign Languages'
  ];

  const languages = [
    'English', 'Hindi', 'Bengali', 'Tamil', 'Telugu',
    'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi',
    'Urdu', 'French', 'German', 'Spanish'
  ];

  const tuitionTypes = [
    { value: 'home', label: 'Home Tuition', icon: '🏠', description: 'Tutor comes to your home' },
    { value: 'online', label: 'Online Tuition', icon: '💻', description: 'Learn from anywhere' },
    { value: 'group', label: 'Group Tuition', icon: '👥', description: 'Learn in small groups' },
    { value: 'crash', label: 'Crash Course', icon: '🚀', description: 'Intensive short-term course' },
  ];

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const validateForm = () => {
    return selectedSubjects.length > 0 && selectedLanguages.length > 0;
  };

  const handleNext = () => {
    if (!validateForm()) {
      alert('Please select at least one subject and one language');
      return;
    }

    const requirementData: RequirementData = {
      studentDetails,
      subjects: selectedSubjects,
      languagePreference: selectedLanguages,
      tuitionType,
    };

    navigation.navigate('Step3Location', { requirementData });
  };

  const renderSubjectChip = (subject: string) => {
    const isSelected = selectedSubjects.includes(subject);
    return (
      <TouchableOpacity
        key={subject}
        style={[
          styles.chip,
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

  const renderLanguageChip = (language: string) => {
    const isSelected = selectedLanguages.includes(language);
    return (
      <TouchableOpacity
        key={language}
        style={[
          styles.chip,
          {
            backgroundColor: isSelected ? theme.colors.secondary : theme.colors.card,
            borderColor: isSelected ? theme.colors.secondary : theme.colors.border,
          },
        ]}
        onPress={() => toggleLanguage(language)}
      >
        <Text style={[
          styles.chipText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {language}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTuitionType = (type: typeof tuitionTypes[0]) => {
    const isSelected = tuitionType === type.value;
    return (
      <TouchableOpacity
        key={type.value}
        style={[
          styles.tuitionTypeCard,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setTuitionType(type.value)}
      >
        <View style={styles.tuitionTypeHeader}>
          <Text style={styles.tuitionTypeIcon}>{type.icon}</Text>
          <Text style={[
            styles.tuitionTypeLabel,
            { color: isSelected ? theme.colors.textWhite : theme.colors.text }
          ]}>
            {type.label}
          </Text>
        </View>
        <Text style={[
          styles.tuitionTypeDescription,
          { color: isSelected ? theme.colors.textWhite : theme.colors.textSecondary }
        ]}>
          {type.description}
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
            width: '40%', 
            backgroundColor: theme.colors.primary 
          }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          Step 2 of 5 - Subjects & Preferences
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
          What subjects do you need help with?
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Select all subjects and your preferences
        </Text>
      </Animated.View>

      {/* Subjects Selection */}
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
          Subjects (Select multiple)
        </Text>
        <Card variant="outlined" margin="small">
          <View style={styles.chipsContainer}>
            {subjects.map(renderSubjectChip)}
          </View>
        </Card>
      </Animated.View>

      {/* Language Preference */}
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
          Language Preference (Select multiple)
        </Text>
        <Card variant="outlined" margin="small">
          <View style={styles.chipsContainer}>
            {languages.map(renderLanguageChip)}
          </View>
        </Card>
      </Animated.View>

      {/* Tuition Type */}
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
          Tuition Type
        </Text>
        <View style={styles.tuitionTypesContainer}>
          {tuitionTypes.map(renderTuitionType)}
        </View>
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
          title="Continue to Location"
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tuitionTypesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tuitionTypeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  tuitionTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tuitionTypeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tuitionTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  tuitionTypeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

export default Step2SubjectsPreferencesScreen;
