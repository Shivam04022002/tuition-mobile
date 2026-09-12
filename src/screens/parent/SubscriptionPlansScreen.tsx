import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { useParentSubscription } from '../../hooks/useParentSubscription';
import { useParentPayment } from '../../hooks/useParentPayment';
import { getParentPlans, ParentSubscriptionPlan } from '../../services/parentSubscriptionApi';

const PLAN_ICONS: Record<string, string> = {
  monthly: 'calendar-outline',
  quarterly: 'calendar-number-outline',
  annual: 'trophy-outline',
};

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const SubscriptionPlansScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const token = useAppSelector(selectAuthToken);
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const { hasActiveSubscription, subscription, refresh: refreshStatus } = useParentSubscription();
  const { isProcessing, purchaseParentSubscription } = useParentPayment();

  const [plans, setPlans] = useState<ParentSubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getParentPlans(token);
      setPlans(data.plans);
    } catch (err: any) {
      setError(err?.message || 'Failed to load subscription plans');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSelectPlan = useCallback((plan: ParentSubscriptionPlan) => {
    Alert.alert(
      plan.displayName,
      `Subscribe to ${plan.displayName} for ₹${plan.price} + 18% GST (₹${Math.round(plan.price * 1.18)} total)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Pay ₹${Math.round(plan.price * 1.18)}`,
          onPress: async () => {
            const result = await purchaseParentSubscription(plan.planId);
            if (result) {
              await refreshStatus();
              Alert.alert('Subscribed! 🎉', `You can now contact tutors until ${formatDate(result.endDate)}.`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            }
          },
        },
      ]
    );
  }, [purchaseParentSubscription, refreshStatus, navigation]);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.errorTitle}>Unable to Load Plans</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPlans}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {hasActiveSubscription && subscription && (
            <View style={styles.currentPlanCard}>
              <View style={styles.currentPlanBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={styles.currentPlanBadgeText}>ACTIVE</Text>
              </View>
              <Text style={styles.currentPlanTitle}>
                {subscription.plan?.displayName || 'Current plan'} — valid until {formatDate(subscription.endDate)}
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Choose a Plan</Text>

          {plans.map((plan) => (
            <View key={plan.planId} style={styles.planCard}>
              <View style={styles.planCardHeader}>
                <View style={[styles.planIconCircle, { backgroundColor: plan.badgeColor + '20' }]}>
                  <Ionicons name={(PLAN_ICONS[plan.name] || 'star-outline') as any} size={24} color={plan.badgeColor} />
                </View>
                <View style={styles.planCardTitleSection}>
                  <Text style={styles.planCardName}>{plan.displayName}</Text>
                  <Text style={styles.planCardDescription}>{plan.description}</Text>
                </View>
              </View>

              <View style={styles.planPriceSection}>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPriceSymbol}>₹</Text>
                  <Text style={styles.planPriceValue}>{plan.price}</Text>
                  <Text style={styles.planPricePeriod}>/ {plan.durationDays} days</Text>
                </View>
              </View>

              <View style={styles.planFeaturesSection}>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={plan.badgeColor} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.selectButton, { backgroundColor: plan.badgeColor }]}
                onPress={() => handleSelectPlan(plan)}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.selectButtonText}>Select {plan.displayName}</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  currentPlanCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...shadows.md,
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.success,
    marginBottom: 8,
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
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
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
  planPriceSection: {
    marginBottom: 16,
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
    marginLeft: 4,
  },
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
});

export default SubscriptionPlansScreen;
