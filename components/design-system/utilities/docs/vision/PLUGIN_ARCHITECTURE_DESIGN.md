# Vision Plugin Architecture - Design Document 🏗️

**Date:** October 7, 2025  
**Phase:** 1.1 - Design  
**Status:** ✅ Complete

---

## 🎯 **Design Goals**

### **1. Extensibility**
Make it **10-20x faster** to add features to Vision scanners

### **2. Consistency**
Follow the proven FileUpload plugin pattern

### **3. Type Safety**
Full TypeScript coverage with IntelliSense support

### **4. Developer Experience**
Simple API, clear hooks, great documentation

---

## 🔍 **Comparison: FileUpload vs Vision**

### **FileUpload Plugins:**
```tsx
<FileUpload
  plugins={[
    fileValidator({ maxSize: 5MB }),  // Validate files
    pasteSupport()                     // Add paste capability
  ]}
/>
```

**Focus:** File management (add, remove, validate, upload)

---

### **Vision Plugins:**
```tsx
<VINScanner
  plugins={[
    vinValidation(),           // Validate VIN format
    vinDecoding(),            // Decode to make/model/year
    confidenceScoring(0.9),  // Require 90% confidence
    autoFormFill(form)       // Auto-populate form
  ]}
/>
```

**Focus:** Capture process (scan, extract, validate, enhance)

---

## 🎨 **Vision Plugin Architecture**

### **Core Concept**

Plugins hook into the **capture lifecycle** to:
1. **Enhance** - Add features (validation, decoding)
2. **Transform** - Modify captured data
3. **Validate** - Check data quality
4. **React** - Respond to events
5. **Render** - Add UI elements

---

## 📋 **Plugin Lifecycle**

### **Capture Flow:**

```
1. User clicks capture
   ↓
2. BEFORE-CAPTURE hooks
   - Validate camera ready
   - Check prerequisites
   - Transform constraints
   ↓
3. Capture image/video
   ↓
4. DURING-PROCESSING hooks
   - Show custom loading UI
   - Track progress
   ↓
5. Vision API processes
   ↓
6. AFTER-CAPTURE hooks
   - Validate result
   - Transform data
   - Enrich with extra info
   ↓
7. SUCCESS / ERROR
   ↓
8. RENDER-UI hooks
   - Show confidence badges
   - Display decoded info
   - Add action buttons
```

---

## 🪝 **Vision Plugin Hooks**

### **Category 1: Capture Lifecycle**

#### **`before-capture`**
**When:** Before camera captures image  
**Purpose:** Validate preconditions, transform camera settings  
**Return:** `true` to proceed, `false` to block, modified constraints

```tsx
'before-capture': async (context) => {
  // Check if conditions are good for capture
  if (context.lighting < 50) {
    throw new Error('Lighting too low. Move to brighter area.')
  }
  
  // Can modify camera constraints
  return {
    ...context,
    constraints: { ...context.constraints, resolution: 'high' }
  }
}
```

---

#### **`after-capture`**
**When:** After Vision API returns result  
**Purpose:** Validate, transform, or enrich captured data  
**Return:** Modified result or throw error to retry

```tsx
'after-capture': async (result, context) => {
  // Validate VIN format
  if (!isValidVINFormat(result.data.vin)) {
    throw new Error('Invalid VIN format. Please retry.')
  }
  
  // Enrich with decoded data
  const decoded = await decodeVIN(result.data.vin)
  result.data.make = decoded.make
  result.data.model = decoded.model
  result.data.year = decoded.year
  
  return result
}
```

---

#### **`on-error`**
**When:** Capture or processing fails  
**Purpose:** Handle errors, decide retry strategy  
**Return:** `{ retry: boolean, message?: string }`

```tsx
'on-error': async (error, context) => {
  if (error.message.includes('blur')) {
    return {
      retry: true,
      message: 'Image too blurry. Hold camera steady and try again.'
    }
  }
  
  if (context.retryCount >= 3) {
    return {
      retry: false,
      message: 'Unable to scan. Please enter manually.'
    }
  }
  
  return { retry: true }
}
```

---

#### **`on-retry`**
**When:** User retries capture  
**Purpose:** Track attempts, modify behavior  
**Return:** void

```tsx
'on-retry': async (retryCount, context) => {
  analytics.track('vin_scan_retry', { 
    attempt: retryCount,
    reason: context.lastError 
  })
  
  // Adjust camera quality on retry
  if (retryCount > 2) {
    context.constraints.resolution = 'ultra'
  }
}
```

---

### **Category 2: Data Processing**

#### **`transform-result`**
**When:** After capture, before validation  
**Purpose:** Transform raw data format  
**Return:** Transformed result

