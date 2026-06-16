import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useTeacherOnboarding } from '../../hooks/useTeacherOnboarding';
import ProfileCompletionCard from '../../components/teacher/ProfileCompletionCard';
import VerificationStatusCard from '../../components/teacher/VerificationStatusCard';

interface StepItem {
  step: number;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const ONBOARDING_STEPS: StepItem[] = [
  {
    step: 1,
    title: 'Basic Details',
    description: 'Name, gender, DOB, contact, languages & photo',
    icon: 'person-outline',
    color: colors.primary,
  },
  {
    step: 2,
    title: 'Education',
    description: 'Degree, institution, year & certifications',
    icon: 'school-outline',
    color: colors.secondary,
  },
  {
    step: 3,
    title: 'Teaching Details',
    description: 'Subjects, classes, boards & teaching modes',
    icon: 'book-outline',
    color: colors.accent,
  },
  {
    step: 4,
    title: 'Location & Availability',
    description: 'City, area, teaching radius & time slots',
    icon: 'location-outline',
    color: colors.info,
  },
  {
    step: 5,
    title: 'Pricing',
    description: 'Hourly rate, monthly rate & negotiation',
    icon: 'cash-outline',
    color: colors.success,
  },
  {
    step: 6,
    title: 'Documents',
    description: 'Aadhaar, degree certificates & ID proof',
    icon: 'document-text-outline',
    color: colors.error,
  },
];

interface TeacherOnboardingScreenProps {
  navigation: any;
}

const TeacherOnboardingScreen: React.FC<TeacherOnboardingScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const { completion, isLoading, error, refresh } = useTeacherOnboarding();

  const navigateToStep = useCallback((step: number) => {
    const stepRoutes: Record<number, string> = {
      1: 'Step1BasicDetails',
      2: 'Step2Education',
      3: 'Step3TeachingDetails',
      4: 'Step4LocationAvailability',
      5: 'Step5PricingRevenue',
      6: 'Step6VerificationUpload',
    };
    const screenName = stepRoutes[step];
    if (screenName) {
      navigation.navigate('TeacherOnboardingSteps', { screen: screenName });
    }
  }, [navigation]);

  const handleEditSection = useCallback((step: number) => {
    navigateToStep(step);
  }, [navigateToStep]);

  const handleContinue = useCallback(() => {
    if (!completion) { navigateToStep(1); return; }
    const sections = completion.sections;
    if (!sections.basicDetails || !sections.profilePhoto) { navigateToStep(1); return; }
    if (!sections.education) { navigateToStep(2); return; }
    if (!sections.subjects || !sections.classes || !sections.teachingModes) { navigateToStep(3); return; }
    if (!sections.location || !sections.availability) { navigateToStep(4); return; }
    if (!sections.pricing) { navigateToStep(5); return; }
    if (!sections.documents) { navigateToStep(6); return; }
    navigateToStep(1);
  }, [completion, navigateToStep]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your profile…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingTop: topPad }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const percentage = completion?.percentage ?? 0;
  const verStatus = (completion?.verificationStatus ?? 'pending') as any;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      {/* Hero Header */}
      <View style={[styles.hero, { paddingTop: topPad + 20 }]}>
        <View style={styles.heroIcon}>
          <Ionicons name="school" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>Teacher Profile Setup</Text>
        <Text style={styles.heroSubtitle}>
          Complete your profile to get matched with parents looking for tutors
        </Text>
      </View>

      {/* Profile Completion Card */}
      {completion && (
        <ProfileCompletionCard
          percentage={completion.percentage}
          completedCount={completion.completedCount}
          totalCount={completion.totalCount}
          sections={completion.sections}
          canApply={completion.canApply}
          onEditSection={handleEditSection}
          compact={false}
        />
      )}

      {/* Verification Status */}
      {completion && (
        <VerificationStatusCard
          status={verStatus}
        />
      )}

      {/* Steps section */}
      <Text style={styles.sectionHeading}>Setup Steps</Text>
      <View style={styles.stepsGrid}>
        {ONBOARDING_STEPS.map(item => {
          const stepComplete = (() => {
            if (!completion) return false;
            const s = completion.sections;
            if (item.step === 1) return s.basicDetails && s.profilePhoto;
            if (item.step === 2) return s.education;
            if (item.step === 3) return s.subjects && s.classes && s.teachingModes;
            if (item.step === 4) return s.location && s.availability;
            if (item.step === 5) return s.pricing;
            if (item.step === 6) return s.documents;
            return false;
          })();

          return (
            <TouchableOpacity
              key={item.step}
              style={[styles.stepCard, shadows.xs, stepComplete && styles.stepCardDone]}
              onPress={() => navigateToStep(item.step)}
              activeOpacity={0.75}
            >
              <View style={[styles.stepIconBox, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.stepTextBox}>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepDescription}>{item.description}</Text>
              </View>
              {stepComplete ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CTA Button */}
      <View style={styles.ctaSection}>
        <TouchableOpacity style={styles.ctaButton} onPress={handleContinue}>
          <Ionicons name="play-circle-outline" size={22} color="#FFFFFF" />
          <Text style={styles.ctaButtonText}>
            {percentage === 0 ? 'Start Setup' : percentage === 100 ? 'Review Profile' : 'Continue Setup'}
          </Text>
        </TouchableOpacity>

        {completion?.canApply && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('TeacherMain')}
          >
            <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textTertiary} />
        <Text style={styles.disclaimerText}>
          We connect tutors and parents. We do not provide tutoring services or guarantee academic results.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 28,
    backgroundColor: colors.primary,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  stepsGrid: {
    paddingHorizontal: 20,
    gap: 10,
  },
  stepCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepCardDone: {
    borderWidth: 1,
    borderColor: colors.success + '50',
  },
  stepIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextBox: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  stepDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: colors.textTertiary,
    lineHeight: 16,
  },
});

export default TeacherOnboardingScreen;
