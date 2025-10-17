# Parking Memory System

## Overview

Automatically remember where you parked your car with reverse geocoding, directions, and metadata tracking. Never forget your parking spot again!

## Features

### Core Capabilities

- ✅ **Auto-save parking location** - Saves when you stop tracking
- ✅ **Reverse geocoding** - Human-readable addresses (e.g., "123 Main St, Seattle, WA")
- ✅ **Place names** - Business/landmark names (e.g., "Walmart Parking Lot")
- ✅ **Distance tracking** - Real-time distance to your parked car
- ✅ **Smart directions** - Platform-aware (Apple Maps on iOS, Google Maps elsewhere)
- ✅ **Rich metadata** - Notes, floor, section, spot number
- ✅ **Photo support** - Ready for camera integration (native app)
- ✅ **Full history** - View all previous parking spots
- ✅ **One active spot** - Auto-deactivates old spots

### User Experience

**When parking:**
1. Stop tracking (get out of car)
2. App prompts: "Save parking spot?"
3. Optionally add notes/floor/section
4. Location saved with address

**When returning:**
1. Open app → see parking spot card
2. Shows distance to car
3. Tap "Get Directions" → opens Maps
4. Navigate to your car 🎯
5. Tap "Found It" when retrieved

---

## Database Schema

### Table: `parking_spots`

```sql
CREATE TABLE parking_spots (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES tracking_sessions(id),
  
  -- Location
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  accuracy NUMERIC(8, 2),
  address TEXT,
  place_name TEXT,
  
  -- Metadata
  timestamp TIMESTAMPTZ NOT NULL,
  photo_url TEXT,
  notes TEXT,
  floor TEXT,
  section TEXT,
  spot_number TEXT,
  
  -- State
  is_active BOOLEAN DEFAULT TRUE,
  retrieved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Key Features

**Constraints:**
- Valid latitude: -90 to 90
- Valid longitude: -180 to 180
- One active spot per user (automatic)

**Indexes:**
- User ID + active status
- Timestamp (descending)
- Spatial (lat/lng for nearby queries)

**RLS Policies:**
- Users can only access their own spots
- Full CRUD with user ID check

---

## API Reference

### ParkingMemory Class

```typescript
import { ParkingMemory } from '@/lib/tracking/parking-memory'

const parkingMemory = new ParkingMemory()
```

#### Save Parking Spot

```typescript
const spot = await parkingMemory.saveSpot({
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  sessionId: 'session-uuid',
  notes: 'Near the big tree',
  floor: 'Level 3',
  section: 'A',
  spotNumber: '42',
  skipGeocoding: false // Set true to skip address lookup
})
```

**Returns:** `ParkingSpot` with geocoded address and place name

#### Get Active Spot

```typescript
const activeSpot = await parkingMemory.getActiveSpot()
// Returns: ParkingSpot | null
```

#### Update Spot Metadata

```typescript
await parkingMemory.updateSpot(spotId, {
  notes: 'Updated: near the blue sign',
  floor: 'Level 2',
  section: 'B',
  spotNumber: '15'
})
```

#### Mark as Retrieved

```typescript
await parkingMemory.markAsRetrieved(spotId)
// Sets is_active = false, retrieved_at = now
```

#### Delete Spot

```typescript
await parkingMemory.deleteSpot(spotId)
```

#### Get History

```typescript
const history = await parkingMemory.getHistory(10)
// Returns: ParkingSpot[] (most recent first)
```

#### Calculate Distance

```typescript
const meters = parkingMemory.calculateDistance(
  currentLat, currentLng,
  spot.latitude, spot.longitude
)

const formatted = parkingMemory.formatDistance(meters)
// Returns: "150 m" or "1.2 km"
```

#### Get Directions URL

```typescript
// Google Maps
const url = parkingMemory.getDirectionsUrl(
  spot,
  currentLat,
  currentLng
)

// Apple Maps (iOS)
const appleUrl = parkingMemory.getAppleMapsUrl(
  spot,
  currentLat,
  currentLng
)
```

---

## React Hooks

### useParkingMemory

```typescript
import { useParkingMemory } from '@/hooks/useParkingMemory'

function MyComponent() {
  const {
    // State
    activeSpot,        // Active parking spot or null
    isLoading,         // Loading state
    error,             // Error message or null
    
    // Actions
    saveSpot,          // Save new spot
    updateSpot,        // Update metadata
    markAsRetrieved,   // Mark as found
    deleteSpot,        // Delete spot
    refresh,           // Reload active spot
    
    // Utilities
    getDistanceToSpot, // Calculate distance
    getDirectionsUrl   // Get Maps URL
  } = useParkingMemory()
  
  return (
    <div>
      {activeSpot && (
        <div>
          <h3>{activeSpot.placeName}</h3>
          <p>{activeSpot.address}</p>
          <button onClick={markAsRetrieved}>
            Found My Car
          </button>
        </div>
      )}
    </div>
  )
}
```

### useParkingHistory

```typescript
import { useParkingHistory } from '@/hooks/useParkingMemory'

