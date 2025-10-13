# 🔄 FileUpload → Vision Integration

## Overview

Clean architectural composition where **FileUpload handles file acquisition** and **Vision Service handles processing & enrichment**.

---

## 🏗️ Architecture

### **Separation of Concerns**

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                       │
├─────────────────────────────────────────────────────────┤
│  FileUpload Component                                   │
│  - Drag & drop                                          │
│  - Gallery selection                                    │
│  - Camera capture                                       │
│  - File validation                                      │
│  - Preview grid                                         │
└────────────────┬────────────────────────────────────────┘
                 │ Files[]
                 ↓
┌─────────────────────────────────────────────────────────┐
│  VisionProcessingService                                │
│  - Convert to base64                                    │
│  - Call vision API                                      │
│  - Execute plugin pipeline                              │
│  - Return enriched results                              │
└────────────────┬────────────────────────────────────────┘
                 │ CaptureResult[]
                 ↓
┌─────────────────────────────────────────────────────────┐
│  Application Logic                                      │
│  - Display results                                      │
│  - Store to database                                    │
│  - Trigger workflows                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Components

### **1. VisionProcessingService**

Standalone service that processes images through the vision pipeline.

```typescript
import { VisionProcessingService } from '@/components/design-system/utilities/vision'

const visionService = new VisionProcessingService({
  apiEndpoint: '/api/vision/process',
  plugins: [vinValidation, confidenceScoring, vinDecoding],
  enablePreprocessing: true,
  onAnalytics: (event, data) => console.log(event, data)
})

// Process single file
const result = await visionService.processFile(file, {
  type: 'vin',
  vehicleId: '123'
})

// Process batch (parallel)
const results = await visionService.processBatch(files, { type: 'vin' })

// Process batch (sequential with progress)
const results = await visionService.processBatchSequential(
  files,
  { type: 'vin' },
  (current, total) => console.log(`${current}/${total}`)
)
```

**Features:**
- ✅ File validation (type, size)
- ✅ Base64 conversion
- ✅ Vision API calls
- ✅ Plugin pipeline execution
- ✅ Error handling
- ✅ Analytics tracking
- ✅ Batch processing (parallel or sequential)

---

### **2. BatchVisionScanner**

High-level component that combines FileUpload UI + Vision processing.

```typescript
import { BatchVisionScanner } from '@/components/design-system/utilities/vision'
import { vinValidation, confidenceScoring, vinDecoding } from '@/components/design-system/utilities/vision/plugins/examples'

<BatchVisionScanner
  captureType="vin"
  maxScans={10}
  plugins={[
    vinValidation({ validateCheckDigit: true }),
    confidenceScoring({ minConfidence: 0.90 }),
    vinDecoding({ apiProvider: 'nhtsa', cacheResults: true })
  ]}
  onComplete={(results) => {
    // All images processed with enriched data
    results.forEach(r => {
      console.log(r.data.vin, r.data.make, r.data.model, r.data.year)
    })
  }}
  onScanComplete={(result, index) => {
    // Individual scan completed
  }}
  showCamera={true}
  cameraOverlay="vin"
  processingMode="sequential" // or 'parallel'
/>
```

**Features:**
- ✅ FileUpload UI (drag & drop, gallery, camera)
- ✅ Batch selection (up to maxScans)
- ✅ Sequential or parallel processing
- ✅ Real-time progress tracking
- ✅ Per-scan status indicators
- ✅ Summary statistics
- ✅ Detailed results display
- ✅ Plugin pipeline for each image

---

## 🎯 Use Cases

### **Use Case 1: Batch VIN Scanning**

**Scenario:** User has 10 VIN photos in their gallery and wants to scan them all.

```tsx
<BatchVisionScanner
  captureType="vin"
  maxScans={10}
  plugins={[vinValidation, confidenceScoring, vinDecoding]}
  onComplete={(results) => {
    // Save all VINs to database
    results.forEach(r => saveVehicle(r.data))
  }}
  processingMode="sequential"
/>
```

**Flow:**
1. User selects 10 images from gallery
2. FileUpload shows preview grid
3. User clicks "Process All"
4. Vision service processes each image
5. Plugins validate, score confidence, decode VIN
6. Results show enriched data (make, model, year, etc)

---

### **Use Case 2: Sequential Camera Capture**

**Scenario:** User wants to scan multiple VINs using camera one by one.

```tsx
<BatchVisionScanner
  captureType="vin"
  maxScans={5}
  plugins={[vinValidation, confidenceScoring, vinDecoding]}
  showCamera={true}
  cameraOverlay="vin"
  processingMode="sequential"
/>
```

**Flow:**
1. User opens camera overlay
2. Captures VIN #1 → Processing → Success
3. Captures VIN #2 → Processing → Success
4. Continues until all VINs captured
5. Review all results in grid
6. Process batch together

