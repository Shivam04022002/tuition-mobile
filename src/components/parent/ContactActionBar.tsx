import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

// ── Analytics ─────────────────────────────────────────────────────────────────
const trackEvent = (event: string, payload?: Record<string, any>) => {
  if (__DEV__) {
    console.log(`[Analytics] ${event}`, payload || '');
  }
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface ContactActionBarProps {
  tutorName: string;
  phoneNumber?: string;
  onContactRequest: (type: 'call' | 'whatsapp' | 'message') => void;
  onDemoRequest: () => void;
  disabled?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ContactActionBar: React.FC<ContactActionBarProps> = ({
  tutorName,
  phoneNumber,
  onContactRequest,
  onDemoRequest,
  disabled = false,
}) => {
  const handleCall = useCallback(() => {
    if (!phoneNumber) {
      Alert.alert(
        'Phone Number Unavailable',
        `Would you like to send a contact request to ${tutorName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Request Contact', onPress: () => onContactRequest('call') },
        ]
      );
      return;
    }

    trackEvent('Phone Call Clicked', { tutorName });
    
    const url = `tel:+91${phoneNumber.replace(/\D/g, '')}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open phone dialer');
      }
    });
  }, [phoneNumber, tutorName, onContactRequest]);

  const handleWhatsApp = useCallback(() => {
    trackEvent('WhatsApp Clicked', { tutorName });

    const message = `Hello, I found your profile on Home Tuition App and would like to discuss tuition requirements.`;
    
    if (phoneNumber) {
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      const url = `https://wa.me/91${cleanNumber}?text=${encodeURIComponent(message)}`;
      
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to contact request
          Alert.alert(
            'WhatsApp Not Available',
            `Would you like to send a contact request to ${tutorName} instead?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Request Contact', onPress: () => onContactRequest('whatsapp') },
            ]
          );
        }
      });
    } else {
      // No phone number, send contact request
      onContactRequest('whatsapp');
    }
  }, [phoneNumber, tutorName, onContactRequest]);

  const handleMessage = useCallback(() => {
    trackEvent('Message Request Clicked', { tutorName });
    onContactRequest('message');
  }, [tutorName, onContactRequest]);

  const handleDemo = useCallback(() => {
    trackEvent('Demo Requested', { tutorName });
    onDemoRequest();
  }, [tutorName, onDemoRequest]);

  return (
    <View style={styles.container}>
      {/* Primary Actions */}
      <View style={styles.primaryRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.callBtn, disabled && styles.disabled]}
          onPress={handleCall}
          disabled={disabled}
        >
          <Ionicons name="call-outline" size={20} color={colors.textWhite} />
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionBtn, styles.whatsappBtn, disabled && styles.disabled]}
          onPress={handleWhatsApp}
          disabled={disabled}
        >
          <Ionicons name="logo-whatsapp" size={20} color={colors.textWhite} />
          <Text style={styles.whatsappBtnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Actions */}
      <View style={styles.secondaryRow}>
        <TouchableOpacity
          style={[styles.secondaryBtn, disabled && styles.disabled]}
          onPress={handleMessage}
          disabled={disabled}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>Message</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.secondaryBtn, disabled && styles.disabled]}
          onPress={handleDemo}
          disabled={disabled}
        >
          <Ionicons name="videocam-outline" size={18} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>Request Demo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
    ...shadows.lg,
  },
  primaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  callBtn: {
    backgroundColor: colors.primary,
  },
  whatsappBtn: {
    backgroundColor: '#25D366', // WhatsApp green
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    gap: 6,
  },
  callBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textWhite,
  },
  whatsappBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textWhite,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default React.memo(ContactActionBar);
