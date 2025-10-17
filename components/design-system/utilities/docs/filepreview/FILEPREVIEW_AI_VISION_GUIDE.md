# FilePreview AI Vision Integration Guide

## 🤖 Overview

The FilePreview component now supports AI Vision enrichment, displaying processing status, extracted insights, and AI-generated metadata for documents and images.

---

## 📊 AI Vision Data Structure

### **AIVisionData Interface**
```tsx
export interface AIVisionData {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'none'
  extractedText?: string          // OCR results
  detectedObjects?: string[]       // Identified items
  description?: string             // AI-generated description
  damageDetected?: string[]        // Issues found
  parts?: string[]                 // Vehicle parts identified
  confidence?: number              // 0-1 confidence score
  processedAt?: Date              // When processing completed
  error?: string                   // Error message if failed
}
```

### **PreviewFile with AI Vision**
```tsx
const file: PreviewFile = {
  id: '1',
  name: 'Engine Damage Photo.jpg',
  type: 'image',
  url: '/photos/engine.jpg',
  aiVision: {
    status: 'completed',
    description: 'Engine compartment showing front view with visible damage to radiator',
    detectedObjects: ['engine', 'radiator', 'hoses', 'battery'],
    damageDetected: ['radiator crack', 'coolant leak'],
    parts: ['radiator', 'coolant reservoir', 'engine block'],
    confidence: 0.94,
    processedAt: new Date()
  }
}
```

---

## 🎨 UI Components to Add

### **1. AI Status Badge in Header**

Add to the header next to file info:

```tsx
// In FilePreview header section
{currentFile.aiVision && (
  <AIStatusBadge status={currentFile.aiVision.status} />
)}
```

**Status Badge Component:**
```tsx
function AIStatusBadge({ status }: { status: AIProcessingStatus }) {
  const badges = {
    pending: {
      icon: '⏳',
      text: 'AI Pending',
      className: 'bg-gray-100 text-gray-700 border-gray-300'
    },
    processing: {
      icon: '🔄',
      text: 'AI Processing',
      className: 'bg-blue-100 text-blue-700 border-blue-300 animate-pulse'
    },
    completed: {
      icon: '✨',
      text: 'AI Enhanced',
      className: 'bg-green-100 text-green-700 border-green-300'
    },
    failed: {
      icon: '⚠️',
      text: 'AI Failed',
      className: 'bg-red-100 text-red-700 border-red-300'
    },
    none: {
      icon: '',
      text: '',
      className: 'hidden'
    }
  }

  const badge = badges[status]

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      badge.className
    )}>
      <span>{badge.icon}</span>
      <span>{badge.text}</span>
    </div>
  )
}
```

---

### **2. AI Insights Panel/Sidebar**

Toggle-able side panel showing AI-extracted data:

```tsx
{currentFile.aiVision?.status === 'completed' && showAIInsights && (
  <AIInsightsPanel 
    data={currentFile.aiVision} 
    file={currentFile}
    onClose={() => setShowAIInsights(false)}
  />
)}
```

**AI Insights Panel Component:**
```tsx
function AIInsightsPanel({ 
  data, 
  file, 
  onClose 
}: { 
  data: AIVisionData
  file: PreviewFile
  onClose: () => void 
}) {
  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l shadow-xl overflow-y-auto z-20">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-blue-50 border-b p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <h3 className="font-semibold text-lg">AI Insights</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {data.confidence && `${Math.round(data.confidence * 100)}% confidence`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Description */}
        {data.description && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <span>💬</span>
              <span>AI Description</span>
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">
              {data.description}
            </p>
          </div>
        )}

        {/* Detected Objects */}
        {data.detectedObjects && data.detectedObjects.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <span>🔍</span>
              <span>Detected Objects</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.detectedObjects.map((obj, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                >
                  {obj}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Vehicle Parts */}
        {data.parts && data.parts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <span>🔧</span>
              <span>Identified Parts</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.parts.map((part, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200"
                >
                  {part}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Damage Detected */}
        {data.damageDetected && data.damageDetected.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
              <span>⚠️</span>
              <span>Damage Detected</span>
            </h4>
            <ul className="space-y-2">
              {data.damageDetected.map((damage, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200"
                >
                  <span className="mt-0.5">•</span>
                  <span>{damage}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Extracted Text (OCR) */}
        {data.extractedText && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <span>📝</span>
              <span>Extracted Text</span>
            </h4>
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg font-mono max-h-40 overflow-y-auto">
              {data.extractedText}
            </div>
          </div>
        )}

        {/* Processing Info */}
        {data.processedAt && (
          <div className="text-xs text-slate-400 pt-2 border-t">
            Processed {new Date(data.processedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

### **3. AI Insights Toggle Button**

Add to toolbar:

```tsx
{currentFile.aiVision?.status === 'completed' && (
  <Button
    size="sm"
    variant={showAIInsights ? 'default' : 'ghost'}
    onClick={() => setShowAIInsights(!showAIInsights)}
    title="AI Insights"
  >
    <Sparkles className="h-4 w-4" />
  </Button>
)}
```

---

### **4. Processing Overlay**

Show while AI is processing:

```tsx
{currentFile.aiVision?.status === 'processing' && (
  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30 pointer-events-none">
    <div className="bg-white rounded-lg p-6 shadow-xl text-center max-w-sm">
      <div className="relative mb-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <Sparkles className="h-6 w-6 text-yellow-400 absolute top-0 right-1/3 animate-pulse" />
      </div>
      <h3 className="font-semibold text-lg mb-2">🤖 AI Processing</h3>
      <p className="text-sm text-slate-600">
        Analyzing image and extracting insights...
      </p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" />
        <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
      </div>
    </div>
  </div>
)}
```

---

### **5. Thumbnail Badge**

Show status on thumbnails in multi-file view:

```tsx
<button className="relative ...">
  <img src={file.url} alt={file.name} />
  
  {/* AI Status Badge */}
  {file.aiVision && file.aiVision.status !== 'none' && (
    <div className="absolute top-1 right-1">
      {file.aiVision.status === 'completed' && (
        <div className="bg-green-500 text-white rounded-full p-1">
          <Sparkles className="h-3 w-3" />
        </div>
      )}
      {file.aiVision.status === 'processing' && (
        <div className="bg-blue-500 text-white rounded-full p-1 animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" />
        </div>
      )}
      {file.aiVision.status === 'failed' && (
        <div className="bg-red-500 text-white rounded-full p-1">
          <AlertCircle className="h-3 w-3" />
        </div>
      )}
    </div>
  )}
