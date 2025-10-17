# FileUpload Component - Refactoring Proposal

## 🎯 Current State

**Problem:** FileUpload.tsx is 1,347 lines - a monolithic component doing too much

**Responsibilities:**
1. Drag & drop file upload (react-dropzone)
2. Camera capture & streaming
3. Auto-capture detection (heuristics + OCR)
4. Camera overlays (4 types)
5. Image compression (Web Worker)
6. Batch capture mode
7. File preview grid
8. Validation & error handling
9. Progress indicators
10. Accessibility features

---

## ✅ Recommended Refactor: Feature-Based Structure

### **Proposed Folder Structure**

```
components/design-system/utilities/FileUpload/
├── index.tsx                           # Main export (barrel file)
├── FileUpload.tsx                      # Core orchestrator (~200 lines)
├── types.ts                            # Shared types & interfaces
├── constants.ts                        # Constants (quality map, labels, etc)
│
├── hooks/
│   ├── useFileUpload.ts               # Main state management
│   ├── useCameraStream.ts             # Camera access & streaming
│   ├── useAutoCapture.ts              # Detection loop logic
│   ├── useCompressionWorker.ts        # Already exists - move here
│   └── useKeyboardShortcuts.ts        # Camera keyboard handlers
│
├── components/
│   ├── DropZone.tsx                   # Drag & drop area (~150 lines)
│   ├── FilePreviewGrid.tsx            # Preview thumbnails (~150 lines)
│   ├── CameraModal.tsx                # Camera fullscreen modal (~200 lines)
│   ├── CameraControls.tsx             # Capture/switch buttons (~100 lines)
│   ├── CameraOverlay.tsx              # Overlay renderer (~150 lines)
│   ├── ProgressIndicator.tsx          # Compression/processing UI (~50 lines)
│   ├── DetectionFeedback.tsx          # Green border + badge (~50 lines)
│   └── ErrorAlert.tsx                 # Error messages + retry (~50 lines)
│
├── overlays/
│   ├── VINOverlay.tsx                 # VIN capture guide
│   ├── OdometerOverlay.tsx            # Odometer capture guide
│   ├── LicensePlateOverlay.tsx        # License plate guide
│   └── DocumentOverlay.tsx            # Document guide
│
├── detection/
│   ├── auto-capture-detection.ts      # Already exists - move here
│   ├── auto-capture-ocr.ts            # Already exists - move here
│   └── detection-utils.ts             # Shared detection helpers
│
├── workers/
│   └── compression.worker.ts          # Already exists - move here
│
└── utils/
    ├── file-utils.ts                  # File size, type detection
    ├── camera-utils.ts                # Camera error messages, labels
    └── compression-utils.ts           # Quality maps, etc
```

---

## 🏗️ Architecture Breakdown

### **1. FileUpload.tsx (Main Orchestrator)**
**Lines:** ~200  
**Purpose:** Compose all pieces, manage top-level state

```tsx
export function FileUpload(props: FileUploadProps) {
  // Use custom hooks
  const fileState = useFileUpload(props)
  const cameraState = useCameraStream()
  const autoCapture = useAutoCapture(cameraState, props)
  
  return (
    <Stack spacing="md" className={className}>
      <Label>{label}</Label>
      
      {/* Drag & drop area */}
      <DropZone
        value={fileState.files}
        onChange={fileState.handleChange}
        accept={accept}
        maxSize={maxSize}
        disabled={disabled}
      />
      
      {/* File previews */}
      {fileState.files.length > 0 && (
        <FilePreviewGrid
          files={fileState.files}
          onRemove={fileState.handleRemove}
        />
      )}
      
      {/* Camera button */}
      {showCamera && (
        <Button onClick={cameraState.open}>
          Open Camera
        </Button>
      )}
      
      {/* Camera modal */}
      {cameraState.isOpen && (
        <CameraModal
          stream={cameraState.stream}
          onCapture={fileState.handleCapture}
          onClose={cameraState.close}
          overlay={cameraOverlay}
          autoCapture={autoCapture}
        />
      )}
    </Stack>
  )
}
```

---

### **2. useFileUpload.ts (State Management)**
**Lines:** ~100  
**Purpose:** Manage files, validation, compression

```tsx
export function useFileUpload(props: FileUploadProps) {
  const [files, setFiles] = useState<File[]>(props.value)
  const { compressImage } = useCompressionWorker()
  
  const handleChange = async (newFiles: File[]) => {
    // Validate
    // Compress if needed
    // Update state
    props.onChange?.(processedFiles)
  }
  
  const handleRemove = (index: number) => { /* ... */ }
  const handleCapture = async (blob: Blob) => { /* ... */ }
  
  return {
    files,
    handleChange,
    handleRemove,
    handleCapture
  }
}
```

