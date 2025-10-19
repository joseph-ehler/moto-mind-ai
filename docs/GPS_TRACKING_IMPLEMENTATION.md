# GPS Tracking Implementation - 12-Week Roadmap

**Last Updated:** October 18, 2024  
**Companion:** `GPS_TRACKING_VISION.md`, `GPS_TRACKING_ARCHITECTURE.md`

---

## 🗺️ ROADMAP OVERVIEW

**Total Timeline:** 12 weeks to production-ready  
**Phase 1:** Weeks 1-2 (Foundation)  
**Phase 2:** Weeks 3-4 (Optimization)  
**Phase 3:** Weeks 5-6 (Safety)  
**Phase 4:** Weeks 7-8 (Visualization)  
**Phase 5:** Weeks 9-12 (Advanced)

---

## 📅 WEEKS 1-2: BACKGROUND RELIABILITY ⭐⭐⭐⭐⭐

**Goal:** Automatic trip detection that just works

**Priority:** CRITICAL - Foundation for everything else

### Week 1: iOS Background Tracking

**Day 1-2: Permission Flow**
```typescript
// File: lib/tracking/permissions.ts

export async function requestLocationPermissions() {
  // Step 1: Request "When In Use" first
  const whenInUse = await Geolocation.requestPermissions()
  
  if (whenInUse.location !== 'granted') {
    throw new Error('Location permission denied')
  }
  
  // Step 2: Show value proposition
  await showValueModal({
    title: 'Automatic Trip Tracking',
    message: 'MotoMind can automatically detect and log your trips.',
    benefit: 'No manual start/stop needed. Just drive.',
    features: [
      'Background trip detection',
      'Automatic arrival notifications',
      'Complete trip history'
    ]
  })
  
  // Step 3: Request "Always" upgrade
  const always = await BackgroundGeolocation.requestAlwaysAuthorization()
  
  if (always !== 'granted') {
    // Show settings deeplink
    showSettingsGuide()
  }
  
  return always === 'granted'
}
```

**Day 3-4: SLC + Visits Configuration**
```typescript
// File: lib/tracking/ios-background.ts

export async function configureIOSBackground() {
  // Configure Significant Location Change
  await BackgroundGeolocation.configure({
    // iOS-specific
    locationProvider: 'ACTIVITY_PROVIDER',
    backgroundMode: 'SIGNIFICANT_CHANGES',
    allowsBackgroundLocationUpdates: true,
    pausesLocationUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    
    // Activity type
    activityType: 'AutomotiveNavigation',
    
    // Initial conservative mode
    desiredAccuracy: 'BALANCED_POWER',
    distanceFilter: 50, // Only wake every 50m
    
    // Minimal geofences for guaranteed wakes
    geofences: [
      await getHomeGeofence(),
      await getWorkGeofence()
    ]
  })
  
  // Start monitoring visits
  await startVisitsMonitoring()
}
```

**Day 5: Trip FSM**
```typescript
// File: lib/tracking/trip-fsm.ts

type TripState = 'idle' | 'candidate' | 'driving' | 'paused' | 'stopped' | 'finalized'

export class TripStateMachine extends EventEmitter {
  private state: TripState = 'idle'
  private currentTrip: Trip | null = null
  
  async transition(event: TripEvent) {
    const previousState = this.state
    
    // State machine logic
    switch (this.state) {
      case 'idle':
        if (event === 'movement_detected') {
          this.state = 'candidate'
          this.emit('candidate_detected')
        }
        break
        
      case 'candidate':
        if (event === 'trip_confirmed') {
          this.state = 'driving'
          this.currentTrip = await this.startTrip()
          this.emit('trip_started', this.currentTrip)
        } else if (event === 'false_alarm') {
          this.state = 'idle'
        }
        break
        
      case 'driving':
        if (event === 'stopped_briefly') {
          this.state = 'paused'
        } else if (event === 'trip_ended') {
          this.state = 'stopped'
          this.emit('trip_stopped', this.currentTrip)
        }
        break
        
      case 'paused':
        if (event === 'movement_resumed') {
          this.state = 'driving'
        } else if (event === 'stop_confirmed') {
          this.state = 'stopped'
        }
        break
        
      case 'stopped':
        if (event === 'idle_timeout') {
          this.state = 'finalized'
          await this.finalizeTrip()
          this.emit('trip_finalized', this.currentTrip)
          this.currentTrip = null
        }
        break
    }
    
    if (this.state !== previousState) {
      console.log(`Trip FSM: ${previousState} → ${this.state}`)
    }
  }
  
  private async startTrip(): Promise<Trip> {
    // Create trip record
    // Start high-accuracy tracking
    // Capture pre-buffer
    // ...
  }
}
```

