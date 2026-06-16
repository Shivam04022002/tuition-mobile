import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useRequirementsMarketplace } from '../../hooks/useRequirementsMarketplace';
import RequirementCard from '../../components/teacher/RequirementCard';
import RequirementMatchBadge from '../../components/teacher/RequirementMatchBadge';
import RequirementSearchBar from '../../components/teacher/RequirementSearchBar';
import RequirementFilters from '../../components/teacher/RequirementFilters';
import { RequirementListItem, RequirementsFilters } from '../../services/requirementsMarketplaceApi';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { applyToRequirement } from '../../services/teacherApi';

// ── Skeleton placeholder ───────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => {
  const { colors } = useTheme();
  const shimmer = colors.border + '80';
  return (
    <View style={[styles.skeletonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonLeft}>
          <View style={[styles.skeletonLine, { width: 90, height: 10, backgroundColor: shimmer }]} />
          <View style={[styles.skeletonLine, { width: 140, height: 18, backgroundColor: shimmer, marginTop: 6 }]} />
        </View>
        <View style={[styles.skeletonBadge, { backgroundColor: shimmer }]} />
      </View>
      <View style={styles.skeletonChips}>
        {[80, 60, 70].map((w, i) => (
          <View key={i} style={[styles.skeletonChip, { width: w, backgroundColor: shimmer }]} />
        ))}
      </View>
      <View style={styles.skeletonDetails}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.skeletonDetail, { backgroundColor: shimmer }]} />
        ))}
      </View>
    </View>
  );
};

// ── Sort tab options ───────────────────────────────────────────────────────────
const SORT_TABS = [
  { key: 'newest', label: 'Newest',  icon: 'time-outline' },
  { key: 'match',  label: 'Best Match', icon: 'star-outline' },
  { key: 'budget', label: 'Highest Budget', icon: 'cash-outline' },
] as const;

// ── Filter chips summary ───────────────────────────────────────────────────────
function filterCount(f: RequirementsFilters): number {
  return [f.subject, f.board, f.grade, f.city, f.area, f.minBudget, f.maxBudget, f.mode, f.minMatch, f.postedDays]
    .filter(Boolean).length;
}

