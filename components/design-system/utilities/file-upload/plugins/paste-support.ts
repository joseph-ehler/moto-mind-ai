/**
 * Paste Support Plugin
 * 
 * Adds ability to paste images from clipboard
 */

import type { FileUploadPlugin, PluginFactory } from './types'

// ============================================================================
// Plugin Options
// ============================================================================

export interface PasteSupportOptions {
  /** Allow pasting text URLs */
  allowURLs?: boolean
  
  /** Automatically fetch and add files from pasted URLs */
  autoFetchURLs?: boolean
  
  /** Allowed file types to paste (same format as accept prop) */
  accept?: string
  
  /** Show toast notification on paste */
  showNotification?: boolean
}

// ============================================================================
// Plugin Implementation
// ============================================================================

export const pasteSupport: PluginFactory<PasteSupportOptions> = (
  options = {}
) => {
  let cleanup: (() => void) | undefined
  
  const plugin: FileUploadPlugin<PasteSupportOptions> = {
    id: '@motomind/paste-support',
    version: '1.0.0',
    type: 'source',
    name: 'Paste Support',
    options,
    
    init(context) {
      const handlePaste = async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items
        if (!items) return
        
        const files: File[] = []
        
        // Process clipboard items
        for (const item of Array.from(items)) {
          // Handle image/file items
          if (item.kind === 'file') {
            const file = item.getAsFile()
            if (file && isAcceptedType(file.type, options.accept)) {
              files.push(file)
            }
          }
          
          // Handle text/URL items
          if (options.allowURLs && item.type === 'text/plain') {
            item.getAsString(async (text) => {
              const trimmed = text.trim()
              
              if (isURL(trimmed)) {
                if (options.autoFetchURLs) {
                  try {
                    const file = await fetchFileFromURL(trimmed)
                    if (file) {
                      context.addFiles([file])
                      context.emit('paste-url', { url: trimmed, file })
                    }
                  } catch (error) {
                    console.error('Failed to fetch URL:', error)
                    context.emit('paste-url-error', { url: trimmed, error })
                  }
                } else {
                  context.emit('paste-url', { url: trimmed })
                }
              }
            })
          }
        }
        
        // Add pasted files
        if (files.length > 0) {
          context.addFiles(files)
          context.emit('paste-files', { files, count: files.length })
          
          if (options.showNotification) {
            // Could integrate with toast system here
            console.log(`Pasted ${files.length} file(s)`)
          }
        }
      }
      
      // Attach paste listener
      document.addEventListener('paste', handlePaste)
      cleanup = () => document.removeEventListener('paste', handlePaste)
    },
    
    destroy() {
      cleanup?.()
    }
  }
  
  return plugin
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if text is a valid URL
 */
function isURL(text: string): boolean {
  try {
    const url = new URL(text)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Check if file type is accepted
 */
function isAcceptedType(fileType: string, accept?: string): boolean {
  if (!accept) return true
  
  const acceptTypes = accept.split(',').map(t => t.trim())
  
  return acceptTypes.some(acceptType => {
    // Wildcard (e.g., 'image/*')
    if (acceptType.includes('*')) {
      const [category] = acceptType.split('/')
      return fileType.startsWith(category + '/')
    }
    
    // Exact match
    return fileType === acceptType
  })
}

/**
 * Fetch file from URL
 */
async function fetchFileFromURL(url: string): Promise<File | null> {
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    const filename = getFilenameFromURL(url) || 'download'
    
    return new File([blob], filename, { 
      type: blob.type || 'application/octet-stream' 
    })
  } catch (error) {
    console.error('Failed to fetch file from URL:', error)
    return null
  }
}

/**
 * Extract filename from URL
 */
function getFilenameFromURL(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split('/').pop()
    return filename || null
  } catch {
    return null
  }
}

// ============================================================================
// Exports
// ============================================================================

export default pasteSupport
