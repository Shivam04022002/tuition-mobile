import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  AdminTeacher,
  approveTeacher,
  blockTeacher,
  getTeacherDetails,
  rejectTeacher,
  unblockTeacher,
} from '../../services/adminApi';

type RouteParams = { teacherId: string };

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Row: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value ?? '—'}</Text>
  </View>
);

const TeacherDetailScreen: React.FC = () => {
  const token: string = useSelector((state: any) => state.auth?.token ?? '');
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { teacherId } = route.params as RouteParams;

  const [teacher, setTeacher] = useState<AdminTeacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTeacher = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTeacherDetails(token, teacherId);
      if (res.success) setTeacher(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token, teacherId]);

  useEffect(() => {
    fetchTeacher();
  }, [fetchTeacher]);

  const doAction = async (fn: () => Promise<any>) => {
    setActionLoading(true);
    try {
      await fn();
      await fetchTeacher();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = () =>
    Alert.alert('Approve Teacher', 'Verify and approve this teacher?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => doAction(() => approveTeacher(token, teacherId)) },
    ]);

  const handleReject = () =>
    Alert.prompt('Reject Teacher', 'Enter rejection reason:', async (reason) => {
      if (!reason?.trim()) return;
      doAction(() => rejectTeacher(token, teacherId, reason.trim()));
    }, 'plain-text');

  const handleBlock = () =>
    Alert.prompt('Block Teacher', 'Enter block reason:', async (reason) => {
      if (!reason?.trim()) return;
      doAction(() => blockTeacher(token, teacherId, reason.trim()));
    }, 'plain-text');

  const handleUnblock = () =>
    Alert.alert('Unblock Teacher', 'Restore this teacher\'s access?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unblock', onPress: () => doAction(() => unblockTeacher(token, teacherId)) },
    ]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !teacher) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Teacher not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchTeacher}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const t = teacher;
  const statusColor = t.verificationStatus === 'verified'
    ? '#34C759' : t.verificationStatus === 'rejected'
    ? '#FF3B30' : '#FF9500';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.profileRow}>
          <View style={styles.bigAvatar}>
            <Text style={styles.bigAvatarText}>
              {(t.basicDetails?.fullName?.[0] ?? 'T').toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{t.basicDetails?.fullName}</Text>
            <Text style={styles.profileSub}>{t.basicDetails?.email}</Text>
            <Text style={styles.profileSub}>{t.basicDetails?.mobileNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {t.verificationStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        {t.isBlocked && (
          <View style={styles.blockedBanner}>
            <Text style={styles.blockedText}>⛔ BLOCKED{t.blockReason ? `: ${t.blockReason}` : ''}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {!actionLoading ? (
        <View style={styles.actionRow}>
          {t.verificationStatus === 'pending' && (
            <TouchableOpacity style={[styles.actionBtn, styles.btnSuccess]} onPress={handleApprove}>
              <Text style={styles.actionBtnTextSuccess}>✓ Approve</Text>
            </TouchableOpacity>
          )}
          {t.verificationStatus !== 'rejected' && (
            <TouchableOpacity style={[styles.actionBtn, styles.btnWarning]} onPress={handleReject}>
              <Text style={styles.actionBtnTextWarning}>✕ Reject</Text>
            </TouchableOpacity>
          )}
          {t.isBlocked ? (
            <TouchableOpacity style={[styles.actionBtn, styles.btnSuccess]} onPress={handleUnblock}>
              <Text style={styles.actionBtnTextSuccess}>Unblock</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.actionBtn, styles.btnDestructive]} onPress={handleBlock}>
              <Text style={styles.actionBtnTextDestructive}>Block</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.actionLoader}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.actionLoaderText}>Processing…</Text>
        </View>
      )}

      {/* Personal Details */}
      <Section title="Personal Details">
        <Row label="Full Name" value={t.basicDetails?.fullName} />
        <Row label="Email" value={t.basicDetails?.email} />
        <Row label="Mobile" value={t.basicDetails?.mobileNumber} />
        <Row label="City" value={t.locationAvailability?.city} />
        <Row label="Member Since" value={new Date(t.createdAt).toLocaleDateString('en-IN')} />
      </Section>

      {/* Teaching Details */}
      <Section title="Teaching Details">
        <Row label="Subjects" value={(t.teachingDetails?.subjects ?? []).join(', ')} />
        <Row label="Classes" value={(t.teachingDetails?.classes ?? []).join(', ')} />
        <Row
          label="Boards"
          value={
            (t as any).teachingDetails?.boards?.join(', ') || '—'
          }
        />
        <Row
          label="Teaching Modes"
          value={
            (t as any).teachingDetails?.teachingModes?.join(', ') || '—'
          }
        />
      </Section>

      {/* Qualification */}
      <Section title="Qualification">
        <Row
          label="Highest Qualification"
          value={(t as any).education?.highestQualification}
        />
        <Row label="Degree" value={(t as any).education?.degree} />
        <Row label="University" value={(t as any).education?.university} />
        <Row
          label="Year of Completion"
          value={(t as any).education?.yearOfCompletion}
        />
        <Row
          label="Experience"
          value={
            (t as any).teachingDetails?.teachingExperience
              ? `${(t as any).teachingDetails.teachingExperience} years`
              : undefined
          }
        />
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <Row
          label="Hourly Rate"
          value={
            t.pricingRevenue?.hourlyRate
              ? `₹${t.pricingRevenue.hourlyRate}/hr`
              : undefined
          }
        />
        <Row
          label="Monthly Rate"
          value={
            (t as any).pricingRevenue?.monthlyRate
              ? `₹${(t as any).pricingRevenue.monthlyRate}/mo`
              : undefined
          }
        />
      </Section>

      {/* Stats */}
      <Section title="Performance">
        <Row label="Avg Rating" value={t.stats?.averageRating ? `${t.stats.averageRating}/5` : undefined} />
        <Row label="Total Students" value={(t as any).stats?.totalStudents} />
        <Row label="Active Students" value={(t as any).stats?.activeStudents} />
      </Section>

      {/* Verification Documents */}
      <Section title="Verification Documents">
        <Row
          label="Aadhaar"
          value={(t as any).verificationDocuments?.aadhaarCard ? 'Uploaded' : 'Not uploaded'}
        />
        <Row
          label="PAN Card"
          value={(t as any).verificationDocuments?.panCard ? 'Uploaded' : 'Not uploaded'}
        />
        <Row
          label="Certificates"
          value={
            (t as any).verificationDocuments?.certificates?.length
              ? `${(t as any).verificationDocuments.certificates.length} uploaded`
              : 'None'
          }
        />
        {t.verificationStatus === 'rejected' && (t as any).rejectionReason && (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
            <Text style={styles.rejectionText}>{(t as any).rejectionReason}</Text>
          </View>
        )}
      </Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 15, color: '#333', textAlign: 'center', marginBottom: 12 },
  retryBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },

  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#007AFF', fontWeight: '500' },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  bigAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bigAvatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#111' },
  profileSub: { fontSize: 13, color: '#666', marginTop: 2 },
  statusBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  blockedBanner: {
    marginTop: 10,
    backgroundColor: '#fff5f5',
    borderRadius: 6,
    padding: 8,
  },
  blockedText: { fontSize: 12, color: '#FF3B30' },

  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnSuccess: { borderColor: '#34C759', backgroundColor: '#f0fff4' },
  btnWarning: { borderColor: '#FF9500', backgroundColor: '#fffbf0' },
  btnDestructive: { borderColor: '#FF3B30', backgroundColor: '#fff5f5' },
  actionBtnTextSuccess: { color: '#34C759', fontWeight: '700', fontSize: 14 },
  actionBtnTextWarning: { color: '#FF9500', fontWeight: '700', fontSize: 14 },
  actionBtnTextDestructive: { color: '#FF3B30', fontWeight: '700', fontSize: 14 },
  actionLoader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', gap: 10 },
  actionLoaderText: { fontSize: 14, color: '#666' },

  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rowLabel: { fontSize: 14, color: '#666', flex: 1 },
  rowValue: { fontSize: 14, color: '#111', fontWeight: '500', flex: 1, textAlign: 'right' },
  rejectionBox: {
    marginTop: 8,
    backgroundColor: '#fff5f5',
    borderRadius: 6,
    padding: 10,
  },
  rejectionLabel: { fontSize: 12, fontWeight: '700', color: '#FF3B30', marginBottom: 4 },
  rejectionText: { fontSize: 13, color: '#333' },
});

export default TeacherDetailScreen;
