import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useCredits } from '../../hooks/useCredits';
import { CreditTransactionItem } from '../../services/creditApi';

// ─────────────────────────────────────────────────────────────────────────────
// Transaction type config
// ─────────────────────────────────────────────────────────────────────────────
const TX_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  CREDIT_GRANTED: { icon: 'add-circle', color: colors.success, label: 'Credits Granted' },
  LEAD_UNLOCK:    { icon: 'lock-open', color: colors.error, label: 'Lead Unlock' },
  CREDIT_REFUND:  { icon: 'refresh-circle', color: colors.info, label: 'Credit Refund' },
  BONUS_CREDIT:   { icon: 'gift', color: colors.accent, label: 'Bonus Credit' },
  PLAN_UPGRADE:   { icon: 'arrow-up-circle', color: colors.primary, label: 'Plan Upgrade' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────
const SkelBar: React.FC<{ w?: number | string; h?: number; mt?: number }> = ({ w = '100%', h = 14, mt = 0 }) => (
  <View style={{ width: w as any, height: h, borderRadius: 6, backgroundColor: colors.border + '90', marginTop: mt }} />
);

const LoadingSkeleton: React.FC = () => (
  <View style={{ padding: 16 }}>
    <View style={[styles.balanceCard, { opacity: 0.5 }]}>
      <SkelBar w="40%" h={14} />
      <SkelBar w="30%" h={32} mt={8} />
      <SkelBar w="60%" h={12} mt={8} />
    </View>
    {[0, 1, 2, 3, 4].map(i => (
      <View key={i} style={[styles.txCard, { opacity: 0.4 }]}>
        <SkelBar w={36} h={36} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <SkelBar w="50%" h={14} />
          <SkelBar w="80%" h={12} mt={4} />
        </View>
        <SkelBar w={30} h={16} />
      </View>
    ))}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Credit Balance Card
// ─────────────────────────────────────────────────────────────────────────────
const CreditBalanceCard: React.FC<{
  creditsRemaining: number;
  creditsUsed: number;
  totalCredits: number;
  isUnlimited: boolean;
  creditResetDate: string;
  planName: string;
}> = ({ creditsRemaining, creditsUsed, totalCredits, isUnlimited, creditResetDate, planName }) => {
  const displayRemaining = isUnlimited ? '∞' : String(creditsRemaining);
  const displayTotal = isUnlimited ? '∞' : String(totalCredits);
  const progress = isUnlimited ? 0 : totalCredits > 0 ? creditsUsed / totalCredits : 0;
  const resetDate = new Date(creditResetDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <View style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <View style={styles.balancePlanBadge}>
          <Ionicons name="diamond" size={14} color={colors.warning} />
          <Text style={styles.balancePlanText}>{planName.charAt(0).toUpperCase() + planName.slice(1)}</Text>
        </View>
        <Text style={styles.balanceResetText}>Resets: {resetDate}</Text>
      </View>

      <View style={styles.balanceHero}>
        <Text style={styles.balanceNumber}>{displayRemaining}</Text>
        <Text style={styles.balanceLabel}>credits remaining</Text>
      </View>

      {!isUnlimited && (
        <View style={styles.usageBarWrap}>
          <View style={styles.usageBarBg}>
            <View
              style={[
                styles.usageBarFill,
                {
                  width: `${Math.min(progress * 100, 100)}%`,
                  backgroundColor: progress > 0.8 ? colors.error : colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.usageText}>
            {creditsUsed} used / {displayTotal} total
          </Text>
        </View>
      )}

      {!isUnlimited && creditsRemaining <= 2 && creditsRemaining > 0 && (
        <View style={styles.lowWarning}>
          <Ionicons name="warning-outline" size={14} color={colors.accent} />
          <Text style={styles.lowWarningText}>Low credits — consider upgrading your plan</Text>
        </View>
      )}

      {!isUnlimited && creditsRemaining === 0 && (
        <View style={[styles.lowWarning, { backgroundColor: colors.errorLight }]}>
          <Ionicons name="alert-circle" size={14} color={colors.error} />
          <Text style={[styles.lowWarningText, { color: colors.error }]}>No credits remaining</Text>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Credit Usage Chart (mini)
// ─────────────────────────────────────────────────────────────────────────────
const CreditUsageChart: React.FC<{
  transactions: CreditTransactionItem[];
}> = ({ transactions }) => {
  const stats = useMemo(() => {
    const unlocks = transactions.filter(t => t.type === 'LEAD_UNLOCK').length;
    const refunds = transactions.filter(t => t.type === 'CREDIT_REFUND').length;
    const granted = transactions.filter(t => t.type === 'CREDIT_GRANTED').length;
    const bonus = transactions.filter(t => t.type === 'BONUS_CREDIT').length;
    return { unlocks, refunds, granted, bonus };
  }, [transactions]);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Usage Summary</Text>
      <View style={styles.chartGrid}>
        <View style={styles.chartStat}>
          <View style={[styles.chartDot, { backgroundColor: colors.error }]} />
          <Text style={styles.chartStatValue}>{stats.unlocks}</Text>
          <Text style={styles.chartStatLabel}>Unlocks</Text>
        </View>
        <View style={styles.chartStat}>
          <View style={[styles.chartDot, { backgroundColor: colors.info }]} />
          <Text style={styles.chartStatValue}>{stats.refunds}</Text>
          <Text style={styles.chartStatLabel}>Refunds</Text>
        </View>
        <View style={styles.chartStat}>
          <View style={[styles.chartDot, { backgroundColor: colors.success }]} />
          <Text style={styles.chartStatValue}>{stats.granted}</Text>
          <Text style={styles.chartStatLabel}>Granted</Text>
        </View>
        <View style={styles.chartStat}>
          <View style={[styles.chartDot, { backgroundColor: colors.accent }]} />
          <Text style={styles.chartStatValue}>{stats.bonus}</Text>
          <Text style={styles.chartStatLabel}>Bonus</Text>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Transaction Row
// ─────────────────────────────────────────────────────────────────────────────
const TransactionRow: React.FC<{ item: CreditTransactionItem }> = ({ item }) => {
  const cfg = TX_CONFIG[item.type] || TX_CONFIG.CREDIT_GRANTED;
  const isPositive = item.amount > 0;
  const dateStr = new Date(item.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.txCard}>
      <View style={[styles.txIcon, { backgroundColor: cfg.color + '18' }]}>
        <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
      </View>
      <View style={styles.txContent}>
        <Text style={styles.txType}>{cfg.label}</Text>
        <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.txDate}>{dateStr}</Text>
      </View>
      <View style={styles.txAmountWrap}>
        <Text style={[styles.txAmount, { color: isPositive ? colors.success : colors.error }]}>
          {isPositive ? '+' : ''}{item.amount}
        </Text>
        <Text style={styles.txBalance}>Bal: {item.balanceAfter >= 999999 ? '∞' : item.balanceAfter}</Text>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
const EmptyTransactions: React.FC = () => (
  <View style={styles.emptyContainer}>
    <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
    <Text style={styles.emptyTitle}>No Transactions</Text>
    <Text style={styles.emptyDesc}>Your credit transactions will appear here</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const TeacherCreditsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const {
    balance,
    transactions,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    refresh,
    retry,
    loadMore,
  } = useCredits();

  // Error state
  if (error && !isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Credits</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.errorTitle}>Unable to Load</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={retry}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const listHeader = (
    <>
      {balance && (
        <CreditBalanceCard
          creditsRemaining={balance.creditsRemaining}
          creditsUsed={balance.creditsUsed}
          totalCredits={balance.totalCredits}
          isUnlimited={balance.isUnlimited}
          creditResetDate={balance.creditResetDate}
          planName={balance.planName}
        />
      )}

      {/* Buy Credits CTA */}
      {balance && !balance.isUnlimited && (
        <TouchableOpacity
          style={styles.buyCreditsBtn}
          onPress={() => navigation.navigate('CreditPacks')}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={18} color="#FFF" />
          <Text style={styles.buyCreditsBtnText}>Buy More Credits</Text>
          <Ionicons name="chevron-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      )}

      {transactions.length > 0 && <CreditUsageChart transactions={transactions} />}

      <View style={styles.txHeader}>
        <Ionicons name="list-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.txHeaderTitle}>Transaction History</Text>
      </View>
    </>
  );

  const listFooter = isLoadingMore ? (
    <View style={{ paddingVertical: 20 }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  ) : null;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credits</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TeacherSubscription')} style={styles.upgradeBtn}>
          <Ionicons name="diamond-outline" size={18} color={colors.warning} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id || item.transactionId}
          renderItem={({ item }) => <TransactionRow item={item} />}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          ListEmptyComponent={<EmptyTransactions />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.3}
        />
      )}
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
  backBtn: {
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
  upgradeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  // Balance Card
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    ...shadows.md,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balancePlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  balancePlanText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
  },
  balanceResetText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  balanceHero: {
    alignItems: 'center',
    marginVertical: 8,
  },
  balanceNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  usageBarWrap: {
    marginTop: 12,
  },
  usageBarBg: {
    height: 8,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: 8,
    borderRadius: 4,
  },
  usageText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  lowWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent + '15',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  lowWarningText: {
    fontSize: 12,
    color: colors.accent,
    flex: 1,
  },
  // Chart Card
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    ...shadows.sm,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  chartGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chartStat: {
    alignItems: 'center',
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  chartStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  chartStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Transaction Header
  txHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  txHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  // Transaction Card
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txContent: {
    flex: 1,
    marginLeft: 12,
  },
  txType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  txDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txDate: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  txAmountWrap: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  txBalance: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 2,
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Error
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
  errorDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Buy Credits button
  buyCreditsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  buyCreditsBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
  },
});

export default TeacherCreditsScreen;
