import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ParentOnboardingScreenProps {
  navigation: any;
}

const ParentOnboardingScreen: React.FC<ParentOnboardingScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parent Onboarding</Text>
      <Text style={styles.subtitle}>Find the perfect tutor for your child</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('ProfileCompletion')}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ParentOnboardingScreen;
