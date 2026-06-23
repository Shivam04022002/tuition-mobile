import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { useShortlists } from '../../hooks/useShortlists';
import { ProfileAvatar, PrimaryButton } from '../../components/ui';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import type { Shortlist } from '../../services/shortlistApi';

const ShortlistedTutorsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const token = useAppSelector(selectAuthToken);

  const {
    shortlists,
    total,
    isLoading,
    isRefreshing,
    isRemoving,
    isMarkingContacted,
    error,
    actionError,
    refresh,
    retry,
    removeFromShortlist,
    markContacted,
  } = useShortlists(token);

  const handleViewProfile = useCallback((shortlist: Shortlist) => {
    navigation.navigate('TutorProfile', {
      profileId: shortlist.teacherProfileId?._id,
    });
  }, [navigation]);

  const handleRemove = useCallback((shortlist: Shortlist) => {
    Alert.alert(
      'Remove Tutor?',
      `Remove ${shortlist.teacherProfileId?.basicDetails?.fullName || 'this tutor'} from your saved list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeFromShortlist(shortlist._id);
            if (!success) {
              Alert.alert('Error', 'Failed to remove tutor. Please try again.');
            }
          },
        },
      ]
    );
  }, [removeFromShortlist]);

  const handleMarkContacted = useCallback((shortlist: Shortlist) => {
    Alert.alert(
      'Mark as Contacted',
      'How did you contact this tutor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => markContacted(shortlist._id, 'call'),
        },
        {
          text: 'WhatsApp',
          onPress: () => markContacted(shortlist._id, 'whatsapp'),
        },
      ]
    );
  }, [markContacted]);

  const renderItem = useCallback(({ item }: { item: Shortlist }) => {
    const profile = item.teacherProfileId;
    const name = profile?.basicDetails?.fullName || 'Unknown Tutor';
    const photo = profile?.basicDetails?.profilePhoto || '';
    const subjects = profile?.teachingDetails?.subjects || [];
    const experience = profile?.teachingDetails?.experienceYears || 0;
    const rate = profile?.pricingRevenue?.hourlyRate || 0;
    const rating = profile?.stats?.averageRating || 0;
    const savedAt = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    const isCurrentlyRemoving = isRemoving === item._id;
    const isCurrentlyMarking = isMarkingContacted === item._id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <ProfileAvatar name={name} imageUri={photo} size={56} />
          <View style={styles.cardInfo}>
            <Text style={styles.tutorName}>{name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingText}>{Number(rating || 0).toFixed(1)}</Text>
              <Text style={styles.expText}>• {experience} yrs exp</Text>
            </View>
            {rate > 0 && (
              <Text style={styles.rateText}>₹{rate}/hr</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemove(item)}
            disabled={isCurrentlyRemoving}
          >
            {isCurrentlyRemoving ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            )}
          </TouchableOpacity>
        </View>

        {subjects.length > 0 && (
          <View style={styles.subjectRow}>
            {subjects.slice(0, 3).map((s, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {item.notes ? (
          <View style={styles.notesContainer}>
            <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
          </View>
        ) : null}

        {item.matchScore && item.matchScore > 0 ? (
          <View style={styles.matchBadge}>
            <Ionicons name="fitness" size={12} color={colors.success} />
            <Text style={styles.matchText}>{item.matchScore}% Match</Text>
          </View>
        ) : null}

        {savedAt ? (
          <Text style={styles.dateText}>Saved on {savedAt}</Text>
        ) : null}

        {item.isContacted ? (
          <View style={styles.contactedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.contactedText}>
              Contacted {item.contactMethod ? `via ${item.contactMethod}` : ''}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <PrimaryButton
            label="View Profile"
            onPress={() => handleViewProfile(item)}
            variant="outline"
            size="sm"
            style={styles.actionButton}
          />
          {!item.isContacted && (
            <PrimaryButton
              label={isCurrentlyMarking ? "Marking..." : "Mark Contacted"}
              onPress={() => handleMarkContacted(item)}
              variant="secondary"
              size="sm"
              disabled={isCurrentlyMarking}
              style={styles.actionButton}
            />
          )}
        </View>
      </View>
    );
  }, [handleRemove, handleViewProfile, handleMarkContacted, isRemoving, isMarkingContacted]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shortlisted Tutors</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shortlisted Tutors</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton label="Retry" onPress={retry} variant="outline" style={styles.retryBtn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shortlisted Tutors</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={shortlists}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="bookmark-outline" size={56} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No saved tutors</Text>
            <Text style={styles.emptySubtitle}>Save tutors from their profiles to see them here</Text>
            <PrimaryButton
              label="Browse Tutors"
              onPress={() => navigation.navigate('TutorSearch')}
              variant="outline"
              style={styles.browseButton}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border ?? '#E2E8F0',
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  headerRight: { width: 32 },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    ...shadows.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardInfo: { flex: 1 },
  tutorName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  ratingText: { fontSize: 13, fontWeight: '700', color: colors.text },
  expText: { fontSize: 12, color: colors.textSecondary },
  rateText: { fontSize: 12, color: colors.textSecondary },
  removeButton: {
    padding: 8,
    borderRadius: 8,
  },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: colors.primary + '12' },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 10,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  notesText: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  matchText: { fontSize: 12, fontWeight: '600', color: colors.success },
  dateText: { fontSize: 12, color: colors.textSecondary, marginBottom: 10 },
  contactedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.success + '15',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  contactedText: { fontSize: 11, fontWeight: '600', color: colors.success },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  browseButton: {
    marginTop: 16,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 15, color: colors.error, textAlign: 'center', marginVertical: 12 },
  retryBtn: { marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  bottomButton: {
    flex: 1,
  },
});

export default ShortlistedTutorsScreen;
