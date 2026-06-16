import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { ONLINE_STATUS_OPTIONS } from '../../services/teacherAvailabilityApi';

interface Discoverability {
  availableForNewStudents: boolean;
  visibleInMarketplace: boolean;
  onlineStatus: 'online' | 'offline' | 'hybrid';
}

interface MatchingEligibility {
  isEligible: boolean;
  profileCompletionPercentage: number;
  verificationStatus: string;
  visibleInMarketplace: boolean;
  availableForNewStudents: boolean;
  hasActiveDays: boolean;
  hasTimeSlots: boolean;
}

interface DiscoverabilityCardProps {
  discoverability: Discoverability;
  matchingEligibility: MatchingEligibility | null;
  onUpdateDiscoverability: (updates: Partial<Discoverability>) => Promise<void>;
  isLoading?: boolean;
}

export const DiscoverabilityCard: React.FC<DiscoverabilityCardProps> = ({
  discoverability,
  matchingEligibility,
  onUpdateDiscoverability,
  isLoading = false,
}) => {

  const handleToggleAvailableForNewStudents = useCallback(async (value: boolean) => {
    try {
      await onUpdateDiscoverability({ availableForNewStudents: value });
    } catch (error: any) {
      console.error('Failed to update availability for new students:', error);
    }
  }, [onUpdateDiscoverability]);

  const handleToggleVisibleInMarketplace = useCallback(async (value: boolean) => {
    try {
      await onUpdateDiscoverability({ visibleInMarketplace: value });
    } catch (error: any) {
      console.error('Failed to update marketplace visibility:', error);
    }
  }, [onUpdateDiscoverability]);

  const handleUpdateOnlineStatus = useCallback(async (status: 'online' | 'offline' | 'hybrid') => {
    try {
      await onUpdateDiscoverability({ onlineStatus: status });
    } catch (error: any) {
      console.error('Failed to update online status:', error);
    }
  }, [onUpdateDiscoverability]);

  const getEligibilityStatus = useCallback(() => {
    if (!matchingEligibility) {
      return { status: 'loading', color: colors.textSecondary, icon: 'time' as const };
    }

    if (matchingEligibility.isEligible) {
      return { status: 'eligible', color: colors.success, icon: 'checkmark-circle' as const };
    }

    // Check what's missing
    const missing = [];
    if (matchingEligibility.profileCompletionPercentage < 70) {
      missing.push('Profile completion');
    }
    if (matchingEligibility.verificationStatus === 'rejected') {
      missing.push('Verification status');
    }
    if (!matchingEligibility.visibleInMarketplace) {
      missing.push('Marketplace visibility');
    }
    if (!matchingEligibility.availableForNewStudents) {
      missing.push('Available for new students');
    }
    if (!matchingEligibility.hasActiveDays) {
      missing.push('Active days');
    }
    if (!matchingEligibility.hasTimeSlots) {
      missing.push('Time slots');
    }

    return { 
      status: 'ineligible', 
      color: colors.warning, 
      icon: 'alert-circle' as const,
      missing 
    };
  }, [matchingEligibility, colors]);

  const eligibilityStatus = getEligibilityStatus();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Discoverability
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Control how parents find you
        </Text>
      </View>

      {/* Matching Eligibility Status */}
      {matchingEligibility && (
        <View style={[styles.eligibilityCard, { backgroundColor: colors.background }]}>
          <View style={styles.eligibilityHeader}>
            <View style={styles.eligibilityTitleRow}>
              <Ionicons 
                name={eligibilityStatus.icon} 
                size={20} 
                color={eligibilityStatus.color} 
              />
              <Text style={[styles.eligibilityTitle, { color: colors.text }]}>
                Matching Eligibility
              </Text>
            </View>
            <View style={[
              styles.eligibilityBadge,
              { backgroundColor: eligibilityStatus.color + '20' }
            ]}>
              <Text style={[
                styles.eligibilityBadgeText,
                { color: eligibilityStatus.color }
              ]}>
                {eligibilityStatus.status === 'eligible' ? 'Eligible' : 
                 eligibilityStatus.status === 'loading' ? 'Loading...' : 'Not Eligible'}
              </Text>
            </View>
          </View>

          {eligibilityStatus.status === 'ineligible' && eligibilityStatus.missing && (
            <View style={styles.missingItems}>
              <Text style={[styles.missingTitle, { color: colors.textSecondary }]}>
                Missing requirements:
              </Text>
              {eligibilityStatus.missing.map((item, index) => (
                <Text key={index} style={[styles.missingItem, { color: colors.error }]}>
                  • {item}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Profile Completion
            </Text>
            <Text style={[styles.progressValue, { color: colors.text }]}>
              {matchingEligibility.profileCompletionPercentage}%
            </Text>
          </View>
        </View>
      )}

      {/* Main Toggles */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Visibility Settings
        </Text>

        <View style={styles.toggleItem}>
          <View style={styles.toggleContent}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>
              Available for New Students
            </Text>
            <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
              Receive leads from new parents
            </Text>
          </View>
          <Switch
            value={discoverability.availableForNewStudents}
            onValueChange={handleToggleAvailableForNewStudents}
            disabled={isLoading}
            trackColor={{ false: colors.border, true: colors.primary + '40' }}
            thumbColor={discoverability.availableForNewStudents ? colors.primary : colors.textSecondary}
          />
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleContent}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>
              Visible in Marketplace
            </Text>
            <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
              Appear in search results and recommendations
            </Text>
          </View>
          <Switch
            value={discoverability.visibleInMarketplace}
            onValueChange={handleToggleVisibleInMarketplace}
            disabled={isLoading}
            trackColor={{ false: colors.border, true: colors.primary + '40' }}
            thumbColor={discoverability.visibleInMarketplace ? colors.primary : colors.textSecondary}
          />
        </View>
      </View>

      {/* Online Status */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Teaching Mode
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          How you prefer to conduct classes
        </Text>

        <View style={styles.statusGrid}>
          {ONLINE_STATUS_OPTIONS.map((option) => {
            const isSelected = discoverability.onlineStatus === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: isSelected ? colors.primary + '20' : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleUpdateOnlineStatus(option.value as 'online' | 'offline' | 'hybrid')}
                disabled={isLoading}
              >
                <Ionicons
                  name={getOnlineStatusIcon(option.value)}
                  size={24}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text style={[
                  styles.statusText,
                  {
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: isSelected ? '600' : '400',
                  },
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.infoSection}>
        <View style={[styles.infoCard, { backgroundColor: colors.success + '10' }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.infoText, { color: colors.success }]}>
            Eligible teachers appear in parent searches and receive requirement matches
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.warning + '10' }]}>
          <Ionicons name="information-circle" size={20} color={colors.warning} />
          <Text style={[styles.infoText, { color: colors.warning }]}>
            Complete your profile (70%+) and get verified to maximize visibility
          </Text>
        </View>
      </View>
    </View>
  );
};

const getOnlineStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
  switch (status) {
    case 'online': return 'wifi';
    case 'offline': return 'wifi-outline';
    case 'hybrid': return 'swap-horizontal';
    default: return 'help';
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  eligibilityCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  eligibilityHeader: {
    marginBottom: 12,
  },
  eligibilityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eligibilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  eligibilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  eligibilityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  missingItems: {
    marginBottom: 12,
  },
  missingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  missingItem: {
    fontSize: 13,
    marginLeft: 8,
    marginBottom: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  infoSection: {
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});
