# GPS Tracking Architecture - Technical Deep-Dive

**Last Updated:** October 18, 2024  
**Companion:** `GPS_TRACKING_VISION.md`, `GPS_TRACKING_IMPLEMENTATION.md`

---

## 🏗️ TIERED SENSING ARCHITECTURE

**Philosophy:** Use the minimum sensors needed to achieve the goal. Escalate only when necessary.

**Battery Budget:** < 10% per day (with 1 hour of driving)

```
┌─────────────────────────────────────────────────────┐
│ Tier 0: Passive Detection (0-1% battery/day)       │
│ • Significant Location Change (iOS)                 │
│ • Visits API (iOS)                                  │
│ • Activity Recognition (Android)                    │
│ • Wakes app when movement detected                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Tier 1: Trip Detection (2-3% battery/day)          │
│ • Multi-signal validation                           │
│ • Speed + displacement + activity                   │
│ • 60-120s pre-buffer ring                          │
│ • 99% accuracy, < 2% false positives               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Tier 2: Active Tracking (5-10% battery/hour)       │
│ • High-accuracy GPS                                 │
│ • Dynamic sampling (1-10s based on speed)          │
│ • Road snapping (Mapbox Map Matching)              │
│ • Path simplification (Douglas-Peucker)            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Tier 3: Event Detection (< 1% battery)             │
│ • Brief IMU bursts (50-100Hz for 3-5s)            │
│ • Crash detection (multi-modal)                    │
│ • Harsh braking/acceleration                       │
│ • Pattern filtering (pothole, speed bump)          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Tier 4: Geofencing (< 0.5% battery/day)           │
│ • OS-level region monitoring                        │
│ • Home/work/shop geofences                         │
│ • Automatic trip finalization                       │
│ • Wake app on entry/exit                           │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Tier 5: Proximity Sensing (1-2% battery/day)       │
│ • iBeacon (±1-5m accuracy)                         │
│ • Bluetooth car connection                          │
│ • Ultra-precise shop check-in                       │
│ • Car engine on/off detection                       │
└─────────────────────────────────────────────────────┘
```

---

## 📍 TIER 0: PASSIVE DETECTION

**Goal:** Wake app when user starts moving, without GPS polling

**Battery Cost:** < 1% per day  
**Accuracy:** ±500-1500m (coarse)  
**Latency:** 5-10 minutes typical

### iOS: Significant Location Change (SLC)

```typescript
import { BackgroundGeolocation } from '@capacitor-community/background-geolocation'

// Configure SLC mode
BackgroundGeolocation.addWatcher({
  backgroundMode: 'SIGNIFICANT_CHANGES',
  backgroundTitle: 'MotoMind is tracking your trips',
  requestPermissions: true,
  stale: false
}, (location) => {
  console.log('User moved significantly:', location)
  
  // Wake up and check if this is a trip
  analyzeMovement(location)
})
```

**How It Works:**
- OS monitors cell tower changes
- Fires when user moves ~500m
- Battery-efficient (hardware-level)
- Guaranteed wake-up

### iOS: Visits API

```typescript
// Monitor location visits
CLLocationManager.startMonitoringVisits()

CLLocationManager.didVisit = (visit) => {
  if (visit.departureDate) {
    // User left a location
    console.log('Departed from:', visit.coordinate)
    checkTripStart()
  }
  
  if (visit.arrivalDate && !visit.departureDate) {
    // User arrived at location
    console.log('Arrived at:', visit.coordinate)
    checkTripEnd()
  }
}
```

**How It Works:**
- OS tracks significant locations
- Fires on arrival/departure
- Learns user patterns over time
- Very battery-efficient

### Android: Activity Recognition

```typescript
import { ActivityRecognition } from '@capacitor-community/activity-recognition'

// Register for activity transitions
ActivityRecognition.registerTransition({
  transitions: [
    'IN_VEHICLE',  // User entered vehicle
    'STILL'        // User stopped moving
  ]
}, (transition) => {
  if (transition.activity === 'IN_VEHICLE') {
    console.log('User started driving')
    checkTripStart()
  } else if (transition.activity === 'STILL') {
    console.log('User stopped')
    checkTripEnd()
  }
})
```

**How It Works:**
- Uses accelerometer + gyroscope
- Detects activity type (driving, walking, still)
- Battery-efficient (hardware coprocessor)
- High confidence signal

---

## 🚗 TIER 1: TRIP DETECTION

**Goal:** 99% accuracy on trip start/stop, < 2% false positives

