/**
 * FileUpload Plugin System - Core Types
 * 
 * Defines interfaces for the extensible plugin architecture
 */

import type { ReactNode } from 'react'

// ============================================================================
// Plugin Core
// ============================================================================

export interface FileUploadPlugin<TOptions = any> {
  /** Unique plugin identifier (e.g., '@motomind/image-editor') */
  id: string
  
  /** Plugin version */
  version: string
  
  /** Plugin type */
  type: 'processor' | 'source' | 'uploader' | 'ui'
  
  /** Plugin display name */
  name?: string
  
  /** Plugin options */
  options?: TOptions
  
  /** Initialize plugin - called when registered */
  init?(context: PluginContext): void | Promise<void>
  
  /** Cleanup plugin - called when unregistered */
  destroy?(): void | Promise<void>
  
  /** Lifecycle hooks */
  hooks?: PluginHooks
}

// ============================================================================
// Plugin Context
// ============================================================================

export interface PluginContext {
  /** Add files to the upload queue */
  addFiles: (files: File[]) => void
  
  /** Remove a file by ID */
  removeFile: (fileId: string) => void
  
  /** Update a file's state */
  updateFile: (fileId: string, updates: Partial<FileState>) => void
  
  /** Get all current files */
  getFiles: () => FileState[]
  
  /** Get a specific file by ID */
  getFile: (fileId: string) => FileState | undefined
  
  /** Emit a custom event */
  emit: (event: string, data: any) => void
  
  /** Listen to an event */
  on: (event: string, handler: (data: any) => void) => () => void
  
  /** Get plugin options */
  getOptions: <T = any>() => T
  
  /** Component props (read-only) */
  props: Readonly<Record<string, any>>
}

// ============================================================================
// Plugin Hooks
// ============================================================================

export interface PluginHooks {
  /** 
   * Before file is added to queue
   * Return transformed file, null to reject, or undefined to keep original
   */
  'before-file-added'?: (file: File) => File | Promise<File | null> | null | undefined
  
  /** After file is added to queue */
  'after-file-added'?: (file: FileState) => void | Promise<void>
  
  /** Before file is removed */
  'before-file-removed'?: (file: FileState) => boolean | Promise<boolean>
  
  /** After file is removed */
  'after-file-removed'?: (fileId: string) => void | Promise<void>
  
  /** 
   * Before upload starts
   * Return false to prevent upload
   */
  'before-upload'?: (file: FileState) => boolean | Promise<boolean>
  
  /** During upload progress */
  'upload-progress'?: (file: FileState, progress: number) => void
  
  /** Upload completed successfully */
  'upload-complete'?: (file: FileState, response: any) => void | Promise<void>
  
  /** Upload failed with error */
  'upload-error'?: (file: FileState, error: Error) => void | Promise<void>
  
  /** 
   * Render custom UI for file item
   * Rendered alongside default preview
   */
  'render-file-ui'?: (file: FileState) => ReactNode
  
  /** 
   * Render custom actions/buttons in toolbar
   */
  'render-toolbar'?: () => ReactNode
  
  /**
   * Render custom UI in upload area (e.g., cloud storage buttons)
   */
  'render-upload-area'?: () => ReactNode
}

// ============================================================================
// File State
// ============================================================================

export interface FileState {
  /** Unique file identifier */
  id: string
  
  /** Original File object */
  file: File
  
  /** Preview URL (for images) */
  preview?: string
  
  /** Upload progress (0-100) */
  progress: number
  
  /** Current status */
  status: FileStatus
  
  /** Error message if status is 'error' */
  error?: string
  
  /** Custom metadata (plugin-specific data) */
  metadata?: Record<string, any>
  
  /** Upload response data */
  response?: any
  
  /** Timestamp when file was added */
  addedAt: number
  
  /** Timestamp when upload started */
  uploadStartedAt?: number
  
  /** Timestamp when upload completed */
  uploadCompletedAt?: number
}

export type FileStatus = 
  | 'pending'      // Added, not yet uploading
  | 'processing'   // Being processed by plugin
  | 'uploading'    // Currently uploading
  | 'success'      // Upload completed
  | 'error'        // Upload failed
  | 'cancelled'    // Upload cancelled

// ============================================================================
// Plugin Events
// ============================================================================

export interface PluginEvents {
  /** File added */
  'file-added': { file: FileState }
  
  /** File removed */
  'file-removed': { fileId: string }
  
  /** File updated */
  'file-updated': { fileId: string; updates: Partial<FileState> }
  
  /** Upload progress */
  'progress': { fileId: string; progress: number }
  
  /** Upload started */
  'upload-start': { fileId: string }
  
  /** Upload completed */
  'upload-complete': { fileId: string; response: any }
  
  /** Upload failed */
  'upload-error': { fileId: string; error: Error }
  
  /** All uploads completed */
  'all-complete': { files: FileState[] }
  
  /** Plugin registered */
  'plugin-registered': { pluginId: string }
  
  /** Plugin unregistered */
  'plugin-unregistered': { pluginId: string }
  
  /** Custom plugin events */
  [key: string]: any
}

// ============================================================================
// Plugin Helper Types
// ============================================================================

/**
 * Helper type for creating typed plugins
 */
export type PluginFactory<TOptions = any> = (
  options?: TOptions
) => FileUploadPlugin<TOptions>

/**
 * Plugin registration result
 */
export interface PluginRegistration {
  /** Plugin ID */
  id: string
  
  /** Unregister function */
  unregister: () => Promise<void>
}

/**
 * Plugin metadata for introspection
 */
export interface PluginMetadata {
  id: string
  version: string
  type: 'processor' | 'source' | 'uploader' | 'ui'
  name?: string
  description?: string
  author?: string
  homepage?: string
}
