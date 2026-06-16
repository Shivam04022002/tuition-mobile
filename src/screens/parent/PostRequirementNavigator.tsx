import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Step1StudentDetailsScreen from './PostRequirement/Step1StudentDetailsScreen';
import Step2SubjectsPreferencesScreen from './PostRequirement/Step2SubjectsPreferencesScreen';
import Step3LocationScreen from './PostRequirement/Step3LocationScreen';
import Step4ScheduleBudgetScreen from './PostRequirement/Step4ScheduleBudgetScreen';
import Step5RequirementPreviewScreen from './PostRequirement/Step5RequirementPreviewScreen';

const Stack = createNativeStackNavigator();

const PostRequirementNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="Step1StudentDetails" 
        component={Step1StudentDetailsScreen}
        options={{ title: 'Student Details' }}
      />
      <Stack.Screen 
        name="Step2SubjectsPreferences" 
        component={Step2SubjectsPreferencesScreen}
        options={{ title: 'Subjects & Preferences' }}
      />
      <Stack.Screen 
        name="Step3Location" 
        component={Step3LocationScreen}
        options={{ title: 'Location' }}
      />
      <Stack.Screen 
        name="Step4ScheduleBudget" 
        component={Step4ScheduleBudgetScreen}
        options={{ title: 'Schedule & Budget' }}
      />
      <Stack.Screen 
        name="Step5RequirementPreview" 
        component={Step5RequirementPreviewScreen}
        options={{ title: 'Review & Post' }}
      />
    </Stack.Navigator>
  );
};

export default PostRequirementNavigator;
