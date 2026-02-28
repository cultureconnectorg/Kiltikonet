import { useEffect, useRef, useCallback, useState } from 'react';

const API = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Hook for real-time synchronization via Server-Sent Events (SSE)
 * 
 * Usage:
 * const { isConnected, lastEvent, subscribe } = useRealtime();
 * 
 * useEffect(() => {
 *   const unsubscribe = subscribe('territories_updated', (data) => {
 *     console.log('Territories updated!', data);
 *     refetchTerritories();
 *   });
 *   return unsubscribe;
 * }, [subscribe]);
 */
export const useRealtime = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const eventSourceRef = useRef(null);
  const listenersRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(`${API}/api/realtime/events`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('🔗 Real-time connection established');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);

          // Skip ping events for listeners
          if (data.event_type === 'ping' || data.event_type === 'connected') {
            return;
          }

          // Notify all listeners for this event type
          const typeListeners = listenersRef.current.get(data.event_type) || [];
          typeListeners.forEach(callback => callback(data.data, data));

          // Notify wildcard listeners
          const wildcardListeners = listenersRef.current.get('*') || [];
          wildcardListeners.forEach(callback => callback(data.data, data));

          console.log(`📡 Real-time event: ${data.event_type}`, data.data);
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      };

      eventSource.onerror = (error) => {
        console.log('🔌 Real-time connection lost, reconnecting...');
        setIsConnected(false);
        eventSource.close();

        // Exponential backoff reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (error) {
      console.error('Failed to create EventSource:', error);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  /**
   * Subscribe to a specific event type
   * @param {string} eventType - Event type to subscribe to (e.g., 'territories_updated', 'cms_content_updated', '*' for all)
   * @param {function} callback - Callback function (data, fullEvent) => void
   * @returns {function} Unsubscribe function
   */
  const subscribe = useCallback((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, []);
    }
    listenersRef.current.get(eventType).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = listenersRef.current.get(eventType) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    isConnected,
    lastEvent,
    subscribe
  };
};

/**
 * Hook that auto-refetches data when a specific event occurs
 * 
 * Usage:
 * useRealtimeRefetch('territories_updated', fetchTerritories);
 */
export const useRealtimeRefetch = (eventType, refetchFn, deps = []) => {
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe(eventType, () => {
      console.log(`🔄 Auto-refetching due to ${eventType}`);
      refetchFn();
    });
    return unsubscribe;
  }, [eventType, refetchFn, subscribe, ...deps]);
};

/**
 * Available event types:
 * - 'territories_updated' - Globe territories changed
 * - 'cms_content_updated' - CMS content changed (includes page and section)
 * - 'theme_updated' - Theme/design changed
 * - 'intention_updated' - Annual intention changed
 * - 'registration_created' - New registration
 * - 'registration_updated' - Registration status changed
 * - '*' - All events
 */

export default useRealtime;
