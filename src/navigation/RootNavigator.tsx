import React from 'react';
import { useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { selectIsLoggedIn, selectAuthRole, selectAuthOnboardingCompleted } from '../redux/slices/authSlice';
import { selectSplashScreenVisible } from '../redux/slices/appSlice';

// Import Navigators
import AuthNavigator from './AuthNavigator';
import ParentNavigator from './ParentNavigator';
import TeacherNavigator from './TeacherNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import AdminNavigator from './AdminNavigator';
import StaffNavigator from './StaffNavigator';

// Import Screens
import SplashScreen from '../screens/SplashScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';

const Stack = createNativeStackNavigator();

const RootNavigator: React.FC = () => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const userRole = useSelector(selectAuthRole);
  const onboardingCompleted = useSelector(selectAuthOnboardingCompleted);
  const isSplashVisible = useSelector(selectSplashScreenVisible);

  // Debug logging
  console.log('🧭 [ROOT_NAVIGATOR] State:', {
    isLoggedIn,
    userRole,
    onboardingCompleted,
    isSplashVisible,
  });
  console.log('🧭 [ROOT_NAVIGATOR] Source: isLoggedIn+onboardingCompleted both from authSlice (atomic)');

  return (
    <NavigationContainer>
      <Stack.Navigator
        id="RootStackNavigator"
        screenOptions={{ headerShown: false }}>
        {isSplashVisible ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : (
          <>
            {!isLoggedIn && <Stack.Screen name="Auth" component={AuthNavigator} />}
            {isLoggedIn && !onboardingCompleted && <Stack.Screen name="Onboarding" component={OnboardingNavigator} />}
            {isLoggedIn && onboardingCompleted && userRole === 'parent' && <Stack.Screen name="Main" component={ParentNavigator} />}
            {isLoggedIn && onboardingCompleted && userRole === 'teacher' && <Stack.Screen name="Main" component={TeacherNavigator} />}
            {isLoggedIn && onboardingCompleted && userRole === 'admin' && <Stack.Screen name="Main" component={AdminNavigator} />}
            {isLoggedIn && onboardingCompleted && userRole === 'staff' && <Stack.Screen name="Main" component={StaffNavigator} />}
            {isLoggedIn && onboardingCompleted && !userRole && <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
