/**
 * Motion Detector
 * 
 * Detects crashes, sudden stops, and movement patterns using
 * device accelerometer and gyroscope
 */

import type { MotionData, CrashDetection, LocationPoint } from './types'
import { calculateTotalAcceleration } from './utils'

export class MotionDetector {
  private isListening = false
  private motionHistory: MotionData[] = []
  private maxHistorySize = 100
  private listeners: Map<string, Function[]> = new Map()

  // Crash detection thresholds
  private readonly CRASH_THRESHOLD = 15 // G-force
  private readonly HARD_BRAKE_THRESHOLD = 8 // G-force
  private readonly SUDDEN_TURN_THRESHOLD = 5 // G-force

  /**
   * Start listening to motion sensors
   */
  async start(): Promise<void> {
    if (this.isListening) return

    // Request permission on iOS 13+
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission()
        if (permission !== 'granted') {
          throw new Error('Motion permission denied')
        }
      } catch (error) {
        console.error('[MotionDetector] Permission request failed:', error)
        throw error
      }
    }

    // Start listening to device motion
    window.addEventListener('devicemotion', this.handleMotion)
    this.isListening = true

    console.log('[MotionDetector] Started listening to motion sensors')
  }

  /**
   * Stop listening to motion sensors
   */
  stop(): void {
    if (!this.isListening) return

    window.removeEventListener('devicemotion', this.handleMotion)
    this.isListening = false
    this.motionHistory = []

    console.log('[MotionDetector] Stopped listening to motion sensors')
  }

  /**
   * Handle device motion event
   */
  private handleMotion = (event: DeviceMotionEvent): void => {
    const acc = event.acceleration
    const accGravity = event.accelerationIncludingGravity
    const rotation = event.rotationRate

    // Skip if no data
    if (!acc || !accGravity || !rotation) return

    const motionData: MotionData = {
      acceleration: {
        x: acc.x || 0,
        y: acc.y || 0,
        z: acc.z || 0
      },
      accelerationIncludingGravity: {
        x: accGravity.x || 0,
        y: accGravity.y || 0,
        z: accGravity.z || 0
      },
      rotationRate: {
        alpha: rotation.alpha || 0,
        beta: rotation.beta || 0,
        gamma: rotation.gamma || 0
      },
      interval: event.interval || 0,
      timestamp: Date.now()
    }

    // Add to history
    this.motionHistory.push(motionData)
    if (this.motionHistory.length > this.maxHistorySize) {
      this.motionHistory.shift()
    }

    // Analyze motion
    this.analyzeMotion(motionData)
  }

  /**
   * Analyze motion data for crash detection
   */
  private analyzeMotion(data: MotionData): void {
    const totalAcc = calculateTotalAcceleration(data.acceleration)

    // Critical crash detection
    if (totalAcc > this.CRASH_THRESHOLD) {
      this.emit('crash-detected', {
        detected: true,
        acceleration: totalAcc,
        timestamp: data.timestamp,
        severity: this.determineSeverity(totalAcc),
        location: null // Will be filled by tracker
      })
    }
    // Hard brake detection
    else if (totalAcc > this.HARD_BRAKE_THRESHOLD) {
      this.emit('hard-brake', {
        acceleration: totalAcc,
        timestamp: data.timestamp
      })
    }
    // Sudden turn detection
    else if (Math.abs(data.acceleration.x) > this.SUDDEN_TURN_THRESHOLD) {
      this.emit('sudden-turn', {
        acceleration: Math.abs(data.acceleration.x),
        timestamp: data.timestamp
      })
    }

    // Emit regular motion update
    this.emit('motion', data)
  }

  /**
   * Determine crash severity based on acceleration
   */
  private determineSeverity(acceleration: number): 'low' | 'medium' | 'high' | 'critical' {
    if (acceleration > 30) return 'critical'
    if (acceleration > 25) return 'high'
    if (acceleration > 20) return 'medium'
    return 'low'
  }

  /**
   * Get recent motion history
   */
  getHistory(seconds: number = 5): MotionData[] {
    const cutoff = Date.now() - seconds * 1000
    return this.motionHistory.filter(m => m.timestamp > cutoff)
  }

  /**
   * Check if device is currently moving
   */
  isMoving(): boolean {
    if (this.motionHistory.length < 5) return false

    const recent = this.getHistory(2)
    const avgAcc = recent.reduce((sum, m) => {
      return sum + calculateTotalAcceleration(m.acceleration)
    }, 0) / recent.length

    return avgAcc > 0.5 // Threshold for movement
  }

  /**
   * Check if device is stationary
   */
  isStationary(): boolean {
    if (this.motionHistory.length < 10) return false

    const recent = this.getHistory(5)
    const avgAcc = recent.reduce((sum, m) => {
      return sum + calculateTotalAcceleration(m.acceleration)
    }, 0) / recent.length

    return avgAcc < 0.2 // Very low acceleration = stationary
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
   * Check if motion sensors are supported
   */
  static isSupported(): boolean {
    return (
      'DeviceMotionEvent' in window &&
      typeof DeviceMotionEvent !== 'undefined'
    )
  }

  /**
   * Check if permission is needed (iOS 13+)
   */
  static needsPermission(): boolean {
    return (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    )
  }
}