</button>
```

---

## 🎯 Complete Example Usage

```tsx
'use client'

import { useState } from 'react'
import { FilePreview, PreviewFile, AIVisionData } from '@/components/design-system'

export default function EnrichedFilePreview() {
  const [files, setFiles] = useState<PreviewFile[]>([
    {
      id: '1',
      name: 'Engine Damage.jpg',
      type: 'image',
      url: '/photos/engine.jpg',
      aiVision: {
        status: 'completed',
        description: 'Engine compartment with visible radiator damage',
        detectedObjects: ['engine', 'radiator', 'hoses', 'battery'],
        damageDetected: ['radiator crack', 'coolant leak'],
        parts: ['radiator', 'coolant reservoir', 'engine block'],
        confidence: 0.94,
        processedAt: new Date()
      }
    },
    {
      id: '2',
      name: 'Service Receipt.pdf',
      type: 'pdf',
      url: '/docs/receipt.pdf',
      aiVision: {
        status: 'completed',
        extractedText: 'Oil Change Service\nDate: 2024-01-15\nAmount: $45.99...',
        description: 'Service receipt for oil change',
        confidence: 0.98,
        processedAt: new Date()
      }
    },
    {
      id: '3',
      name: 'Dashboard.jpg',
      type: 'image',
      url: '/photos/dashboard.jpg',
      aiVision: {
        status: 'processing'
      }
    }
  ])

  return (
    <FilePreview
      files={files}
      modal
      onClose={() => {}}
      // AI insights will automatically display
    />
  )
}
```

---

## 🔄 Processing Workflow

### **1. Upload & Queue**
```tsx
const handleFileUpload = async (file: File) => {
  // Create preview file
  const previewFile: PreviewFile = {
    id: generateId(),
    name: file.name,
    type: detectFileType(file.type, file.name),
    url: URL.createObjectURL(file),
    aiVision: {
      status: 'pending'  // ✅ Queued for processing
    }
  }
  
  setFiles([...files, previewFile])
  
  // Start AI processing
  processWithAI(previewFile.id, file)
}
```

### **2. Processing**
```tsx
const processWithAI = async (fileId: string, file: File) => {
  // Update status to processing
  updateFileStatus(fileId, 'processing')
  
  try {
    // Call your AI Vision API
    const response = await fetch('/api/ai/vision', {
      method: 'POST',
      body: formData
    })
    
    const aiData: AIVisionData = await response.json()
    
    // Update with results
    updateFileAIData(fileId, {
      ...aiData,
      status: 'completed',
      processedAt: new Date()
    })
  } catch (error) {
    // Handle failure
    updateFileAIData(fileId, {
      status: 'failed',
      error: error.message
    })
  }
}
```

---

## 💡 Best Practices

### **User Experience**
1. **Show processing immediately** - Users see AI is working
2. **Non-blocking** - Don't prevent file viewing during processing
3. **Clear indicators** - Use badges, animations, overlays
4. **Progressive disclosure** - AI insights in collapsible panel
5. **Error handling** - Show friendly messages if AI fails

### **Data Display**
1. **Confidence scores** - Show how certain AI is
2. **Timestamps** - When was data extracted
3. **Categorize info** - Separate damage, parts, OCR, etc.
4. **Visual hierarchy** - Most important info first
5. **Scannable** - Use badges, chips, lists

### **Performance**
1. **Lazy load** - Only show AI panel when opened
2. **Cache results** - Don't reprocess same file
3. **Queue management** - Process one at a time
4. **Background processing** - Don't block UI

---

## 🎨 Color Coding

```tsx
const statusColors = {
  pending: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    icon: '⏳'
  },
  processing: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    icon: '🔄',
    animate: 'animate-pulse'
  },
  completed: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    icon: '✨'
  },
  failed: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    icon: '⚠️'
  }
}
```

---

## 🚀 Implementation Steps

1. **Add AI Vision data to files** ✅
2. **Show status badges** - In header and thumbnails
3. **Add AI insights panel** - Toggle-able sidebar
4. **Processing overlay** - During AI processing
5. **Error states** - Handle failures gracefully
6. **Test with real data** - Integrate with AI API

---

## 📊 Analytics to Track

```tsx
// Track AI processing
analytics.track('ai_vision_started', {
  fileId: file.id,
  fileType: file.type,
  fileName: file.name
})

analytics.track('ai_vision_completed', {
  fileId: file.id,
  confidence: aiData.confidence,
  objectsDetected: aiData.detectedObjects?.length,
  processingTime: duration
})

// Track user engagement
analytics.track('ai_insights_viewed', {
  fileId: file.id,
  hasDescription: !!aiData.description,
  hasDamage: !!aiData.damageDetected?.length
})
```

---

**Your FilePreview is now AI Vision ready!** 🤖✨🚀
