# Event Types & Card Standardization

## **Complete Event Type Inventory**

### **Event Types Captured:**
1. **Fuel** (`fuel`) - Fuel purchase receipts
2. **Service/Maintenance** (`service`, `maintenance`) - Service receipts, maintenance work
3. **Odometer** (`odometer`) - Odometer readings
4. **Dashboard Warning** (`dashboard_warning`) - Warning light photos
5. **Dashboard Snapshot** (`dashboard_snapshot`) - General dashboard photos
6. **Tire Tread** (`tire_tread`) - Tire condition checks
7. **Tire Pressure** (`tire_pressure`) - Tire pressure readings
8. **Damage** (`damage`) - Damage documentation
9. **Parking** (`parking`) - Parking location records
10. **Document** (`document`) - Insurance, registration, etc.
11. **Manual** (`manual`) - Manual text entries

---

## **Detailed Event Type Schemas**

### **1. FUEL (`fuel`)**

**Data Captured:**
```typescript
{
  gallons: number           // Volume purchased
  cost: number             // Total cost
  price_per_gallon: number // Calculated price
  station_name?: string    // Gas station name
  fuel_type?: string       // Regular, Premium, Diesel
  mpg_calculated?: number  // Miles per gallon (calculated)
}
```

**Display Template:**
```
┌────────────────────────────────────────┐
│ 💧 Fuel Fill-Up              $42.50   │
│    Shell Station          13.2 gal    │
│                           8:00 PM     │
│                                        │
│ Volume: 13.2 gal  Price: $3.22/gal   │
│ Odometer: 77,000 mi                   │
│                                        │
│ 🌿 Excellent 32.5 MPG                 │
│ (↑ 2.3 MPG vs last fill)              │
│                                        │
│ 📷 Receipt photo                      │
│                                        │
│ [View Receipt]  [Edit]                │
└────────────────────────────────────────┘
```

**Primary Value:** Cost (`$42.50`)  
**Key Metrics:** Volume, Price/gal, Odometer  
**Insights:** MPG comparison, efficiency trends  
**Actions:** View receipt photo, Edit entry  

---

### **2. SERVICE/MAINTENANCE (`service`, `maintenance`)**

**Data Captured:**
```typescript
{
  service_type: string         // Oil Change, Brake Service, etc.
  vendor_name?: string         // Shop name
  cost?: number               // Total cost
  parts_replaced?: string[]   // List of parts
  warranty?: boolean          // Has warranty?
  next_service_date?: Date    // When next service due
}
```

**Display Template:**
```
┌────────────────────────────────────────┐
│ 🔧 Oil Change                $89.99   │
│    Jiffy Lube Downtown                │
│                           2:45 PM     │
│                                        │
│ At: 77,000 mi                         │
│ Parts: Oil filter, Air filter         │
│                                        │
│ 🔧 Next service due: 82,000 mi        │
│ (in 3 months or 5,000 mi)             │
│                                        │
│ 📷 Invoice photo                      │
│                                        │
│ [View Invoice]  [Edit]                │
└────────────────────────────────────────┘
```

**Primary Value:** Cost  
**Key Metrics:** Mileage, Parts replaced, Vendor  
**Insights:** Next service due, Interval tracking  
**Actions:** View invoice, Edit, Set reminder  

---

### **3. ODOMETER (`odometer`)**

**Data Captured:**
```typescript
{
  reading: number              // Odometer value
  confidence: number           // OCR confidence
  change_since_last?: number   // Miles since last reading
}
```

**Display Template:**
```
┌────────────────────────────────────────┐
│ 📊 Odometer Reading      77,000 miles │
│                           1:11 PM     │
│                                        │
│ Change: +145 mi since last (3 days)  │
│ Daily avg: 48 mi/day                  │
│                                        │
│ 🔧 Approaching 80,000 mi service      │
│ (3,000 mi away)                       │
│                                        │
│ 📷 Dashboard photo                    │
│                                        │
│ [View Photo]  [Edit]                  │
└────────────────────────────────────────┘
```

**Primary Value:** Mileage (`77,000 miles`)  
**Key Metrics:** Change since last, Daily average  
**Insights:** Service milestones, Driving patterns  
**Actions:** View photo, Edit reading  

---

### **4. DASHBOARD WARNING (`dashboard_warning`)**

**Data Captured:**
```typescript
{
  warning_type: string[]       // ["Check Engine", "Oil Pressure"]
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
  resolved_date?: Date
  description?: string
}
```

