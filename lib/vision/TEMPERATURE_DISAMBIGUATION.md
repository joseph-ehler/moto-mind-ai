# Temperature Disambiguation in Dashboard Processing

## 🌡️ **Critical Safety Issue: Weather vs Engine Temperature**

Vehicle dashboards display **TWO COMPLETELY DIFFERENT** temperature readings that must never be confused:

### **1. Engine Coolant Temperature (CRITICAL)**
- **What**: Engine cooling system temperature
- **Display**: Analog gauge with needle (C-H scale)
- **Location**: Usually right side of gauge cluster
- **Danger**: Hot engine = potential breakdown/damage
- **Values**: Cold/Normal/Hot (not numeric)

### **2. Outside Weather Temperature (INFORMATIONAL)**
- **What**: Ambient air temperature outside vehicle
- **Display**: Digital display with °F or °C
- **Location**: Info center, dashboard display, climate control
- **Purpose**: Weather information for driver
- **Values**: Numeric (e.g., 72°F, 22°C)

## 🚨 **Why Confusion is Dangerous**

**Scenario**: Dashboard shows:
- Engine coolant gauge needle at "H" (HOT - DANGER!)
- Digital display shows "85°F" (pleasant weather)

**❌ WRONG Interpretation**: "Temperature is normal because it's 85°F"
**✅ CORRECT Interpretation**: "Engine is overheating (H), outside temp is 85°F"

**Result of confusion**: Driver ignores engine overheating, causing expensive damage.

## 🔧 **Technical Implementation**

### **Schema Fields**
```typescript
{
  coolant_temp: {
    status: "cold|normal|hot",
    gauge_position: "low|center|high"
  },
  outside_temp: {
    value: number,
    unit: "F"|"C", 
    display_location: string
  }
}
```

### **Identification Rules**
1. **Coolant Temperature**:
   - Analog gauge with needle
   - C-H markings (Cold-Hot)
   - Usually paired with fuel gauge
   - Needle position indicates status

2. **Outside Temperature**:
   - Digital numeric display
   - °F or °C unit indicator
   - Often in info center or climate display
   - Shows actual temperature value

### **Few-Shot Examples**
```
✓ CORRECT: Engine gauge at H + digital "75°F" = 
{
  "coolant_temp": {"status": "hot", "gauge_position": "high"},
  "outside_temp": {"value": 75, "unit": "F", "display_location": "info center"}
}

✗ INCORRECT: Seeing "75°F" and assuming engine temp is normal
```

## 📋 **Validation Checklist**

- [ ] Engine temperature extracted from C-H gauge only
- [ ] Outside temperature extracted from digital display only  
- [ ] Never confuse numeric weather temp with gauge position
- [ ] Both temperatures can exist simultaneously
- [ ] Clear labeling in UI: "Engine Temperature" vs "Outside Temperature"

## 🎯 **Expected Behavior**

**Dashboard with both temperatures**:
- Engine gauge at C → "Engine Cold"
- Digital display "85°F" → "Outside 85°F"
- Summary: "Engine Cold • Outside 85°F"

**UI Display**:
- **Engine Temperature**: COLD (gauge position)
- **Outside Temperature**: 85°F (info center)

## ⚠️ **Common Failure Modes**

1. **Temperature Confusion**: Using outside temp to assess engine status
2. **Missing Outside Temp**: Only extracting engine temp from gauge
3. **Wrong Units**: Confusing °F weather reading with engine gauge position
4. **Location Confusion**: Not noting where temperature is displayed

## 🔍 **Testing Requirements**

Test with dashboards showing:
- [ ] Engine hot + cold weather
- [ ] Engine cold + hot weather  
- [ ] Engine normal + moderate weather
- [ ] Only engine temp visible
- [ ] Only outside temp visible
- [ ] Both temperatures in different units (°F vs °C)

This disambiguation prevents dangerous misinterpretation of critical engine status information.
