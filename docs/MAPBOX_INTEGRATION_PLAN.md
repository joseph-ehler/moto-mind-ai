# 🗺️ Mapbox Integration Plan - Fuel Receipt Tracking

**Date:** 2025-10-12  
**Goal:** Leverage Mapbox features for world-class fuel tracking UX

---

## 🎯 Philosophy

**Instead of:** "Here's where you filled up"  
**We deliver:** "Here's the context of your fill-up - location, traffic, weather, nearby alternatives, and efficiency insights"

---

## 📍 Phase 1: Enhanced Event Detail Map (Immediate)

### **Replace Current Static Map with Interactive Map**

**Current:**
- Simple pin on a map
- No interaction
- No context

**New Interactive Map Features:**

#### **1. Base Map with Multiple Styles**
```tsx
<MapboxMap>
  - Streets (default)
  - Satellite
  - Satellite Streets (hybrid)
  - Dark mode
  - Navigation
</MapboxMap>
```

**User Benefit:** Choose view preference, see actual station building

#### **2. Custom Station Marker**
```tsx
<Marker>
  - Fuel pump icon
  - Price badge (if available)
  - Brand logo
  - Click for details
</Marker>
```

**User Benefit:** Visual identification, price at-a-glance

#### **3. Weather Overlay**
```tsx
<WeatherLayer>
  - Precipitation radar
  - Temperature contours
  - Wind direction/speed
  - Cloud cover
</WeatherLayer>
```

**Integration:** Use existing weather data + Mapbox visualization  
**User Benefit:** "Was it raining? Windy? That affected my MPG!"

#### **4. Traffic Layer (Historical)**
```tsx
<TrafficLayer timestamp={event.date}>
  - Red: Heavy traffic
  - Yellow: Moderate
  - Green: Clear
</TrafficLayer>
```

**Integration:** Mapbox Traffic API + event timestamp  
**User Benefit:** "Heavy traffic explains the low MPG on this trip"

#### **5. Nearby Stations**
```tsx
<NearbyStations radius="5mi">
  - Show competitors within 5 miles
  - Display their prices (if available)
  - Distance from current station
</NearbyStations>
```

**Data Source:** Mapbox Places API + price databases  
**User Benefit:** "Could I have saved money nearby?"

#### **6. Distance Measurement**
```tsx
<DistanceTool>
  - From previous fill-up
  - To next fill-up
  - Auto-calculate trip distance
</DistanceTool>
```

**Integration:** Mapbox Directions API  
**User Benefit:** Accurate MPG calculation (distance ÷ gallons)

---

## 🚀 Phase 2: Advanced Insights (Next Sprint)

### **7. Isochrone Visualization**
**"How far can I drive on this tank?"**

```tsx
<IsochroneMap>
  - Input: Gallons purchased + MPG
  - Output: Drive time radius (15min, 30min, 60min)
  - Visual: Colored zones on map
</IsochroneMap>
```

**Use Case:** "I just filled up 12 gallons at 25 MPG = 300 miles range. Show me what's reachable."

**Implementation:**
```tsx
const range = gallons * avgMPG; // 12 * 25 = 300 miles
const driveTime = range / avgSpeed; // 300 / 60 = 5 hours
// Mapbox Isochrone API: Show 1hr, 3hr, 5hr zones
```

**Visual:** Concentric colored zones showing reachable area

### **8. Route Reconstruction**
**"Where did I drive between fill-ups?"**

```tsx
<RouteVisualization>
  - Start: Previous fill-up location
  - End: Current fill-up location
  - Route: Mapbox Directions API (likely path)
  - Terrain: Show elevation changes
</RouteVisualization>
```

**Insights:**
- Elevation gain/loss (affects fuel efficiency)
- Highway vs city driving
- Distance accuracy check

### **9. Price Heat Map**
**"Where are fuel prices best in my area?"**

