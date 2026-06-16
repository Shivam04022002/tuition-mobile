import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { useRecommendationsList } from '../../hooks/useRecommendations';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { PrimaryButton } from '../../components/ui';
import TutorCard from '../../components/parent/TutorCard';
import type { RecommendedTutor, SortOption, TeachingMode } from '../../services/recommendationApi';

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'match', label: 'Best Match', icon: 'star' },
  { value: 'rating', label: 'Highest Rated', icon: 'star-half' },
  { value: 'experience', label: 'Most Experienced', icon: 'briefcase' },
  { value: 'nearest', label: 'Nearest', icon: 'location' },
  { value: 'newest', label: 'Newest', icon: 'time' },
];

// ─── Filter Modal Component ───────────────────────────────────────────────────

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: any;
  onApply: (filters: any) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Tutors</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Subject</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="e.g., Mathematics"
                value={localFilters.subject || ''}
                onChangeText={(text) => setLocalFilters({ ...localFilters, subject: text })}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Class</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="e.g., Class 10"
                value={localFilters.class || ''}
                onChangeText={(text) => setLocalFilters({ ...localFilters, class: text })}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Gender Preference</Text>
              <View style={styles.genderOptions}>
                {(['any', 'male', 'female'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderOption,
                      (localFilters.gender === g || (g === 'any' && !localFilters.gender)) && styles.genderOptionActive,
                    ]}
                    onPress={() => setLocalFilters({ ...localFilters, gender: g === 'any' ? undefined : g })}
                  >
                    <Text style={[(localFilters.gender === g || (g === 'any' && !localFilters.gender)) && styles.genderOptionTextActive]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Minimum Experience</Text>
              <View style={styles.experienceOptions}>
                {[0, 1, 2, 5, 10].map((years) => (
                  <TouchableOpacity
                    key={years}
                    style={[styles.experienceOption, localFilters.minExperience === years && styles.experienceOptionActive]}
                    onPress={() => setLocalFilters({ ...localFilters, minExperience: years === 0 ? undefined : years })}
                  >
                    <Text style={[localFilters.minExperience === years && styles.experienceOptionTextActive]}>
                      {years === 0 ? 'Any' : `${years}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Minimum Rating</Text>
              <View style={styles.ratingOptions}>
                {[0, 3, 3.5, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[styles.ratingOption, localFilters.minRating === rating && styles.ratingOptionActive]}
                    onPress={() => setLocalFilters({ ...localFilters, minRating: rating === 0 ? undefined : rating })}
                  >
                    <Text style={[localFilters.minRating === rating && styles.ratingOptionTextActive]}>
                      {rating === 0 ? 'Any' : `${rating}+`}
                    </Text>
                    {rating > 0 && <Ionicons name="star" size={12} color="#F59E0B" style={styles.ratingIcon} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Teaching Mode</Text>
              <View style={styles.modeOptions}>
                {[
                  { value: undefined, label: 'Any' },
                  { value: 'online', label: 'Online' },
                  { value: 'offline', label: 'Offline' },
                  { value: 'hybrid', label: 'Hybrid' },
                ].map((m) => (
                  <TouchableOpacity
                    key={m.label}
                    style={[styles.modeOption, localFilters.mode === m.value && styles.modeOptionActive]}
                    onPress={() => setLocalFilters({ ...localFilters, mode: m.value })}
                  >
                    <Text style={[localFilters.mode === m.value && styles.modeOptionTextActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>City</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="e.g., Mumbai"
                value={localFilters.city || ''}
                onChangeText={(text) => setLocalFilters({ ...localFilters, city: text })}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.clearButton} onPress={() => setLocalFilters({})}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={() => { onApply(localFilters); onClose(); }}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Sort Modal Component ─────────────────────────────────────────────────────

const SortModal: React.FC<{ visible: boolean; onClose: () => void; currentSort: SortOption; onSelect: (sort: SortOption) => void }> = ({ visible, onClose, currentSort, onSelect }) => {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.sortOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.sortContent}>
          <Text style={styles.sortTitle}>Sort By</Text>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.sortOption, currentSort === option.value && styles.sortOptionActive]}
              onPress={() => { onSelect(option.value); onClose(); }}
            >
              <Ionicons name={option.icon as any} size={18} color={currentSort === option.value ? colors.primary : colors.textSecondary} />
              <Text style={[styles.sortOptionText, currentSort === option.value && styles.sortOptionTextActive]}>{option.label}</Text>
              {currentSort === option.value && <Ionicons name="checkmark" size={18} color={colors.primary} style={styles.sortCheck} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Empty State Component ───────────────────────────────────────────────────

const EmptyState: React.FC<{ onCreateRequirement: () => void }> = ({ onCreateRequirement }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIcon}>
      <Ionicons name="search-outline" size={48} color={colors.primary} />
    </View>
    <Text style={styles.emptyTitle}>No Recommended Tutors Yet</Text>
    <Text style={styles.emptySubtitle}>Try creating a requirement first to get personalized tutor recommendations</Text>
    <PrimaryButton label="Post a Requirement" onPress={onCreateRequirement} style={styles.emptyButton} />
  </View>
);

// ─── Main Screen Component ───────────────────────────────────────────────────

const RecommendedTutorsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const token = useAppSelector(selectAuthToken);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const { tutors, isLoading, isRefreshing, isLoadingMore, error, hasMore, sortBy, filters, refresh, loadMore, retry, setFilters, setSortBy } = useRecommendationsList(token, {}, 'match');

  const filteredTutors = useMemo(() => {
    if (!searchQuery.trim()) return tutors;
    const query = searchQuery.toLowerCase();
    return tutors.filter((tutor) => {
      const teacher = tutor.teacherProfileId;
      const name = teacher?.basicDetails?.fullName?.toLowerCase() || '';
      const subjects = teacher?.teachingDetails?.subjects?.join(' ').toLowerCase() || '';
      const city = teacher?.locationAvailability?.city?.toLowerCase() || '';
      return name.includes(query) || subjects.includes(query) || city.includes(query);
    });
  }, [tutors, searchQuery]);

  const handleTutorPress = useCallback((tutor: RecommendedTutor) => {
    navigation.navigate('TutorProfile', { tutorId: tutor._id, matchId: tutor.matchId });
  }, [navigation]);

  const handleContact = useCallback((tutor: RecommendedTutor) => {
    navigation.navigate('TutorProfile', { tutorId: tutor._id, matchId: tutor.matchId, showContact: true });
  }, [navigation]);

  const handleCreateRequirement = useCallback(() => {
    navigation.navigate('ParentRequirementForm', { mode: 'create' });
  }, [navigation]);

  const activeFilterCount = useMemo(() => Object.values(filters).filter((v) => v !== undefined && v !== '').length, [filters]);

  const renderTutorCard = useCallback(({ item }: { item: RecommendedTutor }) => (
    <TutorCard tutor={item} onPress={handleTutorPress} onContact={handleContact} />
  ), [handleTutorPress, handleContact]);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return <View style={styles.footerLoader}><Text style={styles.footerLoaderText}>Loading more...</Text></View>;
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recommended Tutors</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonRow}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonText}>
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error && !tutors.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recommended Tutors</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load recommendations</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <PrimaryButton label="Retry" onPress={retry} style={styles.errorButton} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommended Tutors</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, subject, or city..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={18} color={activeFilterCount > 0 ? colors.primary : colors.text} />
          <Text style={[styles.filterButtonText, activeFilterCount > 0 && styles.filterButtonTextActive]}>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </TouchableOpacity>
        <View style={styles.filterDivider} />
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowSort(true)}>
          <Ionicons name="swap-vertical-outline" size={18} color={colors.text} />
          <Text style={styles.filterButtonText}>{SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Sort'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>{filteredTutors.length} tutor{filteredTutors.length !== 1 ? 's' : ''} found</Text>
      </View>

      {filteredTutors.length === 0 && !isLoading ? (
        searchQuery ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.noResultsText}>No tutors match your search</Text>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>Clear search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={[]}
            renderItem={null}
            ListEmptyComponent={<EmptyState onCreateRequirement={handleCreateRequirement} />}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />}
          />
        )
      ) : (
        <FlatList
          data={filteredTutors}
          renderItem={renderTutorCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}

      <FilterModal visible={showFilters} onClose={() => setShowFilters(false)} filters={filters} onApply={setFilters} />
      <SortModal visible={showSort} onClose={() => setShowSort(false)} currentSort={sortBy} onSelect={setSortBy} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  headerRight: { width: 40 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.card },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, height: 44 },
  filterBar: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  filterButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  filterButtonTextActive: { color: colors.primary },
  filterDivider: { width: 1, backgroundColor: colors.border, marginVertical: 8 },
  resultsInfo: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.background },
  resultsText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  listContent: { paddingHorizontal: 16, paddingVertical: 8 },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  footerLoaderText: { fontSize: 14, color: colors.textSecondary },
  // Empty State
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 80 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  emptyButton: { minWidth: 200 },
  // Error State
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8 },
  errorSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  errorButton: { minWidth: 120 },
  // No Results
  noResultsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  noResultsText: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8 },
  clearSearchText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  // Skeleton
  skeletonContainer: { padding: 16 },
  skeletonCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, height: 160 },
  skeletonRow: { flexDirection: 'row', gap: 12 },
  skeletonAvatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.border },
  skeletonText: { flex: 1, gap: 8, justifyContent: 'center' },
  skeletonLine: { height: 16, backgroundColor: colors.border, borderRadius: 4, width: '80%' },
  skeletonLineShort: { width: '50%' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalBody: { paddingHorizontal: 20, paddingVertical: 16 },
  modalFooter: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border },
  clearButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  clearButtonText: { fontSize: 15, fontWeight: '600', color: colors.text },
  applyButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  applyButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  // Filter Sections
  filterSection: { marginBottom: 20 },
  filterLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 10 },
  filterInput: { backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text },
  // Gender Options
  genderOptions: { flexDirection: 'row', gap: 10 },
  genderOption: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center' },
  genderOptionActive: { backgroundColor: colors.primary + '15' },
  genderOptionTextActive: { color: colors.primary, fontWeight: '600' },
  // Experience Options
  experienceOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  experienceOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.background },
  experienceOptionActive: { backgroundColor: colors.primary + '15' },
  experienceOptionTextActive: { color: colors.primary, fontWeight: '600' },
  // Rating Options
  ratingOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ratingOption: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.background },
  ratingOptionActive: { backgroundColor: colors.primary + '15' },
  ratingOptionTextActive: { color: colors.primary, fontWeight: '600' },
  ratingIcon: { marginLeft: 2 },
  // Mode Options
  modeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modeOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.background },
  modeOptionActive: { backgroundColor: colors.primary + '15' },
  modeOptionTextActive: { color: colors.primary, fontWeight: '600' },
  // Sort Modal
  sortOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sortContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingVertical: 16 },
  sortTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  sortOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderRadius: 12 },
  sortOptionActive: { backgroundColor: colors.primary + '10' },
  sortOptionText: { flex: 1, fontSize: 15, color: colors.text },
  sortOptionTextActive: { fontWeight: '600', color: colors.primary },
  sortCheck: { marginLeft: 'auto' },
});

export default RecommendedTutorsScreen;
