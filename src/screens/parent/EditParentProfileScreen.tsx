import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import { getParentProfile, updateParentProfile, UpdateParentProfilePayload } from '../../services/parentApi';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  state: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  city?: string;
  state?: string;
}

interface ProfileData {
  _id: string;
  email: string;
  mobileNumber: string;
  role: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    parentName?: string;
    address?: {
      city?: string;
      state?: string;
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Rules
// ─────────────────────────────────────────────────────────────────────────────

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateForm = (data: ProfileFormData): FormErrors => {
  const errors: FormErrors = {};

  // First Name validation
  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.firstName = 'First name is required';
  } else if (data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  // Last Name validation
  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.lastName = 'Last name is required';
  } else if (data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }

  // Email validation
  if (!data.email || data.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }

  // City validation (optional, but if provided should be valid)
  if (data.city && data.city.trim().length > 0 && data.city.trim().length < 2) {
    errors.city = 'City must be at least 2 characters';
  }

  // State validation (optional, but if provided should be valid)
  if (data.state && data.state.trim().length > 0 && data.state.trim().length < 2) {
    errors.state = 'State must be at least 2 characters';
  }

  return errors;
};

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

const FormInput: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  editable?: boolean;
}> = ({ label, value, onChangeText, placeholder, error, required, keyboardType = 'default', autoCapitalize = 'words', editable = true }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>
      {label}
      {required && <Text style={styles.requiredAsterisk}> *</Text>}
    </Text>
    <TextInput
      style={[
        styles.input,
        error && styles.inputError,
        !editable && styles.inputDisabled,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      editable={editable}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

const EditParentProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);
  const insets = useSafeAreaInsets();

  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    city: '',
    state: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load profile data on mount
  const loadProfile = useCallback(async () => {
    if (!token) {
      setLoadError('Authentication required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);

      const response = await getParentProfile(token);
      const profile = response as unknown as ProfileData;

      // Prefill form with existing data
      setFormData({
        firstName: profile.profile?.firstName || '',
        lastName: profile.profile?.lastName || '',
        email: profile.email || '',
        city: profile.profile?.address?.city || '',
        state: profile.profile?.address?.state || '',
      });
    } catch (err: any) {
      console.error('❌ [EDIT_PROFILE] Failed to load profile:', err);

      if (err?.status === 401 || err?.message?.includes('Unauthorized')) {
        dispatch(logout());
        Alert.alert('Session Expired', 'Please login again.');
        return;
      }

      setLoadError(err?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [token, dispatch]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle field changes
  const handleChange = useCallback((field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Handle field blur (mark as touched for validation)
  const handleBlur = useCallback((field: keyof ProfileFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate single field
    const fieldErrors = validateForm(formData);
    if (fieldErrors[field]) {
      setErrors(prev => ({ ...prev, [field]: fieldErrors[field] }));
    }
  }, [formData]);

  // Validate all fields before submit
  const validateAll = useCallback((): boolean => {
    const formErrors = validateForm(formData);
    setErrors(formErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      city: true,
      state: true,
    });

    return Object.keys(formErrors).length === 0;
  }, [formData]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateAll()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    setIsSaving(true);

    try {
      const payload: UpdateParentProfilePayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        address: {
          city: formData.city.trim() || undefined,
          state: formData.state.trim() || undefined,
        },
      };

      await updateParentProfile(token, payload);

      Alert.alert(
        'Success',
        'Your profile has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      console.error('❌ [EDIT_PROFILE] Failed to save profile:', err);

      // Handle specific error codes
      if (err?.status === 401 || err?.message?.includes('Unauthorized')) {
        dispatch(logout());
        Alert.alert('Session Expired', 'Please login again.');
        return;
      }

      if (err?.status === 403) {
        Alert.alert('Access Denied', 'You do not have permission to update this profile.');
        return;
      }

      if (err?.status === 422) {
        Alert.alert('Validation Error', err?.message || 'Invalid data provided.');
        return;
      }

      if (err?.status >= 500) {
        Alert.alert('Server Error', 'Something went wrong on our end. Please try again later.');
        return;
      }

      // Network or other errors
      Alert.alert(
        'Error',
        err?.message || 'Failed to update profile. Please check your connection and try again.'
      );
    } finally {
      setIsSaving(false);
    }
  }, [formData, token, dispatch, navigation, validateAll]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    // Check if there are unsaved changes
    const hasChanges = Object.values(formData).some(value => value.trim().length > 0);

    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [formData, navigation]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Error state
  if (loadError) {
    return (
      <View style={styles.center}>
        <View style={[styles.iconCircle, { backgroundColor: colors.error + '14' }]}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
        </View>
        <Text style={[styles.loadingText, { color: colors.error }]}>{loadError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 44 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleCancel}
          disabled={isSaving}
        >
          <Ionicons name="close-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            Update your personal information. Fields marked with * are required.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <FormInput
            label="First Name"
            value={formData.firstName}
            onChangeText={(text) => handleChange('firstName', text)}
            placeholder="Enter your first name"
            error={touched.firstName ? errors.firstName : undefined}
            required
            autoCapitalize="words"
          />

          <FormInput
            label="Last Name"
            value={formData.lastName}
            onChangeText={(text) => handleChange('lastName', text)}
            placeholder="Enter your last name"
            error={touched.lastName ? errors.lastName : undefined}
            required
            autoCapitalize="words"
          />

          <FormInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
            placeholder="Enter your email address"
            error={touched.email ? errors.email : undefined}
            required
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.divider} />

          <FormInput
            label="City"
            value={formData.city}
            onChangeText={(text) => handleChange('city', text)}
            placeholder="Enter your city (optional)"
            error={touched.city ? errors.city : undefined}
            autoCapitalize="words"
          />

          <FormInput
            label="State"
            value={formData.state}
            onChangeText={(text) => handleChange('state', text)}
            placeholder="Enter your state (optional)"
            error={touched.state ? errors.state : undefined}
            autoCapitalize="words"
          />
        </View>

        {/* Bottom padding for keyboard */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.info + '10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Form Card
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    ...shadows.card,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: colors.error,
  },
  input: {
    height: 48,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.error + '08',
  },
  inputDisabled: {
    backgroundColor: colors.background,
    opacity: 0.6,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
});

export default EditParentProfileScreen;
