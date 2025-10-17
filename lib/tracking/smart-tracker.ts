/**
 * Smart Vehicle Tracker
 * 
 * Complete GPS tracking system with:
 * - Real-time location tracking
 * - Motion detection & crash alerts
 * - Battery-aware frequency adjustment
 * - Offline buffering & sync
 * - Auto-start detection
 * - Wake lock support
 */

import type {
  TrackingOptions,
  TrackingState,
  TrackingStatus,
  LocationPoint,
  TrackingEvent,
  BatteryStatus,
  CrashDetection,
  SyncStatus
} from './types'
import { MotionDetector } from './motion-detector'
import { getOfflineSync } from './offline-sync'
import {
  generateSessionId,
  calculateDistance,
  detectMovementType,
  smoothLocation,
  isValidLocation,
  checkBrowserSupport
} from './utils'

export class SmartVehicleTracker {
  private state: TrackingState = {
    status: 'idle',
    sessionId: null,
    startTime: null,
    currentLocation: null,
    distanceTraveled: 0,
    duration: 0,
    maxSpeed: 0,
    avgSpeed: 0,
    pointsRecorded: 0,
    batteryLevel: 1,
    isOnline: navigator.onLine,
    error: null
  }

  private options: Required<TrackingOptions>
  private watchId: number | null = null
  private wakeLock: any = null
  private motionDetector: MotionDetector
  private offlineSync = getOfflineSync()
  private locationBuffer: LocationPoint[] = []
  private previousLocation: LocationPoint | null = null
  private speedHistory: number[] = []
  private autoStartInterval: number | null = null
  private batteryCheckInterval: number | null = null
  private listeners: Map<string, Function[]> = new Map()
  private updateInterval = 1000
  private battery: BatteryStatus | null = null

  constructor(options: TrackingOptions = {}) {
    this.options = {
      autoStart: options.autoStart ?? false,
      batteryAware: options.batteryAware ?? true,
      offlineSupport: options.offlineSupport ?? true,
      keepAwake: options.keepAwake ?? true,
      highAccuracy: options.highAccuracy ?? true,
      updateInterval: options.updateInterval ?? 1000
    }

    this.updateInterval = this.options.updateInterval
    this.motionDetector = new MotionDetector()

    this.init()
  }

  /**
   * Initialize tracker
   */
  private async init(): Promise<void> {
    // Check browser support
    const support = checkBrowserSupport()
    if (!support.geolocation) {
      throw new Error('Geolocation API not supported')
    }

    // Initialize offline sync
    if (this.options.offlineSupport) {
      await this.offlineSync.init()
    }

    // Setup battery monitoring
    if (this.options.batteryAware && support.battery) {
      await this.setupBatteryMonitoring()
    }

    // Setup auto-start detection
    if (this.options.autoStart) {
      this.setupAutoStart()
    }

    // Setup network monitoring
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    // Setup motion detector callbacks
    this.motionDetector.on('crash-detected', (crash: CrashDetection) => {
      crash.location = this.state.currentLocation || undefined
      this.handleCrashDetected(crash)
    })

    console.log('[SmartTracker] Initialized')
  }

