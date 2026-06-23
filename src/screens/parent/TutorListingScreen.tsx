import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { createShortlist, removeShortlist, checkIsShortlisted } from '../../services/shortlistApi';

const { width } = Dimensions.get('window');

interface Tutor {
  id: string;
  name: string;
  profileImage: string;
  verified: boolean;
  subjects: string[];
  classes: string[];
  rating: number;
  totalReviews: number;
  experience: number;
  price: number;
  distance: number;
  responseTime: string;
  responseRate: number;
  teachingModes: string[];
  languages: string[];
  about: string;
  achievements: string[];
  // Shortlist-related fields (not part of Tutor interface, managed separately)
  userId?: string; // The teacher's User._id for shortlist API
}

interface FilterOptions {
  subjects: string[];
  classes: string[];
  priceRange: [number, number];
  distance: number;
  verifiedOnly: boolean;
  teachingMode: string;
}

const TutorListingScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const token = useAppSelector(selectAuthToken);
  
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    subjects: [],
    classes: [],
    priceRange: [0, 2000],
    distance: 10,
    verifiedOnly: false,
    teachingMode: 'all',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [savingTutorId, setSavingTutorId] = useState<string | null>(null);
  const [savedTutors, setSavedTutors] = useState<Record<string, string>>({}); // tutorId -> shortlistId

  // Mock data
  const mockTutors: Tutor[] = [
    {
      id: '1',
      name: 'Priya Sharma',
      profileImage: 'https://via.placeholder.com/80',
      verified: true,
      subjects: ['Mathematics', 'Physics'],
      classes: ['Class 10', 'Class 11'],
      rating: 4.8,
      totalReviews: 156,
      experience: 5,
      price: 500,
      distance: 2.5,
      responseTime: '30 min',
      responseRate: 95,
      teachingModes: ['Home', 'Online'],
      languages: ['English', 'Hindi'],
      about: 'Experienced tutor with focus on conceptual understanding...',
      achievements: ['Top Rated', 'Fast Responder'],
      userId: 'teacher_user_id_1',
    },
    {
      id: '2',
      name: 'Rahul Verma',
      profileImage: 'https://via.placeholder.com/80',
      verified: true,
      subjects: ['Chemistry', 'Biology'],
      classes: ['Class 9', 'Class 10'],
      rating: 4.9,
      totalReviews: 203,
      experience: 7,
      price: 600,
      distance: 3.2,
      responseTime: '15 min',
      responseRate: 98,
      teachingModes: ['Online', 'Group'],
      languages: ['English', 'Hindi', 'Punjabi'],
      about: 'Specialized in Science subjects with practical approach...',
      achievements: ['Expert Tutor', '100+ Students'],
      shortlisted: true,
    },
    {
      id: '3',
      name: 'Anjali Patel',
      profileImage: 'https://via.placeholder.com/80',
      verified: false,
      subjects: ['English', 'History'],
      classes: ['Class 8', 'Class 9'],
      rating: 4.7,
      totalReviews: 89,
      experience: 4,
      price: 450,
      distance: 1.8,
      responseTime: '45 min',
      responseRate: 88,
      teachingModes: ['Home'],
      languages: ['English', 'Gujarati'],
      about: 'Language expert with creative teaching methods...',
      achievements: ['Good Communication'],
      shortlisted: false,
    },
    {
      id: '4',
      name: 'Vikram Singh',
      profileImage: 'https://via.placeholder.com/80',
      verified: true,
      subjects: ['Mathematics', 'Science'],
      classes: ['Class 6', 'Class 7'],
      rating: 4.6,
      totalReviews: 67,
      experience: 3,
      price: 400,
      distance: 4.1,
      responseTime: '1 hour',
      responseRate: 82,
      teachingModes: ['Online'],
      languages: ['English', 'Hindi'],
      about: 'Young and energetic tutor making learning fun...',
      achievements: ['New Tutor'],
      userId: 'teacher_user_id_4',
    },
  ];

  useEffect(() => {
    setTutors(mockTutors);
    setFilteredTutors(mockTutors);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, sortBy, tutors]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const applyFilters = () => {
    let filtered = [...tutors];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(tutor =>
        tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.subjects.some(subject => subject.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Subject filter
    if (filters.subjects.length > 0) {
      filtered = filtered.filter(tutor =>
        tutor.subjects.some(subject => filters.subjects.includes(subject))
      );
    }

    // Class filter
    if (filters.classes.length > 0) {
      filtered = filtered.filter(tutor =>
        tutor.classes.some(cls => filters.classes.includes(cls))
      );
    }

    // Price filter
    filtered = filtered.filter(tutor =>
      tutor.price >= filters.priceRange[0] && tutor.price <= filters.priceRange[1]
    );

    // Distance filter
    filtered = filtered.filter(tutor => tutor.distance <= filters.distance);

    // Verified only filter
    if (filters.verifiedOnly) {
      filtered = filtered.filter(tutor => tutor.verified);
    }

    // Teaching mode filter
    if (filters.teachingMode !== 'all') {
      filtered = filtered.filter(tutor =>
        tutor.teachingModes.includes(filters.teachingMode)
      );
    }

    // Sorting
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'distance':
        filtered.sort((a, b) => a.distance - b.distance);
        break;
      case 'experience':
        filtered.sort((a, b) => b.experience - a.experience);
        break;
      default:
        // Recommended - keep original order
        break;
    }

    setFilteredTutors(filtered);
  };

  // Check if tutors are saved (on mount and refresh)
  const checkSavedStatus = useCallback(async () => {
    if (!token) return;
    const saved: Record<string, string> = {};
    for (const tutor of tutors) {
      if (tutor.userId) {
        try {
          const { isShortlisted, shortlistId } = await checkIsShortlisted(token, tutor.userId);
          if (isShortlisted && shortlistId) {
            saved[tutor.id] = shortlistId;
          }
        } catch {
          // Silently fail for individual tutors
        }
      }
    }
    setSavedTutors(saved);
  }, [token, tutors]);

  useEffect(() => {
    checkSavedStatus();
  }, [checkSavedStatus]);

  const handleToggleSave = async (tutor: Tutor) => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to save tutors.');
      return;
    }

    if (!tutor.userId) {
      Alert.alert('Error', 'Unable to identify tutor.');
      return;
    }

    setSavingTutorId(tutor.id);

    try {
      if (savedTutors[tutor.id]) {
        // Already saved - remove from shortlist
        await removeShortlist(token, savedTutors[tutor.id]);
        setSavedTutors(prev => {
          const updated = { ...prev };
          delete updated[tutor.id];
          return updated;
        });
      } else {
        // Not saved - add to shortlist
        const response = await createShortlist(token, {
          teacherId: tutor.userId,
          teacherProfileId: tutor.id,
        });
        setSavedTutors(prev => ({
          ...prev,
          [tutor.id]: response.data.shortlist._id,
        }));
      }
    } catch (err: any) {
      if (err?.status === 409) {
        // Already exists - mark as saved
        setSavedTutors(prev => ({
          ...prev,
          [tutor.id]: err?.shortlistId || 'unknown',
        }));
      } else {
        Alert.alert('Error', err?.message || 'Failed to update saved status.');
      }
    } finally {
      setSavingTutorId(null);
    }
  };

  const renderTutorCard = ({ item, index }: { item: Tutor; index: number }) => (
    <Card key={item.id} variant="elevated" margin="small" style={styles.tutorCard}>
      {/* Header with Profile */}
      <View style={styles.tutorHeader}>
        <View style={styles.profileSection}>
          <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.tutorName, { color: theme.colors.text }]}>
                {item.name}
              </Text>
              {item.verified && (
                <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.success }]}>
                  <Text style={[styles.verifiedText, { color: theme.colors.textWhite }]}>
                    ✓ Verified
                  </Text>
                </View>
              )}
            </View>
            
            {/* Trust Signals */}
            <View style={styles.trustSignals}>
              <View style={styles.trustSignal}>
                <Text style={[styles.trustValue, { color: theme.colors.text }]}>
                  ⭐ {item.rating}
                </Text>
                <Text style={[styles.trustLabel, { color: theme.colors.textSecondary }]}>
                  ({item.totalReviews})
                </Text>
              </View>
              <View style={styles.trustSignal}>
                <Text style={[styles.trustValue, { color: theme.colors.text }]}>
                  {item.responseRate}%
                </Text>
                <Text style={[styles.trustLabel, { color: theme.colors.textSecondary }]}>
                  Response
                </Text>
              </View>
              <View style={styles.trustSignal}>
                <Text style={[styles.trustValue, { color: theme.colors.text }]}>
                  {item.responseTime}
                </Text>
                <Text style={[styles.trustLabel, { color: theme.colors.textSecondary }]}>
                  Response time
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Save Button */}
        <TouchableOpacity
          style={styles.shortlistButton}
          onPress={() => handleToggleSave(item)}
          disabled={savingTutorId === item.id}
        >
          {savingTutorId === item.id ? (
            <ActivityIndicator size="small" color={theme.colors.accent} />
          ) : (
            <Text style={[styles.shortlistIcon, { color: savedTutors[item.id] ? theme.colors.accent : theme.colors.textLight }]}>
              {savedTutors[item.id] ? '❤️' : '🤍'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Subjects and Classes */}
      <View style={styles.subjectsSection}>
        <View style={styles.subjectRow}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
            Subjects:
          </Text>
          <View style={styles.chipsContainer}>
            {item.subjects.map((subject, idx) => (
              <View key={idx} style={[styles.subjectChip, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.chipText, { color: theme.colors.textWhite }]}>
                  {subject}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.classRow}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
            Classes:
          </Text>
          <Text style={[styles.classText, { color: theme.colors.text }]}>
            {item.classes.join(', ')}
          </Text>
        </View>
      </View>

      {/* Experience and Languages */}
      <View style={styles.experienceSection}>
        <View style={styles.experienceRow}>
          <Text style={[styles.experienceText, { color: theme.colors.text }]}>
            🎓 {item.experience} years experience
          </Text>
        </View>
        <View style={styles.languageRow}>
          <Text style={[styles.languageText, { color: theme.colors.textSecondary }]}>
            Speaks: {item.languages.join(', ')}
          </Text>
        </View>
        <View style={styles.modeRow}>
          {item.teachingModes.map((mode, idx) => (
            <View key={idx} style={[styles.modeBadge, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Text style={[styles.modeText, { color: theme.colors.textSecondary }]}>
                {mode}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Achievements */}
      {item.achievements.length > 0 && (
        <View style={styles.achievementsSection}>
          {item.achievements.map((achievement, idx) => (
            <View key={idx} style={[styles.achievementBadge, { backgroundColor: theme.colors.accent }]}>
              <Text style={[styles.achievementText, { color: theme.colors.textWhite }]}>
                🏆 {achievement}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Pricing and Distance */}
      <View style={styles.pricingSection}>
        <View style={styles.priceRow}>
          <Text style={[styles.priceText, { color: theme.colors.accent }]}>
            ₹{item.price}/hour
          </Text>
          <Text style={[styles.distanceText, { color: theme.colors.textSecondary }]}>
            📍 {item.distance} km away
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <Button
          title="View Profile"
          variant="outline"
          size="small"
          onPress={() => console.log('View profile:', item.id)}
          style={styles.actionButton}
        />
        <Button
          title="Unlock Contact"
          variant="primary"
          size="small"
          onPress={() => console.log('Unlock contact:', item.id)}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  const renderSortOption = (option: { value: string; label: string }) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.sortOption,
        { backgroundColor: sortBy === option.value ? theme.colors.primary : theme.colors.card }
      ]}
      onPress={() => setSortBy(option.value)}
    >
      <Text style={[
        styles.sortOptionText,
        { color: sortBy === option.value ? theme.colors.textWhite : theme.colors.text }
      ]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );

  const sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'distance', label: 'Nearest First' },
    { value: 'experience', label: 'Most Experienced' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search and Filter Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, paddingTop: insets.top + 8 }]}>
        <Input
          placeholder="Search tutors, subjects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search"
          containerStyle={styles.searchInput}
        />
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={[styles.filterButtonText, { color: theme.colors.text }]}>
              🔧 Filters
            </Text>
          </TouchableOpacity>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
            {sortOptions.map(renderSortOption)}
          </ScrollView>
        </View>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <Card variant="outlined" margin="small" style={styles.filtersPanel}>
          <Text style={[styles.filtersTitle, { color: theme.colors.text }]}>
            Filters
          </Text>
          {/* Add filter components here */}
          <Text style={[styles.filtersNote, { color: theme.colors.textSecondary }]}>
            Advanced filters coming soon...
          </Text>
        </Card>
      )}

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: theme.colors.text }]}>
          {filteredTutors.length} tutors found
        </Text>
        {searchQuery && (
          <Text style={[styles.searchQuery, { color: theme.colors.textSecondary }]}>
            for "{searchQuery}"
          </Text>
        )}
      </View>

      {/* Tutor List */}
      <FlatList
        data={filteredTutors}
        renderItem={renderTutorCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 100 }]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No tutors found matching your criteria
            </Text>
            <Button
              title="Clear Filters"
              variant="outline"
              onPress={() => {
                setFilters({
                  subjects: [],
                  classes: [],
                  priceRange: [0, 2000],
                  distance: 10,
                  verifiedOnly: false,
                  teachingMode: 'all',
                });
                setSearchQuery('');
              }}
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortContainer: {
    flex: 1,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filtersPanel: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filtersNote: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchQuery: {
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 20,
  },
  tutorCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  tutorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    flex: 1,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tutorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
  },
  trustSignals: {
    flexDirection: 'row',
    gap: 16,
  },
  trustSignal: {
    alignItems: 'center',
  },
  trustValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  trustLabel: {
    fontSize: 11,
  },
  shortlistButton: {
    padding: 8,
  },
  shortlistIcon: {
    fontSize: 24,
  },
  subjectsSection: {
    marginBottom: 12,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    width: 60,
  },
  chipsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subjectChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classText: {
    fontSize: 14,
    flex: 1,
  },
  experienceSection: {
    marginBottom: 12,
  },
  experienceRow: {
    marginBottom: 4,
  },
  experienceText: {
    fontSize: 14,
  },
  languageRow: {
    marginBottom: 4,
  },
  languageText: {
    fontSize: 13,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  achievementsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  achievementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementText: {
    fontSize: 11,
    fontWeight: '500',
  },
  pricingSection: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  distanceText: {
    fontSize: 14,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
});

export default TutorListingScreen;
