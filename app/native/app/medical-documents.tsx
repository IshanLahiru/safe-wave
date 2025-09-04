import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    View,
    Platform,
    RefreshControl,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsetsSafe } from '@/hooks/useSafeAreaInsetsSafe';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ModernCard } from '@/components/ui/ModernCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { apiService } from '@/services/api';
import { useDocumentWebSocket, DocumentUploadProgress } from '@/hooks/useDocumentWebSocket';
// What file types we allow and max size
const ALLOWED_EXTS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Get the file extension from a filename
function getExt(name: string | undefined): string {
  return name ? name.substring(name.lastIndexOf('.')).toLowerCase() : '';
}

// Check if the file type is allowed
function isAllowedExt(name: string | undefined): boolean {
  const ext = getExt(name);
  return ALLOWED_EXTS.includes(ext);
}

// Get a filename from a file path when the picker doesn't give us one
function nameFromUri(uri: string, fallback = 'document'): string {
  try {
    const last = uri.split(/[\\/]/).pop() || fallback;
    return decodeURIComponent(last.split('?')[0]);
  } catch {
    return fallback;
  }
}

interface MedicalDocument {
    id: number;
    filename: string;
    file_size: number;
    content_type: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export default function MedicalDocumentsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsetsSafe();
    const { user } = useUser();
    const theme = Colors.dark;

    const [documents, setDocuments] = useState<MedicalDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadMessage, setUploadMessage] = useState<string>('');
    const [currentUploadFile, setCurrentUploadFile] = useState<string>('');
    const [refreshing, setRefreshing] = useState(false);

// Additional UX/validation state
const [errorMsg, setErrorMsg] = useState<string | null>(null);
const [successMsg, setSuccessMsg] = useState<string | null>(null);
const [selectedName, setSelectedName] = useState<string | null>(null);
const [progress, setProgress] = useState<number>(0); // mirrors uploadProgress for accessibility

