# Utilities Folder - Component Guide

Welcome to the MotoMind Design System utilities! This folder contains specialized components for file handling, vision processing, and general utilities.

---

## 📁 **Folder Structure**

```
utilities/
├── file-upload/          # Full-featured file upload system
├── vision/               # Vision processing & scanning system  
├── docs/                 # All documentation
├── ActionBars.tsx        # Action bar components
├── FilePreview.tsx       # File preview component
└── Search.tsx            # Search utilities
```

---

## 🎯 **Quick Decision Matrix**

### **Which Component Should I Use?**

| Your Need | Use This | Why |
|-----------|----------|-----|
| General file upload | **`FileUpload`** | Full-featured with drag-drop, validation, compression |
| Vehicle photo upload | **`FileUpload`** | Has camera + preview + batch mode |
| Document upload with drag-drop | **`FileUpload`** | Best for general uploads |
| Simple camera → process flow | **`SimpleCameraUpload`** | Minimal UI, quick workflows |
| VIN scanning in form field | **`vision/VINField`** | Integrated form field |
| License plate scanning | **`vision/LicensePlateScanner`** | Specialized scanner |
| Document scanning | **`vision/DocumentScanner`** | Specialized scanner |
| Batch document scanning | **`vision/BatchDocumentScanner`** or **`FileUpload`** (batch mode) | Both work |
| Custom camera workflow | **`vision/UnifiedCameraCapture`** | Low-level, customizable |

---

## 📦 **Component Details**

### **1. FileUpload** 🚀 **FULL-FEATURED**

**Location:** `./file-upload/`

**Purpose:** Complete file upload solution with advanced features

**Features:**
- ✅ Drag & drop file upload
- ✅ Camera capture with overlays (VIN, odometer, license plate, document)
- ✅ Auto-capture with heuristic detection
- ✅ Optional OCR enhancement for 90%+ accuracy
- ✅ Web Worker image compression (non-blocking UI)
- ✅ Batch mode (up to 20 files)
- ✅ Progress indicators & skeleton loaders
- ✅ File preview with thumbnails
- ✅ Validation (type, size, count)
- ✅ Accessibility (keyboard shortcuts, screen readers, haptic feedback)

**When to Use:**
- General file uploads (vehicle photos, documents, etc.)
- Need drag & drop functionality
- Need multiple files (batch mode)
- Need camera with auto-capture/OCR
- Need image compression
- Need advanced UX

**Example:**
```tsx
import { FileUpload } from '@/components/design-system'

// Basic usage
<FileUpload
  label="Vehicle Photos"
  accept="image/*"
  multiple
  maxFiles={10}
  value={files}
  onChange={setFiles}
/>

// With camera and auto-capture
<FileUpload
  label="VIN Photo"
  showCamera
  cameraOverlay="vin"
  enableAutoCapture
  enableOCR
  imageQuality="high"
  maxFiles={1}
  value={files}
  onChange={setFiles}
/>
```

**Architecture:**
- Refactored from 1,347-line monolith into modular hooks
- See `./file-upload/hooks/` for implementation details
- Web Worker for non-blocking compression

---

### **2. SimpleCameraUpload** ⚡ **LIGHTWEIGHT**

**Location:** `./vision/SimpleCameraUpload.tsx`

**Purpose:** Simple camera/upload for vision processing workflows

**Features:**
- ✅ Camera capture OR file upload
- ✅ Preview files before processing
- ✅ Process button submits all
- ✅ Minimal UI

**When to Use:**
- Simple camera → preview → process flow
- Integrating with vision scanners
- Minimal UI preferred
- Single file focus

**Don't Use When:**
- Need drag & drop
- Need auto-capture/OCR
- Need image compression
- Need batch mode (use FileUpload instead)

**Example:**
```tsx
import { SimpleCameraUpload } from '@/components/design-system/utilities/vision'

<SimpleCameraUpload
  onProcess={(files) => handleVisionProcessing(files)}
  maxFiles={1}
/>
```

