import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { useTutorSearch } from '../../hooks/useTutorSearch';
import { useTutorFilters } from '../../hooks/useTutorFilters';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import SearchBar from '../../components/search/SearchBar';
import RecentSearches from '../../components/search/RecentSearches';
import { FilterModal, ActiveFilterChips } from '../../components/filters';
import TutorCard from '../../components/parent/TutorCard';
import { PrimaryButton } from '../../components/ui';
import { SearchTutor } from '../../services/tutorSearchApi';
import { FilterParams } from '../../services/tutorFilterApi';

// ─── Tutor Card Wrapper for Search Results ───────────────────────────────────

interface SearchTutorCardProps {
  tutor: SearchTutor;
  onPress: (tutor: SearchTutor) => void;
  onContact: (tutor: SearchTutor) => void;
}

const SearchTutorCard: React.FC<SearchTutorCardProps> = ({ tutor, onPress, onContact }) => {
  // Convert SearchTutor to RecommendedTutor format for TutorCard
  const mappedTutor = {
    _id: tutor._id,
    matchId: tutor._id,
    matchPercentage: 0, // No match percentage in search
    teacherId: {
      _id: tutor._id,
    },
    teacherProfileId: {
      _id: tutor._id,
      basicDetails: tutor.basicDetails,
      teachingDetails: tutor.teachingDetails,
      education: tutor.education,
      locationAvailability: tutor.locationAvailability,
      pricingRevenue: tutor.pricingRevenue,
      stats: tutor.stats,
      bio: tutor.bio,
      verificationStatus: tutor.verificationStatus,
    },
    breakdown: {
      subjectScore: 0,
      classScore: 0,
      locationScore: 0,
      modeScore: 0,
      experienceScore: 0,
      ratingScore: 0,
    },
    status: 'recommended' as const,
  };

  return (
    <TutorCard
      tutor={mappedTutor}
      onPress={() => onPress(tutor)}
      onContact={() => onContact(tutor)}
    />
  );
};

// ─── Loading Skeleton ──────────────────────────────────────────────────────

const TutorSkeleton: React.FC = () => (
  <View style={[styles.skeletonCard, shadows.card]}>
    <View style={styles.skeletonRow}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonInfo}>
        <View style={[styles.skeletonLine, { width: '60%' }]} />
        <View style={[styles.skeletonLine, { width: '40%' }]} />
      </View>
    </View>
    <View style={styles.skeletonChips}>
      <View style={[styles.skeletonChip, { width: 80 }]} />
      <View style={[styles.skeletonChip, { width: 100 }]} />
    </View>
  </View>
);

// ─── Empty State ───────────────────────────────────────────────────────────

const NoResultsState: React.FC<{ onClear: () => void }> = ({ onClear }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIcon}>
      <Ionicons name="search-outline" size={48} color={colors.primary} />
    </View>
    <Text style={styles.emptyTitle}>No tutors found</Text>
    <Text style={styles.emptySubtitle}>Try another keyword or check your spelling</Text>
    <PrimaryButton label="Clear Search" onPress={onClear} variant="outline" style={styles.emptyButton} />
  </View>
);

// ─── Error State ────────────────────────────────────────────────────────────

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
    <Text style={styles.errorTitle}>Unable to search tutors</Text>
    <Text style={styles.errorSubtitle}>{message}</Text>
    <PrimaryButton label="Retry" onPress={onRetry} style={styles.emptyButton} />
  </View>
);

// ─── Main Screen Component ──────────────────────────────────────────────────

const TutorSearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const token = useAppSelector(selectAuthToken);
  const [showFilterModal, setShowFilterModal] = React.useState(false);

  const {
    query,
    setQuery,
    searchState,
    tutors,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    refresh,
    loadMore,
    retry,
    clearSearch,
    recentSearches,
    removeFromHistory,
    clearHistory,
    trackTutorOpen,
  } = useTutorSearch(token);

  // Use tutor filters hook
  const {
    filters,
    activeFilterCount,
    setFilters,
    clearFilter,
    resetFilters,
    applyFilters,
  } = useTutorFilters(token);

  const handleTutorPress = useCallback(
    (tutor: SearchTutor) => {
      trackTutorOpen(tutor._id);
      navigation.navigate('TutorProfile', { tutorId: tutor._id });
    },
    [navigation, trackTutorOpen]
  );

  const handleContact = useCallback(
    (tutor: SearchTutor) => {
      trackTutorOpen(tutor._id);
      navigation.navigate('TutorProfile', { tutorId: tutor._id, showContact: true });
    },
    [navigation, trackTutorOpen]
  );

  const handleRecentSearchSelect = useCallback(
    (search: string) => {
      setQuery(search);
    },
    [setQuery]
  );

  const renderTutor = useCallback(
    ({ item }: { item: SearchTutor }) => (
      <SearchTutorCard tutor={item} onPress={handleTutorPress} onContact={handleContact} />
    ),
    [handleTutorPress, handleContact]
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  const showRecentSearches = searchState === 'idle' && recentSearches.length > 0;
  const showResults = searchState === 'results' || searchState === 'loading';
  const showNoResults = searchState === 'noResults';
  const showError = searchState === 'error';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Tutors</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar with Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchBarWrapper}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              onClear={clearSearch}
              autoFocus
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFilterCount > 0 ? colors.primary : colors.text}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filter Chips */}
        <ActiveFilterChips
          filters={filters}
          onRemoveFilter={clearFilter}
          onClearAll={resetFilters}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {showRecentSearches && (
          <RecentSearches
            searches={recentSearches}
            onSelect={handleRecentSearchSelect}
            onRemove={removeFromHistory}
            onClearAll={clearHistory}
          />
        )}

        {showResults && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                {isLoading ? 'Searching...' : `${total} tutor${total !== 1 ? 's' : ''} found`}
              </Text>
              {query && !isLoading && (
                <Text style={styles.resultsQuery} numberOfLines={1}>
                  for "{query}"
                </Text>
              )}
            </View>

            {isLoading && tutors.length === 0 ? (
              <View style={styles.skeletonContainer}>
                <TutorSkeleton />
                <TutorSkeleton />
                <TutorSkeleton />
              </View>
            ) : (
              <FlatList
                data={tutors}
                renderItem={renderTutor}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
              />
            )}
          </>
        )}

        {showNoResults && <NoResultsState onClear={clearSearch} />}

        {showError && <ErrorState message={error || 'Something went wrong'} onRetry={retry} />}
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        filters={filters}
        onClose={() => setShowFilterModal(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          applyFilters();
        }}
        onReset={resetFilters}
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
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  searchBarWrapper: {
    flex: 1,
  },
  filterButton: {
    width: 44,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // Results Header
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  resultsQuery: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  // Skeleton
  skeletonContainer: {
    paddingTop: 8,
  },
  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.border,
  },
  skeletonInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  skeletonChips: {
    flexDirection: 'row',
    gap: 8,
  },
  skeletonChip: {
    height: 28,
    backgroundColor: colors.border,
    borderRadius: 14,
  },
  // List
  listContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
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
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 160,
  },
  // Error State
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
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
});

export default TutorSearchScreen;
