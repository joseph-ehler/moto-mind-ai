/**
 * OFFLINE QUEUE MANAGER
 * 
 * Manages queued photos and events when offline using IndexedDB.
 * Automatically syncs when back online.
 * 
 * Features:
 * - Queue photos for upload
 * - Queue events for creation
 * - Automatic background sync
 * - Manual sync trigger
 * - Queue size monitoring
 * - Error handling & retry logic
 */

const DB_NAME = 'motomind-offline'
const DB_VERSION = 1

export interface QueuedPhoto {
  id?: number
  blob: Blob
  filename: string
  metadata: {
    vehicleId: string
    eventType: string
    capturedAt: string
    gpsLatitude?: number
    gpsLongitude?: number
    qualityScore?: number
  }
  queuedAt: number
  retryCount: number
  lastError?: string
}

export interface QueuedEvent {
  id?: number
  data: {
    vehicleId: string
    type: string
    date: string
    miles?: number
    totalAmount?: number
    vendor?: string
    [key: string]: any
  }
  queuedAt: number
  retryCount: number
  lastError?: string
}

export class OfflineQueue {
  private db: IDBDatabase | null = null

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create photo queue store
        if (!db.objectStoreNames.contains('photoQueue')) {
          const photoStore = db.createObjectStore('photoQueue', {
            keyPath: 'id',
            autoIncrement: true
          })
          photoStore.createIndex('queuedAt', 'queuedAt', { unique: false })
          photoStore.createIndex('retryCount', 'retryCount', { unique: false })
        }