---

### **3. Vision System** 🔍 **SPECIALIZED SCANNING**

**Location:** `./vision/`

**Purpose:** Specialized scanning components and vision processing

**Components:**

#### **Scanners (High-Level)**
- **`VINScanner`** - Complete VIN scanning workflow
- **`LicensePlateScanner`** - License plate scanning
- **`OdometerReader`** - Odometer reading
- **`DocumentScanner`** - Single document scanning
- **`BatchDocumentScanner`** - Multi-document scanning

#### **Form Helpers**
- **`VINField`** - VIN input with scanning button
- **`FormScannerField`** - Generic scanner field

#### **Core Components (Low-Level)**
- **`UnifiedCameraCapture`** - Configurable base camera
- **`CameraView`** - Camera UI
- **`FrameGuide`** - Overlay guides
- **`ProcessingModal`** - Processing feedback

#### **Hooks**
- **`useCamera`** - Camera lifecycle management
- **`useVisionProcessing`** - Vision API integration
- **`useBatchCapture`** - Batch capture logic
- **`useImagePreprocessing`** - Image enhancement
- **`useHaptic`** - Haptic feedback
- **`useIsMobile`** - Mobile detection

**Example:**
```tsx
import { VINScanner } from '@/components/design-system/utilities/vision'

<VINScanner
  onCapture={(vin, confidence) => {
    console.log('VIN detected:', vin, confidence)
  }}
/>
```

**Architecture:**
- **Layer 1:** Hooks (functional core - pure logic)
- **Layer 2:** UnifiedCameraCapture (configurable base)
- **Layer 3:** Scanners (domain-specific wrappers)

---

### **4. FilePreview** 👁️

**Location:** `./FilePreview.tsx`

**Purpose:** Rich file preview with AI vision insights

**Features:**
- File type detection
- Image preview
- PDF preview
- AI vision annotations
- Metadata display

**Example:**
```tsx
import { FilePreview } from '@/components/design-system'

<FilePreview
  file={file}
  showMetadata
  aiVisionData={visionResults}
/>
```

---

### **5. ActionBars** ⚙️

**Location:** `./ActionBars.tsx`

**Purpose:** Reusable action bar components

---

### **6. Search** 🔍

**Location:** `./Search.tsx`

**Purpose:** Search utilities and mobile detection

**Exports:**
- `useIsMobile()` - Detect mobile devices
- `useIsTouch()` - Detect touch support

---

## 🗺️ **Usage Flowchart**

```
Need to upload files?
├─ Simple camera/upload workflow?
│  └─ YES → SimpleCameraUpload
│
├─ Scanning specific items (VIN, license, etc.)?
│  └─ YES → vision/Scanners (VINScanner, etc.)
│
└─ General file upload with advanced features?
   └─ YES → FileUpload
```

---

## 📚 **Documentation**

All detailed documentation is in the `./docs/` folder:

```
docs/
├── fileupload/
│   ├── REFACTORING_COMPLETE.md
│   ├── OPTIMIZATIONS_COMPLETE.md
│   ├── OPTIMIZATION_OPPORTUNITIES.md
│   ├── REFACTOR_PROPOSAL.md
│   ├── AUTO_CAPTURE_PHASE1.md
│   └── AUTO_CAPTURE_PHASE2.md
│
├── vision/
│   ├── BATCH_UPLOAD_DESIGN.md
│   ├── CAMERA_BEHAVIOR.md
│   ├── COMPLETE.md
│   ├── DESIGN_SYSTEM_AUDIT.md
│   ├── FILE_UPLOAD_UPGRADE.md
│   ├── INTEGRATION_PROGRESS.md
│   ├── MOBILE_NATIVE_UPGRADE.md
│   ├── PERFORMANCE_ISSUES_AND_SOLUTIONS.md
│   ├── PHASE1_AUDIT.md
│   ├── PHASE2_COMPLETE.md
│   ├── PREPROCESSING_GUIDE.md
│   ├── QUICK_WINS_COMPLETE.md
│   ├── QUICK_WINS_PROGRESS.md
│   ├── SHOWCASE_READY.md
│   └── TOP_TIER_ROADMAP.md
│
├── filepreview/
│   ├── AI_VISION_GUIDE.md
│   ├── IMPLEMENTATION_GUIDE.md
│   └── WORKING_FEATURES_GUIDE.md
│
└── UTILITIES_ORGANIZATION_AUDIT.md
```

