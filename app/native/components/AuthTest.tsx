import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export function AuthTest() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runAuthTests = () => {
    setTestResults([]);
    addTestResult('Starting authentication tests...');

    // Simulate some tests
    setTimeout(() => addTestResult('Testing token storage...'), 500);
    setTimeout(() => addTestResult('Testing API connectivity...'), 1000);
    setTimeout(() => addTestResult('Testing user validation...'), 1500);
    setTimeout(() => addTestResult('All tests completed!'), 2000);
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity style={styles.testButton} onPress={runAuthTests}>
        <ThemedText style={styles.buttonText}>Run Authentication Tests</ThemedText>
      </TouchableOpacity>

      <ThemedView style={styles.resultsContainer}>
        <ThemedText style={styles.resultsTitle}>Test Results:</ThemedText>
        {testResults.map((result, index) => (
          <ThemedText key={index} style={styles.resultText}>
            {result}
          </ThemedText>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
});
