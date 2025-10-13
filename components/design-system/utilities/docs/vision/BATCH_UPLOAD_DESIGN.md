# 📄 Batch Document Upload - Design Specification

## 🎯 Overview

Enable users to capture/upload multiple images for multi-page documents using:
1. **Sequential camera captures** - Take photos one by one
2. **Batch file upload** - Select multiple files from gallery (native picker)
3. **Mixed mode** - Combine camera captures + file uploads
4. **Preview & edit** - Review all items before processing

---

## 🔄 User Flows

### **Flow 1: Sequential Camera Capture**
```
1. Click "Scan Document" 
   ↓
2. Choose "Take Photos"
   ↓
3. Camera opens → Capture page 1
   ↓
4. [Add Another Page] or [Done]
   ↓
5. If "Add Another": Camera reopens for page 2
   ↓
6. Repeat until all pages captured
   ↓
7. Review all pages (grid preview)
   ↓
8. Remove/reorder if needed
   ↓
9. [Process All Pages]
```

### **Flow 2: Batch File Upload**
```
1. Click "Scan Document"
   ↓
2. Choose "Upload Photos"
   ↓
3. Native file picker opens (multiple=true)
   ↓
4. Select multiple images from gallery
   ↓
5. All images loaded instantly
   ↓
6. Review grid preview
   ↓
7. Remove/reorder if needed
   ↓
8. [Process All Pages]
```

### **Flow 3: Mixed Mode**
```
1. Upload 3 pages from gallery
   ↓
2. Click "Add More Pages"
   ↓
3. Choose camera → Capture page 4
   ↓
4. Click "Add More" → Upload page 5
   ↓
5. Review all 5 pages together
   ↓
6. [Process All Pages]
```

---

## 🎨 UI Components

### **1. Batch Document Scanner**
```tsx
<BatchDocumentScanner
  captureType="document"
  maxPages={20}
  onComplete={(pages: CapturedPage[]) => {
    // Process all pages
  }}
  allowCamera={true}
  allowUpload={true}
  showPreview={true}
/>
```

### **2. Page Gallery View**
```
┌─────────────────────────────────┐
│  Multi-Page Document Scan       │
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐        │
│  │ P1  │ │ P2  │ │ P3  │  ...   │
│  │ [X] │ │ [X] │ │ [X] │        │
│  └─────┘ └─────┘ └─────┘        │
│                                 │
│  [➕ Add Page]  [📷 Camera]     │
│                                 │
│  [Process 3 Pages]              │
└─────────────────────────────────┘
```

### **3. Sequential Capture View**
```
After each capture:

┌─────────────────────────────────┐
│  ✅ Page 1 Captured              │
│                                 │
│  ┌─────────────┐                │
│  │   Preview   │                │
│  │   of P1     │                │
│  └─────────────┘                │
│                                 │
│  [✓ Keep This]  [↻ Retake]      │
│                                 │
│  [➕ Add Another Page]           │
│  [✅ Done - Process 1 Page]      │
└─────────────────────────────────┘
```

---

## 📊 Data Structure

### **CapturedPage Interface**
```typescript
interface CapturedPage {
  id: string
  base64: string
  thumbnail?: string
  pageNumber: number
  source: 'camera' | 'upload'
  timestamp: number
  preprocessed?: {
    originalSize: number
    processedSize: number
    compression: number
  }
}

interface BatchScanResult {
  pages: CapturedPage[]
  totalPages: number
  totalSize: number
  processed: boolean
  data?: any // OCR/Vision results
}
```

---

## 🔧 Implementation Architecture

### **Layer 1: Core Hook**
```tsx
// hooks/useBatchCapture.ts
export function useBatchCapture(options: BatchCaptureOptions) {
  const [pages, setPages] = useState<CapturedPage[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  
  const addPage = (page: CapturedPage) => {
    setPages(prev => [...prev, { ...page, pageNumber: prev.length + 1 }])
  }
  
  const removePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id))
  }
  
  const reorderPages = (fromIndex: number, toIndex: number) => {
    const newPages = [...pages]
    const [moved] = newPages.splice(fromIndex, 1)
    newPages.splice(toIndex, 0, moved)
    setPages(newPages.map((p, i) => ({ ...p, pageNumber: i + 1 })))
  }
  
  const processAll = async () => {
    // Send all pages to vision API
  }
  
  return { pages, addPage, removePage, reorderPages, processAll, isCapturing }
}
```

