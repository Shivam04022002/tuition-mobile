import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { usePayment } from '../../hooks/usePayment';
import { CreditPack } from '../../services/paymentApi';

// ─────────────────────────────────────────────────────────────────────────────
// Pack Card
// ─────────────────────────────────────────────────────────────────────────────
const PackCard: React.FC<{
  pack: CreditPack;
  gstRate: number;
  isProcessing: boolean;
  onBuy: (packId: string) => void;
}> = ({ pack, gstRate, isProcessing, onBuy }) => {
  const gstAmount = Math.round(pack.price * gstRate / 100);
  const totalAmount = pack.price + gstAmount;

  return (
    <View style={[styles.packCard, pack.popular && styles.packCardPopular]}>
      {pack.popular && (
        <View style={styles.popularBadge}>
          <Ionicons name="star" size={12} color="#FFF" />
          <Text style={styles.popularBadgeText}>Most Popular</Text>
        </View>
      )}

      <View style={styles.packHeader}>
        <View style={styles.packCreditsWrap}>
          <Text style={styles.packCredits}>{pack.credits}</Text>
          <Text style={styles.packCreditsLabel}>credits</Text>
        </View>
        <View style={styles.packSavingBadge}>
          <Text style={styles.packSavingText}>{pack.savings}% off</Text>
        </View>
      </View>

      <Text style={styles.packName}>{pack.name}</Text>
      <Text style={styles.packDesc}>{pack.description}</Text>

      <View style={styles.packPricing}>
        <Text style={styles.packOriginalPrice}>₹{pack.originalPrice}</Text>
        <Text style={styles.packPrice}>₹{pack.price}</Text>
        <Text style={styles.packGst}>+ ₹{gstAmount} GST</Text>
      </View>

      <View style={styles.packPerCredit}>
        <Ionicons name="pricetag-outline" size={12} color={colors.textSecondary} />
        <Text style={styles.packPerCreditText}>
          ₹{(totalAmount / pack.credits).toFixed(1)}/credit
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.buyBtn, pack.popular && styles.buyBtnPopular]}
        onPress={() => onBuy(pack.packId)}
        disabled={isProcessing}
        activeOpacity={0.85}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Ionicons name="flash" size={16} color="#FFF" />
            <Text style={styles.buyBtnText}>Buy — ₹{totalAmount}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const CreditPacksScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44);

  const {
    creditPacks,
    gstRate,
    isLoadingPacks,
    isProcessing,
    purchaseCreditPack,
  } = usePayment();

  const [processingPackId, setProcessingPackId] = useState<string | null>(null);

  const handleBuy = async (packId: string) => {
    const pack = creditPacks.find(p => p.packId === packId);
    if (!pack) return;

    const gstAmount = Math.round(pack.price * gstRate / 100);
    const total = pack.price + gstAmount;

    Alert.alert(
      'Buy Credit Pack',
      `Purchase ${pack.credits} credits for ₹${total} (incl. GST)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            setProcessingPackId(packId);
            const result = await purchaseCreditPack(packId);
            setProcessingPackId(null);
            if (result) {
              Alert.alert(
                'Credits Added! 🎉',
                `${result.creditsAdded} credits have been added to your account.\n\nTotal credits: ${result.creditsRemaining}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }],
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Credits</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoadingPacks ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading packs…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="flash" size={28} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Top up your credits</Text>
            <Text style={styles.heroDesc}>
              Need more unlocks? Buy credit packs at discounted prices. Credits never expire.
            </Text>
          </View>

          {/* Packs Grid */}
          {creditPacks.map(pack => (
            <PackCard
              key={pack.packId}
              pack={pack}
              gstRate={gstRate}
              isProcessing={isProcessing && processingPackId === pack.packId}
              onBuy={handleBuy}
            />
          ))}

          {/* Footer Note */}
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.textTertiary} />
            <Text style={styles.footerText}>
              Payments secured by Razorpay. Credits are added instantly after payment. GST @ {gstRate}% applicable.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
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
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  // Pack Card
  packCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  packCardPopular: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  packHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packCreditsWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  packCredits: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
  },
  packCreditsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  packSavingBadge: {
    backgroundColor: colors.success + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  packSavingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  packName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  packDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  packPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  packOriginalPrice: {
    fontSize: 14,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  packPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  packGst: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  packPerCredit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  packPerCreditText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 13,
  },
  buyBtnPopular: {
    backgroundColor: colors.primary,
  },
  buyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 12,
    color: colors.textTertiary,
    flex: 1,
    lineHeight: 17,
  },
});

export default CreditPacksScreen;
