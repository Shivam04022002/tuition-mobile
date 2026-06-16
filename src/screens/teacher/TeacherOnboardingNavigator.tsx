import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Step1BasicDetailsScreen from './Onboarding/Step1BasicDetailsScreen';
import Step2EducationScreen from './Onboarding/Step2EducationScreen';
import Step3TeachingDetailsScreen from './Onboarding/Step3TeachingDetailsScreen';
import Step4LocationAvailabilityScreen from './Onboarding/Step4LocationAvailabilityScreen';
import Step5PricingRevenueScreen from './Onboarding/Step5PricingRevenueScreen';
import Step6VerificationUploadScreen from './Onboarding/Step6VerificationUploadScreen';

const Stack = createNativeStackNavigator();

const TeacherOnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="Step1BasicDetails" 
        component={Step1BasicDetailsScreen}
        options={{ title: 'Basic Details' }}
      />
      <Stack.Screen 
        name="Step2Education" 
        component={Step2EducationScreen}
        options={{ title: 'Education' }}
      />
      <Stack.Screen 
        name="Step3TeachingDetails" 
        component={Step3TeachingDetailsScreen}
        options={{ title: 'Teaching Details' }}
      />
      <Stack.Screen 
        name="Step4LocationAvailability" 
        component={Step4LocationAvailabilityScreen}
        options={{ title: 'Location & Availability' }}
      />
      <Stack.Screen 
        name="Step5PricingRevenue" 
        component={Step5PricingRevenueScreen}
        options={{ title: 'Pricing & Revenue' }}
      />
      <Stack.Screen 
        name="Step6VerificationUpload" 
        component={Step6VerificationUploadScreen}
        options={{ title: 'Verification Upload' }}
      />
    </Stack.Navigator>
  );
};

export default TeacherOnboardingNavigator;
