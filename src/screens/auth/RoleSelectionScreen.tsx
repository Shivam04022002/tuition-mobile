import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch } from '../../redux/store';
import { setRole } from '../../redux/slices/userSlice';
import { useTheme } from '../../theme';

type AuthStackParamList = {
  RoleSelection: undefined;
  Login: undefined;
  Signup: { role: 'parent' | 'teacher' };
  OTPVerification: undefined;
  ForgotPassword: undefined;
  TeacherRegistration: undefined;
  ParentRegistration: undefined;
};

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const RoleSelectionScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'parent' | 'teacher' | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const handleRoleSelect = useCallback(async (role: 'parent' | 'teacher') => {
    console.log('[ROLE_SELECT]', role);
    setSelectedRole(role);
    setLoading(true);

    // Fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Dispatch role to Redux
    dispatch(setRole(role));
    console.log('[ROLE_SAVED]');

    // Wait ~1.5 seconds for transition
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Navigate directly to registration screen based on role
    console.log('[NAVIGATING_TO_REGISTRATION]', role);
    if (role === 'parent') {
      navigation.navigate('ParentRegistration');
    } else {
      navigation.navigate('TeacherRegistration');
    }
  }, [dispatch, navigation, fadeAnim]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Choose Your Role
        </Text>

        <TouchableOpacity
          style={[
            styles.roleButton,
            { backgroundColor: theme.colors.primary },
            selectedRole === 'parent' && loading && styles.buttonDisabled,
          ]}
          onPress={() => handleRoleSelect('parent')}
          disabled={loading}
        >
          {selectedRole === 'parent' && loading ? (
            <ActivityIndicator color={theme.colors.textWhite} size="small" />
          ) : (
            <Text style={[styles.roleText, { color: theme.colors.textWhite }]}>
              I'm a Parent
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            { backgroundColor: theme.colors.secondary },
            selectedRole === 'teacher' && loading && styles.buttonDisabled,
          ]}
          onPress={() => handleRoleSelect('teacher')}
          disabled={loading}
        >
          {selectedRole === 'teacher' && loading ? (
            <ActivityIndicator color={theme.colors.textWhite} size="small" />
          ) : (
            <Text style={[styles.roleText, { color: theme.colors.textWhite }]}>
              I'm a Teacher
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Preparing your experience...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  roleButton: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    minHeight: 64,
  },
  buttonDisabled: {
    opacity: 0.8,
  },
  roleText: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default RoleSelectionScreen;
