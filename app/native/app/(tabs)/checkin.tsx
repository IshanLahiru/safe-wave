import React, { useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, Platform, Dimensions, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUser } from '@/contexts/UserContext';

export default function CheckInScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  // Get screen dimensions for responsive design
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375; // iPhone SE, small Android devices
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414; // iPhone 12, 13, 14
  const isLargeScreen = screenWidth >= 414; // iPhone 12 Pro Max, larger devices
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<Array<{ uri: string; duration: number; timestamp: Date }>>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  async function startRecording() {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permissions to record audio.');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      Alert.alert('Recording Started', 'Patient safety check recording has begun.');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  }

  async function stopRecording() {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const newRecording = {
          uri,
          duration: recordingTime,
          timestamp: new Date(),
        };
        setRecordings(prev => [newRecording, ...prev]);

        Alert.alert(
          'Recording Complete',
          `Patient safety check recorded for ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')} minutes.`
        );
      }

      setRecording(null);
      setRecordingTime(0);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  }

  async function playRecording(uri: string) {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.error('Failed to play recording', err);
      Alert.alert('Error', 'Failed to play recording.');
    }
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <ScrollView
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + 20, 60), // Safe area + minimum padding
          paddingBottom: 120, // Account for tab bar
        }
      ]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <ThemedView style={styles.header}>
        <IconSymbol size={60} name="mic.fill" color="#007AFF" />
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.title}>Daily Check-in</ThemedText>
          <ThemedText style={styles.subtitle}>
            {user?.name ? `${user.name}'s Daily Status` : 'Your Daily Status'}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Main Recording Section */}
      <ThemedView style={styles.mainContent}>
        {/* Timer Section - Centered */}
        <ThemedView style={styles.timerSection}>
          <ThemedView style={[
            styles.timerContainer,
            {
              padding: isSmallScreen ? 15 : isMediumScreen ? 18 : 20,
              maxWidth: isSmallScreen ? 250 : isMediumScreen ? 280 : 300,
            }
          ]}>
            <ThemedText type="title" style={[
              styles.timer,
              {
                fontSize: isSmallScreen ? 40 : isMediumScreen ? 44 : 48,
                lineHeight: isSmallScreen ? 48 : isMediumScreen ? 52 : 56,
              }
            ]}>
              {formatTime(recordingTime)}
            </ThemedText>
            <ThemedText style={[
              styles.timerLabel,
              {
                fontSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
                lineHeight: isSmallScreen ? 18 : isMediumScreen ? 19 : 20,
              }
            ]}>
              {isRecording ? 'Recording...' : 'Ready to record'}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Controls Section - Centered */}
        <ThemedView style={styles.controlsSection}>
          {!isRecording ? (
            <TouchableOpacity style={[
              styles.recordButton,
              {
                paddingHorizontal: isSmallScreen ? 25 : isMediumScreen ? 28 : 30,
                paddingVertical: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
                minWidth: isSmallScreen ? 160 : isMediumScreen ? 170 : 180,
                maxWidth: isSmallScreen ? 220 : isMediumScreen ? 235 : 250,
              }
            ]} onPress={startRecording}>
              <IconSymbol size={isSmallScreen ? 36 : isMediumScreen ? 38 : 40} name="mic.fill" color="white" />
              <ThemedText style={styles.recordButtonText}>Start Recording</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[
              styles.stopButton,
              {
                paddingHorizontal: isSmallScreen ? 25 : isMediumScreen ? 28 : 30,
                paddingVertical: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
                minWidth: isSmallScreen ? 160 : isMediumScreen ? 170 : 180,
                maxWidth: isSmallScreen ? 220 : isMediumScreen ? 235 : 250,
              }
            ]} onPress={stopRecording}>
              <IconSymbol size={isSmallScreen ? 36 : isMediumScreen ? 38 : 40} name="stop.fill" color="white" />
              <ThemedText style={styles.stopButtonText}>Stop Recording</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        {/* Safety Tips Section */}
        <ThemedView style={styles.safetyTips}>
          <ThemedText type="defaultSemiBold" style={styles.tipsTitle}>
            Safety Check Guidelines:
          </ThemedText>
          <ThemedText style={styles.tip}>• Ask patient to speak clearly</ThemedText>
          <ThemedText style={styles.tip}>• Verify they can respond appropriately</ThemedText>
          <ThemedText style={styles.tip}>• Check for any signs of distress</ThemedText>
          <ThemedText style={styles.tip}>• Confirm their current location</ThemedText>
        </ThemedView>
      </ThemedView>

      {recordings.length > 0 && (
        <ThemedView style={styles.recordingsSection}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Recent Recordings
          </ThemedText>
          {recordings.map((recording, index) => (
            <ThemedView key={index} style={styles.recordingItem}>
              <ThemedView style={styles.recordingInfo}>
                <ThemedText style={styles.recordingTime}>
                  {recording.timestamp.toLocaleTimeString()}
                </ThemedText>
                <ThemedText style={styles.recordingDuration}>
                  Duration: {formatTime(recording.duration)}
                </ThemedText>
              </ThemedView>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => playRecording(recording.uri)}
              >
                <IconSymbol size={24} name="play.fill" color="#007AFF" />
                <ThemedText style={styles.playButtonText}>Play</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ))}
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  titleContainer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 15,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    minHeight: 120,
  },
  timerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
    width: '100%',
    maxWidth: 280,
    minHeight: 100,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007AFF',
    textAlign: 'center',
    lineHeight: 56,
  },
  timerLabel: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  controlsSection: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  recordButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    minWidth: 180,
    maxWidth: 250,
    justifyContent: 'center',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    minWidth: 180,
    maxWidth: 250,
    justifyContent: 'center',
  },
  stopButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  safetyTips: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    padding: 20,
    borderRadius: 18,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.15)',
    marginBottom: 20,
  },
  tipsTitle: {
    marginBottom: 12,
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  tip: {
    marginBottom: 6,
    opacity: 0.8,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'left',
  },
  recordingsSection: {
    width: '100%',
    maxWidth: 400,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#007AFF',
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  recordingDuration: {
    fontSize: 14,
    opacity: 0.7,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  playButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
