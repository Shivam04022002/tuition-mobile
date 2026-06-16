import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Keyboard,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { setUser, setToken } from '../../redux/slices/authSlice';
import { setRole, setOnboardingCompleted } from '../../redux/slices/userSlice';
import { useTheme } from '../../theme';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import MultiSelectChip from '../../components/common/MultiSelectChip';
import { apiConfig } from '../../config/api';

type AuthStackParamList = {
  RoleSelection: undefined;
  ParentRegistration: undefined;
  Login: undefined;
  ParentDashboard: undefined;
};

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// Constants
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const CLASS_OPTIONS = [
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
];

const SUBJECT_OPTIONS = [
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Hindi',
  'Social Science',
  'Computer Science',
  'Accounts',
  'Economics',
  'Business Studies',
];

const BOARD_OPTIONS = ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB'];

const TUITION_MODE_OPTIONS = ['Home Tuition', 'Online Tuition', 'Group Tuition', 'Crash Course'];

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME_SLOT_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const TIMING_OPTIONS = ['Morning', 'Afternoon', 'Evening'];

const BUDGET_OPTIONS = [
  '₹1000 - ₹2000',
  '₹2000 - ₹5000',
  '₹5000 - ₹10000',
  '₹10000+',
  'Custom Budget',
];

interface FormData {
  // Account Details
  parentName: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Student Details
  studentName: string;
  gender: string;
  age: string;
  className: string;
  schoolName: string;
  // Tuition Requirement
  subjects: string[];
  board: string;
  tuitionMode: string;
  preferredTiming: string;
  // Location
  address: string;
  city: string;
  pincode: string;
  // Budget
  budget: string;
  customBudget: string;
  tutorPreferences: string;
}

interface FormErrors {
  parentName?: string;
  mobileNumber?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  studentName?: string;
  gender?: string;
  age?: string;
  className?: string;
  schoolName?: string;
  subjects?: string;
  board?: string;
  tuitionMode?: string;
  preferredTiming?: string;
  address?: string;
  city?: string;
  pincode?: string;
  budget?: string;
  customBudget?: string;
  terms?: string;
}

const ParentRegistrationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<FormData>({
    // Account Details
    parentName: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Student Details
    studentName: '',
    gender: '',
    age: '',
    className: '',
    schoolName: '',
    // Tuition Requirement
    subjects: [],
    board: '',
    tuitionMode: '',
    preferredTiming: '',
    // Location
    address: '',
    city: '',
    pincode: '',
    // Budget
    budget: '',
    customBudget: '',
    tutorPreferences: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Class selection modal state
  const [showClassModal, setShowClassModal] = useState(false);
  const [classSearchQuery, setClassSearchQuery] = useState('');
  
  // Filtered classes based on search
  const filteredClasses = useMemo(() => {
    if (!classSearchQuery.trim()) return CLASS_OPTIONS;
    const query = classSearchQuery.toLowerCase();
    return CLASS_OPTIONS.filter(cls => cls.toLowerCase().includes(query));
  }, [classSearchQuery]);

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.parentName.trim()) {
      newErrors.parentName = 'Parent name is required';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (formData.mobileNumber.length !== 10 || !/^\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile number must be 10 digits';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

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

    if (!formData.studentName.trim()) {
      newErrors.studentName = 'Student name is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select gender';
    }

    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(Number(formData.age)) || Number(formData.age) < 3 || Number(formData.age) > 25) {
      newErrors.age = 'Please enter a valid age (3-25)';
    }

    if (!formData.className) {
      newErrors.className = 'Please select class';
    }

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = 'School name is required';
    }

    if (formData.subjects.length === 0) {
      newErrors.subjects = 'Please select at least one subject';
    }

    if (!formData.board) {
      newErrors.board = 'Please select board';
    }

    if (!formData.tuitionMode) {
      newErrors.tuitionMode = 'Please select mode of tuition';
    }

    if (!formData.preferredTiming) {
      newErrors.preferredTiming = 'Please select preferred timing';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (formData.pincode.length !== 6 || !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    if (!formData.budget) {
      newErrors.budget = 'Please select budget';
    }

    if (formData.budget === 'Custom Budget' && !formData.customBudget.trim()) {
      newErrors.customBudget = 'Please enter custom budget amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Check for duplicate account before registration
  const checkDuplicateAccount = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${apiConfig.baseURL}/auth/check-duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          mobileNumber: formData.mobileNumber,
        }),
      });

      const result = await response.json();
      
      if (result.exists) {
        Alert.alert(
          'Account Already Exists',
          'This account already exists. Please login instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Login', 
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Duplicate check error:', error);
      return false;
    }
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

    // Check for duplicate account
    const isDuplicate = await checkDuplicateAccount();
    if (isDuplicate) return;

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      // Parse budget to get min/max amounts
      let minAmount = 0;
      let maxAmount = 0;
      
      if (formData.budget === 'Custom Budget' && formData.customBudget) {
        minAmount = 0;
        maxAmount = parseInt(formData.customBudget, 10) || 0;
      } else {
        const budgetMap: { [key: string]: { min: number; max: number } } = {
          '₹1000 - ₹2000': { min: 1000, max: 2000 },
          '₹2000 - ₹5000': { min: 2000, max: 5000 },
          '₹5000 - ₹10000': { min: 5000, max: 10000 },
          '₹10000+': { min: 10000, max: 50000 },
        };
        const budget = budgetMap[formData.budget] || { min: 0, max: 0 };
        minAmount = budget.min;
        maxAmount = budget.max;
      }

      // Map tuition mode to backend enum
      const tuitionTypeMap: { [key: string]: string } = {
        'Home Tuition': 'home',
        'Online Tuition': 'online',
        'Group Tuition': 'group',
        'Crash Course': 'crash',
      };
      
      // Create complete registration payload
      const registrationData = {
        // Account Details
        role: 'parent',
        fullName: formData.parentName,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        password: formData.password,
        // Parent Profile Details
        parentDetails: {
          parentName: formData.parentName,
          mobileNumber: formData.mobileNumber,
          email: formData.email,
        },
        studentDetails: {
          studentName: formData.studentName,
          gender: formData.gender.toLowerCase(),
          age: formData.age,
          grade: formData.className,
          board: formData.board,
          schoolName: formData.schoolName,
        },
        tuitionRequirement: {
          subjects: formData.subjects,
          board: formData.board,
          tuitionMode: formData.tuitionMode,
          preferredTiming: formData.preferredTiming,
          tuitionType: tuitionTypeMap[formData.tuitionMode] || 'home',
        },
        locationDetails: {
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          latitude: 26.4600,
          longitude: 80.3500,
          teachingRadius: 5,
        },
        budgetDetails: {
          budget: formData.budget,
          customBudget: formData.customBudget,
          minAmount,
          maxAmount,
        },
        scheduleDetails: {
          startDate: new Date().toISOString().split('T')[0],
          daysPerWeek: '3',
          preferredTimings: [formData.preferredTiming],
        },
        tutorPreferences: formData.tutorPreferences,
      };

      console.log('=== PARENT REGISTRATION PAYLOAD ===');
      console.log(JSON.stringify(registrationData, null, 2));
      console.log('=== END PAYLOAD ===');

      // API Call - Complete Registration
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
          profileCompleted: true,
          onboardingCompleted: true,
        }));
        dispatch(setRole('parent'));
        dispatch(setOnboardingCompleted(true));

        // Show success toast
        Alert.alert(
          'Registration Successful!',
          'Welcome to Tuition App. Your account has been created successfully.',
          [
            {
              text: 'Go to Dashboard',
              onPress: () => {
                // Reset navigation stack and go to Parent Dashboard
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'ParentDashboard' }],
                  })
                );
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

  // Class selection handlers
  const openClassModal = () => {
    setClassSearchQuery('');
    setShowClassModal(true);
  };

  const closeClassModal = () => {
    setShowClassModal(false);
    setClassSearchQuery('');
  };

  const selectClass = (cls: string) => {
    updateField('className', cls);
    closeClassModal();
  };

  const renderClassItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.classItem,
        { 
          backgroundColor: formData.className === item 
            ? theme.colors.primary + '20' 
            : theme.colors.backgroundSecondary,
          borderColor: formData.className === item 
            ? theme.colors.primary 
            : theme.colors.border,
        },
      ]}
      onPress={() => selectClass(item)}
    >
      <Text
        style={[
          styles.classItemText,
          { 
            color: formData.className === item 
              ? theme.colors.primary 
              : theme.colors.text,
            fontWeight: formData.className === item ? '600' : '400',
          },
        ]}
      >
        {item}
      </Text>
      {formData.className === item && (
        <Text style={[styles.classCheckmark, { color: theme.colors.primary }]}>✓</Text>
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string, step: number) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.stepIndicator, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.stepNumber, { color: theme.colors.textWhite }]}>{step}</Text>
      </View>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Parent Registration</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Find the perfect tutor for your child
          </Text>
        </View>

        {/* Section 1: Parent Details */}
        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Parent Details', 1)}
          <Input
            label="Parent Name"
            placeholder="Enter parent's full name"
            value={formData.parentName}
            onChangeText={(text) => updateField('parentName', text)}
            error={errors.parentName}
            required
          />
          <Input
            label="Mobile Number"
            placeholder="Enter 10 digit mobile number"
            value={formData.mobileNumber}
            onChangeText={(text) => updateField('mobileNumber', text.replace(/[^0-9]/g, ''))}
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.mobileNumber}
            required
          />
          <Input
            label="Email ID"
            placeholder="Enter your email address"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            required
          />
          <Input
            label="Password"
            placeholder="Create a password (min 8 chars)"
            value={formData.password}
            onChangeText={(text) => updateField('password', text)}
            secureTextEntry
            error={errors.password}
            required
          />
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChangeText={(text) => updateField('confirmPassword', text)}
            secureTextEntry
            error={errors.confirmPassword}
            required
          />
        </Card>

        {/* Section 2: Student Details */}
        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Student Details', 2)}
          <Input
            label="Student Name"
            placeholder="Enter student's full name"
            value={formData.studentName}
            onChangeText={(text) => updateField('studentName', text)}
            error={errors.studentName}
            required
          />
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
            Gender <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <MultiSelectChip
            options={GENDER_OPTIONS}
            selected={[formData.gender]}
            onSelect={(selected) => updateField('gender', selected[0] || '')}
            multiple={false}
          />
          {errors.gender && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.gender}</Text>}

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Input
                label="Age"
                placeholder="Age"
                value={formData.age}
                onChangeText={(text) => updateField('age', text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={2}
                error={errors.age}
                required
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text, marginBottom: 8 }]}>
                Class <Text style={{ color: theme.colors.error }}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.classSelector,
                  { 
                    backgroundColor: theme.colors.backgroundSecondary, 
                    borderColor: errors.className ? theme.colors.error : theme.colors.border,
                  },
                ]}
                onPress={openClassModal}
                activeOpacity={0.7}
              >
                <Text 
                  style={{ 
                    color: formData.className ? theme.colors.text : theme.colors.textLight,
                    fontSize: 14,
                  }}
                  numberOfLines={1}
                >
                  {formData.className || 'Search Class...'}
                </Text>
                <Text style={styles.searchIcon}>🔍</Text>
              </TouchableOpacity>
              {errors.className && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.className}</Text>}
            </View>
          </View>

          <Input
            label="School Name"
            placeholder="Enter school name"
            value={formData.schoolName}
            onChangeText={(text) => updateField('schoolName', text)}
            error={errors.schoolName}
            required
          />
        </Card>

        {/* Section 3: Tuition Requirement */}
        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Tuition Requirement', 3)}
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
            Subjects Needed <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <MultiSelectChip
            options={SUBJECT_OPTIONS}
            selected={formData.subjects}
            onSelect={(selected) => updateField('subjects', selected)}
          />
          {errors.subjects && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.subjects}</Text>}

          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
            Board <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <MultiSelectChip
            options={BOARD_OPTIONS}
            selected={[formData.board]}
            onSelect={(selected) => updateField('board', selected[0] || '')}
            multiple={false}
          />
          {errors.board && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.board}</Text>}

          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
            Mode of Tuition <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <MultiSelectChip
            options={TUITION_MODE_OPTIONS}
            selected={[formData.tuitionMode]}
            onSelect={(selected) => updateField('tuitionMode', selected[0] || '')}
            multiple={false}
          />
          {errors.tuitionMode && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.tuitionMode}</Text>}
        </Card>

        {/* Section 4: Preferred Timing */}
        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Preferred Timing', 4)}
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
            Preferred Timing <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <MultiSelectChip
            options={TIMING_OPTIONS}
            selected={[formData.preferredTiming]}
            onSelect={(selected) => updateField('preferredTiming', selected[0] || '')}
            multiple={false}
          />
          {errors.preferredTiming && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.preferredTiming}</Text>}
        </Card>

        {/* Section 5: Location */}
        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Location', 5)}
          <Input
            label="Address"
            placeholder="Enter your full address"
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
            multiline
            numberOfLines={3}
            error={errors.address}
            required
          />
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Input
                label="City"
                placeholder="City"
                value={formData.city}
                onChangeText={(text) => updateField('city', text)}
                error={errors.city}
                required
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Pincode"
                placeholder="6 digits"
                value={formData.pincode}
                onChangeText={(text) => updateField('pincode', text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={6}
                error={errors.pincode}
                required
              />
            </View>
          </View>
        </Card>

        {/* Section 6: Budget */}
        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Budget', 6)}
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
            Budget <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <MultiSelectChip
            options={BUDGET_OPTIONS}
            selected={[formData.budget]}
            onSelect={(selected) => updateField('budget', selected[0] || '')}
            multiple={false}
          />
          {errors.budget && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.budget}</Text>}

          {formData.budget === 'Custom Budget' && (
            <Input
              label="Custom Budget Amount"
              placeholder="Enter your budget in ₹"
              value={formData.customBudget}
              onChangeText={(text) => updateField('customBudget', text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              error={errors.customBudget}
              required
            />
          )}
        </Card>

        {/* Section 7: Tutor Preferences */}
        <Card variant="elevated" margin="small" style={styles.card}>
          {renderSectionHeader('Tutor Preferences (Optional)', 7)}
          <Input
            label="Any Tutor Preferences"
            placeholder="E.g., Female Tutor, Experienced Teacher, CBSE Specialist, etc."
            value={formData.tutorPreferences}
            onChangeText={(text) => updateField('tutorPreferences', text)}
            multiline
            numberOfLines={3}
          />
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

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title={isSubmitting ? 'Creating Account...' : 'Create Account & Post Requirement'}
            onPress={handleSubmit}
            disabled={isSubmitting}
            variant="primary"
            size="large"
          />
          {isSubmitting && (
            <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
          )}
        </View>
      </ScrollView>

      {/* Class Selection Modal */}
      <Modal
        visible={showClassModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeClassModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select Class
              </Text>
              <TouchableOpacity onPress={closeClassModal}>
                <Text style={styles.modalCloseButton}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { borderColor: theme.colors.border }]}>
              <Text style={styles.searchIconModal}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search Class..."
                placeholderTextColor="#9CA3AF"
                value={classSearchQuery}
                onChangeText={setClassSearchQuery}
                autoFocus={true}
              />
              {classSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setClassSearchQuery('')}>
                  <Text style={styles.clearButton}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Class List */}
            <FlatList
              data={filteredClasses}
              renderItem={renderClassItem}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.classList}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={(
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No classes found for "{classSearchQuery}"
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  dropdown: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  submitContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  loader: {
    marginTop: 16,
  },
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
  classSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  // Class Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#6B7280',
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#111827',
  },
  searchIconModal: {
    fontSize: 18,
  },
  clearButton: {
    fontSize: 18,
    color: '#9CA3AF',
    padding: 4,
  },
  classList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  classItemText: {
    fontSize: 16,
  },
  classCheckmark: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default ParentRegistrationScreen;
