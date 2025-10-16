# Event Types & AI Logging Architecture

## 🎯 Problem Statement
Users want to log various vehicle events via natural language in AI chat. Current "quick-odometer" endpoint is too limited.

---

## 📋 Complete Event Type Taxonomy

### 1. **Maintenance & Service** (`service`, `maintenance`)
**What users say:**
- "logged an oil change at 77k"
- "just rotated my tires"
- "replaced brake pads yesterday"
- "had the transmission serviced"
- "changed air filter"

**Data captured:**
- Service type (oil change, tire rotation, etc.)
- Mileage
- Cost (optional)
- Vendor/shop (optional)
- Parts replaced (optional)
- Next service due

---

### 2. **Mileage/Odometer** (`odometer`, `dashboard_snapshot`)
**What users say:**
- "current mileage is 77,000"
- "just hit 100k!"
- "odometer reading 85234"

**Data captured:**
- Mileage reading
- Fuel level (optional)
- Trip meter (optional)

---

### 3. **Fuel** (`fuel`)
**What users say:**
- "filled up, 12 gallons, $45"
- "gas at Shell, 306 miles on this tank"
- "fuel economy is 28 mpg"

**Data captured:**
- Gallons
- Cost
- Price per gallon
- Station/location
- Trip miles (for MPG calculation)

---

### 4. **Dashboard Warnings** (`dashboard_warning`, `dashboard_snapshot`)
**What users say:**
- "check engine light came on"
- "TPMS warning showing"
- "got error code P0420"

**Data captured:**
- Warning type (check engine, TPMS, ABS, etc.)
- Error codes (OBD-II)
- Severity
- Photo of dashboard
- Resolved status

---

### 5. **Tire Events** (`tire_pressure`, `tire_tread`, `tire_service`)
**What users say:**
- "new tires installed, Michelin Defenders"
- "checked tire pressure, all good"
- "got a flat, had to patch"
- "tread depth measured"

**Data captured:**
- Event type (new tires, rotation, pressure, tread, repair)
- Tire positions (FL, FR, RL, RR)
- Pressure readings (PSI)
- Tread depth (32nds)
- Brand/model (for new tires)
- Cost

---

### 6. **Damage & Incidents** (`damage`, `incident`)
**What users say:**
- "got a door ding in parking lot"
- "minor fender bender"
- "hail damage on hood"
- "windshield chip"

**Data captured:**
- Damage type (collision, vandalism, weather, etc.)
- Location on vehicle
- Severity (minor, moderate, major)
- Photos
- Insurance claim filed?
- Repair status

---

### 7. **Upgrades & Modifications** (`upgrade`, `modification`)
**What users say:**
- "installed new stereo"
- "added roof rack"
- "upgraded to LED headlights"

**Data captured:**
- Part/modification type
- Brand/model
- Cost
- Installation date
- DIY vs professional

---

### 8. **Inspections & Registrations** (`inspection`, `registration`)
**What users say:**
- "passed state inspection"
- "renewed registration"
- "emissions test completed"

**Data captured:**
- Inspection type
- Pass/fail
- Expiration date
- Cost
- Location/facility

---

### 9. **Parking & Location** (`parking`)
**What users say:**
- "parked at airport, level 3, spot B42"
- "left car at mechanic shop"

**Data captured:**
- Location name
- Level/floor
- Spot number
- Reminder time
- GPS coordinates

---

### 10. **Notes & Observations** (`note`, `observation`)
**What users say:**
- "noticed a weird noise when braking"
- "performance seems sluggish"
- "AC not cooling well"

**Data captured:**
- Free-form description
- Category (noise, performance, comfort, etc.)
- Severity
- Action needed?

---

## 🏗️ Proposed Architecture

### **Option A: Unified Smart Event Endpoint** ⭐ RECOMMENDED

