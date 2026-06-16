import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../../redux/store';
import { setUser, setToken, setLoading, setError } from '../../redux/slices/authSlice';
import { setRole } from '../../redux/slices/userSlice';
import { useTheme } from '../../theme';
import { signup } from '../../services/authApi';

type AuthStackParamList = {
  Login: undefined;
  RoleSelection: undefined;
  Signup: { role: 'parent' | 'teacher' };
  TeacherRegistration: undefined;
  ParentRegistration: undefined;
};

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;
type SignupRouteProp = RouteProp<AuthStackParamList, 'Signup'>;

type UserRole = 'parent' | 'teacher';

const SignupScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SignupRouteProp>();
  const dispatch = useAppDispatch();

  // Get role from navigation params
  const selectedRole = route.params?.role || 'parent';

  // Form state
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validation
  const validateDetailsStep = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    // Full Name: Required, minimum 3 characters
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters';
    }

    // Mobile: Required, exactly 10 digits
    const mobileDigits = mobileNumber.replace(/\D/g, '');
    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (mobileDigits.length !== 10) {
      newErrors.mobileNumber = 'Mobile number must be exactly 10 digits';
    }

    // Email: Required, valid format
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password: Required, minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/(?=.*[@$!%*?&])/.test(password)) {
      newErrors.password = 'Password must contain at least one special character (@$!%*?&)';
    }

    // Confirm Password: Must match
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms: Required
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, mobileNumber, email, password, confirmPassword, agreeToTerms]);

  // Signup Handler
  const handleSignup = useCallback(async () => {
    if (!validateDetailsStep()) return;
    if (!selectedRole) return;

    setIsLoading(true);
    dispatch(setLoading(true));

    try {
      const response = await signup({
        role: selectedRole,
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim(),
        password,
      });

      // Store role in Redux
      dispatch(setRole(selectedRole));

      // Store in Redux auth
      dispatch(setToken(response.token));
      dispatch(setUser({
        id: response.user.id,
        email: response.user.email,
        phoneNumber: response.user.phoneNumber,
        role: response.user.role,
        profile: response.user.profile,
        profileCompleted: response.user.profileCompleted,
        onboardingCompleted: response.user.onboardingCompleted,
      }));

      // Navigate to role-specific registration
      if (selectedRole === 'parent') {
        navigation.navigate('ParentRegistration');
      } else {
        navigation.navigate('TeacherRegistration');
      }

    } catch (error: any) {
      dispatch(setError(error.message || 'Signup failed'));
      Alert.alert('Signup Failed', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  }, [fullName, mobileNumber, email, password, selectedRole, dispatch, navigation, validateDetailsStep]);

  // Navigate to Login
  const navigateToLogin = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  // Format mobile number - only digits, max 10
  const handleMobileChange = useCallback((text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(digits);
  }, []);

  // Navigate back to Role Selection
  const navigateBackToRoleSelection = useCallback(() => {
    navigation.navigate('RoleSelection');
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="school" size={40} color="#FFFFFF" />
          </View>
          <Text style={[styles.appName, { color: theme.colors.text }]}>
            Create Your Account
          </Text>

          {/* Role Badge */}
          <View style={[
            styles.roleBadge,
            { backgroundColor: selectedRole === 'parent' ? theme.colors.primary + '20' : theme.colors.secondary + '20' }
          ]}>
            <Ionicons
              name={selectedRole === 'parent' ? 'home-outline' : 'person-outline'}
              size={16}
              color={selectedRole === 'parent' ? theme.colors.primary : theme.colors.secondary}
            />
            <Text style={[
              styles.roleBadgeText,
              { color: selectedRole === 'parent' ? theme.colors.primary : theme.colors.secondary }
            ]}>
              {selectedRole === 'parent' ? 'Parent Account' : 'Teacher Account'}
            </Text>
          </View>
        </View>

        {/* Details Form */}
        <View style={[styles.formContainer, { backgroundColor: theme.colors.card }]}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={navigateBackToRoleSelection}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            <Text style={[styles.backButtonText, { color: theme.colors.text }]}>
              Change Role
            </Text>
          </TouchableOpacity>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Full Name"
                placeholderTextColor={theme.colors.textLight}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
            {errors.fullName && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.fullName}
              </Text>
            )}

            {/* Mobile Number */}
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Mobile Number (10 digits)"
                placeholderTextColor={theme.colors.textLight}
                value={mobileNumber}
                onChangeText={handleMobileChange}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
            {errors.mobileNumber && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.mobileNumber}
              </Text>
            )}

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Email Address"
                placeholderTextColor={theme.colors.textLight}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {errors.email && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.email}
              </Text>
            )}

            {/* Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text, flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={theme.colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.password}
              </Text>
            )}

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text, flex: 1 }]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.colors.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.confirmPassword}
              </Text>
            )}

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <Ionicons
                name={agreeToTerms ? 'checkbox' : 'square-outline'}
                size={20}
                color={agreeToTerms ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
                I agree to the{' '}
                <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.terms}
              </Text>
            )}

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.signupButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={[styles.loginLink, { color: theme.colors.primary }]}>
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  formContainer: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 24,
  },
  termsText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600',
  },
  signupButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    marginRight: 4,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SignupScreen;
