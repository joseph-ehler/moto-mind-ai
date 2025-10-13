# 📱 MotoMind PWA Setup

**Status:** ✅ Implemented (Phase 1B)  
**Purpose:** Offline mode, background sync, push notifications, app-like experience

---

## 📖 **TABLE OF CONTENTS**

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Service Worker](#service-worker)
4. [Offline Queue](#offline-queue)
5. [Smart Cache](#smart-cache)
6. [Installation](#installation)
7. [Usage](#usage)
8. [Push Notifications](#push-notifications)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 **OVERVIEW**

The PWA (Progressive Web App) infrastructure enables:
- ✅ **Offline mode** - Capture at gas stations with no signal
- ✅ **Background sync** - Upload when back online
- ✅ **Push notifications** - Maintenance reminders, alerts
- ✅ **Install to home screen** - App-like experience
- ✅ **Instant loading** - Cached assets
- ✅ **Smart caching** - Different strategies for different content

---

## 🏗️ **ARCHITECTURE**

```
public/
├── manifest.json              # PWA manifest
├── service-worker.js          # Service worker (600+ lines)
└── icons/                     # App icons (8 sizes)

lib/
├── memory/
│   ├── offline-queue.ts      # IndexedDB queue manager
│   └── smart-cache.ts        # Cache strategies
└── pwa/
    └── register-sw.ts        # Service worker registration

components/
└── PWAInstallPrompt.tsx      # Install prompts + indicators
```

---

## ⚙️ **SERVICE WORKER**

**File:** `public/service-worker.js`

### **Features:**

#### **1. Smart Caching Strategies**

**Cache-First** (Static assets, images)
```javascript
// Try cache first, fall back to network
// Good for: CSS, JS, fonts, images
```

**Network-First** (API, HTML pages)
```javascript
// Try network first, fall back to cache
// Good for: API responses, dynamic pages
```

#### **2. Multiple Cache Stores**

```javascript
const CACHES = {
  static: 'motomind-v1',          // 30 days, 100 entries
  runtime: 'motomind-runtime-v1', // 24 hours, 50 entries
  images: 'motomind-images-v1',   // 7 days, 200 entries
  api: 'motomind-api-v1'          // 5 minutes, 100 entries
}
```

#### **3. Background Sync**

Automatically uploads queued data when back online:
```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-photos') {
    event.waitUntil(uploadQueuedPhotos())
  }
})
```

#### **4. Push Notifications**

Handles push notifications:
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json()
  self.registration.showNotification(data.title, data.options)
})
```

#### **5. Automatic Cache Cleanup**

Removes old entries when limits exceeded:
```javascript
async function cleanupCache(cache, maxEntries) {
  const keys = await cache.keys()
  if (keys.length > maxEntries) {
    // Delete oldest entries
  }
}
```

---

## 🗄️ **OFFLINE QUEUE**

**File:** `lib/memory/offline-queue.ts`

### **IndexedDB Stores:**

```
motomind-offline database
├── photoQueue        # Queued photos
└── eventQueue        # Queued events
```

### **Usage:**

```typescript
import { offlineQueue } from '@/lib/memory/offline-queue'

// Queue a photo
await offlineQueue.queuePhoto({
  blob: photoBlob,
  filename: 'receipt.jpg',
  metadata: {
    vehicleId: 'abc123',
    eventType: 'fuel',
    capturedAt: new Date().toISOString()
  }
})

// Queue an event
await offlineQueue.queueEvent({
  data: {
    vehicleId: 'abc123',
    type: 'fuel',
    date: new Date().toISOString(),
    totalAmount: 50.00
  }
})

// Trigger sync
await offlineQueue.triggerSync()

// Get queue stats
const stats = await offlineQueue.getStats()
// { photos: 3, events: 1, totalSize: 2048000 }
```

### **React Hook:**

```tsx
import { useOfflineQueue } from '@/lib/memory/offline-queue'

function CapturePage() {
  const { photos, events, isOnline, queuePhoto, triggerSync } = useOfflineQueue()
  
  return (
    <div>
      {!isOnline && <p>Offline - {photos} photos queued</p>}
      <button onClick={() => queuePhoto(...)}>Capture</button>
    </div>
  )
}
```

---

## 💾 **SMART CACHE**

**File:** `lib/memory/smart-cache.ts`

### **Cache Configurations:**

```typescript
const CACHE_CONFIGS = {
  static: {
    maxAge: 30 days,
    maxEntries: 100,
    strategy: 'cache-first'
  },
  runtime: {
    maxAge: 24 hours,
    maxEntries: 50,
    strategy: 'network-first'
  },
  images: {
    maxAge: 7 days,
    maxEntries: 200,
    strategy: 'cache-first'
  },
  api: {
    maxAge: 5 minutes,
    maxEntries: 100,
    strategy: 'network-first'
  }
}
```

### **Usage:**

```typescript
import { smartCache } from '@/lib/memory/smart-cache'

// Cache a URL
await smartCache.cache('/api/vehicles', 'api')

// Cache multiple URLs
await smartCache.cacheMultiple([
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
], 'images')

// Get cache size
const size = await smartCache.getTotalCacheSize()
// 15728640 (bytes)

// Cleanup old entries
const { cleaned, freed } = await smartCache.cleanup()
// { cleaned: 25, freed: 5242880 }

// Warm cache
await smartCache.warmCache([
  '/api/vehicles',
  '/api/events',
  '/icons/icon-192x192.png'
])
```

### **React Hook:**

```tsx
import { useSmartCache, formatBytes } from '@/lib/memory/smart-cache'

function SettingsPage() {
  const { stats, isLow, cleanup, clearAll } = useSmartCache()
  
  return (
    <div>
      <p>Cache size: {formatBytes(stats.totalSize)}</p>
      {isLow && <p>⚠️ Storage running low</p>}
      <button onClick={cleanup}>Cleanup</button>
      <button onClick={clearAll}>Clear All</button>
    </div>
  )
}
```

---

## 📲 **INSTALLATION**

### **Step 1: Add to App Entry Point**

**For Next.js App Router** (`app/layout.tsx`):
```tsx
import { registerServiceWorker } from '@/lib/pwa/register-sw'
import { PWAInstallPrompt, OfflineIndicator } from '@/components/PWAInstallPrompt'

export default function RootLayout({ children }) {
  useEffect(() => {
    registerServiceWorker()
  }, [])
  
  return (
    <html>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MotoMind" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <OfflineIndicator />
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
```

**For Next.js Pages Router** (`pages/_app.tsx`):
```tsx
import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/pwa/register-sw'
import { PWAInstallPrompt, OfflineIndicator } from '@/components/PWAInstallPrompt'

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    registerServiceWorker()
  }, [])
  
  return (
    <>
      <OfflineIndicator />
      <Component {...pageProps} />
      <PWAInstallPrompt />
    </>
  )
}
```

### **Step 2: Update Next.js Config**

**File:** `next.config.js`
```javascript
module.exports = {
  // Disable static optimization for service worker
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  
  // Headers for service worker
  async headers() {
    return [
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      }
    ]
  }
}
```

### **Step 3: Generate Icons**

Create 8 icon sizes in `public/icons/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

**Tool:** Use https://realfavicongenerator.net or:
```bash
# Using ImageMagick
convert icon.png -resize 72x72 public/icons/icon-72x72.png
convert icon.png -resize 96x96 public/icons/icon-96x96.png
# ... etc
```

---

## 💻 **USAGE**

### **1. Offline Capture**

```tsx
import { useOfflineQueue } from '@/lib/memory/offline-queue'

function CapturePage() {
  const { isOnline, queuePhoto } = useOfflineQueue()
  
  const handleCapture = async (photo: Blob) => {
    if (!isOnline) {
      // Queue for later
      await queuePhoto({
        blob: photo,
        filename: 'capture.jpg',
        metadata: {
          vehicleId,
          eventType: 'fuel',
          capturedAt: new Date().toISOString()
        }
      })
      
      toast.success('Photo queued - will upload when online')
    } else {
      // Upload immediately
      await uploadPhoto(photo)
    }
  }
  
  return <Camera onCapture={handleCapture} />
}
```

### **2. Show Queue Status**

```tsx
import { useOfflineQueue } from '@/lib/memory/offline-queue'

function QueueStatus() {
  const { photos, events, isOnline, triggerSync } = useOfflineQueue()
  
  const totalQueued = photos + events
  
  if (totalQueued === 0) return null
  
  return (
    <Card>
      <Flex align="center" justify="between">
        <Text>
          {totalQueued} item{totalQueued > 1 ? 's' : ''} queued
        </Text>
        {isOnline && (
          <Button onClick={() => triggerSync()}>
            Sync Now
          </Button>
        )}
      </Flex>
    </Card>
  )
}
```

### **3. Cache Management**

```tsx
import { useSmartCache, formatBytes } from '@/lib/memory/smart-cache'

function CacheSettings() {
  const { stats, cleanup, clearAll } = useSmartCache()
  
  return (
    <Card>
      <Stack spacing="md">
        <Heading level="subsection">Cache</Heading>
        
        <Text>
          Total size: {formatBytes(stats.totalSize)}
        </Text>
        
        <Text>
          Entries: {stats.totalEntries}
        </Text>
        
        {stats.storage && (
          <Text>
            Storage: {(stats.storage.percentage).toFixed(1)}% used
          </Text>
        )}
        
        <Flex gap="sm">
          <Button onClick={cleanup}>
            Cleanup Old
          </Button>
          <Button variant="danger" onClick={clearAll}>
            Clear All
          </Button>
        </Flex>
      </Stack>
    </Card>
  )
}
```

---

## 🔔 **PUSH NOTIFICATIONS**

### **Step 1: Request Permission**

```typescript
import { requestNotificationPermission } from '@/lib/pwa/register-sw'

const permission = await requestNotificationPermission()

if (permission === 'granted') {
  console.log('Notifications enabled')
}
```

### **Step 2: Subscribe to Push**

```typescript
import { subscribeToPushNotifications } from '@/lib/pwa/register-sw'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

const subscription = await subscribeToPushNotifications(vapidPublicKey)
```

### **Step 3: Send Push from Server**

```typescript
// pages/api/push/send.ts
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:support@motomind.app',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export default async function handler(req, res) {
  const { subscription, notification } = req.body
  
  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: 'Oil Change Due',
      body: 'Your oil change is due in 200 miles',
      icon: '/icons/icon-192x192.png',
      data: {
        url: '/maintenance'
      }
    })
  )
  
  res.json({ success: true })
}
```

---

## 🧪 **TESTING**

### **1. Test Offline Mode**

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Select "Offline" from dropdown
4. Try capturing a photo
5. Check Application > IndexedDB > photoQueue

**Real Device:**
1. Enable Airplane mode
2. Open app
3. Capture photo
4. Disable Airplane mode
5. Watch it sync

### **2. Test Service Worker**

**Chrome DevTools:**
1. Application > Service Workers
2. Check status (activated and running)
3. Click "Update" to test updates
4. Click "Unregister" to remove

### **3. Test Caching**

**Chrome DevTools:**
1. Application > Cache Storage
2. Expand "motomind-v1", "motomind-images-v1", etc.
3. Verify cached resources
4. Delete cache to test re-caching

### **4. Test Push Notifications**

**Chrome DevTools:**
1. Application > Service Workers
2. Enter push data in "Push" section
3. Click "Push" button
4. Notification should appear

---

## 🐛 **TROUBLESHOOTING**

### **Service Worker Not Registering**

**Problem:** Service worker fails to register

**Solutions:**
```javascript
// Check if HTTPS (required for SW)
console.log('Protocol:', window.location.protocol)
// Should be 'https:' or 'http:' (localhost only)

// Check browser support
console.log('SW supported:', 'serviceWorker' in navigator)

// Check registration errors
navigator.serviceWorker.register('/service-worker.js')
  .then(reg => console.log('Registered:', reg))
  .catch(err => console.error('Failed:', err))
```

### **Offline Queue Not Working**

**Problem:** Photos/events not queueing

**Solutions:**
```javascript
// Check IndexedDB support
console.log('IndexedDB supported:', 'indexedDB' in window)

// Check DB creation
const db = await offlineQueue.init()
console.log('DB initialized:', !!db)

// Check queue
const stats = await offlineQueue.getStats()
console.log('Queue stats:', stats)
```

### **Cache Not Working**

**Problem:** Resources not caching

**Solutions:**
```javascript
// Check cache API support
console.log('Cache supported:', 'caches' in window)

// List all caches
const cacheNames = await caches.keys()
console.log('Caches:', cacheNames)

// Check specific cache
const cache = await caches.open('motomind-v1')
const keys = await cache.keys()
console.log('Cached URLs:', keys.map(k => k.url))
```

### **Push Notifications Not Working**

**Problem:** Notifications not appearing

**Solutions:**
```javascript
// Check notification permission
console.log('Permission:', Notification.permission)

// Request permission
const permission = await Notification.requestPermission()
console.log('New permission:', permission)

// Check push subscription
const reg = await navigator.serviceWorker.ready
const sub = await reg.pushManager.getSubscription()
console.log('Subscription:', sub)
```

### **iOS Install Not Working**

**Problem:** "Add to Home Screen" not available

**Solutions:**
- Must use Safari (not Chrome/Firefox on iOS)
- Check manifest.json is accessible
- Verify icons are correct sizes
- Ensure HTTPS (or localhost)

---

## 📝 **CHECKLIST**

### **Development:**
- [ ] Service worker registered
- [ ] Manifest.json accessible
- [ ] Icons generated (8 sizes)
- [ ] Offline queue tested
- [ ] Cache strategies verified
- [ ] Install prompt appears

### **Production:**
- [ ] HTTPS enabled
- [ ] Service worker caching correctly
- [ ] Background sync working
- [ ] Push notifications configured
- [ ] Icons optimized
- [ ] Offline page created
- [ ] Cache cleanup scheduled

---

## 🎯 **BENEFITS**

### **For Users:**
- ✅ Capture at gas stations with no signal
- ✅ Faster loading (cached assets)
- ✅ App-like experience
- ✅ Push notifications
- ✅ Home screen icon

### **For Business:**
- ✅ Higher engagement (60%+ increase)
- ✅ Reduced bounce rate
- ✅ Better user retention
- ✅ Competitive advantage
- ✅ Cross-platform (one codebase)

---

## 📚 **RESOURCES**

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

**Status:** ✅ PWA Infrastructure Complete  
**Next:** Testing Infrastructure (Phase 1B.3)
