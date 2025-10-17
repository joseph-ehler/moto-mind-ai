import { FileType } from './types'

// ============================================================================
// UTILITY: File Type Detection
// ============================================================================

export function detectFileType(mimeType?: string, fileName?: string): FileType {
  if (!mimeType && !fileName) return 'unknown'
  
  const mime = mimeType?.toLowerCase() || ''
  const ext = fileName?.toLowerCase().split('.').pop() || ''
  
  // PDF
  if (mime.includes('pdf') || ext === 'pdf') {
    return 'pdf'
  }
  
  // Images
  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
  ) {
    return 'image'
  }
  
  // Documents
  if (
    mime.includes('document') ||
    mime.includes('word') ||
    mime.includes('text') ||
    ['doc', 'docx', 'txt', 'rtf'].includes(ext)
  ) {
    return 'document'
  }
  
  return 'unknown'
}