```tsx
'transform-result': async (result) => {
  // Normalize VIN (uppercase, trim, remove spaces)
  if (result.data?.vin) {
    result.data.vin = result.data.vin
      .toUpperCase()
      .trim()
      .replace(/\s+/g, '')
  }
  
  return result
}
```

---

#### **`validate-result`**
**When:** After transformation  
**Purpose:** Validate captured data  
**Return:** `true` if valid, `false` or error if invalid

```tsx
'validate-result': async (result) => {
  const { vin } = result.data
  
  // Format validation
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    throw new Error('VIN must be 17 characters (no I, O, Q)')
  }
  
  // Check digit validation
  if (!validateVINCheckDigit(vin)) {
    throw new Error('Invalid VIN check digit')
  }
  
  return true
}
```

---

#### **`enrich-result`**
**When:** After validation  
**Purpose:** Add extra information  
**Return:** Enriched result

```tsx
'enrich-result': async (result) => {
  const { vin } = result.data
  
  // Decode VIN
  const decoded = await decodeVIN(vin)
  
  // Add to result
  result.data.vehicleInfo = {
    make: decoded.make,
    model: decoded.model,
    year: decoded.year,
    manufacturer: decoded.manufacturer
  }
  
  return result
}
```

---

### **Category 3: UI Rendering**

#### **`render-overlay`**
**When:** During camera view  
**Purpose:** Add custom overlay elements  
**Return:** React node

```tsx
'render-overlay': (context) => {
  return (
    <div className="absolute top-4 right-4">
      <Badge>Quality: {context.imageQuality}%</Badge>
    </div>
  )
}
```

---

#### **`render-toolbar`**
**When:** After capture  
**Purpose:** Add custom action buttons  
**Return:** React node

```tsx
'render-toolbar': (result) => {
  return (
    <Button 
      onClick={() => copyToClipboard(result.data.vin)}
    >
      Copy VIN
    </Button>
  )
}
```

---

#### **`render-result`**
**When:** Showing capture result  
**Purpose:** Display custom result UI  
**Return:** React node

```tsx
'render-result': (result) => {
  const { vin, vehicleInfo } = result.data
  
  return (
    <Card>
      <Heading level="subtitle">Decoded VIN</Heading>
      <Stack spacing="sm">
        <Text><strong>VIN:</strong> {vin}</Text>
        <Text><strong>Make:</strong> {vehicleInfo.make}</Text>
        <Text><strong>Model:</strong> {vehicleInfo.model}</Text>
        <Text><strong>Year:</strong> {vehicleInfo.year}</Text>
      </Stack>
    </Card>
  )
}
```

---

#### **`render-confidence`**
**When:** Showing result  
**Purpose:** Display confidence indicator  
**Return:** React node

```tsx
'render-confidence': (result) => {
  const { confidence } = result
  const variant = confidence > 0.9 ? 'success' : 
                 confidence > 0.7 ? 'warning' : 'danger'
  
  return (
    <Badge variant={variant}>
      {Math.round(confidence * 100)}% confident
    </Badge>
  )
}
```

---

### **Category 4: Events**

#### **`on-success`**
**When:** Capture succeeds  
**Purpose:** Analytics, side effects  
**Return:** void

```tsx
'on-success': async (result, context) => {
  analytics.track('vin_scan_success', {
    confidence: result.confidence,
    retries: context.retryCount,
    duration: context.duration
  })
  
  // Auto-save to recent scans
  await saveRecentScan(result.data.vin)
}
```

---

#### **`on-cancel`**
**When:** User cancels  
**Purpose:** Cleanup, analytics  
**Return:** void

```tsx
'on-cancel': async (context) => {
  analytics.track('vin_scan_cancelled', {
    stage: context.state,
    retries: context.retryCount
  })
}
```

---

## 📦 **Plugin Type Definitions**

### **VisionPlugin Interface:**

```typescript
export interface VisionPlugin<TOptions = any> {
  /** Unique plugin ID */
  id: string
  
  /** Plugin version */
  version: string
  
  /** Plugin type */
  type: 'validator' | 'enhancer' | 'decoder' | 'ui' | 'analytics'
  
  /** Display name */
  name?: string
  
  /** Plugin options */
  options?: TOptions
  
  /** Initialize plugin */
  init?(context: VisionPluginContext): void | Promise<void>
  
  /** Cleanup plugin */
  destroy?(): void | Promise<void>
  
  /** Lifecycle hooks */
  hooks?: VisionPluginHooks
}
```

---

### **VisionPluginContext Interface:**

