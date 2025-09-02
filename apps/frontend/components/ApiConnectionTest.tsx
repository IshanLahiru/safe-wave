import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { apiService } from '../services/api';

export default function ApiConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});

  const testEndpoint = async (name: string, testFn: () => Promise<any>) => {
    setIsLoading(true);
    try {
      const result = await testFn();
      setResults(prev => ({ ...prev, [name]: { success: true, data: result } }));
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [name]: {
          success: false,
          error: error.message || 'Unknown error',
        },
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const testHealthCheck = () => testEndpoint('Health Check', () => apiService.healthCheck());
  const testLogin = () =>
    testEndpoint('Login', () =>
      apiService.login({ email: 'test@example.com', password: 'password' })
    );
  const testSignup = () =>
    testEndpoint('Signup', () =>
      apiService.signup({ email: 'test@example.com', name: 'Test User', password: 'password' })
    );
  const testGetUser = () => testEndpoint('Get User', () => apiService.getCurrentUser());

  const renderResult = (name: string) => {
    const result = results[name];
    if (!result) return null;

    return (
      <View style={styles.resultContainer}>
        <ThemedText style={[styles.resultTitle, { color: result.success ? '#4CAF50' : '#F44336' }]}>
          {name}: {result.success ? '✅ Success' : '❌ Failed'}
        </ThemedText>
        {result.success ? (
          <ThemedText style={styles.resultData}>{JSON.stringify(result.data, null, 2)}</ThemedText>
        ) : (
          <ThemedText style={styles.resultError}>Error: {result.error}</ThemedText>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type='title' style={styles.title}>
        🔌 API Connection Test
      </ThemedText>

      <ThemedText style={styles.description}>
        Test your frontend-backend connection by clicking the buttons below.
      </ThemedText>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.testButton} onPress={testHealthCheck} disabled={isLoading}>
          <ThemedText style={styles.buttonText}>🏥 Health Check</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testLogin} disabled={isLoading}>
          <ThemedText style={styles.buttonText}>🔐 Test Login</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testSignup} disabled={isLoading}>
          <ThemedText style={styles.buttonText}>📝 Test Signup</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testGetUser} disabled={isLoading}>
          <ThemedText style={styles.buttonText}>👤 Test Get User</ThemedText>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Testing...</ThemedText>
        </View>
      )}

      <View style={styles.resultsContainer}>
        {Object.keys(results).map(name => renderResult(name))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  resultsContainer: {
    gap: 15,
  },
  resultContainer: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  resultTitle: {
    fontWeight: '600',
    marginBottom: 10,
  },
  resultData: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: 'rgba: 0, 0, 0, 0.05',
    padding: 10,
    borderRadius: 5,
  },
  resultError: {
    fontSize: 12,
    color: '#F44336',
  },
});
