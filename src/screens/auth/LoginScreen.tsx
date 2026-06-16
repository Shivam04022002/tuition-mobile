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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../../redux/store';
import { setUser, setToken, setLoading, setError } from '../../redux/slices/authSlice';
import {
  setOnboardingCompleted,
  setProfile,
  setRole as setUserRole,
} from '../../redux/slices/userSlice';
import { useTheme } from '../../theme';
import { login, sendOTP, verifyOTP } from '../../services/authApi';

type AuthStackParamList = {
  Login: undefined;
  RoleSelection: undefined;
  Signup: { role: 'parent' | 'teacher' };
  OTPVerification: { phoneNumber: string; role?: string };
  ForgotPassword: undefined;
  ParentRegistration: undefined;
  TeacherRegistration: undefined;
};

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

type LoginTab = 'password' | 'otp';

const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  // Tab state
  const [activeTab, setActiveTab] = useState<LoginTab>('password');

  // Password login state
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // OTP login state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validation
  const validatePasswordLogin = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!emailOrMobile.trim()) {
      newErrors.emailOrMobile = 'Email or mobile number is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [emailOrMobile, password]);

  const validateOTPLogin = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (otpSent && !otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (otpSent && otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [phoneNumber, otp, otpSent]);

  // Password Login Handler
  const handlePasswordLogin = useCallback(async () => {
    if (!validatePasswordLogin()) return;

    setIsLoading(true);
    dispatch(setLoading(true));

    try {
      const response = await login({
        emailOrMobile: emailOrMobile.trim(),
        password,
      });

      console.log('[LOGIN RESPONSE]', response);
      console.log('[AUTH USER]', response.user);
      console.log('[AUTH ROLE]', response.user?.role);

      // Store in Redux — authSlice
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

      // Store in Redux — userSlice (drives RootNavigator's onboardingCompleted check)
      dispatch(setUserRole(response.user.role));
      dispatch(setProfile({
        id: response.user.id,
        firstName: response.user.profile?.firstName ?? '',
        lastName:  response.user.profile?.lastName  ?? '',
        email:     response.user.email,
        phoneNumber: response.user.phoneNumber,
        profileImage: response.user.profile?.profileImage,
      }));
      dispatch(setOnboardingCompleted(response.user.onboardingCompleted ?? true));

      console.log('AUTH_STATE', { role: response.role, onboardingCompleted: response.user.onboardingCompleted });

    } catch (error: any) {
      dispatch(setError(error.message || 'Login failed'));
      Alert.alert('Login Failed', error.message || 'Please check your credentials and try again');
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  }, [emailOrMobile, password, dispatch, validatePasswordLogin]);

  // Send OTP Handler
  const handleSendOTP = useCallback(async () => {
    if (!validateOTPLogin()) return;

    setIsLoading(true);

    try {
      await sendOTP(phoneNumber);
      setOtpSent(true);
      setCountdown(60);

      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, validateOTPLogin]);

  // Verify OTP Handler
  const handleVerifyOTP = useCallback(async () => {
    if (!validateOTPLogin()) return;

    setIsLoading(true);
    dispatch(setLoading(true));

    try {
      console.log('📱 [OTP] Sending verify request...');
      const response = await verifyOTP({
        phoneNumber,
        otp,
      });

      console.log('✅ [OTP] Verify response:', JSON.stringify(response, null, 2));
      console.log('👤 [OTP] User role:', response.user?.role);
      console.log('🔑 [OTP] Token received:', response.token ? 'Yes' : 'No');

      // Store in Redux
      console.log('💾 [OTP] Dispatching setToken...');
      dispatch(setToken(response.token));
      
      console.log('💾 [OTP] Dispatching setUser with role:', response.user.role);
      dispatch(setUser({
        id: response.user.id,
        email: response.user.email,
        phoneNumber: response.user.phoneNumber,
        role: response.user.role,
        profile: response.user.profile,
        profileCompleted: response.user.profileCompleted,
        onboardingCompleted: response.user.onboardingCompleted,
      }));

      console.log('LOGIN_SUCCESS', response);

      // Store in Redux — userSlice (drives RootNavigator's onboardingCompleted check)
      dispatch(setUserRole(response.user.role));
      dispatch(setProfile({
        id: response.user.id,
        firstName: response.user.profile?.firstName ?? '',
        lastName:  response.user.profile?.lastName  ?? '',
        email:     response.user.email,
        phoneNumber: response.user.phoneNumber,
        profileImage: response.user.profile?.profileImage,
      }));
      dispatch(setOnboardingCompleted(response.user.onboardingCompleted ?? true));

      console.log('AUTH_STATE', { role: response.user.role, onboardingCompleted: response.user.onboardingCompleted });
      console.log('ROOT_NAVIGATOR', { token: response.token, role: response.user.role });

    } catch (error: any) {
      dispatch(setError(error.message || 'OTP verification failed'));
      Alert.alert('Verification Failed', error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  }, [phoneNumber, otp, dispatch, validateOTPLogin]);

  // Navigate to Role Selection (Sign Up flow)
  const navigateToSignup = useCallback(() => {
    navigation.navigate('RoleSelection');
  }, [navigation]);

  // Navigate to Forgot Password
  const navigateToForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword');
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
        {/* Logo and Header */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="school" size={40} color="#FFFFFF" />
          </View>
          <Text style={[styles.appName, { color: theme.colors.text }]}>
            Tuition Connect
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Find the perfect tutor for your child
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'password' && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setActiveTab('password')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'password' ? '#FFFFFF' : theme.colors.text },
              ]}
            >
              Password Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'otp' && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setActiveTab('otp')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'otp' ? '#FFFFFF' : theme.colors.text },
              ]}
            >
              OTP Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Container */}
        <View style={[styles.formContainer, { backgroundColor: theme.colors.card }]}>
          {activeTab === 'password' ? (
            // Password Login Form
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Email or Mobile Number"
                  placeholderTextColor={theme.colors.textLight}
                  value={emailOrMobile}
                  onChangeText={setEmailOrMobile}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.emailOrMobile && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.emailOrMobile}
                </Text>
              )}

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

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <Ionicons
                    name={rememberMe ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={rememberMe ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <Text style={[styles.rememberMeText, { color: theme.colors.textSecondary }]}>
                    Remember me
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={navigateToForgotPassword}>
                  <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
                onPress={handlePasswordLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            // OTP Login Form
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Mobile Number"
                  placeholderTextColor={theme.colors.textLight}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  editable={!otpSent}
                />
              </View>
              {errors.phoneNumber && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.phoneNumber}
                </Text>
              )}

              {otpSent && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.colors.text, letterSpacing: 8 }]}
                      placeholder="Enter OTP"
                      placeholderTextColor={theme.colors.textLight}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                  {errors.otp && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {errors.otp}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleVerifyOTP}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.loginButtonText}>Verify OTP</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.resendContainer}>
                    {countdown > 0 ? (
                      <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>
                        Resend OTP in {countdown}s
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={handleSendOTP}>
                        <Text style={[styles.resendLink, { color: theme.colors.primary }]}>
                          Resend OTP
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              {!otpSent && (
                <TouchableOpacity
                  style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={navigateToSignup}>
            <Text style={[styles.signupLink, { color: theme.colors.primary }]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <Text style={[styles.disclaimer, { color: theme.colors.textLight }]}>
          By logging in, you agree to our Terms of Service and Privacy Policy
        </Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    fontSize: 14,
    marginLeft: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    marginRight: 4,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;
