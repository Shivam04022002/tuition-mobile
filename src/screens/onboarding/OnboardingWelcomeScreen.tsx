import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface OnboardingWelcomeScreenProps {
  navigation: any;
}

const OnboardingWelcomeScreen: React.FC<OnboardingWelcomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Tuition Marketplace</Text>
      <Text style={styles.subtitle}>Find the best tutors or teaching jobs</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('RoleSelection')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
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
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
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

export default OnboardingWelcomeScreen;