**Display Template:**
```
┌────────────────────────────────────────┐
│ ⚠️ Dashboard Warning              4   │
│                             warnings  │
│                           8:21 PM     │
│                                        │
│ Odometer: 77,000 mi                   │
│                                        │
│ ⚠️ Check Engine, Oil Pressure,        │
│    Brake System, Airbag               │
│                                        │
│ 🚨 HIGH SEVERITY - Action Required    │
│ ⚠️ Schedule diagnostic scan ASAP      │
│                                        │
│ 📷 Warning lights photo               │
│                                        │
│ [Schedule Service]  [Edit]            │
└────────────────────────────────────────┘
```

**Primary Value:** Warning count  
**Key Metrics:** Odometer, Severity, Specific warnings  
**Insights:** Urgency assessment, Action needed  
**Actions:** Schedule service, View photo, Mark resolved  

---

### **5. DASHBOARD SNAPSHOT (`dashboard_snapshot`)**

**Data Captured:**
```typescript
{
  warning_type: string[]       // Any warnings present
  fuel_level?: number          // Fuel percentage
  temperature?: number         // Coolant temp
  rpm?: number                // Engine RPM
  // Other dashboard indicators
}
```

**Display Template:**
```
┌────────────────────────────────────────┐
│ 📊 Dashboard Check                    │
│                           6:31 PM     │
│                                        │
│ Odometer: 77,000 mi  Fuel: 75%       │
│ Temp: 72°F  RPM: 850                  │
│                                        │
│ ✓ All systems normal                  │
│ ✓ No warning lights                   │
│                                        │
│ 📷 Dashboard photo                    │
│                                        │
│ [View Photo]  [Edit]                  │
└────────────────────────────────────────┘
```

**Primary Value:** Status (normal/warnings)  
**Key Metrics:** Fuel level, Temp, Odometer  
**Insights:** System health status  
**Actions:** View photo, Edit details  

---

### **6. TIRE TREAD (`tire_tread`)**

**Data Captured:**
```typescript
{
  position: 'front_left' | 'front_right' | 'rear_left' | 'rear_right'
  depth_32nds: number          // Tread depth in 32nds of inch
  condition: 'excellent' | 'good' | 'fair' | 'replace_soon' | 'unsafe'
}
```

**Display Template:**
```
┌────────────────────────────────────────┐
│ 🛞 Tire Tread Check                   │
│                           3:15 PM     │
│                                        │
│ Front Left: 8/32" (Good)              │
│ Front Right: 7/32" (Fair)             │
│ Rear Left: 9/32" (Excellent)          │
│ Rear Right: 6/32" (Fair)              │
│                                        │
│ ⚠️ Front right tire needs attention   │
│ Consider rotation in 1,000 mi         │
│                                        │
│ 📷 Tire photo                         │
│                                        │
│ [View Photo]  [Edit]                  │
└────────────────────────────────────────┘
```

**Primary Value:** Average depth or worst tire  
**Key Metrics:** Each tire's depth & condition  
**Insights:** Replace recommendations, Rotation needs  
**Actions:** View photo, Schedule service  

---

### **7. TIRE PRESSURE (`tire_pressure`)**

**Data Captured:**
```typescript
{
  pressures: {
    front_left: number
    front_right: number
    rear_left: number
    rear_right: number
  }
  recommended: number
  alerts?: string[]
}
```

**Display Template:**
```
┌────────────────────────────────────────┐
│ 🛞 Tire Pressure Check    32.5 PSI   │
│                            avg        │
│                           2:30 PM     │
│                                        │
│ FL: 32 PSI  FR: 33 PSI               │
│ RL: 33 PSI  RR: 32 PSI               │
│ Recommended: 32 PSI                   │
│                                        │
│ ✓ All tires within spec              │
│                                        │
│ 📷 Gauge photo                        │
│                                        │
│ [View Photo]  [Edit]                  │
└────────────────────────────────────────┘
```

**Primary Value:** Average pressure  
**Key Metrics:** Each tire's pressure vs recommended  
**Insights:** Over/under inflation alerts  
**Actions:** View photo, Edit readings  

---

### **8. DAMAGE (`damage`)**

**Data Captured:**
```typescript
{
  severity: 'minor' | 'moderate' | 'major'
  location: string             // "Front bumper", "Driver door"
  estimated_cost?: number
  repair_status?: 'pending' | 'in_progress' | 'completed'
  insurance_claim?: boolean
}
```

**Display Template:**
```
┌────────────────────────────────────────┐
│ 🚨 Damage Report           Est. $850  │
│    Front Bumper                       │
│                           9:45 AM     │
│                                        │
│ Severity: Moderate                    │
│ Location: Front bumper (driver side) │
│ At: 77,000 mi                         │
│                                        │
│ 📋 Status: Pending repair             │
│ 🏢 Insurance claim filed              │
│                                        │
│ 📷 Damage photos (3)                  │
│                                        │
│ [View Photos]  [Update Status]        │
└────────────────────────────────────────┘
```

