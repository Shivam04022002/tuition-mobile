import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useParentContact } from '../../hooks/useContact';
import ContactHistoryCard from '../../components/parent/ContactHistoryCard';
import { ContactRequest, ContactStatus } from '../../services/contactApi';

// ── Skeleton Component ─────────────────────────────────────────────────────────

const ContactHistorySkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    {[1, 2, 3, 4].map((i) => (
      <View key={i} style={styles.skeletonCard}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonContent}>
          <View style={[styles.skeletonBar, { width: '60%', height: 16 }]} />
          <View style={[styles.skeletonBar, { width: '40%', height: 12, marginTop: 8 }]} />
          <View style={[styles.skeletonBar, { width: '80%', height: 12, marginTop: 8 }]} />
        </View>
      </View>
    ))}
  </View>
);

// ── Empty State Component ─────────────────────────────────────────────────────

const EmptyState: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name="chatbubbles-outline" size={48} color={colors.primary} />
    </View>
    <Text style={styles.emptyTitle}>No Contact Requests Yet</Text>
    <Text style={styles.emptySubtitle}>
      When you contact tutors or request demos, they will appear here.
    </Text>
    <TouchableOpacity style={styles.emptyButton} onPress={onRefresh}>
      <Text style={styles.emptyButtonText}>Refresh</Text>
    </TouchableOpacity>
  </View>
);

// ── Main Component ───────────────────────────────────────────────────────────

const ContactHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const token = useAppSelector(selectAuthToken);

  const {
    contactRequests,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    retry,
  } = useParentContact(token);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCardPress = useCallback((request: ContactRequest) => {
    // Navigate to contact request detail
    // navigation.navigate('ContactRequestDetail', { requestId: request._id });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: ContactRequest }) => (
    <ContactHistoryCard
      request={item}
      onPress={handleCardPress}
      variant="parent"
    />
  ), [handleCardPress]);

  const keyExtractor = useCallback((item: ContactRequest) => item._id, []);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isLoadingMore]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact History</Text>
          <View style={styles.headerRight} />
        </View>
        <ContactHistorySkeleton />
      </SafeAreaView>
    );
  }

  if (error && contactRequests.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact History</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load history</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact History</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={refresh}
        >
          <Ionicons name="refresh-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{contactRequests.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {contactRequests.filter(r => r.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {contactRequests.filter(r => r.status === 'accepted' || r.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Connected</Text>
        </View>
      </View>

      {/* Content */}
      {contactRequests.length === 0 ? (
        <EmptyState onRefresh={refresh} />
      ) : (
        <FlatList
          data={contactRequests}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonCard: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 10,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonBar: {
    borderRadius: 4,
    backgroundColor: colors.backgroundSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textWhite,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textWhite,
  },
});

export default React.memo(ContactHistoryScreen);
