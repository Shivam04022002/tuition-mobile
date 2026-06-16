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

interface VerificationDocuments {
  aadhaarCard: string;
  panCard: string;
  qualificationDocuments: string[];
  introVideo: string;
  portfolioPhotos: string[];
}

interface CompleteTeacherProfile {
  pricingData: PricingData;
  verificationDocuments: VerificationDocuments;
}

type RootStackParamList = {
  TeacherDashboard: { profileData: CompleteTeacherProfile };
};

type Step6RouteProp = RouteProp<
  { Step6VerificationUpload: { pricingData: PricingData } },
  'Step6VerificationUpload'
>;

type Step6NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TeacherDashboard'>;

const Step6VerificationUploadScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<Step6RouteProp>();
  const navigation = useNavigation<Step6NavigationProp>();
  
  const { pricingData } = route.params;
  
  const [aadhaarCard, setAadhaarCard] = useState('');
  const [panCard, setPanCard] = useState('');
  const [qualificationDocuments, setQualificationDocuments] = useState<string[]>([]);
  const [introVideo, setIntroVideo] = useState('');
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);
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

  const handleDocumentUpload = (type: string) => {
    Alert.alert(
      'Upload Document',
      `Choose ${type} source`,
      [
        { text: 'Camera', onPress: () => console.log(`Open camera for ${type}`) },
        { text: 'Gallery', onPress: () => console.log(`Open gallery for ${type}`) },
        { text: 'Files', onPress: () => console.log(`Open files for ${type}`) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleVideoUpload = () => {
    Alert.alert(
      'Upload Intro Video',
      'Record or upload your introduction video',
      [
        { text: 'Record Video', onPress: () => console.log('Record video') },
        { text: 'Upload Video', onPress: () => console.log('Upload video') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const addPortfolioPhoto = () => {
    Alert.alert(
      'Add Portfolio Photo',
      'Choose photo source',
      [
        { text: 'Camera', onPress: () => console.log('Take photo') },
        { text: 'Gallery', onPress: () => console.log('Choose from gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removePortfolioPhoto = (index: number) => {
    setPortfolioPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const addQualificationDocument = () => {
    Alert.alert(
      'Add Qualification Document',
      'Choose document source',
      [
        { text: 'Camera', onPress: () => console.log('Take photo') },
        { text: 'Gallery', onPress: () => console.log('Choose from gallery') },
        { text: 'Files', onPress: () => console.log('Choose file') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeQualificationDocument = (index: number) => {
    setQualificationDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!aadhaarCard) {
      Alert.alert('Validation Error', 'Please upload your Aadhaar card');
      return false;
    }
    if (!panCard) {
      Alert.alert('Validation Error', 'Please upload your PAN card');
      return false;
    }
    if (qualificationDocuments.length === 0) {
      Alert.alert('Validation Error', 'Please upload at least one qualification document');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const verificationDocuments: VerificationDocuments = {
        aadhaarCard,
        panCard,
        qualificationDocuments,
        introVideo,
        portfolioPhotos,
      };

      const profileData: CompleteTeacherProfile = {
        pricingData,
        verificationDocuments,
      };

      Alert.alert(
        'Profile Submitted!',
        'Your teacher profile has been submitted for verification. You will receive a notification within 24-48 hours.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('TeacherDashboard', { profileData }),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDocumentUploadCard = (
    title: string,
    subtitle: string,
    document: string,
    onUpload: () => void,
    icon: string
  ) => (
    <Card variant="outlined" margin="small" style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <Text style={styles.documentIcon}>{icon}</Text>
        <View style={styles.documentInfo}>
          <Text style={[styles.documentTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.documentSubtitle, { color: theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        </View>
      </View>
      
      {document ? (
        <View style={styles.uploadedDocument}>
          <Text style={[styles.uploadedText, { color: theme.colors.success }]}>
            ✓ Document Uploaded
          </Text>
          <TouchableOpacity onPress={onUpload}>
            <Text style={[styles.changeText, { color: theme.colors.primary }]}>
              Change Document
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={onUpload}
        >
          <Text style={styles.uploadIcon}>📄</Text>
          <Text style={[styles.uploadText, { color: theme.colors.textSecondary }]}>
            Upload Document
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  const renderQualificationDocument = (doc: string, index: number) => (
    <View key={index} style={styles.qualificationItem}>
      <Text style={styles.qualificationIcon}>📜</Text>
      <Text style={[styles.qualificationName, { color: theme.colors.text }]}>
        Qualification Document {index + 1}
      </Text>
      <TouchableOpacity onPress={() => removeQualificationDocument(index)}>
        <Text style={[styles.removeText, { color: theme.colors.error }]}>
          Remove
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPortfolioPhoto = (photo: string, index: number) => (
    <View key={index} style={styles.photoContainer}>
      <Image source={{ uri: photo }} style={styles.portfolioPhoto} />
      <TouchableOpacity
        style={styles.removePhotoButton}
        onPress={() => removePortfolioPhoto(index)}
      >
        <Text style={[styles.removePhotoText, { color: theme.colors.textWhite }]}>
          ✕
        </Text>
      </TouchableOpacity>
    </View>
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
            width: '100%', 
            backgroundColor: theme.colors.primary 
          }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          Step 6 of 6 - Verification Upload
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
          Verify Your Identity
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Upload documents for verification and build trust with parents
        </Text>
      </Animated.View>

      {/* Identity Documents */}
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
          Identity Documents
        </Text>
        
        {renderDocumentUploadCard(
          'Aadhaar Card',
          'Upload your Aadhaar card for identity verification',
          aadhaarCard,
          () => handleDocumentUpload('Aadhaar'),
          '🆔'
        )}
        
        {renderDocumentUploadCard(
          'PAN Card',
          'Upload your PAN card for verification',
          panCard,
          () => handleDocumentUpload('PAN'),
          '📋'
        )}
      </Animated.View>

      {/* Qualification Documents */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Qualification Documents
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Upload your educational qualifications
          </Text>
        </View>
        
        <Card variant="outlined" margin="small">
          {qualificationDocuments.map(renderQualificationDocument)}
          
          <TouchableOpacity
            style={[styles.addDocumentButton, { borderColor: theme.colors.primary }]}
            onPress={addQualificationDocument}
          >
            <Text style={[styles.addDocumentText, { color: theme.colors.primary }]}>
              + Add Qualification Document
            </Text>
          </TouchableOpacity>
        </Card>
      </Animated.View>

      {/* Intro Video */}
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
          Introduction Video (Optional)
        </Text>
        <Card variant="outlined" margin="small">
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Record a short video introducing yourself and your teaching style
          </Text>
          
          {introVideo ? (
            <View style={[styles.videoUploaded, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Text style={styles.videoIcon}>🎥</Text>
              <Text style={[styles.videoUploadedText, { color: theme.colors.success }]}>
                ✓ Video Uploaded
              </Text>
              <TouchableOpacity onPress={handleVideoUpload}>
                <Text style={[styles.changeText, { color: theme.colors.primary }]}>
                  Change Video
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.videoUploadButton, { backgroundColor: theme.colors.backgroundSecondary }]}
              onPress={handleVideoUpload}
            >
              <Text style={styles.videoIcon}>🎥</Text>
              <Text style={[styles.videoUploadText, { color: theme.colors.textSecondary }]}>
                Record or Upload Video
              </Text>
            </TouchableOpacity>
          )}
        </Card>
      </Animated.View>

      {/* Portfolio Photos */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Portfolio Photos (Optional)
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Add photos of your teaching setup, certificates, or classroom
          </Text>
        </View>
        
        <Card variant="outlined" margin="small">
          <View style={styles.portfolioGrid}>
            {portfolioPhotos.map(renderPortfolioPhoto)}
            
            {portfolioPhotos.length < 6 && (
              <TouchableOpacity
                style={[styles.addPhotoButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                onPress={addPortfolioPhoto}
              >
                <Text style={styles.addPhotoIcon}>📷</Text>
                <Text style={[styles.addPhotoText, { color: theme.colors.textSecondary }]}>
                  Add Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </Animated.View>

      {/* Verification Notice */}
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
            🔒 Verification Process
          </Text>
          <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
            • All documents are securely encrypted and stored
          </Text>
          <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
            • Verification typically takes 24-48 hours
          </Text>
          <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
            • You'll receive notifications about verification status
          </Text>
          <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
            • Verified tutors get priority in search results
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
          title={isSubmitting ? 'Submitting...' : 'Submit Profile for Verification'}
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
  sectionHeader: {
    marginBottom: 16,
  },
  documentCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  documentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  documentSubtitle: {
    fontSize: 14,
  },
  uploadedDocument: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  uploadedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  uploadIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
  },
  qualificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  qualificationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  qualificationName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  removeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addDocumentButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addDocumentText: {
    fontSize: 16,
    fontWeight: '600',
  },
  videoUploaded: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  videoIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  videoUploadedText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  videoUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  videoUploadText: {
    fontSize: 14,
    fontWeight: '500',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  photoContainer: {
    position: 'relative',
    width: (100 - 8),
    height: 100,
  },
  portfolioPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: (100 - 8),
    height: 100,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  addPhotoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
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
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

export default Step6VerificationUploadScreen;
