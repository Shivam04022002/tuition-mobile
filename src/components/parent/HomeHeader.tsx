import React, { memo, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { NotificationBadge } from '../ui';
import { ProfileAvatar } from '../ui';
import type { ParentProfile } from '../../services/parentProfileService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface HomeHeaderProps {
  profile: ParentProfile | null;
  notificationsCount: number;
  isLoading: boolean;
  onNotificationsPress: () => void;
  onAvatarPress: () => void;
  onPostRequirementPress: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Greeting helper — based on local device time
// ─────────────────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning 👋';
  if (hour >= 12 && hour < 17) return 'Good Afternoon 👋';
  return 'Good Evening 👋';
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles (declared before sub-components to avoid forward-reference errors)
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroLeft: { flex: 1 },
  heroRight: { alignItems: 'flex-end', gap: 4 },
  heroGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginBottom: 4,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 18,
  },
  avatar: { marginTop: 8 },
  heroCta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.md,
  },
  heroCtaLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCtaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  heroCtaSub: { fontSize: 12, color: colors.textSecondary },
});

const skeletonStyles = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Header Skeleton — shown while profile is loading
// ─────────────────────────────────────────────────────────────────────────────

const HeaderSkeleton: React.FC<{ topPad: number }> = memo(({ topPad }) => (
  <View style={[styles.hero, { paddingTop: topPad + 12 }]}>
    <View style={styles.heroTop}>
      <View style={styles.heroLeft}>
        <View style={[skeletonStyles.bar, { width: 110, height: 12, marginBottom: 8 }]} />
        <View style={[skeletonStyles.bar, { width: 160, height: 22, marginBottom: 8 }]} />
        <View style={[skeletonStyles.bar, { width: 200, height: 12 }]} />
      </View>
      <View style={styles.heroRight}>
        <View style={[skeletonStyles.bar, { width: 32, height: 32, borderRadius: 16, marginBottom: 4 }]} />
        <View style={[skeletonStyles.bar, { width: 44, height: 44, borderRadius: 22 }]} />
      </View>
    </View>
    <View style={[skeletonStyles.bar, { width: '100%', height: 68, borderRadius: 16, marginTop: 4 }]} />
  </View>
));

HeaderSkeleton.displayName = 'HeaderSkeleton';

// ─────────────────────────────────────────────────────────────────────────────
// HomeHeader
// ─────────────────────────────────────────────────────────────────────────────

const HomeHeader: React.FC<HomeHeaderProps> = memo(({
  profile,
  notificationsCount,
  isLoading,
  onNotificationsPress,
  onAvatarPress,
  onPostRequirementPress,
}) => {
  const insets = useSafeAreaInsets();

  const topPad = useMemo(
    () =>
      insets.top > 0
        ? insets.top
        : Platform.OS === 'android'
        ? (StatusBar.currentHeight ?? 0)
        : 44,
    [insets.top],
  );

  const greeting = useMemo(() => getGreeting(), []);

  const displayName = useMemo(
    () => profile?.name || 'Parent',
    [profile?.name],
  );

  const profileImage = useMemo(
    () => profile?.profileImage ?? undefined,
    [profile?.profileImage],
  );

  const handleNotificationsPress = useCallback(() => {
    onNotificationsPress();
  }, [onNotificationsPress]);

  const handleAvatarPress = useCallback(() => {
    onAvatarPress();
  }, [onAvatarPress]);

  const handlePostRequirementPress = useCallback(() => {
    onPostRequirementPress();
  }, [onPostRequirementPress]);

  if (isLoading) {
    return <HeaderSkeleton topPad={topPad} />;
  }

  return (
    <View style={[styles.hero, { paddingTop: topPad + 12 }]}>
      <View style={styles.heroTop}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroGreeting}>{greeting}</Text>
          <Text style={styles.heroName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.heroSub}>Find the perfect tutor for your child</Text>
        </View>
        <View style={styles.heroRight}>
          <NotificationBadge
            count={notificationsCount}
            onPress={handleNotificationsPress}
            iconColor="#FFFFFF"
          />
          <TouchableOpacity
            onPress={handleAvatarPress}
            activeOpacity={0.8}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <ProfileAvatar
              name={displayName}
              imageUri={profileImage}
              size={44}
              showBorder
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.heroCta}
        activeOpacity={0.88}
        onPress={handlePostRequirementPress}
      >
        <View style={styles.heroCtaLeft}>
          <View style={styles.heroCtaIcon}>
            <Ionicons name="add" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.heroCtaTitle}>Post a Requirement</Text>
            <Text style={styles.heroCtaSub}>Get matched with top tutors</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
});

HomeHeader.displayName = 'HomeHeader';

export default HomeHeader;
