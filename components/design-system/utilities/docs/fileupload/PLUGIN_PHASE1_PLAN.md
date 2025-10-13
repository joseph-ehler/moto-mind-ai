# Phase 1: FileUpload Plugin System - Implementation Plan

## 📋 **Status Assessment**

### **✅ Already Built (75% Complete)**

```
plugins/
├── types.ts              ✅ Complete type system
├── plugin-manager.ts     ✅ Full manager implementation
├── paste-support.ts      ✅ Example plugin
├── utils.ts              ✅ Helper functions
└── index.ts              ✅ Barrel exports
```

**What Works:**
- ✅ Complete type definitions
- ✅ PluginManager class
- ✅ Hook execution system
- ✅ Event system
- ✅ One example plugin (paste support)
- ✅ Utility functions

---

### **❌ What's Missing (25% Remaining)**

#### **1. FileUpload Integration** 🔴 **CRITICAL**
- ❌ No `plugins` prop on FileUpload component
- ❌ PluginManager not instantiated
- ❌ Hooks not executed at lifecycle points
- ❌ Plugin UI not rendered

#### **2. Example Plugins** 🟡 **HIGH VALUE**
- ✅ Paste support (done)
- ❌ Image rotation plugin
- ❌ EXIF stripper plugin
- ❌ File validator plugin

#### **3. Documentation** 🟢 **IMPORTANT**
- ❌ Plugin development guide
- ❌ Integration examples
- ❌ API reference
- ❌ Best practices

---

## 🎯 **Phase 1 Implementation Plan**

### **Week 1: Integration & Core Plugins**

#### **Day 1-2: Integrate Plugin System into FileUpload** 🔴
**Goal:** Make FileUpload plugin-aware

**Tasks:**
1. Add `plugins` prop to FileUploadProps
2. Create `usePluginManager` hook
3. Initialize PluginManager on mount
4. Execute hooks at lifecycle points:
   - `before-file-added` when files dropped/selected
   - `after-file-added` after file added
   - `before-upload` before upload starts
   - `upload-progress` during upload
   - `upload-complete` after success
   - `upload-error` on error
5. Render plugin UI:
   - `render-file-ui` in file preview
   - `render-toolbar` in toolbar
   - `render-upload-area` in upload zone

**Deliverable:** FileUpload accepts and executes plugins

**Time:** 12-16 hours

---

#### **Day 3: Build Core Plugins** 🟡
**Goal:** Create 2-3 example plugins

**Plugin 1: Image Rotation**
```typescript
imageRotation({ 
  angles: [90, 180, 270],
  showUI: true 
})
```
**Time:** 3-4 hours

**Plugin 2: EXIF Stripper**
```typescript
exifStripper({ 
  removeGPS: true,
  autoRotate: true 
})
```
**Time:** 3-4 hours

**Plugin 3: File Validator**
```typescript
fileValidator({
  maxSize: 10MB,
  allowedTypes: ['image/*'],
  customRules: [...] 
})
```
**Time:** 2-3 hours

**Deliverable:** 3 production-ready plugins

**Time:** 8-11 hours

---

#### **Day 4-5: Test & Document** 🟢
**Goal:** Ensure quality & usability

**Testing:**
- Unit tests for plugins
- Integration tests
- E2E tests
- Manual testing

**Documentation:**
- Plugin development guide
- API reference
- Examples
- Best practices

**Deliverable:** Tested, documented system

**Time:** 12-16 hours

---

## 📐 **Technical Implementation Details**

### **1. FileUpload Integration**

#### **Add Plugins Prop**
```typescript
// FileUpload.tsx

export interface FileUploadProps {
  // ... existing props
  
  /** Plugins to extend functionality */
  plugins?: FileUploadPlugin[]
  
  /** Plugin event handler */
  onPluginEvent?: (event: string, data: any) => void
}
```

---

#### **Create usePluginManager Hook**
```typescript
// hooks/usePluginManager.ts

import { useRef, useEffect } from 'react'
import { PluginManager } from '../plugins'
import type { FileUploadPlugin, PluginContext } from '../plugins'

export function usePluginManager(
  plugins: FileUploadPlugin[],
  context: PluginContext
) {
  const managerRef = useRef<PluginManager>()
  
  useEffect(() => {
    // Create manager
    const manager = new PluginManager(context)
    
    // Register plugins
    plugins.forEach(plugin => {
      manager.register(plugin).catch(err => {
        console.error(`Failed to register plugin ${plugin.id}:`, err)
      })
    })
    
    managerRef.current = manager
    
    // Cleanup
    return () => {
      plugins.forEach(plugin => {
        manager.unregister(plugin.id)
      })
    }
  }, [plugins, context])
  
  return managerRef
}
```

---