### Week 2: Android Background Tracking

**Day 1-2: Activity Recognition**
```typescript
// File: lib/tracking/android-background.ts

export async function configureAndroidBackground() {
  // Register for activity transitions
  await ActivityRecognition.registerTransition({
    transitions: [
      'IN_VEHICLE',  // User entered vehicle
      'STILL',       // User stopped
      'ON_FOOT'      // User walking
    ]
  }, async (transition) => {
    console.log('Activity transition:', transition.activity)
    
    if (transition.activity === 'IN_VEHICLE') {
      await handlePossibleTripStart()
    } else if (transition.activity === 'STILL') {
      await handlePossibleTripEnd()
    }
  })
}
```

**Day 3-4: Foreground Service**
```typescript
// File: lib/tracking/android-service.ts

export async function startForegroundService() {
  const notification = {
    id: 1,
    title: 'MotoMind is tracking your trips',
    text: 'Tap to view current trip',
    icon: 'notification_icon',
    ongoing: true, // Can't be dismissed
    priority: 'high',
    channelId: 'trip_tracking'
  }
  
  await ForegroundService.startForegroundService({
    notification,
    callback: async () => {
      // Keep service alive
      await trackLocation()
    }
  })
}

// Detect if service was killed
setInterval(async () => {
  const isRunning = await ForegroundService.isRunning()
  
  if (!isRunning && shouldBeTracking) {
    // Service killed - notify user
    showNotification({
      title: 'Background tracking stopped',
      message: 'Tap to optimize battery settings',
      action: () => showOptimizationGuide()
    })
  }
}, 60000) // Check every minute
```

**Day 5: Trip Detection Logic**
```typescript
// File: lib/tracking/trip-detection.ts

interface TripStartConditions {
  activityChange: boolean
  significantMove: boolean
  speedThreshold: boolean
  distanceThreshold: boolean
}

export async function detectTripStart(): Promise<boolean> {
  const conditions: TripStartConditions = {
    activityChange: await checkActivity(),
    significantMove: await checkMovement(),
    speedThreshold: await checkSpeed(),
    distanceThreshold: await checkDistance()
  }
  
  // Require 3 out of 4 conditions
  const score = Object.values(conditions).filter(Boolean).length
  const confidence = score / 4
  
  if (score >= 3) {
    console.log(`Trip start detected (${confidence * 100}% confidence)`)
    
    // Escalate to high accuracy
    await escalateTracking()
    
    // Capture pre-buffer
    await capturePreBuffer()
    
    return true
  }
  
  return false
}
```

### Testing Week 1-2

**Test Cases:**
1. ✅ Start trip from home (automatic detection)
2. ✅ Stop trip at destination (automatic finalization)
3. ✅ Short stop (gas station) doesn't end trip
4. ✅ False positive filter (walking, not driving)
5. ✅ Battery drain < 10% per day
6. ✅ Background continuity (app killed, OS restarts)

**Target Metrics:**
- Trip detection: 98%+
- False trips: < 2%
- Battery: < 10%/day

---

## 📅 WEEKS 3-4: GEOFENCING + OPTIMIZATION ⭐⭐⭐⭐☆

**Goal:** Automatic arrival detection + battery optimization

