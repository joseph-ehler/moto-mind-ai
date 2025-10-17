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
    /** Car WiFi network SSID if available */
    networkSSID: string | null
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
      networkSSID: await this.getWiFiSSID(),
      screenResolution: this.checkCarPlayResolution()
    }
    
    // Determine connection type
    const connectionType = this.determineConnectionType(signals)
    
    // Calculate confidence
    const confidence = this.calculateConfidence(signals, connectionType)
    
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
    
    // Display mode is strongest signal (40 points)
    if (signals.displayMode === 'carplay') {
      score += 40
      reasons.push('CarPlay display mode detected')
    } else if (signals.displayMode === 'android-auto') {
      score += 40
      reasons.push('Android Auto display mode detected')
    }
    
    // Car-specific Bluetooth (25 points)
    if (signals.carBluetooth) {
      score += 25
      reasons.push('Connected to car Bluetooth')
    }
    
    // Car WiFi network (20 points for wireless)
    if (signals.carWiFi && connectionType === 'wireless') {
      score += 20
      reasons.push('Connected to car WiFi')
    }
    
    // Charging (20 points for wired)
    if (signals.charging && connectionType === 'wired') {
      score += 20
      reasons.push('Device charging via USB')
    }
    
    // CarPlay-specific screen resolution (15 points)
    if (signals.screenResolution.matches) {
      score += 15
      reasons.push(`CarPlay resolution detected (${signals.screenResolution.type})`)
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
   * Check if connected to car Bluetooth device
   */
  private async isConnectedToCarBluetooth(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      return false
    }
    
    try {
      // Try to get paired devices
      const devices = await (navigator.bluetooth as any).getDevices()
      
      // Look for car-related device names
      const carKeywords = [
        'car', 'auto', 'vehicle',
        // Car manufacturers
        'honda', 'toyota', 'ford', 'chevy', 'chevrolet', 
        'tesla', 'bmw', 'mercedes', 'audi', 'lexus',
        'mazda', 'nissan', 'subaru', 'volkswagen', 'vw',
        'hyundai', 'kia', 'volvo', 'jeep', 'ram',
        // Car audio systems
        'carplay', 'android auto', 'sync', 'uconnect',
        'infotainment', 'audio', 'multimedia'
      ]
      
      return devices.some((device: any) => {
        const name = device.name?.toLowerCase() || ''
        return carKeywords.some(keyword => name.includes(keyword))
      })
    } catch (error) {
      console.warn('[CarPlayDetector] Bluetooth detection failed:', error)
      return false
    }
  }
  
  /**
   * Check if connected to car WiFi network
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
      
      // If connected via WiFi with specific patterns
      if (connection.effectiveType === 'wifi' || 
          connection.type === 'wifi') {
        
        // Try to detect car WiFi SSID patterns
        const ssid = await this.getWiFiSSID()
        if (ssid) {
          const carWiFiPatterns = [
            'carplay', 'androidauto', 'tesla', 'bmw', 'mercedes',
            'audi', 'lexus', 'toyota', 'honda', 'ford', 'sync',
            'uconnect', 'mylink', 'entune', 'infotainment'
          ]
          
          return carWiFiPatterns.some(pattern => 
            ssid.toLowerCase().includes(pattern)
          )
        }
      }
      
      return false
    } catch {
      return false
    }
  }
  
  /**
   * Get WiFi SSID if available (limited browser support)
   */
  private async getWiFiSSID(): Promise<string | null> {
    try {
      // Some Android browsers expose this
      const connection = (navigator as any).connection
      if (connection && connection.ssid) {
        return connection.ssid
      }
      
      // Not available in most browsers for privacy
      return null
    } catch {
      return null
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
}
