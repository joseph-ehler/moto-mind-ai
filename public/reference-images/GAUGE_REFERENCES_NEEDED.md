# Gauge Reference Images Needed 🎯

To improve fuel and coolant gauge accuracy, we need reference images showing different gauge types.

---

## 📊 **Fuel Gauge References**

### **Analog Fuel Gauges (Needle)**

**Need 3-5 example images showing:**

1. **Full Tank (F):**
   - Needle pointing at F
   - Shows what "8/8 eighths" looks like

2. **Half Tank (1/2):**
   - Needle at center mark
   - Shows what "4/8 eighths" looks like

3. **Empty (E):**
   - Needle pointing at E
   - Shows what "0/8 eighths" looks like

4. **Quarter Tank (1/4):**
   - Needle between E and halfway
   - Shows what "2/8 eighths" looks like

### **Digital Fuel Gauges**

**Need 2-3 example images showing:**

1. **Percentage Display:**
   - "75%" or similar numeric display
   - Shows digital percentage format

2. **Bar Display:**
   - █████░░░ (filled bars)
   - Shows bar gauge format

3. **Numeric Gallons/Liters:**
   - "12.5 gal" or "50 L"
   - Shows actual quantity display

---

## 🌡️ **Coolant Temperature Gauge References**

### **Analog Coolant Gauges (Needle)**

**Need 3 example images showing:**

1. **Cold (C):**
   - Needle at left/blue zone
   - Engine just started

2. **Normal (Center):**
   - Needle at center position
   - Normal operating temperature

3. **Hot (H):**
   - Needle at right/red zone
   - Overheating warning

### **Digital Coolant Displays**

**Need 2 example images showing:**

1. **Numeric Temperature:**
   - "195°F" or "90°C"
   - Shows actual temp reading

2. **Text/Icon:**
   - "COOLANT TEMP HIGH" warning
   - Or thermometer icon with bars

---

## 🎯 **How to Create/Find These:**

### **Option 1: Google Images**
Search for:
- "car fuel gauge needle full"
- "car fuel gauge empty"
- "digital fuel gauge percentage"
- "coolant temperature gauge cold"
- "coolant temperature gauge normal"

### **Option 2: Your Own Photos**
- Take photos of your vehicle dashboard
- Different fuel levels over time
- Cold start vs warmed up

### **Option 3: Stock Photos**
- Automotive stock photo sites
- Dashboard instrumentation photos

---

## 📁 **File Naming Convention:**

```
/public/reference-images/gauges/
  fuel-analog-full.jpg
  fuel-analog-half.jpg
  fuel-analog-quarter.jpg
  fuel-analog-empty.jpg
  fuel-digital-percentage.jpg
  fuel-digital-bars.jpg
  coolant-analog-cold.jpg
  coolant-analog-normal.jpg
  coolant-analog-hot.jpg
  coolant-digital-temp.jpg
```

---

## 💰 **Cost Impact:**

Each additional reference image adds ~$0.005-0.01 to request cost.

- Warning lights legend: +$0.01-0.02
- Fuel gauges (4 images): +$0.02-0.04
- Coolant gauges (3 images): +$0.015-0.03
- **Total with all references: +$0.045-0.09 per request**

**Current:** ~$0.03/request  
**With all references:** ~$0.08-0.12/request  
**Increase:** 2.5-4x cost

**Trade-off Decision:**
- If accuracy improves 15-20% → Worth it ✅
- If accuracy improves <10% → Too expensive ❌
- Consider: Create composite image with all gauges (cheaper!)

---

## 🎨 **Alternative: Single Composite Image**

**Better approach:** Create ONE image showing all gauge types side-by-side:

```
┌─────────────────────────────────────────┐
│ FUEL GAUGES                             │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│ │ E->F │ │ 75%  │ │ Bars │ │12 gal│   │
│ │Needle│ │Digital│ │█████░│ │Numeric│  │
│ └──────┘ └──────┘ └──────┘ └──────┘   │
│                                         │
│ COOLANT TEMP                            │
│ ┌──────┐ ┌──────┐ ┌──────┐            │
│ │ C->H │ │ 195°F│ │ Icon │            │
│ │Needle│ │Digital│ │  🌡️  │            │
│ └──────┘ └──────┘ └──────┘            │
└─────────────────────────────────────────┘
```

**Cost:** Only +$0.01-0.02 (single extra image)  
**Benefit:** Shows all variations at once  
**Recommended:** ✅ Start with composite, add individual images if needed

---

## ✅ **Next Steps:**

1. Create/find gauge reference images
2. Create composite image or individual files
3. Upload to `/public/reference-images/gauges/`
4. Update prompt builder to include gauge references
5. A/B test accuracy improvement
6. Measure ROI vs cost increase

---

**Status:** 📋 Waiting for gauge reference images to be created/uploaded
