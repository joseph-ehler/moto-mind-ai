/**
 * FileUpload Plugins
 * 
 * Extensible plugin system for FileUpload component
 * 
 * @example
 * ```tsx
 * import { FileUpload, pasteSupport } from '@/components/design-system'
 * 
 * <FileUpload
 *   plugins={[
 *     pasteSupport({ allowURLs: true })
 *   ]}
 * />
 * ```
 */

// Core types and manager
export type {
  FileUploadPlugin,
  PluginContext,
  PluginHooks,
  FileState,
  FileStatus,
  PluginEvents,
  PluginFactory,
  PluginRegistration,
  PluginMetadata
} from './types'

export { PluginManager, createPluginContext } from './plugin-manager'

// Built-in plugins
export { pasteSupport } from './paste-support'
export type { PasteSupportOptions } from './paste-support'

export { 
  fileValidator, 
  imageValidator, 
  documentValidator, 
  strictValidator 
} from './file-validator'
export type { 
  FileValidatorOptions, 
  ValidationResult 
} from './file-validator'

// Plugin utilities
export * from './utils'