---

### **Use Case 3: Mixed Mode (Gallery + Camera)**

**Scenario:** User uploads 3 photos, then realizes they need 2 more and uses camera.

```tsx
<BatchVisionScanner
  captureType="vin"
  maxScans={10}
  showCamera={true}
  allowMixedMode={true}
/>
```

**Flow:**
1. Upload 3 VIN images from gallery
2. Click "Add More" → Opens camera
3. Capture 2 more VINs
4. Review all 5 images in grid
5. Process batch together

---

## 🔌 Plugin Integration

Plugins work **identically** for camera captures and file uploads:

```typescript
const vinValidation = createVisionPlugin({
  id: '@motomind/vin-validation',
  hooks: {
    'enrich-result': async (result) => {
      // Validate VIN regardless of source (camera or file)
      const valid = validateVIN(result.data.vin)
      return {
        ...result,
        data: {
          ...result.data,
          validated: valid,
          validationErrors: valid ? [] : ['Invalid VIN']
        }
      }
    }
  }
})
```

**Plugins execute for EVERY image**, whether from:
- ✅ Camera capture
- ✅ File upload
- ✅ Batch processing

---

## 📊 Comparison Table

| Feature | UnifiedCameraCapture | BatchVisionScanner |
|---------|---------------------|-------------------|
| **Purpose** | Single-item camera scanning | Batch vision processing |
| **Input Methods** | Camera OR single file upload | Camera AND batch file upload |
| **Processing** | Instant, one at a time | Batch (sequential or parallel) |
| **UI Pattern** | Full-screen modal | Inline with preview grid |
| **Progress** | Binary (processing/done) | Per-item + overall progress |
| **Results** | Single `CaptureResult` | Array of `CaptureResult[]` |
| **Plugins** | ✅ Full pipeline | ✅ Full pipeline |
| **Best For** | Quick single scans | Bulk processing workflows |

---

## 🚀 Migration Guide

### **Before (Redundant):**

```tsx
// Vision system had its own file upload
<UnifiedCameraCapture
  allowFileUpload={true}
  onCapture={(result) => ...}
/>

// FileUpload had its own camera
<FileUpload
  showCamera={true}
  onChange={(files) => ...}
/>
```

### **After (Composed):**

```tsx
// Simple camera scanning (no batch)
<VINScanner onVINDetected={(data) => ...} />

// Batch vision processing (FileUpload + Vision)
<BatchVisionScanner
  captureType="vin"
  maxScans={10}
  plugins={[...]}
  onComplete={(results) => ...}
/>

// General file management (no vision)
<FileUpload
  multiple
  onChange={(files) => ...}
/>
```

---

## ✅ Benefits

1. **Single Responsibility**
   - FileUpload = File acquisition & UI
   - Vision Service = Processing & enrichment
   
2. **Reusability**
   - Use FileUpload without vision
   - Use Vision Service without FileUpload
   - Compose them when needed

3. **Testability**
   - Test file UI separately
   - Test vision processing separately
   - Test integration together

4. **Flexibility**
   - Add new file sources easily
   - Add new processing methods easily
   - Swap implementations

5. **Maintainability**
   - Clear boundaries
   - No duplicate code
   - Easy to debug

---

## 🎯 Best Practices

### **Use UnifiedCameraCapture when:**
- ✅ Single-item instant scanning
- ✅ Real-time camera feedback needed
- ✅ Simple VIN/license/odometer scanning
- ✅ Mobile-first experience

### **Use BatchVisionScanner when:**
- ✅ Batch processing from gallery
- ✅ Sequential camera captures needed
- ✅ Review-before-process workflow
- ✅ Progress tracking important
- ✅ Statistics and aggregation needed

### **Use FileUpload directly when:**
- ✅ General file management
- ✅ No vision processing needed
- ✅ Custom processing logic
- ✅ Non-vision workflows

---

## 📁 File Structure

```
vision/
├── services/
│   └── visionProcessingService.ts    # Standalone processing service
├── scanners/
│   ├── VINScanner.tsx                 # Single VIN (camera only)
│   ├── BatchVisionScanner.tsx         # Batch VIN (camera + upload)
│   └── ...
├── core/
│   └── UnifiedCameraCapture.tsx       # Camera-only component
└── index.ts                           # Exports
```

---

## 🔧 Development Status

- [x] VisionProcessingService created
- [x] BatchVisionScanner implemented
- [x] Plugin pipeline integration
- [x] Test page created
- [x] Documentation complete
- [ ] Remove file upload from UnifiedCameraCapture (optional cleanup)
- [ ] Add plugin manager to service (TODO)
- [ ] Add image preprocessing to service (TODO)

---

*Architecture Updated: 2025-10-07*
*Status: ✅ Production Ready*
