/**
 * Vehicle Tracking Types
 * 
 * Type definitions for GPS tracking, motion detection, and trip recording
 */

export interface LocationPoint {
  lat: number
  lng: number
  speed: number // m/s
  heading: number // degrees (0-360)
  altitude?: number // meters
  accuracy: number // meters
  timestamp: number
}

export interface MotionData {
  acceleration: {
    x: number
    y: number
    z: number
  }
  accelerationIncludingGravity: {
    x: number
    y: number
    z: number
  }
  rotationRate: {
    alpha: number
    beta: number
    gamma: number
  }
  interval: number
  timestamp: number
}

export interface TrackingOptions {
  autoStart?: boolean // Auto-detect driving and start tracking
  batteryAware?: boolean // Adjust frequency based on battery
  offlineSupport?: boolean // Buffer locations when offline
  keepAwake?: boolean // Keep screen awake during tracking
  highAccuracy?: boolean // Use GPS vs WiFi positioning
  updateInterval?: number // Milliseconds between updates
}

export interface TrackingSession {
  id: string
  userId: string
  vehicleId?: string
  startTime: number
  endTime?: number
  distance: number // meters
  duration: number // milliseconds
  maxSpeed: number // m/s
  avgSpeed: number // m/s
  points: LocationPoint[]
  events: TrackingEvent[]
}

export interface TrackingEvent {
  type: 'start' | 'stop' | 'pause' | 'resume' | 'crash' | 'speeding' | 'low-battery'
  timestamp: number
  location?: LocationPoint
  data?: any
}

export interface BatteryStatus {
  level: number // 0-1
  charging: boolean
  chargingTime?: number
  dischargingTime?: number
}

export interface NetworkInfo {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g'
  downlink: number // Mbps
  rtt: number // ms
  saveData: boolean
}

export interface MovementType {
  type: 'stationary' | 'walking' | 'cycling' | 'driving'
  confidence: number // 0-1
  speed: number // m/s
}

export interface CrashDetection {
  detected: boolean
  acceleration: number // total G-force
  location: LocationPoint
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export type TrackingStatus = 'idle' | 'starting' | 'active' | 'paused' | 'stopping' | 'error'

export interface TrackingState {
  status: TrackingStatus
  sessionId: string | null
  startTime: number | null
  currentLocation: LocationPoint | null
  distanceTraveled: number // meters
  duration: number // milliseconds
  maxSpeed: number // m/s
  avgSpeed: number // m/s
  pointsRecorded: number
  batteryLevel: number // 0-1
  isCharging: boolean // Whether device is currently charging
  isOnline: boolean
  error: string | null
}

export interface SyncStatus {
  pending: number // Points waiting to sync
  synced: number // Points successfully synced
  failed: number // Points that failed to sync
  lastSyncTime: number | null
}

export type TrackingEventCallback = (event: TrackingEvent) => void
export type LocationCallback = (location: LocationPoint) => void
export type CrashCallback = (crash: CrashDetection) => void
export type StateChangeCallback = (state: TrackingState) => void
