# Safe Wave Audio Analysis System

## Overview

This is basically an audio analysis system that takes voice recordings and
figures out what people are saying using Whisper AI, then uses OpenAI to analyze
if someone might need mental health support. If it detects something serious, it
automatically sends emails to their emergency contacts.

## Backend Implementation

### 1. Audio Analysis Model (`app/models/audio_analysis.py`)

- Links audio files to specific users
- Keeps track of where audio files are stored and basic info about them
- Stores what Whisper AI figured out from the speech, including how confident it
  was
- Saves the mental health analysis results from OpenAI
- Categorizes risk levels from low to critical
- Keeps track of when we sent alerts to emergency contacts

### 2. Audio Controller (`app/controllers/audio_controller.py`)

- Handles the Whisper AI integration for converting speech to text
- Uses OpenAI to analyze the text for mental health concerns
- Figures out if someone is in a crisis situation
- Automatically sends emails to emergency contacts when needed
- Manages the whole process from audio upload to final analysis

### 3. Email Service (`app/utils/email_service.py`)

- Connects to email providers like Gmail
- Sends urgent alerts when someone might be in crisis
- Sends daily summary emails to care persons
- Uses email templates so everything looks professional

### 4. API Endpoints (`app/views/audio.py`)

- **POST /audio/upload**: Audio file upload and analysis
- **GET /audio/analyses**: User's analysis history
- **GET /audio/analyses/{id}**: Specific analysis details
- **DELETE /audio/analyses/{id}**: Remove analysis and files
- **GET /audio/health**: Service health check

## 📱 Frontend Implementation

### 1. Audio Recorder Component (`components/AudioRecorder.tsx`)

- **Recording Interface**: Intuitive recording controls
- **File Upload**: Direct backend integration
- **Progress Tracking**: Real-time recording status
- **User Feedback**: Clear success/error messages

### 2. Analysis Results Component (`components/AudioAnalysisResults.tsx`)

- **Risk Visualization**: Color-coded risk levels
- **Transcription Display**: What the user said
- **AI Insights**: LLM-generated analysis
- **Recommendations**: Actionable suggestions
- **Care Team Integration**: Share with support network

### 3. Enhanced API Service (`services/api.ts`)

- **Audio Endpoints**: Complete audio management
- **File Upload**: FormData handling
- **Analysis Results**: Structured response handling
- **Error Management**: Comprehensive error handling

## 🔧 Configuration

### Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# SMTP Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@safewave.com

# File Upload Configuration
UPLOAD_DIR=uploads/audio
MAX_FILE_SIZE=52428800
ALLOWED_AUDIO_FORMATS=["mp3","wav","m4a","aac"]
```

### Database Schema

```sql
-- Audio Analysis Table
CREATE TABLE audio_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    audio_file_path VARCHAR NOT NULL,
    audio_duration INTEGER,
    file_size INTEGER,
    transcription TEXT,
    transcription_confidence INTEGER,
    llm_analysis JSONB,
    risk_level VARCHAR,
    mental_health_indicators JSONB,
    alert_sent BOOLEAN DEFAULT FALSE,
    alert_sent_at TIMESTAMP,
    care_person_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    analyzed_at TIMESTAMP
);
```

## 🚀 How It Works

### 1. Audio Recording

1. User records voice message using frontend component
2. Audio file is captured and prepared for upload
3. File validation (size, format) is performed

### 2. Backend Processing

1. **File Upload**: Audio saved to server with metadata
2. **Whisper Transcription**: Speech converted to text
3. **LLM Analysis**: OpenAI analyzes mental health indicators
4. **Risk Assessment**: AI determines risk level
5. **Alert System**: Critical situations trigger emails

### 3. AI Analysis Pipeline

```
Audio File → Whisper AI → Transcription → OpenAI LLM → Risk Assessment → Email Alerts
```

### 4. Critical Alert System

- **Risk Detection**: AI identifies crisis indicators
- **Immediate Response**: Automatic care person notification
- **Professional Formatting**: Clear, actionable alert emails
- **Audit Trail**: Complete notification tracking

## Key Features

### Mental Health Indicators

- Figures out someone's current mood and emotional state
- Detects stress and anxiety levels
- Looks for signs of depression like hopelessness or sadness
- Most importantly, can detect if someone is thinking about hurting themselves
- Analyzes social factors like isolation or lack of support

### Risk Classification

- **Low Risk**: Normal fluctuations, continue monitoring
- **Medium Risk**: Some concerns, increased attention needed
- **High Risk**: Significant issues, consider intervention
- **Critical Risk**: Crisis situation, immediate action required

### Care Person Integration

- **Automatic Alerts**: Critical situation notifications
- **Daily Summaries**: Regular mental health updates
- **Professional Communication**: Clear, actionable information
- **Privacy Protection**: Secure, HIPAA-compliant messaging

## 🔒 Security & Privacy

### Data Protection

- **Secure Storage**: Encrypted file storage
- **Access Control**: User-specific data isolation
- **Audit Logging**: Complete activity tracking
- **HIPAA Compliance**: Healthcare privacy standards

### File Management

- Only accepts safe audio file types
- Limits file sizes so people can't upload huge files
- Automatically cleans up temporary files
- Has backup systems in case something goes wrong

## Monitoring and Analytics

### Health Checks

- Makes sure Whisper AI is working
- Checks if OpenAI is responding
- Monitors email delivery to make sure alerts go through
- Keeps an eye on storage space

### Performance Metrics

- Tracks how long audio analysis takes
- Measures how accurate the transcriptions are
- Monitors email delivery success rates
- Tracks which features people actually use

## Deployment

### Requirements

```bash
pip install -r requirements.txt
```

### Database Setup

```bash
alembic upgrade head
```

### Environment Configuration

1. Add your OpenAI API key
2. Set up email settings (like Gmail)
3. Configure file upload limits
4. Set up security keys

### Service Start

```bash
python run.py
```

## Future Ideas

### Advanced AI Features

- Analyze voice tone and emotion, not just words
- Look for patterns over time to spot trends
- Predict problems before they get serious
- Give personalized recommendations based on individual patterns

### Integration Options

- Dashboard for healthcare providers
- Direct connection to emergency services
- Integration with support groups
- Anonymous data for research purposes

### Mobile Enhancements

- **Offline Recording**: Local storage capability
- **Push Notifications**: Real-time alerts
- **Voice Commands**: Hands-free operation
- **Background Processing**: Continuous monitoring

## 🎉 Benefits

### For Users

- **Immediate Feedback**: Real-time mental health insights
- **Crisis Prevention**: Early warning system
- **Professional Support**: Care team integration
- **Privacy Control**: Secure, personal analysis

### For Care Teams

- **Proactive Monitoring**: Early intervention opportunities
- **Professional Insights**: AI-powered assessments
- **Communication Tools**: Automated updates and alerts
- **Data Management**: Comprehensive health records

### For Healthcare Providers

- **Clinical Insights**: Evidence-based assessments
- **Risk Management**: Crisis prevention tools
- **Patient Engagement**: Continuous monitoring
- **Research Data**: Anonymous trend analysis

This system transforms Safe Wave from a simple check-in app to a comprehensive
mental health monitoring platform with AI-powered insights and proactive crisis
prevention.
