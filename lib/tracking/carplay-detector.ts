/**
 * Enhanced CarPlay and Android Auto Detection
 * 
 * Multi-signal car detection system with confidence scoring.
 * Detects both wireless and wired connections using:
 * - Bluetooth connectivity
 * - WiFi network connection
 * - Charging status
 * - Display mode (CarPlay/Android Auto)
 * - Screen resolution matching
 * 
 * @module lib/tracking/carplay-detector
 */

/**
 * Signals detected from the device and car connection
 */
export interface CarConnectionSignals {
  /** Type of connection detected */
  connectionType: 'wired' | 'wireless' | 'unknown'
  
  /** Individual signal indicators */
  signals: {
    /** Device is charging (indicates wired connection) */
    charging: boolean
    /** Connected to car via Bluetooth */
    carBluetooth: boolean
    /** Connected to car WiFi network */
    carWiFi: boolean
    /** Current display mode */
    displayMode: 'carplay' | 'android-auto' | 'normal'
    /** Screen resolution matches known CarPlay specs */
    screenResolution: { matches: boolean; type: string }
  }
  
  /** Confidence assessment */
  confidence: {
    /** Confidence level category */
    level: 'low' | 'medium' | 'high' | 'very-high'
    /** Numerical confidence score (0-100) */
    score: number
    /** Human-readable reasons for the confidence level */
    reasons: string[]
  }
}

/**
 * Last known successful car connection for learning patterns
 */
interface LastConnection {
  /** When the connection occurred */
  timestamp: number
  /** Type of connection */
  connectionType: 'wired' | 'wireless'
  /** Confidence score at time of connection */
  confidence: number
  /** Which signals were present */
  activeSignals: string[]
}

type ConnectionChangeCallback = (connected: boolean, signals: CarConnectionSignals) => void

/**
 * Enhanced CarPlay/Android Auto detector with multi-signal detection
 * and confidence scoring system.
 * 
 * @example
 * ```typescript
 * const detector = new EnhancedCarPlayDetector()
 * 
 * detector.onConnectionChange((connected, signals) => {
 *   if (connected && signals.confidence.level === 'high') {
 *     console.log('Car connected:', signals.connectionType)
 *     startTracking()
 *   }
 * })
 * 
 * detector.startMonitoring()
 * ```
 */
export class EnhancedCarPlayDetector {
  private previousState: CarConnectionSignals | null = null
  private listeners: ConnectionChangeCallback[] = []
  private monitoringInterval: NodeJS.Timeout | null = null
  private lastConnection: LastConnection | null = null
  
  constructor() {
    // Load last known connection from localStorage
    this.loadLastConnection()
  }
  
  /**
   * Detect current car connection status with all available signals
   * 
   * @returns Complete signal analysis with confidence scoring
   */
  async detect(): Promise<CarConnectionSignals> {
    // Gather all available signals
    const signals = {
      charging: await this.isCharging(),
      carBluetooth: await this.isConnectedToCarBluetooth(),
      carWiFi: await this.isConnectedToCarWiFi(),
      displayMode: await this.detectDisplayMode(),
      screenResolution: this.checkCarPlayResolution()
    }
    
    // Determine connection type
    const connectionType = this.determineConnectionType(signals)
    
    // Calculate confidence
    const confidence = this.calculateConfidence(signals, connectionType)
    
    // Boost confidence if similar to last successful connection
    if (this.isSimilarToLastConnection(signals, connectionType)) {
      confidence.score = Math.min(100, confidence.score + 10)
      confidence.reasons.push('Similar to previous car connection')
      
      // Recalculate level with boosted score
      if (confidence.score >= 80) confidence.level = 'very-high'
      else if (confidence.score >= 60) confidence.level = 'high'
      else if (confidence.score >= 40) confidence.level = 'medium'
    }
    
    // Save this connection if confidence is high
    if (confidence.level === 'high' || confidence.level === 'very-high') {
      this.saveLastConnection(signals, connectionType, confidence.score)
    }
    
    return {
      connectionType,
      signals,
      confidence
    }
  }
  
