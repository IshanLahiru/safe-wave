import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  Animated,
  Platform,
  LayoutAnimation,
  UIManager,
  Pressable,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { ModernCard } from '../../components/ui/ModernCard';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { apiService } from '../../services/api';

// Web-specific imports and utilities
const isWeb = Platform.OS === 'web';
const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

const { width, height } = Dimensions.get('window');

// Enable LayoutAnimation on Android (not available on web)
if (isMobile && Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AudioRecording {
  id: string;
  uri: string;
  duration: number;
  transcription: string;
  timestamp: Date;
  isPlaying: boolean;
  isExpanded?: boolean;
  file_path?: string;
  transcription_status?: string;
  risk_level?: string;
  analysis_status?: string;
  upload_progress?: number;
  is_uploading?: boolean;
  is_transcribing?: boolean;
  is_analyzing?: boolean;
  confidence?: number;
  playbackProgress?: number; // Current playback position in seconds
  playbackPosition?: number; // Current playback position as percentage (0-1)
}

// Memoized recording card component for performance
const RecordingCard = React.memo(({
  recording,
  onPlay,
  onToggleExpanded,
  formatDuration,
  formatTimestamp,
  showRiskTooltip,
  onRiskTooltipToggle
}: {
  recording: AudioRecording;
  onPlay: (recording: AudioRecording) => void;
  onToggleExpanded: (recordingId: string) => void;
  formatDuration: (seconds: number) => string;
  formatTimestamp: (date: Date) => string;
  showRiskTooltip: string | null;
  onRiskTooltipToggle: (recordingId: string) => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const expansionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(expansionAnim, {
      toValue: recording.isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [recording.isExpanded, expansionAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    // Use LayoutAnimation only on mobile platforms
    if (isMobile) {
      LayoutAnimation.configureNext({
        duration: 300,
        create: { type: 'easeInEaseOut', property: 'opacity' },
        update: { type: 'spring', springDamping: 0.7 },
        delete: { type: 'easeInEaseOut', property: 'opacity' },
      });
    }
    onToggleExpanded(recording.id);
  }, [recording.id, onToggleExpanded]);

  const handlePlayPress = useCallback(() => {
    onPlay(recording);
  }, [recording, onPlay]);

  const transcriptionHeight = expansionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120], // Adjust based on content
  });

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onToggleExpanded(recording.id)}
        style={({ pressed }) => [
          styles.recordingCard,
          pressed && styles.recordingCardPressed,
        ]}
      >
        <ModernCard style={{
          ...styles.cardContent,
          ...(recording.risk_level ? {
            borderLeftWidth: 4,
            borderLeftColor: recording.risk_level === 'critical' ? '#ff4444' :
              recording.risk_level === 'high' ? '#ff8800' :
                recording.risk_level === 'medium' ? '#ffaa00' : '#4CAF50'
          } : {})
        }}>
          {/* Risk Level Corner Indicator */}
          {recording.risk_level && (
            <View style={[
              styles.riskCornerIndicator,
              {
                backgroundColor: recording.risk_level === 'critical' ? '#ff4444' :
                  recording.risk_level === 'high' ? '#ff8800' :
                    recording.risk_level === 'medium' ? '#ffaa00' : '#4CAF50'
              }
            ]} />
          )}

          <View style={styles.recordingHeader}>
            <View style={styles.recordingInfo}>
              <ThemedText style={styles.recordingTime}>
                {formatTimestamp(recording.timestamp)}
              </ThemedText>
            </View>

            {/* Risk Level Chip - Only Visible When Collapsed */}
            {recording.risk_level && !recording.isExpanded && (
              <View style={[
                styles.riskLevelChip,
                {
                  backgroundColor: recording.risk_level === 'critical' ? '#ff4444' + '20' :
                    recording.risk_level === 'high' ? '#ff8800' + '20' :
                      recording.risk_level === 'medium' ? '#ffaa00' + '20' : '#4CAF50' + '20',
                  borderColor: recording.risk_level === 'critical' ? '#ff4444' :
                    recording.risk_level === 'high' ? '#ff8800' :
                      recording.risk_level === 'medium' ? '#ffaa00' : '#4CAF50'
                }
              ]}>
                <Ionicons
                  name={recording.risk_level === 'critical' ? 'warning' :
                    recording.risk_level === 'high' ? 'alert-circle' :
                      recording.risk_level === 'medium' ? 'information-circle' : 'checkmark-circle'}
                  size={14}
                  color={recording.risk_level === 'critical' ? '#ff4444' :
                    recording.risk_level === 'high' ? '#ff8800' :
                      recording.risk_level === 'medium' ? '#ffaa00' : '#4CAF50'}
                />
                <ThemedText style={[
                  styles.riskLevelChipText,
                  {
                    color: recording.risk_level === 'critical' ? '#ff4444' :
                      recording.risk_level === 'high' ? '#ff8800' :
                        recording.risk_level === 'medium' ? '#ffaa00' : '#4CAF50'
                  }
                ]}>
                  {recording.risk_level === 'critical' ? 'Critical' :
                    recording.risk_level === 'high' ? 'High' :
                      recording.risk_level === 'medium' ? 'Medium' : 'Low'}
                </ThemedText>
              </View>
            )}
          </View>



          {/* Progress and Status Indicators */}
          {recording.is_uploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${recording.upload_progress || 0}%` }]} />
              </View>
              <ThemedText style={styles.progressText}>
                Uploading... {Math.round(recording.upload_progress || 0)}%
              </ThemedText>
            </View>
          )}

          {recording.is_transcribing && (
            <View style={styles.statusContainer}>
              <Ionicons name="mic" size={16} color={Colors.light.primary} />
              <ThemedText style={styles.statusText}>
                Transcribing audio...
              </ThemedText>
            </View>
          )}

          {recording.is_analyzing && (
            <View style={styles.statusContainer}>
              <Ionicons name="analytics" size={16} color={Colors.light.primary} />
              <ThemedText style={styles.statusText}>
                Analyzing content...
              </ThemedText>
            </View>
          )}



          {/* Transcription Display - Only When Expanded */}
          {recording.isExpanded && recording.transcription && recording.transcription !== 'Processing transcription...' && (
            <View style={styles.transcriptionPreview}>
              <ThemedText style={styles.transcriptionLabel}>
                Transcription:
              </ThemedText>
              <ThemedText style={styles.transcriptionPreviewText}>
                {recording.transcription}
              </ThemedText>

              {recording.confidence && (
                <ThemedText style={styles.confidenceText}>
                  Confidence: {Math.round(recording.confidence * 100)}%
                </ThemedText>
              )}

              {/* Risk Level Indicator - Left Side After Transcription */}
              {recording.risk_level && (
                <TouchableOpacity
                  style={styles.riskButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onRiskTooltipToggle(recording.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={recording.risk_level === 'critical' ? 'warning' :
                      recording.risk_level === 'high' ? 'alert-circle' :
                        recording.risk_level === 'medium' ? 'information-circle' : 'checkmark-circle'}
                    size={20}
                    color={recording.risk_level === 'critical' ? '#ff4444' :
                      recording.risk_level === 'high' ? '#ff8800' :
                        recording.risk_level === 'medium' ? '#ffaa00' : '#4CAF50'}
                  />
                  <ThemedText style={[
                    styles.riskButtonText,
                    {
                      color: recording.risk_level === 'critical' ? '#ff4444' :
                        recording.risk_level === 'high' ? '#ff8800' :
                          recording.risk_level === 'medium' ? '#ffaa00' : '#4CAF50'
                    }
                  ]}>
                    {recording.risk_level === 'critical' ? 'Critical' :
                      recording.risk_level === 'high' ? 'High' :
                        recording.risk_level === 'medium' ? 'Medium' : 'Low'} Risk
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}





          {/* Tooltip */}
          {recording.risk_level && showRiskTooltip === recording.id && (
            <View style={styles.riskTooltip}>
              <View style={styles.riskTooltipArrow} />
              <View style={styles.riskTooltipContent}>
                <ThemedText style={styles.riskTooltipTitle}>
                  {recording.risk_level === 'critical' ? 'Critical Risk Detected' :
                    recording.risk_level === 'high' ? 'High Risk Detected' :
                      recording.risk_level === 'medium' ? 'Medium Risk Detected' : 'Low Risk Detected'}
                </ThemedText>
                <ThemedText style={styles.riskTooltipText}>
                  {recording.risk_level === 'critical' ?
                    'Care person has been notified. Please seek immediate support if needed.' :
                    recording.risk_level === 'high' ?
                      'Significant concerns detected. Care person has been notified. Consider seeking support.' :
                      recording.risk_level === 'medium' ?
                        'Moderate concerns detected. Monitor your mental health and consider talking to someone.' :
                        'Minimal concerns detected. Continue monitoring your mental health and maintain healthy coping strategies.'}
                </ThemedText>
              </View>
            </View>
          )}



          {!recording.transcription && !recording.is_uploading && !recording.is_transcribing && !recording.is_analyzing && (
            <View style={styles.uploadingContainer}>
              <Ionicons name="cloud-upload" size={16} color={Colors.light.text} />
              <ThemedText style={styles.uploadingText}>
                Processing transcription...
              </ThemedText>
            </View>
          )}
        </ModernCard>
      </Pressable>
    </Animated.View >
  );
});

export default function CheckinScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [currentRecording, setCurrentRecording] = useState<AudioRecording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showRiskTooltip, setShowRiskTooltip] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollButtonPulseAnim = useRef(new Animated.Value(1)).current;
  const scrollButtonFadeAnim = useRef(new Animated.Value(1)).current;

  const recordingRef = useRef<Audio.Recording | any>(null);
  const soundRef = useRef<Audio.Sound | HTMLAudioElement | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const waveAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Request audio permissions
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant audio recording permissions to use this feature.');
      }
    })();

    // Configure audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);



  const loadRecordings = useCallback(async () => {
    try {
      // Always try to load from backend API first for accurate count
      try {
        console.log('🔄 Loading recordings from backend API...');
        const apiRecordings = await apiService.getAudioAnalyses();

        if (apiRecordings && apiRecordings.length > 0) {
          const formattedRecordings: AudioRecording[] = apiRecordings.map((api: any) => ({
            id: api.id.toString(),
            uri: api.audioFilePath || `file://${api.audioFilePath}`,
            duration: api.audioDuration || 0,
            transcription: api.transcription || 'No transcription available',
            timestamp: new Date(api.createdAt),
            isPlaying: false,
            isExpanded: false, // Always start collapsed
            transcription_status: api.transcription ? 'completed' : 'pending',
            risk_level: api.riskLevel,
            analysis_status: api.analyzedAt ? 'completed' : 'pending',
            file_path: api.audioFilePath, // Store file path for proper URI construction
          }));

          setRecordings(formattedRecordings);
          await saveRecordingsToStorage(formattedRecordings);
          console.log('🌐 Loaded recordings from API:', formattedRecordings.length);
          return; // Exit early if API data is available
        }
      } catch (apiError) {
        console.log('⚠️ Could not load from API, trying local storage:', apiError);
      }

      // Fallback to local storage if API fails
      const storedRecordings = await AsyncStorage.getItem('safeWave_recordings');
      if (storedRecordings) {
        const parsedRecordings = JSON.parse(storedRecordings).map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp),
          isPlaying: false,
          isExpanded: false, // Always start collapsed
        }));
        setRecordings(parsedRecordings);
        console.log('📱 Loaded recordings from storage:', parsedRecordings.length);
      } else {
        // No recordings available
        setRecordings([]);
        console.log('📱 No recordings found');
      }

    } catch (error) {
      console.error('Failed to load recordings:', error);
      setRecordings([]);
    }
  }, []);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setRecordingDuration(0);

      if (isWeb) {
        // Web-specific recording using MediaRecorder API
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
          });

          const chunks: Blob[] = [];
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);

            // Create a mock recording object for web
            const webRecording = {
              uri: url,
              duration: recordingDuration,
              getURI: () => url,
              stopAndUnloadAsync: async () => {
                stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
                URL.revokeObjectURL(url);
              }
            };

            recordingRef.current = webRecording as any;
          };

          mediaRecorder.start();
          (recordingRef.current as any) = { mediaRecorder, stream, chunks };

        } catch (webError) {
          console.error('Web recording failed:', webError);
          Alert.alert('Error', 'Failed to access microphone. Please check permissions.');
          setIsRecording(false);
          return;
        }
      } else {
        // Mobile recording using Expo Audio
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
      }

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start wave animation
      Animated.loop(
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      setIsRecording(false);

      // Stop animations
      pulseAnimation.setValue(1);
      waveAnimation.setValue(0);

      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      let uri: string | null = null;

      if (isWeb) {
        // Web-specific stop recording
        const webRecording = recordingRef.current as any;
        if (webRecording.mediaRecorder && webRecording.mediaRecorder.state === 'recording') {
          webRecording.mediaRecorder.stop();

          // Wait for the ondataavailable event to complete
          await new Promise<void>((resolve) => {
            webRecording.mediaRecorder.onstop = () => {
              const chunks = webRecording.chunks || [];
              const blob = new Blob(chunks, { type: 'audio/webm' });
              uri = URL.createObjectURL(blob);

              // Stop all tracks
              webRecording.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
              resolve();
            };
          });
        }
      } else {
        // Mobile stop recording
        await recordingRef.current.stopAndUnloadAsync();
        uri = recordingRef.current.getURI();
      }

      if (uri) {
        // Create new recording object
        const newRecording: AudioRecording = {
          id: Date.now().toString(),
          uri,
          duration: recordingDuration,
          transcription: '', // Will be filled after upload
          timestamp: new Date(),
          isPlaying: false,
          isExpanded: false,
        };

        // Add to recordings list
        setRecordings(prev => [newRecording, ...prev]);

        // Upload recording
        await uploadRecording(newRecording);
      }

      recordingRef.current = null;
      setRecordingDuration(0);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const uploadRecording = async (recording: AudioRecording) => {
    setIsUploading(true);
    try {
      // Create FormData for upload
      const formData = new FormData();

      // Create file object for different platforms
      let fileObject: any;

      if (isWeb) {
        // Web: Convert blob URL to File object
        try {
          const response = await fetch(recording.uri);
          const blob = await response.blob();
          fileObject = new File([blob], `recording-${recording.id}.webm`, { type: 'audio/webm' });
        } catch (webError) {
          console.error('Failed to convert web blob to file:', webError);
          throw new Error('Failed to prepare audio file for upload');
        }
      } else {
        // Mobile: Use React Native file object
        fileObject = {
          uri: recording.uri,
          type: 'audio/wav',
          name: `recording-${recording.id}.wav`,
        };
      }

      formData.append('file', fileObject as any);
      formData.append('description', 'Voice check-in');
      formData.append('mood_rating', '5');

      console.log('📁 Uploading recording:', recording.id);
      console.log('📁 File URI:', recording.uri);

      // Upload to backend
      const response = await apiService.uploadAudio(formData);

      console.log('✅ Upload successful:', response);

      // Update recording with real data from backend
      setRecordings(prev =>
        prev.map(r =>
          r.id === recording.id
            ? {
              ...r,
              transcription: response.transcription || 'Processing transcription...',
              transcription_status: response.transcription ? 'completed' : 'processing',
              risk_level: response.riskLevel,
              analysis_status: response.analyzedAt ? 'completed' : 'processing',
              file_path: response.audioFilePath,
            }
            : r
        )
      );

      // Save to local storage
      await saveRecordingsToStorage();

      Alert.alert('Success', 'Recording uploaded successfully!');

    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload recording. Please try again.');

      // Update recording to show error state
      setRecordings(prev =>
        prev.map(r =>
          r.id === recording.id
            ? { ...r, transcription: 'Upload failed. Please try again.' }
            : r
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  const playRecording = useCallback(async (recording: AudioRecording) => {
    try {
      // Stop any currently playing audio
      if (soundRef.current) {
        if (isWeb) {
          const webAudio = soundRef.current as HTMLAudioElement;
          webAudio.pause();
          webAudio.currentTime = 0;
        } else {
          const mobileAudio = soundRef.current as Audio.Sound;
          await mobileAudio.stopAsync();
        }
        soundRef.current = null;
      }

      // Reset all playing states
      setRecordings(prev =>
        prev.map(r => ({
          ...r,
          isPlaying: false,
          playbackProgress: 0,
          playbackPosition: 0
        }))
      );

      // Handle different URI formats and platforms
      let audioUri = recording.uri;

      if (isWeb) {
        // Web: Use HTML5 Audio API
        if (recording.uri.startsWith('mock://')) {
          Alert.alert('Info', 'This is a demo recording. Real recordings will play audio.');
          return;
        }

        try {
          // For web, we need to construct the full URL to the backend
          if (recording.file_path && !recording.uri.startsWith('http')) {
            // Use the audio file serving endpoint
            const baseUrl = 'http://192.168.31.14:9000'; // Update this to your backend URL
            audioUri = `${baseUrl}/api/v1/audio/file/${recording.id}`;
          } else if (recording.uri.startsWith('blob:')) {
            // Use blob URL directly for web recordings
            audioUri = recording.uri;
          }

          console.log('🌐 Playing audio on web from URI:', audioUri);

          // Create HTML5 audio element for web
          const audioElement = new Audio(audioUri);
          soundRef.current = audioElement;

          // Update playing state
          setRecordings(prev =>
            prev.map(r =>
              r.id === recording.id
                ? { ...r, isPlaying: true, playbackProgress: 0, playbackPosition: 0 }
                : r
            )
          );

          // Play the audio
          await audioElement.play();

          // Set up progress tracking for web
          const updateProgress = () => {
            if (audioElement && !audioElement.paused) {
              const progress = audioElement.currentTime;
              const position = audioElement.currentTime / audioElement.duration;

              setRecordings(prev =>
                prev.map(r =>
                  r.id === recording.id
                    ? {
                      ...r,
                      playbackProgress: progress,
                      playbackPosition: position
                    }
                    : r
                )
              );

              // Continue updating if still playing
              if (!audioElement.paused) {
                requestAnimationFrame(updateProgress);
              }
            }
          };

          // Start progress tracking
          requestAnimationFrame(updateProgress);

          // Listen for playback events
          audioElement.onended = () => {
            setRecordings(prev =>
              prev.map(r => ({
                ...r,
                isPlaying: false,
                playbackProgress: 0,
                playbackPosition: 0
              }))
            );
            soundRef.current = null;
          };

          audioElement.onerror = (error: any) => {
            console.error('Web audio playback failed:', error);
            setRecordings(prev =>
              prev.map(r => ({
                ...r,
                isPlaying: false,
                playbackProgress: 0,
                playbackPosition: 0
              }))
            );
            soundRef.current = null;
            Alert.alert('Error', 'Failed to play audio. Please try again.');
          };

          return;
        } catch (webError) {
          console.error('Web audio playback failed:', webError);
          Alert.alert('Error', 'Failed to play audio on web. Please try again.');
          return;
        }
      } else {
        // Mobile: Handle different URI formats
        if (recording.file_path && !recording.uri.startsWith('file://')) {
          // If we have a file path from backend, construct proper URI
          audioUri = `file://${recording.file_path}`;
        } else if (recording.uri.startsWith('mock://')) {
          // Skip mock recordings
          Alert.alert('Info', 'This is a demo recording. Real recordings will play audio.');
          return;
        }

        console.log('📱 Playing audio on mobile from URI:', audioUri);

        // Load and play the selected recording using Expo Audio
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
        soundRef.current = sound;

        // Update playing state
        setRecordings(prev =>
          prev.map(r =>
            r.id === recording.id
              ? { ...r, isPlaying: true, playbackProgress: 0, playbackPosition: 0 }
              : r
          )
        );

        // Play the audio
        await sound.playAsync();

        // Listen for playback status with progress tracking
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded) {
            const progress = status.positionMillis / 1000; // Convert to seconds
            const position = status.positionMillis / status.durationMillis;

            setRecordings(prev =>
              prev.map(r =>
                r.id === recording.id
                  ? {
                    ...r,
                    playbackProgress: progress,
                    playbackPosition: position
                  }
                  : r
              )
            );

            if (status.didJustFinish) {
              // Reset playing state when finished
              setRecordings(prev =>
                prev.map(r => ({
                  ...r,
                  isPlaying: false,
                  playbackProgress: 0,
                  playbackPosition: 0
                }))
              );
              soundRef.current = null;
            }
          }
        });
      }

    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Error', 'Failed to play recording. Please try again.');
    }
  }, []);

  const stopPlayback = useCallback(async () => {
    if (soundRef.current) {
      if (isWeb) {
        // Web: Stop HTML5 audio
        const webAudio = soundRef.current as HTMLAudioElement;
        webAudio.pause();
        webAudio.currentTime = 0;
      } else {
        // Mobile: Stop Expo Audio
        const mobileAudio = soundRef.current as Audio.Sound;
        await mobileAudio.stopAsync();
      }
      soundRef.current = null;

      // Reset all playing states and progress
      setRecordings(prev =>
        prev.map(r => ({
          ...r,
          isPlaying: false,
          playbackProgress: 0,
          playbackPosition: 0
        }))
      );
    }
  }, []);

  const toggleExpanded = useCallback((recordingId: string) => {
    setRecordings(prev =>
      prev.map(r =>
        r.id === recordingId
          ? { ...r, isExpanded: !r.isExpanded }
          : r
      )
    );
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatTimestamp = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }, []);

  const saveRecordingsToStorage = useCallback(async (recordingsToSave?: AudioRecording[]) => {
    try {
      const recordingsToStore = recordingsToSave || recordings;
      const serializedRecordings = recordingsToStore.map(r => ({
        ...r,
        timestamp: r.timestamp.toISOString(),
      }));
      await AsyncStorage.setItem('safeWave_recordings', JSON.stringify(serializedRecordings));
      console.log('💾 Saved recordings to storage:', serializedRecordings.length);
    } catch (error) {
      console.error('Failed to save recordings to storage:', error);
    }
  }, [recordings]);

  const refreshRecordings = useCallback(async () => {
    try {
      console.log('🔄 Refreshing recordings from backend...');
      const apiRecordings = await apiService.getAudioAnalyses();

      if (apiRecordings && apiRecordings.length > 0) {
        const formattedRecordings: AudioRecording[] = apiRecordings.map((api: any) => ({
          id: api.id.toString(),
          uri: api.audioFilePath || `file://${api.audioFilePath}`,
          duration: api.audioDuration || 0,
          transcription: api.transcription || 'No transcription available',
          timestamp: new Date(api.createdAt),
          isPlaying: false,
          isExpanded: false, // Always start collapsed
          transcription_status: api.transcription ? 'completed' : 'pending',
          risk_level: api.riskLevel,
          analysis_status: api.analyzedAt ? 'completed' : 'pending',
          file_path: api.audioFilePath, // Store file path for proper URI construction
        }));

        setRecordings(formattedRecordings);
        await saveRecordingsToStorage(formattedRecordings);
        console.log('✅ Refreshed recordings from backend:', formattedRecordings.length);
      } else {
        console.log('📭 No recordings found in backend');
        setRecordings([]);
        await saveRecordingsToStorage([]);
      }
    } catch (error) {
      console.error('Failed to refresh recordings:', error);
      Alert.alert('Error', 'Failed to refresh recordings. Please try again.');
    }
  }, []);

  // Handle WebSocket messages for real-time updates
  const handleWebSocketMessage = useCallback((data: any) => {
    console.log('📡 WebSocket message received:', data);

    switch (data.type) {
      case 'audio_uploaded':
        // Update recording status to uploaded
        setRecordings(prev =>
          prev.map(r =>
            r.id === data.audio_id.toString()
              ? { ...r, is_uploading: false, upload_progress: 100 }
              : r
          )
        );
        break;

      case 'transcription_update':
        // Update transcription status and content
        setRecordings(prev =>
          prev.map(r =>
            r.id === data.audio_id.toString()
              ? {
                ...r,
                transcription_status: data.status,
                transcription: data.transcription || r.transcription,
                confidence: data.confidence,
                is_transcribing: data.status === 'processing'
              }
              : r
          )
        );
        break;

      case 'analysis_update':
        // Update analysis status and results
        setRecordings(prev =>
          prev.map(r =>
            r.id === data.audio_id.toString()
              ? {
                ...r,
                analysis_status: data.status,
                risk_level: data.risk_level,
                is_analyzing: data.status === 'processing'
              }
              : r
          )
        );
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, []);

  // Load recordings and set up refresh
  useEffect(() => {
    loadRecordings();

    // Set up WebSocket connection for real-time updates
    const connectWebSocket = async () => {
      try {
        // Get user ID from storage or context (you'll need to implement this)
        const userId = 1; // Temporary - replace with actual user ID
        const ws = apiService.connectWebSocket(userId, handleWebSocketMessage);
        if (ws) {
          setWebSocket(ws);
          console.log('🔌 WebSocket connected for real-time updates');
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connectWebSocket();

    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      refreshRecordings();
    }, 30000);

    return () => {
      clearInterval(refreshInterval);
      if (webSocket) {
        webSocket.close();
      }
    };
  }, [loadRecordings, refreshRecordings]);

  // Pulse and fade animation for scroll button
  useEffect(() => {
    if (showScrollButton) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scrollButtonPulseAnim, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(scrollButtonFadeAnim, {
              toValue: 0.6,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scrollButtonPulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(scrollButtonFadeAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [showScrollButton, scrollButtonPulseAnim, scrollButtonFadeAnim]);

  // Memoized render function for FlatList
  const renderRecordingItem = useCallback(({ item }: { item: AudioRecording }) => (
    <RecordingCard
      recording={item}
      onPlay={playRecording}
      onToggleExpanded={toggleExpanded}
      formatDuration={formatDuration}
      formatTimestamp={formatTimestamp}
      showRiskTooltip={showRiskTooltip}
      onRiskTooltipToggle={(recordingId) => setShowRiskTooltip(showRiskTooltip === recordingId ? null : recordingId)}
    />
  ), [playRecording, toggleExpanded, formatDuration, formatTimestamp, showRiskTooltip]);

  // Scroll handling functions
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setScrollOffset(offsetY);
    setShowScrollButton(offsetY > 200);
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // FlatList optimization functions
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 120, // Estimated item height
    offset: 120 * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: AudioRecording) => item.id, []);

  // Memoized empty component
  const EmptyComponent = useMemo(() => (
    <View style={styles.emptyState}>
      <Ionicons name="mic-outline" size={48} color={Colors.light.text} />
      <ThemedText style={styles.emptyStateTitle}>
        No recordings yet
      </ThemedText>
      <ThemedText style={styles.emptyStateText}>
        Start recording to see your voice check-ins here
      </ThemedText>
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [
              {
                translateY: scrollOffset > 0 ? -Math.min(scrollOffset * 1.2, 200) : 0
              }
            ],
            opacity: scrollOffset > 0 ? Math.max(0, 1 - scrollOffset * 0.005) : 1,
          }
        ]}
      >
        <ThemedText style={styles.title}>Voice Check-in</ThemedText>
        <ThemedText style={styles.subtitle}>
          Record your thoughts and feelings
        </ThemedText>
      </Animated.View>

      {/* Recording Section */}
      <Animated.View
        style={[
          styles.recordingSection,
          {
            transform: [
              {
                translateY: scrollOffset > 0 ? -Math.min(scrollOffset * 1.8, 800) : 0
              },
              {
                scale: scrollOffset > 0 ? Math.max(0.2, 1 - scrollOffset * 0.004) : 1
              }
            ],
            opacity: scrollOffset > 0 ? Math.max(0.02, 1 - scrollOffset * 0.005) : 1,
            zIndex: scrollOffset > 20 ? -1 : 1,
          }
        ]}
      >
        <View style={styles.recordingVisualizer}>
          {/* Animated recording waves */}
          {isRecording && (
            <>
              <Animated.View
                style={[
                  styles.recordingWave,
                  styles.wave1,
                  {
                    transform: [
                      { translateX: -60 },
                      { translateY: -60 },
                      { scale: waveAnimation }
                    ],
                    opacity: waveAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.8],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.recordingWave,
                  styles.wave2,
                  {
                    transform: [
                      { translateX: -80 },
                      { translateY: -80 },
                      {
                        scale: waveAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.2],
                        })
                      }
                    ],
                    opacity: waveAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 0.9],
                    }),
                  },
                ]}
              />
            </>
          )}

          {/* Recording button */}
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordingButton,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
          >
            <Animated.View
              style={[
                styles.recordButtonInner,
                {
                  transform: [{ scale: isRecording ? pulseAnimation : 1 }],
                  backgroundColor: 'transparent', // No background when not recording
                },
              ]}
            >
              <View style={styles.smileEmojiContainer}>
                <ThemedText style={[
                  styles.smileEmoji,
                  isRecording && styles.recordingEmoji
                ]}>
                  😊
                </ThemedText>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Recording status */}
        <View style={styles.recordingStatus}>
          {isRecording ? (
            <>
              <ThemedText style={styles.recordingText}>
                Recording... {formatDuration(recordingDuration)}
              </ThemedText>
              <ThemedText style={styles.recordingHint}>
                Tap to stop recording
              </ThemedText>
            </>
          ) : isUploading ? (
            <>
              <ThemedText style={styles.recordingText}>
                Uploading and transcribing...
              </ThemedText>
              <ThemedText style={styles.recordingHint}>
                Please wait
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText style={styles.recordingText}>
                Ready to record
              </ThemedText>
              <ThemedText style={styles.recordingHint}>
                Tap the smile to start
              </ThemedText>
            </>
          )}
        </View>
      </Animated.View>

      {/* Recordings List */}
      <View style={[
        styles.recordingsSection,
        {
          zIndex: scrollOffset > 20 ? 2 : 0,
          marginTop: scrollOffset > 0 ? -Math.min(scrollOffset * 1.8, 600) : 0,
        }
      ]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <ThemedText style={styles.sectionTitle}>Recent</ThemedText>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshRecordings}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.recordingsCount}>
            {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        <FlatList
          ref={flatListRef}
          data={recordings}
          renderItem={renderRecordingItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.recordingsListContent}
          style={styles.recordingsList}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          initialNumToRender={3}
          windowSize={5}
          getItemLayout={getItemLayout}
          ListEmptyComponent={EmptyComponent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 0,
          }}
        />

        {/* Floating Scroll-to-Top Button */}
        {showScrollButton && (
          <Animated.View
            style={[
              styles.floatingScrollButton,
              {
                opacity: showScrollButton ? 1 : 0,
                transform: [
                  { scale: showScrollButton ? 1 : 0.8 },
                  { translateY: showScrollButton ? 0 : 20 }
                ],
              },
            ]}
          >
            <View style={styles.scrollToTopButton}>
              <TouchableOpacity
                style={styles.scrollToTopButtonInner}
                onPress={scrollToTop}
                activeOpacity={0.8}
              >
                <View style={styles.doubleArrowContainer}>
                  <Animated.View style={{
                    transform: [{ scale: scrollButtonPulseAnim }],
                    opacity: scrollButtonFadeAnim
                  }}>
                    <Ionicons name="chevron-up" size={28} color={Colors.light.background} style={styles.arrow1} />
                  </Animated.View>
                  <Animated.View style={{
                    transform: [{ scale: scrollButtonPulseAnim }],
                    opacity: scrollButtonFadeAnim
                  }}>
                    <Ionicons name="chevron-up" size={28} color={Colors.light.background} style={styles.arrow2} />
                  </Animated.View>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    position: 'relative',
  },

  header: {
    alignItems: 'center',
    paddingTop: 20, // Reduced since we're using safe area insets now
    paddingBottom: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 34, // Add lineHeight to prevent text cutoff
    includeFontPadding: false, // Remove extra padding
  },

  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20, // Add lineHeight to prevent text cutoff
    includeFontPadding: false, // Remove extra padding
  },

  recordingSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 20,
    minHeight: 280,
    position: 'relative',
    zIndex: 1,
  },

  recordingVisualizer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: 200,
    height: 200,
    overflow: 'hidden',
  },

  recordingWave: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -60 }],
  },

  wave1: {
    width: 120,
    height: 120,
    transform: [{ translateX: -60 }, { translateY: -60 }],
  },

  wave2: {
    width: 160,
    height: 160,
    transform: [{ translateX: -80 }, { translateY: -80 }],
  },

  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  recordingButton: {
    backgroundColor: Colors.light.danger,
  },

  recordButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  smileEmojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },

  smileEmoji: {
    fontSize: 80,
    color: '#000000', // Black fill
    textAlign: 'center',
    lineHeight: 80,
  },

  stopButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    backgroundColor: Colors.light.danger,
    borderRadius: 40,
  },

  recordingEmoji: {
    color: Colors.light.background, // White color when recording
  },

  recordingStatus: {
    alignItems: 'center',
  },

  recordingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },

  recordingHint: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },

  recordingsSection: {
    flex: 1,
  },

  sectionHeader: {
    marginBottom: 20,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24, // Add lineHeight to prevent text cutoff
    includeFontPadding: false, // Remove extra padding
  },

  recordingsCount: {
    fontSize: 14,
    opacity: 0.6,
  },

  recordingsList: {
    flex: 1,
  },

  recordingsListContent: {
    paddingTop: 10, // Small padding to separate from section header
    paddingBottom: 120, // Increased to account for tab bar
  },

  recordingCard: {
    marginBottom: 12,
    marginHorizontal: 4,
  },

  recordingCardPressed: {
    opacity: 0.8,
  },

  cardContent: {
    padding: 16,
    position: 'relative',
  },

  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  recordingInfo: {
    flex: 1,
  },

  recordingTime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  recordingDuration: {
    fontSize: 14,
    opacity: 0.6,
  },



  transcriptionPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },

  transcriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  transcriptionPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },

  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },

  expandHintText: {
    fontSize: 12,
    marginLeft: 4,
    color: Colors.light.primary,
    fontWeight: '500',
  },

  expandCollapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignSelf: 'center',
  },
  riskButtonContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 10,
  },
  riskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginTop: 8,
    alignSelf: 'flex-start', // Position on the left side
  },
  riskButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  riskCornerIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 10,
  },

  riskLevelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 60,
    justifyContent: 'center',
  },

  riskLevelChipText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Progress and Status Styles
  progressContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },

  progressBar: {
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  audioProgressContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  audioProgressBar: {
    height: 3,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  audioProgressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },


  progressText: {
    fontSize: 12,
    textAlign: 'center',
    color: Colors.light.primary,
    fontWeight: '500',
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },

  statusText: {
    fontSize: 12,
    marginLeft: 6,
    color: Colors.light.primary,
    fontWeight: '500',
  },

  confidenceText: {
    fontSize: 11,
    color: Colors.light.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.8,
  },

  riskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  riskText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Critical Risk Chip Styles
  criticalRiskChip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },

  riskTooltip: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    width: 200,
    zIndex: 1000,
  },

  riskTooltipArrow: {
    position: 'absolute',
    bottom: -6,
    left: 12,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0, 0, 0, 0.9)',
  },

  riskTooltipContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  riskTooltipTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.danger,
    marginBottom: 4,
  },

  riskTooltipText: {
    fontSize: 11,
    color: Colors.light.background,
    lineHeight: 16,
  },

  // Floating Scroll Button Styles
  floatingScrollButton: {
    position: 'absolute',
    bottom: 60, // Moved down more
    left: '50%',
    marginLeft: -30, // Center the 60px button properly
    zIndex: 1000,
  },

  scrollToTopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: Colors.light.background,
  },

  scrollToTopButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },

  doubleArrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow1: {
    marginBottom: -8,
  },

  arrow2: {
    marginTop: -8,
  },

  transcriptionContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 16,
  },

  transcriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },

  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    opacity: 0.6,
  },

  uploadingText: {
    marginLeft: 8,
    fontSize: 14,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    opacity: 0.5,
  },

  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },

  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});
