# Odometer Unit Architecture - Source of Truth + Display Flexibility

**Date:** October 2, 2025  
**Status:** Implemented in V2 Pipeline

---

## 🎯 **Design Philosophy**

**Preserve what was actually on the dashboard (source of truth) while normalizing for calculations.**

Users have dashboards in different units globally:
- 🇺🇸 **USA:** Miles (mi)
- 🇪🇺 **Europe:** Kilometers (km)
- 🇬🇧 **UK:** Miles (mi)
- 🇨🇦 **Canada:** Kilometers (km)
- 🇦🇺 **Australia:** Kilometers (km)

We need to:
1. **Capture** what's actually on the dashboard (489 km or 304 mi)
2. **Store** normalized values for calculations/sorting (always miles)
3. **Display** based on user preference (future: global mi/km toggle)

---

## 📊 **Data Structure**

### **Captured Dashboard: 489 km**

```json
{
  "key_facts": {
    // NORMALIZED (for calculations, sorting, comparisons)
    "odometer_miles": 304,           // Always in miles
    "odometer_unit": "mi",           // Always 'mi'
    
    // SOURCE OF TRUTH (what was on dashboard)
    "odometer_original_value": 489,  // Actual reading
    "odometer_original_unit": "km",  // Actual unit
    
    "trip_a_miles": 12.9,
    "fuel_eighths": 6,
    // ... other fields
  },
  
  "raw_extraction": {
    "odometer_miles": 304,           // Normalized
    "odometer_unit": "mi",           // Normalized
    "odometer_original": {           // Preserved
      "value": 489,
      "unit": "km"
    },
    // ... full AI response
  }
}
```

### **Summary Generation**

```
// For km dashboard:
"Odometer 304 mi (489 km on dash) • Fuel 75% • Engine Cold"

// For mi dashboard:
"Odometer 304 mi • Fuel 75% • Engine Cold"
```

---

## 🔧 **Why Normalize to Miles?**

### **1. Database Calculations**
```sql
-- Works reliably: all values in same unit
SELECT * FROM vehicle_events 
WHERE odometer_miles > 50000 
ORDER BY odometer_miles ASC;
```

### **2. Timeline Sorting**
Events always sort correctly by normalized miles:
```
Event 1: 100 mi
Event 2: 200 mi
Event 3: 300 mi
```

Not:
```
Event 1: 100 mi
Event 2: 50 km   -- Breaks sort order!
Event 3: 300 mi
```

### **3. Mileage Calculations**
```typescript
// Distance traveled between events
const distance = event2.odometer_miles - event1.odometer_miles
// Always correct, no unit conversion needed
```

---

## 🌍 **Display Logic (Future: User Preference)**

### **Phase 1: Show Original** ✅ (Current)
```typescript
// Always show what was on dashboard
const displayValue = event.key_facts.odometer_original_value
const displayUnit = event.key_facts.odometer_original_unit
// → "489 km" (matches dashboard)
```

### **Phase 2: User Preference** (Future)
```typescript
interface UserPreferences {
  display_units: 'mi' | 'km' | 'original'
}

function getDisplayOdometer(event, userPref) {
  if (userPref.display_units === 'original') {
    return {
      value: event.key_facts.odometer_original_value,
      unit: event.key_facts.odometer_original_unit
    }
  }
  
  if (userPref.display_units === 'km') {
    // Convert normalized miles → km
    return {
      value: Math.round(event.key_facts.odometer_miles * 1.609),
      unit: 'km'
    }
  }
  
  // Default: show normalized miles
  return {
    value: event.key_facts.odometer_miles,
    unit: 'mi'
  }
}
```

### **Phase 3: Global Toggle** (Future)
```tsx
// User settings page
<Toggle
  label="Distance Units"
  options={[
    { value: 'mi', label: 'Miles' },
    { value: 'km', label: 'Kilometers' },
    { value: 'original', label: 'As Captured' }
  ]}
  value={userSettings.display_units}
  onChange={updateUserSettings}
/>
```

**Effect:** All odometer displays across the app instantly switch units.

---

## 🔄 **Conversion Functions**

### **Miles → Kilometers**
```typescript
export function milesToKm(miles: number): number {
  return Math.round(miles * 1.609)
}
```

### **Kilometers → Miles**
```typescript
export function kmToMiles(km: number): number {
  return Math.round(km / 1.609)
}
```

### **Smart Display**
```typescript
export function formatOdometer(
  event: VehicleEvent,
  userPreference: 'mi' | 'km' | 'original' = 'original'
): string {
  const { odometer_miles, odometer_original_value, odometer_original_unit } = event.key_facts
  
  switch (userPreference) {
    case 'original':
      return `${odometer_original_value?.toLocaleString()} ${odometer_original_unit}`
    
    case 'km':
      const km = odometer_original_unit === 'km' 
        ? odometer_original_value 
        : milesToKm(odometer_miles)
      return `${km.toLocaleString()} km`
    
    case 'mi':
    default:
      return `${odometer_miles.toLocaleString()} mi`
  }
}
```

