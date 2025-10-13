# FileUpload Plugin Architecture 🔌

## 🎯 **Vision**

Transform FileUpload from a monolithic component into an extensible, plugin-based system that allows:
- **Pay-for-what-you-use** - Only bundle features you need
- **Third-party extensions** - Community plugins
- **Easy customization** - Add/remove features declaratively
- **Type safety** - Full TypeScript support
- **Zero breaking changes** - Backwards compatible

---

## 🏗️ **Architecture Overview**

### **Core Concept**

```tsx
// Simple usage (no plugins)
<FileUpload value={files} onChange={setFiles} />

// With plugins
<FileUpload
  value={files}
  onChange={setFiles}
  plugins={[
    imageEditor({ cropAspectRatios: [1, 16/9, 4/3] }),
    exifStripper({ removeGPS: true }),
    pasteSupport(),
    cloudStorage({ providers: ['google-drive'] })
  ]}
/>
```

### **Plugin Types**

```
┌─────────────────────────────────────────┐
│          FileUpload Component           │
│  (Core: Drag-drop, validation, UI)     │
└────────────┬────────────────────────────┘
             │
             ├─ Plugin Manager
             │
             ├─ Processor Plugins ─────────┐
             │  (Transform files)          │
             │  - Image Editor             │
             │  - EXIF Stripper            │
             │  - Compression              │
             │  - Watermarking             │
             │
             ├─ Source Plugins ────────────┤
             │  (Add file sources)         │
             │  - Clipboard                │
             │  - URL Import               │
             │  - Cloud Storage            │
             │  - Screen Capture           │
             │
             ├─ Uploader Plugins ──────────┤
             │  (Handle uploads)           │
             │  - Resumable (tus)          │
             │  - Chunked                  │
             │  - Direct S3                │
             │  - Progress Tracking        │
             │
             └─ UI Plugins ────────────────┘
                (Extend UI)
                - Preview Enhancements
                - Custom Actions
                - Status Badges
```

---

## 📦 **Plugin System Design**

### **1. Core Plugin Interface**

```typescript
// file-upload/plugins/types.ts

export interface FileUploadPlugin<TOptions = any> {
  /** Unique plugin identifier */
  id: string
  
  /** Plugin version */
  version: string
  
  /** Plugin type */
  type: 'processor' | 'source' | 'uploader' | 'ui'
  
  /** Plugin options */
  options?: TOptions
  
  /** Initialize plugin */
  init?(context: PluginContext): void | Promise<void>
  
  /** Cleanup plugin */
  destroy?(): void | Promise<void>
  
  /** Lifecycle hooks */
  hooks?: PluginHooks
}

export interface PluginContext {
  /** Add files to upload queue */
  addFiles: (files: File[]) => void
  
  /** Remove file */
  removeFile: (fileId: string) => void
  
  /** Update file */
  updateFile: (fileId: string, updates: Partial<FileState>) => void
  
  /** Get current files */
  getFiles: () => FileState[]
  
  /** Emit event */
  emit: (event: string, data: any) => void
  
  /** Listen to event */
  on: (event: string, handler: (data: any) => void) => () => void
  
  /** Plugin options */
  options: Record<string, any>
}

export interface PluginHooks {
  /** Before file is added */
  'before-file-added'?: (file: File) => File | Promise<File> | null
  
  /** After file is added */
  'after-file-added'?: (file: FileState) => void
  
  /** Before upload starts */
  'before-upload'?: (file: FileState) => boolean | Promise<boolean>
  
  /** During upload */
  'upload-progress'?: (file: FileState, progress: number) => void
  
  /** Upload complete */
  'upload-complete'?: (file: FileState, response: any) => void
  
  /** Upload error */
  'upload-error'?: (file: FileState, error: Error) => void
  
  /** Render custom UI */
  'render-ui'?: (file: FileState) => React.ReactNode
}

export interface FileState {
  id: string
  file: File
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  metadata?: Record<string, any>
}
```

---

### **2. Plugin Manager**

