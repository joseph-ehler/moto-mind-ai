# Upload Instructions for Gauge Reference Images 📊

You have great reference images! Here's how to add them to the system.

---

## 🎯 **Which Images to Use:**

From your collection, I recommend:

### **1. Analog Fuel** → `fuel-analog.jpg`
**Use: Image 2** (the photo showing E→F needle gauge at half tank)
- Clear E to F markings
- Needle at ~1/2 position
- Shows typical analog fuel gauge

### **2. Digital Fuel** → `fuel-digital.jpg`
**Use: Image 3** (horizontal bar gauge at bottom of tach)
- Shows bar-style digital fuel gauge
- Clear "0" marking and bar indicators
- Common modern style

**Alternative: Image 6** (E→F with colored bars) also works

### **3. Analog Coolant** → `coolant-analog.jpg`
**Use: Image 7** (C→H gauge with needle)
- Clear C to H markings
- Shows analog coolant temp needle
- Typical coolant gauge layout

**Alternative: Image 9** (shows coolant on left side of combined gauge)

### **4. Digital Coolant** → `coolant-digital.jpg`
**Status: Not available in your collection**
- This would show numeric temp like "195°F" or "90°C"
- **Solution:** Use a placeholder or skip (most dashboards use analog coolant)
- Or find a stock photo online

---

## 📁 **File Naming:**

Save your selected images as:
```
fuel-analog.jpg
fuel-digital.jpg
coolant-analog.jpg
coolant-digital.jpg  (optional - use placeholder if needed)
```

---

## 🚀 **Upload Options:**

### **Option A: Supabase Storage (Recommended)**

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/ucbbzzoimghnaoihyqbd/storage
   ```

2. **Open `reference-images` bucket**

3. **Upload files:**
   - `fuel-analog.jpg` (your Image 2)
   - `fuel-digital.jpg` (your Image 3)
   - `coolant-analog.jpg` (your Image 7)
   - `coolant-digital.jpg` (placeholder or find online)

4. **Verify URLs:**
   ```
   https://ucbbzzoimghnaoihyqbd.supabase.co/storage/v1/object/public/reference-images/fuel-analog.jpg
   https://ucbbzzoimghnaoihyqbd.supabase.co/storage/v1/object/public/reference-images/fuel-digital.jpg
   https://ucbbzzoimghnaoihyqbd.supabase.co/storage/v1/object/public/reference-images/coolant-analog.jpg
   https://ucbbzzoimghnaoihyqbd.supabase.co/storage/v1/object/public/reference-images/coolant-digital.jpg
   ```

---

### **Option B: Local Public Folder (Testing)**

1. **Save images to:**
   ```
   /public/reference-images/
   ```

2. **File structure:**
   ```
   /public/reference-images/
     ├── warning-lights-legend.jpg  ✅ Already uploaded
     ├── fuel-analog.jpg            ⏳ Add Image 2
     ├── fuel-digital.jpg           ⏳ Add Image 3
     ├── coolant-analog.jpg         ⏳ Add Image 7
     └── coolant-digital.jpg        ⏳ Find or create
   ```

---

## ✅ **Enable Feature:**

Once images are uploaded:

```bash
# In .env.local
VISION_USE_GAUGE_REFERENCES=true
```

Restart dev server:
```bash
npm run dev
```

---

## 🧪 **Test It:**

1. Capture a dashboard with analog fuel gauge
2. Check logs for: `"📊 Using gauge references for fuel/coolant accuracy"`
3. Verify extraction is more accurate
4. Try a dashboard with digital gauges

---

## 💡 **For Digital Coolant (Missing Image):**

If you don't have one, you can:

**Option 1: Find online** (recommended)
- Google: "car digital coolant temperature gauge"
- Look for numeric displays showing "195°F" or "90°C"

**Option 2: Use a placeholder**
- Save any gauge image as `coolant-digital.jpg`
- System will still work (most cars use analog coolant anyway)

**Option 3: Create a simple graphic**
- Text showing "195°F COOLANT TEMP"
- Or screenshot from a car manual

---

## 💰 **Cost Impact:**

With 4 additional gauge images:
- Base: $0.03/request
- + Warning lights: $0.04-0.05
- + 4 Gauges: $0.06-0.08
- **Total: ~$0.06-0.08 per dashboard**

**Acceptable if accuracy improves 10-15%!**

---

## 📊 **Quick Reference:**

| Image # | Type | Use For | File Name |
|---------|------|---------|-----------|
| 2 | Analog Fuel | Needle E→F gauge | `fuel-analog.jpg` |
| 3 | Digital Fuel | Bar/percentage display | `fuel-digital.jpg` |
| 7 | Analog Coolant | Needle C→H gauge | `coolant-analog.jpg` |
| TBD | Digital Coolant | Numeric temp display | `coolant-digital.jpg` |

---

## ✅ **Ready to Go!**

Once you upload these 4 images and enable the feature flag, the system will show GPT-4o these gauge type examples before analyzing dashboards, leading to much better fuel and coolant accuracy!

**Your collection is perfect for this - great find!** 🎯
