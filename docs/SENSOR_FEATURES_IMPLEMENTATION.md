# Sensor Features Implementation - Quick Start Guide

**Last Updated:** October 18, 2024  
**Companion:** `SENSOR_FEATURES_VISION.md`, `TRIP_ROLE_CLASSIFIER.md`

---

## 🚀 IMPLEMENTATION PRIORITY

### Week 1: Quick Wins (Ship These First)
1. **Parking Pin** (2 days) - BT disconnect + ON_FOOT + geofence
2. **Refuel Detection** (3 days) - Fuel POI + dwell time + OCR
3. **Drive Mode** (1 day) - Charging + landscape + car BT
4. **Harsh Events** (2 days) - IMU spikes + GPS delta-v

### Week 2: Safety & Trust
5. **"Arrived Home Safe"** (1 day) - Home geofence + night + no crash
6. **Steep Grade Alerts** (2 days) - Barometer + elevation + braking
7. **Garage Auto-Open** (1 day) - iBeacon + speed + geofence
8. **Storm Alerts** (1 day) - Weather API + location

### Week 3: Optimization
9. **Tire Pressure Nudge** (2 days) - Roughness + MPG + temperature
10. **Trip Purpose Tags** (2 days) - Time + geofence + patterns
11. **Battery Governor** (1 day) - Battery % + thermal state
12. **Drive Style Score** (2 days) - IMU + GPS + patterns

---

## 📱 QUICK WIN #1: PARKING PIN

### Detection Logic
```typescript
// lib/parking/detector.ts
async function detectParking(): Promise<ParkingEvent | null> {
  const signals = []
  let confidence = 0
  
  // Car BT disconnected
  if (await isCarBluetoothDisconnected()) {
    confidence += 0.4
    signals.push('car_bt_disconnect')
  }
  
  // Activity: ON_FOOT
  if (await isActivityOnFoot()) {
    confidence += 0.3
    signals.push('on_foot')
  }
  
  // Left vehicle geofence
  if (await hasLeftVehicleGeofence()) {
    confidence += 0.3
    signals.push('left_geofence')
  }
  
  if (signals.length >= 2 && confidence >= 0.7) {
    return { location, timestamp, address, confidence, signals }
  }
  
  return null
}
```

### Background Service
```typescript
// lib/parking/service.ts
export class ParkingService {
  async start() {
    setInterval(() => this.check(), 30000)
    
    BluetoothLE.on('disconnected', device => {
      if (device.type === 'car_audio') this.check()
    })
    
    BackgroundGeolocation.on('geofence', event => {
      if (event.action === 'EXIT') this.check()
    })
  }
  
  private async check() {
    const parking = await detectParking()
    if (parking) {
      await saveParkingSpot(parking)
      showNotification({ title: 'Parked', body: parking.address })
    }
  }
}
```

### UI Component
```typescript
// components/parking/WalkBackTrail.tsx
export function WalkBackTrail({ spot, currentLocation }) {
  const distance = calculateDistance(currentLocation, spot.location)
  
  return (
    <Map center={currentLocation} zoom={16}>
      <Marker position={currentLocation} icon="user" color="blue" />
      <Marker position={spot.location} icon="car" color="green" />
      <Polyline
        points={[currentLocation, spot.location]}
        strokeColor="#4A90E2"
        strokeDasharray="10 5"
      />
      <Text>{formatDistance(distance)} away</Text>
    </Map>
  )
}
```

---

## ⛽ QUICK WIN #2: REFUEL DETECTION

### Detection Logic
```typescript
// lib/refuel/detector.ts
async function detectRefuel(tripPause: TripPause): Promise<RefuelCandidate | null> {
  let confidence = 0
  
  // At gas station
  const pois = await searchNearbyPOIs(tripPause.location, 50)
  const isGasStation = pois.some(p => p.category === 'fuel')
  if (isGasStation) confidence += 0.5
  else return null
  
  // Dwell time (3-7 min typical)
  const dwellTime = tripPause.duration
  if (dwellTime >= 180000 && dwellTime <= 420000) confidence += 0.3
  
  // Activity: ON_FOOT
  if (await getActivity() === 'ON_FOOT') confidence += 0.2
  
  return confidence >= 0.7 ? { location, timestamp, confidence } : null
}
```