```typescript
// file-upload/plugins/plugin-manager.ts

export class PluginManager {
  private plugins: Map<string, FileUploadPlugin> = new Map()
  private eventHandlers: Map<string, Set<Function>> = new Map()
  
  constructor(private context: PluginContext) {}
  
  /**
   * Register plugin
   */
  async register(plugin: FileUploadPlugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} already registered`)
    }
    
    // Initialize plugin
    await plugin.init?.(this.context)
    
    // Register hooks
    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([event, handler]) => {
        this.on(event, handler)
      })
    }
    
    this.plugins.set(plugin.id, plugin)
  }
  
  /**
   * Unregister plugin
   */
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return
    
    await plugin.destroy?.()
    this.plugins.delete(pluginId)
  }
  
  /**
   * Execute hook
   */
  async executeHook<T>(
    hookName: string,
    data: T
  ): Promise<T> {
    const handlers = this.eventHandlers.get(hookName)
    if (!handlers) return data
    
    let result = data
    for (const handler of handlers) {
      const transformed = await handler(result)
      if (transformed !== undefined) {
        result = transformed
      }
    }
    
    return result
  }
  
  /**
   * Check if hook can proceed (for boolean hooks)
   */
  async canProceed(hookName: string, data: any): Promise<boolean> {
    const handlers = this.eventHandlers.get(hookName)
    if (!handlers) return true
    
    for (const handler of handlers) {
      const result = await handler(data)
      if (result === false) return false
    }
    
    return true
  }
  
  /**
   * Emit event
   */
  emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (!handlers) return
    
    handlers.forEach(handler => handler(data))
  }
  
  /**
   * Listen to event
   */
  on(event: string, handler: Function): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    
    this.eventHandlers.get(event)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }
  
  /**
   * Get all plugins
   */
  getPlugins(): FileUploadPlugin[] {
    return Array.from(this.plugins.values())
  }
  
  /**
   * Get plugin by ID
   */
  getPlugin(id: string): FileUploadPlugin | undefined {
    return this.plugins.get(id)
  }
}
```

---

## 🔌 **Example Plugins**

### **1. Image Editor Plugin**

```typescript
// file-upload/plugins/image-editor.ts

import { FileUploadPlugin } from './types'

export interface ImageEditorOptions {
  cropAspectRatios?: number[]
  allowRotate?: boolean
  allowFlip?: boolean
  allowFilters?: boolean
  maxWidth?: number
  maxHeight?: number
}

export function imageEditor(
  options: ImageEditorOptions = {}
): FileUploadPlugin<ImageEditorOptions> {
  let EditorComponent: any
  
  return {
    id: '@motomind/image-editor',
    version: '1.0.0',
    type: 'processor',
    options,
    
    async init(context) {
      // Lazy-load editor component
      const { ImageEditor } = await import('./components/ImageEditor')
      EditorComponent = ImageEditor
    },
    
    hooks: {
      'after-file-added': async (fileState) => {
        if (!fileState.file.type.startsWith('image/')) {
          return // Only process images
        }
        
        // Show editor modal
        const editedFile = await showEditorModal(
          fileState.file,
          EditorComponent,
          options
        )
        
        if (editedFile) {
          context.updateFile(fileState.id, {
            file: editedFile,
            metadata: {
              ...fileState.metadata,
              edited: true
            }
          })
        }
      },
      
      'render-ui': (fileState) => {
        if (!fileState.metadata?.edited) return null
        
        return (
          <span className="text-xs text-blue-600">
            ✨ Edited
          </span>
        )
      }
    }
  }
}

async function showEditorModal(
  file: File,
  Editor: any,
  options: ImageEditorOptions
): Promise<File | null> {
  return new Promise((resolve) => {
    // Implementation: Show modal with editor
    // Return edited file or null if cancelled
  })
}
```

---

### **2. Paste Support Plugin**

```typescript
// file-upload/plugins/paste-support.ts

export interface PasteSupportOptions {
  /**  Allow pasting URLs */
  allowURLs?: boolean
  /** Auto-fetch pasted URLs */
  autoFetchURLs?: boolean
}

export function pasteSupport(
  options: PasteSupportOptions = {}
): FileUploadPlugin<PasteSupportOptions> {
  let cleanup: (() => void) | undefined
  
  return {
    id: '@motomind/paste-support',
    version: '1.0.0',
    type: 'source',
    options,
    
    init(context) {
      const handlePaste = async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items
        if (!items) return
        
        const files: File[] = []
        
        for (const item of Array.from(items)) {
          // Handle files
          if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
            const file = item.getAsFile()
            if (file) files.push(file)
          }
          
          // Handle URLs
          if (options.allowURLs && item.type === 'text/plain') {
            item.getAsString(async (text) => {
              if (isURL(text) && options.autoFetchURLs) {
                const file = await fetchFileFromURL(text)
                if (file) context.addFiles([file])
              }
            })
          }
        }
        
        if (files.length > 0) {
          context.addFiles(files)
          context.emit('paste-files', { files })
        }
      }
      
      document.addEventListener('paste', handlePaste)
      cleanup = () => document.removeEventListener('paste', handlePaste)
    },
    
    destroy() {
      cleanup?.()
    }
  }
}