  /**
   * Start monitoring for car connection changes
   * Checks every 5 seconds and responds to system events
   */
  startMonitoring(): void {
    // Check immediately
    this.checkAndNotify()
    
    // Check every 5 seconds
    this.monitoringInterval = setInterval(() => this.checkAndNotify(), 5000)
    
    // Check on battery change
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator.getBattery as any)().then((battery: any) => {
        battery.addEventListener('chargingchange', () => this.checkAndNotify())
      }).catch(() => {
        // Battery API not supported, continue without it
      })
    }
    
    // Check on network change
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.checkAndNotify())
      window.addEventListener('offline', () => this.checkAndNotify())
      
      // Check on orientation change (entering/exiting car display)
      window.addEventListener('orientationchange', () => this.checkAndNotify())
      
      // Check on fullscreen change
      document.addEventListener('fullscreenchange', () => this.checkAndNotify())
    }
  }
  
  /**
   * Stop monitoring for connection changes
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }
  
  /**
   * Register a callback for connection state changes
   * 
   * @param callback Function to call when connection state changes
   */
  onConnectionChange(callback: ConnectionChangeCallback): void {
    this.listeners.push(callback)
  }
  
  /**
   * Remove a connection change callback
   * 
   * @param callback Callback to remove
   */
  offConnectionChange(callback: ConnectionChangeCallback): void {
    this.listeners = this.listeners.filter(cb => cb !== callback)
  }
  
  // ========================================
  // PRIVATE: Connection Type Detection
  // ========================================
  
  private determineConnectionType(signals: any): 'wired' | 'wireless' | 'unknown' {
    // Wired: Charging + (CarPlay display OR car Bluetooth)
    if (signals.charging && 
        (signals.displayMode !== 'normal' || signals.carBluetooth)) {
      return 'wired'
    }
    
    // Wireless: Car WiFi + car Bluetooth (but NOT charging)
    // OR CarPlay/Android Auto display mode without charging
    if (!signals.charging && 
        ((signals.carWiFi && signals.carBluetooth) || 
         signals.displayMode !== 'normal')) {
      return 'wireless'
    }
    
    return 'unknown'
  }
  
  // ========================================
  // PRIVATE: Confidence Calculation
  // ========================================
  
  private calculateConfidence(
    signals: any, 
    connectionType: string
  ): CarConnectionSignals['confidence'] {
    let score = 0
    const reasons: string[] = []
    
    // TIER 1: Most Reliable Signals (65 points total)
    
    // Display mode is strongest signal (50 points)
    if (signals.displayMode === 'carplay') {
      score += 50
      reasons.push('CarPlay display mode detected')
    } else if (signals.displayMode === 'android-auto') {
      score += 50
      reasons.push('Android Auto display mode detected')
    }
    
    // Screen resolution match (15 points)
    if (signals.screenResolution.matches) {
      score += 15
      reasons.push(`CarPlay resolution detected (${signals.screenResolution.type})`)
    }
    
    // TIER 2: Wired Connection Indicator (30 points)
    
    // Charging via USB (30 points for wired)
    if (signals.charging && connectionType === 'wired') {
      score += 30
      reasons.push('Device charging via USB')
    }
    
    // TIER 3: Helpful Hints (15 points total)
    
    // Media session active (10 points)
    if (signals.carBluetooth) {
      score += 10
      reasons.push('Car audio system detected')
    }
    
    // WiFi connection (10 points for wireless)
    if (signals.carWiFi && connectionType === 'wireless') {
      score += 10
      reasons.push('Connected via WiFi (possible car network)')
    }
    
    // Determine level
    let level: 'low' | 'medium' | 'high' | 'very-high'
    if (score >= 80) level = 'very-high'
    else if (score >= 60) level = 'high'
    else if (score >= 40) level = 'medium'
    else level = 'low'
    
    return { level, score, reasons }
  }
  
  // ========================================
  // PRIVATE: Signal Detection Methods
  // ========================================
  
  /**
   * Check if device is charging
   */
  private async isCharging(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
      return false
    }
    
    try {
      const battery = await (navigator.getBattery as any)()
      return battery.charging
    } catch {
      return false
    }
  }
  
  /**
   * Check if connected to car audio (simplified)
   * 
   * Note: Web Bluetooth API requires user interaction and won't work automatically.
   * Instead, we infer car connection from other reliable signals.
   * This method is kept for future enhancement with user-initiated pairing.
   */
  private async isConnectedToCarBluetooth(): Promise<boolean> {
    if (typeof navigator === 'undefined') return false
    
    try {
      // Check if media session is active (indicates audio playing)
      if ('mediaSession' in navigator) {
        const mediaSession = (navigator as any).mediaSession
        if (mediaSession?.playbackState === 'playing') {
          return true
        }
      }
      
      // Check for audio context (indicates audio output)
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        // Audio is being used, might be car audio
        // This is a weak signal, so we'll use it cautiously
        return false // Disabled for now as too unreliable
      }
      
      return false
    } catch (error) {
      console.warn('[CarPlayDetector] Audio detection failed:', error)
      return false
    }
  }
  
  /**
   * Check if connected to car WiFi network (simplified)
   * 
   * Note: Browsers don't expose WiFi SSID for privacy.
   * We check if on WiFi (not cellular) and not charging,
   * which suggests wireless CarPlay/Android Auto.
   */
  private async isConnectedToCarWiFi(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.onLine) {
      return false
    }
    
    try {
      // Get network info if available
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection
      
      if (!connection) return false
      
      // Check if on WiFi (not cellular)
      const isWiFi = 
        connection.effectiveType === 'wifi' ||
        connection.type === 'wifi' ||
        // Sometimes reported as 'ethernet' on car systems
        connection.type === 'ethernet'
      
      if (!isWiFi) return false
      
      // If on WiFi AND not charging, likely wireless CarPlay
      // (wired would be charging via USB)
      try {
        const battery = await (navigator.getBattery as any)()
        const notCharging = !battery.charging
        return isWiFi && notCharging
      } catch {
        // Battery API not available, just return WiFi status
        return isWiFi
      }
    } catch {
      return false
    }
  }
  
  /**
   * Detect current display mode
   */
  private async detectDisplayMode(): Promise<'carplay' | 'android-auto' | 'normal'> {
    if (typeof window === 'undefined') return 'normal'
    
    try {
      // Check for fullscreen mode (common in CarPlay)
      const isFullscreen = 
        document.fullscreenElement !== null ||
        (document as any).webkitFullscreenElement !== null ||
        window.matchMedia('(display-mode: fullscreen)').matches
      
      // Check for standalone mode (PWA in car display)
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true
      
      // Check for specific screen orientations/sizes that indicate car display
      const hasCarPlayResolution = this.checkCarPlayResolution().matches
      
      if ((isFullscreen || isStandalone) && hasCarPlayResolution) {
        // Try to determine if iOS (CarPlay) or Android (Android Auto)
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
        return isIOS ? 'carplay' : 'android-auto'
      }
      
      return 'normal'
    } catch {
      return 'normal'
    }
  }
  
  /**
   * Check if screen resolution matches known CarPlay/Android Auto specs
   */
  private checkCarPlayResolution(): { matches: boolean; type: string } {
    if (typeof window === 'undefined') {
      return { matches: false, type: 'Unknown' }
    }
    
    const width = window.screen.width
    const height = window.screen.height
    
    // Common CarPlay and Android Auto resolutions
    const carPlayResolutions = [
      { width: 800, height: 480, type: 'Standard CarPlay' },
      { width: 1280, height: 720, type: 'HD CarPlay' },
      { width: 1920, height: 720, type: 'Ultra-wide CarPlay' },
      { width: 1024, height: 768, type: 'Square CarPlay' },
      // Android Auto resolutions
      { width: 800, height: 480, type: 'Android Auto Standard' },
      { width: 1280, height: 720, type: 'Android Auto HD' },
      { width: 1920, height: 1080, type: 'Android Auto Full HD' }
    ]
    
    const match = carPlayResolutions.find(res =>
      res.width === width && res.height === height
    )
    
    return {
      matches: !!match,
      type: match?.type || 'Unknown'
    }
  }
  
  // ========================================
  // PRIVATE: Monitoring Logic
  // ========================================
  
  private async checkAndNotify(): Promise<void> {
    const currentState = await this.detect()
    
    // Determine if connected (confidence >= medium)
    const wasConnected = this.previousState?.confidence.level && 
      ['medium', 'high', 'very-high'].includes(this.previousState.confidence.level)
    const isConnected = ['medium', 'high', 'very-high'].includes(currentState.confidence.level)
    
    // Notify if state changed
    if (wasConnected !== isConnected) {
      this.notifyListeners(isConnected, currentState)
    }
    
    this.previousState = currentState
  }
  
  private notifyListeners(connected: boolean, signals: CarConnectionSignals): void {
    this.listeners.forEach(cb => {
      try {
        cb(connected, signals)
      } catch (error) {
        console.error('[CarPlayDetector] Listener error:', error)
      }
    })
  }
  
  // ========================================
  // PRIVATE: Connection Memory
  // ========================================
  
  /**
   * Load last known connection from localStorage
   */
  private loadLastConnection(): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('carplay_last_connection')
      if (stored) {
        this.lastConnection = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('[CarPlayDetector] Failed to load last connection:', error)
    }
  }
  
  /**
   * Save current connection as last known successful connection
   */
  private saveLastConnection(
    signals: any,
    connectionType: 'wired' | 'wireless' | 'unknown',
    confidence: number
  ): void {
    if (typeof window === 'undefined') return
    
    // Get list of active signals
    const activeSignals = Object.keys(signals).filter(key => {
      const value = signals[key]
      return value === true || (typeof value === 'object' && value?.matches === true)
    })
    
    this.lastConnection = {
      timestamp: Date.now(),
      connectionType: connectionType === 'unknown' ? 'wireless' : connectionType,
      confidence,
      activeSignals
    }
    
    try {
      localStorage.setItem(
        'carplay_last_connection',
        JSON.stringify(this.lastConnection)
      )
    } catch (error) {
      console.warn('[CarPlayDetector] Failed to save last connection:', error)
    }
  }
  
  /**
   * Check if current signals are similar to last successful connection
   */
  private isSimilarToLastConnection(
    currentSignals: any,
    currentConnectionType: string
  ): boolean {
    if (!this.lastConnection) return false
    
    // Only consider recent connections (within 24 hours)
    const timeSinceLastConnection = Date.now() - this.lastConnection.timestamp
    const oneDayMs = 24 * 60 * 60 * 1000
    if (timeSinceLastConnection > oneDayMs) return false
    
    // Check if connection type matches
    const typeMatches = currentConnectionType === this.lastConnection.connectionType
    if (!typeMatches) return false
    
    // Check if at least 2 of the same signals are active
    const currentActiveSignals = Object.keys(currentSignals).filter(key => {
      const value = currentSignals[key]
      return value === true || (typeof value === 'object' && value?.matches === true)
    })
    
    const matchingSignals = this.lastConnection.activeSignals.filter(signal =>
      currentActiveSignals.includes(signal)
    )
    
    return matchingSignals.length >= 2
  }
}
