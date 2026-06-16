import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../../redux/store';
import { logout } from '../../redux/slices/authSlice';
import { useProfile } from '../../hooks/useProfile';
import { AdminProfileData } from '../../services/profileApi';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const AdminProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const { profile: rawProfile, isLoading, error, refresh, retry } = useProfile();
  const profile = rawProfile as AdminProfileData | null;

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
      ],
    );
  }, [dispatch]);

  // Derived display values
  const firstName = profile?.profile?.firstName ?? '';
  const lastName  = profile?.profile?.lastName ?? '';
  const displayName = `${firstName} ${lastName}`.trim() || 'Admin';
  const initials = displayName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  const displayEmail = profile?.email ?? '—';
  const displayPhone = profile?.phoneNumber ?? '—';
  const displayRole  = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : 'Admin';
  const joinedAt = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  if (isLoading && !refreshing) {
    return (
      <View style={styles.center}>
        <View style={[styles.loadingSpinner, { backgroundColor: colors.secondary + '14' }]}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={styles.center}>
        <View style={[styles.loadingSpinner, { backgroundColor: colors.error + '14' }]}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
        </View>
        <Text style={[styles.loadingText, { color: colors.error }]}>Unable to load profile</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={retry}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.secondary]}
          tintColor={colors.secondary}
        />
      }
    >
      {/* ── Hero */}
      <View style={[styles.hero, { paddingTop: topPad + 12 }]}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.heroName}>{displayName}</Text>
        <Text style={styles.heroRole}>Admin Account</Text>
        <View style={styles.heroChips}>
          <View style={styles.heroChip}>
            <Ionicons name="mail-outline" size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroChipText}>{displayEmail}</Text>
          </View>
          <View style={styles.heroChip}>
            <Ionicons name="shield-checkmark-outline" size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroChipText}>{displayRole}</Text>
          </View>
        </View>
      </View>

      {/* ── Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Info</Text>
        <View style={styles.card}>
          {[
            { icon: 'person-outline',      label: 'Name',     value: displayName },
            { icon: 'mail-outline',         label: 'Email',    value: displayEmail },
            { icon: 'call-outline',         label: 'Phone',    value: displayPhone },
            { icon: 'shield-outline',       label: 'Role',     value: displayRole },
            { icon: 'calendar-outline',     label: 'Joined',   value: joinedAt },
          ].map((item, idx, arr) => (
            <View key={item.label} style={[styles.infoRow, idx < arr.length - 1 && styles.infoRowBorder]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.secondary + '15' }]}>
                <Ionicons name={item.icon as any} size={16} color={colors.secondary} />
              </View>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Platform Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform Controls</Text>
        <View style={styles.card}>
          {[
            { icon: 'toggle-outline',    label: 'System Settings',          color: colors.primary,   onPress: () => navigation.navigate('SystemSettings') },
            { icon: 'construct-outline', label: 'Maintenance Mode',          color: colors.warning,   onPress: () => navigation.navigate('MaintenanceMode') },
            { icon: 'mail-outline',      label: 'Notification Templates',    color: colors.info,      onPress: () => navigation.navigate('NotificationTemplates') },
          ].map((item, idx, arr) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.75}>
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
              {idx < arr.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── Sign Out */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.82}>
          <View style={[styles.menuIcon, { backgroundColor: colors.error + '15' }]}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </View>
          <Text style={styles.logoutText}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.error + '80'} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 24 },

  center: {
    flex: 1, backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  loadingSpinner: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  loadingText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  retryBtn: {
    marginTop: 16, paddingHorizontal: 28, paddingVertical: 10,
    backgroundColor: colors.secondary, borderRadius: 12,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // ── Hero
  hero: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.40)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  heroName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginBottom: 4 },
  heroRole: { fontSize: 13, color: 'rgba(255,255,255,0.70)', fontWeight: '500', marginBottom: 16 },
  heroChips: { gap: 8, alignItems: 'center' },
  heroChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  heroChipText: { fontSize: 12, color: 'rgba(255,255,255,0.90)', fontWeight: '500' },

  // ── Sections
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.card,
  },

  // ── Info rows
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 14,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  infoValue: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', maxWidth: '45%' },

  // ── Menu rows
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 15,
  },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  menuDivider: { height: 1, backgroundColor: colors.border, marginLeft: 72 },

  // ── Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card,
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 15,
    ...shadows.card,
  },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.error },
});

export default AdminProfileScreen;