```typescript
export interface VisionPluginContext {
  /** Scanner type */
  captureType: CaptureType
  
  /** Current capture state */
  state: CaptureState
  
  /** Camera constraints */
  constraints: CameraConstraints
  
  /** Retry count */
  retryCount: number
  
  /** Last error */
  lastError?: Error
  
  /** Camera stream */
  stream: MediaStream | null
  
  /** Analytics tracking */
  trackEvent: (event: AnalyticsEvent) => void
  
  /** Retry capture */
  retry: () => void
  
  /** Cancel capture */
  cancel: () => void
  
  /** Get plugin options */
  getOptions: <T = any>() => T
  
  /** Scanner props (read-only) */
  props: Readonly<UnifiedCameraCaptureProps>
}
```

---

### **VisionPluginHooks Interface:**

```typescript
export interface VisionPluginHooks<TData = any> {
  // Capture lifecycle
  'before-capture'?: (context: VisionPluginContext) => 
    boolean | Promise<boolean> | void
  
  'after-capture'?: (result: CaptureResult<TData>, context: VisionPluginContext) => 
    CaptureResult<TData> | Promise<CaptureResult<TData>>
  
  'on-error'?: (error: Error, context: VisionPluginContext) => 
    { retry: boolean; message?: string } | Promise<{ retry: boolean; message?: string }>
  
  'on-retry'?: (retryCount: number, context: VisionPluginContext) => 
    void | Promise<void>
  
  // Data processing
  'transform-result'?: (result: CaptureResult<TData>) => 
    CaptureResult<TData> | Promise<CaptureResult<TData>>
  
  'validate-result'?: (result: CaptureResult<TData>) => 
    boolean | Promise<boolean>
  
  'enrich-result'?: (result: CaptureResult<TData>) => 
    CaptureResult<TData> | Promise<CaptureResult<TData>>
  
  // UI rendering
  'render-overlay'?: (context: VisionPluginContext) => ReactNode
  
  'render-toolbar'?: (result: CaptureResult<TData>) => ReactNode
  
  'render-result'?: (result: CaptureResult<TData>) => ReactNode
  
  'render-confidence'?: (result: CaptureResult<TData>) => ReactNode
  
  // Events
  'on-success'?: (result: CaptureResult<TData>, context: VisionPluginContext) => 
    void | Promise<void>
  
  'on-cancel'?: (context: VisionPluginContext) => 
    void | Promise<void>
}
```

---

## 🎯 **Example Plugins**

### **Plugin 1: VIN Validation**

```typescript
export const vinValidation = (): VisionPlugin => ({
  id: '@motomind/vin-validation',
  version: '1.0.0',
  type: 'validator',
  name: 'VIN Validator',
  
  hooks: {
    'after-capture': async (result) => {
      const vin = result.data?.vin
      
      if (!vin) {
        throw new Error('No VIN detected')
      }
      
      // Format validation
      if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
        throw new Error('Invalid VIN format (must be 17 characters)')
      }
      
      // Check digit validation
      if (!validateVINCheckDigit(vin)) {
        throw new Error('Invalid VIN check digit')
      }
      
      return result
    }
  }
})
```

---

### **Plugin 2: VIN Decoding**

```typescript
export const vinDecoding = (): VisionPlugin => ({
  id: '@motomind/vin-decoding',
  version: '1.0.0',
  type: 'enhancer',
  name: 'VIN Decoder',
  
  hooks: {
    'enrich-result': async (result) => {
      const vin = result.data?.vin
      
      if (!vin) return result
      
      // Decode VIN
      const decoded = await decodeVIN(vin)
      
      // Add to result
      result.data.make = decoded.make
      result.data.model = decoded.model
      result.data.year = decoded.year
      result.data.manufacturer = decoded.manufacturer
      
      return result
    },
    
    'render-result': (result) => {
      if (!result.data?.make) return null
      
      return (
        <Card>
          <Heading level="subtitle">Vehicle Info</Heading>
          <Stack spacing="sm">
            <Text><strong>Make:</strong> {result.data.make}</Text>
            <Text><strong>Model:</strong> {result.data.model}</Text>
            <Text><strong>Year:</strong> {result.data.year}</Text>
          </Stack>
        </Card>
      )
    }
  }
})
```

---

### **Plugin 3: Confidence Scoring**

```typescript
export const confidenceScoring = (options = {}) => {
  const { minConfidence = 0.8 } = options
  
  return {
    id: '@motomind/confidence-scoring',
    version: '1.0.0',
    type: 'validator',
    name: 'Confidence Scorer',
    options,
    
    hooks: {
      'validate-result': async (result) => {
        if (!result.confidence || result.confidence < minConfidence) {
          throw new Error(
            `Low confidence (${Math.round(result.confidence * 100)}%). ` +
            `Please retry with better lighting.`
          )
        }
        return true
      },
      
      'render-confidence': (result) => {
        const confidence = result.confidence || 0
        const percentage = Math.round(confidence * 100)
        const variant = confidence >= 0.9 ? 'success' :
                       confidence >= 0.7 ? 'warning' : 'danger'
        
        return (
          <Badge variant={variant}>
            {percentage}% confident
          </Badge>
        )
      }
    }
  }
}
```

