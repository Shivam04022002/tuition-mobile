import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import { getTeacherProfile, TeacherProfile } from '../../services/teacherApi';
import { RequirementDetail } from '../../services/requirementsMarketplaceApi';
import { applyToRequirement, ApplyToRequirementPayload } from '../../services/applicationApi';
import ApplicationSummaryCard from '../../components/teacher/ApplicationSummaryCard';
import DemoProposalCard from '../../components/teacher/DemoProposalCard';

// ── Route Params ───────────────────────────────────────────────────────────────
type RouteParams = {
  ApplyToRequirement: {
    requirement: RequirementDetail;
  };
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  coverMessage: string;
  teachingApproach: string;
  relevantExperience: string;
  proposedFee: string;
  isNegotiable: boolean;
  demoEnabled: boolean;
  demoProposal: {
    suggestedDate?: string;
    suggestedTime?: string;
    mode?: 'online' | 'offline';
  };
}

interface FormErrors {
  coverMessage?: string;
  proposedFee?: string;
}

const MAX_COVER_MESSAGE = 500;
const MAX_TEACHING_APPROACH = 300;
const MAX_EXPERIENCE = 300;

// ── Helper Components ─────────────────────────────────────────────────────────

const InputField: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  keyboardType?: 'default' | 'numeric';
  icon?: string;
}> = ({ label, value, onChangeText, placeholder, maxLength, multiline, numberOfLines, error, keyboardType, icon }) => (
  <View style={inputStyles.container}>
    <View style={inputStyles.labelRow}>
      <Text style={inputStyles.label}>{label}</Text>
      {maxLength && (
        <Text style={[inputStyles.charCount, value.length > maxLength * 0.9 && inputStyles.charCountWarning]}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
    <View style={[inputStyles.inputContainer, multiline && inputStyles.multilineContainer, error && inputStyles.inputError]}>
      {icon && <Ionicons name={icon as any} size={18} color={colors.textSecondary} style={inputStyles.inputIcon} />}
      <TextInput
        style={[inputStyles.input, multiline && inputStyles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType || 'default'}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
    {error && <Text style={inputStyles.errorText}>{error}</Text>}
  </View>
);

const inputStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  charCount: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  charCountWarning: {
    color: colors.warning,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
  },
  multilineContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 12,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
});

const SectionHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <View style={sectionHeaderStyles.container}>
    <View style={sectionHeaderStyles.iconBox}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
    </View>
    <Text style={sectionHeaderStyles.title}>{title}</Text>
  </View>
);

const sectionHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

const ApplyToRequirementScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'ApplyToRequirement'>>();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);
  const { requirement } = route.params;

  const [formData, setFormData] = useState<FormData>({
    coverMessage: '',
    teachingApproach: '',
    relevantExperience: '',
    proposedFee: '',
    isNegotiable: true,
    demoEnabled: false,
    demoProposal: {},
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get teacher profile data
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);

  useEffect(() => {
    if (!token) return;
    getTeacherProfile(token)
      .then(setTeacherProfile)
      .catch(() => {});
  }, [token]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.coverMessage.trim()) {
      newErrors.coverMessage = 'Please write a cover message';
    } else if (formData.coverMessage.length < 50) {
      newErrors.coverMessage = 'Cover message should be at least 50 characters';
    }

    if (formData.proposedFee && isNaN(Number(formData.proposedFee))) {
      newErrors.proposedFee = 'Please enter a valid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!token) {
      Alert.alert('Error', 'Please login again');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: ApplyToRequirementPayload = {
        message: formData.coverMessage.trim(),
        teachingApproach: formData.teachingApproach.trim() || undefined,
        relevantExperience: formData.relevantExperience.trim() || undefined,
        proposedFee: formData.proposedFee ? Number(formData.proposedFee) : undefined,
        isNegotiable: formData.isNegotiable,
      };

      if (formData.demoEnabled && formData.demoProposal.suggestedDate) {
        payload.demoProposal = formData.demoProposal;
      }

      const response = await applyToRequirement(token, requirement._id, payload);

      if (__DEV__) {
        console.log('[ApplyToRequirement] Application Submitted', {
          requirementId: requirement.requirementId,
          applicationId: response.applicationId,
        });
      }

      // Navigate to success state
      navigation.replace('ApplicationSuccess', {
        applicationId: response.applicationId,
        requirement,
      });
    } catch (err: any) {
      if (err?.message === 'Unauthorized') {
        dispatch(logout());
        return;
      }

      Alert.alert(
        'Application Failed',
        err?.message || 'Failed to submit application. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [token, formData, requirement, navigation, dispatch]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (formData.coverMessage || formData.teachingApproach || formData.relevantExperience) {
      Alert.alert(
        'Discard Application?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ],
      );
    } else {
      navigation.goBack();
    }
  }, [navigation, formData]);

  // Update form field
  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply Now</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Summary Card */}
        <ApplicationSummaryCard
          requirement={{
            requirementId: requirement.requirementId,
            studentDetails: requirement.studentDetails,
            subjects: requirement.subjects,
            tuitionType: requirement.tuitionType,
            location: requirement.location,
            budget: requirement.budget,
            matchScore: requirement.matchScore,
          }}
          teacherProfile={{
            fullName: teacherProfile?.basicDetails?.fullName || 'Teacher',
            subjects: teacherProfile?.teachingDetails?.subjects || [],
            classes: teacherProfile?.teachingDetails?.classes || [],
            hourlyRate: teacherProfile?.pricingRevenue?.hourlyRate || 0,
            experienceYears: teacherProfile?.pricingRevenue?.experienceYears || 0,
            verificationStatus: teacherProfile?.verificationStatus || 'pending',
            profileCompletion: 0,
          }}
        />

        {/* Application Form */}
        <View style={styles.formSection}>
          <SectionHeader title="Your Application" icon="document-text-outline" />

          <InputField
            label="Cover Message *"
            placeholder="Why are you a good fit for this requirement? Describe your teaching style, relevant experience, and how you can help this student succeed..."
            value={formData.coverMessage}
            onChangeText={(text) => updateField('coverMessage', text)}
            multiline
            numberOfLines={5}
            maxLength={MAX_COVER_MESSAGE}
            error={errors.coverMessage}
          />

          <InputField
            label="Teaching Approach"
            placeholder="How do you approach teaching this subject? What methods do you use?"
            value={formData.teachingApproach}
            onChangeText={(text) => updateField('teachingApproach', text)}
            multiline
            numberOfLines={3}
            maxLength={MAX_TEACHING_APPROACH}
          />

          <InputField
            label="Relevant Experience"
            placeholder="Share specific experience with this grade level, board, or subject..."
            value={formData.relevantExperience}
            onChangeText={(text) => updateField('relevantExperience', text)}
            multiline
            numberOfLines={3}
            maxLength={MAX_EXPERIENCE}
          />
        </View>

        {/* Pricing Section */}
        <View style={styles.formSection}>
          <SectionHeader title="Pricing" icon="cash-outline" />

          <View style={styles.pricingContainer}>
            <View style={styles.budgetInfo}>
              <Ionicons name="information-circle-outline" size={16} color={colors.info} />
              <Text style={styles.budgetText}>
                Parent Budget: ₹{requirement.budget.minAmount.toLocaleString()}–₹{requirement.budget.maxAmount.toLocaleString()}/month
              </Text>
            </View>

            <InputField
              label="Your Expected Fee (₹/month)"
              placeholder="Enter your proposed fee"
              value={formData.proposedFee}
              onChangeText={(text) => updateField('proposedFee', text)}
              keyboardType="numeric"
              icon="cash-outline"
              error={errors.proposedFee}
            />

            <View style={styles.negotiableRow}>
              <Text style={styles.negotiableLabel}>Willing to negotiate</Text>
              <Switch
                value={formData.isNegotiable}
                onValueChange={(value) => updateField('isNegotiable', value)}
                trackColor={{ false: colors.border, true: colors.success + '60' }}
                thumbColor={formData.isNegotiable ? colors.success : colors.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Demo Proposal */}
        <View style={styles.formSection}>
          <DemoProposalCard
            value={formData.demoProposal}
            onChange={(proposal) => updateField('demoProposal', proposal)}
            enabled={formData.demoEnabled}
            onToggle={(enabled) => updateField('demoEnabled', enabled)}
          />
        </View>

        {/* Validation Notice */}
        <View style={styles.noticeContainer}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.noticeText}>
            Your application will be reviewed by the parent. Make sure your profile is complete for better chances.
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={18} color="#FFF" />
              <Text style={styles.submitButtonText}>Submit Application</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    width: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formSection: {
    marginTop: 16,
  },
  pricingContainer: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  budgetText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  negotiableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  negotiableLabel: {
    fontSize: 14,
    color: colors.text,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  noticeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default ApplyToRequirementScreen;
