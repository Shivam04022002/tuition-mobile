import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../../redux/store';
import { selectAuthToken } from '../../redux/slices/authSlice';
import { useApplications } from '../../hooks/useApplications';
import { ProfileAvatar, PrimaryButton } from '../../components/ui';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import type { ParentApplication } from '../../services/applicationApi';

const ShortlistedTutorsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const token = useAppSelector(selectAuthToken);

  const {
    applications,
    isLoading,
    isRefreshing,
    error,
    refresh,
    retry,
  } = useApplications(token);

  const shortlisted = applications.filter(a => a.status === 'shortlisted');

  const handleViewApplication = useCallback((app: ParentApplication) => {
    navigation.navigate('ApplicationDetail', {
      applicationId: app.applicationId || app._id,
    });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: ParentApplication }) => {
    const name = item.teacherProfileId?.basicDetails?.fullName || 'Unknown Tutor';
    const photo = item.teacherProfileId?.basicDetails?.profilePhoto || '';
    const subjects = item.teacherProfileId?.teachingDetails?.subjects || [];
    const experience = item.teacherProfileId?.pricingRevenue?.experienceYears || 0;
    const rate = item.teacherProfileId?.pricingRevenue?.hourlyRate || 0;
    const rating = item.teacherProfileId?.stats?.averageRating || 0;
    const shortlistedAt = item.shortlistedAt
      ? new Date(item.shortlistedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <ProfileAvatar name={name} imageUri={photo} size={56} />
          <View style={styles.cardInfo}>
            <Text style={styles.tutorName}>{name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
              <Text style={styles.expText}>• {experience} yrs exp</Text>
            </View>
            {rate > 0 && (
              <Text style={styles.rateText}>₹{rate}/hr</Text>
            )}
          </View>
          <View style={styles.shortlistedBadge}>
            <Ionicons name="bookmark" size={14} color={colors.primary} />
            <Text style={styles.shortlistedText}>Shortlisted</Text>
          </View>
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

        {shortlistedAt ? (
          <Text style={styles.dateText}>Shortlisted on {shortlistedAt}</Text>
        ) : null}

        <PrimaryButton
          label="View Application"
          onPress={() => handleViewApplication(item)}
          variant="outline"
          size="sm"
        />
      </View>
    );
  }, [handleViewApplication]);

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
        data={shortlisted}
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
            <Text style={styles.emptyTitle}>No shortlisted tutors</Text>
            <Text style={styles.emptySubtitle}>Shortlist tutors from applications to see them here</Text>
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
  shortlistedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: colors.primary + '15',
  },
  shortlistedText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: colors.primary + '12' },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  dateText: { fontSize: 12, color: colors.textSecondary, marginBottom: 12 },
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
