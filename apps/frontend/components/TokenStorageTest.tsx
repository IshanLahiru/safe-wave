import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export function TokenStorageTest() {
    const [testResults, setTestResults] = useState<string[]>([]);

    const runTokenTests = () => {
        setTestResults([]);
        setTestResults(prev => [...prev, 'Testing token storage...']);

        // Simulate token tests
        setTimeout(() => setTestResults(prev => [...prev, 'Testing token retrieval...']), 500);
        setTimeout(() => setTestResults(prev => [...prev, 'Testing token validation...']), 1000);
        setTimeout(() => setTestResults(prev => [...prev, 'Token storage tests completed!']), 1500);
    };

    return (
        <ThemedView style={styles.container}>
            <TouchableOpacity style={styles.testButton} onPress={runTokenTests}>
                <ThemedText style={styles.buttonText}>Run Token Storage Tests</ThemedText>
            </TouchableOpacity>

            <ThemedView style={styles.resultsContainer}>
                <ThemedText style={styles.resultsTitle}>Token Storage Test Results:</ThemedText>
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