### Week 3: Geofencing

**Day 1-2: OS-Level Geofences**
```typescript
// File: lib/tracking/geofencing.ts

interface Geofence {
  id: string
  latitude: number
  longitude: number
  radius: number
  type: 'home' | 'work' | 'shop' | 'favorite'
}

export async function setupGeofences(fences: Geofence[]) {
  for (const fence of fences) {
    await BackgroundGeolocation.addGeofence({
      identifier: fence.id,
      latitude: fence.latitude,
      longitude: fence.longitude,
      radius: fence.radius,
      notifyOnEntry: true,
      notifyOnExit: true,
      notifyOnDwell: true,
      loiteringDelay: 120000 // 2 minutes
    })
  }
  
  // Handle events
  BackgroundGeolocation.onGeofence(handleGeofenceEvent)
}

async function handleGeofenceEvent(event: GeofenceEvent) {
  if (event.action === 'ENTER') {
    console.log('Arrived at:', event.identifier)
    
    if (event.identifier === 'home') {
      await finalizeTripAtHome()
    } else if (event.identifier.startsWith('shop_')) {
      await handleShopArrival(event.identifier)
    }
  } else if (event.action === 'EXIT') {
    console.log('Left:', event.identifier)
    
    if (event.identifier === 'home') {
      await checkTripStart()
    }
  }
}
```

**Day 3-4: Stop Clustering**
```typescript
// File: lib/tracking/clustering.ts

// DBSCAN algorithm for stop detection
export function clusterStops(locations: Location[]): Cluster[] {
  const eps = 0.0001 // ~10m
  const minPoints = 3
  
  // Find stops (speed < 1 mph for >2 min)
  const stops = locations.filter(loc => 
    loc.speed < 0.447 // 1 mph in m/s
  )
  
  // Cluster nearby stops
  const clusters = dbscan(stops, eps, minPoints)
  
  // Calculate cluster centroids
  return clusters.map(cluster => ({
    id: generateId(),
    centroid: calculateCentroid(cluster.points),
    radius: calculateRadius(cluster.points),
    visits: cluster.points.length,
    firstVisit: Math.min(...cluster.points.map(p => p.timestamp)),
    lastVisit: Math.max(...cluster.points.map(p => p.timestamp))
  }))
}

// Auto-create geofences for frequent stops
export async function autoCreateGeofences() {
  const clusters = await getFrequentStops(30) // Last 30 days
  
  for (const cluster of clusters) {
    if (cluster.visits >= 5) {
      // User visits this location frequently
      await createGeofence({
        id: `frequent_${cluster.id}`,
        ...cluster.centroid,
        radius: Math.max(cluster.radius, 100),
        type: 'favorite'
      })
    }
  }
}
```

**Day 5: Road Snapping**
```typescript
// File: lib/tracking/road-snapping.ts

export async function snapToRoad(locations: Location[]): Promise<Location[]> {
  // Batch API call (max 100 points)
  const batches = chunk(locations, 100)
  const results = []
  
  for (const batch of batches) {
    const coordinates = batch
      .map(loc => `${loc.longitude},${loc.latitude}`)
      .join(';')
    
    const response = await fetch(
      `https://api.mapbox.com/matching/v5/mapbox/driving/${coordinates}` +
      `?geometries=geojson&radiuses=${batch.map(() => 25).join(';')}` +
      `&access_token=${MAPBOX_TOKEN}`
    )
    
    const data = await response.json()
    
    if (data.matchings && data.matchings[0]) {
      const snapped = data.matchings[0].geometry.coordinates
        .map((coord: [number, number]) => ({
          latitude: coord[1],
          longitude: coord[0],
          snapped: true
        }))
      
      results.push(...snapped)
    }
  }
  
  return results
}
```

### Week 4: Android OEM Hell

**Day 1-2: OEM Detection + Guides**
```typescript
// File: lib/tracking/oem-optimization.ts