  /**
   * Start tracking
   */
  async startTracking(vehicleId?: string): Promise<void> {
    if (this.state.status === 'active') {
      console.warn('[SmartTracker] Already tracking')
      return
    }

    try {
      this.updateState({ status: 'starting' })

      // Generate session ID
      const sessionId = generateSessionId()

      // Request location permission
      await this.requestPermission()

      // Keep screen awake
      if (this.options.keepAwake && 'wakeLock' in navigator) {
        try {
          this.wakeLock = await (navigator as any).wakeLock.request('screen')
          console.log('[SmartTracker] Screen wake lock acquired')
        } catch (err) {
          console.warn('[SmartTracker] Wake lock failed:', err)
        }
      }

      // Start motion detection
      if (MotionDetector.isSupported()) {
        try {
          await this.motionDetector.start()
        } catch (err) {
          console.warn('[SmartTracker] Motion detection failed:', err)
        }
      }

      // Start GPS tracking
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePosition(position),
        (error) => this.handleError(error),
        {
          enableHighAccuracy: this.options.highAccuracy,
          timeout: 10000,
          maximumAge: 0
        }
      )

      // Update state
      this.updateState({
        status: 'active',
        sessionId,
        startTime: Date.now(),
        distanceTraveled: 0,
        duration: 0,
        maxSpeed: 0,
        avgSpeed: 0,
        pointsRecorded: 0,
        error: null
      })

      // Emit event
      this.emitEvent({
        type: 'start',
        timestamp: Date.now(),
        location: undefined
      })

      console.log('[SmartTracker] ✅ Tracking started:', sessionId)
    } catch (error) {
      this.updateState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Stop tracking
   */
  async stopTracking(): Promise<void> {
    if (this.state.status !== 'active' && this.state.status !== 'paused') {
      console.warn('[SmartTracker] Not tracking')
      return
    }

    this.updateState({ status: 'stopping' })

    // Stop GPS tracking
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    // Stop motion detection
    this.motionDetector.stop()

    // Release wake lock
    if (this.wakeLock) {
      this.wakeLock.release()
      this.wakeLock = null
      console.log('[SmartTracker] Screen wake lock released')
    }

    // Sync remaining buffer
    await this.syncBuffer()

    // Emit event
    this.emitEvent({
      type: 'stop',
      timestamp: Date.now(),
      location: this.state.currentLocation || undefined
    })

    // Reset state
    this.updateState({
      status: 'idle',
      sessionId: null,
      startTime: null,
      currentLocation: null,
      error: null
    })

    console.log('[SmartTracker] ⏹️ Tracking stopped')
  }

  /**
   * Pause tracking
   */
  pauseTracking(): void {
    if (this.state.status !== 'active') return

    this.updateState({ status: 'paused' })

    this.emitEvent({
      type: 'pause',
      timestamp: Date.now(),
      location: this.state.currentLocation || undefined
    })

    console.log('[SmartTracker] ⏸️ Tracking paused')
  }

  /**
   * Resume tracking
   */
  resumeTracking(): void {
    if (this.state.status !== 'paused') return

    this.updateState({ status: 'active' })

    this.emitEvent({
      type: 'resume',
      timestamp: Date.now(),
      location: this.state.currentLocation || undefined
    })

    console.log('[SmartTracker] ▶️ Tracking resumed')
  }

  /**
   * Handle GPS position update
   */
  private handlePosition(position: GeolocationPosition): void {
    if (this.state.status !== 'active') return

    const rawLocation: LocationPoint = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      speed: position.coords.speed || 0,
      heading: position.coords.heading || 0,
      altitude: position.coords.altitude || undefined,
      accuracy: position.coords.accuracy,
      timestamp: Date.now()
    }

    // Validate location
    if (!isValidLocation(rawLocation)) {
      console.warn('[SmartTracker] Invalid location, skipping')
      return
    }

    // Smooth location to reduce GPS jitter
    const location = smoothLocation(rawLocation, this.previousLocation)

    // Calculate distance
    let distance = 0
    if (this.previousLocation) {
      distance = calculateDistance(this.previousLocation, location)
      
      // Ignore unrealistic jumps (likely GPS error)
      if (distance > 100 && this.previousLocation) {
        console.warn('[SmartTracker] Unrealistic distance, skipping')
        return
      }
    }

    // Update speed history
    this.speedHistory.push(location.speed)
    if (this.speedHistory.length > 10) {
      this.speedHistory.shift()
    }

    // Calculate stats
    const avgSpeed = this.speedHistory.reduce((a, b) => a + b, 0) / this.speedHistory.length
    const maxSpeed = Math.max(this.state.maxSpeed, location.speed)
    const distanceTraveled = this.state.distanceTraveled + distance
    const duration = this.state.startTime ? Date.now() - this.state.startTime : 0

    // Update state
    this.updateState({
      currentLocation: location,
      distanceTraveled,
      duration,
      maxSpeed,
      avgSpeed,
      pointsRecorded: this.state.pointsRecorded + 1
    })

    // Add to buffer
    this.locationBuffer.push(location)

    // Store offline if enabled
    if (this.options.offlineSupport && this.state.sessionId) {
      this.offlineSync.storePoint(location, this.state.sessionId).catch(err => {
        console.error('[SmartTracker] Failed to store point:', err)
      })
    }

    // Sync buffer periodically
    if (this.locationBuffer.length >= 10) {
      this.syncBuffer()
    }

    // Emit location event
    this.emit('location', location)

    this.previousLocation = location
  }

  /**
   * Handle GPS error
   */
  private handleError(error: GeolocationPositionError): void {
    console.error('[SmartTracker] GPS error:', error.message)

    this.updateState({
      error: error.message
    })

    this.emit('error', {
      code: error.code,
      message: error.message
    })
  }

