import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const AdminAnalyticsScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Analytics</Text>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Monthly Revenue</Text>
        <Text style={styles.chartValue}>₹2,50,000</Text>
        <Text style={styles.chartChange}>+15% from last month</Text>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>New Users</Text>
        <Text style={styles.chartValue}>234</Text>
        <Text style={styles.chartChange}>+8% from last month</Text>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Active Sessions</Text>
        <Text style={styles.chartValue}>1,567</Text>
        <Text style={styles.chartChange}>+22% from last month</Text>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Tutor Applications</Text>
        <Text style={styles.chartValue}>45</Text>
        <Text style={styles.chartChange}>Pending approval: 12</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  chartValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  chartChange: {
    fontSize: 14,
    color: '#28a745',
    marginTop: 4,
  },
});

export default AdminAnalyticsScreen;
