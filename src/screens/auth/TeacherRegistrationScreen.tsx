import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../../redux/store';
import { setUser, setToken } from '../../redux/slices/authSlice';
import { setRole } from '../../redux/slices/userSlice';
import { useTheme } from '../../theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import MultiSelectChip from '../../components/common/MultiSelectChip';
import DateOfBirthPicker from '../../components/common/DateOfBirthPicker';
import { apiConfig } from '../../config/api';

type AuthStackParamList = {
  RoleSelection: undefined;
  TeacherRegistration: undefined;
  TeacherDashboard: undefined;
  Login: undefined;
};

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

interface TeacherFormData {
  // Account Details
  fullName: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Personal Details
  gender: string;
  address: string;
  city: string;
  pincode: string;
  dob: string;
  profilePicture: string | null;
  // Education & Professional
  qualification: string;
  collegeUniversity: string;
  certificates: string[];
  bio: string;
  teachingExperience: string;
  // Teaching Details
  subjects: string[];
  classes: string[];
  boards: string[];
  teachingMode: string;
  // Availability
  availableDays: string[];
  availableTimeSlots: string[];
  preferredLocations: string[];
  pricing: string;
  customPricing: string;
  // Verification
  aadhaarDocument: string | null;
}

interface FormErrors { [key: string]: string; }

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const EXPERIENCE_OPTIONS = ['Fresher', '0-1 Years', '1-3 Years', '3-5 Years', '5-10 Years', '10+ Years'];
const SUBJECT_OPTIONS = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Science', 'Computer Science', 'Accounts', 'Economics', 'Business Studies'];
const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', 'Class 1-5', 'Class 6-8', 'Class 9-10', 'Class 11-12', 'Graduation', 'Competitive Exams'];
const BOARD_OPTIONS = ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB'];
const TEACHING_MODE_OPTIONS = ['Home Tuition', 'Online Tuition', 'Group Tuition'];
const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOT_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const PRICING_OPTIONS = ['₹1000-₹2000', '₹2000-₹5000', '₹5000-₹10000', '₹10000+', 'Custom Amount'];

const TeacherRegistrationScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [newLocation, setNewLocation] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const [formData, setFormData] = useState<TeacherFormData>({
    // Account Details
    fullName: '', mobileNumber: '', email: '', password: '', confirmPassword: '',
    // Personal Details
    gender: '', address: '', city: '', pincode: '', dob: '', profilePicture: null,
    // Education & Professional
    qualification: '', collegeUniversity: '', certificates: [], bio: '', teachingExperience: '',
    // Teaching Details
    subjects: [], classes: [], boards: [], teachingMode: '',
    // Availability
    availableDays: [], availableTimeSlots: [], preferredLocations: [], pricing: '', customPricing: '',
    // Verification
    aadhaarDocument: null,
  });

  const updateField = useCallback(<K extends keyof TeacherFormData>(field: K, value: TeacherFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const newErrors = { ...prev }; delete newErrors[field]; return newErrors; });
    }
  }, [errors]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile number is required';
    else if (!/^\d{10}$/.test(formData.mobileNumber)) newErrors.mobileNumber = 'Mobile number must be 10 digits';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character (@$!%*?&)';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Pincode must be 6 digits';
    if (formData.dob && !/^\d{4}-\d{2}-\d{2}$/.test(formData.dob)) newErrors.dob = 'Please select a complete, valid date of birth';
    if (!formData.qualification.trim()) newErrors.qualification = 'Qualification is required';
    if (!formData.bio.trim()) newErrors.bio = 'Bio is required';
    if (!formData.teachingExperience) newErrors.teachingExperience = 'Teaching experience is required';
    if (formData.subjects.length === 0) newErrors.subjects = 'At least one subject is required';
    if (formData.classes.length === 0) newErrors.classes = 'At least one class is required';
    if (formData.boards.length === 0) newErrors.boards = 'At least one board is required';
    if (!formData.teachingMode) newErrors.teachingMode = 'Please select teaching mode';
    if (formData.availableDays.length === 0) newErrors.availableDays = 'At least one day is required';
    if (formData.availableTimeSlots.length === 0) newErrors.availableTimeSlots = 'At least one time slot is required';
    if (formData.preferredLocations.length === 0) newErrors.preferredLocations = 'At least one preferred location is required';
    if (!formData.pricing) newErrors.pricing = 'Pricing is required';
    if (formData.pricing === 'Custom Amount' && !formData.customPricing.trim()) newErrors.customPricing = 'Please enter custom pricing amount';
    if (!formData.aadhaarDocument) newErrors.aadhaarDocument = 'Aadhaar document is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      if (!formData.preferredLocations.includes(newLocation.trim())) {
        updateField('preferredLocations', [...formData.preferredLocations, newLocation.trim()]);
      }
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    updateField('preferredLocations', formData.preferredLocations.filter((loc) => loc !== location));
  };

  const handleImagePick = (type: 'profile' | 'aadhaar') => {
    Alert.alert('Select Image', 'Choose image source', [
      { 
        text: 'Camera', 
        onPress: () => { 
          // TODO: Replace with actual expo-image-picker implementation
          // Example:
          // const result = await ImagePicker.launchCameraAsync({
          //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
          //   allowsEditing: true,
          //   aspect: [1, 1],
          //   quality: 0.8,
          // });
          // if (!result.canceled) {
          //   const uri = result.assets[0].uri;
          //   if (type === 'profile') updateField('profilePicture', uri);
          //   else updateField('aadhaarDocument', uri);
          // }
          
          // Mock implementation for now
          const mockUri = type === 'profile' 
            ? 'file://mock/profile_picture.jpg' 
            : 'file://mock/aadhaar_document.jpg';
          if (type === 'profile') updateField('profilePicture', mockUri);
          else updateField('aadhaarDocument', mockUri);
        } 
      },
      { 
        text: 'Gallery', 
        onPress: () => { 
          // TODO: Replace with actual expo-image-picker implementation
          // const result = await ImagePicker.launchImageLibraryAsync({
          //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
          //   allowsEditing: true,
          //   aspect: [1, 1],
          //   quality: 0.8,
          // });
          
          const mockUri = type === 'profile' 
            ? 'file://mock/gallery_profile.jpg' 
            : 'file://mock/gallery_aadhaar.jpg';
          if (type === 'profile') updateField('profilePicture', mockUri);
          else updateField('aadhaarDocument', mockUri);
        } 
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDocumentPick = () => {
    Alert.alert('Upload Certificate', 'Select a document (PDF, JPG, JPEG, PNG)', [
      { 
        text: 'Select File', 
        onPress: () => {
          // TODO: Replace with actual expo-document-picker implementation
          // Example:
          // const result = await DocumentPicker.getDocumentAsync({
          //   type: ['application/pdf', 'image/*'],
          //   copyToCacheDirectory: true,
          // });
          // if (result.type === 'success') {
          //   updateField('certificates', [...formData.certificates, result.uri]);
          // }
          
          // Mock implementation for now
          const mockUri = `file://mock/certificate_${formData.certificates.length + 1}.pdf`;
          updateField('certificates', [...formData.certificates, mockUri]);
        } 
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create complete registration payload
      const registrationData = {
        // Account Details
        role: 'teacher',
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        password: formData.password,
        // Profile Data
        personalDetails: {
          fullName: formData.fullName,
          mobileNumber: formData.mobileNumber,
          email: formData.email,
          gender: formData.gender,
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          dob: formData.dob,
        },
        educationDetails: {
          qualification: formData.qualification,
          collegeUniversity: formData.collegeUniversity,
        },
        professionalDetails: {
          bio: formData.bio,
          teachingExperience: formData.teachingExperience,
        },
        teachingDetails: {
          subjects: formData.subjects,
          classes: formData.classes,
          boards: formData.boards,
        },
        teachingMode: formData.teachingMode,
        availability: {
          days: formData.availableDays,
          timeSlots: formData.availableTimeSlots,
        },
        locationPreferences: formData.preferredLocations,
        pricingDetails: {
          pricing: formData.pricing,
          customAmount: formData.customPricing,
        },
      };

      // API Call - Complete Registration (creates User + TeacherProfile)
      const response = await fetch(`${apiConfig.baseURL}/auth/register-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Store auth data in Redux
        dispatch(setToken(result.token));
        dispatch(setUser({
          id: result.user.id,
          email: result.user.email,
          phoneNumber: result.user.phoneNumber,
          role: result.user.role,
          profile: result.user.profile,
          profileCompleted: result.user.profileCompleted,
          onboardingCompleted: result.user.onboardingCompleted,
        }));
        dispatch(setRole('teacher'));

        Alert.alert(
          'Registration Successful',
          'Your account has been created and teacher profile has been submitted for verification. You will be notified once approved.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigation will be handled by RootNavigator based on role
              },
            },
          ]
        );
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSectionHeader = (title: string, step: number) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.stepIndicator, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.stepNumber, { color: theme.colors.textWhite }]}>{step}</Text>
      </View>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Teacher Registration</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Complete your profile to start teaching</Text>
        </View>

        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Personal Details', 1)}
          <Input label="Full Name" placeholder="Enter your full name" value={formData.fullName} onChangeText={(text) => updateField('fullName', text)} error={errors.fullName} required />
          <Input label="Mobile Number" placeholder="Enter 10 digit mobile number" value={formData.mobileNumber} onChangeText={(text) => updateField('mobileNumber', text.replace(/[^0-9]/g, ''))} keyboardType="phone-pad" maxLength={10} error={errors.mobileNumber} required leftIcon="phone" />
          <Input label="Email ID" placeholder="Enter your email address" value={formData.email} onChangeText={(text) => updateField('email', text)} keyboardType="email-address" autoCapitalize="none" error={errors.email} required leftIcon="email" />
          <Input label="Password" placeholder="Create a password (min 8 chars)" value={formData.password} onChangeText={(text) => updateField('password', text)} secureTextEntry error={errors.password} required />
          <Input label="Confirm Password" placeholder="Confirm your password" value={formData.confirmPassword} onChangeText={(text) => updateField('confirmPassword', text)} secureTextEntry error={errors.confirmPassword} required />
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Gender <Text style={{ color: theme.colors.error }}>*</Text></Text>
          <MultiSelectChip options={GENDER_OPTIONS} selected={[formData.gender]} onSelect={(selected) => updateField('gender', selected[0] || '')} multiple={false} />
          {errors.gender && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.gender}</Text>}
          <Input label="Address" placeholder="Enter your full address" value={formData.address} onChangeText={(text) => updateField('address', text)} multiline numberOfLines={3} error={errors.address} required />
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Input label="City" placeholder="City" value={formData.city} onChangeText={(text) => updateField('city', text)} error={errors.city} required />
            </View>
            <View style={styles.halfInput}>
              <Input label="Pincode" placeholder="6 digits" value={formData.pincode} onChangeText={(text) => updateField('pincode', text.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={6} error={errors.pincode} required />
            </View>
          </View>
          <DateOfBirthPicker value={formData.dob} onChange={(iso) => updateField('dob', iso)} error={errors.dob} />
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Profile Picture (Optional)</Text>
          <View style={styles.imageUploadContainer}>
            {formData.profilePicture ? (
              <View style={styles.imagePreviewContainer}>
                <View style={[styles.imagePreview, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Ionicons name="person-outline" size={48} color={theme.colors.primary} />
                </View>
                <TouchableOpacity style={styles.removeImageButton} onPress={() => updateField('profilePicture', null)}>
                  <Ionicons name="close" size={16} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadButtons}>
                <TouchableOpacity style={[styles.uploadButton, { backgroundColor: theme.colors.backgroundSecondary }]} onPress={() => handleImagePick('profile')}>
                  <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
                  <Text style={[styles.uploadButtonText, { color: theme.colors.text }]}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.uploadButton, { backgroundColor: theme.colors.backgroundSecondary }]} onPress={() => handleImagePick('profile')}>
                  <Ionicons name="images-outline" size={24} color={theme.colors.primary} />
                  <Text style={[styles.uploadButtonText, { color: theme.colors.text }]}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Card>

        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Education Details', 2)}
          <Input label="Qualification" placeholder="e.g., B.Tech, M.Sc, B.Ed" value={formData.qualification} onChangeText={(text) => updateField('qualification', text)} error={errors.qualification} required />
          <Input label="College / University (Optional)" placeholder="Enter institution name" value={formData.collegeUniversity} onChangeText={(text) => updateField('collegeUniversity', text)} />
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Degree / Certificates (Optional)</Text>
          <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>Accepted: PDF, JPG, JPEG, PNG</Text>
          <Button title="Upload Certificate" variant="outline" size="small" icon="file-upload" onPress={handleDocumentPick} style={styles.uploadDocButton} />
          {formData.certificates.length > 0 && (
            <View style={styles.fileList}>
              {formData.certificates.map((cert, index) => (
                <View key={index} style={[styles.fileItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Ionicons name="document-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.fileName, { color: theme.colors.text }]}>Certificate {index + 1}</Text>
                  <TouchableOpacity onPress={() => { const newCerts = [...formData.certificates]; newCerts.splice(index, 1); updateField('certificates', newCerts); }}>
                    <Ionicons name="close" size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Professional Details', 3)}
          <Input label="Short Bio / Introduction" placeholder="Tell us about yourself, your teaching style, and achievements..." value={formData.bio} onChangeText={(text) => updateField('bio', text)} multiline numberOfLines={4} error={errors.bio} required />
          <Text style={[styles.fieldLabel, { color: theme.colors.text, marginTop: 12 }]}>Teaching Experience <Text style={{ color: theme.colors.error }}>*</Text></Text>
          <MultiSelectChip options={EXPERIENCE_OPTIONS} selected={[formData.teachingExperience]} onSelect={(selected) => updateField('teachingExperience', selected[0] || '')} multiple={false} />
          {errors.teachingExperience && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.teachingExperience}</Text>}
        </Card>

        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Teaching Details', 4)}
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Subjects Taught <Text style={{ color: theme.colors.error }}>*</Text></Text>
          <MultiSelectChip options={SUBJECT_OPTIONS} selected={formData.subjects} onSelect={(selected) => updateField('subjects', selected)} />
          {errors.subjects && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.subjects}</Text>}
          <Text style={[styles.fieldLabel, { color: theme.colors.text, marginTop: 16 }]}>Classes Taught <Text style={{ color: theme.colors.error }}>*</Text></Text>
          <MultiSelectChip options={CLASS_OPTIONS} selected={formData.classes} onSelect={(selected) => updateField('classes', selected)} />
          {errors.classes && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.classes}</Text>}
          <Text style={[styles.fieldLabel, { color: theme.colors.text, marginTop: 16 }]}>Boards Covered <Text style={{ color: theme.colors.error }}>*</Text></Text>
          <MultiSelectChip options={BOARD_OPTIONS} selected={formData.boards} onSelect={(selected) => updateField('boards', selected)} />
          {errors.boards && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.boards}</Text>}
        </Card>

        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Teaching Mode', 5)}
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Select Teaching Mode <Text style={{ color: theme.colors.error }}>*</Text></Text>
          <MultiSelectChip options={TEACHING_MODE_OPTIONS} selected={[formData.teachingMode]} onSelect={(selected) => updateField('teachingMode', selected[0] || '')} multiple={false} />
          {errors.teachingMode && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.teachingMode}</Text>}
        </Card>

        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Availability', 6)}
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Available Days <Text style={{ color: theme.colors.error }}>*</Text></Text>
          <MultiSelectChip options={DAY_OPTIONS} selected={formData.availableDays} onSelect={(selected) => updateField('availableDays', selected)} />
          {errors.availableDays && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.availableDays}</Text>}
          <Text style={[styles.fieldLabel, { color: theme.colors.text, marginTop: 16 }]}>Available Time Slots <Text style={{ color: theme.colors.error }}>*</Text></Text>
          <MultiSelectChip options={TIME_SLOT_OPTIONS} selected={formData.availableTimeSlots} onSelect={(selected) => updateField('availableTimeSlots', selected)} />
          {errors.availableTimeSlots && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.availableTimeSlots}</Text>}
        </Card>

        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Location Preferences', 7)}
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Preferred Locations <Text style={{ color: theme.colors.error }}>*</Text></Text>
          <View style={styles.locationInputContainer}>
            <View style={styles.locationInput}>
              <Input placeholder="e.g., Sector 15, Civil Lines..." value={newLocation} onChangeText={setNewLocation} leftIcon="location-outline" />
            </View>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={handleAddLocation}>
              <Ionicons name="add" size={24} color={theme.colors.textWhite} />
            </TouchableOpacity>
          </View>
          {errors.preferredLocations && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.preferredLocations}</Text>}
          {formData.preferredLocations.length > 0 && (
            <View style={styles.locationChips}>
              {formData.preferredLocations.map((location) => (
                <View key={location} style={[styles.locationChip, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Ionicons name="location-outline" size={14} color={theme.colors.primary} />
                  <Text style={[styles.locationChipText, { color: theme.colors.text }]}>{location}</Text>
                  <TouchableOpacity onPress={() => handleRemoveLocation(location)}>
                    <Ionicons name="close" size={14} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Pricing (Per Month)', 8)}
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Select Pricing Range <Text style={{ color: theme.colors.error }}>*</Text></Text>
          <MultiSelectChip options={PRICING_OPTIONS} selected={[formData.pricing]} onSelect={(selected) => updateField('pricing', selected[0] || '')} multiple={false} />
          {errors.pricing && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.pricing}</Text>}
          {formData.pricing === 'Custom Amount' && (
            <Input label="Enter Custom Amount (₹)" placeholder="e.g., 1500" value={formData.customPricing} onChangeText={(text) => updateField('customPricing', text.replace(/[^0-9]/g, ''))} keyboardType="numeric" error={errors.customPricing} leftIcon="currency-rupee" style={{ marginTop: 12 }} />
          )}
        </Card>

        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Identity Verification', 9)}
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Upload Aadhaar Card <Text style={{ color: theme.colors.error }}>*</Text></Text>
          <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>Aadhaar verification is mandatory for teacher registration. Accepted: PDF, JPG, JPEG, PNG</Text>
          {!formData.aadhaarDocument ? (
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={[styles.uploadButton, { backgroundColor: theme.colors.backgroundSecondary }]} onPress={() => handleImagePick('aadhaar')}>
                <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.uploadButtonText, { color: theme.colors.text }]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.uploadButton, { backgroundColor: theme.colors.backgroundSecondary }]} onPress={() => handleImagePick('aadhaar')}>
                <Ionicons name="images-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.uploadButtonText, { color: theme.colors.text }]}>Gallery</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.aadhaarPreview, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Ionicons name="shield-checkmark-outline" size={32} color={theme.colors.primary} />
              <Text style={[styles.aadhaarText, { color: theme.colors.text }]}>Aadhaar Uploaded</Text>
              <TouchableOpacity style={styles.removeAadhaarButton} onPress={() => updateField('aadhaarDocument', null)}>
                <Text style={[styles.removeAadhaarText, { color: theme.colors.error }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          {errors.aadhaarDocument && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.aadhaarDocument}</Text>}
        </Card>

        {/* Terms and Conditions */}
        <Card variant="elevated" margin="small" style={styles.card}>
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
          >
            <View style={[styles.checkbox, { borderColor: theme.colors.border, backgroundColor: agreeToTerms ? theme.colors.primary : 'transparent' }]}>
              {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
              I agree to the{' '}
              <Text style={[styles.termsLink, { color: theme.colors.primary }]}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={[styles.termsLink, { color: theme.colors.primary }]}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {errors.terms && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.terms}</Text>}
        </Card>

        <View style={styles.disclaimerContainer}>
          <Text style={[styles.disclaimerText, { color: theme.colors.textSecondary }]}>
            By submitting this form, you agree that the information provided is accurate. We connect tutors and parents. We do not provide tutoring services or guarantee academic results.
          </Text>
        </View>

        <View style={styles.submitContainer}>
          <Button title={isSubmitting ? 'Creating Account...' : 'Create Account & Submit Profile'} variant="primary" size="large" onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting} fullWidth />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  header: { marginBottom: 24, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  headerSubtitle: { fontSize: 14, textAlign: 'center' },
  card: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  stepIndicator: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumber: { fontSize: 14, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  fieldLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 12 },
  errorText: { fontSize: 12, marginTop: 4 },
  helperText: { fontSize: 12, marginBottom: 8 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  imageUploadContainer: { marginBottom: 12 },
  imagePreviewContainer: { flexDirection: 'row', alignItems: 'center' },
  imagePreview: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  removeImageButton: { marginLeft: 12, padding: 8 },
  uploadButtons: { flexDirection: 'row', gap: 12 },
  uploadButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, gap: 8 },
  uploadButtonText: { fontSize: 14, fontWeight: '500' },
  uploadDocButton: { marginTop: 8 },
  fileList: { marginTop: 12, gap: 8 },
  fileItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, gap: 8 },
  fileName: { flex: 1, fontSize: 14 },
  locationInputContainer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  locationInput: { flex: 1 },
  addButton: { width: 48, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  locationChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  locationChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  locationChipText: { fontSize: 13, fontWeight: '500' },
  aadhaarPreview: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 8, gap: 12 },
  aadhaarText: { flex: 1, fontSize: 14, fontWeight: '500' },
  removeAadhaarButton: { padding: 8 },
  removeAadhaarText: { fontSize: 13, fontWeight: '500' },
  disclaimerContainer: { marginVertical: 16, paddingHorizontal: 8 },
  disclaimerText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600',
  },
  submitContainer: { marginVertical: 16 },
  bottomPadding: { height: 32 },
});

export default TeacherRegistrationScreen;
