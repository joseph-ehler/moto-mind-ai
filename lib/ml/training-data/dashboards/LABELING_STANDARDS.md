# Dashboard Image Labeling Standards

## 🎯 **Purpose**
Establish rigorous, consistent standards for creating ground truth labels for dashboard images to prevent the systematic labeling errors that occurred in initial validation.

## 🚨 **Critical Lessons from Initial Validation Failures**
- **Mislabeled odometer by 100x** (85,432 vs 920 miles) - didn't examine image carefully
- **Missed visible warning lights** - didn't zoom in to check all indicators  
- **Claimed wrong fuel positions** - didn't trace needle position precisely
- **Created labels without visual inspection** - relied on assumptions

**These standards prevent these failures from recurring.**

---

## 📋 **Pre-Labeling Checklist**

Before labeling ANY image, complete this checklist:

- [ ] **Image loaded at full resolution** (not thumbnail)
- [ ] **Image brightness/contrast adjusted** if needed for visibility
- [ ] **All dashboard areas examined** systematically (left to right)
- [ ] **Labeling template prepared** with all required fields
- [ ] **Reference materials available** (unit conversion, gauge types)

---

## 🔍 **Systematic Visual Inspection Process**

### **Step 1: Overall Assessment**
1. **Image quality check**: Is image clear enough for accurate reading?
2. **Dashboard type identification**: Analog, digital, or hybrid cluster
3. **Lighting assessment**: Any glare, shadows, or reflections affecting readings?
4. **Visible elements inventory**: What gauges/displays are clearly visible?

### **Step 2: Odometer Reading (CRITICAL)**
**This is where most errors occurred - follow precisely:**

1. **Locate odometer display**
   - Usually center of cluster (digital) or within speedometer (analog)
   - Look for "ODO", "MILES", "KM" labels

2. **Read EVERY digit visible**
   - Zoom in to 200% if necessary
   - Read from left to right: 1-2-7-8-5-6 (not 127 or 856)
   - Include leading zeros if present: 012847 = 12,847

3. **Identify units**
   - Look for "MI", "MILES", "KM", "KILOMETERS" indicators
   - Check if display shows "x1000" or similar multipliers

4. **Verify reading**
   - Does the number make sense for vehicle age/condition?
   - Cross-check with any trip odometer if visible
   - If unsure, mark as "uncertain" with confidence level

**Common Mistakes to Avoid:**
- ❌ Reading only 3-4 digits of a 6-digit display
- ❌ Assuming units without checking indicators
- ❌ Confusing trip odometer with main odometer
- ❌ Not accounting for decimal points or separators

### **Step 3: Fuel Level Reading**
1. **Locate fuel gauge**
   - Usually left side of cluster
   - Look for "F" (Full) and "E" (Empty) markers

2. **Trace needle position precisely**
   - Follow needle from center to tip
   - Note exact position relative to markings
   - Count tick marks between E and F

3. **Determine scale type**
   - **Quarters**: E, 1/4, 1/2, 3/4, F (5 positions)
   - **Eighths**: E, 1/8, 2/8, 3/8, 4/8, 5/8, 6/8, 7/8, F (9 positions)
   - **Other**: Note actual markings visible

4. **Convert to standard format**
   - Always convert to eighths for consistency
   - 1/4 = 2/8, 1/2 = 4/8, 3/4 = 6/8, F = 8/8

### **Step 4: Warning Lights**
1. **Systematic scan**
   - Check all areas where warning lights appear
   - Look for illuminated (bright/glowing) indicators
   - Distinguish from unlit symbols

2. **Identify specific lights**
   - Don't use generic "other" - identify actual symbol
   - Common types: check_engine, oil_pressure, battery, abs, airbag, seatbelt
   - If unknown symbol, describe it: "yellow triangle with exclamation"

3. **Verify illumination**
   - Only count clearly lit/active warnings
   - Dim or unlit symbols should not be included

### **Step 5: Temperature Readings**
1. **Distinguish temperature types**
   - **Engine coolant**: Usually analog gauge (C-H) on right side
   - **Outside temperature**: Digital display with °F/°C

2. **Engine coolant temperature**
   - Trace needle position on C-H scale
   - Note: C=Cold, Normal=Center, H=Hot
   - Record gauge position: low/center/high

3. **Outside temperature**
   - Look for digital display showing weather temp
   - Note exact value and unit (°F or °C)
   - Record display location (center, corner, etc.)

---

## 📝 **Labeling Template**

Use this exact format for all labels:

```json
{
  "image_file": "filename.jpg",
  "labeler_info": {
    "labeler_id": "initials_date",
    "labeling_date": "2025-09-30",
    "review_status": "first_pass|verified|final"
  },
  "image_quality": {
    "overall_quality": "A|B|C|D|F",
    "lighting": "excellent|good|fair|poor",
    "clarity": "sharp|acceptable|blurry",
    "glare_issues": "none|minor|significant",
    "notes": "Any visibility issues"
  },
  "vehicle_info": {
    "make": "Honda|Toyota|Ford|etc",
    "model": "Accord|Camry|F150|etc", 
    "year": 2013,
    "dashboard_type": "analog|digital|hybrid"
  },
  "ground_truth": {
    "odometer": {
      "value": 920,
      "unit": "miles|km",
      "visible": true,
      "confidence": "high|medium|low",
      "notes": "Digital display clearly visible, all digits readable"
    },
    "fuel_level": {
      "type": "quarters|eighths|percent",
      "value": 8,
      "display_text": "Full|3/4|1/2|1/4|Empty",
      "visible": true,
      "confidence": "high|medium|low", 
      "notes": "Needle pointing to F position"
    },
    "warning_lights": {
      "lights": ["check_engine", "oil_pressure"],
      "visible": true,
      "confidence": "high|medium|low",
      "notes": "Two clearly illuminated lights on left side"
    },
    "coolant_temp": {
      "status": "cold|normal|hot",
      "gauge_position": "low|center|high",
      "visible": true,
      "confidence": "high|medium|low",
      "notes": "Needle in normal operating range"
    },
    "outside_temp": {
      "value": 72,
      "unit": "F|C",
      "visible": true,
      "confidence": "high|medium|low",
      "notes": "Digital display showing 72°F in center"
    }
  },
  "labeling_notes": {
    "uncertainties": ["Any readings that were difficult to determine"],
    "assumptions": ["Any assumptions made during labeling"],
    "image_issues": ["Glare on speedometer made exact reading difficult"]
  }
}
```

---

## ✅ **Quality Control Process**

### **First Pass Labeling**
1. **Primary labeler** follows all standards above
2. **Complete all fields** with appropriate confidence levels
3. **Document uncertainties** and assumptions
4. **Mark as "first_pass"** in review_status

### **Second Pass Verification**
1. **Different reviewer** examines same image
2. **Independent labeling** without seeing first pass
3. **Compare results** field by field
4. **Flag discrepancies** for resolution

### **Conflict Resolution**
1. **Both reviewers discuss** discrepancies
2. **Re-examine image together** at high resolution
3. **Reach consensus** or mark as "uncertain"
4. **Document resolution** in notes

### **Final Validation**
1. **Senior reviewer** spot-checks 20% of labels
2. **Verify consistency** across similar images
3. **Approve for ground truth** use
4. **Mark as "final"** in review_status

---

## 🚫 **Common Errors to Avoid**

### **Odometer Errors**
- ❌ Reading partial digits (820 instead of 85,432)
- ❌ Confusing km with miles
- ❌ Missing leading zeros
- ❌ Reading trip odometer instead of main

### **Fuel Gauge Errors**  
- ❌ Estimating instead of tracing needle
- ❌ Confusing quarters with eighths scale
- ❌ Not accounting for needle thickness
- ❌ Assuming F=7/8 instead of F=8/8

### **Warning Light Errors**
- ❌ Using generic "other" instead of specific identification
- ❌ Including unlit symbols
- ❌ Missing lights due to insufficient examination
- ❌ Confusing indicator lights with warning lights

### **Temperature Errors**
- ❌ Confusing engine temp with outside temp
- ❌ Misreading digital displays
- ❌ Assuming units without verification
- ❌ Not distinguishing gauge types

---

## 📊 **Success Metrics**

### **Individual Image Standards**
- **Confidence levels**: >80% of readings marked "high confidence"
- **Completeness**: All visible elements labeled
- **Consistency**: Similar images produce similar labels
- **Documentation**: All uncertainties noted

### **Dataset Standards**
- **Inter-rater reliability**: >95% agreement between reviewers
- **Coverage**: Diverse vehicle types, conditions, readings
- **Quality**: >80% of images rated "A" or "B" quality
- **Validation**: 100% of labels verified by second reviewer

---

## 🎯 **Next Steps**

1. **Train labelers** on these standards
2. **Practice on 5-10 images** to calibrate process
3. **Refine standards** based on initial experience
4. **Begin systematic labeling** of 50+ image dataset
5. **Maintain quality control** throughout process

**Remember: The goal is rigorous, consistent ground truth that prevents the systematic errors we discovered in initial validation.**
