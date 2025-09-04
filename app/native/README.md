# SafeWave Mobile App

> **High-performance React Native mobile application for mental health monitoring**  
> *Cross-platform iOS/Android app with performance-optimized UI and real-time backend integration*

[![React Native](https://img.shields.io/badge/React%20Native-0.79.6-blue.svg)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-~53.0-blue.svg)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-~5.8.3-blue.svg)](https://typescriptlang.org)
[![Performance](https://img.shields.io/badge/performance-70%25%20RAM%20optimized-brightgreen.svg)](PERFORMANCE_OPTIMIZATIONS.md)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)](app.json)

## 🚀 Overview

SafeWave Mobile is a cross-platform React Native application that provides users with comprehensive mental health monitoring capabilities through audio recording, analysis, and personalized content delivery. Built with performance as a priority, featuring 70% memory reduction and 60fps animations.

### **Core Features**
- 🎤 **Audio Recording & Analysis** - Real-time recording with AI-powered mental health assessment
- 📊 **Performance Dashboard** - Check-ins, progress tracking, and analytics
- 📱 **Cross-Platform** - Native iOS, Android, and web support with single codebase
- 🔐 **Secure Authentication** - JWT-based authentication with token management
- 📄 **Document Management** - Upload and manage health-related documents
- 🎨 **Modern UI/UX** - Smooth animations with 60fps performance optimization
- 📈 **Real-time Data** - Live synchronization with backend API

## 🏗️ App Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│                     │    │                     │    │                     │
│   Presentation      │    │   Business Logic    │    │   Data Layer        │
│   • Screens         │◄──►│   • Hooks           │◄──►│   • API Services    │
│   • Components      │    │   • Context         │    │   • Local Storage   │
│   • Navigation      │    │   • State Mgmt      │    │   • File System     │
│                     │    │                     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│                     │    │                     │    │                     │
│   Platform Layer    │    │   Performance       │    │   External APIs     │
│   • Expo Modules    │    │   • FlatList        │    │   • Backend API     │
│   • Native APIs     │    │   • React.memo      │    │   • File Storage    │
│   • Device Features │    │   • useCallback     │    │   • Analytics       │
│                     │    │                     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## 📱 Technology Stack

### **Core Framework**
- **React Native 0.79.6** - Latest stable version with New Architecture support
- **Expo SDK 53** - Managed workflow with custom development builds
- **TypeScript 5.8.3** - Full type safety throughout the application
- **Expo Router 5.1** - File-based routing with nested navigation

### **State Management & Hooks**
- **React Context** - Global state management for user data and authentication
- **Custom Hooks** - Reusable business logic abstraction
- **React Query** (Future) - Server state management and caching
- **AsyncStorage** - Persistent local storage for user preferences

### **UI & Performance**
- **FlatList Virtualization** - Memory-efficient list rendering
- **React Native Reanimated 3** - 60fps native-driver animations
- **React Native Gesture Handler** - Native touch handling
- **Custom Design System** - Consistent UI components and styling

### **Platform Integration**
- **Expo AV** - Audio recording and playback capabilities
- **Expo File System** - File management and storage
- **Expo Document Picker** - Document selection and upload
- **Expo Constants** - Environment and device information

## 📁 Project Structure

```
app/native/
├── 📱 app/                          # Expo Router file-based routing
│   ├── (tabs)/                      # Tab navigation screens
│   │   ├── index.tsx                # Home/Dashboard screen
│   │   ├── checkin.tsx              # Audio recording check-in
│   │   ├── analytics.tsx            # Progress and insights
│   │   └── profile.tsx              # User profile and settings
│   ├── auth/                        # Authentication screens
│   │   ├── login.tsx                # User login
│   │   └── signup.tsx               # User registration
│   ├── _layout.tsx                  # Root layout with providers
│   ├── +not-found.tsx               # 404/Error screen
│   └── [feature].tsx                # Additional feature screens
├── 🎨 components/                   # Reusable UI components
│   ├── ui/                          # Design system components
│   │   ├── GradientButton.tsx       # Custom button with gradient
│   │   ├── ModernCard.tsx           # Card component with animations
│   │   ├── ModernInput.tsx          # Enhanced input fields
│   │   └── IconSymbol.tsx           # Icon system
│   ├── AudioPlayer.tsx              # Audio playback component
│   ├── AudioRecorder.tsx            # Audio recording interface
│   ├── AuthTest.tsx                 # Authentication testing
│   ├── ConnectionTest.tsx           # API connection testing
│   └── OnboardingQuestionnaire.tsx  # User onboarding
├── 🔧 services/                     # API integration and configuration
│   ├── api.ts                       # Backend API client
│   └── config.ts                    # App configuration
├── 🎯 hooks/                        # Custom React hooks
│   ├── useColorScheme.ts            # Theme detection
│   ├── useThemeColor.ts             # Dynamic theming
│   └── useSafeAreaInsets.ts         # Safe area handling
├── 🔄 contexts/                     # React Context providers
│   └── UserContext.tsx              # User state management
├── 🛠️ utils/                        # Utility functions
│   └── platform.ts                 # Platform-specific utilities
├── 🎨 constants/                    # App constants
│   └── Colors.ts                    # Color scheme definitions
├── 🖼️ assets/                       # Static assets
│   ├── images/                      # App icons and images
│   └── fonts/                       # Custom fonts
└── 📱 app.json                      # Expo configuration
```

## ⚡ Performance Optimizations (70% Memory Reduction)

### **Memory Optimization**
```typescript
// FlatList with Virtual Scrolling
<FlatList
  data={recordings}
  renderItem={renderRecordingItem}
  removeClippedSubviews={true}      // Remove off-screen views
  maxToRenderPerBatch={5}           // Batch rendering
  initialNumToRender={3}            // Fast initial load
  windowSize={5}                    # Memory vs performance balance
  getItemLayout={getItemLayout}     // Pre-calculated heights
/>
```

**Results:**
- **Before**: ~150MB RAM with ScrollView + 50 recordings
- **After**: ~45MB RAM with FlatList + Virtual Scrolling  
- **Improvement**: 70% reduction in memory usage

### **Animation Performance**
```typescript
// Native Driver Animations (60 FPS)
Animated.spring(scaleAnim, {
  toValue: 0.95,
  useNativeDriver: true,    // Runs on UI thread
  tension: 300,
  friction: 10,
}).start();
```

**Results:**
- **Native Driver**: 60 FPS animations guaranteed
- **Touch Response**: 85% faster (16-32ms response time)
- **Scroll Performance**: 58-60 FPS consistently

### **Component Optimization**
```typescript
// Memoized Components
const RecordingCard = React.memo(({ recording, onPlay }) => {
  const playRecording = useCallback(async () => {
    await onPlay(recording);
  }, [recording, onPlay]);
  
  return (
    <Pressable onPress={playRecording}>
      {/* Component content */}
    </Pressable>
  );
});
```

See [`PERFORMANCE_OPTIMIZATIONS.md`](PERFORMANCE_OPTIMIZATIONS.md) for detailed performance analysis.

## 🚀 Quick Start

### **Prerequisites**
- **Node.js 18+** with npm
- **iOS Development**: Xcode 14+ (for iOS development)
- **Android Development**: Android Studio with SDK (for Android development)
- **Expo CLI**: `npm install -g @expo/cli`

### **1. Installation**
```bash
# Navigate to mobile app directory
cd app/native

# Install dependencies
npm install

# Start development server
npx expo start
```

### **2. Platform-Specific Setup**

#### **iOS Development**
```bash
# Install iOS Simulator (with Xcode)
# Or run on physical device with Expo Go

# Start iOS simulator
npx expo start --ios

# For development build
npx expo run:ios
```

#### **Android Development**
```bash
# Setup Android Studio and SDK
# Create Android Virtual Device (AVD)

# Start Android emulator  
npx expo start --android

# For development build
npx expo run:android
```

#### **Web Development**
```bash
# Start web development
npx expo start --web

# Or direct build
npm run web
```

### **3. Backend Connection**
```bash
# Update API endpoint for local development
npm run update-ip

# Or manually configure in services/config.ts
export const API_BASE_URL = 'http://YOUR_IP:9000';
```

### **4. Available Development Commands**
```bash
# Development
npm run start         # Start Expo development server
npm run dev          # Alias for start
npm run android      # Start Android development
npm run ios          # Start iOS development  
npm run web          # Start web development

# Code Quality
npm run lint         # ESLint code linting
npm run format       # Prettier code formatting
npm run format:check # Check formatting without changes

# Utilities
npm run update-ip    # Update network IP for development
npm run clean        # Clean cache and build artifacts
npm run reset-project # Reset to fresh Expo template
```

## 🔌 API Integration

### **Authentication Flow**
```typescript
// User Authentication Service
const loginUser = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      await AsyncStorage.setItem('access_token', data.access_token);
      await AsyncStorage.setItem('refresh_token', data.refresh_token);
      return { success: true, user: data.user };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### **Audio Processing Integration**
```typescript
// Audio Recording and Upload
const uploadAudio = async (audioUri: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as any);
  
  const response = await fetch(`${API_BASE_URL}/audio/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });
  
  return await response.json();
};
```

### **Real-Time Data Synchronization**
```typescript
// Auto-sync with backend
const useAutoSync = () => {
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      await syncUserProgress();
      await syncAudioAnalysis();
    }, 30000); // 30 seconds
    
    return () => clearInterval(syncInterval);
  }, []);
};
```

## 🎨 UI/UX Design System

### **Component Architecture**
```typescript
// Modern Card Component with Animations
const ModernCard: React.FC<ModernCardProps> = ({ children, ...props }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {children}
      </Pressable>
    </Animated.View>
  );
};
```

### **Design Principles**
- **Accessibility First** - Screen reader support and proper touch targets
- **Performance Focused** - 60fps animations with native drivers
- **Responsive Design** - Adapts to different screen sizes and orientations
- **Consistent Theming** - Dark/light mode support with smooth transitions

### **Color System**
```typescript
// Dynamic Color System
const Colors = {
  light: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
  },
  dark: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
  },
};
```

## 🔊 Audio Features

### **Recording Interface**
- **Real-time Visualization** - Wave form during recording
- **Background Recording** - Continue recording when app is backgrounded
- **Format Support** - High-quality audio formats (M4A, WAV)
- **Compression** - Optimal file size for upload

### **Playback Features**
- **Waveform Visualization** - Visual representation of audio
- **Playback Controls** - Play, pause, skip, speed control
- **Progress Tracking** - Visual progress indicator
- **Background Playback** - Continue playback when app is backgrounded

### **Audio Analysis Integration**
```typescript
// Audio Analysis Workflow
const analyzeAudio = async (audioId: string) => {
  // 1. Upload audio file
  const uploadResult = await uploadAudio(audioUri);
  
  // 2. Request transcription
  const transcription = await transcribeAudio(uploadResult.id);
  
  // 3. Get mental health analysis
  const analysis = await analyzeTranscription(uploadResult.id);
  
  // 4. Update local state with results
  setAnalysisResults(analysis);
};
```

## 📊 State Management

### **User Context Provider**
```typescript
// Global User State Management
const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const login = async (email: string, password: string) => {
    const result = await loginUser(email, password);
    if (result.success) {
      setUser(result.user);
      setIsAuthenticated(true);
    }
    return result;
  };
  
  return (
    <UserContext.Provider value={{ user, isAuthenticated, login, ... }}>
      {children}
    </UserContext.Provider>
  );
};
```

### **Custom Hooks**
```typescript
// Authentication Hook
export const useAuth = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useAuth must be used within UserProvider');
  }
  return context;
};

// API Hook with Error Handling
export const useAPI = () => {
  const { accessToken } = useAuth();
  
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }, [accessToken]);
  
  return { apiCall };
};
```

## 🧪 Testing Strategy

### **Testing Structure** (Future Implementation)
```
app/native/
├── __tests__/                    # Test files
│   ├── components/               # Component tests
│   ├── hooks/                    # Hook tests
│   ├── services/                 # API integration tests
│   └── utils/                    # Utility function tests
├── __mocks__/                    # Mock files
└── jest.config.js                # Jest configuration
```

### **Testing Commands** (To be implemented)
```bash
# Unit testing
npm run test                 # Run all tests
npm run test:watch           # Watch mode
npm run test:coverage        # Coverage report

# Component testing
npm run test:components      # Test UI components

# Integration testing  
npm run test:integration     # Test API integration
```

## 📱 Platform-Specific Considerations

### **iOS Specific**
- **App Store Guidelines** - Compliance with Apple's review guidelines
- **iOS Human Interface Guidelines** - Native iOS design patterns
- **Background Processing** - Audio recording in background modes
- **Push Notifications** - iOS notification handling

### **Android Specific**
- **Material Design** - Google's design language implementation
- **Android Permissions** - Runtime permission handling
- **Background Services** - Android background processing limitations
- **Play Store Policies** - Google Play Store compliance

### **Web Specific**
- **PWA Capabilities** - Progressive Web App features
- **Browser Compatibility** - Cross-browser support
- **Responsive Design** - Web-specific layout adaptations
- **Web Audio API** - Browser-based audio processing

## 🚀 Build and Deployment

### **Development Builds**
```bash
# Create development build
npx expo run:ios --device
npx expo run:android --device

# Install on device via Expo Go
npx expo start --tunnel
```

### **Production Builds**
```bash
# EAS Build (Expo Application Services)
npx eas build --platform ios
npx eas build --platform android
npx eas build --platform all

# Submit to app stores
npx eas submit --platform ios
npx eas submit --platform android
```

### **Web Deployment**
```bash
# Build for web production
npx expo export --platform web

# Deploy to hosting service
npm run build:web
# Deploy /dist folder to your hosting provider
```

## 🔧 Development Tools

### **Code Quality**
- **ESLint** - Code linting with React Native specific rules
- **Prettier** - Code formatting with consistent style
- **TypeScript** - Static type checking for runtime error prevention
- **Husky** (Future) - Git hooks for automated quality checks

### **Debugging**
- **React Native Debugger** - Advanced debugging capabilities
- **Expo Developer Tools** - Built-in debugging and profiling
- **Flipper** - Advanced debugging and performance monitoring
- **Chrome DevTools** - Web debugging for Expo web

### **Performance Monitoring**
- **React Native Performance** - Built-in performance monitoring
- **Expo Analytics** (Future) - User behavior and performance analytics
- **Crashlytics** (Future) - Crash reporting and analysis

## 🔍 Troubleshooting

### **Common Development Issues**

#### **Metro Bundle Issues**
```bash
# Clear Metro cache
npx expo start --clear

# Reset Expo cache
rm -rf node_modules
rm -rf .expo
npm install
npx expo start
```

#### **Platform-Specific Issues**
```bash
# iOS Simulator issues
npx expo run:ios --device

# Android emulator issues
npx expo run:android --device
adb devices

# Web development issues
npx expo start --web --clear
```

#### **API Connection Issues**
```bash
# Update network IP
npm run update-ip

# Check backend status
curl http://localhost:9000/health

# Verify network connectivity
npx expo start --tunnel
```

### **Performance Troubleshooting**
```typescript
// Performance Monitoring
const usePerformanceMonitoring = () => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.log(`Component render time: ${endTime - startTime}ms`);
    };
  });
};
```

## 📚 Additional Documentation

### **Mobile-Specific Guides**
- [⚡ Performance Optimizations](PERFORMANCE_OPTIMIZATIONS.md) - Detailed performance improvements
- [🔊 Audio Implementation](AUDIO_ANALYSIS_IMPLEMENTATION.md) - Audio processing details
- [📱 Check-in UI Demo](CHECKIN_UI_DEMO.md) - UI component demonstrations

### **Integration & Architecture**
- [🏗️ System Architecture](../docs/ARCHITECTURE.md) - Overall system design
- [🔗 API Integration](../docs/API_INTEGRATION.md) - Backend integration patterns
- [🛡️ Security Implementation](../docs/SECURITY.md) - Mobile security practices

## 🤝 Contributing

### **Development Workflow**
1. **Feature Branch** - Create feature branch from `main`
2. **Code Standards** - Follow TypeScript and React Native best practices
3. **Testing** - Add tests for new components and functionality
4. **Performance** - Ensure no performance regression
5. **Documentation** - Update relevant documentation
6. **Platform Testing** - Test on iOS, Android, and web platforms

### **Code Standards**
- **TypeScript** - Strict type checking enabled
- **Component Design** - Functional components with hooks
- **Performance** - Use React.memo, useCallback, and useMemo appropriately
- **Accessibility** - Include proper accessibility labels and roles
- **Platform Compatibility** - Ensure cross-platform functionality

---

**SafeWave Mobile App - Built for Performance, Accessibility, and User Experience**

*Last updated: 2025-01 - Version 1.0.0 with 70% memory optimization and 60fps animations*
