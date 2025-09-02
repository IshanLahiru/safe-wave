export interface User {
    id: number;
    email: string;
    name: string;
    carePersonEmail?: string;
    emergencyContactEmail?: string;
    isOnboardingComplete: boolean;
    onboardingAnswers?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
export interface AudioRecord {
    id: number;
    userId: number;
    filename: string;
    originalFilename: string;
    fileSize: number;
    duration?: number;
    transcription?: string;
    transcriptionConfidence?: number;
    transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
    analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    mentalHealthIndicators?: Record<string, any>;
    summary?: string;
    recommendations?: string[];
    createdAt: string;
    updatedAt: string;
    transcribedAt?: string;
    analyzedAt?: string;
}
export interface MentalHealthAnalysis {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    mentalHealthIndicators: {
        mood?: string;
        anxiety?: string;
        depression?: string;
        suicidalIdeation?: boolean;
        selfHarmRisk?: boolean;
        supportSystem?: string;
        crisisReadiness?: string;
    };
    keyConcerns: string[];
    summary: string;
    recommendations: string[];
    carePersonAlert?: string;
    crisisInterventionNeeded?: boolean;
    transcription?: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
}
export interface OnboardingAnswers {
    safetyConcerns?: string;
    supportSystem?: string;
    crisisPlan?: string;
    dailyStruggles?: string;
    copingMechanisms?: string;
    stressLevel?: number;
    sleepQuality?: number;
    appGoals?: string;
    checkinFrequency?: string;
    emergencyContactName?: string;
    emergencyContactEmail?: string;
    emergencyContactRelationship?: string;
}
export interface EmailAlert {
    type: 'critical' | 'voice' | 'onboarding' | 'daily_summary';
    recipientType: 'care_person' | 'emergency_contact';
    userName: string;
    subject: string;
    content: string;
    metadata?: Record<string, any>;
}