---

### **3. useCameraStream.ts (Camera Management)**
**Lines:** ~150  
**Purpose:** Handle camera access, streaming, errors

```tsx
export function useCameraStream() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  
  const open = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      })
      setStream(mediaStream)
      setIsOpen(true)
    } catch (err) {
      setError(getCameraErrorMessage(err))
    }
  }
  
  const close = () => {
    stream?.getTracks().forEach(track => track.stop())
    setStream(null)
    setIsOpen(false)
  }
  
  const switchCamera = async () => { /* ... */ }
  
  return {
    isOpen,
    isLoading,
    error,
    stream,
    facingMode,
    open,
    close,
    switchCamera
  }
}
```

---

### **4. useAutoCapture.ts (Detection Logic)**
**Lines:** ~200  
**Purpose:** Run detection loop, trigger auto-capture

```tsx
export function useAutoCapture(
  cameraState: CameraState,
  config: AutoCaptureConfig
) {
  const [detectionActive, setDetectionActive] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const detectionCanvasRef = useRef<HTMLCanvasElement | null>(null)
  
  useEffect(() => {
    if (!config.enabled || !cameraState.isOpen) return
    
    const runDetection = async () => {
      const result = runAutoDetection(
        videoRef.current,
        detectionCanvasRef.current,
        config.overlayType
      )
      
      if (config.enableOCR && result.confidence > 0.6) {
        result = await enhanceWithOCR(result)
      }
      
      setDetectionActive(result.detected)
      
      if (result.confidence >= config.threshold) {
        startCountdown()
      }
    }
    
    const interval = setInterval(runDetection, 500)
    return () => clearInterval(interval)
  }, [cameraState.isOpen, config])
  
  return {
    detectionActive,
    countdown,
    detectionCanvasRef
  }
}
```

---

### **5. CameraModal.tsx (Camera UI)**
**Lines:** ~200  
**Purpose:** Fullscreen camera interface

```tsx
export function CameraModal({
  stream,
  onCapture,
  onClose,
  overlay,
  autoCapture
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showFlash, setShowFlash] = useState(false)
  
  useKeyboardShortcuts({ onCapture, onClose })
  
  const handleCapture = () => {
    // Flash effect
    setShowFlash(true)
    
    // Haptic feedback
    navigator.vibrate?.([50, 30, 50])
    
    // Capture from canvas
    const blob = captureFromVideo(videoRef.current, canvasRef.current)
    onCapture(blob)
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video ref={videoRef} autoPlay playsInline />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Skeleton loader */}
      {!stream && <SkeletonLoader />}
      
      {/* Overlay guide */}
      <CameraOverlay type={overlay} />
      
      {/* Detection feedback */}
      {autoCapture.detectionActive && (
        <DetectionFeedback countdown={autoCapture.countdown} />
      )}
      
      {/* Flash effect */}
      {showFlash && <FlashEffect />}
      
      {/* Controls */}
      <CameraControls
        onCapture={handleCapture}
        onClose={onClose}
      />
    </div>
  )
}
```

---

### **6. CameraOverlay.tsx (Overlay Dispatcher)**
**Lines:** ~50  
**Purpose:** Render correct overlay component

```tsx
export function CameraOverlay({ type }: { type: CameraOverlayType }) {
  switch (type) {
    case 'vin':
      return <VINOverlay />
    case 'odometer':
      return <OdometerOverlay />
    case 'license-plate':
      return <LicensePlateOverlay />
    case 'document':
      return <DocumentOverlay />
    default:
      return null
  }
}
```

---

### **7. Individual Overlay Components**
**Lines:** ~50 each  
**Purpose:** Render specific overlay UI

```tsx
// overlays/VINOverlay.tsx
export function VINOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="flex items-center justify-center h-full">
        <div className="relative w-[80%] max-w-md">
          {/* Darkened area */}
          <div className="absolute inset-0" 
               style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)' }} 
          />
          
          {/* Guide box */}
          <div className="border-4 border-blue-500 rounded-lg relative">
            <div className="p-12">
              <div className="border-2 border-dashed border-blue-400/80 rounded p-4 text-center bg-black/20">
                <p className="text-white font-semibold text-sm mb-1">Position VIN Here</p>
                <p className="text-white/90 text-xs">17 characters • Usually on dashboard</p>
              </div>
            </div>
          </div>
          
          {/* Corner guides */}
          <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
          {/* ... other corners ... */}
        </div>
      </div>
    </div>
  )
}
```

