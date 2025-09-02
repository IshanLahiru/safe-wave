import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ApiConnectionTest from '@/components/ApiConnectionTest';
import { useRouter } from 'expo-router';

export default function ApiTestScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <IconSymbol
          size={24}
          name="chevron.left"
          color="#007AFF"
          style={styles.backButton}
          onPress={() => router.back()}
        />
        <ThemedText type="title" style={styles.headerTitle}>
          🔌 API Connection Test
        </ThemedText>
        <View style={styles.placeholder} />
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ApiConnectionTest />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
});
