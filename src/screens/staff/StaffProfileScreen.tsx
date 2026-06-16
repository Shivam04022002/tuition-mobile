import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { StaffProfileData } from '../../services/profileApi';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface MenuItemProps {
  icon: string;
  label: string;
  sub?: string;
  color?: string;
  onPress?: () => void;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, sub, color, onPress, danger }) => {
  const c = danger ? colors.error : (color ?? colors.text);
  return (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: c + '15' }]}>
        <Ionicons name={icon as any} size={20} color={c} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: colors.error }]}>{label}</Text>
        {sub ? <Text style={styles.menuSub}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
};

const StaffProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const { profile: rawProfile, isLoading, error, refresh, retry } = useProfile();
  const profile = rawProfile as StaffProfileData | null;

  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!isLoading && rawProfile) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [isLoading, rawProfile]);

  const onRefresh = useCallback(async () => {
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
  const displayName = profile
    ? `${profile.profile?.firstName ?? ''} ${profile.profile?.lastName ?? ''}`.trim() || 'Staff Member'
    : 'Staff Member';
  const displayEmail = profile?.email ?? '';
  const displayRole = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Staff';
  const displayDept = profile?.profile?.department ?? 'Operations';
  const joinedAt = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.secondary]} tintColor={colors.secondary} />
      }
    >
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: topPad + 12 }]}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroGreeting}>Staff Profile</Text>
            <Text style={styles.heroName}>{displayName}</Text>
            <Text style={styles.heroEmail}>{displayEmail}</Text>
          </View>
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#FFF" />
            <Text style={styles.roleBadgeText}>{displayRole}</Text>
          </View>
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={18} color={colors.info} />
            <Text style={styles.cardTitle}>Staff Information</Text>
          </View>
          {[
            { icon: 'mail-outline',       label: 'Email',       value: displayEmail || '—' },
            { icon: 'briefcase-outline',  label: 'Department',  value: displayDept },
            { icon: 'person-outline',     label: 'Role',        value: displayRole },
            { icon: 'calendar-outline',   label: 'Joined',      value: joinedAt },
            { icon: 'call-outline',       label: 'Phone',       value: profile?.phoneNumber || '—' },
          ].map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.info + '12' }]}>
                <Ionicons name={item.icon as any} size={15} color={colors.info} />
              </View>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={18} color={colors.secondary} />
            <Text style={styles.cardTitle}>Account Actions</Text>
          </View>
          <View style={styles.menuList}>
            <MenuItem
              icon="settings-outline"
              label="Settings"
              sub="Notifications, privacy, preferences"
              color={colors.secondary}
              onPress={() => Alert.alert('Settings', 'Coming soon')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="headset-outline"
              label="Support"
              sub="Get help or report an issue"
              color={colors.info}
              onPress={() => Alert.alert('Support', 'Coming soon')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="log-out-outline"
              label="Logout"
              sub="Sign out of this session"
              danger
              onPress={handleLogout}
            />
          </View>
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={15} color={colors.textTertiary} />
          <Text style={styles.footerNoteText}>
            Staff accounts are managed by the Admin panel. Contact your supervisor for role changes.
          </Text>
        </View>

      </Animated.View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 24 },

  hero: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  heroGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 4 },
  heroName: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.70)', marginTop: 3 },

  avatarContainer: { alignItems: 'center', gap: 10 },
  avatar: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.40)',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
  },
  roleBadgeText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  content: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  card: {
    backgroundColor: colors.card, borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },

  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { flex: 1, fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '700', color: colors.text },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: {
    width: '47%', alignItems: 'center',
    padding: 14, borderRadius: 14,
    borderWidth: 1, backgroundColor: colors.background,
    gap: 6,
  },
  statIcon: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

  menuList: { gap: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  menuIcon: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  menuSub: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: colors.border },

  footerNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14, padding: 14,
  },
  footerNoteText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },

  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
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
});

export default StaffProfileScreen;