function HistoryComponent() {
  const { history, isLoading, error, refresh } = useParkingHistory(20)
  
  return (
    <ul>
      {history.map(spot => (
        <li key={spot.id}>
          {spot.address} - {formatDate(spot.timestamp)}
        </li>
      ))}
    </ul>
  )
}
```

---

## UI Component

### ParkingMemoryWidget

```typescript
import { ParkingMemoryWidget } from '@/components/parking/ParkingMemoryWidget'

function TrackingPage() {
  return (
    <ParkingMemoryWidget
      currentLocation={{ latitude: 40.7128, longitude: -74.0060 }}
      lastSessionId="session-uuid"
      onSpotSaved={() => console.log('Spot saved!')}
    />
  )
}
```

**Props:**
- `currentLocation?`: Current user location for distance
- `lastSessionId?`: Tracking session to link with spot
- `onSpotSaved?`: Callback when spot is saved

**Features:**
- Beautiful gradient card UI
- Distance display (real-time)
- "Get Directions" button (platform-aware)
- "Found It" button (mark retrieved)
- Edit/delete actions
- Save dialog with optional metadata
- Loading/error states

---

## Geocoding

### How It Works

**Service:** OpenStreetMap Nominatim (free, no API key required)

**Request:**
```
GET https://nominatim.openstreetmap.org/reverse
  ?format=json
  &lat=40.7128
  &lon=-74.0060
  &zoom=18
  &addressdetails=1
```

**Response:**
```json
{
  "address": {
    "house_number": "123",
    "road": "Main Street",
    "city": "Seattle",
    "state": "Washington",
    "postcode": "98101"
  },
  "name": "Walmart Parking Lot"
}
```

**Formatted Output:**
- Address: "123 Main Street, Seattle, Washington, 98101"
- Place Name: "Walmart Parking Lot"

### Rate Limits

**Nominatim Usage Policy:**
- Max 1 request per second
- Include User-Agent header
- No bulk geocoding
- Cache results

Our implementation:
- ✅ User-Agent: "MotoMind Vehicle Tracking App"
- ✅ One request per parking save
- ✅ Results cached in database
- ✅ Skip option available

### Alternative Services

For higher volume or better accuracy:

**Google Geocoding API:**
```typescript
// Replace reverseGeocode() method
const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`
```

**Mapbox Geocoding:**
```typescript
const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${TOKEN}`
```

---

## Distance Calculation

### Haversine Formula

Calculates great-circle distance between two points on Earth:

```typescript
const R = 6371000 // Earth's radius in meters
const φ1 = lat1 * Math.PI / 180
const φ2 = lat2 * Math.PI / 180
const Δφ = (lat2 - lat1) * Math.PI / 180
const Δλ = (lng2 - lng1) * Math.PI / 180

const a = Math.sin(Δφ / 2) ** 2 + 
          Math.cos(φ1) * Math.cos(φ2) * 
          Math.sin(Δλ / 2) ** 2

const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
const distance = R * c // meters
```

**Accuracy:** ±0.5% (better than most GPS accuracy)

**Database Function:**
```sql
SELECT calculate_distance(
  40.7128, -74.0060,  -- Current location
  40.7489, -73.9680   -- Parking spot
) AS distance_meters;
```

---

## Integration Examples

### Auto-Save on Tracking Stop

```typescript
// app/track/page.tsx

const handleStopTracking = async () => {
  await tracker.stopTracking()
  
  // Prompt user to save parking spot
  const shouldSave = confirm('Save parking spot?')
  if (shouldSave && currentLocation) {
    await parkingMemory.saveSpot({
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      sessionId: trackingState.sessionId
    })
  }
}
```

### Notification When Far From Car

```typescript
// Check distance periodically
useEffect(() => {
  const interval = setInterval(async () => {
    const spot = await parkingMemory.getActiveSpot()
    if (!spot || !currentLocation) return
    
    const distance = parkingMemory.calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      spot.latitude,
      spot.longitude
    )
    
    // Alert if > 100m from car
    if (distance > 100) {
      showNotification('You're far from your car!')
    }
  }, 60000) // Check every minute
  
  return () => clearInterval(interval)
}, [currentLocation])
```

### Parking History Page

```typescript
// app/parking-history/page.tsx