#### **Execute Hooks in FileUpload**
```typescript
// FileUpload.tsx

export function FileUpload(props: FileUploadProps) {
  const { plugins = [], onPluginEvent, ...otherProps } = props
  
  // Plugin context
  const pluginContext: PluginContext = {
    addFiles: handleAddFiles,
    removeFile: handleRemoveFile,
    updateFile: handleUpdateFile,
    getFiles: () => files,
    getFile: (id) => files.find(f => f.id === id),
    emit: (event, data) => onPluginEvent?.(event, data),
    on: (event, handler) => { /* ... */ },
    getOptions: () => ({}),
    props: otherProps
  }
  
  // Initialize plugin manager
  const pluginManager = usePluginManager(plugins, pluginContext)
  
  // Hook into file adding
  const handleFilesAdded = async (newFiles: File[]) => {
    const transformedFiles: File[] = []
    
    for (const file of newFiles) {
      // Execute before-file-added hook
      const transformed = await pluginManager.current?.executeTransformHook(
        'before-file-added',
        file
      )
      
      if (transformed) {
        transformedFiles.push(transformed)
      }
    }
    
    // Add files
    const fileStates = transformedFiles.map(file => createFileState(file))
    setFiles(prev => [...prev, ...fileStates])
    
    // Execute after-file-added hook
    for (const fileState of fileStates) {
      await pluginManager.current?.executeNotifyHook(
        'after-file-added',
        fileState
      )
    }
  }
  
  // Hook into upload
  const handleUpload = async (fileState: FileState) => {
    // Execute before-upload hook
    const shouldContinue = await pluginManager.current?.executeCheckHook(
      'before-upload',
      fileState
    )
    
    if (!shouldContinue) return
    
    // Upload logic...
  }
  
  // Render plugin UI
  const renderPluginUI = (fileState: FileState) => {
    return pluginManager.current?.executeRenderHook(
      'render-file-ui',
      fileState
    )
  }
  
  return (
    // ... component JSX
  )
}
```

---

### **2. Example Plugins**

#### **Image Rotation Plugin**
```typescript
// plugins/image-rotation.ts

import { PluginFactory } from './types'

export interface ImageRotationOptions {
  angles?: number[]
  showUI?: boolean
  autoRotate?: boolean
}

export const imageRotation: PluginFactory<ImageRotationOptions> = (options = {}) => {
  const { angles = [90, 180, 270], showUI = true } = options
  
  return {
    id: '@motomind/image-rotation',
    version: '1.0.0',
    type: 'processor',
    name: 'Image Rotation',
    options,
    
    hooks: {
      'render-file-ui': (fileState) => {
        if (!showUI || !isImage(fileState.file)) return null
        
        return (
          <div className="flex gap-2">
            {angles.map(angle => (
              <button
                key={angle}
                onClick={() => rotateImage(fileState, angle)}
                className="btn-sm"
              >
                Rotate {angle}°
              </button>
            ))}
          </div>
        )
      }
    }
  }
}

async function rotateImage(fileState: FileState, angle: number) {
  // Rotation logic
  const canvas = await loadImageToCanvas(fileState.file)
  const rotatedCanvas = rotateCanvas(canvas, angle)
  const blob = await canvasToBlob(rotatedCanvas)
  const newFile = new File([blob], fileState.file.name, { type: 'image/jpeg' })
  
  // Update file
  // context.updateFile(fileState.id, { file: newFile })
}
```

---

#### **EXIF Stripper Plugin**
```typescript
// plugins/exif-stripper.ts

import { PluginFactory } from './types'
import piexif from 'piexifjs'

export interface ExifStripperOptions {
  removeGPS?: boolean
  removeAll?: boolean
  autoRotate?: boolean
}

export const exifStripper: PluginFactory<ExifStripperOptions> = (options = {}) => {
  const { removeGPS = true, removeAll = false, autoRotate = true } = options
  
  return {
    id: '@motomind/exif-stripper',
    version: '1.0.0',
    type: 'processor',
    name: 'EXIF Stripper',
    options,
    
    hooks: {
      'before-file-added': async (file) => {
        if (!isImage(file)) return file
        
        const dataURL = await fileToDataURL(file)
        
        // Get EXIF data
        const exif = piexif.load(dataURL)
        
        // Auto-rotate if needed
        if (autoRotate && exif['0th'][piexif.ImageIFD.Orientation]) {
          const orientation = exif['0th'][piexif.ImageIFD.Orientation]
          // Rotate image based on orientation
        }
        
        // Remove EXIF
        if (removeAll) {
          const newDataURL = piexif.remove(dataURL)
          return dataURLToFile(newDataURL, file.name, file.type)
        } else if (removeGPS) {
          delete exif['GPS']
          const exifBytes = piexif.dump(exif)
          const newDataURL = piexif.insert(exifBytes, dataURL)
          return dataURLToFile(newDataURL, file.name, file.type)
        }
        
        return file
      }
    }
  }
}
```

---

