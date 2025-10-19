# Sensor-Driven Features - Building Automagic Experiences

**Last Updated:** October 18, 2024  
**Status:** Ready to Ship (25+ features identified)  
**Philosophy:** Automagic, but never annoying

---

## 🎯 THE PHILOSOPHY

**"Let the phone decide quietly, with humility"**

- Strong signals (car BT/OBD/CarPlay, patterns)
- Gentle heuristics (transit/passenger detection)
- Single on-screen, non-push one-tap fix when unsure
- No nags, always reversible, constantly learning

**Result:** Features that feel magical without being intrusive.

---

## 📡 AVAILABLE SENSORS & OS SIGNALS

### Motion & Environment
- **Accelerometer, Gyroscope (IMU)** - Crash detection, harsh events, device stability
- **Magnetometer (Compass)** - Heading, direction changes
- **Barometer** - Altitude changes, steep grades, mountain driving
- **Ambient Light** - Day/night detection, cabin care tips
- **Proximity** - Device near face (phone calls while driving)
- **Device Orientation** - Portrait/landscape, rotation lock

### System & Power
- **Charging State** - AC/USB, docked detection
- **Battery %** - Battery-aware tracking governor
- **Thermal State** - Overheat protection
- **Screen On/Off** - Engagement patterns
- **Do Not Disturb** - Safety mode suggestions
- **Foreground/Background** - App state tracking

### Location & Radios
- **GPS** - Fine location, speed, heading
- **Cell/Wi-Fi** - Coarse location backup
- **iOS Significant-Change** - Passive wakeups (~500m movement)
- **iOS Visits** - Arrival/departure from locations
- **OS Geofences** - Enter/exit regions
- **Bluetooth Classic/LE** - Car connection, paired devices
- **iBeacon/Eddystone** - Sub-5m precision (shops, garage)
- **CarPlay/Android Auto** - Car UI connection events
- **NFC** - Limited on iOS, more open on Android

### Media & I/O (Privacy-Gated)
- **Camera** - Photos, video, barcode/VIN scan, document capture
- **Microphone** - Only with explicit foreground consent

---

## 🚀 QUICK WINS (Ship Next Week)

### 1. Parking Pin + Walk-Back Trail ⭐⭐⭐⭐⭐

**Signals:**
- Car Bluetooth disconnects
- Activity transitions to ON_FOOT
- Device leaves vehicle geofence

**Feature:**
- Auto-drop pin: "You parked here"
- Timestamp + address
- Optional: Photo tile of parking spot
- Optional: Meter timer for street parking
- Walk-back breadcrumb trail (dashed line to car)
- Distance indicator

**Why This Wins:**
- Universal problem ("Where did I park?")
- Zero user effort
- Everyday delight
- Uses sensors we have today
- Ships in 2 days

**User Flow:**
1. User parks and walks away
2. App detects BT disconnect + ON_FOOT + geofence exit
3. Silent notification: "Parked at Main St & 5th"
4. User opens app later, sees pin on map
5. Tap "Navigate to Car" → breadcrumb trail appears
6. Walk back guided by dashed line

---

### 2. Refuel Detection & Auto-Logging ⭐⭐⭐⭐⭐

**Signals:**
- Trip pauses at POI (category: fuel/gas_station)
- Activity: ON_FOOT for 3-7 minutes
- Optional: Payment notification detected
- Trip resumes from same location

**Feature:**
- Auto-detect refuel stop
- Show card: "Refuel?"
- Snap pump screen
- OCR extracts: price/gallon, total cost, gallons
- Calculate MPG automatically
- Update fuel cost tracking
- Compare to EPA estimates

**Why This Wins:**
- No manual fuel logging (people hate this)
- Automatic MPG calculation
- Cost tracking (know real fuel spend)
- OCR makes it 5 seconds vs manual typing
- Delightful surprise ("It knows I refueled!")

**Data Captured:**
- Date/time
- Location (station name)
- Gallons purchased
- Price per gallon
- Total cost
- Fuel grade (regular/mid/premium)
- Odometer reading
- MPG calculation
- Receipt photo

---

### 3. Docked & Driving Auto-Mode ⭐⭐⭐⭐☆

