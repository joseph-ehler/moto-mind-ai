# Trip Role Classifier - Automagic Without Annoyance

**Last Updated:** October 18, 2024  
**Companion:** `SENSOR_FEATURES_VISION.md`, `SENSOR_FEATURES_IMPLEMENTATION.md`  
**Philosophy:** "Let the phone decide quietly, with humility"

---

## 🎯 THE PROBLEM

### Common Misclassifications
- User takes bus → App logs it as driving
- User is passenger → Counts toward odometer
- Household shares car → Both users log same trip
- User takes train → Shows as "impossible speed" trip
- User takes Uber → Incorrectly attributed to user's vehicle

### Current Solutions (All Bad)
1. **Manual classification** - Users hate it, low compliance
2. **Prompt every time** - Annoying, high abandonment
3. **Ignore it** - Bad data, angry users

---

## 💡 THE SOLUTION

### Core Principles
1. **High confidence = Silent** - Auto-label with 70%+ confidence, no prompt
2. **Low confidence = Optional** - One-tap fix, never push notification
3. **Always reversible** - Easy to change later
4. **Constantly learning** - Gets better with each correction

### The Promise
> **98%+ accuracy after 2 weeks, without ever annoying the user**

---

## 🔬 SIGNAL-BASED CLASSIFICATION

### Scoring System

```typescript
// File: lib/trip-role/classifier.ts

interface TripRole {
  role: 'driver' | 'passenger' | 'bus' | 'rail' | 'subway' | 'unknown'
  confidence: number // 0-1
  signals: string[]
  reasoning: string
}

async function classifyTripRole(trip: Trip): Promise<TripRole> {
  let score = 0
  const signals = []
  
  // === VEHICLE PRESENCE SIGNALS (strongest) ===
  
  // Car Bluetooth connected (+35 points)
  const carBT = await getCarBluetoothConnection()
  if (carBT.connected && carBT.deviceId === trip.vehicle.pairedBluetoothId) {
    score += 35
    signals.push('car_bluetooth_connected')
  }
  
  // OBD-II connected (+40 points - highest confidence)
  const obd = await getOBDConnection()
  if (obd.connected && obd.vin === trip.vehicle.vin) {
    score += 40
    signals.push('obd_connected')
  }
  
  // Vehicle iBeacon detected (+30 points)
  const beacon = await getVehicleBeacon(trip.vehicle.beaconUUID)
  if (beacon.detected && beacon.proximity === 'immediate') {
    score += 30
    signals.push('vehicle_beacon')
  }
  
  // === DEVICE CONTEXT SIGNALS ===
  
  // CarPlay / Android Auto active (+25 points)
  const carPlay = await getCarPlaySession()
  if (carPlay.active) {
    score += 25
    signals.push('carplay_active')
  }
  
  // Device stability (phone in mount)
  const stability = calculateDeviceStability(trip.imuData)
  if (stability > 0.8) {
    score += 15
    signals.push('device_mounted')
  } else if (stability < 0.3) {
    score -= 10
    signals.push('device_handled_frequently')
  }
  
  // === HISTORICAL PATTERNS ===
  
  // This user typically drives this vehicle at this time
  const historicalDriver = await getPrimaryDriver(
    trip.vehicle.id,
    trip.startedAt,
    { dayOfWeek: getDayOfWeek(trip.startedAt), hour: getHour(trip.startedAt) }
  )
  if (historicalDriver?.userId === currentUser.id) {
    score += 10
    signals.push('usual_driver')
  } else if (historicalDriver && historicalDriver.userId !== currentUser.id) {
    score -= 10
    signals.push('not_usual_driver')
  }
  
  // === TRANSIT DETECTION (negative signals) ===
  
  // Rail pattern detection
  const railMatch = await matchRailRoute(trip.path)
  if (railMatch.confidence > 0.8) {
    score -= 40
    signals.push('rail_pattern')
    signals.push(`rail_line_${railMatch.lineName}`)
  }
  
  // Bus pattern detection
  const busMatch = await matchBusRoute(trip.path)
  if (busMatch.confidence > 0.7) {
    score -= 30
    signals.push('bus_pattern')
    signals.push(`bus_route_${busMatch.routeNumber}`)
  }
  
  // Subway pattern (GPS loss + station clusters)
  const subwayMatch = await matchSubwayRoute(trip.path)
  if (subwayMatch.confidence > 0.8) {
    score -= 40
    signals.push('subway_pattern')
    signals.push(`subway_line_${subwayMatch.lineName}`)
  }
  
  // === PLACE PATTERNS ===
  
  // Commute pattern (home → work)
  if (trip.startLocation.type === 'home_garage' && 
      trip.endLocation.type === 'work_garage') {
    score += 10
    signals.push('commute_pattern')
  }
  
  // Transit hub (station, terminal)
  if (trip.startLocation.type === 'transit_hub' || 
      trip.endLocation.type === 'transit_hub') {
    score -= 15
    signals.push('transit_hub')
  }
  
  // === DETERMINE ROLE ===
  
  let role: TripRole['role']
  let confidence: number
  let reasoning: string
  
  if (score >= 35) {
    // High confidence driver
    role = 'driver'
    confidence = Math.min(score / 100, 1.0)
    reasoning = `Strong vehicle signals: ${signals.filter(s => 
      s.includes('bluetooth') || s.includes('obd') || s.includes('beacon')
    ).join(', ')}`
  } else if (score <= -25) {
    // Transit or passenger
    if (signals.includes('rail_pattern')) {
      role = 'rail'
      reasoning = `Matched rail line: ${signals.find(s => s.startsWith('rail_line_'))}`
    } else if (signals.includes('bus_pattern')) {
      role = 'bus'
      reasoning = `Matched bus route: ${signals.find(s => s.startsWith('bus_route_'))}`
    } else if (signals.includes('subway_pattern')) {
      role = 'subway'
      reasoning = `Matched subway line: ${signals.find(s => s.startsWith('subway_line_'))}`
    } else {
      role = 'passenger'
      reasoning = 'No vehicle signals detected, likely passenger'
    }
    confidence = Math.min(Math.abs(score) / 100, 1.0)
  } else {
    // Low confidence - needs user input
    role = 'unknown'
    confidence = 0.5
    reasoning = 'Mixed signals, unable to determine role confidently'
  }
  
  return { role, confidence, signals, reasoning }
}
```

