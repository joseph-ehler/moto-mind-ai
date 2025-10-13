/**
 * File Validator Plugin
 * 
 * Validates files before they're added to the upload queue.
 * Provides comprehensive validation rules with clear error messages.
 * 
 * @example
 * ```tsx
 * import { fileValidator } from '@/components/design-system/file-upload/plugins'
 * 
 * <FileUpload
 *   plugins={[
 *     fileValidator({
 *       maxSize: 10 * 1024 * 1024, // 10MB
 *       allowedTypes: ['image/*', 'application/pdf'],
 *       customValidation: (file) => {
 *         if (file.name.includes('test')) {
 *           return { valid: false, error: 'Test files not allowed' }
 *         }
 *         return { valid: true }
 *       }
 *     })
 *   ]}
 * />
 * ```
 */

import type { PluginFactory } from './types'
import { formatFileSize, matchesAccept } from './utils'

// ============================================================================
// Types
// ============================================================================

export interface FileValidatorOptions {
  /** Maximum file size in bytes */
  maxSize?: number
  
  /** Minimum file size in bytes */
  minSize?: number
  
  /** Allowed file types (e.g., ['image/*', 'application/pdf']) */
  allowedTypes?: string[]
  
  /** Blocked file types (takes precedence over allowedTypes) */
  blockedTypes?: string[]
  
  /** Maximum filename length */
  maxFilenameLength?: number
  
  /** Allowed filename patterns (regex strings) */
  allowedFilenames?: RegExp[]
  
  /** Blocked filename patterns (regex strings) */
  blockedFilenames?: RegExp[]
  
  /** Custom validation function */
  customValidation?: (file: File) => ValidationResult | Promise<ValidationResult>
  
  /** Show notifications for validation failures */
  showNotifications?: boolean
  
  /** Custom error messages */
  errorMessages?: {
    maxSize?: string
    minSize?: string
    allowedTypes?: string
    blockedTypes?: string
    maxFilenameLength?: string
    allowedFilenames?: string
    blockedFilenames?: string
    custom?: string
  }
}

export interface ValidationResult {
  valid: boolean
  error?: string
  reason?: string
}

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Partial<FileValidatorOptions> = {
  showNotifications: true,
  errorMessages: {
    maxSize: 'File size exceeds maximum allowed',
    minSize: 'File size is below minimum required',
    allowedTypes: 'File type not allowed',
    blockedTypes: 'File type is blocked',
    maxFilenameLength: 'Filename is too long',
    allowedFilenames: 'Filename does not match allowed pattern',
    blockedFilenames: 'Filename matches blocked pattern',
    custom: 'File validation failed'
  }
}

// ============================================================================
// Plugin Factory
// ============================================================================