export function getDeviceOEM(): string {
  const { manufacturer } = Device.getInfo()
  return manufacturer.toLowerCase()
}

export const optimizationGuides = {
  xiaomi: [
    {
      title: 'Disable Battery Optimization',
      instruction: 'Settings → Apps → MotoMind → Battery Saver → No restrictions',
      deeplink: 'android.settings.BATTERY_OPTIMIZATION_SETTINGS'
    },
    {
      title: 'Enable Autostart',
      instruction: 'Settings → Apps → MotoMind → Autostart → Enable'
    },
    {
      title: 'Lock in Recent Apps',
      instruction: 'Recent Apps → Drag MotoMind down → Tap lock icon'
    }
  ],
  samsung: [
    {
      title: 'Disable Battery Optimization',
      instruction: 'Settings → Apps → MotoMind → Battery → Unrestricted'
    },
    {
      title: 'Add to Never Sleeping Apps',
      instruction: 'Settings → Battery → Never sleeping apps → Add MotoMind'
    }
  ],
  oneplus: [
    {
      title: 'Battery Optimization',
      instruction: 'Settings → Apps → MotoMind → Battery → Don\'t optimize'
    },
    {
      title: 'Recent Apps Lock',
      instruction: 'Recent Apps → MotoMind → Lock icon'
    }
  ]
}

// Show guide after first failed background session
export async function showOptimizationGuide() {
  const oem = getDeviceOEM()
  const steps = optimizationGuides[oem] || optimizationGuides.generic
  
  await showModal({
    title: 'Optimize Background Tracking',
    steps,
    actions: [
      { text: 'Show Me How', action: () => startGuidedSetup(steps) },
      { text: 'Later', action: 'dismiss' }
    ]
  })
}
```

**Day 3-4: Battery Governor**
```typescript
// File: lib/tracking/battery-governor.ts

export class BatteryGovernor {
  private level: number = 100
  private thermal: 'nominal' | 'fair' | 'serious' | 'critical' = 'nominal'
  
  async start() {
    // Monitor every minute
    setInterval(() => this.check(), 60000)
  }
  
  private async check() {
    this.level = await Battery.getLevel()
    this.thermal = await Device.getThermalState()
    
    await this.adjust()
  }
  
  private async adjust() {
    let mode
    
    if (this.level < 15 || this.thermal === 'critical') {
      // Emergency: Minimal tracking
      mode = { interval: 30000, accuracy: 50 }
    } else if (this.level < 30 || this.thermal === 'serious') {
      // Low: Reduced tracking
      mode = { interval: 10000, accuracy: 20 }
    } else {
      // Normal: Speed-based tracking
      return
    }
    
    console.log('Battery governor:', mode)
    await BackgroundGeolocation.configure(mode)
  }
}
```

**Day 5: Testing + Polish**

---

## 📅 WEEKS 5-6: CRASH DETECTION ⭐⭐⭐⭐☆

**Goal:** Crash detection with < 2% false positives

### Week 5: v0 (GPS-Only)

**Day 1-2: Speed Delta Detection**
```typescript
// File: lib/tracking/crash-detection-v0.ts

interface CrashConfig {
  enabled: boolean
  deltaVThreshold: number // m/s per second
}

export async function detectCrashV0(
  current: Location,
  previous: Location
): Promise<CrashCandidate | null> {
  const config = await RemoteConfig.get('crash_detection_v0')
  
  if (!config.enabled) return null
  
  const deltaV = Math.abs(current.speed - previous.speed)
  const deltaTime = (current.timestamp - previous.timestamp) / 1000
  const deltaVPerSecond = deltaV / deltaTime
  
  // Threshold: 7 m/s (~15.7 mph) in 1 second
  if (deltaVPerSecond >= config.deltaVThreshold) {
    return {
      type: 'crash_candidate',
      confidence: 0.6,
      deltaV,
      location: current,
      timestamp: Date.now()
    }
  }
  
  return null
}
```

**Day 3-4: User Confirmation Flow**
```typescript
// File: lib/tracking/crash-response.ts