---

## 🚆 TRANSIT PATTERN DETECTION

### Rail Detection

```typescript
// lib/trip-role/transit/rail-detector.ts

interface RailMatch {
  confidence: number
  lineName: string
  stationsMatched: string[]
}

async function matchRailRoute(path: Location[]): Promise<RailMatch | null> {
  // Pattern: long high-speed runs, minimal lateral jerk, periodic stops
  
  // 1. Check speed profile
  const avgSpeed = average(path.map(p => p.speed))
  const maxSpeed = Math.max(...path.map(p => p.speed))
  
  if (avgSpeed < 30 || maxSpeed < 60) {
    return null // Too slow for rail
  }
  
  // 2. Check path straightness (minimal lateral movement)
  const lateralJerk = calculateLateralJerk(path)
  if (lateralJerk > 5) {
    return null // Too much lateral movement
  }
  
  // 3. Check for periodic stops (station pattern)
  const stops = detectStops(path)
  if (stops.length < 3) {
    return null // Not enough stops
  }
  
  // 4. Match to known rail lines (if GTFS data available)
  const railLines = await loadRailLinesGTFS()
  
  for (const line of railLines) {
    const matchedStations = []
    
    for (const stop of stops) {
      const nearbyStations = line.stations.filter(station => 
        calculateDistance(stop.location, station.location) < 100 // Within 100m
      )
      
      if (nearbyStations.length > 0) {
        matchedStations.push(nearbyStations[0].name)
      }
    }
    
    // If matched 70%+ of stops to this line's stations
    const matchRate = matchedStations.length / stops.length
    if (matchRate >= 0.7) {
      return {
        confidence: matchRate,
        lineName: line.name,
        stationsMatched: matchedStations
      }
    }
  }
  
  // No specific line matched, but pattern looks like rail
  if (stops.length >= 5 && avgSpeed > 40 && lateralJerk < 3) {
    return {
      confidence: 0.8,
      lineName: 'Unknown Rail Line',
      stationsMatched: []
    }
  }
  
  return null
}
```

### Bus Detection

