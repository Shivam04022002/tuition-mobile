import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectAuthToken, logout } from '../../redux/slices/authSlice';
import { selectUserProfile } from '../../redux/slices/userSlice';
import { Ionicons } from '@expo/vector-icons';
import { getParentProfile } from '../../services/parentApi';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface ProfileData {
  _id: string;
  email: string;
  mobileNumber: string;
  role: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    address?: {
      city?: string;
      state?: string;
    };
  };
  onboardingCompleted?: boolean;
  createdAt?: string;
}

const ParentProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const token = useAppSelector(selectAuthToken);
  const userProfile = useAppSelector(selectUserProfile);
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    console.log('👤 [PARENT_PROFILE] Loading profile...');
    try {
      setError(null);
      if (!token) {
        console.log('⚠️ [PARENT_PROFILE] No token available');
        setError('Authentication required');
        return;
      }

      const response = await getParentProfile(token);
      console.log('✅ [PARENT_PROFILE] Profile loaded:', response);
      setProfile(response as any);
    } catch (err: any) {
      console.error('❌ [PARENT_PROFILE] Error:', err);
      
      if (err.response?.status === 401) {
        dispatch(logout());
        Alert.alert('Session Expired', 'Please login again.');
        return;
      }
      
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, dispatch]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile();
  }, [loadProfile]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            console.log('🔒 [PARENT_PROFILE] Logging out...');
            dispatch(logout());
          }
        },
      ]
    );
  }, [dispatch]);

  const handleEditProfile = useCallback(() => {
    // Navigate to edit profile screen
    console.log('✏️ [PARENT_PROFILE] Edit profile clicked');
  }, []);

  const displayName = profile?.profile?.firstName && profile?.profile?.lastName
    ? `${profile.profile.firstName} ${profile.profile.lastName}`
    : userProfile?.firstName && userProfile?.lastName
    ? `${userProfile.firstName} ${userProfile.lastName}`
    : 'Parent';

  const initials = displayName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const email = profile?.email || userProfile?.email || 'No email';
  const mobile = profile?.mobileNumber || 'No mobile number';
  const location = profile?.profile?.address?.city && profile?.profile?.address?.state
    ? `${profile.profile.address.city}, ${profile.profile.address.state}`
    : 'Location not set';

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <View style={[styles.loadingSpinner, { backgroundColor: colors.error + '14' }]}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
        </View>
        <Text style={[styles.loadingText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const menuGroups = [
    {
      title: 'Account',
      items: [
        { icon: 'create-outline',      label: 'Edit Profile',    color: colors.primary,   onPress: handleEditProfile },
        { icon: 'wallet-outline',       label: 'Wallet',          color: colors.success,   onPress: () => navigation.navigate('Wallet', { role: 'parent' }) },
        { icon: 'videocam-outline',      label: 'Live Classes',    color: colors.info,      onPress: () => navigation.navigate('LiveClasses', { role: 'parent' }) },
        { icon: 'storefront-outline',    label: 'Course Marketplace', color: colors.secondary, onPress: () => navigation.navigate('CourseMarketplace', { role: 'parent' }) },
        { icon: 'people-outline',        label: 'My Children',     color: colors.pink,      onPress: () => {} },
        { icon: 'card-outline',          label: 'Payment History', color: colors.pink,      onPress: () => {} },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications-outline', label: 'Notifications', color: colors.accent,   onPress: () => navigation.navigate('NotificationSettings') },
        { icon: 'settings-outline',       label: 'Settings',      color: colors.info,     onPress: () => navigation.navigate('Settings', { role: 'parent' }) },
        { icon: 'help-circle-outline',    label: 'Help & Support', color: colors.success, onPress: () => navigation.navigate('Support', { role: 'parent' }) },
      ],
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Header */}
      <View style={[styles.hero, { paddingTop: topPad + 12 }]}>
        {/* Avatar */}
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        <Text style={styles.heroName}>{displayName}</Text>
        <Text style={styles.heroRole}>Parent Account</Text>

        {/* Info chips */}
        <View style={styles.heroChips}>
          <View style={styles.heroChip}>
            <Ionicons name="mail-outline" size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroChipText}>{email}</Text>
          </View>
          <View style={styles.heroChip}>
            <Ionicons name="call-outline" size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroChipText}>{mobile}</Text>
          </View>
          {location !== 'Location not set' && (
            <View style={styles.heroChip}>
              <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroChipText}>{location}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Menu groups */}
      {menuGroups.map((group) => (
        <View key={group.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{group.title}</Text>
          <View style={styles.menuCard}>
            {group.items.map((item, idx) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={item.onPress}
                  activeOpacity={0.75}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
                {idx < group.items.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}

      {/* ── Logout */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.82}
        >
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
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingSpinner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary + '14',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  loadingText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  retryBtn: {
    marginTop: 16, paddingHorizontal: 28, paddingVertical: 10,
    backgroundColor: colors.primary, borderRadius: 12,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // ── Hero
  hero: {
    backgroundColor: colors.primary,
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

  // ── Menu sections
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.card,
  },
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

export default ParentProfileScreen;