---

### **Plugin 4: Auto Form Fill**

```typescript
export const autoFormFill = (formRef) => ({
  id: '@motomind/auto-form-fill',
  version: '1.0.0',
  type: 'enhancer',
  name: 'Auto Form Fill',
  
  hooks: {
    'on-success': async (result) => {
      const { vin, make, model, year } = result.data
      
      // Auto-populate form fields
      if (vin) formRef.current?.setFieldValue('vin', vin)
      if (make) formRef.current?.setFieldValue('make', make)
      if (model) formRef.current?.setFieldValue('model', model)
      if (year) formRef.current?.setFieldValue('year', year)
    }
  }
})
```

---

## 💻 **Usage Examples**

### **Basic Usage:**

```tsx
<VINScanner
  onCapture={handleVIN}
  plugins={[
    vinValidation()
  ]}
/>
```

---

### **Advanced Usage:**

```tsx
const form = useForm()

<VINScanner
  onCapture={handleVIN}
  plugins={[
    vinValidation(),              // Validate format
    vinDecoding(),                // Decode to vehicle info
    confidenceScoring({ minConfidence: 0.9 }),
    autoFormFill(form)           // Auto-fill form
  ]}
  onPluginEvent={(event, data) => {
    console.log('Plugin event:', event, data)
  }}
/>
```

---

### **Custom Plugin:**

```tsx
const customLogger = (): VisionPlugin => ({
  id: 'custom-logger',
  version: '1.0.0',
  type: 'analytics',
  
  hooks: {
    'before-capture': async (context) => {
      console.log('📸 Starting capture...')
    },
    
    'after-capture': async (result) => {
      console.log('✅ Captured:', result.data)
      return result
    },
    
    'on-error': async (error, context) => {
      console.error('❌ Error:', error.message)
      return { retry: true }
    }
  }
})

<VINScanner
  plugins={[customLogger()]}
/>
```

---

## 🎨 **Plugin Execution Order**

### **Capture Flow:**

```
1. before-capture (all plugins, in order)
2. [Camera capture]
3. [Vision API processing]
4. transform-result (all plugins, in order)
5. validate-result (all plugins, all must pass)
6. enrich-result (all plugins, in order)
7. after-capture (all plugins, in order)
8. on-success (all plugins, parallel)
9. [Render hooks executed as needed]
```

### **Error Flow:**

```
1. [Error occurs]
2. on-error (first plugin that handles it)
3. Either:
   - Retry → on-retry → back to before-capture
   - Cancel → on-cancel → cleanup
```

---

## 🔒 **Error Handling**

### **Plugin Errors:**

- **Transform hooks:** If error thrown, execution stops, on-error triggered
- **Validate hooks:** If returns false or throws, validation fails
- **Render hooks:** Errors caught and logged, UI continues
- **Event hooks:** Errors logged, don't block flow

---

## 📊 **Comparison with FileUpload**

| Feature | FileUpload | Vision |
|---------|------------|--------|
| **Primary Entity** | File | CaptureResult |
| **Main Hooks** | before-file-added, after-file-added | before-capture, after-capture |
| **Focus** | File management | Capture process |
| **Validation** | File properties | Captured data |
| **Rendering** | File preview | Scanner UI |
| **Events** | File lifecycle | Capture lifecycle |

---

## ✅ **Design Decisions**

### **1. Async Hooks**
All hooks support `async` for flexibility (API calls, validation, etc.)

### **2. Hook Execution Order**
Sequential for transforms, all-must-pass for validation

### **3. Error Handling**
Throw errors to trigger retry flow, return false to fail silently

### **4. Context Passing**
Rich context object provides access to scanner state

### **5. Type Safety**
Generic `TData` type for scanner-specific result shapes

---

## 🎯 **Next Steps**

**✅ Step 1.1 Complete:** Design documented

**→ Step 1.2 Next:** Create plugin types (`vision/plugins/types.ts`)

**Timeline:** ~3 hours

**Deliverable:** TypeScript type definitions with full coverage

---

## 📝 **Summary**

We've designed a comprehensive plugin architecture for Vision that:

✅ **Follows FileUpload pattern** - Proven architecture  
✅ **Vision-specific hooks** - Capture lifecycle  
✅ **Type-safe** - Full TypeScript coverage  
✅ **Extensible** - Easy to add features  
✅ **Clear API** - Simple to use  
✅ **Well-documented** - Examples and guides  

**This design will make Vision development 10-20x faster!** 🚀

---

**Ready for Step 1.2: Implement these types in code!**