```typescript
// lib/trip-role/transit/bus-detector.ts

interface BusMatch {
  confidence: number
  routeNumber: string
  stopsMatched: number
}

async function matchBusRoute(path: Location[]): Promise<BusMatch | null> {
  // Pattern: surface speeds, frequent stops, follows roads
  
  // 1. Check speed profile
  const avgSpeed = average(path.map(p => p.speed))
  const maxSpeed = Math.max(...path.map(p => p.speed))
  
  if (avgSpeed < 10 || avgSpeed > 45) {
    return null // Outside typical bus speed range
  }
  
  // 2. Check stop frequency
  const stops = detectStops(path)
  const avgStopInterval = calculateAvgStopInterval(stops)
  
  if (avgStopInterval < 60000 || avgStopInterval > 300000) {
    return null // Stop cadence doesn't match bus (1-5 min typical)
  }
  
  // 3. Match to known bus routes (if GTFS data available)
  const busRoutes = await loadBusRoutesGTFS()
  
  for (const route of busRoutes) {
    let stopsMatched = 0
    
    for (const stop of stops) {
      const nearbyBusStops = route.stops.filter(busStop => 
        calculateDistance(stop.location, busStop.location) < 50 // Within 50m
      )
      
      if (nearbyBusStops.length > 0) {
        stopsMatched++
      }
    }
    
    // If matched 60%+ of stops to this route
    const matchRate = stopsMatched / stops.length
    if (matchRate >= 0.6) {
      return {
        confidence: matchRate,
        routeNumber: route.number,
        stopsMatched
      }
    }
  }
  
  // No specific route matched, but pattern looks like bus
  if (stops.length >= 4 && avgStopInterval >= 90000 && avgStopInterval <= 240000) {
    return {
      confidence: 0.7,
      routeNumber: 'Unknown',
      stopsMatched: stops.length
    }
  }
  
  return null
}
```

### Subway Detection

```typescript
// lib/trip-role/transit/subway-detector.ts

interface SubwayMatch {
  confidence: number
  lineName: string
  stationsMatched: string[]
}

async function matchSubwayRoute(path: Location[]): Promise<SubwayMatch | null> {
  // Pattern: long GPS loss underground, station clusters at entry/exit
  
  // 1. Detect GPS loss periods
  const gpsLossPeriods = detectGPSLoss(path)
  
  // Need at least one significant underground period
  const hasLongGPSLoss = gpsLossPeriods.some(period => 
    period.duration > 120000 // >2 min GPS loss
  )
  
  if (!hasLongGPSLoss) {
    return null
  }
  
  // 2. Detect station clusters (where GPS reappears)
  const stations = []
  
  for (let i = 0; i < gpsLossPeriods.length; i++) {
    const period = gpsLossPeriods[i]
    
    // Look for point clusters before and after GPS loss
    const entryCluster = findCluster(path, period.startIndex - 10, period.startIndex)
    const exitCluster = findCluster(path, period.endIndex, period.endIndex + 10)
    
    if (entryCluster) stations.push(entryCluster.center)
    if (exitCluster) stations.push(exitCluster.center)
  }
  
  if (stations.length < 2) {
    return null
  }
  
  // 3. Match to known subway lines
  const subwayLines = await loadSubwayLinesGTFS()
  
  for (const line of subwayLines) {
    const matchedStations = []
    
    for (const station of stations) {
      const nearbySubwayStations = line.stations.filter(subwayStation => 
        calculateDistance(station, subwayStation.location) < 200 // Within 200m
      )
      
      if (nearbySubwayStations.length > 0) {
        matchedStations.push(nearbySubwayStations[0].name)
      }
    }
    
    // If matched 60%+ of stations
    const matchRate = matchedStations.length / stations.length
    if (matchRate >= 0.6) {
      return {
        confidence: matchRate,
        lineName: line.name,
        stationsMatched: matchedStations
      }
    }
  }
  
  // No specific line matched, but pattern looks like subway
  if (gpsLossPeriods.length >= 2 && stations.length >= 3) {
    return {
      confidence: 0.8,
      lineName: 'Unknown Subway Line',
      stationsMatched: []
    }
  }
  
  return null
}
```

---

## 🏠 HOUSEHOLD LOGIC

### Multi-User Vehicle Sharing