**Battery Cost:** 2-3% per day  
**Accuracy:** ±10-50m  
**Latency:** 30-60 seconds typical

### Trip Finite State Machine

```typescript
type TripState = 
  | 'idle'       // No trip active
  | 'candidate'  // Possible trip detected
  | 'driving'    // Trip confirmed and active
  | 'paused'     // Trip temporarily stopped (gas station)
  | 'stopped'    // Trip ended, waiting to finalize
  | 'finalized'  // Trip completed and saved

class TripStateMachine {
  private state: TripState = 'idle'
  private buffer: Location[] = []
  
  transition(event: TripEvent) {
    switch (this.state) {
      case 'idle':
        if (event === 'movement_detected') {
          this.state = 'candidate'
        }
        break
        
      case 'candidate':
        if (event === 'trip_confirmed') {
          this.state = 'driving'
          this.startHighAccuracyTracking()
        } else if (event === 'false_alarm') {
          this.state = 'idle'
        }
        break
        
      case 'driving':
        if (event === 'stopped_briefly') {
          this.state = 'paused'
        } else if (event === 'trip_ended') {
          this.state = 'stopped'
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
          this.finalizeTrip()
        } else if (event === 'movement_detected') {
          this.state = 'driving'
        }
        break
    }
  }
}
```

### Start Detection Algorithm

```typescript
interface TripStartConditions {
  activityChange: boolean    // Android: IN_VEHICLE
  significantMove: boolean   // iOS: SLC fired (>500m)
  speedThreshold: boolean    // Speed > 10 mph for 30s
  distanceThreshold: boolean // Moved > 150m from last stop
}

async function detectTripStart(): Promise<boolean> {
  const conditions: TripStartConditions = {
    activityChange: await checkActivityRecognition(),
    significantMove: await checkSignificantLocationChange(),
    speedThreshold: await checkSpeedThreshold(),
    distanceThreshold: await checkDistanceThreshold()
  }
  
  // Require 3 out of 4 conditions for high confidence
  const metConditions = Object.values(conditions)
    .filter(Boolean).length
  
  if (metConditions >= 3) {
    // High confidence trip started
    const confidence = metConditions / 4
    console.log(`Trip started with ${confidence * 100}% confidence`)
    
    // Escalate to high-accuracy tracking
    await startHighAccuracyTracking()
    
    // Capture pre-buffer (trip started 60-120s ago)
    await capturePreBuffer(60)
    
    return true
  }
  
  return false
}

// Individual condition checks
async function checkActivityRecognition(): Promise<boolean> {
  const activity = await ActivityRecognition.getCurrentActivity()
  return activity.type === 'IN_VEHICLE' && activity.confidence > 0.7
}

async function checkSignificantLocationChange(): Promise<boolean> {
  const lastLocation = await getLastLocation()
  const currentLocation = await getCurrentLocation()
  const distance = calculateDistance(lastLocation, currentLocation)
  return distance > 500 // meters
}

async function checkSpeedThreshold(): Promise<boolean> {
  const speeds = await getLastNSpeeds(30) // Last 30 seconds
  const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length
  return avgSpeed > 4.47 // 10 mph in m/s
}

async function checkDistanceThreshold(): Promise<boolean> {
  const lastStop = await getLastStopLocation()
  const currentLocation = await getCurrentLocation()
  const distance = calculateDistance(lastStop, currentLocation)
  return distance > 150 // meters
}
```

### Stop Detection Algorithm

```typescript
interface TripStopConditions {
  lowSpeed: boolean          // Speed < 1 mph for 2 min
  smallDisplacement: boolean // Moved < 10m in last 2 min
  engineOff: boolean         // Bluetooth disconnected
  geofenceArrival: boolean   // Entered home/work geofence
}

async function detectTripStop(): Promise<boolean> {
  const conditions: TripStopConditions = {
    lowSpeed: await checkLowSpeed(),
    smallDisplacement: await checkSmallDisplacement(),
    engineOff: await checkEngineOff(),
    geofenceArrival: await checkGeofenceArrival()
  }
  
  // Require 2 out of 4 conditions
  const metConditions = Object.values(conditions)
    .filter(Boolean).length
  
  if (metConditions >= 2) {
    // High confidence trip stopped
    const confidence = metConditions / 4
    console.log(`Trip stopped with ${confidence * 100}% confidence`)
    
    // Finalize trip (10 min idle confirms)
    await scheduleFinalization(600) // 10 minutes
    
    // Downgrade to passive tracking
    await stopHighAccuracyTracking()
    
    return true
  }
  
  return false
}
```