// Normalize userId for WebSocket (backend accepts flexible sub, but hook expects number | null)
const wsUserId: number | null = (() => {
  const val: unknown = (user as any)?.id;
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const n = Number.parseInt(val, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
})();
    // WebSocket for real-time upload progress
    const { isConnected: wsConnected, connectionError } = useDocumentWebSocket({
        userId: wsUserId,
        onProgress: (progress: DocumentUploadProgress) => {
            console.log('Upload progress received:', progress);

            switch (progress.type) {
                case 'upload_started':
                    setIsUploading(true);
                    setUploadProgress(0);
                    setProgress(0); // keep local progress in sync
                    setUploadMessage(progress.message);
                    setCurrentUploadFile(progress.filename || '');
                    break;

                case 'upload_progress':
                    setUploadProgress(prev => Math.max(prev, progress.progress)); // prefer non-regressive updates
                    setProgress(prev => Math.max(prev, progress.progress)); // mirror to local progress
                    setUploadMessage(progress.message);
                    break;

                case 'upload_completed':
                    setUploadProgress(100);
                    setProgress(100);
                    setUploadMessage(progress.message);
                    setCurrentUploadFile('');
                    // Refresh documents list
                    setTimeout(() => {
                        setIsUploading(false);
                        loadDocuments();
                    }, 1000);
                    break;

                case 'upload_error':
                    setIsUploading(false);
                    setUploadProgress(0);
                    setProgress(0);
                    setUploadMessage('');
                    setCurrentUploadFile('');
                    Alert.alert('Upload Error', progress.message);
                    break;
            }
        },
        onError: (error: string) => {
            console.error('WebSocket error:', error);
            // Continue with fallback progress simulation if WebSocket fails
        }
    });

    // Load documents on component mount
    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            setIsLoading(true);
            const { getBackendUrl } = await import('@/services/config');
            const baseUrl = await getBackendUrl();

            const token = await apiService.getAccessTokenAsync();
            if (!token) {
                Alert.alert('Authentication Required', 'Please log in to view medical documents.');
                return;
            }

            const response = await fetch(`${baseUrl}/documents/list`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Only show medical documents
                const medicalDocs = data.filter((doc: MedicalDocument) =>
                    doc.category === 'medical' ||
                    doc.tags?.includes('medical') ||
                    doc.content_type?.includes('medical')
                );
                setDocuments(medicalDocs);
            } else {
                console.error('Failed to load documents:', response.status);
                Alert.alert('Error', 'Failed to load medical documents.');
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            Alert.alert('Error', 'Failed to load medical documents.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async () => {
        // Keep track of progress animation interval
        let progressInterval: ReturnType<typeof setInterval> | null = null;

        try {
            // Make sure user is logged in
            const token = await apiService.getAccessTokenAsync();
            if (!token) {
                Alert.alert('Authentication Required', 'Please log in to upload documents.');
                return;
            }

            // Open file picker
            const result = await DocumentPicker.getDocumentAsync({
                type: Platform.OS === 'web'
                    ? ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*', 'text/plain']
                    : ['*/*'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled) {
                return;
            }

            const file = result.assets[0];
            console.log('Selected file:', file);

            // Check if the file type is allowed
            const candName = file.name || nameFromUri(file.uri);
            if (!isAllowedExt(candName)) {
                // Make sure file type is supported
                setErrorMsg('Unsupported file type. Allowed: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT');
                setSelectedName(null);
                setIsUploading(false);
                setUploadProgress(0);
                setProgress(0);
                setCurrentUploadFile('');
                return;
            }

            // Prepare UX state
            setSelectedName(candName);
            setErrorMsg(null);
            setSuccessMsg(null);
            setProgress(0);

            // Always set initial upload state immediately for user feedback
            setIsUploading(true);
            setUploadProgress(0);
            setUploadMessage('Starting upload...');
            setCurrentUploadFile(candName);

            console.log('Upload started for file:', candName);

            // Create FormData
            const formData = new FormData();

            if (Platform.OS === 'web') {
                try {
                    // Web: fetch to Blob to get exact size when URI is blob: or http(s):
                    if (file.uri.startsWith('blob:') || file.uri.startsWith('http')) {
                        const response = await fetch(file.uri);
                        const blob = await response.blob();

                        // Exact size check for Web
                        if (blob.size > MAX_SIZE_BYTES) {
                            setIsUploading(false);
                            setUploadProgress(0);
                            setProgress(0);
                            setCurrentUploadFile('');
                            setErrorMsg('File too large. Maximum is 10 MB');
                            return;
                        }

                        // Append as File with correct name and type
                        const upFile = new File([blob], candName, { type: blob.type || 'application/octet-stream' });
                        formData.append('file', upFile, candName);
                    } else {
                        // If we have a File-like object, check its size if available
                        const maybeSize = (file as any)?.size;
                        if (typeof maybeSize === 'number' && maybeSize > MAX_SIZE_BYTES) {
                            setIsUploading(false);
                            setUploadProgress(0);
                            setProgress(0);
                            setCurrentUploadFile('');
                            setErrorMsg('File too large. Maximum is 10 MB');
                            return;
                        }
                        // Fallback: append picked file directly
                        formData.append('file', file as any, candName);
                    }
                } catch (blobError) {
                    // If blob fetch fails, still attempt upload with picked file
                    formData.append('file', file as any, candName);
                }
            } else {
                // Native: do not attempt size probe; rely on backend 413
                const fileToUpload = {
                    uri: file.uri,
                    name: candName,
                    type: file.mimeType || 'application/octet-stream',
                };
                formData.append('file', fileToUpload as any);
            }

            // Add metadata
            formData.append('title', candName || 'Medical Document');
            formData.append('description', 'Medical document uploaded by user');
            formData.append('category', 'medical');
            formData.append('tags', 'medical,healthcare');

            // Get backend URL
            const { getBackendUrl } = await import('@/services/config');
            const baseUrl = await getBackendUrl();
            console.log('Backend URL:', baseUrl);
            console.log('Upload endpoint:', `${baseUrl}/documents/upload`);

            // Start progress simulation if WebSocket is not connected
            if (!wsConnected) {
                setUploadMessage('Uploading file...');
                progressInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        if (prev >= 95) return prev; // Stop at 95% until upload completes
                        // Keep simulated progress conservative; WS will override when available
                        const next = prev + Math.random() * 10;
                        const clamped = Math.min(95, next);
                        setProgress(clamped);
                        return clamped;
                    });
                }, 300);
            }

            // Upload with real-time progress via WebSocket
            console.log('Starting upload request...');
            console.log('File details:', {
                name: file.name,
                size: file.size,
                type: file.mimeType,
                uri: file.uri
            });

            const response = await fetch(`${baseUrl}/documents/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Upload-Platform': Platform.OS,
                    'X-Upload-File-Name': candName,
                    'X-Upload-File-Size': file.size?.toString() || '0',
                },
                body: formData,
            });

            console.log('Upload response status:', response.status);
            console.log('Upload response headers:', response.headers);

            // Clear progress simulation interval
            if (progressInterval) {
                clearInterval(progressInterval);
            }

            if (response.ok) {
                const result = await response.json();
                console.log('Upload successful:', result);

                setSuccessMsg('Upload successful');
                setErrorMsg(null);
                setUploadMessage('Upload completed successfully!');
                setUploadProgress(100);
                setProgress(100);

                // If WebSocket is not connected, handle success manually
                if (!wsConnected) {
                    // Add new document to list for immediate feedback
                    const newDocument: MedicalDocument = {
                        id: result.id,
                        filename: result.filename,
                        file_size: result.file_size,
                        content_type: result.content_type,
                        title: result.title,
                        description: result.description,
                        category: result.category,
                        tags: result.tags,
                        created_at: result.created_at,
                        updated_at: result.updated_at,
                    };

                    setDocuments(prev => [newDocument, ...prev]);
                    // Also refresh from server to ensure full sync
                    loadDocuments();

                    // Reset upload state after a delay
                    setTimeout(() => {
                        setIsUploading(false);
                        setUploadProgress(0);
                        setProgress(0);
                        setUploadMessage('');
                        setCurrentUploadFile('');
                    }, 1000);
                }
                // If WebSocket is connected, it will handle the success notification
            } else {
                let message = `Failed to upload document: ${response.status}`;
                try {
                    const json = await response.json();
                    const detail = json?.detail || json?.message;
                    if (response.status === 413 || /too large/i.test(String(detail))) {
                        message = 'File too large. Maximum is 10 MB';
                    } else if (/unsupported file type/i.test(String(detail))) {
                        message = 'Unsupported file type. Allowed: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT';
                    } else if (detail) {
                        message = String(detail);
                    }
                } catch {
                    try {
                        const txt = await response.text();
                        if (txt) message = txt;
                    } catch {
                        // ignore
                    }
                }

                console.error('Upload failed:', response.status, message);

                // Clear progress simulation interval
                if (progressInterval) {
                    clearInterval(progressInterval);
                }

                // Reset upload state on error
                setIsUploading(false);
                setUploadProgress(0);
                setProgress(0);
                setUploadMessage('');
                setCurrentUploadFile('');

                setErrorMsg(message);
                Alert.alert('Upload Failed', message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorObj = error as Error;

            // Clear progress simulation interval
            if (progressInterval) {
                clearInterval(progressInterval);
            }

            // Reset upload state on error
            setIsUploading(false);
            setUploadProgress(0);
            setProgress(0);
            setUploadMessage('');
            setCurrentUploadFile('');

            setErrorMsg(errorObj.message);
            Alert.alert('Upload Error', `Failed to upload document: ${errorObj.message}`);
        }
    };

    const handleDeleteDocument = async (documentId: number, filename: string) => {
        Alert.alert(
            'Delete Document',
            `Are you sure you want to delete "${filename}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { getBackendUrl } = await import('@/services/config');
                            const baseUrl = await getBackendUrl();

                            const token = await apiService.getAccessTokenAsync();
                            if (!token) {
                                Alert.alert('Authentication Required', 'Please log in to delete documents.');
                                return;
                            }

                            const response = await fetch(`${baseUrl}/documents/${documentId}`, {
                                method: 'DELETE',
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });

                            if (response.ok) {
                                // Remove from local state
                                setDocuments(prev => prev.filter(doc => doc.id !== documentId));
                                Alert.alert('Success', 'Document deleted successfully!');
                            } else {
                                console.error('Delete failed:', response.status);
                                Alert.alert('Error', 'Failed to delete document.');
                            }
                        } catch (error) {
                            console.error('Delete error:', error);
                            const errorObj = error as Error;
                            Alert.alert('Error', `Failed to delete document: ${errorObj.message}`);
                        }
                    },
                },
            ]
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDocuments();
        setRefreshing(false);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getFileIcon = (contentType: string): string => {
        if (contentType.includes('pdf')) return 'doc.text.fill';
        if (contentType.includes('word') || contentType.includes('document')) return 'doc.fill';
        if (contentType.includes('image')) return 'photo.fill';
        if (contentType.includes('text')) return 'doc.text';
        return 'doc';
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 20 }
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <IconSymbol size={24} name="chevron.left" color={theme.text} />
                    </TouchableOpacity>
                    <ThemedText type="title" style={styles.headerTitle}>
                        Medical Documents
                    </ThemedText>
                </View>

                {/* Upload Section */}
                <ModernCard variant="elevated" style={styles.section}>
                    <ThemedText type="heading" style={styles.sectionTitle}>
                        Upload New Document
                    </ThemedText>

                    {isUploading ? (
                        <View style={styles.uploadProgressContainer}>
                            <View style={styles.uploadProgressHeader}>
                                <IconSymbol size={20} name="arrow.clockwise" color={theme.primary} />
                                <ThemedText type="body" style={styles.uploadProgressText}>
                                    {uploadMessage || 'Uploading...'}
                                </ThemedText>
                            </View>

                            {currentUploadFile && (
                                <ThemedText type="caption" variant="muted" style={styles.uploadFileName}>
                                    {currentUploadFile}
                                </ThemedText>
                            )}

                            <View
                                style={styles.progressBarContainer}
                                accessibilityRole="progressbar"
                                accessibilityLabel={`Upload progress ${Math.round(progress)}%`}
                            >
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${progress}%` }
                                        ]}
                                    />
                                </View>
                                <ThemedText type="caption" style={styles.progressText}>
                                    {Math.round(progress)}%
                                </ThemedText>
                            </View>

                            {/* WebSocket connection status */}
                            <View style={styles.connectionStatus}>
                                <View style={[
                                    styles.connectionIndicator,
                                    { backgroundColor: wsConnected ? theme.success : theme.warning }
                                ]} />
                                <ThemedText type="caption" variant="muted" style={styles.connectionText}>
                                    {wsConnected ? 'Real-time updates' : 'Basic progress'}
                                </ThemedText>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={handleFileUpload}
                            disabled={isUploading}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: isUploading }}
                            accessibilityLabel="Select Medical Document for upload"
                        >
                            <IconSymbol size={24} name="doc.badge.plus" color={theme.primary} />
                            <ThemedText type="body" style={styles.uploadButtonText}>
                                Select Medical Document
                            </ThemedText>
                            <ThemedText type="caption" variant="muted" style={styles.uploadButtonSubtext}>
                                PDF, DOC, images, or text files (max 10MB)
                            </ThemedText>
                        </TouchableOpacity>
                    )}

                    {/* Status Messages */}
                    {!isUploading && selectedName && (
                        <ThemedText
                            type="caption"
                            variant="muted"
                            style={styles.selectedNameText}
                            accessibilityLabel={`Selected file ${selectedName}`}
                        >
                            {selectedName}
                        </ThemedText>
                    )}
                    {errorMsg && (
                        <ThemedText type="body" style={styles.messageError} accessibilityRole="alert">
                            {errorMsg}
                        </ThemedText>
                    )}
                    {successMsg && (
                        <ThemedText type="body" style={styles.messageSuccess}>
                            {successMsg}
                        </ThemedText>
                    )}
                </ModernCard>

                {/* Documents List */}
                <ModernCard variant="elevated" style={styles.section}>
                    <ThemedText type="heading" style={styles.sectionTitle}>
                        Your Documents ({documents.length})
                    </ThemedText>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <IconSymbol size={20} name="arrow.clockwise" color={theme.primary} />
                            <ThemedText type="body" variant="muted" style={styles.loadingText}>
                                Loading documents...
                            </ThemedText>
                        </View>
                    ) : documents.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <IconSymbol size={48} name="doc.text" color={theme.muted} />
                            <ThemedText type="body" style={styles.emptyTitle}>
                                No Medical Documents
                            </ThemedText>
                            <ThemedText type="caption" variant="muted" style={styles.emptySubtitle}>
                                Upload your first medical document to get started
                            </ThemedText>
                        </View>
                    ) : (
                        <View style={styles.documentsList}>
                            {documents.map((document) => (
                                <View key={document.id} style={styles.documentItem}>
                                    <View style={styles.documentLeft}>
                                        <IconSymbol
                                            size={20}
                                            name={getFileIcon(document.content_type) as any}
                                            color={theme.primary}
                                        />
                                        <View style={styles.documentText}>
                                            <ThemedText type="body" style={styles.documentName}>
                                                {document.title || document.filename}
                                            </ThemedText>
                                            <ThemedText type="caption" variant="muted" style={styles.documentMeta}>
                                                {formatFileSize(document.file_size)} • {formatDate(document.created_at)}
                                            </ThemedText>
                                            {document.description && (
                                                <ThemedText type="caption" variant="muted" style={styles.documentDescription}>
                                                    {document.description}
                                                </ThemedText>
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.documentActions}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => {
                                                // TODO: Implement document preview/download
                                                Alert.alert('Document Preview', 'Document preview functionality coming soon!');
                                            }}
                                        >
                                            <IconSymbol size={16} name="eye" color={theme.primary} />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleDeleteDocument(document.id, document.filename)}
                                        >
                                            <IconSymbol size={16} name="trash" color={theme.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </ModernCard>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xxxl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    backButton: {
        marginRight: Spacing.md,
        padding: Spacing.sm,
    },
    headerTitle: {
        flex: 1,
        fontSize: 28,
        fontWeight: '700',
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: Spacing.md,
        color: Colors.dark.text,
    },
    uploadButton: {
        backgroundColor: Colors.dark.card,
        borderWidth: 2,
        borderColor: Colors.dark.border,
        borderStyle: 'dashed',
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.primary,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    uploadButtonSubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    uploadProgressContainer: {
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    uploadProgressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    uploadProgressText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: Spacing.sm,
        textAlign: 'center',
    },
    uploadFileName: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: Spacing.md,
        fontStyle: 'italic',
    },
    progressBarContainer: {
        width: '100%',
        marginBottom: Spacing.md,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: Colors.dark.border,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.dark.primary,
        borderRadius: BorderRadius.full,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.primary,
        textAlign: 'center',
    },
    documentsSection: {
        marginBottom: Spacing.xl,
    },
    documentsTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: Spacing.lg,
        color: Colors.dark.text,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        gap: Spacing.sm,
    },
    loadingText: {
        fontSize: 16,
        color: Colors.dark.muted,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: Spacing.xl,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
        color: Colors.dark.text,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.dark.muted,
        textAlign: 'center',
    },
    documentsList: {
        gap: Spacing.md,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    documentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    documentText: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    documentName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    documentMeta: {
        fontSize: 14,
        marginBottom: 2,
    },
    documentDescription: {
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    documentActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.dark.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    connectionIndicator: {
        width: 8,
        height: 8,
        borderRadius: BorderRadius.full,
        marginRight: Spacing.xs,
    },
    connectionText: {
        fontSize: 12,
        color: Colors.dark.muted,
    },
    messageError: {
        color: Colors.dark.danger,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    messageSuccess: {
        color: Colors.dark.success,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    selectedNameText: {
        color: Colors.dark.muted,
        marginTop: Spacing.sm,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