```typescript
// lib/trip-role/household/resolver.ts

interface TripOwnership {
  primaryUserId: string
  secondaryUserId?: string
  confidence: number
  resolution: 'auto' | 'manual'
}

async function resolveHouseholdOwnership(
  trip: Trip,
  householdMembers: User[]
): Promise<TripOwnership> {
  // Get all users who recorded a trip for this VIN at this time
  const overlappingTrips = await db.trips
    .where('vehicleId')
    .equals(trip.vehicleId)
    .filter(t => 
      Math.abs(t.startedAt - trip.startedAt) < 300000 // Within 5 min
    )
    .toArray()
  
  if (overlappingTrips.length === 1) {
    // Only one user recorded this trip
    return {
      primaryUserId: trip.userId,
      confidence: 1.0,
      resolution: 'auto'
    }
  }
  
  // Multiple users claim the same trip
  const scores = overlappingTrips.map(t => ({
    userId: t.userId,
    score: scoreDriverConfidence(t)
  }))
  
  scores.sort((a, b) => b.score - a.score)
  
  const driver = scores[0]
  const passenger = scores[1]
  
  // Clear winner (>20 point difference)
  if (driver.score - passenger.score > 20) {
    return {
      primaryUserId: driver.userId,
      secondaryUserId: passenger.userId,
      confidence: 0.9,
      resolution: 'auto'
    }
  }
  
  // Close call - flag for user review
  return {
    primaryUserId: driver.userId,
    secondaryUserId: passenger.userId,
    confidence: 0.5,
    resolution: 'manual'
  }
}

function scoreDriverConfidence(trip: Trip): number {
  let score = 0
  
  if (trip.signals.includes('obd_connected')) score += 40
  if (trip.signals.includes('car_bluetooth_connected')) score += 35
  if (trip.signals.includes('carplay_active')) score += 25
  if (trip.signals.includes('vehicle_beacon')) score += 30
  if (trip.signals.includes('device_mounted')) score += 15
  if (trip.signals.includes('usual_driver')) score += 10
  
  return score
}
```

---

## 🎨 UI: ONE-TAP FIX (NO NAGS)

### Trip Card with Classification

```typescript
// components/trips/TripCard.tsx

interface TripCardProps {
  trip: Trip
  onRoleChange: (newRole: TripRole['role']) => void
}

export function TripCard({ trip, onRoleChange }: TripCardProps) {
  const [role, setRole] = useState(trip.role)
  const showClassification = trip.roleConfidence < 0.7
  
  const handleRoleChange = (newRole: TripRole['role']) => {
    setRole(newRole)
    onRoleChange(newRole)
    
    // Learn from correction
    trackUserCorrection({
      tripId: trip.id,
      originalRole: trip.role,
      correctedRole: newRole,
      signals: trip.signals
    })
  }
  
  return (
    <Card>
      <CardHeader>
        <Flex justify="between" align="center">
          <Stack spacing="xs">
            <Heading level={4}>
              {formatTripTitle(trip)}
            </Heading>
            <Text size="sm" color="muted">
              {formatDistance(trip.distance)} • {formatDuration(trip.duration)}
            </Text>
          </Stack>
          
          {/* Show classification pill only if low confidence */}
          {showClassification && (
            <Flex gap="xs">
              <Button
                size="sm"
                variant={role === 'driver' ? 'default' : 'outline'}
                onClick={() => handleRoleChange('driver')}
              >
                Driver
              </Button>
              
              <Button
                size="sm"
                variant={role === 'passenger' ? 'default' : 'outline'}
                onClick={() => handleRoleChange('passenger')}
              >
                Passenger
              </Button>
              
              {trip.signals.some(s => s.includes('rail') || s.includes('bus') || s.includes('subway')) && (
                <Button
                  size="sm"
                  variant={['rail', 'bus', 'subway'].includes(role) ? 'default' : 'outline'}
                  onClick={() => {
                    // Show dropdown with transit options
                    showTransitOptions(['rail', 'bus', 'subway'])
                  }}
                >
                  Transit
                </Button>
              )}
            </Flex>
          )}
        </Flex>
      </CardHeader>
      
      <CardContent>
        {/* Trip details */}
        <Stack spacing="md">
          <TripMap path={trip.path} />
          
          <Grid columns={2} gap="sm">
            <Stat label="Start" value={formatAddress(trip.startLocation)} />
            <Stat label="End" value={formatAddress(trip.endLocation)} />
            <Stat label="Avg Speed" value={`${trip.avgSpeed} mph`} />
            <Stat label="Max Speed" value={`${trip.maxSpeed} mph`} />
          </Grid>
          
          {/* Show role reasoning if available */}
          {trip.reasoning && (
            <Alert variant="info">
              <Text size="sm">{trip.reasoning}</Text>
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
```