### Pre-Start Ring Buffer

**Critical for accuracy:** Don't lose the first minute of a trip.

```typescript
class TripBuffer {
  private buffer: Location[] = []
  private maxDuration: number = 120 // seconds
  private interval: number = 1000   // 1 second
  
  constructor() {
    // Always buffer (even when idle)
    setInterval(() => {
      this.addLocation()
    }, this.interval)
  }
  
  private async addLocation() {
    const location = await getCurrentLocation()
    
    this.buffer.push({
      ...location,
      timestamp: Date.now()
    })
    
    // Keep only last N seconds
    const cutoff = Date.now() - (this.maxDuration * 1000)
    this.buffer = this.buffer.filter(loc => 
      loc.timestamp > cutoff
    )
  }
  
  getPreBuffer(seconds: number = 60): Location[] {
    const cutoff = Date.now() - (seconds * 1000)
    return this.buffer.filter(loc => loc.timestamp > cutoff)
  }
  
  clear() {
    this.buffer = []
  }
}

// Usage
const tripBuffer = new TripBuffer()

async function startTrip() {
  // Get last 60-120 seconds of movement
  const preBuffer = tripBuffer.getPreBuffer(60)
  
  // Trip doesn't "start late" - we have historical data
  await savePreBuffer(preBuffer)
  
  // Continue with high-accuracy tracking
  await startHighAccuracyTracking()
}
```

---

## 📡 TIER 2: ACTIVE TRACKING

**Goal:** High-accuracy GPS with minimal battery drain

**Battery Cost:** 5-10% per hour  
**Accuracy:** ±5-10m  
**Data Size:** ~1-2 KB per minute (compressed)

### Dynamic Sampling Strategy

```typescript
interface TrackingMode {
  interval: number  // GPS polling interval (ms)
  accuracy: number  // Desired accuracy (meters)
  filter: number    // Distance filter (meters)
}

function getTrackingMode(speed: number): TrackingMode {
  if (speed > 50) {
    // Highway: Fast-changing position, less precision needed
    return { 
      interval: 5000,  // 5 seconds
      accuracy: 10,    // 10m
      filter: 20       // 20m filter
    }
  } else if (speed > 25) {
    // City: Moderate speed, good precision
    return { 
      interval: 3000,  // 3 seconds
      accuracy: 5,     // 5m
      filter: 10       // 10m filter
    }
  } else if (speed > 5) {
    // Slow: Parking/traffic, high precision
    return { 
      interval: 2000,  // 2 seconds
      accuracy: 5,     // 5m
      filter: 5        // 5m filter
    }
  } else {
    // Stopped: Traffic light, save battery
    return { 
      interval: 10000, // 10 seconds
      accuracy: 20,    // 20m
      filter: 20       // 20m filter
    }
  }
}

// Apply mode dynamically
let currentMode = getTrackingMode(0)
BackgroundGeolocation.configure(currentMode)

BackgroundGeolocation.on('location', (location) => {
  const speed = location.speed * 2.237 // Convert m/s to mph
  const newMode = getTrackingMode(speed)
  
  // Only reconfigure if mode changed
  if (newMode.interval !== currentMode.interval) {
    BackgroundGeolocation.configure(newMode)
    currentMode = newMode
    
    console.log(`Tracking mode changed to ${speed} mph`)
  }
})
```

### Road Snapping (Reduce GPS Jitter)

```typescript
// Use Mapbox Map Matching API
async function snapToRoad(locations: Location[]): Promise<Location[]> {
  // Build coordinate string
  const coordinates = locations
    .map(loc => `${loc.longitude},${loc.latitude}`)
    .join(';')
  
  // Call Mapbox API
  const response = await fetch(
    `https://api.mapbox.com/matching/v5/mapbox/driving/${coordinates}` +
    `?geometries=geojson` +
    `&radiuses=${locations.map(() => 25).join(';')}` + // 25m radius
    `&access_token=${MAPBOX_TOKEN}`
  )
  
  const data = await response.json()
  
  // Extract snapped coordinates
  const snapped = data.matchings[0].geometry.coordinates
    .map((coord: [number, number]) => ({
      latitude: coord[1],
      longitude: coord[0],
      snapped: true
    }))
  
  return snapped
}

