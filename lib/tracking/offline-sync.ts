/**
 * Offline Sync Service
 * 
 * Handles buffering location points in IndexedDB when offline
 * and syncing them to the server when back online
 */

import type { LocationPoint, SyncStatus } from './types'

const DB_NAME = 'motomind-tracking'
const DB_VERSION = 1
const STORE_NAME = 'location-points'

export class OfflineSync {
  private db: IDBDatabase | null = null
  private syncInProgress = false

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          })

          // Create indexes
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('synced', 'synced', { unique: false })
          store.createIndex('sessionId', 'sessionId', { unique: false })
        }
      }
    })
  }

  /**
   * Store location point locally
   */
  async storePoint(
    point: LocationPoint,
    sessionId: string
  ): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const data = {
        ...point,
        sessionId,
        synced: false,
        retries: 0,
        createdAt: Date.now()
      }

      const request = store.add(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Store multiple points in batch
   */
  async storeBatch(
    points: LocationPoint[],
    sessionId: string
  ): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    const promises = points.map(point => this.storePoint(point, sessionId))
    await Promise.all(promises)
  }

  /**
   * Get unsynced points
   */
  async getUnsyncedPoints(): Promise<(LocationPoint & { id: number; sessionId: string })[]> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('synced')
      const request = index.getAll(false)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Mark point as synced
   */
  async markAsSynced(id: number): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => {
        const data = request.result
        if (data) {
          data.synced = true
          data.syncedAt = Date.now()
          const updateRequest = store.put(data)

          updateRequest.onsuccess = () => resolve()
          updateRequest.onerror = () => reject(updateRequest.error)
        } else {
          resolve()
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete synced points older than X days
   */
  async cleanupOldPoints(daysToKeep: number = 7): Promise<number> {
    if (!this.db) {
      await this.init()
    }

    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('timestamp')
      const request = index.openCursor()

      let deleted = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const data = cursor.value
          if (data.synced && data.timestamp < cutoffTime) {
            cursor.delete()
            deleted++
          }
          cursor.continue()
        } else {
          resolve(deleted)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Sync unsynced points to server
   */
  async syncToServer(): Promise<SyncStatus> {
    if (this.syncInProgress) {
      return {
        pending: 0,
        synced: 0,
        failed: 0,
        lastSyncTime: null
      }
    }

    this.syncInProgress = true

    try {
      const unsyncedPoints = await this.getUnsyncedPoints()

      if (unsyncedPoints.length === 0) {
        return {
          pending: 0,
          synced: 0,
          failed: 0,
          lastSyncTime: Date.now()
        }
      }

      // Group by session
      const pointsBySession = new Map<string, typeof unsyncedPoints>()
      for (const point of unsyncedPoints) {
        if (!pointsBySession.has(point.sessionId)) {
          pointsBySession.set(point.sessionId, [])
        }
        pointsBySession.get(point.sessionId)!.push(point)
      }

      let synced = 0
      let failed = 0

      // Sync each session
      for (const [sessionId, points] of pointsBySession) {
        try {
          const response = await fetch('/api/tracking/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              points: points.map(p => ({
                lat: p.lat,
                lng: p.lng,
                speed: p.speed,
                heading: p.heading,
                altitude: p.altitude,
                accuracy: p.accuracy,
                timestamp: p.timestamp
              }))
            })
          })

          if (response.ok) {
            // Mark all as synced
            await Promise.all(points.map(p => this.markAsSynced(p.id)))
            synced += points.length
          } else {
            failed += points.length
          }
        } catch (error) {
          console.error('[OfflineSync] Failed to sync session:', sessionId, error)
          failed += points.length
        }
      }

      const remaining = await this.getUnsyncedPoints()

      return {
        pending: remaining.length,
        synced,
        failed,
        lastSyncTime: Date.now()
      }
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Get sync status
   */
  async getStatus(): Promise<SyncStatus> {
    const unsyncedPoints = await this.getUnsyncedPoints()

    return {
      pending: unsyncedPoints.length,
      synced: 0,
      failed: 0,
      lastSyncTime: null
    }
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// Singleton instance
let offlineSyncInstance: OfflineSync | null = null

export function getOfflineSync(): OfflineSync {
  if (!offlineSyncInstance) {
    offlineSyncInstance = new OfflineSync()
  }
  return offlineSyncInstance
}