function isURL(text: string): boolean {
  try {
    new URL(text)
    return true
  } catch {
    return false
  }
}

async function fetchFileFromURL(url: string): Promise<File | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const filename = url.split('/').pop() || 'download'
    return new File([blob], filename, { type: blob.type })
  } catch (error) {
    console.error('Failed to fetch URL:', error)
    return null
  }
}
```

---

### **3. EXIF Stripper Plugin**

```typescript
// file-upload/plugins/exif-stripper.ts

export interface EXIFStripperOptions {
  /** Remove GPS data */
  removeGPS?: boolean
  /** Remove all EXIF data */
  removeAll?: boolean
  /** Auto-rotate based on orientation */
  autoRotate?: boolean
  /** Keep specific tags */
  keepTags?: string[]
}

export function exifStripper(
  options: EXIFStripperOptions = { removeGPS: true }
): FileUploadPlugin<EXIFStripperOptions> {
  return {
    id: '@motomind/exif-stripper',
    version: '1.0.0',
    type: 'processor',
    options,
    
    async init() {
      // Lazy-load EXIF library
      await import('piexifjs')
    },
    
    hooks: {
      'before-file-added': async (file) => {
        if (!file.type.startsWith('image/')) {
          return file
        }
        
        try {
          const processed = await processImage(file, options)
          return processed
        } catch (error) {
          console.error('EXIF stripping failed:', error)
          return file // Return original on error
        }
      }
    }
  }
}

async function processImage(
  file: File,
  options: EXIFStripperOptions
): Promise<File> {
  // Implementation:
  // 1. Read image data
  // 2. Parse EXIF
  // 3. Auto-rotate if needed
  // 4. Strip specified EXIF data
  // 5. Return new file
  
  // Pseudo-code:
  const piexif = (window as any).piexif
  const dataURL = await fileToDataURL(file)
  const exifData = piexif.load(dataURL)
  
  if (options.autoRotate) {
    // Rotate based on orientation tag
  }
  
  if (options.removeGPS) {
    delete exifData.GPS
  }
  
  if (options.removeAll) {
    // Remove all except keepTags
  }
  
  const newDataURL = piexif.insert(piexif.dump(exifData), dataURL)
  return dataURLToFile(newDataURL, file.name, file.type)
}
```

---

### **4. Resumable Upload Plugin**

```typescript
// file-upload/plugins/resumable-upload.ts

export interface ResumableUploadOptions {
  /** Upload endpoint (tus server) */
  endpoint: string
  /** Chunk size in bytes */
  chunkSize?: number
  /** Retry attempts */
  retryDelays?: number[]
  /** Store progress in localStorage */
  storeFingerprintForResuming?: boolean
}

export function resumableUpload(
  options: ResumableUploadOptions
): FileUploadPlugin<ResumableUploadOptions> {
  let tusInstance: any
  
  return {
    id: '@motomind/resumable-upload',
    version: '1.0.0',
    type: 'uploader',
    options,
    
    async init(context) {
      const { Upload } = await import('tus-js-client')
      tusInstance = Upload
    },
    
    hooks: {
      'before-upload': async (fileState) => {
        const upload = new tusInstance(fileState.file, {
          endpoint: options.endpoint,
          chunkSize: options.chunkSize || 5 * 1024 * 1024, // 5MB
          retryDelays: options.retryDelays || [0, 1000, 3000, 5000],
          metadata: {
            filename: fileState.file.name,
            filetype: fileState.file.type
          },
          
          onProgress: (bytesUploaded: number, bytesTotal: number) => {
            const progress = (bytesUploaded / bytesTotal) * 100
            context.updateFile(fileState.id, { progress })
            context.emit('upload-progress', { fileState, progress })
          },
          
          onSuccess: () => {
            context.updateFile(fileState.id, { 
              status: 'success',
              progress: 100 
            })
            context.emit('upload-complete', { fileState })
          },
          
          onError: (error: Error) => {
            context.updateFile(fileState.id, { 
              status: 'error',
              error: error.message 
            })
            context.emit('upload-error', { fileState, error })
          }
        })
        
        // Start upload
        upload.start()
        
        // Store upload instance for pause/resume
        context.updateFile(fileState.id, {
          metadata: {
            ...fileState.metadata,
            tusUpload: upload
          }
        })
        
        // Prevent default upload (we handle it)
        return false
      }
    }
  }
}
```

---

### **5. Cloud Storage Plugin**

```typescript
// file-upload/plugins/cloud-storage.ts

