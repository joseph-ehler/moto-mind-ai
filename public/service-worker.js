/**
 * MOTOMIND SERVICE WORKER
 * 
 * Features:
 * - Offline mode (cache-first for assets, network-first for API)
 * - Background sync (upload queued photos/events when online)
 * - Push notifications (maintenance reminders, alerts)
 * - Smart caching (different strategies for different content)
 * - Automatic cache cleanup
 * 
 * @version 1.0.0
 */

const CACHE_VERSION = 'motomind-v1'
const RUNTIME_CACHE = 'motomind-runtime-v1'
const IMAGE_CACHE = 'motomind-images-v1'
const API_CACHE = 'motomind-api-v1'

// Cache configurations
const CACHE_CONFIG = {
  // Static assets (long TTL)
  static: {
    name: CACHE_VERSION,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  // Runtime assets (medium TTL)
  runtime: {
    name: RUNTIME_CACHE,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 50
  },
  // Images (long TTL, limited entries)
  images: {
    name: IMAGE_CACHE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 200
  },
  // API responses (short TTL)
  api: {
    name: API_CACHE,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 100
  }
}

// Files to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// ============================================================================
// INSTALL EVENT - Pre-cache essential files
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Pre-caching essential files')
      return cache.addAll(PRECACHE_URLS)
    }).then(() => {
      console.log('[SW] Installation complete')
      return self.skipWaiting() // Activate immediately
    })
  )
})

// ============================================================================
// ACTIVATE EVENT - Clean up old caches
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (
            cacheName !== CACHE_VERSION &&
            cacheName !== RUNTIME_CACHE &&
            cacheName !== IMAGE_CACHE &&
            cacheName !== API_CACHE
          ) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Activation complete')
      return self.clients.claim() // Take control immediately
    })
  )
})

// ============================================================================
// FETCH EVENT - Smart caching strategies
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return
  }
  
  // Route to appropriate caching strategy
  event.respondWith(
    handleFetch(request, url)
  )
})

/**
 * Route requests to appropriate caching strategy
 */
async function handleFetch(request, url) {
  // 1. API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    return networkFirstStrategy(request, API_CACHE)
  }
  
  // 2. Images - Cache first, network fallback
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)
  ) {
    return cacheFirstStrategy(request, IMAGE_CACHE)
  }
  
  // 3. Static assets - Cache first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(js|css|woff2?|ttf|otf)$/)
  ) {
    return cacheFirstStrategy(request, CACHE_VERSION)
  }
  
  // 4. HTML pages - Network first, cache fallback
  if (
    request.destination === 'document' ||
    request.headers.get('accept')?.includes('text/html')
  ) {
    return networkFirstStrategy(request, RUNTIME_CACHE)
  }
  
  // 5. Everything else - Network first
  return networkFirstStrategy(request, RUNTIME_CACHE)
}

/**
 * Cache First Strategy
 * Try cache first, fall back to network
 * Good for: Static assets, images
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      // Check if cache is still fresh
      const cachedTime = cachedResponse.headers.get('sw-cache-time')
      if (cachedTime) {
        const age = Date.now() - parseInt(cachedTime)
        const config = Object.values(CACHE_CONFIG).find(c => c.name === cacheName)
        
        if (config && age > config.maxAge) {
          // Cache expired, fetch fresh
          console.log('[SW] Cache expired for:', request.url)
        } else {
          return cachedResponse
        }
      } else {
        return cachedResponse
      }
    }
    
    // Cache miss or expired - fetch from network
    const networkResponse = await fetch(request)
    
    // Cache the response for next time
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone()
      const cache = await caches.open(cacheName)
      
      // Add cache timestamp
      const headers = new Headers(responseToCache.headers)
      headers.set('sw-cache-time', Date.now().toString())
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      })
      
      cache.put(request, modifiedResponse)
      
      // Cleanup old entries
      cleanupCache(cache, cacheName)
    }
    
    return networkResponse
  } catch (error) {
    console.error('[SW] Cache-first strategy failed:', error)
    
    // Return offline page for documents
    if (request.destination === 'document') {
      const cache = await caches.open(CACHE_VERSION)
      return cache.match('/offline') || new Response('Offline', { status: 503 })
    }
    
    // Return cached response even if expired
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

/**
 * Network First Strategy
 * Try network first, fall back to cache
 * Good for: API requests, HTML pages
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      const responseToCache = networkResponse.clone()
      
      // Add cache timestamp
      const headers = new Headers(responseToCache.headers)
      headers.set('sw-cache-time', Date.now().toString())
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      })
      
      cache.put(request, modifiedResponse)
      
      // Cleanup old entries
      cleanupCache(cache, cacheName)
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    
    // Network failed - try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for documents
    if (request.destination === 'document') {
      const cache = await caches.open(CACHE_VERSION)
      return cache.match('/offline') || new Response('Offline', { status: 503 })
    }
    
    throw error
  }
}

/**
 * Cleanup old cache entries to stay within limits
 */