**Primary Value:** Estimated cost  
**Key Metrics:** Severity, Location, Status  
**Insights:** Insurance claim status, Repair tracking  
**Actions:** View photos, Update status, Contact shop  

---

### **9. PARKING (`parking`)**

**Data Captured:**
```typescript
{
  lot_name?: string
  level?: string
  spot_number?: string
  reminder_time?: Date
  location: { lat, lng, address }
}
```

**Display Template:**
```
┌────────────────────────────────────────┐
│ 🅿️ Parked Location                    │
│                           4:20 PM     │
│                                        │
│ Airport Long-Term Lot B               │
│ Level 3, Spot B-47                    │
│                                        │
│ 📍 123 Airport Blvd, Terminal 2       │
│                                        │
│ ⏰ Reminder: Jan 15, 2025 @ 6:00 PM   │
│ (in 3 days)                           │
│                                        │
│ 📷 Location photo                     │
│                                        │
│ [Navigate]  [Edit Reminder]           │
└────────────────────────────────────────┘
```

**Primary Value:** Location name  
**Key Metrics:** Level, Spot, Address  
**Insights:** Time parked, Reminder alert  
**Actions:** Navigate to location, Edit reminder  

---

### **10. DOCUMENT (`document`)**

**Data Captured:**
```typescript
{
  document_type: string        // "insurance", "registration", etc.
  expiration_date?: Date
  policy_number?: string
  provider?: string
  // Type-specific fields
}
```

**Display Template:**
```
┌────────────────────────────────────────┐
│ 📄 Insurance Policy                   │
│    State Farm Auto                    │
│                           Jan 1       │
│                                        │
│ Policy: AUTO-123456789                │
│ Coverage: Full (Liability + Comp)     │
│                                        │
│ ⚠️ Expires: Dec 31, 2025              │
│ (in 11 months)                        │
│                                        │
│ 📷 Policy document                    │
│                                        │
│ [View Document]  [Renew]              │
└────────────────────────────────────────┘
```

**Primary Value:** Document type  
**Key Metrics:** Provider, Policy #, Expiration  
**Insights:** Renewal reminders  
**Actions:** View document, Set renewal reminder  

---

### **11. MANUAL (`manual`)**

**Data Captured:**
```typescript
{
  notes: string
  // Any custom fields user added
}
```

**Display Template:**
```
┌────────────────────────────────────────┐
│ 📝 Note                               │
│                           Today       │
│                                        │
│ "Noticed slight pulling to the right  │
│ when braking. Need to check brake     │
│ alignment at next service."           │
│                                        │
│ At: 77,145 mi                         │
│                                        │
│ [Edit Note]  [Delete]                 │
└────────────────────────────────────────┘
```

**Primary Value:** Note preview  
**Key Metrics:** Mileage when noted  
**Insights:** N/A  
**Actions:** Edit note, Delete  

---

## **Standard Card Anatomy (All Types)**

```
┌────────────────────────────────────────┐
│ [Icon] Title              Primary $    │  ← Header
│        Subtitle          Secondary     │
│                          Time          │
│                                        │  ← 24px gap
│ Metric: Value  Metric: Value          │  ← Metrics Row
│                                        │
│ 🎯 Insight/Alert Badge                │  ← Insights/Alerts
│ ⚠️ Action Recommendation              │
│                                        │
│ 📷 Photo/Document indicator           │  ← Media
│                                        │  ← 24px gap (border-top)
│ [Primary Action]  [Secondary]         │  ← Actions
└────────────────────────────────────────┘
```

**Consistent Elements:**
1. **Header** (Icon + Title + Primary Value + Time)
2. **Metrics** (Key data points in label: value format)
3. **Insights** (Colored badges with icons)
4. **Media** (Photo/document indicator)
5. **Actions** (Large buttons for primary/secondary actions)

---

## **Display Priority Rules**

### **What to Show (In Order):**
1. **Primary Value** (cost, reading, status) - BIG & BOLD
2. **Key Metrics** (3-5 most important data points)
3. **Actionable Insights** (recommendations, alerts, comparisons)
4. **Media Indicator** (if photo/document exists)
5. **Clear Actions** (what user can do next)

### **What NOT to Show:**
- Internal IDs
- Confidence scores
- Raw JSON data
- Technical metadata
- Timestamps more precise than needed

---

## **Next Steps**

1. ✅ Create reusable card component with standard anatomy
2. ✅ Build type-specific renderers for each event type
3. ✅ Implement insight/alert logic for each type
4. ✅ Add action buttons appropriate to each type
5. ✅ Handle missing data gracefully (show empty states)

---

**Goal:** Every event type follows the same visual pattern but shows the most relevant information for that type.