export interface CloudStorageOptions {
  providers: ('google-drive' | 'dropbox' | 'onedrive')[]
  apiKeys: Record<string, string>
}

export function cloudStorage(
  options: CloudStorageOptions
): FileUploadPlugin<CloudStorageOptions> {
  return {
    id: '@motomind/cloud-storage',
    version: '1.0.0',
    type: 'source',
    options,
    
    async init(context) {
      // Load picker SDKs
      if (options.providers.includes('google-drive')) {
        await loadGoogleDrivePicker(options.apiKeys['google-drive'])
      }
    },
    
    hooks: {
      'render-ui': () => {
        return (
          <div className="flex gap-2">
            {options.providers.map(provider => (
              <button
                key={provider}
                onClick={() => openPicker(provider, context)}
                className="btn btn-outline"
              >
                📁 {provider}
              </button>
            ))}
          </div>
        )
      }
    }
  }
}
```

---

## 🎨 **Usage Examples**

### **Basic (No Plugins)**

```tsx
import { FileUpload } from '@/components/design-system'

function MyComponent() {
  const [files, setFiles] = useState<File[]>([])
  
  return (
    <FileUpload
      value={files}
      onChange={setFiles}
      accept="image/*"
      multiple
    />
  )
}
```

---

### **With Image Editing**

```tsx
import { FileUpload } from '@/components/design-system'
import { imageEditor } from '@/components/design-system/utilities/file-upload/plugins'

function MyComponent() {
  return (
    <FileUpload
      value={files}
      onChange={setFiles}
      plugins={[
        imageEditor({
          cropAspectRatios: [1, 16/9, 4/3],
          allowRotate: true,
          allowFlip: true
        })
      ]}
    />
  )
}
```

---

### **Complete Setup**

```tsx
import { 
  FileUpload,
  imageEditor,
  exifStripper,
  pasteSupport,
  resumableUpload,
  cloudStorage
} from '@/components/design-system'

function AdvancedUpload() {
  const [files, setFiles] = useState<File[]>([])
  
  return (
    <FileUpload
      value={files}
      onChange={setFiles}
      accept="image/*,video/*"
      maxFiles={50}
      
      plugins={[
        // Add paste support
        pasteSupport({ 
          allowURLs: true,
          autoFetchURLs: true 
        }),
        
        // Strip EXIF for privacy
        exifStripper({ 
          removeGPS: true,
          autoRotate: true 
        }),
        
        // Allow image editing
        imageEditor({ 
          cropAspectRatios: [1, 16/9, 4/3],
          allowRotate: true 
        }),
        
        // Resumable uploads
        resumableUpload({
          endpoint: '/api/upload',
          chunkSize: 5 * 1024 * 1024
        }),
        
        // Cloud storage import
        cloudStorage({
          providers: ['google-drive', 'dropbox'],
          apiKeys: {
            'google-drive': process.env.NEXT_PUBLIC_GOOGLE_API_KEY
          }
        })
      ]}
      
      onPluginEvent={(event, data) => {
        console.log('Plugin event:', event, data)
      }}
    />
  )
}
```

---

## 📚 **Creating Custom Plugins**

### **Simple Plugin Example**

```typescript
// my-watermark-plugin.ts

import { FileUploadPlugin } from '@/components/design-system/utilities/file-upload/plugins'

export interface WatermarkOptions {
  text: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  opacity: number
}

export function watermarkPlugin(
  options: WatermarkOptions
): FileUploadPlugin<WatermarkOptions> {
  return {
    id: 'my-watermark-plugin',
    version: '1.0.0',
    type: 'processor',
    options,
    
    hooks: {
      'before-file-added': async (file) => {
        if (!file.type.startsWith('image/')) {
          return file
        }
        
        // Add watermark to image
        const watermarked = await addWatermark(file, options)
        return watermarked
      }
    }
  }
}

