/* eslint-disable no-restricted-globals */

// Service Worker - Culture Connect 2026 PWA
// Cache versioning
const CACHE_VERSION = 'cc2026-v3.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const SCAN_QUEUE_STORE = 'cc2026-offline-scans';

// Files to cache immediately on install
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/static/css/main.css',
  '/static/js/main.js'
];

// API routes to cache for offline
const API_ROUTES_TO_CACHE = [
  '/api/cc2026/tasks/status',
  '/api/pro/opportunities',
  '/api/pro/events',
  '/api/catalog/public',
  '/api/registrations'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static files');
        return cache.addAll(STATIC_FILES).catch(err => {
          console.log('[SW] Some static files failed to cache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('cc2026-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    // Intercept scan POST requests for offline queuing
    if (request.method === 'POST' && url.pathname.includes('/api/scan/')) {
      event.respondWith(handleOfflineScan(request));
      return;
    }
    return;
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - Network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Static assets - Cache first, then network
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // HTML pages - Network first with offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default - Stale while revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ═══════════════════════════════════════════════════════════════
// CACHING STRATEGIES
// ═══════════════════════════════════════════════════════════════

// Cache first - for static assets
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first - for API calls
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful GET responses
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline JSON response for API
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'Vous êtes hors ligne',
        cached: false 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Network first with offline fallback for HTML
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache the HTML page
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try to return cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to main page
    const fallback = await caches.match('/');
    if (fallback) {
      return fallback;
    }
    
    // Ultimate fallback
    return new Response(
      `<!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Culture Connect 2026 - Hors ligne</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            background: #1A1A14; 
            color: #F4F1EA;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            text-align: center;
            padding: 20px;
          }
          .container { max-width: 400px; }
          h1 { color: #D4A84B; font-size: 1.5rem; margin-bottom: 1rem; }
          p { color: #8A857D; margin-bottom: 1.5rem; }
          button {
            background: #D4A84B;
            color: #1A1A14;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Mode Hors Ligne</h1>
          <p>Vous n'êtes pas connecté à Internet. Vérifiez votre connexion et réessayez.</p>
          <button onclick="window.location.reload()">Réessayer</button>
        </div>
      </body>
      </html>`,
      { 
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Stale while revalidate - for dynamic content
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function isStaticAsset(pathname) {
  return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i);
}

// ═══════════════════════════════════════════════════════════════
// BACKGROUND SYNC
// ═══════════════════════════════════════════════════════════════

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'cc2026-sync' || event.tag === 'cc2026-scan-sync') {
    event.waitUntil(syncOfflineScans());
  }
});

async function syncPendingData() {
  // This will be handled by the OfflineCache service in the app
  console.log('[SW] Sync pending data requested');
  
  // Notify all clients to sync
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_REQUESTED',
      timestamp: Date.now()
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS (for team notifications)
// ═══════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = { title: 'Culture Connect 2026', body: 'Nouvelle notification' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      ...data
    },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// ═══════════════════════════════════════════════════════════════
// MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => 
        Promise.all(names.map((name) => caches.delete(name)))
      )
    );
  }

  if (event.data.type === 'SYNC_OFFLINE_SCANS') {
    event.waitUntil(syncOfflineScans());
  }

  if (event.data.type === 'GET_OFFLINE_QUEUE_SIZE') {
    event.waitUntil(
      getOfflineQueueSize().then(size => {
        event.source.postMessage({ type: 'OFFLINE_QUEUE_SIZE', size });
      })
    );
  }
});

// ═══════════════════════════════════════════════════════════════
// OFFLINE SCAN QUEUE (IndexedDB)
// ═══════════════════════════════════════════════════════════════

function openScanDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SCAN_QUEUE_STORE, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('scans')) {
        db.createObjectStore('scans', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function queueOfflineScan(scanData) {
  const db = await openScanDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('scans', 'readwrite');
    tx.objectStore('scans').add({
      ...scanData,
      queued_at: new Date().toISOString(),
      synced: false,
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getOfflineScans() {
  const db = await openScanDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('scans', 'readonly');
    const req = tx.objectStore('scans').getAll();
    req.onsuccess = () => resolve(req.result.filter(s => !s.synced));
    req.onerror = () => reject(req.error);
  });
}

async function markScanSynced(id) {
  const db = await openScanDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('scans', 'readwrite');
    const store = tx.objectStore('scans');
    const req = store.get(id);
    req.onsuccess = () => {
      const scan = req.result;
      if (scan) {
        scan.synced = true;
        store.put(scan);
      }
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function getOfflineQueueSize() {
  try {
    const scans = await getOfflineScans();
    return scans.length;
  } catch { return 0; }
}

async function handleOfflineScan(request) {
  try {
    const response = await fetch(request.clone());
    return response;
  } catch (error) {
    // Network failed — queue the scan locally
    try {
      const body = await request.clone().json();
      await queueOfflineScan({
        url: request.url,
        body: body,
        method: request.method,
      });

      // Notify clients about queued scan
      const clients = await self.clients.matchAll();
      clients.forEach(c => c.postMessage({ type: 'SCAN_QUEUED_OFFLINE', body }));

      return new Response(
        JSON.stringify({
          offline: true,
          queued: true,
          message: 'Scan enregistré hors-ligne. Synchronisation automatique au retour du réseau.',
          badge_id: body.badge_id || '',
          zone: body.zone || '',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'offline', message: 'Impossible de mettre en file le scan' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
}

async function syncOfflineScans() {
  console.log('[SW] Syncing offline scans...');
  try {
    const scans = await getOfflineScans();
    let synced = 0;
    let failed = 0;

    for (const scan of scans) {
      try {
        const response = await fetch(scan.url, {
          method: scan.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scan.body),
        });
        if (response.ok) {
          await markScanSynced(scan.id);
          synced++;
        } else { failed++; }
      } catch { failed++; }
    }

    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach(c => c.postMessage({
      type: 'OFFLINE_SYNC_COMPLETE',
      synced,
      failed,
      remaining: scans.length - synced,
    }));

    console.log(`[SW] Sync complete: ${synced} synced, ${failed} failed`);
  } catch (e) {
    console.error('[SW] Sync error:', e);
  }
}

console.log('[SW] Service Worker loaded - CC2026 PWA');
