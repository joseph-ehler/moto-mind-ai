/**
 * Version Gate & Cross-Tab Safety
 * 
 * Handles localStorage schema versioning and cross-tab synchronization.
 */

'use client'

export type StorageVersion = {
  version: string
  data: Record<string, any>
  updatedAt: string
}

export type VersionGateResult = 
  | { status: 'valid'; data: Record<string, any> }
  | { status: 'outdated'; currentVersion: string; savedVersion: string }
  | { status: 'empty' }
  | { status: 'locked'; lockedBy: string }

/**
 * Check if stored data matches current version
 */
export function checkVersion(
  storageKey: string,
  currentVersion: string
): VersionGateResult {
  if (typeof window === 'undefined') {
    return { status: 'empty' }
  }

  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) {
      return { status: 'empty' }
    }

    const stored: StorageVersion = JSON.parse(raw)
    
    if (stored.version !== currentVersion) {
      return {
        status: 'outdated',
        currentVersion,
        savedVersion: stored.version
      }
    }

    return {
      status: 'valid',
      data: stored.data
    }
  } catch (error) {
    console.error('Version check failed:', error)
    return { status: 'empty' }
  }
}

/**
 * Save data with version
 */
export function saveWithVersion(
  storageKey: string,
  version: string,
  data: Record<string, any>
): void {
  if (typeof window === 'undefined') return

  try {
    const payload: StorageVersion = {
      version,
      data,
      updatedAt: new Date().toISOString()
    }
    
    localStorage.setItem(storageKey, JSON.stringify(payload))
  } catch (error) {
    console.error('Save with version failed:', error)
  }
}

/**
 * Clear storage (for version migration or reset)
 */
export function clearStorage(storageKey: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(storageKey)
}

/**
 * Cross-tab lock management
 */
export class TabLock {
  private lockKey: string
  private tabId: string
  private heartbeatInterval: NodeJS.Timeout | null = null
  private readonly HEARTBEAT_MS = 2000
  private readonly LOCK_TIMEOUT_MS = 5000

  constructor(baseKey: string) {
    this.lockKey = `${baseKey}:lock`
    this.tabId = this.generateTabId()
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Try to acquire lock
   */
  acquire(): boolean {
    if (typeof window === 'undefined') return true

    try {
      const existing = localStorage.getItem(this.lockKey)
      
      if (existing) {
        const lock = JSON.parse(existing)
        const age = Date.now() - lock.timestamp
        
        // If lock is stale, take over
        if (age > this.LOCK_TIMEOUT_MS) {
          this.setLock()
          this.startHeartbeat()
          return true
        }
        
        // Lock is held by another tab
        return false
      }
      
      // No existing lock
      this.setLock()
      this.startHeartbeat()
      return true
    } catch (error) {
      console.error('Lock acquisition failed:', error)
      return false
    }
  }

  private setLock(): void {
    const lock = {
      tabId: this.tabId,
      timestamp: Date.now()
    }
    localStorage.setItem(this.lockKey, JSON.stringify(lock))
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.setLock()
    }, this.HEARTBEAT_MS)
  }

  /**
   * Release lock
   */
  release(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    if (typeof window === 'undefined') return
    
    try {
      const existing = localStorage.getItem(this.lockKey)
      if (existing) {
        const lock = JSON.parse(existing)
        // Only release if we own it
        if (lock.tabId === this.tabId) {
          localStorage.removeItem(this.lockKey)
        }
      }
    } catch (error) {
      console.error('Lock release failed:', error)
    }
  }

  /**
   * Check if lock is held by another tab
   */
  isLockedByOther(): boolean {
    if (typeof window === 'undefined') return false

    try {
      const existing = localStorage.getItem(this.lockKey)
      if (!existing) return false

      const lock = JSON.parse(existing)
      const age = Date.now() - lock.timestamp

      // Stale lock = not locked
      if (age > this.LOCK_TIMEOUT_MS) {
        return false
      }

      // Locked by us = not locked by other
      if (lock.tabId === this.tabId) {
        return false
      }

      // Locked by another tab
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get ID of tab holding lock
   */
  getLockedBy(): string | null {
    if (typeof window === 'undefined') return null

    try {
      const existing = localStorage.getItem(this.lockKey)
      if (!existing) return null

      const lock = JSON.parse(existing)
      const age = Date.now() - lock.timestamp

      if (age > this.LOCK_TIMEOUT_MS) {
        return null
      }

      return lock.tabId
    } catch (error) {
      return null
    }
  }
}

/**
 * Hook for managing tab lock
 */
export function useTabLock(baseKey: string) {
  if (typeof window === 'undefined') {
    return {
      isLocked: false,
      acquire: () => true,
      release: () => {},
      lockedBy: null
    }
  }

  const lock = new TabLock(baseKey)
  const isLocked = lock.isLockedByOther()
  const lockedBy = lock.getLockedBy()

  // Clean up on unmount
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      lock.release()
    })
  }

  return {
    isLocked,
    acquire: () => lock.acquire(),
    release: () => lock.release(),
    lockedBy
  }
}
