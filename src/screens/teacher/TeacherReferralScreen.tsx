import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Clipboard,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { useReferral } from '../../hooks/useReferral';
import { ReferralStatusBadge } from '../../components/teacher/ReferralStatusBadge';

const TeacherReferralScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    myReferralCode,
    referralStats,
    referrals,
    shareMessage,
    isLoading,
    isLoadingReferrals,
    error,
    refreshMyCode,
    refreshReferrals,
    shareReferral,
    clearError,
  } = useReferral();

  useEffect(() => {
    refreshMyCode();
    refreshReferrals();
  }, []);

  const handleCopyCode = useCallback(() => {
    if (myReferralCode) {
      Clipboard.setString(myReferralCode);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    }
  }, [myReferralCode]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: shareMessage || `Join me on Tuition Marketplace! Use my referral code ${myReferralCode} to get 20% off your first subscription.`,
        title: 'Join me on Tuition Marketplace',
      });
    } catch (err) {
      // Share cancelled
    }
  }, [shareMessage, myReferralCode]);

  const handleRefresh = useCallback(() => {
    refreshMyCode();
    refreshReferrals();
  }, [refreshMyCode, refreshReferrals]);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Refer & Earn</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderReferralCodeCard = () => (
    <View style={styles.codeCard}>
      <View style={styles.codeHeader}>
        <Ionicons name="gift-outline" size={24} color={colors.success} />
        <Text style={styles.codeTitle}>Your Referral Code</Text>
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{myReferralCode || '---'}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.card} />
            <Text style={styles.shareButtonText}>Share with Friends</Text>
          </TouchableOpacity>
          
          <Text style={styles.codeDescription}>
            Share your code with fellow teachers. When they sign up and make their first purchase, you'll earn 10 credits!
          </Text>
        </>
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{referralStats?.totalReferrals || 0}</Text>
        <Text style={styles.statLabel}>Total Referrals</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{referralStats?.rewarded || 0}</Text>
        <Text style={styles.statLabel}>Successful</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{referralStats?.totalRewardsEarned || 0}</Text>
        <Text style={styles.statLabel}>Credits Earned</Text>
      </View>
    </View>
  );

  const renderReferralsList = () => (
    <View style={styles.referralsSection}>
      <Text style={styles.sectionTitle}>Referral History</Text>
      
      {isLoadingReferrals ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : referrals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No referrals yet</Text>
          <Text style={styles.emptySubtext}>
            Share your code to start earning rewards!
          </Text>
        </View>
      ) : (
        referrals.map(referral => (
          <View key={referral._id} style={styles.referralItem}>
            <View style={styles.referralInfo}>
              <Text style={styles.referralName}>{referral.referredName || 'Unknown'}</Text>
              <Text style={styles.referralEmail}>{referral.referredEmail || '---'}</Text>
              <Text style={styles.referralDate}>
                {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : '---'}
              </Text>
            </View>
            <ReferralStatusBadge status={referral.status} />
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading || isLoadingReferrals} onRefresh={handleRefresh} />
        }
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
        
        {renderReferralCodeCard()}
        {renderStats()}
        {renderReferralsList()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.error + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    flex: 1,
  },
  codeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...shadows.sm,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
  },
  copyButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
  },
  codeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  referralsSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  loader: {
    padding: 24,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  referralItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  referralEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  referralDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default TeacherReferralScreen;