async function cleanupCache(cache, cacheName) {
  const config = Object.values(CACHE_CONFIG).find(c => c.name === cacheName)
  if (!config || !config.maxEntries) return
  
  const keys = await cache.keys()
  if (keys.length > config.maxEntries) {
    // Delete oldest entries
    const entriesToDelete = keys.length - config.maxEntries
    for (let i = 0; i < entriesToDelete; i++) {
      await cache.delete(keys[i])
    }
    console.log(`[SW] Cleaned up ${entriesToDelete} old entries from ${cacheName}`)
  }
}

// ============================================================================
// BACKGROUND SYNC - Upload queued data when online
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'upload-photos') {
    event.waitUntil(uploadQueuedPhotos())
  }
  
  if (event.tag === 'upload-events') {
    event.waitUntil(uploadQueuedEvents())
  }
  
  if (event.tag === 'sync-all') {
    event.waitUntil(
      Promise.all([
        uploadQueuedPhotos(),
        uploadQueuedEvents()
      ])
    )
  }
})

/**
 * Upload queued photos from IndexedDB
 */
async function uploadQueuedPhotos() {
  try {
    console.log('[SW] Uploading queued photos...')
    
    // Get queued photos from IndexedDB
    const db = await openDB()
    const tx = db.transaction('photoQueue', 'readonly')
    const store = tx.objectStore('photoQueue')
    const photos = await store.getAll()
    
    if (photos.length === 0) {
      console.log('[SW] No queued photos to upload')
      return
    }
    
    console.log(`[SW] Found ${photos.length} queued photos`)
    
    // Upload each photo
    for (const photo of photos) {
      try {
        const formData = new FormData()
        formData.append('photo', photo.blob, photo.filename)
        formData.append('metadata', JSON.stringify(photo.metadata))
        
        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          // Remove from queue
          const deleteTx = db.transaction('photoQueue', 'readwrite')
          const deleteStore = deleteTx.objectStore('photoQueue')
          await deleteStore.delete(photo.id)
          
          console.log('[SW] Uploaded photo:', photo.id)
          
          // Notify client
          notifyClients({
            type: 'photo-uploaded',
            photoId: photo.id,
            response: await response.json()
          })
        } else {
          console.error('[SW] Failed to upload photo:', photo.id, response.status)
        }
      } catch (error) {
        console.error('[SW] Error uploading photo:', photo.id, error)
      }
    }
    
    console.log('[SW] Photo upload complete')
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
    throw error // Re-throw to retry later
  }
}

/**
 * Upload queued events from IndexedDB
 */
async function uploadQueuedEvents() {
  try {
    console.log('[SW] Uploading queued events...')
    
    const db = await openDB()
    const tx = db.transaction('eventQueue', 'readonly')
    const store = tx.objectStore('eventQueue')
    const events = await store.getAll()
    
    if (events.length === 0) {
      console.log('[SW] No queued events to upload')
      return
    }
    
    console.log(`[SW] Found ${events.length} queued events`)
    
    // Upload each event
    for (const event of events) {
      try {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event.data)
        })
        
        if (response.ok) {
          // Remove from queue
          const deleteTx = db.transaction('eventQueue', 'readwrite')
          const deleteStore = deleteTx.objectStore('eventQueue')
          await deleteStore.delete(event.id)
          
          console.log('[SW] Uploaded event:', event.id)
          
          // Notify client
          notifyClients({
            type: 'event-uploaded',
            eventId: event.id,
            response: await response.json()
          })
        } else {
          console.error('[SW] Failed to upload event:', event.id, response.status)
        }
      } catch (error) {
        console.error('[SW] Error uploading event:', event.id, error)
      }
    }
    
    console.log('[SW] Event upload complete')
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
    throw error
  }
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  const data = event.data ? event.data.json() : {}
  
  const title = data.title || 'MotoMind'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    data: data.data || {},
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)
  
  event.notification.close()
  
  // Handle different actions
  if (event.action === 'dismiss') {
    return
  }
  
  // Open the app
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      
      // No window open - open new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// ============================================================================
// MESSAGE HANDLING - Communication with clients
// ============================================================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls)
      })
    )
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      })
    )
  }
  
  if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size })
      })
    )
  }
})

/**
 * Notify all clients with a message
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true })
  clients.forEach((client) => {
    client.postMessage(message)
  })
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Open IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('motomind-offline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create object stores
      if (!db.objectStoreNames.contains('photoQueue')) {
        db.createObjectStore('photoQueue', { keyPath: 'id', autoIncrement: true })
      }
      
      if (!db.objectStoreNames.contains('eventQueue')) {
        db.createObjectStore('eventQueue', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

/**
 * Get total cache size
 */
async function getCacheSize() {
  let total = 0
  
  const cacheNames = await caches.keys()
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    
    for (const request of keys) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        total += blob.size
      }
    }
  }
  
  return total
}

// ============================================================================
// PERIODIC BACKGROUND SYNC (Future)
// ============================================================================

self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag)
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncAllData())
  }
})

async function syncAllData() {
  console.log('[SW] Syncing all data...')
  
  await Promise.all([
    uploadQueuedPhotos(),
    uploadQueuedEvents()
  ])
  
  console.log('[SW] Sync complete')
}

console.log('[SW] Service worker loaded')