### **Layer 2: Batch Scanner Component**
```tsx
// scanners/BatchDocumentScanner.tsx
export function BatchDocumentScanner({
  captureType = 'document',
  maxPages = 20,
  onComplete,
  allowCamera = true,
  allowUpload = true
}: BatchDocumentScannerProps) {
  const batch = useBatchCapture({ maxPages })
  const [mode, setMode] = useState<'selection' | 'camera' | 'gallery'>('selection')
  
  // Sequential camera captures
  const handleCameraCapture = async (result: CaptureResult) => {
    batch.addPage({
      id: generateId(),
      base64: result.base64,
      source: 'camera',
      timestamp: Date.now()
    })
    
    // Show: Add Another or Done
    setMode('review')
  }
  
  // Batch file upload
  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      const base64 = await fileToBase64(file)
      batch.addPage({
        id: generateId(),
        base64,
        source: 'upload',
        timestamp: Date.now()
      })
    }
    setMode('review')
  }
  
  return (
    <>
      {mode === 'selection' && (
        <ModeSelector
          onCamera={() => setMode('camera')}
          onUpload={() => setMode('gallery')}
        />
      )}
      
      {mode === 'camera' && (
        <UnifiedCameraCapture
          captureType={captureType}
          onCapture={handleCameraCapture}
          onCancel={() => setMode('selection')}
        />
      )}
      
      {mode === 'gallery' && (
        <FileUpload
          multiple={true}
          maxFiles={maxPages}
          accept="image/*"
          onChange={handleFileUpload}
        />
      )}
      
      {mode === 'review' && (
        <PageGallery
          pages={batch.pages}
          onRemove={batch.removePage}
          onReorder={batch.reorderPages}
          onAddMore={() => setMode('selection')}
          onProcess={() => batch.processAll().then(onComplete)}
        />
      )}
    </>
  )
}
```

### **Layer 3: Page Gallery Component**
```tsx
// components/PageGallery.tsx
export function PageGallery({
  pages,
  onRemove,
  onReorder,
  onAddMore,
  onProcess
}: PageGalleryProps) {
  return (
    <Stack spacing="lg">
      {/* Header */}
      <Flex justify="between" align="center">
        <Heading level="title">{pages.length} Pages</Heading>
        <Button onClick={onAddMore} variant="outline">
          ➕ Add More
        </Button>
      </Flex>
      
      {/* Gallery Grid */}
      <Grid columns={{ sm: 2, md: 3, lg: 4 }} gap="md">
        {pages.map((page, index) => (
          <Card key={page.id} className="relative">
            <img src={page.base64} alt={`Page ${page.pageNumber}`} />
            <Flex className="absolute top-2 right-2 gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemove(page.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </Flex>
            <Text className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded">
              Page {page.pageNumber}
            </Text>
          </Card>
        ))}
      </Grid>
      
      {/* Actions */}
      <Button
        size="lg"
        onClick={onProcess}
        disabled={pages.length === 0}
      >
        Process {pages.length} Page{pages.length !== 1 ? 's' : ''}
      </Button>
    </Stack>
  )
}
```

---

## 📱 Mobile-Specific Features

### **Native Photo Picker (iOS/Android)**
```tsx
<input
  type="file"
  accept="image/*"
  multiple
  capture="environment"  // Opens camera on mobile
/>
```

**Behavior:**
- **iOS:** Opens Photos app → Select multiple images
- **Android:** Shows "Camera" or "Gallery" options → Select multiple
- **Desktop:** Standard file picker

### **Sequential Camera on Mobile**
```tsx
// After each capture on mobile
<BottomSheet>
  <Stack spacing="md">
    <img src={latestCapture} />
    <Button onClick={addAnotherPage}>➕ Add Page {pageCount + 1}</Button>
    <Button onClick={finishCapture}>✅ Done ({pageCount} pages)</Button>
  </Stack>
</BottomSheet>
```