**Signals:**
- Charging = ON
- Bluetooth (car audio) connected
- Orientation = landscape
- Optional: CarPlay/Android Auto connected

**Feature:**
- Auto-switch to "Drive View"
- Large speed display (9xl font)
- Trip stats (distance, time, avg speed)
- Big "End Trip" button
- SOS button (one tap emergency)
- Optional: Voice feedback on stats

**Why This Wins:**
- Zero taps to optimal UI
- Safe, glanceable interface
- Premium feel (Tesla-like)
- Uses sensors we have today
- Perfect for phone mount users

**UI Design:**
- Black background (OLED-friendly)
- White text (high contrast)
- 9xl speed number (readable at a glance)
- 4xl unit label (mph)
- 2xl trip stats
- Large touch targets (safe while driving)

---

### 4. Harsh Events & Road Quality Map ⭐⭐⭐⭐☆

**Signals:**
- IMU spikes (high jerk/acceleration)
- GPS delta-v (speed changes)
- Location clustering (same road segments)
- Pattern analysis (duration, G-force)

**Feature:**
- Detect harsh events:
  - Potholes (short, sharp impact)
  - Rough roads (sustained vibration)
  - Harsh braking (rapid deceleration)
  - Hard acceleration (rapid speed increase)
- Cluster events by location (DBSCAN)
- Personal "rough road" heatmap
- Preventive maintenance alerts
- Road quality trends over time

**Why This Wins:**
- Personal data (your rough roads, not generic)
- Preventive maintenance (save money)
- Visualizes invisible data
- Uses existing sensors (no new hardware)
- Feels like premium feature

**Maintenance Alerts:**
- "You've hit 15 potholes this week - check tire pressure"
- "High road roughness - consider suspension inspection"
- "Rough road count increasing - wheel alignment recommended"

---

## 🌟 WOW MOMENTS (Premium Features)

### 5. "Arrived Home Safe" Smart Notification ⭐⭐⭐⭐⭐

**Signals:**
- Home geofence entered
- Night drive (after 8pm)
- No crash candidates detected
- Trip completed normally

**Feature:**
- Silent notification: "Arrived Home Safe"
- One-tap share: "Let Mom know"
- Pre-filled message: "Just got home safe! 🏠"
- Optional: Auto-send to chosen contacts

**Why This Wins:**
- Safety + thoughtfulness = emotional connection
- Parents will love this
- Partners appreciate the peace of mind
- Zero friction (one tap)

**Target Users:**
- Parents of teen drivers
- Partners who worry
- Solo travelers
- Late-night workers

---

### 6. Steep Grade & Brake Stress Insights ⭐⭐⭐⭐☆

**Signals:**
- Barometer data (altitude changes)
- GPS elevation delta
- Braking events on steep grades
- Speed patterns on hills

**Feature:**
- Detect mountain driving patterns
- Calculate elevation gain
- Count steep grades (>6% incline)
- Track braking frequency on descents
- Personalized maintenance alerts
- Adjust service intervals

**Why This Wins:**
- Personalized maintenance > generic schedules
- Prevents brake failure (safety)
- Saves money (early detection)
- Educational (users learn about their driving)

**Alerts:**
- "Mountain driving this week - inspect brake pads sooner"
- "High elevation gain - check brake fluid level"
- "Frequent steep descents - consider brake inspection"

---

### 7. Garage Auto-Open (Opt-In Magic) ⭐⭐⭐⭐☆

**Signals:**
- iBeacon detected (garage entrance)
- Home geofence entered
- Activity: IN_VEHICLE
- Speed < 5 mph (approaching slowly)

**Feature:**
- Silent notification: "Open Garage?"
- One tap to trigger
- Integrations:
  - HomeKit
  - SmartThings
  - IFTTT
  - Google Home
- Optional: Automatic (no prompt)

**Why This Wins:**
- Magical but controlled
- User initiates (privacy respected)
- Works with existing smart home
- Sub-5m precision (iBeacon)

**Safety:**
- Only triggers when:
  - IN_VEHICLE (not walking)
  - Speed < 5 mph (not driving by)
  - Daytime or expected arrival time
- Never automatic without explicit opt-in

---

### 8. Storm & Temperature Wear Alerts ⭐⭐⭐☆☆

**Signals:**
- Location + Weather API
- Temperature extremes
- Cold start count
- Ambient light patterns