### Copy Guidelines (Non-Accusatory)

```typescript
// Gentle, non-judgmental language
const ROLE_PROMPTS = {
  lowConfidence: {
    driver_or_passenger: "Was this you driving?",
    transit_detected: "Looks like public transit. Was this correct?",
    household_conflict: "Who was driving?"
  },
  
  confirmations: {
    driver: "Marked as driver",
    passenger: "Marked as passenger",
    rail: "Marked as rail",
    bus: "Marked as bus",
    subway: "Marked as subway"
  },
  
  reasoning: {
    high_confidence_driver: "Strong vehicle signals detected",
    high_confidence_transit: "Matched known transit route",
    low_confidence: "Mixed signals - please confirm"
  }
}
```

---

## 📊 LEARNING SYSTEM

### Correction Tracking

```typescript
// lib/trip-role/learning.ts

interface UserCorrection {
  tripId: string
  originalRole: TripRole['role']
  correctedRole: TripRole['role']
  signals: string[]
  timestamp: number
  vehicleId: string
  userId: string
}

async function trackUserCorrection(correction: UserCorrection) {
  // Save correction
  await db.roleCorrections.add(correction)
  
  // Update historical patterns
  await updateHistoricalPatterns(correction)
  
  // Adjust signal weights
  await adjustSignalWeights(correction)
}

async function updateHistoricalPatterns(correction: UserCorrection) {
  const trip = await db.trips.get(correction.tripId)
  
  // Update driver probability for this vehicle/time/context
  await db.driverProbabilities.put({
    vehicleId: correction.vehicleId,
    userId: correction.userId,
    dayOfWeek: getDayOfWeek(trip.startedAt),
    hour: getHour(trip.startedAt),
    startLocationType: trip.startLocation.type,
    probability: correction.correctedRole === 'driver' ? 1.0 : 0.0
  })
}

async function adjustSignalWeights(correction: UserCorrection) {
  // If we got it wrong, adjust signal weights
  if (correction.originalRole !== correction.correctedRole) {
    const weights = await getSignalWeights(correction.vehicleId)
    
    // Decrease confidence in signals that led to wrong classification
    for (const signal of correction.signals) {
      weights[signal] = Math.max(0, weights[signal] - 0.1)
    }
    
    await saveSignalWeights(correction.vehicleId, weights)
  }
}
```

---

## 📈 SUCCESS METRICS

### Classification Accuracy
- **Week 1:** 85% accuracy (learning phase)
- **Week 2:** 95% accuracy (patterns learned)
- **Week 4:** 98% accuracy (fully trained)

### User Annoyance
- **Prompts per week:** Median = 0, Max = 2
- **Correction rate:** < 3% of trips after week 2
- **Support tickets:** Near zero about "wrong trips"

### Odometer Integrity
- **Driver trips:** 100% counted toward odometer
- **Passenger/transit:** 0% counted (unless manually overridden)
- **Mileage accuracy:** 99.9%+ (validated against manual logs)

---

## 🚀 SHIPPING STRATEGY

### Phase 1: Shadow Mode (Week 1-2)
- Classify all trips silently
- Don't show classification UI
- Collect data on accuracy
- Measure false positive rate

### Phase 2: Soft Launch (Week 3-4)
- Show classification pills on low-confidence trips only
- Track user corrections
- Adjust weights based on feedback
- A/B test: 10% of users

### Phase 3: Full Launch (Week 5+)
- Roll out to 100% of users
- Continuous learning from corrections
- Monthly accuracy reports
- Feature flag for instant disable if issues

---

## 🎊 THE BOTTOM LINE

**What You Get:**
- 98%+ accuracy without annoying users
- Automatic driver/passenger/transit detection
- Household vehicle sharing resolved
- Clean odometer data
- Constantly improving

**How It Works:**
- Strong signals = silent classification
- Weak signals = one-tap fix (no nag)
- User corrections = learning
- Always reversible

**Next:** Ship parking pin + refuel detection first, then add role classifier in Week 3. 🚀