  /**
   * Sync location buffer to server
   */
  private async syncBuffer(): Promise<void> {
    if (this.locationBuffer.length === 0 || !this.state.sessionId) return
    if (!navigator.onLine && this.options.offlineSupport) return

    const points = [...this.locationBuffer]
    this.locationBuffer = []

    try {
      const response = await fetch('/api/tracking/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.state.sessionId,
          points
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[SmartTracker] Sync failed:', response.status, errorData)
        throw new Error(`Sync failed: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      const result = await response.json()
      console.log(`[SmartTracker] ✅ Synced ${points.length} points`, result)
    } catch (error) {
      // Put points back in buffer for retry
      this.locationBuffer.unshift(...points)
      console.error('[SmartTracker] Sync failed:', error)
    }
  }

  /**
   * Setup battery monitoring
   */
  private async setupBatteryMonitoring(): Promise<void> {
    try {
      const battery = await (navigator as any).getBattery()

      this.battery = {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      }

      this.updateState({ batteryLevel: battery.level })

      // Adjust update interval based on battery
      this.adjustForBattery()

      // Monitor battery changes
      battery.addEventListener('levelchange', () => {
        this.battery!.level = battery.level
        this.updateState({ batteryLevel: battery.level })
        this.adjustForBattery()
      })

      battery.addEventListener('chargingchange', () => {
        this.battery!.charging = battery.charging
        this.adjustForBattery()
      })

      console.log('[SmartTracker] Battery monitoring enabled')
    } catch (error) {
      console.warn('[SmartTracker] Battery API not available')
    }
  }

  /**
   * Adjust tracking frequency based on battery level
   */
  private adjustForBattery(): void {
    if (!this.battery || !this.options.batteryAware) return

    const { level, charging } = this.battery

    // Don't throttle if charging
    if (charging) {
      this.updateInterval = this.options.updateInterval
      return
    }

    // Throttle based on battery level
    if (level < 0.1) {
      this.updateInterval = 30000 // Every 30 seconds
      this.emitEvent({ type: 'low-battery', timestamp: Date.now() })
    } else if (level < 0.2) {
      this.updateInterval = 10000 // Every 10 seconds
    } else if (level < 0.5) {
      this.updateInterval = 5000 // Every 5 seconds
    } else {
      this.updateInterval = this.options.updateInterval
    }

    console.log(`[SmartTracker] Update interval adjusted to ${this.updateInterval}ms (battery: ${Math.round(level * 100)}%)`)
  }

  /**
   * Setup auto-start detection
   */
  private setupAutoStart(): void {
    this.autoStartInterval = window.setInterval(async () => {
      if (this.state.status === 'active') return

      try {
        const position = await this.getCurrentPosition()
        const speed = position.coords.speed || 0
        const movement = detectMovementType(speed, this.speedHistory)

        // Start tracking if driving detected
        if (movement.type === 'driving' && movement.confidence > 0.7) {
          console.log('[SmartTracker] 🚗 Driving detected, auto-starting tracking')
          await this.startTracking()
        }
      } catch (error) {
        // Ignore errors during auto-detection
      }
    }, 10000) // Check every 10 seconds
  }

  /**
   * Handle crash detection
   */
  private handleCrashDetected(crash: CrashDetection): void {
    console.error('[SmartTracker] 💥 CRASH DETECTED:', crash)

    this.emitEvent({
      type: 'crash',
      timestamp: crash.timestamp,
      location: crash.location,
      data: crash
    })

    this.emit('crash', crash)
  }

  /**
   * Handle online event
   */
  private handleOnline = async (): Promise<void> => {
    this.updateState({ isOnline: true })

    // Sync offline data
    if (this.options.offlineSupport) {
      const status = await this.offlineSync.syncToServer()
      console.log('[SmartTracker] Synced offline data:', status)
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.updateState({ isOnline: false })
    console.warn('[SmartTracker] 📴 Offline mode')
  }

  /**
   * Request geolocation permission
   */
  private async requestPermission(): Promise<void> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(),
        (error) => reject(error),
        { enableHighAccuracy: this.options.highAccuracy }
      )
    })
  }

  /**
   * Get current position (one-time)
   */
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: this.options.highAccuracy,
          timeout: 5000,
          maximumAge: 0
        }
      )
    })
  }

  /**
   * Update state and emit state change
   */
  private updateState(partial: Partial<TrackingState>): void {
    this.state = { ...this.state, ...partial }
    this.emit('state-change', this.state)
  }

  /**
   * Emit tracking event
   */
  private emitEvent(event: TrackingEvent): void {
    this.emit('event', event)
  }

  /**
   * Get current state
   */
  getState(): TrackingState {
    return { ...this.state }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    if (!this.options.offlineSupport) {
      return {
        pending: 0,
        synced: 0,
        failed: 0,
        lastSyncTime: null
      }
    }

    return this.offlineSync.getStatus()
  }

  /**
   * Event emitter
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach(cb => cb(data))
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopTracking()

    if (this.autoStartInterval) {
      clearInterval(this.autoStartInterval)
    }

    if (this.batteryCheckInterval) {
      clearInterval(this.batteryCheckInterval)
    }

    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)

    this.listeners.clear()

    console.log('[SmartTracker] Destroyed')
  }
}
