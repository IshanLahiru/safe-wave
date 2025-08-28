import React, { useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function CheckInScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
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
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol size={60} name="mic.fill" color="#007AFF" />
        <ThemedText type="title" style={styles.title}>Patient Safety Check</ThemedText>
        <ThemedText style={styles.subtitle}>
          Record audio to verify patient safety and well-being
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.recordingSection}>
        <ThemedView style={styles.timerContainer}>
          <ThemedText type="title" style={styles.timer}>
            {formatTime(recordingTime)}
          </ThemedText>
          <ThemedText style={styles.timerLabel}>
            {isRecording ? 'Recording...' : 'Ready to record'}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.controlsContainer}>
          {!isRecording ? (
            <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
              <IconSymbol size={40} name="mic.fill" color="white" />
              <ThemedText style={styles.recordButtonText}>Start Recording</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
              <IconSymbol size={40} name="stop.fill" color="white" />
              <ThemedText style={styles.stopButtonText}>Stop Recording</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  controlsContainer: {
    marginBottom: 30,
  },
  recordButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  safetyTips: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    width: '100%',
  },
  tipsTitle: {
    marginBottom: 10,
    color: '#007AFF',
  },
  tip: {
    marginBottom: 5,
    opacity: 0.8,
  },
  recordingsSection: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
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
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  playButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