export const fileValidator: PluginFactory<FileValidatorOptions> = (options = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const errorMessages = { ...DEFAULT_OPTIONS.errorMessages, ...options.errorMessages }
  
  return {
    id: '@motomind/file-validator',
    version: '1.0.0',
    type: 'processor',
    name: 'File Validator',
    options: config,
    
    hooks: {
      /**
       * Validate files before they're added
       * Return null to reject the file
       */
      'before-file-added': async (file) => {
        console.log(`📋 Validating file: ${file.name}`)
        
        // 1. Validate file size (max)
        if (config.maxSize && file.size > config.maxSize) {
          const error = errorMessages.maxSize || 'File too large'
          const message = `${error}: ${file.name} (${formatFileSize(file.size)} > ${formatFileSize(config.maxSize)})`
          
          console.warn(`❌ Validation failed (max size):`, message)
          
          if (config.showNotifications) {
            showNotification(message, 'error')
          }
          
          return null // Reject file
        }
        
        // 2. Validate file size (min)
        if (config.minSize && file.size < config.minSize) {
          const error = errorMessages.minSize || 'File too small'
          const message = `${error}: ${file.name} (${formatFileSize(file.size)} < ${formatFileSize(config.minSize)})`
          
          console.warn(`❌ Validation failed (min size):`, message)
          
          if (config.showNotifications) {
            showNotification(message, 'error')
          }
          
          return null
        }
        
        // 3. Validate blocked types (takes precedence)
        if (config.blockedTypes && matchesAccept(file, config.blockedTypes.join(','))) {
          const error = errorMessages.blockedTypes || 'File type blocked'
          const message = `${error}: ${file.name} (${file.type})`
          
          console.warn(`❌ Validation failed (blocked type):`, message)
          
          if (config.showNotifications) {
            showNotification(message, 'error')
          }
          
          return null
        }
        
        // 4. Validate allowed types
        if (config.allowedTypes && !matchesAccept(file, config.allowedTypes.join(','))) {
          const error = errorMessages.allowedTypes || 'File type not allowed'
          const message = `${error}: ${file.name} (${file.type}). Allowed: ${config.allowedTypes.join(', ')}`
          
          console.warn(`❌ Validation failed (allowed types):`, message)
          
          if (config.showNotifications) {
            showNotification(message, 'error')
          }
          
          return null
        }
        
        // 5. Validate filename length
        if (config.maxFilenameLength && file.name.length > config.maxFilenameLength) {
          const error = errorMessages.maxFilenameLength || 'Filename too long'
          const message = `${error}: ${file.name.substring(0, 50)}... (${file.name.length} > ${config.maxFilenameLength})`
          
          console.warn(`❌ Validation failed (filename length):`, message)
          
          if (config.showNotifications) {
            showNotification(message, 'error')
          }
          
          return null
        }
        
        // 6. Validate blocked filename patterns
        if (config.blockedFilenames) {
          for (const pattern of config.blockedFilenames) {
            if (pattern.test(file.name)) {
              const error = errorMessages.blockedFilenames || 'Filename not allowed'
              const message = `${error}: ${file.name} (matches pattern: ${pattern})`
              
              console.warn(`❌ Validation failed (blocked filename):`, message)
              
              if (config.showNotifications) {
                showNotification(message, 'error')
              }
              
              return null
            }
          }
        }
        
        // 7. Validate allowed filename patterns
        if (config.allowedFilenames) {
          const matchesAny = config.allowedFilenames.some(pattern => pattern.test(file.name))
          
          if (!matchesAny) {
            const error = errorMessages.allowedFilenames || 'Filename pattern not allowed'
            const message = `${error}: ${file.name}`
            
            console.warn(`❌ Validation failed (allowed filename):`, message)
            
            if (config.showNotifications) {
              showNotification(message, 'error')
            }
            
            return null
          }
        }
        
        // 8. Custom validation
        if (config.customValidation) {
          try {
            const result = await config.customValidation(file)
            
            if (!result.valid) {
              const error = result.error || errorMessages.custom || 'Validation failed'
              const message = `${error}: ${file.name}${result.reason ? ` (${result.reason})` : ''}`
              
              console.warn(`❌ Validation failed (custom):`, message)
              
              if (config.showNotifications) {
                showNotification(message, 'error')
              }
              
              return null
            }
          } catch (err) {
            console.error(`❌ Custom validation error:`, err)
            
            if (config.showNotifications) {
              showNotification(`Validation error: ${file.name}`, 'error')
            }
            
            return null
          }
        }
        
        // All validations passed
        console.log(`✅ Validation passed: ${file.name}`)
        return file
      }
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Show a notification (browser notification or console)
 */
function showNotification(message: string, type: 'info' | 'error' | 'success' = 'info') {
  // For now, just use console
  // In a real app, you'd use a toast/notification system
  
  if (type === 'error') {
    console.error(`🚫 ${message}`)
  } else if (type === 'success') {
    console.log(`✅ ${message}`)
  } else {
    console.info(`ℹ️ ${message}`)
  }
  
  // Could also emit an event for the parent app to handle
  // context.emit('validation-notification', { message, type })
}

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Preset: Images only (max 10MB)
 */
export const imageValidator = (options: Partial<FileValidatorOptions> = {}) =>
  fileValidator({
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/*'],
    ...options
  })

/**
 * Preset: Documents only (PDF, Word, Excel)
 */
export const documentValidator = (options: Partial<FileValidatorOptions> = {}) =>
  fileValidator({
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    ...options
  })

/**
 * Preset: Strict validation (no test files, max 5MB)
 */
export const strictValidator = (options: Partial<FileValidatorOptions> = {}) =>
  fileValidator({
    maxSize: 5 * 1024 * 1024, // 5MB
    minSize: 1024, // 1KB (no empty files)
    blockedFilenames: [
      /test/i,
      /sample/i,
      /demo/i,
      /tmp/i,
      /temp/i
    ],
    ...options
  })
