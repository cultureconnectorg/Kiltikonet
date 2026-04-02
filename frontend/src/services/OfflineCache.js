/**
 * Offline Cache Service - CC2026 Dashboard
 * Utilise IndexedDB pour le stockage persistant hors-ligne
 */

const DB_NAME = 'cc2026_offline_db';
const DB_VERSION = 1;
const STORES = {
  TASKS: 'tasks_status',
  PENDING_SYNC: 'pending_sync',
  CACHE_META: 'cache_meta'
};

class OfflineCache {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.pendingSyncQueue = [];
    this.syncInProgress = false;
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  // ═══════════════════════════════════════════════════════════════
  // DATABASE INITIALIZATION
  // ═══════════════════════════════════════════════════════════════
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineCache] Failed to open database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Tasks status store
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          const tasksStore = db.createObjectStore(STORES.TASKS, { keyPath: 'task_id' });
          tasksStore.createIndex('workspace_id', 'workspace_id', { unique: false });
          tasksStore.createIndex('synced', 'synced', { unique: false });
        }

        // Pending sync queue
        if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
          const syncStore = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Cache metadata
        if (!db.objectStoreNames.contains(STORES.CACHE_META)) {
          db.createObjectStore(STORES.CACHE_META, { keyPath: 'key' });
        }

      };
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // TASK STATUS OPERATIONS
  // ═══════════════════════════════════════════════════════════════
  async saveTaskStatus(taskId, done, workspaceId) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([STORES.TASKS], 'readwrite');
    const store = transaction.objectStore(STORES.TASKS);

    const taskData = {
      task_id: taskId,
      done: done,
      workspace_id: workspaceId,
      updated_at: new Date().toISOString(),
      synced: this.isOnline
    };

    return new Promise((resolve, reject) => {
      const request = store.put(taskData);
      request.onsuccess = () => {
        
        // If offline, add to sync queue
        if (!this.isOnline) {
          this.addToSyncQueue({
            type: 'task_toggle',
            task_id: taskId,
            done: done,
            workspace_id: workspaceId
          });
        }
        
        resolve(taskData);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTaskStatuses() {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([STORES.TASKS], 'readonly');
    const store = transaction.objectStore(STORES.TASKS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTaskStatus(taskId) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([STORES.TASKS], 'readonly');
    const store = transaction.objectStore(STORES.TASKS);

    return new Promise((resolve, reject) => {
      const request = store.get(taskId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Bulk update from server
  async bulkUpdateTaskStatuses(statuses) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([STORES.TASKS], 'readwrite');
    const store = transaction.objectStore(STORES.TASKS);

    for (const status of statuses) {
      const taskData = {
        task_id: status.task_id,
        done: status.done,
        workspace_id: status.workspace_id || 'server',
        updated_at: status.updated_at || new Date().toISOString(),
        synced: true
      };
      store.put(taskData);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SYNC QUEUE OPERATIONS
  // ═══════════════════════════════════════════════════════════════
  async addToSyncQueue(action) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([STORES.PENDING_SYNC], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_SYNC);

    const queueItem = {
      ...action,
      created_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => {
        this.pendingSyncQueue.push(queueItem);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSyncActions() {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([STORES.PENDING_SYNC], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_SYNC);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue() {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([STORES.PENDING_SYNC], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_SYNC);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        this.pendingSyncQueue = [];
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncItem(id) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([STORES.PENDING_SYNC], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_SYNC);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // CACHE METADATA
  // ═══════════════════════════════════════════════════════════════
  async setMeta(key, value) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([STORES.CACHE_META], 'readwrite');
    const store = transaction.objectStore(STORES.CACHE_META);

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, updated_at: new Date().toISOString() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMeta(key) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([STORES.CACHE_META], 'readonly');
    const store = transaction.objectStore(STORES.CACHE_META);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ONLINE/OFFLINE HANDLERS
  // ═══════════════════════════════════════════════════════════════
  handleOnline() {
    this.isOnline = true;
    this.syncPendingActions();
  }

  handleOffline() {
    this.isOnline = false;
  }

  async syncPendingActions() {
    if (this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    const pendingActions = await this.getPendingSyncActions();
    
    if (pendingActions.length === 0) {
      this.syncInProgress = false;
      return { synced: 0, failed: 0 };
    }

    
    let synced = 0;
    let failed = 0;
    const API_URL = process.env.REACT_APP_BACKEND_URL || '';

    for (const action of pendingActions) {
      try {
        if (action.type === 'task_toggle') {
          const response = await fetch(`${API_URL}/api/cc2026/tasks/${action.task_id}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspace_id: action.workspace_id,
              done: action.done
            })
          });

          if (response.ok) {
            await this.removeSyncItem(action.id);
            // Update local record as synced
            await this.saveTaskStatus(action.task_id, action.done, action.workspace_id);
            synced++;
          } else {
            failed++;
          }
        }
      } catch (error) {
        console.error('[OfflineCache] Sync failed for action:', action, error);
        failed++;
      }
    }

    this.syncInProgress = false;
    
    return { synced, failed };
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════
  getOnlineStatus() {
    return this.isOnline;
  }

  async getPendingCount() {
    const pending = await this.getPendingSyncActions();
    return pending.length;
  }

  async clearAllData() {
    if (!this.db) await this.init();

    const stores = [STORES.TASKS, STORES.PENDING_SYNC, STORES.CACHE_META];
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = resolve;
        request.onerror = reject;
      });
    }

  }
}

// Singleton instance
const offlineCache = new OfflineCache();

export default offlineCache;
export { OfflineCache };
