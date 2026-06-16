import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { RequirementDetail } from '../../services/requirementsMarketplaceApi';

type RouteParams = {
  ApplicationSuccess: {
    applicationId: string;
    requirement: RequirementDetail;
  };
};

const ApplicationSuccessScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'ApplicationSuccess'>>();

  const { applicationId, requirement } = route.params;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={48} color="#FFF" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Application Submitted!</Text>
        <Text style={styles.subtitle}>
          Your application for {requirement.studentDetails.grade} tuition has been sent to the parent.
        </Text>

        {/* Application ID Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Application ID</Text>
          <Text style={styles.cardValue}>{applicationId}</Text>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {requirement.subjects.slice(0, 2).join(', ')}
              {requirement.subjects.length > 2 && ` +${requirement.subjects.length - 2}`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{requirement.location.city}</Text>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>What happens next?</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>Parent will review your application</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>You will be notified of their decision</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>If shortlisted, a demo may be scheduled</Text>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.replace('ApplicationDetail', { applicationId })}
        >
          <Text style={styles.primaryButtonText}>View Application</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Leads')}
        >
          <Text style={styles.secondaryButtonText}>Back to Marketplace</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    width: '100%',
    marginBottom: 32,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  nextSteps: {
    width: '100%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 20,
  },
  nextStepsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 5,
    marginRight: 10,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

export default ApplicationSuccessScreen;
