# 🎯 Vision Plugin Usage Guide

**Complete guide to using Vision plugins**

---

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Available Plugins](#available-plugins)
3. [Plugin Examples](#plugin-examples)
4. [Creating Custom Plugins](#creating-custom-plugins)
5. [Best Practices](#best-practices)
6. [Advanced Usage](#advanced-usage)

---

## 🚀 Quick Start

### Basic Usage

```tsx
import { VINScanner } from '@/components/design-system/utilities/vision'
import { vinValidation, confidenceScoring } from '@/components/design-system/utilities/vision/plugins/examples'

function MyComponent() {
  const handleCapture = (result) => {
    console.log('VIN captured:', result.data.vin)
    console.log('Vehicle info:', result.data.make, result.data.model, result.data.year)
  }

  return (
    <VINScanner
      onCapture={handleCapture}
      plugins={[
        vinValidation(),           // Validate VIN format
        confidenceScoring()        // Ensure high quality
      ]}
    />
  )
}
```

---

## 🔌 Available Plugins

### 1. **VIN Validation** (`@motomind/vin-validation`)

Validates VINs according to ISO 3779 standard.

**Features:**
- ✅ Length validation (17 characters)
- ✅ Character validation (no I, O, Q)
- ✅ Check digit validation
- ✅ Format normalization
- ✅ Clear error messages

**Options:**
```typescript
interface VINValidationOptions {
  validateCheckDigit?: boolean    // Default: true
  strictMode?: boolean            // Default: false
  allowLowercase?: boolean        // Default: true
  customMessages?: {
    invalidLength?: string
    invalidCharacters?: string
    invalidCheckDigit?: string
  }
  onValidation?: (result: VINValidationResult) => void
}
```

**Example:**
```tsx
vinValidation({
  validateCheckDigit: true,
  strictMode: false,
  onValidation: (result) => {
    if (!result.valid) {
      console.error('VIN errors:', result.errors)
    }
    if (result.warnings.length > 0) {
      console.warn('VIN warnings:', result.warnings)
    }
  }
})
```

---

### 2. **Confidence Scoring** (`@motomind/confidence-scoring`)

Enforces minimum confidence thresholds with automatic retry.

**Features:**
- ✅ Configurable confidence thresholds
- ✅ Automatic retry on low confidence
- ✅ Visual confidence badge
- ✅ Confidence trend tracking
- ✅ Per-capture-type thresholds

**Options:**
```typescript
interface ConfidenceScoringOptions {
  minConfidence?: number          // Default: 0.85 (85%)
  maxRetries?: number             // Default: 3
  showBadge?: boolean             // Default: true
  strictMode?: boolean            // Default: false
  thresholds?: {
    vin?: number
    odometer?: number
    licensePlate?: number
    document?: number
  }
  retryStrategy?: 'immediate' | 'with-delay' | 'manual'
  retryDelay?: number             // Default: 1000ms
  onConfidenceCheck?: (result: ConfidenceCheckResult) => void
  onLowConfidence?: (confidence: number, threshold: number) => void
}
```

**Example:**
```tsx
confidenceScoring({
  minConfidence: 0.90,           // 90% minimum
  maxRetries: 3,
  showBadge: true,
  thresholds: {
    vin: 0.95,                   // VINs need 95%
    odometer: 0.85,              // Odometers need 85%
  },
  onLowConfidence: (confidence, threshold) => {
    toast.warning(
      `Low confidence: ${(confidence * 100).toFixed(0)}% (need ${(threshold * 100).toFixed(0)}%)`
    )
  }
})
```

---

### 3. **VIN Decoding** (`@motomind/vin-decoding`)

Decodes VINs to extract vehicle information.

**Features:**
- ✅ NHTSA API integration (free!)
- ✅ Extract make, model, year
- ✅ Manufacturing location
- ✅ Engine, transmission specs
- ✅ Result caching
- ✅ Custom API support

**Options:**
```typescript
interface VINDecodingOptions {
  apiProvider?: 'nhtsa' | 'custom' | 'mock'
  customApiUrl?: string
  apiKey?: string
  cacheResults?: boolean          // Default: true
  cacheDuration?: number          // Default: 1 hour
  enrichResult?: boolean          // Default: true
  extractFields?: (keyof DecodedVehicleInfo)[]
  onDecode?: (info: DecodedVehicleInfo) => void
  onDecodeError?: (error: string) => void
  timeout?: number                // Default: 10000ms
}
```

**Example:**
```tsx
vinDecoding({
  apiProvider: 'nhtsa',          // Free NHTSA API
  cacheResults: true,
  onDecode: (info) => {
    console.log('Vehicle decoded:', {
      make: info.make,
      model: info.model,
      year: info.year,
      trim: info.trim
    })
  }
})
```

---

## 💡 Plugin Examples

### Example 1: Basic VIN Scanner

```tsx
import { VINScanner } from '@/components/vision'
import { vinValidation } from '@/components/vision/plugins/examples'

function BasicVINScanner() {
  return (
    <VINScanner
      onCapture={(result) => {
        console.log('VIN:', result.data.vin)
      }}
      plugins={[
        vinValidation()
      ]}
    />
  )
}
```

---

### Example 2: High-Quality VIN Scanner

```tsx
import { VINScanner } from '@/components/vision'
import { vinValidation, confidenceScoring } from '@/components/vision/plugins/examples'

function HighQualityVINScanner() {
  return (
    <VINScanner
      onCapture={(result) => {
        console.log('High-quality VIN:', result.data.vin)
      }}
      plugins={[
        vinValidation({
          validateCheckDigit: true,
          strictMode: true
        }),
        confidenceScoring({
          minConfidence: 0.95,
          maxRetries: 3,
          showBadge: true
        })
      ]}
    />
  )
}
```

---

### Example 3: Complete VIN Scanner with Decoding

```tsx
import { VINScanner } from '@/components/vision'
import { vinValidation, confidenceScoring, vinDecoding } from '@/components/vision/plugins/examples'

function CompleteVINScanner() {
  const [vehicle, setVehicle] = useState(null)

  return (
    <VINScanner
      onCapture={(result) => {
        // Result is fully validated, high confidence, and decoded!
        setVehicle({
          vin: result.data.vin,
          make: result.data.make,
          model: result.data.model,
          year: result.data.year
        })
      }}
      plugins={[
        // Step 1: Validate VIN format
        vinValidation({
          validateCheckDigit: true
        }),
        
        // Step 2: Ensure high confidence
        confidenceScoring({
          minConfidence: 0.90,
          showBadge: true
        }),
        
        // Step 3: Decode vehicle info
        vinDecoding({
          apiProvider: 'nhtsa',
          cacheResults: true
        })
      ]}
    />
  )
}
```

---

### Example 4: Form Auto-Fill with VIN

```tsx
function VehicleForm() {
  const [form, setForm] = useState({
    vin: '',
    make: '',
    model: '',
    year: ''
  })

  return (
    <div>
      <VINScanner
        onCapture={(result) => {
          // Auto-fill form with decoded data
          setForm({
            vin: result.data.vin,
            make: result.data.make,
            model: result.data.model,
            year: result.data.year
          })
        }}
        plugins={[
          vinValidation(),
          confidenceScoring({ minConfidence: 0.90 }),
          vinDecoding({ apiProvider: 'nhtsa' })
        ]}
      />
      
      <form>
        <input value={form.vin} onChange={...} />
        <input value={form.make} onChange={...} />
        <input value={form.model} onChange={...} />
        <input value={form.year} onChange={...} />
      </form>
    </div>
  )
}
```

---

### Example 5: Multi-Scanner with Different Configs

```tsx
function MultiScanner() {
  return (
    <div>
      {/* VIN Scanner - Strict validation */}
      <VINScanner
        plugins={[
          vinValidation({ strictMode: true }),
          confidenceScoring({ minConfidence: 0.95 })
        ]}
      />
      
      {/* Odometer Scanner - Relaxed validation */}
      <OdometerScanner
        plugins={[
          confidenceScoring({ 
            minConfidence: 0.85,
            showBadge: true 
          })
        ]}
      />
      
      {/* License Plate Scanner - Fast capture */}
      <LicensePlateScanner
        plugins={[
          confidenceScoring({ 
            minConfidence: 0.80,
            maxRetries: 2 
          })
        ]}
      />
    </div>
  )
}
```

---

## 🛠️ Creating Custom Plugins

### Simple Plugin Example

```typescript
import type { VisionPlugin, VisionPluginFactory } from '@/components/vision/plugins'

export const myCustomPlugin: VisionPluginFactory = (options = {}) => {
  const plugin: VisionPlugin = {
    id: '@myapp/custom-plugin',
    version: '1.0.0',
    name: 'My Custom Plugin',
    description: 'Does something awesome',
    
    hooks: {
      'after-capture': async (result, context) => {
        console.log('Processing capture:', result)
        // Your custom logic here
        return result
      }
    }
  }
  
  return plugin
}
```

---

### Advanced Plugin Example

```typescript
export interface MyPluginOptions {
  threshold: number
  onProcess?: (data: any) => void
}

export const advancedPlugin: VisionPluginFactory<MyPluginOptions> = (options = {}) => {
  let processCount = 0
  
  const plugin: VisionPlugin = {
    id: '@myapp/advanced-plugin',
    version: '1.0.0',
    name: 'Advanced Plugin',
    
    hooks: {
      'before-capture': async (context) => {
        console.log('Preparing to capture...')
        // Pre-capture validation
      },
      
      'after-capture': async (result, context) => {
        processCount++
        // Process result
        return result
      },
      
      'enrich-result': async (result, context) => {
        // Add custom data
        result.data.customField = 'custom value'
        result.metadata.processCount = processCount
        return result
      },
      
      'render-overlay': (context) => {
        return <div>Custom UI Overlay</div>
      },
      
      'on-success': async (result, context) => {
        options.onProcess?.(result.data)
      }
    }
  }
  
  return plugin
}
```

---

## 📋 Best Practices

### 1. **Order Matters**

Plugins execute in order. Put validators before enrichers:

```tsx
// ✅ Good: Validate → Enrich
plugins={[
  vinValidation(),
  vinDecoding()
]}

// ❌ Bad: Enrich → Validate
plugins={[
  vinDecoding(),
  vinValidation()
]}
```

---

### 2. **Use Confidence Scoring**

Always use confidence scoring for production:

```tsx
// ✅ Good: Quality control
plugins={[
  confidenceScoring({ minConfidence: 0.90 })
]}

// ❌ Bad: No quality control
plugins={[]}
```

---

### 3. **Handle Errors**

Use error callbacks to provide user feedback:

```tsx
plugins={[
  vinValidation({
    onValidation: (result) => {
      if (!result.valid) {
        toast.error(result.errors.join(', '))
      }
    }
  })
]}
```

---

### 4. **Cache API Results**

Enable caching for expensive operations:

```tsx
plugins={[
  vinDecoding({
    cacheResults: true,
    cacheDuration: 3600000  // 1 hour
  })
]}
```

---

### 5. **Monitor Performance**

Track plugin performance:

```tsx
plugins={[
  myPlugin({
    onProcess: (data) => {
      analytics.track('plugin_processed', {
        duration: Date.now() - startTime
      })
    }
  })
]}
```

---

## 🚀 Advanced Usage

### Plugin Composition

Combine plugins for complex workflows:

```tsx
const validateAndDecode = [
  vinValidation({ strictMode: true }),
  vinDecoding({ apiProvider: 'nhtsa' })
]

const qualityControl = [
  confidenceScoring({ minConfidence: 0.95 })
]

<VINScanner plugins={[...validateAndDecode, ...qualityControl]} />
```

---

### Conditional Plugins

Load plugins based on configuration:

```tsx
const plugins = [
  vinValidation(),
  confidenceScoring(),
  config.useVINDecoding && vinDecoding({ apiProvider: 'nhtsa' })
].filter(Boolean)

<VINScanner plugins={plugins} />
```

---

### Plugin Testing

Test plugins in isolation:

```tsx
import { validateVIN } from '@/components/vision/plugins/examples'

test('VIN validation', () => {
  const result = validateVIN('1HGBH41JXMN109186', {
    validateCheckDigit: true
  })
  
  expect(result.valid).toBe(true)
  expect(result.errors).toHaveLength(0)
})
```

---

## 📊 Performance Tips

1. **Enable Caching**: Cache expensive operations (API calls, decoding)
2. **Lazy Load**: Import plugins only when needed
3. **Optimize Hooks**: Keep hook logic fast and async
4. **Batch Operations**: Group similar operations together
5. **Monitor**: Track performance metrics

---

## 🎯 Common Patterns

### Pattern 1: Quality Control

```tsx
plugins={[
  confidenceScoring({ minConfidence: 0.90 }),
  vinValidation({ strictMode: true })
]}
```

### Pattern 2: Auto-Fill Forms

```tsx
plugins={[
  vinDecoding({ apiProvider: 'nhtsa' }),
  {
    hooks: {
      'on-success': async (result) => {
        form.setValues(result.data)
      }
    }
  }
]}
```

### Pattern 3: Analytics Tracking

```tsx
plugins={[
  {
    hooks: {
      'on-success': async (result) => {
        analytics.track('vin_scanned', {
          confidence: result.confidence,
          attempts: result.metadata.attempts
        })
      }
    }
  }
]}
```

---

## 🎊 Summary

Plugins make the Vision system **extremely powerful and flexible**:

- ✅ **Easy to use**: Just add to `plugins` prop
- ✅ **Composable**: Mix and match plugins
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Production-ready**: Battle-tested examples
- ✅ **Extensible**: Create custom plugins easily

**Start with the examples, then create your own plugins to supercharge your Vision scanning!** 🚀
