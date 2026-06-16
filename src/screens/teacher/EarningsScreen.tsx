import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EarningsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Earnings</Text>
      
      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsAmount}>₹45,000</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₹15,000</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
      </View>
    </View>
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
  earningsCard: {
    backgroundColor: '#007AFF',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default EarningsScreen;