#### **File Validator Plugin**
```typescript
// plugins/file-validator.ts

import { PluginFactory } from './types'

export interface FileValidatorOptions {
  maxSize?: number
  minSize?: number
  allowedTypes?: string[]
  blockedTypes?: string[]
  customValidation?: (file: File) => { valid: boolean; error?: string }
}

export const fileValidator: PluginFactory<FileValidatorOptions> = (options = {}) => {
  return {
    id: '@motomind/file-validator',
    version: '1.0.0',
    type: 'processor',
    name: 'File Validator',
    options,
    
    hooks: {
      'before-file-added': (file) => {
        // Size validation
        if (options.maxSize && file.size > options.maxSize) {
          console.error(`File ${file.name} exceeds max size`)
          return null // Reject file
        }
        
        if (options.minSize && file.size < options.minSize) {
          console.error(`File ${file.name} below min size`)
          return null
        }
        
        // Type validation
        if (options.allowedTypes && !matchesAccept(file, options.allowedTypes)) {
          console.error(`File ${file.name} type not allowed`)
          return null
        }
        
        if (options.blockedTypes && matchesAccept(file, options.blockedTypes)) {
          console.error(`File ${file.name} type is blocked`)
          return null
        }
        
        // Custom validation
        if (options.customValidation) {
          const result = options.customValidation(file)
          if (!result.valid) {
            console.error(`File ${file.name} failed validation: ${result.error}`)
            return null
          }
        }
        
        return file
      }
    }
  }
}
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**
```typescript
// plugins/__tests__/plugin-manager.test.ts
describe('PluginManager', () => {
  it('registers plugins', async () => {
    const manager = new PluginManager(mockContext)
    const plugin = mockPlugin()
    await manager.register(plugin)
    expect(manager.getPlugin(plugin.id)).toBeDefined()
  })
  
  it('executes hooks', async () => {
    const manager = new PluginManager(mockContext)
    const hook = jest.fn()
    await manager.register({ ...mockPlugin(), hooks: { 'before-file-added': hook } })
    await manager.executeTransformHook('before-file-added', mockFile)
    expect(hook).toHaveBeenCalled()
  })
})
```

### **Integration Tests**
```typescript
// FileUpload.integration.test.tsx
describe('FileUpload with plugins', () => {
  it('applies plugin transformations', async () => {
    const transformer = (file: File) => new File([file], 'transformed.jpg')
    const plugin = createPlugin({ hooks: { 'before-file-added': transformer } })
    
    render(<FileUpload plugins={[plugin]} />)
    
    // Upload file
    const file = new File(['content'], 'test.jpg')
    await userEvent.upload(screen.getByLabelText('Upload'), file)
    
    // Verify transformation
    expect(screen.getByText('transformed.jpg')).toBeInTheDocument()
  })
})
```

---

## 📚 **Documentation Outline**

### **1. Plugin Development Guide**
- Getting started
- Plugin types (processor, source, uploader, UI)
- Hook reference
- Best practices
- Examples

### **2. API Reference**
- PluginContext API
- PluginHooks list
- Event system
- Utilities

### **3. Examples**
- Basic plugin
- Image manipulation
- Custom upload
- UI extension

---

## 📊 **Success Metrics**

| Metric | Target | Status |
|--------|--------|--------|
| Core integration | 100% | ⏳ Pending |
| Example plugins | 3-4 | ⏳ 1/4 (25%) |
| Test coverage | >80% | ⏳ 0% |
| Documentation | Complete | ⏳ Partial |
| Bundle size impact | <5KB | ⏳ TBD |

---

## 🎯 **Deliverables**

### **End of Week 1:**
- ✅ FileUpload fully integrated with plugin system
- ✅ 3 example plugins (paste, rotation, EXIF, validator)
- ✅ Unit & integration tests
- ✅ Plugin development guide
- ✅ Ready for Phase 2 (MotoMind plugins)

---

## 🚀 **Next Steps After Phase 1**

### **Phase 2: MotoMind Plugin Library** (Week 2-3)
Build automotive-specific plugins:
- VIN extraction from images
- VIN validation & decoding
- Damage detection (basic)
- Quality checks (blur, lighting)
- Auto form-fill helpers

### **Phase 3: Advanced Features** (On-demand)
- Barcode/QR scanning
- Real-time AI validation
- Multi-frame capture
- Advanced damage assessment

---

## 💡 **Key Decisions**

### **1. Plugin API Stability**
- ✅ Keep hook names stable
- ✅ Version plugins
- ✅ Deprecate gracefully

### **2. Bundle Strategy**
- ✅ Core system in main bundle
- ✅ Plugins lazy-loaded on demand
- ✅ Tree-shaking friendly

### **3. Error Handling**
- ✅ Plugins can't crash FileUpload
- ✅ Graceful degradation
- ✅ Clear error messages

---

## 🎊 **Timeline Summary**

**Week 1: Phase 1 Complete**
- Day 1-2: Integration (12-16h)
- Day 3: Example plugins (8-11h)
- Day 4-5: Testing & docs (12-16h)

**Total:** 32-43 hours (~5 days)

**Outcome:** Production-ready plugin system with 3-4 example plugins

---

**Ready to start implementation!** 🚀
