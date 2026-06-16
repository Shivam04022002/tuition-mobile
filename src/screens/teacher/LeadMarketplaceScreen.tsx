import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import { applyToRequirement, TutorMatch } from '../../services/teacherApi';
import { useLeadMarketplace } from '../../hooks/useLeadMarketplace';

const { width } = Dimensions.get('window');

interface FilterState {
  subject: string;
  grade: string;
  board: string;
  city: string;
  minBudget: string;
  maxBudget: string;
}

const LeadMarketplaceScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectAuthToken);

  // ── API hook ────────────────────────────────────────────────────────────────
  const {
    leads,
    stats,
    isLoading: loading,
    isRefreshing: refreshing,
    isLoadingMore,
    error,
    hasMore,
    refresh: onRefresh,
    retry: loadMatches,
    loadMore,
    applyFilters,
  } = useLeadMarketplace(token);

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [filteredMatches, setFilteredMatches] = useState<TutorMatch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    subject: '',
    grade: '',
    board: '',
    city: '',
    minBudget: '',
    maxBudget: '',
  });

  // Handle session expiry
  useEffect(() => {
    if (error === 'Session expired. Please login again.') {
      dispatch(logout());
      Alert.alert('Session Expired', 'Please login again');
    }
  }, [error, dispatch]);

  // ── Client-side search + grade/board/budget filters ─────────────────────────
  // Subject, city, teachingMode are server-side via applyFilters().
  // Grade, board, minBudget, maxBudget and free-text search are applied locally
  // since the backend does not support them as query params.
  useEffect(() => {
    let result = [...leads];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(match =>
        match.requirement?.studentDetails?.studentName?.toLowerCase().includes(query) ||
        match.requirement?.subjects?.some(s => s.toLowerCase().includes(query)) ||
        match.requirement?.location?.city?.toLowerCase().includes(query)
      );
    }

    if (filters.grade) {
      result = result.filter(match =>
        match.requirement?.studentDetails?.grade?.toLowerCase().includes(filters.grade.toLowerCase())
      );
    }

    if (filters.board) {
      result = result.filter(match =>
        match.requirement?.board?.toLowerCase().includes(filters.board.toLowerCase())
      );
    }

    if (filters.minBudget) {
      const min = parseInt(filters.minBudget, 10);
      result = result.filter(match => (match.requirement?.budget?.minAmount || 0) >= min);
    }
    if (filters.maxBudget) {
      const max = parseInt(filters.maxBudget, 10);
      result = result.filter(match => (match.requirement?.budget?.maxAmount || 0) <= max);
    }

    setFilteredMatches(result);
  }, [leads, searchQuery, filters]);

  // When subject or city filter changes → send to server
  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      applyFilters({
        subject: newFilters.subject || undefined,
        city: newFilters.city || undefined,
      });
    },
    [applyFilters],
  );

  const handleApply = async (match: TutorMatch) => {
    try {
      if (!token) return;
      setApplyingId(match._id);
      await applyToRequirement(token, match.requirementId);
      Alert.alert('Success', 'Application submitted successfully');
      onRefresh();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to apply');
    } finally {
      setApplyingId(null);
    }
  };

  const clearFilters = () => {
    const empty: FilterState = {
      subject: '',
      grade: '',
      board: '',
      city: '',
      minBudget: '',
      maxBudget: '',
    };
    setFilters(empty);
    setSearchQuery('');
    applyFilters({});
  };

  const renderFilterChip = (label: string, value: string, onClear: () => void) => {
    if (!value) return null;
    return (
      <View style={[styles.filterChip, { backgroundColor: theme.colors.primary + '20' }]}>
        <Text style={[styles.filterChipText, { color: theme.colors.primary }]}>
          {label}: {value}
        </Text>
        <TouchableOpacity onPress={onClear} style={styles.clearChip}>
          <Ionicons name="close" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderMatchCard = ({ item: match }: { item: TutorMatch }) => {
    const isApplying = applyingId === match._id;
    const alreadyApplied = match.status === 'applied' || match.status === 'shortlisted' || match.status === 'hired';
    
    return (
      <Card variant="elevated" margin="small" style={styles.matchCard}>
        {/* Header with Match Score */}
        <View style={styles.matchHeader}>
          <View style={styles.studentInfo}>
            <Text style={[styles.studentName, { color: theme.colors.text }]}>
              {match.requirement?.studentDetails?.studentName || 'Student'}
            </Text>
            <Text style={[styles.gradeInfo, { color: theme.colors.textSecondary }]}>
              {match.requirement?.studentDetails?.grade} • {match.requirement?.board || 'CBSE'}
            </Text>
          </View>
          <View style={[styles.scoreContainer, { backgroundColor: theme.colors.success + '20' }]}>
            <Text style={[styles.scoreValue, { color: theme.colors.success }]}>
              {Math.round(match.overallScore)}%
            </Text>
            <Text style={[styles.scoreLabel, { color: theme.colors.success }]}>Match</Text>
          </View>
        </View>

        {/* Subject Tags */}
        <View style={styles.subjectContainer}>
          {match.requirement?.subjects?.map((subject, idx) => (
            <View 
              key={idx} 
              style={[styles.subjectTag, { backgroundColor: theme.colors.primary + '15' }]}
            >
              <Text style={[styles.subjectText, { color: theme.colors.primary }]}>
                {subject}
              </Text>
            </View>
          ))}
        </View>

        {/* Match Breakdown */}
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
              Subject
            </Text>
            <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
              {Math.round(match.breakdown?.subjectScore || 0)}%
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
              Class
            </Text>
            <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
              {Math.round(match.breakdown?.classScore || 0)}%
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
              Location
            </Text>
            <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
              {Math.round(match.breakdown?.locationScore || 0)}%
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
              Budget
            </Text>
            <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
              {Math.round(match.breakdown?.budgetScore || 0)}%
            </Text>
          </View>
        </View>

        {/* Location & Budget */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {match.requirement?.location?.city}, {match.requirement?.location?.pincode}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              ₹{match.requirement?.budget?.minAmount || 0} - ₹{match.requirement?.budget?.maxAmount || 0}/month
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {match.requirement?.schedule?.daysPerWeek} days/week • {match.requirement?.schedule?.preferredTimings?.join(', ')}
            </Text>
          </View>
        </View>

        {/* Location & Distance Info */}
        {match.distanceKm && (
          <View style={styles.distanceRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.distanceText, { color: theme.colors.text }]}>
              {match.distanceKm.toFixed(1)} km away
            </Text>
            {match.teacherServiceRadius && (
              <Text style={[styles.radiusText, { color: theme.colors.textSecondary }]}>
                (within {match.teacherServiceRadius} km radius)
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            title="View Location"
            variant="outline"
            size="small"
            onPress={() => {
              navigation.navigate('LocationMap', {
                teacherLatitude: match.teacherLocation?.latitude || 28.6139,
                teacherLongitude: match.teacherLocation?.longitude || 77.209,
                teacherName: 'Your Location',
                teacherServiceRadius: match.teacherServiceRadius || 5,
                parentLatitude: match.requirement?.location?.latitude || 28.6139,
                parentLongitude: match.requirement?.location?.longitude || 77.209,
                parentName: match.requirement?.studentDetails?.studentName || 'Student',
                distanceKm: match.distanceKm || 2.5,
                matchScore: match.overallScore,
                viewMode: 'teacher-viewing-lead',
              });
            }}
            style={{ flex: 1, marginRight: 8 }}
          />
          {alreadyApplied ? (
            <View style={[styles.appliedBadge, { backgroundColor: theme.colors.success + '20', flex: 1 }]}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <Text style={[styles.appliedText, { color: theme.colors.success }]}>
                {match.status === 'applied' ? 'Applied' : 
                 match.status === 'shortlisted' ? 'Shortlisted' : 'Hired'}
              </Text>
            </View>
          ) : (
            <Button
              title={isApplying ? "Applying..." : "Apply Now"}
              variant="primary"
              size="medium"
              loading={isApplying}
              disabled={isApplying}
              onPress={() => handleApply(match)}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Card>
    );
  };

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <Card variant="outlined" margin="small" style={styles.filtersCard}>
        <View style={styles.filterRow}>
          <View style={styles.filterInputContainer}>
            <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Subject</Text>
            <TextInput
              style={[styles.filterInput, { 
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background
              }]}
              placeholder="e.g. Mathematics"
              placeholderTextColor={theme.colors.textTertiary}
              value={filters.subject}
              onChangeText={(text) => handleFilterChange({ ...filters, subject: text })}
            />
          </View>
          <View style={styles.filterInputContainer}>
            <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Grade</Text>
            <TextInput
              style={[styles.filterInput, { 
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background
              }]}
              placeholder="e.g. Class 10"
              placeholderTextColor={theme.colors.textTertiary}
              value={filters.grade}
              onChangeText={(text) => handleFilterChange({ ...filters, grade: text })}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterInputContainer}>
            <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Board</Text>
            <TextInput
              style={[styles.filterInput, { 
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background
              }]}
              placeholder="e.g. CBSE"
              placeholderTextColor={theme.colors.textTertiary}
              value={filters.board}
              onChangeText={(text) => handleFilterChange({ ...filters, board: text })}
            />
          </View>
          <View style={styles.filterInputContainer}>
            <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>City</Text>
            <TextInput
              style={[styles.filterInput, { 
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background
              }]}
              placeholder="e.g. Mumbai"
              placeholderTextColor={theme.colors.textTertiary}
              value={filters.city}
              onChangeText={(text) => handleFilterChange({ ...filters, city: text })}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterInputContainer}>
            <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Min Budget</Text>
            <TextInput
              style={[styles.filterInput, { 
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background
              }]}
              placeholder="₹"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="numeric"
              value={filters.minBudget}
              onChangeText={(text) => handleFilterChange({ ...filters, minBudget: text })}
            />
          </View>
          <View style={styles.filterInputContainer}>
            <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Max Budget</Text>
            <TextInput
              style={[styles.filterInput, { 
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background
              }]}
              placeholder="₹"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="numeric"
              value={filters.maxBudget}
              onChangeText={(text) => handleFilterChange({ ...filters, maxBudget: text })}
            />
          </View>
        </View>

        <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
          <Text style={[styles.clearFiltersText, { color: theme.colors.error }]}>
            Clear All Filters
          </Text>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderActiveFilters = () => {
    const hasFilters = filters.subject || filters.grade || filters.board || filters.city || filters.minBudget || filters.maxBudget;
    if (!hasFilters) return null;

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.activeFiltersContainer}
        contentContainerStyle={styles.activeFiltersContent}
      >
        {renderFilterChip('Subject', filters.subject, () => handleFilterChange({ ...filters, subject: '' }))}
        {renderFilterChip('Grade', filters.grade, () => handleFilterChange({ ...filters, grade: '' }))}
        {renderFilterChip('Board', filters.board, () => handleFilterChange({ ...filters, board: '' }))}
        {renderFilterChip('City', filters.city, () => handleFilterChange({ ...filters, city: '' }))}
        {renderFilterChip('Min ₹', filters.minBudget, () => handleFilterChange({ ...filters, minBudget: '' }))}
        {renderFilterChip('Max ₹', filters.maxBudget, () => handleFilterChange({ ...filters, maxBudget: '' }))}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading leads...
        </Text>
      </View>
    );
  }

  if (error && error !== 'Session expired. Please login again.') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 16 }]}>
          {error}
        </Text>
        <Button 
          title="Retry" 
          onPress={loadMatches} 
          style={{ marginTop: 16 }}
          variant="primary"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card, paddingTop: insets.top + 8 }]}>
        <View style={[styles.searchInputContainer, { 
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border 
        }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search by subject, student, or city..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, { 
            backgroundColor: showFilters ? theme.colors.primary + '20' : theme.colors.background 
          }]} 
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name="options-outline" 
            size={24} 
            color={showFilters ? theme.colors.primary : theme.colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {renderFilters()}
      {renderActiveFilters()}

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsText, { color: theme.colors.textSecondary }]}>
          {filteredMatches.length} {filteredMatches.length === 1 ? 'lead' : 'leads'} found
        </Text>
        {stats && (
          <Text style={[styles.resultsText, { color: theme.colors.textTertiary }]}>
            {stats.availableLeads} available · {stats.highMatchLeads} high match
          </Text>
        )}
      </View>

      {/* Leads List */}
      <FlatList
        data={filteredMatches}
        renderItem={renderMatchCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Loading more leads...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No matching leads available
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Try adjusting your filters or search query
            </Text>
            <Button
              title="Clear Filters"
              variant="outline"
              size="small"
              onPress={clearFilters}
              style={{ marginTop: 16 }}
            />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersCard: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterInputContainer: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  filterInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  clearFiltersButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFiltersContainer: {
    maxHeight: 50,
    marginTop: 8,
  },
  activeFiltersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  clearChip: {
    marginLeft: 2,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 8,
    paddingBottom: 24,
  },
  matchCard: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  gradeInfo: {
    fontSize: 14,
  },
  scoreContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  subjectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  subjectTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '500',
  },
  breakdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  actionContainer: {
    marginTop: 12,
    flexDirection: 'row',
  },
  applyButton: {
    height: 44,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  radiusText: {
    fontSize: 12,
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  appliedText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default LeadMarketplaceScreen;