```typescript
POST /api/vehicles/[id]/events/smart-log

Body: {
  message: string           // Natural language: "logged oil change at 77k"
  extracted: {              // AI-parsed structured data
    type: EventType
    mileage?: number
    date?: ISO string
    ... type-specific fields
  },
  context?: {               // Optional AI context
    confidence: number
    alternatives?: []
  }
}

Response: {
  event: CreatedEvent
  suggestions?: string[]    // AI suggestions for missing fields
}
```

**Benefits:**
- Single endpoint for all AI-driven logging
- Flexible schema per event type
- AI handles extraction, API validates & stores
- Easy to extend with new event types

---

### **Option B: Unified Event Endpoint (Generic)**

```typescript
POST /api/vehicles/[id]/events

Body: {
  type: EventType
  date: ISO string
  miles?: number
  payload: Record<string, any>  // Type-specific data
  source: 'ai_chat' | 'manual' | 'ocr'
  ...
}
```

**Benefits:**
- Works for AI AND manual entry
- Already exists in codebase
- Simpler, more direct

---

### **Option C: Hybrid (Current + Enhanced)**

Keep specific endpoints for manual/form entry:
- `/api/vehicles/[id]/events/service`
- `/api/vehicles/[id]/events/fuel`
- `/api/vehicles/[id]/events/damage`

Add unified AI endpoint:
- `/api/vehicles/[id]/events/ai-log`

**Benefits:**
- Optimized UX for each type (custom forms)
- AI gets flexible endpoint
- Best of both worlds

---

## 🎨 Frontend Component Architecture

### **Current: QuickOdometerModal**
- Limited to odometer + basic service
- Hard to extend

### **Proposed: SmartEventModal**

```typescript
interface SmartEventModalProps {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  vehicleName: string
  
  // AI-extracted proposal
  proposal: {
    type: EventType
    data: Record<string, any>
    preview: PreviewFields[]
    confidence?: number
  }
  
  onSuccess?: (event: Event) => void
}
```

**Features:**
- Dynamic form fields based on event type
- Pre-filled with AI-extracted data
- User can edit before approval
- Validation specific to event type
- Photo upload support
- Rich preview card

---

## 🧠 AI Extraction Patterns

### **Service Events:**
```typescript
const servicePatterns = [
  { 
    keywords: ['oil change', 'oil changed', 'change oil', 'changed the oil'],
    type: 'Oil Change',
    category: 'service',
    suggestFields: ['mileage', 'cost', 'vendor']
  },
  {
    keywords: ['tire rotation', 'rotated tires', 'rotate tires'],
    type: 'Tire Rotation',
    category: 'service',
    suggestFields: ['mileage', 'cost']
  },
  // ... more patterns
]
```

### **Fuel Events:**
```typescript
const fuelPatterns = [
  /filled? up.*?(\d+\.?\d*)\s*gal/i,        // "filled up 12 gallons"
  /(\d+\.?\d*)\s*gal.*?\$(\d+\.?\d*)/i,    // "12 gallons $45"
  /\$(\d+\.?\d*).*?(\d+\.?\d*)\s*gal/i,    // "$45 for 12 gallons"
]
```

### **Damage Events:**
```typescript
const damageKeywords = [
  { words: ['door ding', 'ding', 'dent'], severity: 'minor' },
  { words: ['fender bender', 'accident', 'collision'], severity: 'moderate' },
  { words: ['hail damage', 'hail'], type: 'weather', severity: 'moderate' },
  { words: ['windshield chip', 'crack'], type: 'glass' },
]
```

---

## 📊 Database Schema Considerations

### **Current: `vehicle_events` table**
```sql
type: string (enum)
date: timestamp
miles: integer
notes: text
payload: jsonb          -- Flexible type-specific data
display_summary: text   -- For timeline display
vendor_name: text       -- For service events
total_amount: decimal   -- For cost tracking
```

**Strengths:**
- Flexible `payload` for type-specific data
- Common fields extracted for querying
- Works for all event types

**Enhancement Needed:**
- Add `severity` enum (for warnings, damage)
- Add `status` enum (pending, resolved, etc.)
- Add `related_event_id` (for follow-ups)
- Index on `type` for filtering

---

## 🎯 Recommended Implementation Plan