export async function handleCrashCandidate(crash: CrashCandidate) {
  // Show alert with countdown
  const response = await showAlert({
    title: 'Are you OK?',
    message: 'We detected a possible crash',
    buttons: [
      { text: "I'm OK", value: 'ok' },
      { text: 'Call Emergency', value: 'emergency' },
      { text: 'Contact Family', value: 'contacts' }
    ],
    timeout: 60000,
    countdownMessage: 'Auto-alerting in {seconds}s'
  })
  
  // Log incident
  await logIncident(crash)
  
  if (response === 'ok') {
    await logFeedback(crash.id, 'false_positive')
  } else if (response === 'emergency') {
    await initiateEmergencyCall(crash.location)
  } else if (response === null) {
    await alertEmergencyContacts(crash)
  }
}
```

**Day 5: Remote Config + A/B Test**
```typescript
// Enable for 10% of users
await RemoteConfig.set('crash_detection_v0', {
  enabled: true,
  deltaVThreshold: 7.0,
  rolloutPercent: 10
})
```

### Week 6: v1 (Multi-Modal)

**Day 1-3: IMU Integration**
```typescript
// File: lib/tracking/crash-detection-v1.ts

export async function detectCrashV1(
  gps: GPSData,
  imu: IMUData
): Promise<CrashEvent | null> {
  const config = await RemoteConfig.get('crash_detection_v1')
  
  if (!config.enabled) return null
  
  // Check each modality
  const signals = {
    gps: gps.deltaV >= config.gpsThreshold,
    gForce: imu.gForce >= config.gForceThreshold,
    gyro: imu.rotation >= config.gyroThreshold,
    baro: imu.pressureChange >= config.baroThreshold
  }
  
  const count = Object.values(signals).filter(Boolean).length
  
  // Require 2+ modalities
  if (count < 2) return null
  
  // Pattern filtering
  if (isPothole(imu) || isSpeedBump(imu)) return null
  
  return {
    type: 'crash_likely',
    confidence: calculateConfidence(signals),
    signals,
    location: gps.location,
    timestamp: Date.now()
  }
}
```

**Day 4-5: Testing + Rollout**

---

## 📅 WEEKS 7-8: MAPS + CARPLAY ⭐⭐⭐☆☆

See existing `VEHICLE_TRACKING_GUIDE.md` for map implementation.

**Focus:**
- Mapbox integration
- Real-time polyline
- Speed heatmap
- CarPlay templates
- Android Auto templates

---

## 📅 WEEKS 9-12: ADVANCED FEATURES ⭐⭐⭐☆☆

### Week 9-10: Proximity Sensing

**iBeacon + Bluetooth car detection**

### Week 11-12: Mileage Proofs

See `MILEAGE_PROOF_SYSTEM.md` for complete implementation.

---

## 🎯 SUCCESS METRICS

| Metric | Week 2 Target | Week 4 Target | Week 12 Target |
|--------|---------------|---------------|----------------|
| Trip Detection | 98% | 99% | 99%+ |
| False Trips | < 5% | < 2% | < 1% |
| Battery (driving) | < 12%/hr | < 10%/hr | < 8%/hr |
| Battery (idle) | < 3%/day | < 2%/day | < 2%/day |
| Background Continuity | 90% | 95% | 98% |
| Crash Detection | N/A | 70% | 85% |
| Crash False Positive | N/A | < 5% | < 2% |

---

## 🚀 NEXT STEPS

1. ✅ Read `GPS_TRACKING_VISION.md` - Understand the vision
2. ✅ Read `GPS_TRACKING_ARCHITECTURE.md` - Technical deep-dive
3. ✅ Read this document - Implementation plan
4. 🎯 Start Week 1: iOS background tracking
5. 📱 Deploy TestFlight after Week 2
6. 🔄 Iterate based on real-world data

**Let's build vehicle intelligence.** 🚀
