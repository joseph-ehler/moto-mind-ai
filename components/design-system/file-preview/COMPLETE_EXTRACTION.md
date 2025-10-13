# FilePreview Complete Extraction Script

## ⚡ QUICK COMPLETION GUIDE

Since we're running into token limits, here's the exact extraction needed:

### 1. Run This Command:

```bash
cd /Users/josephehler/Desktop/Desktop/apps/motomind-ai/components/design-system
```

### 2. File-by-File Extraction:

**The current FilePreview.tsx has these sections:**
- Lines 363-546: PDFViewer
- Lines 552-668: ImageViewer  
- Lines 670-690: DocumentViewer
- Lines 1197-1350: AnnotationModal (in two places)
- Lines 700-1195: Main FilePreview logic

### 3. Already Created ✅:
- `FilePreview/types.ts`
- `FilePreview/utils.ts`
- `FilePreview/components/AIStatusBadge.tsx`
- `FilePreview/components/AIInsightsPanel.tsx`
- `FilePreview/components/ProcessingOverlay.tsx`

### 4. Quick Win Approach:

**Option A: Minimal Change (5 minutes)**
1. Keep FilePreview.tsx as-is (rename to FilePreview/FilePreview.tsx)
2. Import the AI components we extracted
3. Update imports in FilePreview.tsx:
```tsx
import { AIStatusBadge } from './components/AIStatusBadge'
import { AIInsightsPanel } from './components/AIInsightsPanel'
import { ProcessingOverlay } from './components/ProcessingOverlay'
import { PreviewFile, Annotation, FileType, AIVisionData } from './types'
import { detectFileType } from './utils'
```
4. Delete the inline AI component code
5. Create FilePreview/index.tsx with exports
6. Done!

**Option B: Full Extraction (Manual, 30 minutes)**
Follow the REFACTOR_GUIDE.md step by step

### 5. Immediate Next Steps:

```bash
# 1. Move the whole file
mv FilePreview.tsx FilePreview/FilePreview.tsx

# 2. Edit FilePreview/FilePreview.tsx
# - Remove lines 38-218 (AI components we extracted)
# - Add imports from './components/*'
# - Add imports from './types' and './utils'

# 3. Create FilePreview/index.tsx
```

```tsx
// FilePreview/index.tsx
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

### 6. Update design-system/index.tsx:

The import path stays the same! It automatically looks for index.tsx:
```tsx
// This line doesn't change:
export { FilePreview, detectFileType } from './FilePreview'
// It now imports from ./FilePreview/index.tsx automatically
```

##  **RECOMMENDED: Use Option A**

1. I'll create the minimal changes needed
2. You test it works
3. Later extract viewers if needed

Let me do Option A now...