### OCR Extraction
```typescript
// lib/refuel/ocr.ts
async function extractRefuelData(photo: Photo): Promise<RefuelData> {
  const ocrText = await GoogleVision.detectText(photo.path)
  
  const prompt = `Extract from receipt: ${ocrText}
    Return JSON: { gallons, pricePerGallon, totalCost, fuelGrade, station }`
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [{ role: 'user', content: [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: photo.dataUrl } }
    ]}]
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

### MPG Calculation
```typescript
// lib/refuel/mpg.ts
async function calculateMPG(vehicleId: string, gallons: number, currentOdo: number) {
  const lastRefuel = await getLastRefuel(vehicleId)
  const miles = currentOdo - lastRefuel.odometer
  const mpg = miles / gallons
  
  const vehicle = await getVehicle(vehicleId)
  const epa = vehicle.specs.fuelEconomy.combined
  const percentOfEPA = (mpg / epa) * 100
  
  return { mpg, miles, gallons, percentOfEPA, epa }
}
```

---

## 🚗 QUICK WIN #3: DRIVE MODE AUTO-SWITCH

### Detection
```typescript
// lib/drive-mode/detector.ts
async function detectDocked(): Promise<boolean> {
  let score = 0
  
  if ((await Device.getBatteryInfo()).isCharging) score += 35
  if (await hasCarBluetooth()) score += 35
  if ((await Device.getOrientation()) === 'landscape') score += 20
  if (await getCarPlaySession().connected) score += 10
  
  return score >= 60
}
```

### Auto-Switch Service
```typescript
// lib/drive-mode/service.ts
export class DriveModeService {
  start() {
    setInterval(async () => {
      const docked = await detectDocked()
      const hasTrip = await hasActiveTrip()
      
      if (docked && hasTrip && appState.mode !== 'drive') {
        appState.mode = 'drive'
        KeepAwake.keepAwake()
      } else if (!docked && appState.mode === 'drive') {
        appState.mode = 'normal'
        KeepAwake.allowSleep()
      }
    }, 5000)
  }
}
```

### Drive View UI
```typescript
// components/DriveView.tsx
export function DriveView({ trip, onEndTrip, onSOS }) {
  return (
    <div className="h-screen bg-black text-white">
      <div className="text-9xl font-bold text-center">
        {Math.round(trip.currentSpeed)}
        <div className="text-4xl text-gray-400">mph</div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-2xl">
        <Stat label="Distance" value={`${trip.distance.toFixed(1)} mi`} />
        <Stat label="Time" value={formatDuration(trip.duration)} />
        <Stat label="Avg" value={`${trip.avgSpeed} mph`} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={onEndTrip} size="xl">End Trip</Button>
        <Button onClick={onSOS} variant="destructive" size="xl">SOS</Button>
      </div>
    </div>
  )
}
```

---

## 💥 QUICK WIN #4: HARSH EVENTS

### Detection
```typescript
// lib/harsh-events/detector.ts
async function detectHarshEvent(imu: IMUData, gps: GPSData): Promise<HarshEvent | null> {
  const jerk = calculateJerk(imu.acceleration)
  const gForce = calculateGForce(imu.acceleration)
  const deltaV = Math.abs(gps.currentSpeed - gps.previousSpeed)
  
  // Pothole: short, sharp impact
  if (jerk > 15 && gForce > 1.5 && imu.duration < 500) {
    return { type: 'pothole', location: gps.location, gForce, severity: gForce > 2.5 ? 'high' : 'medium' }
  }
  
  // Rough road: sustained vibration
  if (gForce > 2.0 && imu.duration > 2000) {
    return { type: 'rough_road', location: gps.location, gForce, severity: 'medium' }
  }
  
  // Harsh brake: speed drop without high G
  if (deltaV > 5 && deltaV < 10 && gForce < 1.0) {
    return { type: 'harsh_brake', location: gps.location, gForce, severity: 'low' }
  }
  
  return null
}
```

### Road Quality Clustering
```typescript
// lib/harsh-events/clustering.ts
async function clusterEvents(events: HarshEvent[]): Promise<RoadQualityCluster[]> {
  // DBSCAN: group events within 50m
  const clusters = DBSCAN(events, { epsilon: 50, minPoints: 3 })
  
  return clusters.map(cluster => ({
    location: centroid(cluster.points),
    count: cluster.points.length,
    avgSeverity: average(cluster.points.map(p => p.gForce)),
    roadName: await reverseGeocode(centroid(cluster.points))
  }))
}
```

### Heatmap UI
```typescript
// components/RoadQualityMap.tsx
export function RoadQualityMap({ clusters }) {
  return (
    <Map>
      {clusters.map(cluster => (
        <Circle
          key={cluster.id}
          center={cluster.location}
          radius={25}
          fillColor={getSeverityColor(cluster.avgSeverity)}
          fillOpacity={0.5}
        />
      ))}
    </Map>
  )
}
```

---

## 🏠 SAFETY FEATURE: ARRIVED HOME SAFE

### Detection
```typescript
// lib/safety/home-arrival.ts
async function detectSafeArrival(trip: Trip): Promise<boolean> {
  const isHome = trip.endLocation.id === 'home'
  const isNight = isNightTime(trip.startedAt, trip.endedAt)
  const noCrash = !trip.events.some(e => e.type === 'crash_candidate')
  
  return isHome && isNight && noCrash
}