**Feature:**
- Detect weather-related risks
- Cold snap alerts: "Battery vulnerable"
- Heat wave alerts: "Cabin care tips"
- Storm preparation: "Check wipers, tires"
- Seasonal checklists

**Why This Wins:**
- Proactive care
- Feels thoughtful
- Reduces failures
- Educational

**Alerts:**
- "Cold snap warning - battery and tires more vulnerable"
- "Heatwave - avoid leaving valuables in car"
- "First freeze coming - check coolant/antifreeze"
- "Heavy rain forecast - inspect wiper blades"

---

### 9. Tire Pressure Nudge (No TPMS Required) ⭐⭐⭐☆☆

**Signals:**
- Road roughness increasing
- MPG decreasing (from refuel logs)
- Cold weather (pressure drops)
- No recent tire service

**Feature:**
- Infer low tire pressure from:
  - Increased vibration (IMU)
  - Decreased efficiency (MPG)
  - Temperature drops (physics)
- Gentle nudge: "Likely under-inflated"
- Checklist reminder
- Gas station finder

**Why This Wins:**
- Real savings (fuel efficiency)
- Low-tech solution (no TPMS needed)
- Safety benefit
- Educational

**Science:**
- Tire pressure drops ~1 PSI per 10°F decrease
- Under-inflated tires = 3-10% MPG loss
- Increased road noise/vibration
- All detectable with phone sensors

---

### 10. Drive Style Score (Private by Default) ⭐⭐⭐☆☆

**Signals:**
- IMU smoothness
- GPS speed patterns
- Speeding percentage
- Night driving miles
- Harsh event frequency

**Feature:**
- Owner-only score (no sharing)
- Weekly insights
- Coaching tips (not shaming)
- Insurance-grade accuracy
- Opt-in sharing for discounts

**Why This Wins:**
- Insurance discounts (10-15% potential)
- Self-improvement (gamification)
- Privacy-first (owner only by default)
- Non-judgmental coaching

**Scoring Dimensions:**
- Smoothness (0-100)
- Speed compliance (0-100)
- Safety behaviors (0-100)
- Overall score (0-100)

**Weekly Tips:**
- "Great week! Smooth acceleration improved 15%"
- "Tip: Reduce speeding by 5% to improve insurance score"
- "Night driving increased - extra caution recommended"

---

## 📋 FEATURE CATALOG (25+ Total)

### Everyday Convenience
1. ✅ **Parking Pin + Walk-Back Trail** (Ship Week 1)
2. ✅ **Refuel Detection** (Ship Week 1)
3. ✅ **Docked & Driving Auto-Mode** (Ship Week 1)
4. **Trip Purpose Auto-Tagging** (Commute/School/Errand)
5. **Curbside Pickup Helper** (Share plate/model to store)
6. **Calendar-Aware Reminders** (Book service on free days)

### Safety & Awareness
7. ✅ **"Arrived Home Safe" Notification** (Ship Week 2)
8. ✅ **Harsh Events & Road Quality Map** (Ship Week 1)
9. **Speed Limit Awareness** (Post-trip gentle summary)
10. **"Do Not Disturb While Driving" Helper** (Safety toggle)
11. **Phone Mount Coaching** (Stability check)
12. **Valet/Service Mode** (Privacy with integrity)

### Maintenance & Care
13. ✅ **Steep Grade & Brake Stress** (Ship Week 2)
14. ✅ **Tire Pressure Nudge** (Ship Week 3)
15. **Heatwave Cabin-Care Tip** (Window/sunshade reminders)
16. **Storm & Temperature Alerts** (Weather prep)
17. **Wheel Alignment Hint** (Experimental, IMU-based)
18. **Altitude & Turbo Stress** (For turbo engines)

### Smart Home Integration
19. ✅ **Garage Auto-Open** (Ship Week 2)
20. **Trusted Shop Instant Check-In** (iBeacon/geofence)
21. **Home Lighting Scene** (Arrive home → lights on)

### Advanced Features
22. **Drive Style Score** (Insurance-grade, private)
23. **Rideshare/Day-Job Mode** (Tax export, privacy)
24. **Hands-Free Photo Notes** (Voice + camera)
25. **CarPlay/Android Auto Glance Cards** (Safe, glanceable)
26. **Theft/Movement Alert** (Phone in car + unexpected movement)

