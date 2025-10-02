# Edit Event Modal - V2 Dashboard Alignment ✅

**Date:** October 2, 2025  
**Status:** Fully aligned with V2 dashboard schema

---

## 🎯 **What's Now Editable for Dashboard Snapshots**

### **Section 1: Event Information**
- **Event Type** (read-only display)
- **Odometer Reading** (normalized miles for database)
- **Notes** (user comments)

### **Section 2: Dashboard Readings** (NEW! ✅)

#### **Odometer (Source of Truth)**
- ✅ **Dashboard Reading** - Exact value shown on dash (number input)
- ✅ **Unit** - mi or km (dropdown)
- 📝 Helper text: "Exact reading from dashboard"

**Auto-calculation:** When user changes original value/unit, normalized miles recalculates automatically!
- 500 km → saves as 311 mi
- 300 mi → saves as 300 mi

---

#### **Fuel Level**
- ✅ **Fuel eighths** (0-8 dropdown)
  - E (Empty - 0/8)
  - 1/8, 2/8, 3/8, 4/8, 5/8, 6/8, 7/8
  - F (Full - 8/8)
- 📝 Helper text: "Fuel gauge needle position"

---

#### **Coolant Temperature**
- ✅ **Coolant temp** (dropdown)
  - Not visible
  - Cold (C)
  - Normal (Center)
  - Hot (H)
- 📝 Helper text: "Engine temperature gauge reading"

---

#### **Outside Temperature**
- ✅ **Temperature value** (number input, -50 to 150)
- ✅ **Unit** (dropdown: °F or °C)
- 📝 Two-column layout for value + unit

---

#### **Oil Life Percentage** (if available)
- ✅ **Oil life %** (number input, 0-100)
- 📝 Helper text: "If displayed on dashboard"
- 📝 Only shows if field exists

---

#### **Service Message** (if available)
- ✅ **Service message** (text input)
- 📝 Placeholder: "Service due soon, Oil change required"
- 📝 Helper text: "Warning or maintenance message displayed"
- 📝 Only shows if field exists

---

### **Section 3: Edit Tracking**
- **Edit reason** (optional text input)
- 📝 Recorded in change log

---

## 🔄 **Smart Auto-Calculation**

When user edits odometer:

```typescript
// User changes:
odometer_original_value: 500
odometer_original_unit: 'km'

// System automatically calculates:
odometer_miles: 311  // 500 / 1.609 = 311 mi
odometer_unit: 'mi'  // Always normalized to miles
```

**Saved to database:**
```json
{
  "miles": 311,  // Top-level (normalized)
  "payload": {
    "key_facts": {
      "odometer_miles": 311,              // Normalized
      "odometer_unit": "mi",              // Always mi
      "odometer_original_value": 500,     // Source of truth
      "odometer_original_unit": "km",     // Source of truth
      "fuel_eighths": 7,
      "coolant_temp": "cold",
      "outside_temp_value": 18,
      "outside_temp_unit": "C",
      // ...
    }
  }
}
```

---

## 🎨 **UI Features**

### **Visual Design**
- ✅ Icons for each field type (Gauge, Droplets, Thermometer, AlertTriangle)
- ✅ Helper text under each input
- ✅ Two-column grids for value + unit pairs
- ✅ Consistent styling with `h-12 rounded-xl` inputs
- ✅ Proper focus states

### **Field Validation**
- ✅ Odometer: 0-999,999
- ✅ Fuel: 0-8 (dropdown, can't be invalid)
- ✅ Outside temp: -50 to 150
- ✅ Oil life: 0-100%

### **Conditional Display**
- Dashboard section only shows for `dashboard_snapshot` events
- Oil life field only shows if it exists in payload
- Service message only shows if it exists in payload

---

## 📊 **Comparison: Before vs After**

### **Before:**
```
Dashboard Snapshot Modal:
- Odometer (miles only)
- Notes

→ 2 editable fields
```

### **After:**
```
Dashboard Snapshot Modal:
- Odometer Reading (normalized miles)
- Dashboard Reading (original value)
- Unit (mi/km)
- Fuel Level (0-8)
- Coolant Temperature
- Outside Temperature + Unit
- Oil Life %
- Service Message
- Notes

→ 9 editable fields with smart calculations
```

---

## ✅ **What Works Now**

1. **Edit original odometer unit**
   - User: "Dashboard showed 500 km, AI extracted 311 mi"
   - Fix: Change to 500 km
   - Result: Saves 500 km original, 311 mi normalized

2. **Fix fuel reading**
   - User: "Fuel was actually at 3/4, not 7/8"
   - Fix: Select "3/4 (6/8)" from dropdown
   - Result: Updates to 6 eighths

3. **Correct temperature**
   - User: "Outside was 20°C, not 18°C"
   - Fix: Change value to 20
   - Result: Updates temperature

4. **Add service message**
   - User: "Dashboard said 'Oil change due'"
   - Fix: Type service message
   - Result: Saves message

5. **All changes tracked**
   - Edit reason: "Corrected fuel reading from photo"
   - Result: Recorded in event's edit history

---

## 🚀 **Benefits**

### **For Users:**
- ✅ Fix extraction errors easily
- ✅ Update all dashboard fields
- ✅ Preserve source of truth (km vs mi)
- ✅ Clear field labels and helpers

### **For Data Quality:**
- ✅ Manual corrections improve accuracy
- ✅ Edit tracking shows what changed
- ✅ Source of truth always preserved
- ✅ Normalized values always consistent

### **For Future Features:**
- ✅ Ready for global unit preference toggle
- ✅ All V2 fields editable
- ✅ Extensible for new fields

---

## 🎯 **Example Edit Flow**

**User sees timeline event:**
```
Odometer 306 mi • (493 km on dash) • Fuel 88% • Engine Cold
```

**User clicks Edit:**

Modal shows:
- Event Information section (miles, notes)
- **Dashboard Readings section** (9 fields)
- Edit Tracking section (reason)

**User makes changes:**
1. Changes fuel from 7/8 to 6/8
2. Changes outside temp from 18°C to 20°C
3. Adds edit reason: "Corrected fuel and temp from photo review"

**Saves:**
- ✅ Updates `key_facts.fuel_eighths` to 6
- ✅ Updates `key_facts.outside_temp_value` to 20
- ✅ Preserves all other fields
- ✅ Records edit reason in history
- ✅ Updates `edited_at` timestamp

**Result:**
Timeline event now shows:
```
Odometer 306 mi • (493 km on dash) • Fuel 75% • Engine Cold • Outside 20°C
                                      ↑ Updated     ↑ Updated
```

---

## 📝 **Technical Notes**

### **Dependencies Added:**
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Thermometer, Droplets, AlertTriangle } from 'lucide-react'
```

### **Form State Extended:**
```typescript
// Dashboard-specific fields
odometer_original_value: number | string
odometer_original_unit: 'mi' | 'km'
fuel_eighths: number | string
coolant_temp: string
outside_temp_value: number | string
outside_temp_unit: 'F' | 'C'
oil_life_percent: number | string
service_message: string
```

### **Submit Logic:**
- Recalculates normalized miles from original value + unit
- Updates all `key_facts` fields
- Preserves non-edited fields
- Records edit reason

---

## ✅ **Status: Production Ready**

The Edit Event Modal now:
- ✅ Fully supports V2 dashboard schema
- ✅ Allows editing all relevant fields
- ✅ Auto-calculates normalized values
- ✅ Preserves source of truth
- ✅ Tracks all changes

**Ready to ship!** Users can now correct any dashboard extraction errors while maintaining data integrity. 🚀
