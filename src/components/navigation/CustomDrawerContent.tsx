import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { selectUserProfile, selectUserRole } from '../../redux/slices/userSlice';
import { logout } from '../../redux/slices/authSlice';
import { useTheme } from '../../theme';

interface DrawerItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: number;
}

const DrawerItem: React.FC<DrawerItemProps> = ({ icon, label, onPress, badge }) => {
  const theme = useTheme();

  return (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
      <View style={styles.drawerItemLeft}>
        <Ionicons
          name={icon as any}
          size={24}
          color={theme.colors.textSecondary}
          style={styles.drawerIcon}
        />
        <Text style={[styles.drawerItemText, { color: theme.colors.text }]}>
          {label}
        </Text>
      </View>
      {badge && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
          <Text style={[styles.badgeText, { color: theme.colors.textWhite }]}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector(selectUserProfile);
  const userRole = useAppSelector(selectUserRole);

  const handleLogout = () => {
    dispatch(logout());
    props.navigation.closeDrawer();
  };

  const drawerItems = [
    { icon: 'home-outline', label: 'Dashboard', onPress: () => props.navigation.navigate('Home') },
    { icon: 'person-outline', label: 'My Profile', onPress: () => props.navigation.navigate('Profile') },
    { icon: 'card-outline', label: 'Payments', onPress: () => console.log('Payments pressed') },
    { icon: 'help-circle-outline', label: 'Support', onPress: () => console.log('Support pressed') },
    { icon: 'settings-outline', label: 'Settings', onPress: () => console.log('Settings pressed') },
    { icon: 'log-out-outline', label: 'Logout', onPress: handleLogout },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.profileSection}>
          <Image
            source={
              userProfile?.profileImage
                ? { uri: userProfile.profileImage }
                : { uri: 'https://via.placeholder.com/80/007AFF/FFFFFF?text=User' }
            }
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.text }]}>
              {userProfile?.firstName || 'User'} {userProfile?.lastName || ''}
            </Text>
            <Text style={[styles.profileRole, { color: theme.colors.textSecondary }]}>
              {userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'User'}
            </Text>
          </View>
        </View>
      </View>

      {/* Drawer Items */}
      <ScrollView style={styles.drawerItems} showsVerticalScrollIndicator={false}>
        {drawerItems.map((item, index) => (
          <DrawerItem
            key={index}
            icon={item.icon}
            label={item.label}
            onPress={item.onPress}
            badge={item.label === 'Notifications' ? 3 : undefined}
          />
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
          Version 1.0.0
        </Text>
        <Text style={[styles.disclaimer, { color: theme.colors.textTertiary }]}>
          We connect tutors and parents. We do not provide tutoring services.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    opacity: 0.8,
  },
  drawerItems: {
    flex: 1,
    paddingVertical: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  drawerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  drawerIcon: {
    marginRight: 16,
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
  disclaimer: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 14,
  },
});

export default CustomDrawerContent;