async function addWatermark(
  file: File,
  options: WatermarkOptions
): Promise<File> {
  // Implementation: Canvas-based watermarking
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  // Load image
  const img = await loadImage(file)
  canvas.width = img.width
  canvas.height = img.height
  
  // Draw image
  ctx.drawImage(img, 0, 0)
  
  // Draw watermark
  ctx.globalAlpha = options.opacity
  ctx.font = '20px Arial'
  ctx.fillStyle = 'white'
  
  const position = getPosition(options.position, canvas.width, canvas.height)
  ctx.fillText(options.text, position.x, position.y)
  
  // Convert back to File
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], file.name, { type: file.type }))
      }
    }, file.type)
  })
}
```

---

## 🔄 **Migration Strategy**

### **Phase 1: Add Plugin System (Non-Breaking)**

1. Add `PluginManager` alongside existing code
2. Add `plugins` prop to `FileUploadProps`
3. Keep existing features working as-is

```tsx
// Backwards compatible
<FileUpload value={files} onChange={setFiles} />

// With plugins
<FileUpload 
  value={files} 
  onChange={setFiles}
  plugins={[imageEditor()]} 
/>
```

### **Phase 2: Extract Core Features**

Move existing features to opt-in plugins:
- Auto-capture → Plugin
- OCR → Plugin
- Compression → Plugin

```tsx
// Old way (still works)
<FileUpload enableAutoCapture enableOCR />

// New way (more explicit)
<FileUpload
  plugins={[
    autoCapture({ threshold: 0.8 }),
    ocrEnhancement()
  ]}
/>
```

### **Phase 3: Deprecate Old Props**

Gradually deprecate feature-specific props in favor of plugins.

---

## 📊 **Bundle Size Impact**

### **Core (Always Loaded)**
- FileUpload component: ~15KB
- Plugin Manager: ~3KB
- **Total:** ~18KB

### **Plugins (Opt-in)**
- Image Editor: ~45KB (lazy-loaded)
- EXIF Stripper: ~25KB (lazy-loaded)
- Resumable Upload: ~15KB (lazy-loaded)
- Cloud Storage: ~50KB per provider (lazy-loaded)
- Paste Support: ~2KB
- Watermark: ~5KB

### **Comparison**

| Configuration | Current | With Plugins |
|---------------|---------|--------------|
| **Minimal** | 150KB | 18KB (-88%) |
| **With Editing** | 150KB | 63KB (-58%) |
| **Full Features** | 150KB + OCR (2MB) | 18KB + selected plugins |

**Result:** Massive bundle savings! 🎉

---

## 🎯 **Benefits**

### **For Developers**
- ✅ Pay-for-what-you-use (smaller bundles)
- ✅ Easy to add/remove features
- ✅ Type-safe configuration
- ✅ Clear separation of concerns
- ✅ Third-party plugins possible

### **For Users**
- ✅ Faster page loads
- ✅ Only load needed features
- ✅ Consistent API across plugins

### **For Maintenance**
- ✅ Easier to test (isolated plugins)
- ✅ Easier to debug
- ✅ Easier to extend
- ✅ Community contributions

---

## 🚀 **Implementation Roadmap**

### **Week 1: Core Plugin System**
- [ ] Create plugin interfaces
- [ ] Implement PluginManager
- [ ] Add plugin support to FileUpload
- [ ] Write tests

### **Week 2: Example Plugins**
- [ ] Paste support plugin
- [ ] Image rotation plugin
- [ ] EXIF stripper plugin
- [ ] Document each plugin

### **Week 3: Advanced Plugins**
- [ ] Image editor plugin
- [ ] Resumable upload plugin
- [ ] Cloud storage plugin

### **Week 4: Migration & Documentation**
- [ ] Migration guide
- [ ] Plugin development guide
- [ ] API documentation
- [ ] Example repo

---

## 📝 **Next Steps**

1. **Approve architecture** - Review this design
2. **Implement core** - Build PluginManager
3. **Create example plugin** - Prove the concept
4. **Migrate features** - Convert existing to plugins
5. **Document** - Write comprehensive guide

---

## 💎 **Conclusion**

This plugin architecture provides:

- ✅ **Extensibility** - Easy to add features
- ✅ **Performance** - Pay-for-what-you-use
- ✅ **Maintainability** - Clear separation
- ✅ **Community** - Third-party plugins
- ✅ **Type Safety** - Full TypeScript support

**This transforms FileUpload from a component into a platform!** 🚀

---

**Ready to implement?** Let's start with the core plugin system!
