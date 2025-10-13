# 🚀 Quick Start Testing Guide

## ✅ Ready to Test!

The new processor-based architecture is ready. Here's how to test it:

---

## 📍 **Test Page Location**

```
http://localhost:3000/test/document-scanner
```

---

## 🎯 **What to Test**

### **1. VIN Scanner** (Production Ready ✅)
**What it does:**
- Extracts 17-character VIN from images
- Validates check digit
- Enriches with NHTSA vehicle data
- Returns make, model, year, trim, engine, etc.

**Test images:**
- Dashboard VIN plate photos
- Door jamb VIN stickers
- Windshield VIN labels
- Clear, well-lit photos work best

**Expected result:**
```json
{
  "vin": "3GNAL4EK7DS559435",
  "make": "CHEVROLET",
  "model": "Captiva Sport",
  "year": 2013,
  "trim": "LTZ",
  "engineType": "2.4L 4-Cylinder",
  "transmission": "Automatic",
  "manufacturer": "GENERAL MOTORS LLC",
  "plantCountry": "MEXICO",
  ... (80+ more fields)
}
```

---

### **2. License Plate Scanner** (Production Ready ✅)
**What it does:**
- Extracts plate number
- Identifies state/province
- Validates format
- Detects country (US/CA)

**Test images:**
- Front or rear license plates
- Clear plate numbers
- Any US state or Canadian province

**Expected result:**
```json
{
  "plate": "ABC1234",
  "state": "CA",
  "country": "US",
  "location": "detected"
}
```

---

### **3. Other Types** (Coming Soon)
These types are defined but processors not yet implemented:
- `odometer` - Odometer reading extraction
- `insurance` - Insurance card parsing
- `drivers-license` - Driver's license data extraction

You'll see an error if you try these - that's expected!

---

## 🧪 **Testing Workflow**

### **Step 1: Start Dev Server**
```bash
npm run dev
# or
yarn dev
```

### **Step 2: Navigate to Test Page**
```
http://localhost:3000/test/document-scanner
```

### **Step 3: Select Document Type**
Click on "🚗 VIN" or "🔢 License Plate"

### **Step 4: Upload Images**
- Click "Browse" or drag & drop
- Select 1-10 images
- Multiple images will batch process

### **Step 5: View Results**
- Summary stats (success rate, confidence)
- Detailed results with full data
- Expand JSON to see all fields
- Check warnings/errors

---

## 📊 **What to Look For**

### **Success Indicators:**
- ✅ Green "Success" badge
- ✅ High confidence (>90%)
- ✅ Full data populated
- ✅ Fast processing (<3 sec/image)

### **Check Console Logs:**
```
[Processors] All processors registered: ['vin', 'license-plate']
[DocumentProcessing] Processing vin document...
[DocumentProcessing] Compressed: 145.2KB
[Vision API] Raw OCR text: 3GNAL4EK7DS559435
[VIN Processor] Found VIN: 3GNAL4EK7DS559435
[NHTSA] Decoding VIN: 3GNAL4EK7DS559435
[NHTSA] Decoded: 2013 CHEVROLET Captiva Sport
[VIN Processor] Enriched: 2013 CHEVROLET Captiva Sport
```

### **Common Issues:**
- ❌ "No processor registered" → Refresh page
- ❌ "No VIN found" → Image quality (try better lighting/angle)
- ❌ "Invalid VIN format" → Check digit failed (may be valid but uncommon)
- ❌ Low confidence (<80%) → Blurry or low-res image

---

## 🎨 **Test Scenarios**

### **Scenario 1: Single VIN**
1. Select "VIN"
2. Upload 1 clear VIN photo
3. Expect: Full vehicle data in 2-3 seconds

### **Scenario 2: Batch VINs**
1. Select "VIN"
2. Upload 5-10 VIN photos
3. Expect: All process sequentially, ~15-30 seconds total

### **Scenario 3: License Plate**
1. Select "License Plate"
2. Upload plate photo
3. Expect: Plate number + state in 2 seconds

### **Scenario 4: Mixed Quality**
1. Upload mix of clear + blurry images
2. Check warnings for low-confidence results
3. Note which images work best

---

## 📸 **Best Image Practices**

### **For VINs:**
- ✅ Direct, straight-on angle
- ✅ Good lighting (no shadows/glare)
- ✅ Close-up of VIN plate
- ✅ All 17 characters visible
- ❌ Avoid: angled shots, glare, partial VINs

### **For License Plates:**
- ✅ Centered plate in frame
- ✅ Clear plate number
- ✅ Good contrast
- ❌ Avoid: motion blur, dirty plates, night shots

---

## 🔍 **Debugging**

### **If Processing Fails:**

1. **Check console for errors**
   ```
   F12 → Console tab
   Look for red error messages
   ```

2. **Verify image format**
   - Supported: JPG, PNG, WEBP
   - Max size: 10MB
   - Resolution: 1920x1920 auto-compressed

3. **Check API response**
   ```
   Network tab → find /api/vision/process-json
   Check response payload
   ```

4. **Verify processor registered**
   ```
   Console should show:
   [Processors] All processors registered: ['vin', 'license-plate']
   ```

---

## 💡 **Pro Tips**

1. **Use Real Test Data**
   - Use your own vehicle VIN
   - Take photos with your phone
   - Test various lighting conditions

2. **Test Edge Cases**
   - Partial VINs (should fail gracefully)
   - Non-VIN text (should return "not found")
   - Upside-down images (may fail)
   - Very low resolution (will warn)

3. **Compare with Existing**
   - Test same images on `/test/batch-vision` (old architecture)
   - Compare results, speed, reliability
   - Should be identical or better

4. **Monitor Costs**
   - Each image costs ~$0.001 (gpt-4o-mini)
   - NHTSA API is free
   - 100 scans = ~$0.10

---

## 🎉 **Expected Experience**

**You should see:**
- ⚡ Fast processing (2-3 sec/image)
- ✅ High accuracy (95%+ confidence)
- 📊 Rich data (80+ fields for VINs)
- 🎨 Clean, organized UI
- 📈 Batch processing that scales

**Architecture benefits:**
- 🔌 Easy to add new document types
- 🎯 Type-safe throughout
- 🧩 Modular processors
- 📦 Consistent pipeline
- 🔄 Reusable service

---

## 📝 **Feedback**

As you test, note:
- ✅ What works well
- ❌ What doesn't work
- 💡 Ideas for improvement
- 🐛 Bugs to fix
- 🚀 Features to add

---

## 🚦 **Ready?**

1. ✅ Dev server running
2. ✅ Navigate to `/test/document-scanner`
3. ✅ Have test images ready
4. ✅ Open console for logs
5. ✅ Click "VIN" and upload!

**Happy testing! 🎊**
