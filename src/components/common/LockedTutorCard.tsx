import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';
import Card from './Card';
import Button from './Button';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  UnlockResult,
} from '../../services/unlockApi';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface LockedTutorCardProps {
  teacherId: string;
  token: string;
  tutorName: string;
  qualification: string;
  subjects: string[];
  city: string;
  hourlyRate: number;
  rating: number;
  experience: number;
  isVerified: boolean;
  onUnlockSuccess?: (result: UnlockResult) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// LockedTutorCard
// Displays public tutor info + locked contact zone.
// Parent unlocks by paying ₹49 + GST.
// ─────────────────────────────────────────────────────────────────────────────
const LockedTutorCard: React.FC<LockedTutorCardProps> = ({
  teacherId,
  token,
  tutorName,
  qualification,
  subjects,
  city,
  hourlyRate,
  rating,
  experience,
  isVerified,
  onUnlockSuccess,
}) => {
  const theme = useTheme();
  const [unlocking, setUnlocking] = useState(false);
  const [unlockedData, setUnlockedData] = useState<UnlockResult | null>(null);

  const isUnlocked = unlockedData !== null;

  const handleUnlock = () => {
    Alert.alert(
      'Unlock Tutor Contact',
      `Pay ₹49 + 18% GST to reveal ${tutorName}'s contact.\n\nAccess valid for 30 days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay & Unlock', onPress: startRazorpayFlow },
      ],
    );
  };

  const startRazorpayFlow = async () => {
    setUnlocking(true);
    try {
      // Step 1: Create Razorpay order on backend
      const order = await createRazorpayOrder(token, 'unlock_tutor', teacherId);

      // Step 2: Open Razorpay checkout
      let RazorpayCheckout: any;
      try {
        RazorpayCheckout = require('react-native-razorpay').default;
      } catch {
        Alert.alert('Error', 'Payment module not available. Please reinstall the app.');
        return;
      }

      const checkoutOptions = {
        key: order.keyId,
        amount: order.amount,           // in paise
        currency: order.currency,
        name: 'Tuition Marketplace',
        description: 'Tutor Contact Unlock',
        order_id: order.orderId,
        prefill: order.prefill,
        theme: order.theme,
      };

      const paymentResponse = await RazorpayCheckout.open(checkoutOptions);

      // Step 3: Verify signature on backend → unlock
      const result = await verifyRazorpayPayment(token, {
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
        internalPaymentId: order.internalPaymentId,
        type: 'unlock_tutor',
        targetId: teacherId,
      });

      setUnlockedData(result);
      onUnlockSuccess?.(result);
      Alert.alert('Unlocked! 🎉', `Contact revealed.\nPhone: ${result.contact.phone}`);
    } catch (err: any) {
      if (err?.code === 0) {
        Alert.alert('Cancelled', 'Payment was cancelled.');
      } else {
        Alert.alert('Payment Failed', err.message || 'Please try again.');
      }
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <Card variant="elevated" padding="medium" style={styles.card}>
      {/* Tutor Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
            {tutorName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.tutorName, { color: theme.colors.text }]}>
              {tutorName}
            </Text>
            {isVerified && (
              <Text style={styles.verifiedBadge}>✓</Text>
            )}
          </View>
          <Text style={[styles.qualification, { color: theme.colors.textSecondary }]}>
            {qualification} • {experience}y exp
          </Text>
          <Text style={[styles.location, { color: theme.colors.textSecondary }]}>
            📍 {city}
          </Text>
        </View>
        <View style={styles.rateBlock}>
          <Text style={[styles.rate, { color: theme.colors.primary }]}>
            ₹{hourlyRate}
          </Text>
          <Text style={[styles.rateLabel, { color: theme.colors.textSecondary }]}>
            /hr
          </Text>
        </View>
      </View>

      {/* Subjects */}
      <View style={styles.tagsRow}>
        {subjects.map((s, i) => (
          <View key={i} style={[styles.tag, { backgroundColor: theme.colors.primary + '12' }]}>
            <Text style={[styles.tagText, { color: theme.colors.primary }]}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Rating */}
      <View style={styles.ratingRow}>
        <Text style={styles.star}>⭐</Text>
        <Text style={[styles.ratingText, { color: theme.colors.text }]}>
          {rating > 0 ? rating.toFixed(1) : 'New'}
        </Text>
      </View>

      {/* Contact Zone */}
      <View style={[styles.contactZone, { borderColor: theme.colors.border }]}>
        {isUnlocked ? (
          <View>
            <Text style={[styles.contactLabel, { color: theme.colors.textSecondary }]}>
              Contact Details
            </Text>
            <ContactRow icon="📞" value={unlockedData!.contact.phone} theme={theme} />
            <ContactRow icon="✉️" value={unlockedData!.contact.email} theme={theme} />
            <ContactRow icon="📍" value={unlockedData!.contact.address} theme={theme} />
          </View>
        ) : (
          <View style={styles.lockedView}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={[styles.lockHint, { color: theme.colors.textSecondary }]}>
              Phone, email & address hidden
            </Text>
            <View style={styles.hiddenRows}>
              <HiddenRow label="Phone" />
              <HiddenRow label="Email" />
              <HiddenRow label="Address" />
            </View>
            <Button
              title={unlocking ? 'Processing…' : 'Unlock Contact  ₹49 + GST'}
              onPress={handleUnlock}
              disabled={unlocking}
              variant="primary"
              size="medium"
              style={styles.unlockBtn}
            />
            {unlocking && (
              <ActivityIndicator style={styles.spinner} color={theme.colors.primary} />
            )}
          </View>
        )}
      </View>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
const HiddenRow: React.FC<{ label: string }> = ({ label }) => {
  const theme = useTheme();
  return (
    <View style={styles.hiddenRow}>
      <Text style={[styles.hiddenLabel, { color: theme.colors.textSecondary }]}>
        {label}:
      </Text>
      <View style={[styles.hiddenBar, { backgroundColor: theme.colors.border }]} />
    </View>
  );
};

const ContactRow: React.FC<{ icon: string; value: string; theme: any }> = ({ icon, value, theme }) => (
  <View style={styles.contactRow}>
    <Text style={styles.contactIcon}>{icon}</Text>
    <Text style={[styles.contactValue, { color: theme.colors.text }]}>{value}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: '700',
  },
  verifiedBadge: {
    fontSize: 14,
    color: '#22C55E',
  },
  qualification: {
    fontSize: 12,
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    marginTop: 2,
  },
  rateBlock: {
    alignItems: 'flex-end',
  },
  rate: {
    fontSize: 18,
    fontWeight: '800',
  },
  rateLabel: {
    fontSize: 11,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  star: {
    fontSize: 13,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactZone: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  lockedView: {
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  lockHint: {
    fontSize: 12,
    marginBottom: 10,
  },
  hiddenRows: {
    width: '100%',
    marginBottom: 12,
  },
  hiddenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  hiddenLabel: {
    fontSize: 13,
    width: 60,
  },
  hiddenBar: {
    height: 12,
    flex: 1,
    borderRadius: 4,
    opacity: 0.4,
  },
  unlockBtn: {
    width: '100%',
  },
  spinner: {
    marginTop: 8,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default LockedTutorCard;
