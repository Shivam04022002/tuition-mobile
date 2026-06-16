import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../redux/store';
import { selectUserRole } from '../redux/slices/userSlice';

// Import Screens
import OnboardingWelcomeScreen from '../screens/onboarding/OnboardingWelcomeScreen';
import ParentOnboardingScreen from '../screens/onboarding/ParentOnboardingScreen';
import TeacherOnboardingScreen from '../screens/onboarding/TeacherOnboardingScreen';
import ProfileCompletionScreen from '../screens/onboarding/ProfileCompletionScreen';

const Stack = createNativeStackNavigator();

const OnboardingNavigator: React.FC = () => {
  const userRole = useAppSelector(selectUserRole);

  return (
    <Stack.Navigator
      id="OnboardingStackNavigator"
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={OnboardingWelcomeScreen} />
      <Stack.Screen name="ParentOnboarding" component={ParentOnboardingScreen} />
      <Stack.Screen name="TeacherOnboarding" component={TeacherOnboardingScreen} />
      <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