export default function ParkingHistoryPage() {
  const { history, isLoading } = useParkingHistory(50)
  
  return (
    <Container>
      <Heading>Parking History</Heading>
      {history.map(spot => (
        <Card key={spot.id}>
          <Text>{spot.address}</Text>
          <Text>{formatDate(spot.timestamp)}</Text>
          {!spot.isActive && (
            <Badge>Retrieved {formatDate(spot.retrievedAt)}</Badge>
          )}
        </Card>
      ))}
    </Container>
  )
}
```

---

## Testing

### Manual Testing

**1. Save a parking spot:**
```bash
# Open dev tools console
const pm = new ParkingMemory()
const spot = await pm.saveSpot({
  latitude: 47.6062,
  longitude: -122.3321,
  notes: 'Test parking spot'
})
console.log(spot)
```

**2. Get active spot:**
```typescript
const active = await pm.getActiveSpot()
console.log(active.address) // Should show geocoded address
```

**3. Calculate distance:**
```typescript
const distance = pm.calculateDistance(
  47.6062, -122.3321,  // Current location
  47.6100, -122.3400   // Parking spot
)
console.log(pm.formatDistance(distance)) // "650 m"
```

### Database Testing

```sql
-- Create test spot
INSERT INTO parking_spots (user_id, latitude, longitude, notes)
VALUES (auth.uid(), 47.6062, -122.3321, 'Test spot');

-- Get active spot
SELECT * FROM get_active_parking_spot(auth.uid());

-- Calculate distance
SELECT calculate_distance(
  47.6062, -122.3321,
  47.6100, -122.3400
) AS distance_meters;
```

---

## Native App Enhancements (Tomorrow!)

### Camera Integration

```typescript
// Enhanced with Capacitor Camera plugin
import { Camera } from '@capacitor/camera'

const spot = await parkingMemory.saveSpot({
  latitude: lat,
  longitude: lng,
  photoUrl: await takePhoto() // Camera API
})

async function takePhoto() {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri
  })
  
  return photo.webPath
}
```

### Push Notifications

```typescript
// Remind user where they parked
import { LocalNotifications } from '@capacitor/local-notifications'

await LocalNotifications.schedule({
  notifications: [{
    title: 'Car Parked',
    body: `Parked at ${spot.address}`,
    id: 1
  }]
})
```

### Background Geofencing

```typescript
// Alert when leaving parking area
import { Geolocation } from '@capacitor/geolocation'

await Geolocation.addWatcher({
  callback: (position) => {
    const distance = calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      spot.latitude,
      spot.longitude
    )
    
    if (distance > 200) {
      alert('You're leaving the parking area!')
    }
  }
})
```

---

## Troubleshooting

### Geocoding Not Working

**Problem:** Address is null/undefined

**Solutions:**
1. Check network connection
2. Verify coordinates are valid
3. Check Nominatim rate limits (1 req/sec)
4. Use `skipGeocoding: true` and add address manually

### Distance Calculation Wrong

**Problem:** Distance seems incorrect

**Solutions:**
1. Verify coordinate order (lat, lng not lng, lat)
2. Check GPS accuracy (might be low indoors)
3. Use database function for consistency:
   ```sql
   SELECT calculate_distance(lat1, lng1, lat2, lng2);
   ```

### Spot Not Saving

**Problem:** saveSpot() fails

**Solutions:**
1. Check user is authenticated
2. Verify RLS policies are enabled
3. Check database migration applied:
   ```sql
   SELECT * FROM parking_spots LIMIT 1;
   ```
4. Review browser console for errors

### Directions Not Opening

**Problem:** Maps app doesn't open

**Solutions:**
1. Check platform detection (iOS vs Android)
2. Try alternate URL format
3. Verify coordinates are valid
4. Test URLs manually:
   ```
   https://www.google.com/maps/search/?api=1&query=47.6062,-122.3321
   ```

---

## Performance

### Database

- **Indexes:** Optimized for user + active queries
- **Spatial index:** Fast nearby spot lookups
- **Auto-cleanup:** Can add TTL trigger for old spots

### Geocoding

- **Cache:** Results stored in database
- **Rate limit:** 1 request per save (compliant)
- **Timeout:** 5 second max wait
- **Fallback:** Continues without address if fails

### UI

- **Loading states:** Smooth UX during geocoding
- **Optimistic updates:** Instant feedback
- **Error handling:** Graceful degradation

---

## Future Enhancements

- [ ] **Photo carousel** - Multiple photos per spot
- [ ] **AR navigation** - Augmented reality directions
- [ ] **Parking timer** - Track parking duration/cost
- [ ] **Multi-vehicle** - Different spots per vehicle
- [ ] **Share location** - Send spot to friends
- [ ] **Parking reminders** - "Remember where you parked?"
- [ ] **Analytics** - Most-used parking locations
- [ ] **Offline maps** - Cached map tiles
- [ ] **Voice notes** - Audio descriptions
- [ ] **QR codes** - Scan parking signs

---

## Support

**Issues?**
- Check database migration applied
- Verify RLS policies
- Review browser console
- Test with manual API calls

**Documentation:**
- API Reference: See above
- Database Schema: `supabase/migrations/20251017_11_parking_spots.sql`
- Code Examples: This file

---

**Status:** Production ready  
**Last Updated:** October 17, 2025  
**Version:** 1.0.0  
**Next:** Native app integration 🚀
