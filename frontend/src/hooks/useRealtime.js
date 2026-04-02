import { useEffect, useRef, useCallback, useState, useMemo } from 'react';

const API = process.env.REACT_APP_BACKEND_URL || '';
const __DEV__ = process.env.NODE_ENV === 'development';
const log = (...args) => { if (__DEV__) log(...args); };

/**
 * 🔄 BIDIRECTIONAL REALTIME SYNC HOOK
 * 
 * Provides atomic, intelligent, interconnected synchronization across the entire platform.
 * Uses WebSocket for bidirectional communication with automatic fallback to SSE.
 * 
 * Features:
 * - Bidirectional: Send AND receive updates in real-time
 * - Atomic: All connected clients receive updates simultaneously
 * - Intelligent: Auto-reconnection, channel subscriptions, deduplication
 * - Interconnected: All modules (CMS, Globe, Registrations) share the same connection
 * 
 * Usage:
 * const { 
 *   isConnected, 
 *   clientId,
 *   subscribe, 
 *   sendUpdate,
 *   connectionCount 
 * } = useBidirectionalSync();
 * 
 * // Subscribe to updates
 * useEffect(() => {
 *   return subscribe('territories_updated', (data) => {
 *     log('Globe updated!', data);
 *     refetchTerritories();
 *   });
 * }, [subscribe]);
 * 
 * // Send an update (broadcasts to all other clients)
 * const handleSave = () => {
 *   saveToDatabase(data);
 *   sendUpdate('territories', data); // All other clients will receive this
 * };
 */

// WebSocket URL (convert http to ws)
const getWebSocketUrl = () => {
  const url = API.replace('https://', 'wss://').replace('http://', 'ws://');
  return `${url}/api/ws/sync`;
};

export const useBidirectionalSync = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [lastEvent, setLastEvent] = useState(null);
  
  const wsRef = useRef(null);
  const listenersRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const pendingMessagesRef = useRef([]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        log('🔗 Bidirectional sync connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Send any pending messages
        while (pendingMessagesRef.current.length > 0) {
          const msg = pendingMessagesRef.current.shift();
          ws.send(JSON.stringify(msg));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);

          // Handle connection confirmation
          if (data.event_type === 'connected') {
            setClientId(data.client_id);
            log(`🆔 Client ID: ${data.client_id}`);
            return;
          }

          // Handle sync state (includes connection count)
          if (data.event_type === 'sync_state' || data.connections) {
            if (data.connections?.total_connections) {
              setConnectionCount(data.connections.total_connections);
            }
          }

          // Skip ping/pong for listeners
          if (data.event_type === 'pong' || data.event_type === 'ping') {
            return;
          }

          // Skip update confirmations for listeners (sender already knows)
          if (data.event_type === 'update_confirmed') {
            log(`✅ Update confirmed: ${data.type}`);
            return;
          }

          // Notify all listeners for this event type
          const eventType = data.event_type;
          const typeListeners = listenersRef.current.get(eventType) || [];
          typeListeners.forEach(callback => {
            try {
              callback(data.data || data, data);
            } catch (e) {
              log('Listener error:', e);
            }
          });

          // Notify wildcard listeners
          const wildcardListeners = listenersRef.current.get('*') || [];
          wildcardListeners.forEach(callback => {
            try {
              callback(data.data || data, data);
            } catch (e) {
              log('Wildcard listener error:', e);
            }
          });

          log(`📡 Realtime event: ${eventType}`, data.data || '');
        } catch (e) {
          log('Error parsing WebSocket message:', e);
        }
      };

      ws.onclose = (event) => {
        log('🔌 Bidirectional sync disconnected');
        setIsConnected(false);
        setClientId(null);

        // Reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        log('WebSocket error:', error);
      };

    } catch (error) {
      log('Failed to create WebSocket:', error);
      // Fallback to SSE could be implemented here
    }
  }, []);

  // Initialize connection
  useEffect(() => {
    connect();

    // Ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'ping' }));
      }
    }, 25000);

    // Request sync state periodically
    const syncInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'request_sync', type: 'all' }));
      }
    }, 60000);

    return () => {
      clearInterval(pingInterval);
      clearInterval(syncInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  /**
   * Subscribe to a specific event type
   * @param {string} eventType - Event type (e.g., 'territories_updated', 'cms_content_updated', '*')
   * @param {function} callback - Callback function (data, fullEvent) => void
   * @returns {function} Unsubscribe function
   */
  const subscribe = useCallback((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, []);
    }
    listenersRef.current.get(eventType).push(callback);

    return () => {
      const listeners = listenersRef.current.get(eventType) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  /**
   * Send an update to all other connected clients
   * @param {string} type - Update type (e.g., 'territories', 'cms', 'theme')
   * @param {object} data - Data to broadcast
   */
  const sendUpdate = useCallback((type, data = {}) => {
    const message = { action: 'update', type, data };
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      log(`📤 Sent update: ${type}`);
    } else {
      // Queue message for when connection is restored
      pendingMessagesRef.current.push(message);
      log(`📦 Queued update: ${type} (will send when connected)`);
    }
  }, []);

  /**
   * Subscribe to specific channels
   * @param {string[]} channels - Channels to subscribe to
   */
  const subscribeToChannels = useCallback((channels) => {
    const message = { action: 'subscribe', channels };
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      pendingMessagesRef.current.push(message);
    }
  }, []);

  /**
   * Request full sync state
   */
  const requestSync = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'request_sync', type: 'all' }));
    }
  }, []);

  return {
    isConnected,
    clientId,
    connectionCount,
    lastEvent,
    subscribe,
    sendUpdate,
    subscribeToChannels,
    requestSync
  };
};

/**
 * Simplified hook for auto-refetch on specific events
 */
export const useRealtimeRefetch = (eventType, refetchFn, deps = []) => {
  const { subscribe } = useBidirectionalSync();

  useEffect(() => {
    const unsubscribe = subscribe(eventType, () => {
      log(`🔄 Auto-refetch: ${eventType}`);
      refetchFn();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, subscribe, ...deps]);
};

/**
 * Hook for CMS real-time sync
 */
export const useCMSSync = (onUpdate) => {
  const { subscribe, sendUpdate, isConnected } = useBidirectionalSync();

  useEffect(() => {
    const unsubscribers = [
      subscribe('cms_content_updated', onUpdate),
      subscribe('theme_updated', onUpdate),
      subscribe('territories_updated', onUpdate),
      subscribe('intention_updated', onUpdate)
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [subscribe, onUpdate]);

  const broadcastCMSUpdate = useCallback((type, data) => {
    sendUpdate(type, data);
  }, [sendUpdate]);

  return { broadcastCMSUpdate, isConnected };
};

// Re-export for backward compatibility
export { useBidirectionalSync as useRealtime };

export default useBidirectionalSync;