---

## 🎯 IMPLEMENTATION GUARDRAILS

### Never Annoy Users
1. **Combine signals** - Never use 1 sensor alone (false positives)
2. **Clear opt-ins** - Gate advanced features behind permissions
3. **Explain the "why"** - "We detect refuels from fuel POI stops + receipt photo"
4. **Make reversible** - Easy delete/undo for any auto-action
5. **Remote config** - Tune thresholds without redeploy
6. **Nudge limits** - Max 2 low-confidence prompts per week

### Respect Privacy
1. **Private by default** - User opts into sharing
2. **Granular scopes** - Private / Household / Shop QR / Aggregated
3. **Location fuzzing** - Home obfuscated in shared views
4. **Ephemeral IMU** - Deleted after feature extraction
5. **On-device processing** - Reduce server data
6. **Clear data retention** - 7 days for raw, aggregated forever

### Ship Safely
1. **Shadow mode first** - Collect data, don't act (2 weeks)
2. **A/B test always** - 10% rollout, measure false positives
3. **User feedback** - "Was this accurate?" on every feature
4. **Kill switch** - Remote disable if issues arise
5. **Graceful degradation** - Feature fails silently, app works
6. **Performance budget** - < 10% battery drain total

---

## 🚀 SHIPPING ROADMAP

### Week 1 (Quick Wins)
**Ship 4 features, prove magic:**
- Day 1-2: Parking pin + walk-back trail
- Day 3-4: Refuel detection + OCR
- Day 5: Docked & driving auto-mode
- Day 6-7: Harsh events + road quality map

**Result:** Users experience daily magic

---

### Week 2 (Safety & Care)
**Ship 4 features, build trust:**
- Day 1-2: "Arrived home safe" notifications
- Day 3-4: Steep grade & brake stress insights
- Day 5: Garage auto-open (opt-in)
- Day 6-7: Storm & temperature alerts

**Result:** Users trust us with safety

---

### Week 3 (Optimization)
**Ship 4 features, increase stickiness:**
- Day 1-2: Tire pressure nudge
- Day 3-4: Trip purpose auto-tagging
- Day 5: Battery-aware tracking governor
- Day 6-7: Drive style score (private)

**Result:** Users can't imagine life without it

---

### Week 4+ (Advanced)
**Ship remaining features:**
- Wheel alignment hint
- Rideshare/day-job mode
- Hands-free photo notes
- CarPlay/Android Auto cards
- Theft/movement alert
- Curbside pickup helper

**Result:** Feature-complete premium experience

---

## 💰 MONETIZATION OPPORTUNITIES

### Free Tier (Hook)
- Parking pin
- Refuel detection (last 3 fills)
- Drive mode
- Basic harsh events
- "Arrived home safe"

### Pro Tier ($9.99/mo)
- Road quality heatmap
- Maintenance insights (brake stress, tire pressure)
- Drive style score
- Unlimited refuel history
- Advanced alerts (storm, temperature)
- Garage auto-open
- Photo storage (unlimited)

### Premium Features (Add-Ons)
- Insurance score sharing: Free (drives acquisition)
- Family safety alerts: Included in Pro
- Fleet management: Custom pricing

---

## 🎊 THE BOTTOM LINE

**What Makes This Special:**
- Uses sensors you already have (no new hardware)
- Ships in days, not months (no integrations)
- Delights users daily (parking, refuel, auto-mode)
- Builds trust (safety alerts, preventive care)
- Creates stickiness (road quality map, personal insights)
- Never annoys (silent classification, one-tap fixes)

**Quick Wins This Week:**
1. Parking pin (2 days)
2. Refuel detection (3 days)
3. Drive mode (1 day)
4. Harsh events (2 days)

**Total:** 4 magical features in 8 days of work.

**Next Steps:**
1. Read `SENSOR_FEATURES_IMPLEMENTATION.md` for technical details
2. Read `TRIP_ROLE_CLASSIFIER.md` for auto-classification system
3. Start with parking pin (highest impact, lowest effort)
4. Ship daily, iterate based on feedback

**The foundation is ready. Ship magic daily.** 🚀
