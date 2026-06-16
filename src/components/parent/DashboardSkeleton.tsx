import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

// ── Shimmer Atom ──────────────────────────────────────────────────────────────

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
  pulse: Animated.Value;
}

const Shimmer: React.FC<ShimmerProps> = memo(({
  width: w = '100%',
  height = 16,
  borderRadius = 8,
  style,
  pulse,
}) => {
  const bg = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border || '#E5E7EB', colors.backgroundSecondary || '#F3F4F6'],
  });

  return (
    <Animated.View
      style={[
        { width: w as any, height, borderRadius, backgroundColor: bg },
        style,
      ]}
    />
  );
});

Shimmer.displayName = 'Shimmer';

// ── Skeleton sections ─────────────────────────────────────────────────────────

interface SkeletonProps {
  pulse: Animated.Value;
}

const HeaderSkeleton: React.FC<SkeletonProps> = memo(({ pulse }) => (
  <View style={skeletonStyles.header}>
    <View style={skeletonStyles.headerLeft}>
      <Shimmer width={100} height={12} borderRadius={6} pulse={pulse} style={skeletonStyles.mb6} />
      <Shimmer width={160} height={22} borderRadius={8} pulse={pulse} style={skeletonStyles.mb6} />
      <Shimmer width={200} height={12} borderRadius={6} pulse={pulse} />
    </View>
    <Shimmer width={44} height={44} borderRadius={22} pulse={pulse} />
  </View>
));

HeaderSkeleton.displayName = 'HeaderSkeleton';

const StatsSkeleton: React.FC<SkeletonProps> = memo(({ pulse }) => {
  const statW = (width - 32 - 10) / 2;
  return (
    <View style={skeletonStyles.statsGrid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[skeletonStyles.statCard, { width: statW }]}>
          <Shimmer width={40} height={40} borderRadius={12} pulse={pulse} style={skeletonStyles.mb8} />
          <Shimmer width={48} height={26} borderRadius={6} pulse={pulse} style={skeletonStyles.mb4} />
          <Shimmer width={'70%'} height={12} borderRadius={5} pulse={pulse} />
        </View>
      ))}
    </View>
  );
});

StatsSkeleton.displayName = 'StatsSkeleton';

const RequirementCardSkeleton: React.FC<SkeletonProps> = memo(({ pulse }) => (
  <View style={skeletonStyles.card}>
    <View style={skeletonStyles.cardHeaderRow}>
      <View style={skeletonStyles.flex1}>
        <Shimmer width={'60%'} height={16} borderRadius={6} pulse={pulse} style={skeletonStyles.mb6} />
        <Shimmer width={'40%'} height={12} borderRadius={5} pulse={pulse} />
      </View>
      <Shimmer width={64} height={24} borderRadius={12} pulse={pulse} />
    </View>
    <View style={skeletonStyles.metaRow}>
      <Shimmer width={80} height={12} borderRadius={5} pulse={pulse} />
      <Shimmer width={80} height={12} borderRadius={5} pulse={pulse} />
    </View>
    <View style={skeletonStyles.actionRow}>
      <Shimmer width={'47%'} height={36} borderRadius={10} pulse={pulse} />
      <Shimmer width={'47%'} height={36} borderRadius={10} pulse={pulse} />
    </View>
  </View>
));

RequirementCardSkeleton.displayName = 'RequirementCardSkeleton';

const ApplicationCardSkeleton: React.FC<SkeletonProps> = memo(({ pulse }) => (
  <View style={skeletonStyles.card}>
    <View style={skeletonStyles.appRow}>
      <Shimmer width={52} height={52} borderRadius={26} pulse={pulse} />
      <View style={skeletonStyles.flex1}>
        <Shimmer width={'55%'} height={15} borderRadius={6} pulse={pulse} style={skeletonStyles.mb6} />
        <Shimmer width={'40%'} height={12} borderRadius={5} pulse={pulse} style={skeletonStyles.mb6} />
        <Shimmer width={'30%'} height={12} borderRadius={5} pulse={pulse} />
      </View>
    </View>
    <View style={[skeletonStyles.metaRow, skeletonStyles.mt8]}>
      <Shimmer width={70} height={24} borderRadius={12} pulse={pulse} />
      <Shimmer width={70} height={24} borderRadius={12} pulse={pulse} />
    </View>
    <View style={skeletonStyles.actionRow}>
      <Shimmer width={'30%'} height={36} borderRadius={10} pulse={pulse} />
      <Shimmer width={'30%'} height={36} borderRadius={10} pulse={pulse} />
      <Shimmer width={'30%'} height={36} borderRadius={10} pulse={pulse} />
    </View>
  </View>
));