---

## 🎯 **Use Cases**

### **Use Case 1: European User, US Import Car**
- **Dashboard shows:** 50,000 mi
- **Stored normalized:** 50,000 mi
- **Stored original:** 50,000 mi
- **User sets preference:** km
- **Display:** 80,450 km (converted on the fly)

### **Use Case 2: US User, European Import Car**
- **Dashboard shows:** 80,000 km
- **Stored normalized:** 49,710 mi (converted)
- **Stored original:** 80,000 km
- **User sets preference:** mi
- **Display:** 49,710 mi (uses normalized value)

### **Use Case 3: Car Journalist Testing Both**
- **Dashboard shows:** 10,000 km
- **Stored normalized:** 6,214 mi
- **Stored original:** 10,000 km
- **User sets preference:** original
- **Display:** 10,000 km (exact dashboard reading)

### **Use Case 4: Maintenance Tracking**
- **Dashboard shows:** 100,000 km
- **Next service at:** 110,000 km
- **App calculates:** 68,350 mi (normalized) + 6,214 mi = 74,564 mi → 120,000 km
- **Reminder:** Service due in 10,000 km (shows in user's preferred unit)

---

## 📋 **Migration Notes**

### **Existing Events (V1)**
Old events have:
```json
"raw_extraction": {
  "odometer_raw": { "unit": "km", "value": 489 }
}
```

Can be migrated to V2 format:
```sql
UPDATE vehicle_events 
SET payload = jsonb_set(
  payload,
  '{key_facts,odometer_original_value}',
  payload->'raw_extraction'->'odometer_raw'->'value'
)
WHERE payload->'raw_extraction'->'odometer_raw' IS NOT NULL;
```

### **New Events (V2)**
Automatically include:
```json
{
  "odometer_miles": 304,
  "odometer_unit": "mi",
  "odometer_original_value": 489,
  "odometer_original_unit": "km"
}
```

---

## ✅ **Benefits of This Architecture**

### **1. Source of Truth Preserved**
- ✅ Always know what was actually on the dashboard
- ✅ Can verify extraction accuracy
- ✅ Legal/warranty documentation accurate

### **2. Calculations Work Reliably**
- ✅ Database queries simple (all in same unit)
- ✅ Timeline sorting correct
- ✅ Distance calculations accurate

### **3. Display Flexibility**
- ✅ Show original (current default)
- ✅ Convert to user preference (future)
- ✅ Global toggle (future)

### **4. International Support**
- ✅ Works for any country
- ✅ No data loss
- ✅ Users see what makes sense to them

---

## 🚀 **Implementation Status**

| Feature | Status | Notes |
|---------|--------|-------|
| **Capture original unit** | ✅ Done | V2 pipeline extracts unit |
| **Normalize to miles** | ✅ Done | V2 validator converts km→mi |
| **Store both values** | ✅ Done | `odometer_original_*` fields |
| **Display original** | ✅ Done | Summary shows "(489 km on dash)" |
| **User preference** | 📝 Future | Global settings toggle |
| **Display conversion** | 📝 Future | `formatOdometer()` helper |

---

## 📖 **Example: Complete Flow**

**1. User uploads dashboard photo (European car, 489 km)**

**2. V2 Vision extracts:**
```json
{
  "odometer_miles": 489,
  "odometer_unit": "km"
}
```

**3. V2 Validator normalizes:**
```json
{
  "odometer_miles": 304,  // Converted to miles
  "odometer_unit": "mi"
}
```

**4. V2 Pipeline preserves original:**
```json
{
  "odometer_original": {
    "value": 489,
    "unit": "km"
  }
}
```

**5. Stored in database:**
```json
{
  "key_facts": {
    "odometer_miles": 304,              // For calculations
    "odometer_unit": "mi",              // Normalized
    "odometer_original_value": 489,     // Source of truth
    "odometer_original_unit": "km"      // Source of truth
  }
}
```

**6. Displayed to user (current):**
```
"Odometer 304 mi (489 km on dash)"
```

**7. Future with preference set to km:**
```
"Odometer 489 km"
```

---

## 🎯 **Recommendation: Ship It!**

**Current implementation:**
- ✅ Preserves source of truth
- ✅ Enables future flexibility
- ✅ Works internationally
- ✅ No breaking changes

**Future enhancements can be added incrementally:**
1. Add user preferences table
2. Add display conversion helpers
3. Add global unit toggle UI
4. Migrate old events (optional)

**You're ready to ship with international support built in!** 🌍

