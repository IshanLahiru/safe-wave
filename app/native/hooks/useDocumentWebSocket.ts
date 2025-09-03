import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export interface DocumentUploadProgress {
  type: 'upload_started' | 'upload_progress' | 'upload_completed' | 'upload_error' | 'heartbeat';
  filename?: string;
  document_id?: number;
  message: string;
  progress: number;
}

interface UseDocumentWebSocketProps {
  userId: number | null;
  onProgress?: (progress: DocumentUploadProgress) => void;
  onError?: (error: string) => void;
}

export const useDocumentWebSocket = ({
  userId,
  onProgress,
  onError,
}: UseDocumentWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getWebSocketUrl = async () => {
    // Figure out the backend URL
    const { getBackendUrl } = await import('@/services/config');
    const baseUrl = await getBackendUrl();

    // Get the user's login token
    const { apiService } = await import('@/services/api');
    const token = await apiService.getAccessTokenAsync();

    if (!token) {
      throw new Error('No authentication token available');
    }

    // Change http to ws for WebSocket connection
    const wsUrl = baseUrl.replace(/^https?:/, baseUrl.startsWith('https:') ? 'wss:' : 'ws:');
    return `${wsUrl}/documents/ws/${userId}?token=${encodeURIComponent(token)}`;
  };

  const connect = async () => {
    if (!userId || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = await getWebSocketUrl();
      console.log('Connecting to document WebSocket:', wsUrl);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Document WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send('heartbeat');
          }
        }, 30000); // Send heartbeat every 30 seconds
      };

      wsRef.current.onmessage = event => {
        try {
          const data: DocumentUploadProgress = JSON.parse(event.data);
          console.log('Document WebSocket message received:', data);

          if (data.type !== 'heartbeat' && onProgress) {
            onProgress(data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = event => {
        console.log('Document WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Attempt to reconnect after a delay (unless it was a clean close)
        if (event.code !== 1000 && userId) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect document WebSocket...');
            connect().catch(error => {
              console.error('Failed to reconnect to document WebSocket:', error);
            });
          }, 3000);
        }
      };

      wsRef.current.onerror = error => {
        console.error('Document WebSocket error:', error);
        const errorMessage = 'WebSocket connection failed';
        setConnectionError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      };
    } catch (error) {
      console.error('Failed to create document WebSocket connection:', error);
      const errorMessage = 'Failed to establish WebSocket connection';
      setConnectionError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const disconnect = () => {
    // Clear timeouts and intervals
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionError(null);
  };

  useEffect(() => {
    if (userId) {
      connect().catch(error => {
        console.error('Failed to connect to document WebSocket:', error);
        if (onError) {
          onError('Failed to establish WebSocket connection');
        }
      });
    }

    return () => {
      disconnect();
    };
  }, [userId]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
  };
};
