import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useSubscription } from '../../hooks/useSubscription';
import { usePayment } from '../../hooks/usePayment';
import { SubscriptionPlan } from '../../services/subscriptionApi';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Plan icon mapping
// ─────────────────────────────────────────────────────────────────────────────
const PLAN_ICONS: Record<string, string> = {
  free: 'leaf-outline',
  starter: 'rocket-outline',
  professional: 'diamond-outline',
  premium: 'trophy-outline',
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Components
// ─────────────────────────────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <View style={[styles.planCard, { opacity: 0.5 }]}>
    <View style={[styles.skeletonBar, { width: '40%', height: 20 }]} />
    <View style={[styles.skeletonBar, { width: '70%', height: 14, marginTop: 8 }]} />
    <View style={[styles.skeletonBar, { width: '30%', height: 24, marginTop: 12 }]} />
    <View style={[styles.skeletonBar, { width: '100%', height: 12, marginTop: 16 }]} />
    <View style={[styles.skeletonBar, { width: '90%', height: 12, marginTop: 6 }]} />
    <View style={[styles.skeletonBar, { width: '85%', height: 12, marginTop: 6 }]} />
  </View>
);

const LoadingSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    <View style={[styles.skeletonBar, { width: '60%', height: 24, alignSelf: 'center' }]} />
    <View style={[styles.skeletonBar, { width: '80%', height: 14, alignSelf: 'center', marginTop: 8 }]} />
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Current Plan Card
// ─────────────────────────────────────────────────────────────────────────────
const CurrentPlanCard: React.FC<{
  planName: string;
  badge: string;
  badgeColor: string;
  usage: { applicationsUsed: number; leadUnlocksUsed: number };
  limits: { applicationsPerMonth: number; leadUnlocksPerMonth: number };
  remaining: { applications: number; leadUnlocks: number };
  endDate?: string;
}> = ({ planName, badge, badgeColor, usage, limits, remaining, endDate }) => {
  const appLimit = limits.applicationsPerMonth === -1 ? 'Unlimited' : `${limits.applicationsPerMonth}`;
  const leadLimit = limits.leadUnlocksPerMonth === -1 ? 'Unlimited' : `${limits.leadUnlocksPerMonth}`;
  const appUsed = usage.applicationsUsed;
  const leadUsed = usage.leadUnlocksUsed;
  const appProgress = limits.applicationsPerMonth === -1 ? 0 : (appUsed / limits.applicationsPerMonth);
  const leadProgress = limits.leadUnlocksPerMonth === -1 ? 0 : (leadUsed / limits.leadUnlocksPerMonth);

  return (
    <View style={styles.currentPlanCard}>
      <View style={styles.currentPlanHeader}>
        <View style={[styles.currentPlanBadge, { backgroundColor: badgeColor }]}>
          <Ionicons name={PLAN_ICONS[planName] as any} size={16} color="#FFFFFF" />
          <Text style={styles.currentPlanBadgeText}>{badge}</Text>
        </View>
        <Text style={styles.currentPlanTitle}>Current Plan</Text>
      </View>

      {endDate && planName !== 'free' && (
        <Text style={styles.renewalText}>
          Renews: {new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      )}

      <View style={styles.usageSection}>
        <View style={styles.usageRow}>
          <View style={styles.usageInfo}>
            <Text style={styles.usageLabel}>Applications</Text>
            <Text style={styles.usageValue}>
              {appUsed} / {appLimit}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(appProgress * 100, 100)}%`,
                  backgroundColor: appProgress > 0.8 ? colors.error : colors.primary,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.usageRow}>
          <View style={styles.usageInfo}>
            <Text style={styles.usageLabel}>Lead Unlocks</Text>
            <Text style={styles.usageValue}>
              {leadUsed} / {leadLimit}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(leadProgress * 100, 100)}%`,
                  backgroundColor: leadProgress > 0.8 ? colors.error : colors.info,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {remaining.applications === 0 || remaining.leadUnlocks === 0 ? (
        <View style={styles.limitWarning}>
          <Ionicons name="warning-outline" size={16} color={colors.error} />
          <Text style={styles.limitWarningText}>
            {remaining.applications === 0 ? 'Application limit reached. ' : ''}
            {remaining.leadUnlocks === 0 ? 'Lead unlock limit reached.' : ''}
            {' Upgrade for more!'}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Plan Card
// ─────────────────────────────────────────────────────────────────────────────
const PlanCard: React.FC<{
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  isUpgrade: boolean;
  onSelect: () => void;
  isSelecting: boolean;
}> = ({ plan, isCurrentPlan, isUpgrade, onSelect, isSelecting }) => (
  <View style={[styles.planCard, isCurrentPlan && styles.planCardActive]}>
    {isCurrentPlan && (
      <View style={[styles.currentLabel, { backgroundColor: plan.badgeColor }]}>
        <Text style={styles.currentLabelText}>CURRENT</Text>
      </View>
    )}

    <View style={styles.planCardHeader}>
      <View style={[styles.planIconCircle, { backgroundColor: plan.badgeColor + '20' }]}>
        <Ionicons name={PLAN_ICONS[plan.name] as any} size={24} color={plan.badgeColor} />
      </View>
      <View style={styles.planCardTitleSection}>
        <Text style={styles.planCardName}>{plan.displayName}</Text>
        <Text style={styles.planCardDescription}>{plan.description}</Text>
      </View>
    </View>

    <View style={styles.planPriceSection}>
      {plan.price === 0 ? (
        <Text style={styles.planPriceFree}>Free Forever</Text>
      ) : (
        <View style={styles.planPriceRow}>
          <Text style={styles.planPriceSymbol}>₹</Text>
          <Text style={styles.planPriceValue}>{plan.price}</Text>
          <Text style={styles.planPricePeriod}>/month</Text>
        </View>
      )}
      {plan.annualPrice > 0 && (
        <Text style={styles.planAnnualHint}>
          or ₹{plan.annualPrice}/year (Save {Math.round((1 - plan.annualPrice / (plan.price * 12)) * 100)}%)
        </Text>
      )}
    </View>

    <View style={styles.planFeaturesSection}>
      {plan.features.map((feature, idx) => (
        <View key={idx} style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={16} color={plan.badgeColor} />
          <Text style={styles.featureText}>{feature}</Text>
        </View>
      ))}
    </View>

    <View style={styles.planLimitsSection}>
      <View style={styles.limitChip}>
        <Text style={styles.limitChipLabel}>Apps</Text>
        <Text style={styles.limitChipValue}>
          {plan.limits.applicationsPerMonth === -1 ? '∞' : plan.limits.applicationsPerMonth}
        </Text>
      </View>
      <View style={styles.limitChip}>
        <Text style={styles.limitChipLabel}>Unlocks</Text>
        <Text style={styles.limitChipValue}>
          {plan.limits.leadUnlocksPerMonth === -1 ? '∞' : plan.limits.leadUnlocksPerMonth}
        </Text>
      </View>
      <View style={styles.limitChip}>
        <Text style={styles.limitChipLabel}>Boost</Text>
        <Text style={styles.limitChipValue}>{plan.limits.profileVisibilityBoost}%</Text>
      </View>
    </View>

    {!isCurrentPlan && (
      <TouchableOpacity
        style={[styles.selectButton, { backgroundColor: plan.badgeColor }]}
        onPress={onSelect}
        disabled={isSelecting}
        activeOpacity={0.8}
      >
        {isSelecting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.selectButtonText}>
            {isUpgrade ? 'Upgrade' : 'Select'} {plan.displayName}
          </Text>
        )}
      </TouchableOpacity>
    )}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Comparison Table
// ─────────────────────────────────────────────────────────────────────────────
const ComparisonTable: React.FC<{ plans: SubscriptionPlan[] }> = ({ plans }) => {
  const rows = [
    { label: 'Applications/mo', key: 'applicationsPerMonth' },
    { label: 'Lead Unlocks/mo', key: 'leadUnlocksPerMonth' },
    { label: 'Visibility Boost', key: 'profileVisibilityBoost' },
    { label: 'Analytics', key: 'analyticsAccess' },
    { label: 'Priority Placement', key: 'priorityPlacement' },
    { label: 'Priority Support', key: 'prioritySupport' },
    { label: 'Demo Insights', key: 'demoInsights' },
  ];

  const getValue = (plan: SubscriptionPlan, key: string): string => {
    const val = (plan.limits as any)[key];
    if (val === -1) return '∞';
    if (val === true) return '✓';
    if (val === false) return '—';
    if (key === 'profileVisibilityBoost') return `${val}%`;
    if (key === 'analyticsAccess') return val === 'none' ? '—' : val.charAt(0).toUpperCase() + val.slice(1);
    return String(val);
  };

  return (
    <View style={styles.comparisonContainer}>
      <Text style={styles.comparisonTitle}>Plan Comparison</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={styles.comparisonHeaderRow}>
            <View style={styles.comparisonLabelCell}>
              <Text style={styles.comparisonLabelText}>Feature</Text>
            </View>
            {plans.map((plan) => (
              <View key={plan.name} style={[styles.comparisonValueCell, { backgroundColor: plan.badgeColor + '10' }]}>
                <Text style={[styles.comparisonHeaderText, { color: plan.badgeColor }]}>{plan.displayName}</Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          {rows.map((row, idx) => (
            <View key={row.key} style={[styles.comparisonRow, idx % 2 === 0 && styles.comparisonRowAlt]}>
              <View style={styles.comparisonLabelCell}>
                <Text style={styles.comparisonRowLabel}>{row.label}</Text>
              </View>
              {plans.map((plan) => (
                <View key={plan.name} style={styles.comparisonValueCell}>
                  <Text style={[
                    styles.comparisonRowValue,
                    getValue(plan, row.key) === '✓' && { color: colors.success },
                    getValue(plan, row.key) === '—' && { color: colors.textTertiary },
                  ]}>
                    {getValue(plan, row.key)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const TeacherSubscriptionScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const {
    plans,
    currentData,
    isLoading,
    isRefreshing,
    isSelecting,
    isCancelling,
    error,
    selectError,
    refresh,
    retry,
    selectPlan,
    cancelPlan,
    clearSelectError,
  } = useSubscription();

  const { purchaseSubscription, isProcessing: isPaymentProcessing } = usePayment();

  const [showComparison, setShowComparison] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  const currentPlanName = currentData?.currentPlan || 'free';
  const currentPlanIndex = plans.findIndex(p => p.name === currentPlanName);

  const handleSelectPlan = useCallback(async (planName: string) => {
    const planDisplay = plans.find(p => p.name === planName)?.displayName || planName;
    const isUpgrade = plans.findIndex(p => p.name === planName) > currentPlanIndex;
    const plan = plans.find(p => p.name === planName);
    const isPaid = planName !== 'free' && plan && plan.price > 0;

    if (isPaid) {
      // Paid plan — use Razorpay
      Alert.alert(
        isUpgrade ? 'Upgrade Plan' : 'Change Plan',
        `${isUpgrade ? 'Upgrade' : 'Switch'} to ${planDisplay}?\n\nYou will be charged ₹${plan.price}/month + 18% GST via Razorpay.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Pay ₹${Math.round(plan.price * 1.18)}`,
            onPress: async () => {
              const result = await purchaseSubscription(planName, 'monthly');
              if (result) {
                await refresh();
                Alert.alert('Success! 🎉', `You are now on the ${result.displayName} plan!`);
              }
            },
          },
        ]
      );
    } else {
      // Free plan — direct selection
      Alert.alert(
        'Switch to Free Plan',
        'Downgrade to the Free plan? You will lose premium features.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              const result = await selectPlan(planName);
              if (result) {
                Alert.alert('Done', `You are now on the ${result.plan.displayName} plan.`);
              }
            },
          },
        ]
      );
    }
  }, [plans, currentPlanIndex, selectPlan, purchaseSubscription, refresh]);

  const handleCancelSubscription = useCallback(() => {
    setCancelModalVisible(true);
  }, []);

  const confirmCancel = useCallback(async () => {
    setCancelModalVisible(false);
    const success = await cancelPlan('User requested from subscription screen');
    if (success) {
      Alert.alert('Cancelled', 'Your subscription has been cancelled. You are now on the Free plan.');
    }
  }, [cancelPlan]);

  // Error banner for select errors
  const showSelectError = selectError ? (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle" size={16} color={colors.error} />
      <Text style={styles.errorBannerText}>{selectError}</Text>
      <TouchableOpacity onPress={clearSelectError}>
        <Ionicons name="close" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  ) : null;

  // ── Error State ───────────────────────────────────────────────────────────
  if (error && !isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.errorTitle}>Unable to Load Plans</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      {showSelectError}

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
        >
          {/* Current Plan Card */}
          {currentData && (
            <CurrentPlanCard
              planName={currentData.currentPlan}
              badge={currentData.plan?.badge || 'Free'}
              badgeColor={currentData.plan?.badgeColor || '#94A3B8'}
              usage={currentData.usage}
              limits={currentData.limits}
              remaining={currentData.remaining}
              endDate={currentData.subscription?.endDate}
            />
          )}

          {/* Cancel button for paid plans */}
          {currentPlanName !== 'free' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Toggle comparison */}
          <TouchableOpacity
            style={styles.comparisonToggle}
            onPress={() => setShowComparison(!showComparison)}
          >
            <Ionicons name="grid-outline" size={18} color={colors.primary} />
            <Text style={styles.comparisonToggleText}>
              {showComparison ? 'Hide' : 'Show'} Plan Comparison
            </Text>
            <Ionicons
              name={showComparison ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.primary}
            />
          </TouchableOpacity>

          {showComparison && <ComparisonTable plans={plans} />}

          {/* Plan Cards */}
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>

          {plans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              isCurrentPlan={plan.name === currentPlanName}
              isUpgrade={plans.indexOf(plan) > currentPlanIndex}
              onSelect={() => handleSelectPlan(plan.name)}
              isSelecting={isSelecting || isPaymentProcessing}
            />
          ))}

          {/* Benefits Section */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Why Upgrade?</Text>
            <View style={styles.benefitRow}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="trending-up" size={18} color={colors.success} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitLabel}>More Visibility</Text>
                <Text style={styles.benefitDesc}>Higher plans get better marketplace ranking and visibility boost</Text>
              </View>
            </View>
            <View style={styles.benefitRow}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="analytics-outline" size={18} color={colors.info} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitLabel}>Advanced Analytics</Text>
                <Text style={styles.benefitDesc}>Track performance, trends, and demo conversion insights</Text>
              </View>
            </View>
            <View style={styles.benefitRow}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="flash-outline" size={18} color={colors.warning} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitLabel}>Priority Access</Text>
                <Text style={styles.benefitDesc}>Get featured in parent searches and receive priority support</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Cancel Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
            <Text style={styles.modalTitle}>Cancel Subscription?</Text>
            <Text style={styles.modalMessage}>
              You will lose access to premium features and revert to the Free plan with limited access.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Keep Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmCancel}
              >
                <Text style={styles.modalConfirmText}>Cancel Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  // Current Plan Card
  currentPlanCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    ...shadows.md,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  currentPlanBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  currentPlanTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  renewalText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 12,
  },
  usageSection: {
    marginTop: 8,
  },
  usageRow: {
    marginBottom: 12,
  },
  usageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  usageLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  usageValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  limitWarningText: {
    fontSize: 12,
    color: colors.error,
    marginLeft: 6,
    flex: 1,
  },
  // Cancel Button
  cancelButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  cancelButtonText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
  },
  // Comparison Toggle
  comparisonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 8,
  },
  comparisonToggleText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginHorizontal: 6,
  },
  // Comparison Table
  comparisonContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...shadows.sm,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  comparisonHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
    marginBottom: 4,
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  comparisonRowAlt: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
  },
  comparisonLabelCell: {
    width: 120,
    justifyContent: 'center',
    paddingRight: 8,
  },
  comparisonValueCell: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    paddingVertical: 4,
  },
  comparisonLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  comparisonHeaderText: {
    fontSize: 11,
    fontWeight: '700',
  },
  comparisonRowLabel: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
  },
  comparisonRowValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  // Plan Card
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  planCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  currentLabel: {
    position: 'absolute',
    top: -1,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  currentLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planCardTitleSection: {
    flex: 1,
  },
  planCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  planCardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Plan Price
  planPriceSection: {
    marginBottom: 16,
  },
  planPriceFree: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPriceSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  planPriceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  planPricePeriod: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  planAnnualHint: {
    fontSize: 12,
    color: colors.success,
    marginTop: 4,
    fontWeight: '500',
  },
  // Features
  planFeaturesSection: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  // Limits chips
  planLimitsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  limitChip: {
    alignItems: 'center',
  },
  limitChipLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  limitChipValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  // Select Button
  selectButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Benefits Card
  benefitsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    ...shadows.sm,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  benefitDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
    marginLeft: 8,
  },
  // Skeleton
  skeletonContainer: {
    padding: 16,
  },
  skeletonBar: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 6,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TeacherSubscriptionScreen;