// Benefits:
// - Reduces GPS jitter by 30-40%
// - Improves distance accuracy
// - Better visual presentation on map
// - Removes impossible positions (middle of buildings)
```

### Path Simplification (Reduce Storage)

```typescript
// Douglas-Peucker algorithm
function simplifyPath(
  points: Location[], 
  tolerance: number = 0.0001
): Location[] {
  if (points.length < 3) return points
  
  // Find point with maximum distance from line
  let maxDistance = 0
  let maxIndex = 0
  const end = points.length - 1
  
  for (let i = 1; i < end; i++) {
    const distance = perpendicularDistance(
      points[i],
      points[0],
      points[end]
    )
    
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = i
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance)
    const right = simplifyPath(points.slice(maxIndex), tolerance)
    
    // Concatenate results
    return [...left.slice(0, -1), ...right]
  }
  
  // All points between start and end can be removed
  return [points[0], points[end]]
}

// Adaptive tolerance based on speed
function getSimplificationTolerance(speed: number): number {
  if (speed > 60) {
    return 0.0005 // More aggressive on highway
  } else if (speed > 30) {
    return 0.0002 // Moderate in city
  } else {
    return 0.0001 // Precise in parking/slow
  }
}

// Result: 50-70% storage reduction
```

### Battery Governor

```typescript
class BatteryGovernor {
  private batteryLevel: number = 100
  private thermalState: 'nominal' | 'fair' | 'serious' | 'critical' = 'nominal'
  
  async monitorBattery() {
    // Update every minute
    setInterval(async () => {
      this.batteryLevel = await Battery.getLevel()
      this.thermalState = await Device.getThermalState()
      
      await this.adjustTracking()
    }, 60000)
  }
  
  private async adjustTracking() {
    let mode: TrackingMode
    
    // Critical battery - minimum tracking
    if (this.batteryLevel < 15) {
      mode = {
        interval: 30000,  // 30 seconds
        accuracy: 50,     // 50m
        filter: 50
      }
    }
    // Low battery - reduced tracking
    else if (this.batteryLevel < 30) {
      mode = {
        interval: 10000,  // 10 seconds
        accuracy: 20,     // 20m
        filter: 20
      }
    }
    // Device hot - reduce CPU
    else if (this.thermalState === 'serious' || this.thermalState === 'critical') {
      mode = {
        interval: 10000,
        accuracy: 20,
        filter: 20
      }
    }
    // Normal operation
    else {
      return // Use speed-based mode
    }
    
    console.log('Battery governor adjusting tracking:', mode)
    BackgroundGeolocation.configure(mode)
  }
}
```

---

## 💥 TIER 3: EVENT DETECTION

See `GPS_TRACKING_IMPLEMENTATION.md` for complete crash detection implementation.

**Key Points:**
- Multi-modal (GPS + IMU + barometer)
- Pattern filtering (potholes, speed bumps, railroad)
- Brief bursts only (< 1% battery)
- Remote-configurable thresholds
- A/B tested rollout

---

## 🗺️ TIER 4 & 5: GEOFENCING + PROXIMITY

See `GPS_TRACKING_IMPLEMENTATION.md` for complete implementation.

**Key Points:**
- OS-level geofencing (< 0.5% battery)
- iBeacon for shops (±1-5m accuracy)
- Bluetooth car connection detection
- Automatic trip finalization

---

## 📊 DATA PIPELINE

```
Raw GPS Points
     ↓
Speed-based sampling (1-10s intervals)
     ↓
Road snapping (Mapbox Map Matching)
     ↓
Path simplification (Douglas-Peucker)
     ↓
Compression (60-70% reduction)
     ↓
Local storage (IndexedDB)
     ↓
Batch sync to server (when online)
     ↓
Long-term storage (PostgreSQL)
```

**Data Size:**
- Raw: 5-10 KB/min
- Snapped: 3-7 KB/min
- Simplified: 1-2 KB/min
- Compressed: 0.5-1 KB/min

**1 hour of driving = ~30-60 KB final**

---

## 🎯 PERFORMANCE TARGETS

| Metric | Target | Current |
|--------|--------|---------|
| **Trip Start Accuracy** | 98%+ | TBD |
| **Trip Start Latency** | < 60s | TBD |
| **False Trip Rate** | < 2% | TBD |
| **Battery Drain (driving)** | < 10%/hour | TBD |
| **Battery Drain (idle)** | < 2%/day | TBD |
| **GPS Accuracy** | ±5-10m | ✅ Proven |
| **Background Continuity** | 95%+ | TBD |
| **Crash Detection Rate** | 80%+ | TBD |
| **Crash False Positive** | < 2% | TBD |

**Next:** See `GPS_TRACKING_IMPLEMENTATION.md` for week-by-week roadmap. 🚀