        // Create event queue store
        if (!db.objectStoreNames.contains('eventQueue')) {
          const eventStore = db.createObjectStore('eventQueue', {
            keyPath: 'id',
            autoIncrement: true
          })
          eventStore.createIndex('queuedAt', 'queuedAt', { unique: false })
          eventStore.createIndex('retryCount', 'retryCount', { unique: false })
        }
      }
    })
  }

  // ==========================================================================
  // PHOTO QUEUE
  // ==========================================================================

  /**
   * Add photo to queue
   */
  async queuePhoto(photo: Omit<QueuedPhoto, 'id' | 'queuedAt' | 'retryCount'>): Promise<number> {
    await this.init()

    const queuedPhoto: Omit<QueuedPhoto, 'id'> = {
      ...photo,
      queuedAt: Date.now(),
      retryCount: 0
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('photoQueue', 'readwrite')
      const store = tx.objectStore('photoQueue')
      const request = store.add(queuedPhoto)

      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all queued photos
   */
  async getQueuedPhotos(): Promise<QueuedPhoto[]> {
    await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('photoQueue', 'readonly')
      const store = tx.objectStore('photoQueue')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get photo queue size
   */
  async getPhotoQueueSize(): Promise<number> {
    await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('photoQueue', 'readonly')
      const store = tx.objectStore('photoQueue')
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Remove photo from queue
   */
  async removePhoto(id: number): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('photoQueue', 'readwrite')
      const store = tx.objectStore('photoQueue')
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Update photo retry count
   */
  async updatePhotoRetry(id: number, error: string): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('photoQueue', 'readwrite')
      const store = tx.objectStore('photoQueue')
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const photo = getRequest.result
        if (photo) {
          photo.retryCount++
          photo.lastError = error

          const putRequest = store.put(photo)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // ==========================================================================
  // EVENT QUEUE
  // ==========================================================================

  /**
   * Add event to queue
   */
  async queueEvent(event: Omit<QueuedEvent, 'id' | 'queuedAt' | 'retryCount'>): Promise<number> {
    await this.init()

    const queuedEvent: Omit<QueuedEvent, 'id'> = {
      ...event,
      queuedAt: Date.now(),
      retryCount: 0
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('eventQueue', 'readwrite')
      const store = tx.objectStore('eventQueue')
      const request = store.add(queuedEvent)

      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all queued events
   */
  async getQueuedEvents(): Promise<QueuedEvent[]> {
    await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('eventQueue', 'readonly')
      const store = tx.objectStore('eventQueue')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get event queue size
   */
  async getEventQueueSize(): Promise<number> {
    await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('eventQueue', 'readonly')
      const store = tx.objectStore('eventQueue')
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Remove event from queue
   */
  async removeEvent(id: number): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('eventQueue', 'readwrite')
      const store = tx.objectStore('eventQueue')
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Update event retry count
   */
  async updateEventRetry(id: number, error: string): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('eventQueue', 'readwrite')
      const store = tx.objectStore('eventQueue')
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const event = getRequest.result
        if (event) {
          event.retryCount++
          event.lastError = error

          const putRequest = store.put(event)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // ==========================================================================
  // SYNC OPERATIONS
  // ==========================================================================

  /**
   * Trigger background sync
   */
  async triggerSync(tag: 'upload-photos' | 'upload-events' | 'sync-all' = 'sync-all'): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register(tag)
      console.log('[OfflineQueue] Background sync registered:', tag)
    } else {
      console.warn('[OfflineQueue] Background sync not supported, falling back to immediate sync')
      await this.syncNow()
    }
  }

  /**
   * Sync immediately (no background sync)
   */
  async syncNow(): Promise<{ photos: number; events: number; errors: string[] }> {
    const results = {
      photos: 0,
      events: 0,
      errors: [] as string[]
    }

    // Sync photos
    const photos = await this.getQueuedPhotos()
    for (const photo of photos) {
      try {
        await this.uploadPhoto(photo)
        await this.removePhoto(photo.id!)
        results.photos++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Photo ${photo.id}: ${errorMsg}`)
        await this.updatePhotoRetry(photo.id!, errorMsg)
      }
    }

    // Sync events
    const events = await this.getQueuedEvents()
    for (const event of events) {
      try {
        await this.uploadEvent(event)
        await this.removeEvent(event.id!)
        results.events++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Event ${event.id}: ${errorMsg}`)
        await this.updateEventRetry(event.id!, errorMsg)
      }
    }

    return results
  }

  /**
   * Upload a photo
   */
  private async uploadPhoto(photo: QueuedPhoto): Promise<void> {
    const formData = new FormData()
    formData.append('photo', photo.blob, photo.filename)
    formData.append('metadata', JSON.stringify(photo.metadata))

    const response = await fetch('/api/photos/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }
  }

  /**
   * Upload an event
   */
  private async uploadEvent(event: QueuedEvent): Promise<void> {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event.data)
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }
  }

  // ==========================================================================
  // QUEUE MANAGEMENT
  // ==========================================================================

  /**
   * Clear all queues
   */
  async clearAll(): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['photoQueue', 'eventQueue'], 'readwrite')

      tx.objectStore('photoQueue').clear()
      tx.objectStore('eventQueue').clear()

      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    photos: number
    events: number
    totalSize: number
    oldestPhoto?: number
    oldestEvent?: number
  }> {
    await this.init()

    const [photos, events] = await Promise.all([
      this.getQueuedPhotos(),
      this.getQueuedEvents()
    ])

    // Calculate total size (approximate)
    const totalSize = photos.reduce((sum, photo) => sum + photo.blob.size, 0)

    // Find oldest items
    const oldestPhoto = photos.length > 0
      ? Math.min(...photos.map(p => p.queuedAt))
      : undefined

    const oldestEvent = events.length > 0
      ? Math.min(...events.map(e => e.queuedAt))
      : undefined

    return {
      photos: photos.length,
      events: events.length,
      totalSize,
      oldestPhoto,
      oldestEvent
    }
  }

  /**
   * Remove old failed items (retry count > 5)
   */
  async cleanupFailed(): Promise<{ removed: number }> {
    await this.init()

    const MAX_RETRIES = 5
    let removed = 0

    // Cleanup photos
    const photos = await this.getQueuedPhotos()
    for (const photo of photos) {
      if (photo.retryCount >= MAX_RETRIES) {
        await this.removePhoto(photo.id!)
        removed++
      }
    }

    // Cleanup events
    const events = await this.getQueuedEvents()
    for (const event of events) {
      if (event.retryCount >= MAX_RETRIES) {
        await this.removeEvent(event.id!)
        removed++
      }
    }

    return { removed }
  }
}

// ==========================================================================
// SINGLETON INSTANCE
// ==========================================================================

export const offlineQueue = new OfflineQueue()

// ==========================================================================
// REACT HOOKS
// ==========================================================================

/**
 * React hook for offline queue
 */
export function useOfflineQueue() {
  const [stats, setStats] = React.useState({
    photos: 0,
    events: 0,
    totalSize: 0,
    isOnline: navigator.onLine
  })

  // Update stats
  const updateStats = React.useCallback(async () => {
    const queueStats = await offlineQueue.getStats()
    setStats(prev => ({
      ...queueStats,
      isOnline: prev.isOnline
    }))
  }, [])

  // Listen for online/offline events
  React.useEffect(() => {
    const handleOnline = async () => {
      setStats(prev => ({ ...prev, isOnline: true }))
      
      // Trigger sync
      await offlineQueue.triggerSync()
      await updateStats()
    }

    const handleOffline = () => {
      setStats(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial stats
    updateStats()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [updateStats])

  // Listen for service worker messages
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'photo-uploaded' || event.data.type === 'event-uploaded') {
        updateStats()
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [updateStats])

  return {
    ...stats,
    queuePhoto: offlineQueue.queuePhoto.bind(offlineQueue),
    queueEvent: offlineQueue.queueEvent.bind(offlineQueue),
    triggerSync: offlineQueue.triggerSync.bind(offlineQueue),
    syncNow: offlineQueue.syncNow.bind(offlineQueue),
    updateStats
  }
}

// Fix React import for hooks
import React from 'react'
