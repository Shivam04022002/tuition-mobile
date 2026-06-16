import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

type RootStackParamList = {
  Step2Education: { basicDetails: BasicDetails };
};

type Step1NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Step2Education'>;

const Step1BasicDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<Step1NavigationProp>();
  
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState('');
  
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

  const languages = [
    'English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi',
    'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu',
    'French', 'German', 'Spanish', 'Chinese', 'Japanese'
  ];

  const genderOptions = [
    { value: 'male', label: 'Male', icon: '👨' },
    { value: 'female', label: 'Female', icon: '👩' },
    { value: 'other', label: 'Other', icon: '👤' },
  ];

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const handlePhotoUpload = () => {
    Alert.alert(
      'Upload Photo',
      'Choose photo source',
      [
        { text: 'Camera', onPress: () => console.log('Open camera') },
        { text: 'Gallery', onPress: () => console.log('Open gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return false;
    }
    if (!gender) {
      Alert.alert('Validation Error', 'Please select your gender');
      return false;
    }
    if (!dateOfBirth) {
      Alert.alert('Validation Error', 'Please enter your date of birth');
      return false;
    }
    if (!mobileNumber || mobileNumber.length !== 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!email || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (selectedLanguages.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one language');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    const basicDetails: BasicDetails = {
      fullName,
      gender,
      dateOfBirth,
      mobileNumber,
      email,
      languages: selectedLanguages,
      profilePhoto,
    };

    navigation.navigate('Step2Education', { basicDetails });
  };

  const renderGenderOption = (option: typeof genderOptions[0]) => {
    const isSelected = gender === option.value;
    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.genderOption,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setGender(option.value)}
      >
        <Text style={styles.genderIcon}>{option.icon}</Text>
        <Text style={[
          styles.genderLabel,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {option.label}
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
          styles.languageChip,
          {
            backgroundColor: isSelected ? theme.colors.secondary : theme.colors.card,
            borderColor: isSelected ? theme.colors.secondary : theme.colors.border,
          },
        ]}
        onPress={() => toggleLanguage(language)}
      >
        <Text style={[
          styles.languageChipText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {language}
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
            width: '16.67%', 
            backgroundColor: theme.colors.primary 
          }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          Step 1 of 6 - Basic Details
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
          Let's get to know you
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Tell us about yourself to build your teaching profile
        </Text>
      </Animated.View>

      {/* Profile Photo Upload */}
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
          <TouchableOpacity style={styles.photoUploadSection} onPress={handlePhotoUpload}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Text style={styles.photoIcon}>📷</Text>
                <Text style={[styles.photoText, { color: theme.colors.textSecondary }]}>
                  Upload Profile Photo
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Card>
      </Animated.View>

      {/* Basic Information */}
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
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            required
          />
          
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Gender
          </Text>
          <View style={styles.genderContainer}>
            {genderOptions.map(renderGenderOption)}
          </View>
          
          <Input
            label="Date of Birth"
            placeholder="DD/MM/YYYY"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            leftIcon="calendar-today"
            required
          />
          
          <Input
            label="Mobile Number"
            placeholder="Enter 10-digit mobile number"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            leftIcon="phone"
            keyboardType="phone-pad"
            maxLength={10}
            required
          />
          
          <Input
            label="Email Address"
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            leftIcon="email"
            keyboardType="email-address"
            required
          />
        </Card>
      </Animated.View>

      {/* Languages */}
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
          Languages You Speak
        </Text>
        <Card variant="outlined" margin="small">
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Select all languages you're comfortable teaching in
          </Text>
          <View style={styles.languagesContainer}>
            {languages.map(renderLanguageChip)}
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
          title="Continue to Education"
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
  photoUploadSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  photoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  genderOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 4,
  },
  genderIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
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
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  languageChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

export default Step1BasicDetailsScreen;
