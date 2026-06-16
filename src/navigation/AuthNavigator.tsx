import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import TeacherRegistrationScreen from '../screens/auth/TeacherRegistrationScreen';
import ParentRegistrationScreen from '../screens/auth/ParentRegistrationScreen';

export type AuthStackParamList = {
  Login: undefined;
  RoleSelection: undefined;
  Signup: { role?: 'parent' | 'teacher' } | undefined;
  OTPVerification: { phoneNumber: string; role?: string };
  ForgotPassword: undefined;
  TeacherRegistration: undefined;
  ParentRegistration: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      id={undefined}
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="TeacherRegistration" component={TeacherRegistrationScreen} />
      <Stack.Screen name="ParentRegistration" component={ParentRegistrationScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
