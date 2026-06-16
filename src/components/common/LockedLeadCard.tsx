import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
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
interface LockedLeadCardProps {
  requirementId: string;
  token: string;
  studentName: string;
  grade: string;
  subjects: string[];
  city: string;
  budgetMin: number;
  budgetMax: number;
  daysPerWeek: string;
  onUnlockSuccess?: (result: UnlockResult) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// LockedLeadCard
// Displays public lead info + locked contact zone.
// Teacher unlocks by paying ₹99 + GST.
// ─────────────────────────────────────────────────────────────────────────────
const LockedLeadCard: React.FC<LockedLeadCardProps> = ({
  requirementId,
  token,
  studentName,
  grade,
  subjects,
  city,
  budgetMin,
  budgetMax,
  daysPerWeek,
  onUnlockSuccess,
}) => {
  const theme = useTheme();
  const [unlocking, setUnlocking] = useState(false);
  const [unlockedData, setUnlockedData] = useState<UnlockResult | null>(null);

  const isUnlocked = unlockedData !== null;

  const handleUnlock = () => {
    Alert.alert(
      'Unlock Lead',
      `Pay ₹99 + 18% GST to reveal parent contact.\n\nAccess valid for 30 days.`,
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
      const order = await createRazorpayOrder(token, 'unlock_lead', requirementId);

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
        description: 'Lead Contact Unlock',
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
        type: 'unlock_lead',
        targetId: requirementId,
      });

      setUnlockedData(result);
      onUnlockSuccess?.(result);
      Alert.alert('Unlocked! 🎉', `Contact revealed.\nPhone: ${result.contact.phone}`);
    } catch (err: any) {
      // Razorpay checkout dismissed returns code 0
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
      {/* Lead Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.studentName, { color: theme.colors.text }]}>
            {studentName}
          </Text>
          <Text style={[styles.grade, { color: theme.colors.textSecondary }]}>
            {grade} • {city}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.colors.primary + '18' }]}>
          <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
            ₹{budgetMin}–{budgetMax}/mo
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

      <Text style={[styles.schedule, { color: theme.colors.textSecondary }]}>
        {daysPerWeek} days/week
      </Text>

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
            <Text style={[styles.lockIcon]}>🔒</Text>
            <View style={styles.hiddenRows}>
              <HiddenRow label="Phone" />
              <HiddenRow label="Email" />
              <HiddenRow label="Address" />
            </View>
            <Button
              title={unlocking ? 'Processing…' : 'Unlock Contact  ₹99 + GST'}
              onPress={handleUnlock}
              disabled={unlocking}
              variant="primary"
              size="medium"
              style={styles.unlockBtn}
            />
            {unlocking && (
              <ActivityIndicator
                style={styles.spinner}
                color={theme.colors.primary}
              />
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
  },
  grade: {
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
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
  schedule: {
    fontSize: 12,
    marginBottom: 12,
  },
  contactZone: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  lockedView: {
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 28,
    marginBottom: 8,
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

export default LockedLeadCard;
