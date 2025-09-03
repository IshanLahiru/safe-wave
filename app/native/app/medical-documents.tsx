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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ModernCard } from '@/components/ui/ModernCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { apiService } from '@/services/api';

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
    const insets = useSafeAreaInsets();
    const { user } = useUser();
    const theme = Colors.dark;

    const [documents, setDocuments] = useState<MedicalDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [refreshing, setRefreshing] = useState(false);

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
                // Filter for medical documents
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
        try {
            setIsUploading(true);
            setUploadProgress(0);

            // Check authentication
            const token = await apiService.getAccessTokenAsync();
            if (!token) {
                Alert.alert('Authentication Required', 'Please log in to upload documents.');
                return;
            }

            // Pick document
            const result = await DocumentPicker.getDocumentAsync({
                type: Platform.OS === 'web'
                    ? ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*', 'text/plain']
                    : ['*/*'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled) {
                setIsUploading(false);
                setUploadProgress(0);
                return;
            }

            const file = result.assets[0];
            console.log('Selected file:', file);

            // Validate file size (10MB max)
            const maxSize = 10 * 1024 * 1024;
            if (file.size && file.size > maxSize) {
                Alert.alert('File Too Large', `Please select a file smaller than ${maxSize / (1024 * 1024)}MB.`);
                setIsUploading(false);
                setUploadProgress(0);
                return;
            }

            // Create FormData
            const formData = new FormData();

            if (Platform.OS === 'web') {
                if (file.uri.startsWith('blob:')) {
                    try {
                        const response = await fetch(file.uri);
                        const blob = await response.blob();
                        formData.append('file', blob, file.name);
                    } catch (blobError) {
                        formData.append('file', file as any, file.name);
                    }
                } else {
                    formData.append('file', file as any, file.name);
                }
            } else {
                const fileToUpload = {
                    uri: file.uri,
                    name: file.name || 'document',
                    type: file.mimeType || 'application/octet-stream',
                };
                formData.append('file', fileToUpload as any);
            }

            // Add metadata
            formData.append('title', file.name || 'Medical Document');
            formData.append('description', 'Medical document uploaded by user');
            formData.append('category', 'medical');
            formData.append('tags', 'medical,healthcare');

            // Get backend URL
            const { getBackendUrl } = await import('@/services/config');
            const baseUrl = await getBackendUrl();

            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + Math.random() * 10;
                });
            }, 200);

            // Upload
            const response = await fetch(`${baseUrl}/documents/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Upload-Platform': Platform.OS,
                    'X-Upload-File-Name': file.name,
                    'X-Upload-File-Size': file.size?.toString() || '0',
                },
                body: formData,
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (response.ok) {
                const result = await response.json();
                console.log('Upload successful:', result);

                // Add new document to list
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
                Alert.alert('Success', 'Medical document uploaded successfully!');
            } else {
                const errorText = await response.text();
                console.error('Upload failed:', response.status, errorText);
                Alert.alert('Upload Failed', `Failed to upload document: ${response.status}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorObj = error as Error;
            Alert.alert('Upload Error', `Failed to upload document: ${errorObj.message}`);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
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
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <ThemedView style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <IconSymbol size={24} name='chevron.left' color={theme.primary} />
                        <ThemedText style={styles.backButtonText}>Back</ThemedText>
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <IconSymbol size={32} name='doc.text.fill' color={Colors.dark.primary} />
                        <ThemedText type='title' style={styles.title}>
                            Medical Documents
                        </ThemedText>
                    </View>

                    <ThemedText type='body' style={styles.subtitle}>
                        Manage your medical documents and records
                    </ThemedText>
                </ThemedView>

                {/* Upload Section */}
                <ModernCard variant='elevated' style={styles.uploadSection}>
                    <ThemedText type='heading' style={styles.uploadTitle}>
                        Upload New Document
                    </ThemedText>

                    {isUploading ? (
                        <View style={styles.uploadProgressContainer}>
                            <View style={styles.uploadProgressHeader}>
                                <IconSymbol size={24} name='arrow.clockwise' color={Colors.dark.primary} />
                                <ThemedText style={styles.uploadProgressText}>Uploading...</ThemedText>
                            </View>

                            <View style={styles.progressBarContainer}>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${uploadProgress}%` }
                                        ]}
                                    />
                                </View>
                                <ThemedText style={styles.progressText}>
                                    {Math.round(uploadProgress)}%
                                </ThemedText>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={handleFileUpload}
                            disabled={isUploading}
                        >
                            <IconSymbol size={24} name='doc.badge.plus' color={Colors.dark.primary} />
                            <ThemedText style={styles.uploadButtonText}>
                                Select Medical Document
                            </ThemedText>
                            <ThemedText style={styles.uploadButtonSubtext}>
                                PDF, DOC, images, or text files (max 10MB)
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                </ModernCard>

                {/* Documents List */}
                <ModernCard variant='elevated' style={styles.documentsSection}>
                    <ThemedText type='heading' style={styles.documentsTitle}>
                        Your Documents ({documents.length})
                    </ThemedText>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <IconSymbol size={24} name='arrow.clockwise' color={Colors.dark.primary} />
                            <ThemedText style={styles.loadingText}>Loading documents...</ThemedText>
                        </View>
                    ) : documents.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <IconSymbol size={48} name='doc.text' color={Colors.dark.muted} />
                            <ThemedText style={styles.emptyTitle}>No Medical Documents</ThemedText>
                            <ThemedText style={styles.emptySubtitle}>
                                Upload your first medical document to get started
                            </ThemedText>
                        </View>
                    ) : (
                        <View style={styles.documentsList}>
                            {documents.map((document) => (
                                <View key={document.id} style={styles.documentItem}>
                                    <View style={styles.documentInfo}>
                                        <View style={styles.documentIcon}>
                                            <IconSymbol
                                                size={24}
                                                name={getFileIcon(document.content_type)}
                                                color={Colors.dark.primary}
                                            />
                                        </View>

                                        <View style={styles.documentDetails}>
                                            <ThemedText style={styles.documentName}>
                                                {document.title || document.filename}
                                            </ThemedText>
                                            <ThemedText style={styles.documentMeta}>
                                                {formatFileSize(document.file_size)} • {formatDate(document.created_at)}
                                            </ThemedText>
                                            {document.description && (
                                                <ThemedText style={styles.documentDescription}>
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
                                            <IconSymbol size={20} name='eye' color={Colors.dark.primary} />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleDeleteDocument(document.id, document.filename)}
                                        >
                                            <IconSymbol size={20} name='trash' color={Colors.dark.danger} />
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.xl,
        paddingBottom: 120,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        paddingTop: Spacing.lg,
        position: 'relative',
        minHeight: 120,
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.dark.surface,
        zIndex: 10,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: Spacing.xs,
        color: Colors.dark.text,
        opacity: 0.8,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
        gap: Spacing.md,
        marginTop: Spacing.xxl * 3,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        color: Colors.dark.text,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.7,
        color: Colors.dark.text,
    },
    uploadSection: {
        marginBottom: Spacing.xl,
    },
    uploadTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: Spacing.lg,
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
        color: Colors.dark.muted,
        textAlign: 'center',
    },
    uploadProgressContainer: {
        backgroundColor: Colors.dark.card,
        borderWidth: 2,
        borderColor: Colors.dark.primary,
        borderStyle: 'solid',
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
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
        fontWeight: '600',
        color: Colors.dark.primary,
        marginLeft: Spacing.sm,
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
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        ...Shadows.small,
    },
    documentInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    documentIcon: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.dark.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    documentDetails: {
        flex: 1,
    },
    documentName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: Spacing.xs,
    },
    documentMeta: {
        fontSize: 14,
        color: Colors.dark.muted,
        marginBottom: Spacing.xs,
    },
    documentDescription: {
        fontSize: 14,
        color: Colors.dark.muted,
        opacity: 0.8,
    },
    documentActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.dark.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