```tsx
<PriceHeatMap>
  - Aggregate all user fill-ups
  - Color code by price/gallon
  - Red = expensive, Green = cheap
  - Update in real-time
</PriceHeatMap>
```

**Data:** User's own history + community data  
**User Benefit:** Find cheapest gas in area

### **10. Station Clustering**
**"I fill up at these 3 stations regularly"**

```tsx
<StationClusters>
  - Group nearby fill-ups
  - Show frequency
  - Average price at each
  - Recommend best value
</StationClusters>
```

**User Benefit:** "Station A is $0.10 cheaper than Station B!"

---

## 🎨 Phase 3: Premium Features

### **11. 3D Terrain Visualization**
**"Elevation affects fuel efficiency"**

```tsx
<Terrain3D>
  - Show mountains, valleys
  - Highlight elevation changes
  - Correlate with MPG drop
</Terrain3D>
```

**Insight:** "Your MPG dropped 15% because you drove over the Rockies"

### **12. Historical Pattern Analysis**
**"Your driving patterns over time"**

```tsx
<HistoricalMap>
  - Animate fill-ups over time
  - Show seasonal patterns
  - Identify common routes
  - Suggest optimizations
</HistoricalMap>
```

**Insight:** "You drive 20% more in summer. Plan fuel budget accordingly."

### **13. Satellite Imagery**
**"See the actual station"**

```tsx
<SatelliteView>
  - High-res satellite imagery
  - Street-level detail
  - Toggle satellite/street view
</SatelliteView>
```

**User Benefit:** Visual confirmation, memory aid

### **14. Weather Correlation**
**"Weather impact on fuel efficiency"**

```tsx
<WeatherImpactMap>
  - Overlay weather at fill-up time
  - Show temperature extremes
  - Wind speed/direction
  - Precipitation
  - Correlate with MPG
</WeatherImpactMap>
```

**Insight:** "Cold weather reduces your MPG by 12%"

---

## 🔌 Integration Points

### **Existing Weather System:**
```tsx
// Current: Fetch weather for location
// Enhanced: Visualize weather on map

<MapboxMap>
  <WeatherLayer 
    temperature={event.weather_temperature_f}
    condition={event.weather_condition}
    precipitation={event.weather_precipitation_mm}
    windSpeed={event.weather_windspeed_mph}
  />
</MapboxMap>
```

### **Existing Location System:**
```tsx
// Current: Geocoded address
// Enhanced: Rich location context

<MapboxMap>
  <StationMarker 
    lat={event.geocoded_lat}
    lng={event.geocoded_lng}
    address={event.geocoded_address}
  />
  <NearbyStations center={[lat, lng]} />
  <TrafficLayer timestamp={event.date} />
</MapboxMap>
```

### **Distance Calculation:**
```tsx
// Current: User manually enters odometer
// Enhanced: Auto-calculate from previous fill-up

const previousFillUp = getPreviousFillUp(event.vehicle_id);
const route = await getRoute(
  [previousFillUp.geocoded_lng, previousFillUp.geocoded_lat],
  [event.geocoded_lng, event.geocoded_lat]
);

const estimatedDistance = route.distance * 0.000621371; // meters to miles
const actualDistance = event.miles - previousFillUp.miles;
const accuracy = (estimatedDistance / actualDistance) * 100;

// "Estimated: 245 mi, Actual: 248 mi (98% accurate)"
```

---

## 🛠️ Technical Implementation

### **Dependencies:**
```bash
npm install mapbox-gl @mapbox/mapbox-gl-geocoder
npm install @mapbox/mapbox-sdk  # For Directions, Isochrone, etc.
npm install react-map-gl  # React wrapper (optional)
```

