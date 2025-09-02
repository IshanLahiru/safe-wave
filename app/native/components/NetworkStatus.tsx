import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import apiService from '@/services/api';

interface NetworkStatusProps {
  showDetails?: boolean;
}

export default function NetworkStatus({ showDetails = false }: NetworkStatusProps) {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
  const [details, setDetails] = useState<string>('');
  const [url, setUrl] = useState<string>('');

  const checkServerStatus = async () => {
    setStatus('checking');
    try {
      const serverStatus = await apiService.getServerStatus();
      setStatus(serverStatus.status as any);
      setDetails(serverStatus.details);
      setUrl(serverStatus.url);
    } catch (error) {
      setStatus('error');
      setDetails(error instanceof Error ? error.message : 'Unknown error');
      setUrl('');
    }
  };

  useEffect(() => {
    checkServerStatus();

    // Check status every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return '#34C759';
      case 'offline':
        return '#FF3B30';
      case 'error':
        return '#FF9500';
      case 'checking':
        return '#007AFF';
      default:
        return '#687076';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return '🟢';
      case 'offline':
        return '🔴';
      case 'error':
        return '🟡';
      case 'checking':
        return '🔄';
      default:
        return '⚪';
    }
  };

  const handleRetry = () => {
    checkServerStatus();
  };

  const handleShowDetails = () => {
    Alert.alert(
      'Server Status Details',
      `Status: ${status.toUpperCase()}\n\nDetails: ${details}\n\nURL: ${url}`,
      [{ text: 'OK' }]
    );
  };

  if (!showDetails && status === 'online') {
    return null; // Hide when online and not showing details
  }

  return (
    <View style={[styles.container, { borderColor: getStatusColor() }]}>
      <View style={styles.statusRow}>
        <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {status === 'checking'
            ? 'Checking...'
            : status === 'online'
              ? 'Connected'
              : status === 'offline'
                ? 'Server Offline'
                : 'Connection Error'}
        </Text>
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {showDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsText}>{details}</Text>
          <Text style={styles.urlText}>{url}</Text>
          <TouchableOpacity onPress={handleShowDetails} style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>More Info</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIcon: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  retryButton: {
    padding: 4,
  },
  retryText: {
    fontSize: 16,
  },
  detailsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailsText: {
    fontSize: 12,
    color: '#687076',
    marginBottom: 4,
  },
  urlText: {
    fontSize: 12,
    color: '#007AFF',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  detailsButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 4,
  },
  detailsButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});
