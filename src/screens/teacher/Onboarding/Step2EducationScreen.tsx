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

type RootStackParamList = {
  Step3TeachingDetails: { educationData: EducationData };
};

type Step2RouteProp = RouteProp<
  { Step2Education: { basicDetails: BasicDetails } },
  'Step2Education'
>;

type Step2NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Step3TeachingDetails'>;

const Step2EducationScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<Step2RouteProp>();
  const navigation = useNavigation<Step2NavigationProp>();
  
  const { basicDetails } = route.params;
  
  const [highestQualification, setHighestQualification] = useState('');
  const [degree, setDegree] = useState('');
  const [university, setUniversity] = useState('');
  const [yearOfCompletion, setYearOfCompletion] = useState('');
  const [status, setStatus] = useState<'completed' | 'pursuing'>('completed');
  const [certifications, setCertifications] = useState([
    { name: '', issuer: '', year: '' }
  ]);
  
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

  const qualifications = [
    'Ph.D.', 'M.Phil.', 'Master\'s Degree', 'Bachelor\'s Degree',
    'Post Graduate Diploma', 'Diploma', 'B.Ed.', 'M.Ed.',
    'Other Professional Degree'
  ];

  const degrees = [
    'B.Sc.', 'M.Sc.', 'B.Com.', 'M.Com.', 'B.A.', 'M.A.',
    'B.Tech.', 'M.Tech.', 'B.E.', 'M.E.', 'B.C.A.', 'M.C.A.',
    'LLB', 'LLM', 'MBBS', 'MD', 'Other'
  ];

  const addCertification = () => {
    setCertifications([...certifications, { name: '', issuer: '', year: '' }]);
  };

  const updateCertification = (index: number, field: string, value: string) => {
    const updatedCertifications = [...certifications];
    updatedCertifications[index] = { ...updatedCertifications[index], [field]: value };
    setCertifications(updatedCertifications);
  };

  const removeCertification = (index: number) => {
    if (certifications.length > 1) {
      setCertifications(certifications.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (!highestQualification) {
      Alert.alert('Validation Error', 'Please select your highest qualification');
      return false;
    }
    if (!degree) {
      Alert.alert('Validation Error', 'Please enter your degree');
      return false;
    }
    if (!university) {
      Alert.alert('Validation Error', 'Please enter your university/institution');
      return false;
    }
    if (!yearOfCompletion || yearOfCompletion.length !== 4) {
      Alert.alert('Validation Error', 'Please enter a valid year of completion');
      return false;
    }
    
    // Validate certifications (at least one field should be filled for each certification)
    const validCertifications = certifications.filter(
      cert => cert.name || cert.issuer || cert.year
    );
    
    for (const cert of validCertifications) {
      if (!cert.name || !cert.issuer || !cert.year) {
        Alert.alert('Validation Error', 'Please fill all fields for certifications or remove empty ones');
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    const education: Education = {
      highestQualification,
      degree,
      university,
      yearOfCompletion,
      certifications: certifications.filter(cert => cert.name && cert.issuer && cert.year),
      status,
    };

    const educationData: EducationData = {
      basicDetails,
      education,
    };

    navigation.navigate('Step3TeachingDetails', { educationData });
  };

  const renderQualificationOption = (qualification: string) => {
    const isSelected = highestQualification === qualification;
    return (
      <TouchableOpacity
        key={qualification}
        style={[
          styles.qualificationOption,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setHighestQualification(qualification)}
      >
        <Text style={[
          styles.qualificationText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {qualification}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStatusOption = (optionStatus: 'completed' | 'pursuing', label: string) => {
    const isSelected = status === optionStatus;
    return (
      <TouchableOpacity
        key={optionStatus}
        style={[
          styles.statusOption,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setStatus(optionStatus)}
      >
        <Text style={[
          styles.statusText,
          { color: isSelected ? theme.colors.textWhite : theme.colors.text }
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCertificationForm = (certification: typeof certifications[0], index: number) => (
    <Card key={index} variant="outlined" margin="small" style={styles.certificationCard}>
      <View style={styles.certificationHeader}>
        <Text style={[styles.certificationTitle, { color: theme.colors.text }]}>
          Certification {index + 1}
        </Text>
        {certifications.length > 1 && (
          <TouchableOpacity
            onPress={() => removeCertification(index)}
            style={styles.removeButton}
          >
            <Text style={[styles.removeText, { color: theme.colors.error }]}>
              Remove
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Input
        label="Certification Name"
        placeholder="e.g., Java Programming"
        value={certification.name}
        onChangeText={(value) => updateCertification(index, 'name', value)}
      />
      
      <Input
        label="Issuing Organization"
        placeholder="e.g., Oracle"
        value={certification.issuer}
        onChangeText={(value) => updateCertification(index, 'issuer', value)}
      />
      
      <Input
        label="Year of Completion"
        placeholder="YYYY"
        value={certification.year}
        onChangeText={(value) => updateCertification(index, 'year', value)}
        keyboardType="numeric"
        maxLength={4}
      />
    </Card>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress Indicator */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { 
            width: '33.33%', 
            backgroundColor: theme.colors.primary 
          }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          Step 2 of 6 - Education
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
          Your Educational Background
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Help parents understand your qualifications
        </Text>
      </Animated.View>

      {/* Highest Qualification */}
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
          Highest Qualification
        </Text>
        <Card variant="outlined" margin="small">
          <View style={styles.qualificationsContainer}>
            {qualifications.map(renderQualificationOption)}
          </View>
        </Card>
      </Animated.View>

      {/* Degree and University */}
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
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Degree
          </Text>
          <View style={styles.degreesContainer}>
            {degrees.map((deg) => (
              <TouchableOpacity
                key={deg}
                style={[
                  styles.degreeChip,
                  {
                    backgroundColor: degree === deg ? theme.colors.secondary : theme.colors.card,
                    borderColor: degree === deg ? theme.colors.secondary : theme.colors.border,
                  },
                ]}
                onPress={() => setDegree(deg)}
              >
                <Text style={[
                  styles.degreeChipText,
                  { color: degree === deg ? theme.colors.textWhite : theme.colors.text }
                ]}>
                  {deg}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Input
            label="University/Institution"
            placeholder="Enter your university or institution name"
            value={university}
            onChangeText={setUniversity}
            leftIcon="school"
            required
          />
          
          <View style={styles.statusRow}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Status
            </Text>
            <View style={styles.statusContainer}>
              {renderStatusOption('completed', 'Completed')}
              {renderStatusOption('pursuing', 'Pursuing')}
            </View>
          </View>
          
          <Input
            label="Year of Completion"
            placeholder="YYYY"
            value={yearOfCompletion}
            onChangeText={setYearOfCompletion}
            leftIcon="calendar-today"
            keyboardType="numeric"
            maxLength={4}
            required
          />
        </Card>
      </Animated.View>

      {/* Certifications */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.certificationsHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Certifications (Optional)
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Add any relevant certifications
          </Text>
        </View>
        
        {certifications.map(renderCertificationForm)}
        
        <TouchableOpacity
          style={[styles.addCertificationButton, { borderColor: theme.colors.primary }]}
          onPress={addCertification}
        >
          <Text style={[styles.addCertificationText, { color: theme.colors.primary }]}>
            + Add Another Certification
          </Text>
        </TouchableOpacity>
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
          title="Continue to Teaching Details"
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
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  qualificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  qualificationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  qualificationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  degreesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  degreeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  degreeChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusRow: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  certificationsHeader: {
    marginBottom: 16,
  },
  certificationCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  certificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  certificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addCertificationButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addCertificationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

export default Step2EducationScreen;
