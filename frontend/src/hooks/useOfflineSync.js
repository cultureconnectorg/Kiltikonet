/**
 * useOfflineSync Hook - CC2026 Dashboard
 * Gère la synchronisation hors-ligne pour le dashboard
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import offlineCache from '../services/OfflineCache';

export const useOfflineSync = (onStatusChange) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'error'
  const initialized = useRef(false);

  // Initialize offline cache
  useEffect(() => {
    const init = async () => {
      if (initialized.current) return;
      initialized.current = true;
      
      try {
        await offlineCache.init();
        const count = await offlineCache.getPendingCount();
        setPendingCount(count);
        
        // Get last sync time
        const lastSyncTime = await offlineCache.getMeta('last_sync');
        if (lastSyncTime) {
          setLastSync(new Date(lastSyncTime));
        }
      } catch (error) {
        // DEV: console.warn('[useOfflineSync] Init failed:', error);
      }
    };
    
    init();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      if (onStatusChange) onStatusChange('online');
      
      // Auto-sync when coming back online
      await syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (onStatusChange) onStatusChange('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onStatusChange, syncPendingChanges]);

  // Save task status (works offline)
  const saveTaskStatus = useCallback(async (taskId, done, workspaceId) => {
    try {
      await offlineCache.saveTaskStatus(taskId, done, workspaceId);
      
      if (!navigator.onLine) {
        const count = await offlineCache.getPendingCount();
        setPendingCount(count);
      }
      
      return true;
    } catch (error) {
      // DEV: console.warn('[useOfflineSync] Failed to save task:', error);
      return false;
    }
  }, []);

  // Get all task statuses (from local cache)
  const getLocalTaskStatuses = useCallback(async () => {
    try {
      const statuses = await offlineCache.getAllTaskStatuses();
      const statusMap = {};
      statuses.forEach(s => {
        statusMap[s.task_id] = s.done;
      });
      return statusMap;
    } catch (error) {
      // DEV: console.warn('[useOfflineSync] Failed to get local statuses:', error);
      return {};
    }
  }, []);

  // Bulk update from server response
  const updateFromServer = useCallback(async (statuses) => {
    try {
      await offlineCache.bulkUpdateTaskStatuses(statuses);
      await offlineCache.setMeta('last_sync', new Date().toISOString());
      setLastSync(new Date());
    } catch (error) {
      // DEV: console.warn('[useOfflineSync] Failed to update from server:', error);
    }
  }, []);

  // Sync pending changes
  const syncPendingChanges = useCallback(async () => {
    if (!navigator.onLine) return { synced: 0, failed: 0 };
    
    setSyncStatus('syncing');
    
    try {
      const result = await offlineCache.syncPendingActions();
      setPendingCount(0);
      await offlineCache.setMeta('last_sync', new Date().toISOString());
      setLastSync(new Date());
      setSyncStatus('idle');
      return result;
    } catch (error) {
      // DEV: console.warn('[useOfflineSync] Sync failed:', error);
      setSyncStatus('error');
      return { synced: 0, failed: 0 };
    }
  }, []);

  // Force refresh from server
  const forceRefresh = useCallback(async (fetchFn) => {
    if (!navigator.onLine) {
      // DEV: console.log('[useOfflineSync] Cannot refresh - offline');
      return false;
    }
    
    setSyncStatus('syncing');
    
    try {
      // First sync any pending changes
      await syncPendingChanges();
      
      // Then fetch fresh data
      if (fetchFn) {
        await fetchFn();
      }
      
      setSyncStatus('idle');
      return true;
    } catch (error) {
      // DEV: console.warn('[useOfflineSync] Refresh failed:', error);
      setSyncStatus('error');
      return false;
    }
  }, [syncPendingChanges]);

  // Clear all local data
  const clearLocalData = useCallback(async () => {
    try {
      await offlineCache.clearAllData();
      setPendingCount(0);
      setLastSync(null);
    } catch (error) {
      // DEV: console.warn('[useOfflineSync] Clear failed:', error);
    }
  }, []);

  return {
    // Status
    isOnline,
    pendingCount,
    lastSync,
    syncStatus,
    
    // Actions
    saveTaskStatus,
    getLocalTaskStatuses,
    updateFromServer,
    syncPendingChanges,
    forceRefresh,
    clearLocalData
  };
};

export default useOfflineSync;
