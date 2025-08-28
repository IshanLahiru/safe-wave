import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function HomeScreen() {
  const router = useRouter();
  const currentDate = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayName = dayNames[currentDate.getDay()];
  const monthName = monthNames[currentDate.getMonth()];
  const date = currentDate.getDate();
  const suffix = date === 1 ? 'st' : date === 2 ? 'nd' : date === 3 ? 'rd' : 'th';

  const handleStartCheckin = () => {
    router.push('/(tabs)/checkin');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header Section */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerLeft}>
          <ThemedView style={styles.logoContainer}>
            <IconSymbol size={24} name="wave.3.right" color="#007AFF" />
          </ThemedView>
          <ThemedView style={styles.welcomeText}>
            <ThemedText style={styles.welcomeBack}>Welcome back,</ThemedText>
            <ThemedText type="title" style={styles.userName}>Ishan Lahiru</ThemedText>
            <ThemedText style={styles.date}>{dayName}, {monthName} {date}{suffix}</ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedView style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <IconSymbol size={20} name="sun.max.fill" color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <IconSymbol size={20} name="arrow.right" color="#007AFF" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Daily Check-in Card */}
      <ThemedView style={styles.checkinCard}>
        <ThemedView style={styles.checkinIconContainer}>
          <IconSymbol size={40} name="mic.fill" color="white" />
        </ThemedView>
        <ThemedText type="title" style={styles.checkinTitle}>Daily Check-in</ThemedText>
        <ThemedText style={styles.checkinQuestion}>How are you feeling today?</ThemedText>
        <TouchableOpacity style={styles.checkinButton} onPress={handleStartCheckin}>
          <ThemedText style={styles.checkinButtonText}>Start Check-in</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Statistics Cards */}
      <ThemedView style={styles.statsContainer}>
        <ThemedView style={styles.statCard}>
          <IconSymbol size={24} name="message.fill" color="#007AFF" />
          <ThemedText type="title" style={styles.statNumber}>0</ThemedText>
          <ThemedText style={styles.statLabel}>Total Check-ins</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <IconSymbol size={24} name="calendar" color="#007AFF" />
          <ThemedText type="title" style={styles.statNumber}>0</ThemedText>
          <ThemedText style={styles.statLabel}>This Week</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <IconSymbol size={24} name="chart.line.uptrend.xyaxis" color="#007AFF" />
          <ThemedText type="title" style={styles.statNumber}>Stable</ThemedText>
          <ThemedText style={styles.statLabel}>Trend</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    gap: 4,
  },
  welcomeBack: {
    fontSize: 16,
    opacity: 0.7,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    opacity: 0.6,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkinCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
  },
  checkinIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkinTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  checkinQuestion: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 25,
    textAlign: 'center',
  },
  checkinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
  },
  checkinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
});