// ── Main Screen ───────────────────────────────────────────────────────────────
const TeacherRequirementsScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const token = useAppSelector(selectAuthToken);

  const {
    requirements,
    recommended,
    pagination,
    isLoading,
    isRefreshing,
    isLoadingMore,
    isLoadingRecommended,
    error,
    hasMore,
    currentFilters,
    refresh,
    retry,
    loadMore,
    applyFilters,
    clearFilters,
  } = useRequirementsMarketplace();

  const [search, setSearch]               = useState('');
  const [showFilters, setShowFilters]     = useState(false);
  const [activeSort, setActiveSort]       = useState<'newest' | 'match' | 'budget'>('newest');
  const [applyingId, setApplyingId]       = useState<string | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Search debounce ────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      applyFilters({ ...currentFilters, search: text || undefined, sortBy: activeSort });
    }, 400);
  }, [applyFilters, currentFilters, activeSort]);

  const handleSearchClear = useCallback(() => {
    setSearch('');
    applyFilters({ ...currentFilters, search: undefined, sortBy: activeSort });
  }, [applyFilters, currentFilters, activeSort]);

  // ── Sort change ────────────────────────────────────────────────────────────
  const handleSortChange = useCallback((sort: 'newest' | 'match' | 'budget') => {
    setActiveSort(sort);
    applyFilters({ ...currentFilters, search: search || undefined, sortBy: sort });
  }, [applyFilters, currentFilters, search]);

  // ── Filters apply ──────────────────────────────────────────────────────────
  const handleFiltersApply = useCallback((filters: RequirementsFilters) => {
    const withSearch = search.trim() ? { ...filters, search: search.trim() } : filters;
    const withSort   = { ...withSearch, sortBy: (filters.sortBy || activeSort) as 'newest' | 'match' | 'budget' };
    setActiveSort(withSort.sortBy);
    applyFilters(withSort);
  }, [applyFilters, search, activeSort]);

  // ── Navigate to detail ─────────────────────────────────────────────────────
  const handleCardPress = useCallback((item: RequirementListItem) => {
    navigation.navigate('RequirementDetail', { requirementId: item.requirementId, item });
  }, [navigation]);

  // ── Quick apply ────────────────────────────────────────────────────────────
  const handleApply = useCallback(async (item: RequirementListItem) => {
    if (!token || applyingId) return;
    try {
      setApplyingId(item._id);
      await applyToRequirement(token, item._id);
      Alert.alert('Applied!', 'Your application has been submitted successfully.');
      refresh();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to apply. Please try again.');
    } finally {
      setApplyingId(null);
    }
  }, [token, applyingId, refresh]);

  // ── Analytics logging ──────────────────────────────────────────────────────
  const logAnalytics = useCallback((event: string, data?: object) => {
    if (__DEV__) console.log(`[ReqMarket] ${event}`, data);
  }, []);

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderSortTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.sortTabsScroll}
      contentContainerStyle={styles.sortTabsContent}
    >
      {SORT_TABS.map(tab => {
        const active = activeSort === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.sortTab,
              {
                backgroundColor: active ? colors.primary : colors.background,
                borderColor:     active ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleSortChange(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={14}
              color={active ? '#FFF' : colors.textSecondary}
            />
            <Text style={[styles.sortTabLabel, { color: active ? '#FFF' : colors.textSecondary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderRecommendedSection = () => {
    if (isLoadingRecommended || recommended.length === 0) return null;
    return (
      <View style={styles.recommendedSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="star" size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended For You</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendedScrollContent}
        >
          {recommended.map(item => (
            <TouchableOpacity
              key={item._id}
              style={[styles.recommendedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                logAnalytics('Requirement Viewed', { requirementId: item.requirementId, source: 'recommended' });
                handleCardPress(item);
              }}
            >
              <View style={styles.recommendedCardHeader}>
                <Text style={[styles.recommendedGrade, { color: colors.text }]} numberOfLines={1}>
                  {item.studentDetails.grade} • {item.studentDetails.board}
                </Text>
                <RequirementMatchBadge score={item.matchScore} size="small" />
              </View>
              <Text style={[styles.recommendedSubjects, { color: colors.primary }]} numberOfLines={1}>
                {item.subjects.slice(0, 2).join(', ')}{item.subjects.length > 2 ? '…' : ''}
              </Text>
              <Text style={[styles.recommendedCity, { color: colors.textSecondary }]}>
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                {' '}{item.location.city}
              </Text>
              <Text style={[styles.recommendedBudget, { color: colors.text }]}>
                ₹{item.budget.minAmount.toLocaleString()}–₹{item.budget.maxAmount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderActiveFilterChips = () => {
    const active: { key: keyof RequirementsFilters; label: string }[] = [];
    if (currentFilters.subject)    active.push({ key: 'subject',    label: currentFilters.subject });
    if (currentFilters.board)      active.push({ key: 'board',      label: currentFilters.board });
    if (currentFilters.grade)      active.push({ key: 'grade',      label: currentFilters.grade });
    if (currentFilters.city)       active.push({ key: 'city',       label: currentFilters.city });
    if (currentFilters.area)       active.push({ key: 'area',       label: currentFilters.area });
    if (currentFilters.mode)       active.push({ key: 'mode',       label: currentFilters.mode });
    if (currentFilters.minMatch)   active.push({ key: 'minMatch',   label: `≥${currentFilters.minMatch}% match` });
    if (currentFilters.minBudget)  active.push({ key: 'minBudget',  label: `Min ₹${currentFilters.minBudget}` });
    if (currentFilters.maxBudget)  active.push({ key: 'maxBudget',  label: `Max ₹${currentFilters.maxBudget}` });
    if (currentFilters.postedDays) active.push({ key: 'postedDays', label: `Last ${currentFilters.postedDays}d` });

    if (active.length === 0) return null;
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.activeChipsScroll}
        contentContainerStyle={styles.activeChipsContent}
      >
        {active.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.activeChip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
            onPress={() => {
              const updated = { ...currentFilters, [key]: undefined };
              applyFilters(updated);
            }}
          >
            <Text style={[styles.activeChipText, { color: colors.primary }]}>{label}</Text>
            <Ionicons name="close" size={13} color={colors.primary} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.activeChip, { backgroundColor: colors.error + '18', borderColor: colors.error + '40' }]}
          onPress={() => {
            setSearch('');
            clearFilters();
          }}
        >
          <Text style={[styles.activeChipText, { color: colors.error }]}>Clear All</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderHeader = () => (
    <View>
      {renderRecommendedSection()}
      {renderSortTabs()}
      {renderActiveFilterChips()}
      <View style={[styles.resultsBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {pagination ? `${pagination.total} requirements` : '—'}
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Loading more…</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Matching Requirements
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Update your profile preferences to get better matches, or adjust your search filters.
        </Text>
        <TouchableOpacity
          style={[styles.emptyBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary }]}
          onPress={() => {
            setSearch('');
            clearFilters();
          }}
        >
          <Text style={[styles.emptyBtnText, { color: colors.primary }]}>Clear Filters</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ── Full-page states ────────────────────────────────────────────────────────
  if (isLoading && requirements.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: colors.card }]}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Requirements</Text>
        </View>
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  if (error && requirements.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.text, marginTop: 16 }]}>
          Unable to load requirements
        </Text>
        <Text style={[styles.errorSub, { color: colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={retry}
        >
          <Ionicons name="refresh" size={18} color="#FFF" />
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: colors.card }]}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Requirements</Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
          Browse parent requirements
        </Text>
      </View>

      {/* Search */}
      <RequirementSearchBar
        value={search}
        onChangeText={text => {
          handleSearchChange(text);
          logAnalytics('Search Used', { query: text });
        }}
        onClear={handleSearchClear}
        onFilterPress={() => {
          logAnalytics('Filter Applied');
          setShowFilters(true);
        }}
        filterActive={filterCount(currentFilters) > 0}
      />

      {/* Main Feed */}
      <FlatList
        data={requirements}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <RequirementCard
            item={item}
            onPress={r => {
              logAnalytics('Requirement Viewed', { requirementId: r.requirementId });
              handleCardPress(r);
            }}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
      />

      {/* Filter Modal */}
      <RequirementFilters
        visible={showFilters}
        currentFilters={currentFilters}
        onApply={filters => {
          logAnalytics('Filter Applied', filters);
          handleFiltersApply(filters);
        }}
        onClose={() => setShowFilters(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  // Sort tabs
  sortTabsScroll: {
    marginTop: 12,
  },
  sortTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sortTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortTabLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Active filter chips
  activeChipsScroll: {
    marginTop: 10,
  },
  activeChipsContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  activeChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Results bar
  resultsBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Recommended section
  recommendedSection: {
    paddingTop: 16,
    paddingBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  recommendedScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  recommendedCard: {
    width: 180,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  recommendedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  recommendedGrade: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  recommendedSubjects: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  recommendedCity: {
    fontSize: 12,
    marginBottom: 4,
  },
  recommendedBudget: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  // List
  listContent: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Error
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 24,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Skeleton
  skeletonList: {
    paddingTop: 12,
  },
  skeletonCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skeletonLeft: {
    flex: 1,
  },
  skeletonBadge: {
    width: 56,
    height: 48,
    borderRadius: 10,
  },
  skeletonLine: {
    borderRadius: 6,
  },
  skeletonChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  skeletonChip: {
    height: 26,
    borderRadius: 13,
  },
  skeletonDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skeletonDetail: {
    width: '45%',
    height: 14,
    borderRadius: 6,
  },
});

export default TeacherRequirementsScreen;