---

## 🏗️ **Architecture Principles**

### **FileUpload Architecture**
```
FileUpload.tsx (orchestrator)
├── hooks/
│   ├── useCameraStream.ts      # Camera management
│   ├── useAutoCapture.ts       # Detection & auto-capture
│   ├── useKeyboardShortcuts.ts # Keyboard handlers
│   └── useCompressionWorker.ts # Web Worker compression
├── detection/
│   ├── auto-capture-detection.ts  # Heuristic detection
│   └── auto-capture-ocr.ts        # OCR enhancement
├── workers/
│   └── compression.worker.ts      # Image compression
└── utils/
    ├── file-utils.ts              # File helpers
    └── camera-utils.ts            # Camera helpers
```

### **Vision Architecture**
```
Layer 1: Hooks (functional core)
    ↓
Layer 2: UnifiedCameraCapture (configurable base)
    ↓
Layer 3: Scanners (domain-specific wrappers)
    ↓
Layer 4: Form Helpers (integration)
```

---

## 🎨 **Design System Integration**

All components follow MotoMind design patterns:

- **Layout:** Use `Stack`, `Flex`, `Grid` from design system
- **Typography:** Use `Heading`, `Text` components
- **Spacing:** Consistent spacing tokens
- **Accessibility:** ARIA labels, keyboard navigation, screen readers
- **Mobile-first:** Responsive design, touch-friendly
- **Performance:** Web Workers, lazy loading, optimized rendering

---

## 🧪 **Testing**

### **FileUpload**
- Unit tests for hooks (camera, auto-capture, compression)
- Integration tests for file upload flow
- E2E tests for camera capture

### **Vision**
- Unit tests for detection algorithms
- Integration tests for scanner workflows
- E2E tests for vision processing

---

## 🚀 **Performance**

### **FileUpload**
- **Web Worker compression:** Zero UI blocking
- **Lazy OCR loading:** ~2MB bundle only when needed
- **Optimized rendering:** React.memo for previews
- **Image optimization:** Automatic compression

### **Vision**
- **Heuristic detection:** 2 FPS (500ms intervals)
- **Optional OCR:** Lazy-loaded on demand
- **Image preprocessing:** Client-side enhancement
- **Batch processing:** Efficient multi-file handling

---

## 📝 **Contributing**

When adding new utilities:

1. **Choose the right location:**
   - General upload features → `file-upload/`
   - Vision/scanning features → `vision/`
   - Standalone utilities → Root level

2. **Follow the architecture:**
   - Extract hooks for reusability
   - Keep components focused
   - Add clear JSDoc comments

3. **Update this README:**
   - Add to decision matrix
   - Document new features
   - Provide examples

4. **Write tests:**
   - Unit tests for logic
   - Integration tests for flows
   - E2E tests for critical paths

---

## 🔗 **Related Resources**

- [Design System Documentation](../../README.md)
- [FileUpload Refactoring](./docs/fileupload/REFACTORING_COMPLETE.md)
- [Vision System Guide](./docs/vision/COMPLETE.md)
- [Organization Audit](./docs/UTILITIES_ORGANIZATION_AUDIT.md)

---

## 📞 **Questions?**

- **FileUpload issues?** Check `./docs/fileupload/`
- **Vision/scanning issues?** Check `./docs/vision/`
- **Architecture questions?** See `UTILITIES_ORGANIZATION_AUDIT.md`

---

**Last Updated:** October 2025
**Maintainers:** MotoMind Engineering Team