### **Core Map Component:**
```tsx
// /components/maps/InteractiveEventMap.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface InteractiveEventMapProps {
  lat: number
  lng: number
  address: string
  stationName: string
  weather?: WeatherData
  showTraffic?: boolean
  showNearbyStations?: boolean
  showWeather?: boolean
}

export function InteractiveEventMap({ ... }: InteractiveEventMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [style, setStyle] = useState('mapbox://styles/mapbox/streets-v12')

  useEffect(() => {
    if (!mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: style,
      center: [lng, lat],
      zoom: 14,
      pitch: 45, // 3D tilt
      bearing: 0
    })

    // Add custom marker
    const marker = new mapboxgl.Marker({
      color: '#3B82F6', // Blue
      scale: 1.2
    })
      .setLngLat([lng, lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2">
              <h3 class="font-bold">${stationName}</h3>
              <p class="text-sm text-gray-600">${address}</p>
            </div>
          `)
      )
      .addTo(map.current)

    // Add traffic layer if enabled
    if (showTraffic && map.current) {
      map.current.on('load', () => {
        map.current?.addSource('mapbox-traffic', {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-traffic-v1'
        })
        
        map.current?.addLayer({
          id: 'traffic',
          type: 'line',
          source: 'mapbox-traffic',
          'source-layer': 'traffic',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'congestion'], 'low'], '#4CAF50',
              ['==', ['get', 'congestion'], 'moderate'], '#FFC107',
              ['==', ['get', 'congestion'], 'heavy'], '#F44336',
              '#757575'
            ],
            'line-width': 2
          }
        })
      })
    }

    // Cleanup
    return () => map.current?.remove()
  }, [lat, lng, style, showTraffic])

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={mapContainer} className="h-full w-full rounded-lg" />

      {/* Style Switcher */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-1">
        <button
          onClick={() => setStyle('mapbox://styles/mapbox/streets-v12')}
          className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded"
        >
          🗺️ Streets
        </button>
        <button
          onClick={() => setStyle('mapbox://styles/mapbox/satellite-streets-v12')}
          className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded"
        >
          🛰️ Satellite
        </button>
        <button
          onClick={() => setStyle('mapbox://styles/mapbox/dark-v11')}
          className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded"
        >
          🌙 Dark
        </button>
      </div>
    </div>
  )
}
```

---

## 📊 Data Requirements

### **What We Have:**
- ✅ Geocoded lat/lng
- ✅ Address
- ✅ Weather data
- ✅ Date/time
- ✅ Station name
- ✅ Gallons, cost
- ✅ Odometer reading

### **What We Can Calculate:**
- ✅ Distance between fill-ups (previous - current odometer)
- ✅ MPG (distance ÷ gallons)
- ✅ Price trends over time
- ✅ Frequency at each station
- ✅ Average cost per station

### **What We Can Fetch (Mapbox APIs):**
- 🗺️ **Directions API:** Route between two points
- 📍 **Geocoding API:** Already using for address autocomplete
- ⏱️ **Isochrone API:** Drive time zones
- 🏪 **Places API:** Nearby gas stations
- 🚦 **Traffic API:** Historical traffic data
- 🗺️ **Static Images API:** Generate map thumbnails
- 🌍 **Tilesets API:** Custom data visualization

---

## 💡 Smart Features Enabled by Mapbox

### **1. Auto-Calculate Trip Distance**
```
Last fill-up: Shell on 5th Ave (Odometer: 45,230)
This fill-up: Chevron on Main St (Odometer: 45,478)

Distance: 248 miles
Route (estimated): [Map shows likely path]
Actual vs Estimated: 98% match ✅
```

### **2. Fill-Up Efficiency Score**
```
Station Location: ⭐⭐⭐⭐⭐
- On your usual route
- No traffic at fill-up time
- Competitive price vs nearby stations

Weather Impact: ⭐⭐⭐☆☆
- Cold temperature (-8% MPG)
- Light rain
- Moderate wind