### **Phase 1: Expand Current System** (Immediate)
1. Rename `quick-odometer` → `smart-log`
2. Add service type detection (already done ✅)
3. Support 3-5 most common event types
4. Use existing modal with dynamic title

### **Phase 2: Enhanced Modal** (Next)
1. Create `SmartEventModal` component
2. Dynamic form fields per event type
3. Photo upload integration
4. Better preview cards

### **Phase 3: Full Event Taxonomy** (Future)
1. Support all 10 event categories
2. Dedicated forms for complex events
3. Advanced AI extraction
4. Event relationships (e.g., warning → repair → resolution)

---

## 💡 Example User Flows

### **Flow 1: Oil Change**
```
User: "logged oil change at 77k, cost $45 at Jiffy Lube"
  ↓
AI Extracts:
  - type: 'service'
  - service_type: 'Oil Change'
  - mileage: 77000
  - cost: 45
  - vendor: 'Jiffy Lube'
  ↓
Shows Preview:
  ┌─────────────────────────────────┐
  │ Log Oil Change                  │
  │ Service: Oil Change             │
  │ Mileage: 77,000 miles          │
  │ Cost: $45.00                   │
  │ Vendor: Jiffy Lube             │
  │ Date: 10/9/2025                │
  │ [Reject] [Edit] [Approve]      │
  └─────────────────────────────────┘
  ↓
User Approves
  ↓
Creates service event ✅
```

### **Flow 2: Damage Report**
```
User: "got a door ding in parking lot today"
  ↓
AI Extracts:
  - type: 'damage'
  - damage_type: 'Door ding'
  - severity: 'minor'
  - location: 'Door'
  - notes: 'Parking lot incident'
  ↓
Shows Preview + Prompts:
  ┌─────────────────────────────────┐
  │ Report Damage                   │
  │ Type: Door ding                 │
  │ Severity: Minor                 │
  │ Location: Door                  │
  │ Photo: [Upload Photo]           │
  │ Insurance: No                   │
  │ [Reject] [Edit] [Approve]      │
  └─────────────────────────────────┘
```

### **Flow 3: Fuel Fill-Up**
```
User: "filled up at Shell, 12 gallons, $42, went 306 miles"
  ↓
AI Extracts:
  - type: 'fuel'
  - gallons: 12
  - cost: 42
  - station: 'Shell'
  - trip_miles: 306
  - mpg: 25.5 (calculated)
  ↓
Shows Preview:
  ┌─────────────────────────────────┐
  │ Log Fuel Fill-Up                │
  │ Station: Shell                  │
  │ Gallons: 12.0                   │
  │ Cost: $42.00 ($3.50/gal)       │
  │ Trip: 306 miles (25.5 MPG)     │
  │ [Reject] [Edit] [Approve]      │
  └─────────────────────────────────┘
```

---

## 🔧 Implementation Checklist

### **Backend:**
- [ ] Rename/refactor `quick-odometer` → `smart-log`
- [ ] Add event type schemas with validation
- [ ] Expand AI extraction for 10+ event types
- [ ] Add database fields (severity, status)
- [ ] Create event relationship system

### **Frontend:**
- [ ] Rename `QuickOdometerModal` → `SmartEventModal`
- [ ] Dynamic form fields per event type
- [ ] Photo upload integration
- [ ] Rich preview cards with icons
- [ ] Edit capability before approval

### **AI:**
- [ ] Expand keyword patterns for all event types
- [ ] Add confidence scoring
- [ ] Multi-field extraction (cost, vendor, etc.)
- [ ] Suggest missing fields
- [ ] Handle ambiguous requests

---

## 📝 Summary

**Current State:** Limited to odometer + basic service
**Proposed State:** Universal event logging system

**Key Changes:**
1. **Unified endpoint** for AI-driven event creation
2. **10 event categories** covering all user needs
3. **Smart extraction** from natural language
4. **Flexible schema** per event type
5. **Dynamic UI** that adapts to event type

**This architecture will scale to support ANY event type a user might want to log!**
