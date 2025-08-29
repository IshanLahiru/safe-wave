import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Text,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import apiService from '@/services/api';

interface AudioRecorderProps {
  onRecordingComplete: (audioUri: string) => void;
  onAnalysisComplete?: (analysis: any) => void;
}

export default function AudioRecorder({ onRecordingComplete, onAnalysisComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const recordingRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      // In a real implementation, you would use expo-av or react-native-voice
      // For now, we'll simulate recording
      setIsRecording(true);
      setRecordingTime(0);
      
      // Simulate recording timer
      recordingRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Simulate recording completion after 10 seconds
      setTimeout(() => {
        stopRecording();
      }, 10000);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (recordingRef.current) {
      clearInterval(recordingRef.current);
      recordingRef.current = null;
    }
    
    setIsRecording(false);
    
    // Simulate audio file creation
    const mockAudioUri = `file://mock-audio-${Date.now()}.wav`;
    setAudioUri(mockAudioUri);
    onRecordingComplete(mockAudioUri);
  };

  const uploadAudio = async () => {
    if (!audioUri) return;

    setIsUploading(true);
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'audio-message.wav',
      } as any);
      
      formData.append('description', 'Voice message');
      formData.append('mood_rating', '5');

      // Upload to backend
      const response = await apiService.uploadAudio(formData);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(response);
      }
      
      Alert.alert('Success', 'Audio uploaded and analysis started!');
      
    } catch (error) {
      Alert.alert('Error', 'Failed to upload audio');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetRecording = () => {
    setAudioUri(null);
    setRecordingTime(0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          🎤 Voice Message
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Record your thoughts and feelings
        </ThemedText>
      </View>

      <View style={styles.recordingSection}>
        {!audioUri ? (
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
          >
            <IconSymbol
              size={32}
              name={isRecording ? "stop.fill" : "mic.fill"}
              color="white"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.audioPreview}>
            <IconSymbol size={48} name="waveform" color={theme.primary} />
            <ThemedText style={styles.audioText}>Audio recorded</ThemedText>
            <Text style={styles.durationText}>
              Duration: {formatTime(recordingTime)}
            </Text>
          </View>
        )}

        {isRecording && (
          <View style={styles.recordingInfo}>
            <ActivityIndicator size="small" color={theme.primary} />
            <ThemedText style={styles.recordingText}>
              Recording... {formatTime(recordingTime)}
            </ThemedText>
          </View>
        )}
      </View>

      {audioUri && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.uploadButton, isUploading && styles.disabledButton]}
            onPress={uploadAudio}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <IconSymbol size={20} name="arrow.up.circle.fill" color="white" />
            )}
            <ThemedText style={styles.uploadButtonText}>
              {isUploading ? 'Analyzing...' : 'Upload & Analyze'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetRecording}
            disabled={isUploading}
          >
            <ThemedText style={styles.resetButtonText}>Record Again</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.info}>
        <ThemedText style={styles.infoText}>
          💡 Tip: Speak naturally about your day, feelings, or concerns. 
          Our AI will analyze your message and provide insights.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#687076',
    textAlign: 'center',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  audioPreview: {
    alignItems: 'center',
    padding: 20,
  },
  audioText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 10,
  },
  durationText: {
    fontSize: 14,
    color: '#687076',
    marginTop: 5,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  recordingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  actions: {
    alignItems: 'center',
    marginBottom: 30,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#687076',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  resetButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  info: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