Overall: Good timing! ✅
```

### **3. Predictive Suggestions**
```
💡 Based on your patterns:
- You typically drive 250 mi between fill-ups
- Current: 223 mi since last fill-up
- Suggestion: You'll need gas in ~2 days
- Nearby options: [Map shows 3 stations on your route]
```

### **4. Community Price Comparison**
```
Your price: $3.45/gal
Average in 5mi: $3.52/gal
You saved: $0.07/gal × 12.5 gal = $0.88! 🎉

Cheapest nearby: $3.39/gal (0.8 mi north)
```

---

## 🎨 UI/UX Mockup

### **Event Detail Map Section:**

```
┌─────────────────────────────────────────────┐
│ 📍 Location & Context          [🗺️ Expand] │
├─────────────────────────────────────────────┤
│                                             │
│   ╔═══════════════════════════╗            │
│   ║  [Interactive Mapbox Map] ║            │
│   ║                           ║            │
│   ║    ⛽ Shell Station        ║            │
│   ║    📍 123 Main St          ║            │
│   ║                           ║            │
│   ║  [Style: 🗺️ 🛰️ 🌙]       ║            │
│   ║  [Layers: 🚦 ☁️ ⛽]       ║            │
│   ╚═══════════════════════════╝            │
│                                             │
│   📊 Location Insights:                     │
│   • Traffic: Light 🟢                      │
│   • Weather: 72°F, Clear ☀️                │
│   • Nearby stations: 3 within 2mi          │
│   • Price vs average: $0.08 cheaper 💰     │
│                                             │
│   📏 Trip Context:                          │
│   • From previous fill-up: 245 mi          │
│   • Estimated route: [View on map]         │
│   • MPG this tank: 24.5 mpg               │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🚀 Implementation Priority

### **Week 1: Core Interactive Map**
- ✅ Replace static map with Mapbox GL
- ✅ Add style switcher (street/satellite/dark)
- ✅ Custom station marker with popup
- ✅ Basic zoom/pan controls

### **Week 2: Context Layers**
- ✅ Traffic layer (historical)
- ✅ Weather overlay visualization
- ✅ Nearby stations (Mapbox Places API)
- ✅ Distance measurement tool

### **Week 3: Insights & Analytics**
- ✅ Route reconstruction (between fill-ups)
- ✅ Trip distance auto-calculation
- ✅ Price comparison vs nearby
- ✅ Efficiency scoring

### **Week 4: Advanced Features**
- ✅ Isochrone visualization (range on tank)
- ✅ Heat maps (price trends)
- ✅ Station clustering
- ✅ Historical route animation

---

## 💰 Cost Considerations

### **Mapbox Pricing (Free Tier):**
- **50,000** map loads/month
- **100,000** geocoding requests/month
- **Unlimited** static map requests

### **Our Expected Usage (100 active users):**
- ~3,000 map loads/month (30/user)
- ~1,000 geocoding requests/month (already using)
- Well within free tier! ✅

### **When to Upgrade:**
- \>1,000 active users
- \>$50k/month revenue
- Enterprise features needed

**Current recommendation:** Free tier is perfect! 🎉

---

## 🎯 Success Metrics

### **User Engagement:**
- Map interaction rate: Target >60%
- Time on event detail page: +50%
- Feature usage (traffic/weather): >40%

### **Data Quality:**
- Distance calculation accuracy: >95%
- Location verification rate: >80%
- Weather correlation insights: >30%

### **Business Value:**
- User retention: +20%
- Session duration: +35%
- Feature satisfaction: >4.5/5 ⭐

---

## 🎉 The Vision

**Transform from:**
> "Here's your receipt data in a list"

**To:**
> "Here's the complete story of your fill-up:
> - Where you filled up (with visual confirmation)
> - What the conditions were (traffic, weather)
> - How it compares (nearby stations, prices)
> - How efficient it was (route, MPG, context)
> - What you should know (insights, predictions)"

**Result:** World-class fuel tracking experience powered by Mapbox! 🗺️✨