ApplicationCardSkeleton.displayName = 'ApplicationCardSkeleton';

const TutorCardSkeleton: React.FC<SkeletonProps> = memo(({ pulse }) => (
  <View style={[skeletonStyles.tutorCard, { width: width * 0.72 }]}>
    <View style={skeletonStyles.appRow}>
      <Shimmer width={56} height={56} borderRadius={28} pulse={pulse} />
      <View style={skeletonStyles.flex1}>
        <Shimmer width={'60%'} height={14} borderRadius={6} pulse={pulse} style={skeletonStyles.mb6} />
        <Shimmer width={'45%'} height={12} borderRadius={5} pulse={pulse} style={skeletonStyles.mb6} />
        <Shimmer width={'30%'} height={12} borderRadius={5} pulse={pulse} />
      </View>
    </View>
    <View style={[skeletonStyles.metaRow, skeletonStyles.mt8]}>
      <Shimmer width={60} height={22} borderRadius={11} pulse={pulse} />
      <Shimmer width={60} height={22} borderRadius={11} pulse={pulse} />
    </View>
    <View style={[skeletonStyles.actionRow, skeletonStyles.mt8]}>
      <Shimmer width={'47%'} height={36} borderRadius={10} pulse={pulse} />
      <Shimmer width={'47%'} height={36} borderRadius={10} pulse={pulse} />
    </View>
  </View>
));

TutorCardSkeleton.displayName = 'TutorCardSkeleton';

const SectionTitleSkeleton: React.FC<SkeletonProps> = memo(({ pulse }) => (
  <View style={[skeletonStyles.metaRow, skeletonStyles.sectionTitle]}>
    <Shimmer width={140} height={16} borderRadius={7} pulse={pulse} />
    <Shimmer width={48} height={12} borderRadius={5} pulse={pulse} />
  </View>
));

SectionTitleSkeleton.displayName = 'SectionTitleSkeleton';

// ── Main DashboardSkeleton ─────────────────────────────────────────────────────

const DashboardSkeleton: React.FC = memo(() => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: false }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <ScrollView
      style={skeletonStyles.container}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      {/* Header skeleton */}
      <View style={skeletonStyles.heroPlaceholder}>
        <HeaderSkeleton pulse={pulse} />
        <Shimmer width={'100%'} height={68} borderRadius={16} pulse={pulse} style={skeletonStyles.ctaPlaceholder} />
      </View>

      {/* Stats skeleton */}
      <View style={skeletonStyles.section}>
        <SectionTitleSkeleton pulse={pulse} />
        <StatsSkeleton pulse={pulse} />
      </View>

      {/* Requirements skeleton */}
      <View style={skeletonStyles.section}>
        <SectionTitleSkeleton pulse={pulse} />
        <RequirementCardSkeleton pulse={pulse} />
        <RequirementCardSkeleton pulse={pulse} />
      </View>

      {/* Applications skeleton */}
      <View style={skeletonStyles.section}>
        <SectionTitleSkeleton pulse={pulse} />
        <ApplicationCardSkeleton pulse={pulse} />
        <ApplicationCardSkeleton pulse={pulse} />
      </View>

      {/* Recommended Tutors skeleton */}
      <View style={skeletonStyles.section}>
        <SectionTitleSkeleton pulse={pulse} />
      </View>
      <ScrollView
        horizontal
        scrollEnabled={false}
        contentContainerStyle={skeletonStyles.horizontalList}
        showsHorizontalScrollIndicator={false}
      >
        <TutorCardSkeleton pulse={pulse} />
        <TutorCardSkeleton pulse={pulse} />
      </ScrollView>

      <View style={skeletonStyles.bottomSpace} />
    </ScrollView>
  );
});

DashboardSkeleton.displayName = 'DashboardSkeleton';

const skeletonStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroPlaceholder: {
    backgroundColor: colors.primary + 'CC',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: { flex: 1, marginRight: 16 },
  ctaPlaceholder: { marginTop: 4 },

  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { marginBottom: 14 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metaRow: { flexDirection: 'row', gap: 12 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  appRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 },

  tutorCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
  },

  horizontalList: { paddingHorizontal: 16, paddingBottom: 4, gap: 14 },

  flex1: { flex: 1 },
  mb4: { marginBottom: 4 },
  mb6: { marginBottom: 6 },
  mb8: { marginBottom: 8 },
  mt8: { marginTop: 8 },

  bottomSpace: { height: 40 },
});

export default DashboardSkeleton;