---

## 📊 Benefits of This Structure

### **1. Maintainability** ✅
- Each file has single responsibility
- Easy to find specific functionality
- Changes are isolated

### **2. Testability** ✅
- Hooks can be tested independently
- Components can be tested in isolation
- Mocking is straightforward

### **3. Reusability** ✅
- `useCameraStream` can be used elsewhere
- `CameraOverlay` components are standalone
- Detection hooks are portable

### **4. Team Collaboration** ✅
- Multiple devs can work simultaneously
- Clear ownership boundaries
- Reduced merge conflicts

### **5. Performance** ✅
- Better tree-shaking
- Easier to code-split
- Clearer optimization targets

### **6. Documentation** ✅
- Each file is self-documenting
- Easier to understand flow
- Better IDE navigation

---

## 🔄 Migration Strategy

### **Phase 1: Extract Hooks (Low Risk)**
1. Create `useFileUpload.ts` - extract file state
2. Create `useCameraStream.ts` - extract camera logic
3. Create `useAutoCapture.ts` - extract detection
4. Update FileUpload.tsx to use hooks

**Risk:** Low - Internal refactor only  
**Time:** 2-3 hours  
**Benefit:** Immediate testability improvement

---

### **Phase 2: Extract Components (Medium Risk)**
1. Create `CameraModal.tsx` - extract camera UI
2. Create `DropZone.tsx` - extract upload area
3. Create `FilePreviewGrid.tsx` - extract previews
4. Update FileUpload.tsx to compose components

**Risk:** Medium - UI structure changes  
**Time:** 3-4 hours  
**Benefit:** Better component reuse

---

### **Phase 3: Extract Overlays (Low Risk)**
1. Create overlay components (VIN, Odometer, etc.)
2. Create `CameraOverlay.tsx` dispatcher
3. Remove overlay logic from main component

**Risk:** Low - Visual behavior unchanged  
**Time:** 2 hours  
**Benefit:** Cleaner overlay management

---

### **Phase 4: Organize Utilities (Low Risk)**
1. Move detection files to `detection/` folder
2. Move worker to `workers/` folder
3. Create `utils/` for helpers
4. Update imports

**Risk:** Very Low - Just reorganization  
**Time:** 1 hour  
**Benefit:** Better project navigation

---

## 📁 Final File Sizes (Estimated)

| File | Current | After | Reduction |
|------|---------|-------|-----------|
| **FileUpload.tsx** | 1,347 lines | **~200 lines** | **-85%** ✅ |
| useFileUpload | - | ~100 lines | New |
| useCameraStream | - | ~150 lines | New |
| useAutoCapture | - | ~200 lines | New |
| CameraModal | - | ~200 lines | New |
| DropZone | - | ~150 lines | New |
| Overlays (4) | - | ~200 lines | New |
| **Total** | **1,347** | **~1,200** | Modular! |

---

## 🎯 Recommended Approach

### **Option A: Incremental Refactor (Recommended)**
**Pros:**
- Low risk
- Can pause at any phase
- Component keeps working
- Easy to review

**Cons:**
- Takes longer
- Temporary mixed structure

**Timeline:** 1 week (1-2 hours/day)

---

### **Option B: Complete Rewrite**
**Pros:**
- Clean slate
- Perfect structure from day 1
- Faster if dedicated time

**Cons:**
- Higher risk
- Needs extensive testing
- Potential regressions

**Timeline:** 2-3 days (dedicated)

---

### **Option C: Keep As-Is (Not Recommended)**
**Pros:**
- No work needed
- Zero risk

**Cons:**
- Technical debt grows
- Harder to maintain over time
- Difficult for new team members

---

## 🏁 My Recommendation

**Go with Option A: Incremental Refactor**

**Start with Phase 1 (Extract Hooks):**
1. ✅ Immediate testability improvement
2. ✅ Low risk - internal changes only
3. ✅ Can stop here if time-constrained
4. ✅ Sets foundation for future phases

**Key Benefits:**
- Component stays fully functional
- Easier code reviews
- Can ship at any phase
- Learn as you go

---

## 🚀 Want Me To Implement This?

I can help with any of these approaches:

1. **Phase 1 Only** - Extract hooks (2-3 hours)
2. **Phases 1-2** - Hooks + Components (5-7 hours)
3. **Full Refactor** - Complete restructure (2-3 days)

**Or I can:**
- Create a detailed migration guide
- Scaffold the folder structure
- Refactor one piece as an example

**What would you like to do?**
