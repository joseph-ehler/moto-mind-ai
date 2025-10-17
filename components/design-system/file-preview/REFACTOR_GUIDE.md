# FilePreview Refactoring Guide

## ✅ Completed Files

1. **types.ts** - All TypeScript types extracted
2. **utils.ts** - File type detection utility
3. **components/AIStatusBadge.tsx** - AI status badge component
4. **components/AIInsightsPanel.tsx** - AI insights panel component
5. **components/ProcessingOverlay.tsx** - Processing overlay component

## 🔄 Remaining Work

### Components to Extract from FilePreview.tsx:

1. **components/PDFViewer.tsx** (~180 lines)
   - Extract lines 269-449 (PDFViewer component)
   - Import types from '../types'
   
2. **components/ImageViewer.tsx** (~120 lines)
   - Extract lines 451-571 (ImageViewer component)
   - Import types from '../types'
   
3. **components/DocumentViewer.tsx** (~80 lines)
   - Extract lines 573-653 (DocumentViewer component)
   - Import types from '../types'

4. **components/AnnotationModal.tsx** (~150 lines)
   - Extract the annotation modal JSX (around lines 1197-1350)
   - Create props interface
   - Import Button, Textarea, Label, etc.

### Main Orchestrator:

5. **FilePreview.tsx** (~300 lines)
   - Main component that orchestrates everything
   - Import all sub-components
   - Contains header, toolbar, main content area
   - State management and handlers

### Custom Hooks (Optional but Recommended):

6. **hooks/useFilePreview.ts**
   - Extract all state (10+ useState calls)
   - Extract handlers (handleDownload, handlePrint, etc.)
   - Return object with state and handlers

7. **hooks/useAnnotations.ts**
   - Extract annotation-specific logic
   - handleAnnotationAdd, handleAnnotationDelete, etc.

### Public API:

8. **index.tsx**
   ```tsx
   export { FilePreview } from './FilePreview'
   export { detectFileType } from './utils'
   export type {
     FilePreviewProps,
     PreviewFile,
     Annotation,
     FileType,
     AIVisionData,
     AIProcessingStatus
   } from './types'
   ```

## 📁 Final Structure

```
FilePreview/
├── index.tsx                    # Public exports
├── FilePreview.tsx              # Main component (~300 lines)
├── types.ts                     # All types ✅
├── utils.ts                     # Utilities ✅
├── components/
│   ├── AIStatusBadge.tsx        # ✅
│   ├── AIInsightsPanel.tsx      # ✅
│   ├── ProcessingOverlay.tsx    # ✅
│   ├── PDFViewer.tsx            # TODO
│   ├── ImageViewer.tsx          # TODO
│   ├── DocumentViewer.tsx       # TODO
│   └── AnnotationModal.tsx      # TODO
├── hooks/                       # Optional
│   ├── useFilePreview.ts
│   └── useAnnotations.ts
└── README.md                    # Documentation
```

## 🎯 Quick Action Plan

### Option A: Finish Refactor (Recommended)
1. Extract remaining viewer components (PDF, Image, Document)
2. Extract AnnotationModal
3. Create new FilePreview.tsx orchestrator
4. Create index.tsx with exports
5. Update design-system/index.tsx imports
6. Test showcase page

### Option B: Use What We Have
1. Keep current FilePreview.tsx as-is
2. Use the extracted components (AI Badge, Panel, Overlay)
3. Import them in the main file
4. Reduce main file from 1376 to ~1200 lines

### Option C: Gradual Migration
1. Start using new structure for new features
2. Slowly move existing code over time
3. Both approaches coexist temporarily

## 📝 Import Updates Needed

### In design-system/index.tsx:
```tsx
// OLD:
export { FilePreview, detectFileType } from './FilePreview'

// NEW:
export { FilePreview, detectFileType } from './FilePreview'
// (imports from FilePreview/index.tsx automatically)
```

### Usage stays the same:
```tsx
import { FilePreview, PreviewFile } from '@/components/design-system'
// Still works!
```

## ⚡ Benefits Achieved So Far

- ✅ **Types separated** - Easy to find and reuse
- ✅ **Utilities extracted** - detectFileType is standalone
- ✅ **AI Components isolated** - Can test independently
- ✅ **Better organization** - Clear file structure

## 🚀 Next Steps

**I recommend:** Continue with Option A and finish the full refactor now.

**Time estimate:** 15-20 minutes to complete all remaining files.

**Would you like me to:**
1. **Continue and finish** - Extract all remaining components
2. **Stop here** - Use what we have, finish later
3. **Create one more** - Just extract one viewer component as example