// Show notification
if (await detectSafeArrival(trip)) {
  showNotification({
    title: 'Arrived Home Safe',
    message: 'Tap to let them know',
    actions: [{
      text: 'Share with Mom',
      action: () => sendSMS({ to: user.emergencyContacts.mom, message: 'Just got home safe! 🏠' })
    }]
  })
}
```

---

## 🏔️ MAINTENANCE: STEEP GRADE INSIGHTS

### Detection
```typescript
// lib/maintenance/mountain-driving.ts
async function analyzeMountainDriving(trip: Trip): Promise<Insights | null> {
  const elevationGain = trip.path.reduce((gain, point, i) => {
    if (i === 0) return 0
    const delta = point.altitude - trip.path[i-1].altitude
    return gain + (delta > 0 ? delta : 0)
  }, 0)
  
  const steepGrades = trip.path.filter((point, i) => {
    if (i === 0) return false
    const delta = point.altitude - trip.path[i-1].altitude
    const distance = calculateDistance(point, trip.path[i-1])
    const grade = (delta / distance) * 100
    return Math.abs(grade) > 6
  })
  
  if (elevationGain > 1000 || steepGrades.length > 10) {
    return {
      type: 'mountain_driving',
      elevationGain,
      steepGradesCount: steepGrades.length,
      recommendation: 'Inspect brake pads earlier than usual'
    }
  }
  
  return null
}
```

---

## 🔋 BATTERY GOVERNOR

### Implementation
```typescript
// lib/tracking/battery-governor.ts
export class BatteryGovernor {
  async adjust() {
    const level = await Battery.getLevel()
    const thermal = await Device.getThermalState()
    
    let mode
    
    if (level < 15 || thermal === 'critical') {
      mode = { interval: 30000, accuracy: 50 } // Emergency
    } else if (level < 30 || thermal === 'serious') {
      mode = { interval: 10000, accuracy: 20 } // Low battery
    } else {
      return // Use speed-based mode
    }
    
    await BackgroundGeolocation.configure(mode)
  }
}
```

---

## 📊 TESTING STRATEGY

### Unit Tests
```typescript
describe('Parking Detection', () => {
  it('detects parking with BT + ON_FOOT + geofence', async () => {
    mockCarBluetoothDisconnected()
    mockActivityOnFoot()
    mockLeftGeofence()
    
    const result = await detectParking()
    expect(result).toBeTruthy()
    expect(result.confidence).toBeGreaterThan(0.7)
  })
})
```

### Integration Tests
```typescript
describe('Refuel Flow', () => {
  it('detects refuel and extracts data', async () => {
    const pause = createTripPause({ location: gasStationLocation, duration: 300000 })
    const candidate = await detectRefuel(pause)
    expect(candidate).toBeTruthy()
    
    const photo = await mockReceiptPhoto()
    const data = await extractRefuelData(photo)
    expect(data.gallons).toBeGreaterThan(0)
    expect(data.totalCost).toBeGreaterThan(0)
  })
})
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Shipping
- [ ] Shadow mode (2 weeks) - collect data, don't act
- [ ] A/B test (10% users) - measure false positives
- [ ] User feedback - "Was this accurate?" on every feature
- [ ] Remote config - all thresholds tunable
- [ ] Kill switch - disable feature remotely if issues
- [ ] Performance check - < 10% battery drain total

### Launch Criteria
- False positive rate < 5%
- User satisfaction > 80%
- Battery drain < 10%/day
- Crash rate < 0.1%
- Response time < 2s

---

## 📈 SUCCESS METRICS

### Feature-Specific
- **Parking Pin:** 90%+ users find car on first try
- **Refuel:** 95%+ OCR accuracy vs manual entry
- **Drive Mode:** 80%+ users prefer auto-switch
- **Harsh Events:** < 3% false positive rate

### Overall
- Daily Active Users: 30%
- Weekly Active Users: 70%
- Feature engagement: 50%+ use at least one sensor feature/week
- Battery complaints: < 2% of users
- Retention: 80%+ at 6 months

---

**Next:** See `TRIP_ROLE_CLASSIFIER.md` for passenger/transit detection. 🚀
