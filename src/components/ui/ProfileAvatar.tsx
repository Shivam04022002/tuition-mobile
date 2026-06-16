import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface ProfileAvatarProps {
  name?: string;
  imageUri?: string;
  size?: number;
  verified?: boolean;
  style?: ViewStyle;
  showBorder?: boolean;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  name,
  imageUri,
  size = 56,
  verified = false,
  style,
  showBorder = false,
}) => {
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('')
    : '?';

  const badgeSize = Math.round(size * 0.32);

  return (
    <View style={[{ width: size, height: size }, style]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: showBorder ? 2.5 : 0,
              borderColor: showBorder ? '#FFFFFF' : 'transparent',
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: showBorder ? 2.5 : 0,
              borderColor: showBorder ? '#FFFFFF' : 'transparent',
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
        </View>
      )}
      {verified ? (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={badgeSize - 4} color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

export default ProfileAvatar;