---

## 🎯 UX Best Practices

### **1. Clear Page Count**
- Always show: "3 of 20 pages" or "3 pages captured"
- Disable "Add More" when max reached

### **2. Quick Actions**
- **Retake:** For last captured page
- **Remove:** For any page
- **Reorder:** Drag to reorder (desktop) or numbered buttons (mobile)

### **3. Progress Indicators**
- Show preprocessing status per page
- Overall batch progress: "Processing 3 of 5 pages..."

### **4. Error Handling**
- Per-page errors: "Page 2 failed to process"
- Option to retry failed pages
- Continue with successful pages

### **5. Memory Management**
- Limit preview quality (thumbnails)
- Revoke object URLs when removing pages
- Warn if approaching browser memory limits

---

## 🔄 Processing Strategies

### **Strategy 1: Sequential Processing**
```typescript
async function processSequentially(pages: CapturedPage[]) {
  const results = []
  for (const page of pages) {
    const result = await processPage(page)
    results.push(result)
    onProgress?.(results.length / pages.length)
  }
  return results
}
```

### **Strategy 2: Parallel Processing**
```typescript
async function processParallel(pages: CapturedPage[]) {
  const results = await Promise.all(
    pages.map(page => processPage(page))
  )
  return results
}
```

### **Strategy 3: Batch API**
```typescript
async function processBatch(pages: CapturedPage[]) {
  const formData = new FormData()
  pages.forEach((page, i) => {
    formData.append(`page_${i}`, base64ToBlob(page.base64))
  })
  
  const response = await fetch('/api/vision/batch', {
    method: 'POST',
    body: formData
  })
  
  return await response.json()
}
```

---

## ✅ Implementation Checklist

### **Phase 1: Core Functionality**
- [ ] `useBatchCapture` hook
- [ ] Sequential camera capture flow
- [ ] Batch file upload integration
- [ ] Page gallery view
- [ ] Add/remove pages
- [ ] Basic processing

### **Phase 2: UX Enhancements**
- [ ] Page reordering (drag & drop)
- [ ] Retake individual pages
- [ ] Progress indicators
- [ ] Per-page error handling
- [ ] Memory optimization

### **Phase 3: Advanced Features**
- [ ] Auto-crop pages
- [ ] Perspective correction
- [ ] Brightness adjustment
- [ ] Batch preprocessing
- [ ] Resume interrupted batch

### **Phase 4: Mobile Optimization**
- [ ] Native picker integration
- [ ] Bottom sheet for review
- [ ] Touch gestures for reorder
- [ ] Reduced memory mode
- [ ] Offline queue

---

## 📊 Analytics Events

```typescript
// Track batch scanning behavior
{
  'batch_scan_started': { captureType, maxPages },
  'page_captured': { pageNumber, source: 'camera' | 'upload' },
  'page_removed': { pageNumber, reason },
  'pages_reordered': { fromIndex, toIndex },
  'batch_processed': {
    totalPages,
    successfulPages,
    failedPages,
    totalTime,
    averageTimePerPage
  }
}
```

---

## 🎨 Example Usage

### **Multi-Page Registration Document**
```tsx
<BatchDocumentScanner
  captureType="document"
  maxPages={10}
  title="Upload Registration Pages"
  onComplete={(result) => {
    // All pages processed
    saveRegistration(result.data)
  }}
/>
```

### **Insurance Claim Photos**
```tsx
<BatchDocumentScanner
  captureType="damage"
  maxPages={20}
  allowCamera={true}
  allowUpload={true}
  preprocessImages={true}
  onComplete={(result) => {
    submitClaim(result.pages)
  }}
/>
```

---

## 🚀 Next Steps

1. **Build `useBatchCapture` hook** (core state management)
2. **Create `BatchDocumentScanner` component** (orchestrator)
3. **Build `PageGallery` component** (preview grid)
4. **Integrate with `FileUpload`** (batch uploads)
5. **Test on mobile** (native picker, sequential camera)
6. **Add preprocessing** (batch image optimization)
7. **Implement batch API** (server-side processing)

---

*Design Status: Ready for Implementation*
*Priority: High (Critical for document workflows)*
