import React, { useCallback } from 'react';
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
import { usePaymentHistory } from '../../hooks/usePaymentHistory';
import { PaymentHistoryItem } from '../../services/paymentApi';
import { EmptyState } from '../../components/ui';
import Card from '../../components/common/Card';

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
  completed: colors.success,
  pending: colors.warning,
  failed: colors.error,
  refunded: colors.info,
  partially_refunded: colors.secondary,
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded',
  partially_refunded: 'Partial Refund',
};

// Payment type labels
const TYPE_LABELS: Record<string, string> = {
  lead_unlock: 'Lead Unlock',
  subscription: 'Subscription',
  featured_profile: 'Featured Profile',
  verification: 'Verification',
  refund: 'Refund',
};

// Format date to "15 Jun 2026"
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Format amount to "₹352.82"
const formatAmount = (amount: number): string => {
  return `₹${amount.toFixed(2)}`;
};

// Truncate payment ID
const truncateId = (id: string): string => {
  if (id.length <= 12) return id;
  return `${id.substring(0, 8)}...`;
};

// Payment Item Component
const PaymentItem: React.FC<{ item: PaymentHistoryItem }> = ({ item }) => {
  const statusColor = STATUS_COLORS[item.status] || colors.textTertiary;
  const statusLabel = STATUS_LABELS[item.status] || item.status;
  const description =
    item.invoiceDetails?.items?.[0]?.description ||
    TYPE_LABELS[item.type] ||
    item.type;

  return (
    <Card variant="outlined" margin="small" style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentIdContainer}>
          <Ionicons name="receipt-outline" size={16} color={colors.primary} />
          <Text style={styles.paymentId}>{truncateId(item.paymentId)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.paymentBody}>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.date}>{formatDate(item.paymentDate || item.createdAt)}</Text>
      </View>

      <View style={styles.paymentFooter}>
        <Text style={styles.amount}>{formatAmount(item.totalAmount)}</Text>
        {item.invoiceDetails?.invoiceNumber && (
          <TouchableOpacity style={styles.invoiceButton} activeOpacity={0.7}>
            <Ionicons name="document-text-outline" size={14} color={colors.info} />
            <Text style={styles.invoiceText}>Invoice</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

// Loading Skeleton
const LoadingSkeleton: React.FC = () => (
  <View style={styles.container}>
    <View style={styles.header}>
      <View style={styles.skeletonLine} />
    </View>
    {[1, 2, 3, 4, 5].map((i) => (
      <Card key={i} variant="outlined" margin="small" style={[styles.paymentCard, { opacity: 0.5 }]}>
        <View style={styles.skeletonRow}>
          <View style={[styles.skeletonLine, { width: 100 }]} />
          <View style={[styles.skeletonLine, { width: 80 }]} />
        </View>
        <View style={[styles.skeletonLine, { width: '70%', marginTop: 12 }]} />
        <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
      </Card>
    ))}
  </View>
);

// Main Screen
const ParentPaymentHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

  const {
    payments,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    retry,
  } = usePaymentHistory();

  // Render item callback
  const renderItem = useCallback(({ item }: { item: PaymentHistoryItem }) => {
    return <PaymentItem item={item} />;
  }, []);

  // Key extractor
  const keyExtractor = useCallback((item: PaymentHistoryItem) => item.paymentId, []);

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment History</Text>
          <View style={styles.placeholder} />
        </View>
        <EmptyState
          icon="alert-circle-outline"
          title="Failed to load"
          description={error}
          ctaLabel="Retry"
          onCta={retry}
          iconColor={colors.error}
        />
      </View>
    );
  }

  // Empty state
  if (payments.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment History</Text>
          <View style={styles.placeholder} />
        </View>
        <EmptyState
          icon="receipt-outline"
          title="No payments yet"
          description="Your payment history will appear here once you make a transaction"
          iconColor={colors.textTertiary}
        />
      </View>
    );
  }

  // Success state with list
  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Payments List */}
      <FlatList
        data={payments}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />
        }
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
      />
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  paymentCard: {
    padding: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentId: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentBody: {
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.info + '15',
  },
  invoiceText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.info,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Skeleton styles
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonLine: {
    height: 14,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
});

export default ParentPaymentHistoryScreen;
