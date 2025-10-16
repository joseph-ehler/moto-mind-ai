/**
 * Storage Path Utilities
 * 
 * Centralized storage path generation for Supabase Storage
 * Ensures consistent, organized file structure
 */

export interface StoragePathOptions {
  vehicleId: string
  eventId?: string
  stepId?: string
  timestamp?: number
  version?: 'original' | 'compressed' | 'edited'
  threadId?: string
  messageId?: string
  category?: 'dashboards' | 'exterior' | 'interior' | 'damage' | 'documents'
}

/**
 * Generate storage path for event photos
 */
export function getEventPhotoPath(options: {
  vehicleId: string
  eventId: string
  stepId: string
  version: 'original' | 'compressed' | 'edited'
  timestamp: number
  format?: 'jpg' | 'webp'
}): string {
  const { vehicleId, eventId, stepId, version, timestamp, format = 'jpg' } = options
  
  return `vehicles/${vehicleId}/events/${eventId}/${stepId}_${version}_${timestamp}.${format}`
}

/**
 * Generate storage path for chat attachments
 */
export function getChatAttachmentPath(options: {
  vehicleId: string
  threadId: string
  messageId: string
  timestamp: number
  format?: 'jpg' | 'png' | 'pdf'
}): string {
  const { vehicleId, threadId, messageId, timestamp, format = 'jpg' } = options
  
  return `vehicles/${vehicleId}/chat/${threadId}/${messageId}_${timestamp}.${format}`
}

/**
 * Generate storage path for general vehicle photos
 */
export function getGeneralPhotoPath(options: {
  vehicleId: string
  category: 'dashboards' | 'exterior' | 'interior' | 'damage' | 'documents'
  timestamp: number
  format?: 'jpg' | 'webp'
}): string {
  const { vehicleId, category, timestamp, format = 'jpg' } = options
  
  return `vehicles/${vehicleId}/general/${category}/${timestamp}.${format}`
}

/**
 * Generate storage path for hero images
 */
export function getHeroImagePath(options: {
  vehicleId: string
  type: 'hero' | 'thumbnail'
  format?: 'jpg' | 'webp'
}): string {
  const { vehicleId, type, format = 'jpg' } = options
  
  return `vehicles/${vehicleId}/hero/${type}.${format}`
}

/**
 * Generate storage path for event metadata
 */
export function getEventMetadataPath(options: {
  vehicleId: string
  eventId: string
}): string {
  const { vehicleId, eventId } = options
  
  return `vehicles/${vehicleId}/events/${eventId}/metadata.json`
}

/**
 * Parse storage path to extract components
 */
export function parseStoragePath(path: string): {
  vehicleId?: string
  eventId?: string
  stepId?: string
  version?: 'original' | 'compressed' | 'edited'
  timestamp?: number
  category?: 'events' | 'chat' | 'general' | 'hero'
  format?: string
} {
  // Example: vehicles/{vehicleId}/events/{eventId}/{stepId}_{version}_{timestamp}.jpg
  const parts = path.split('/')
  
  if (parts[0] !== 'vehicles') {
    return {}
  }
  
  const vehicleId = parts[1]
  const category = parts[2] as any
  
  const result: any = {
    vehicleId,
    category
  }
  
  if (category === 'events' && parts.length >= 5) {
    result.eventId = parts[3]
    
    // Parse filename: {stepId}_{version}_{timestamp}.{format}
    const filename = parts[4]
    const [name, format] = filename.split('.')
    const [stepId, version, timestamp] = name.split('_')
    
    result.stepId = stepId
    result.version = version
    result.timestamp = parseInt(timestamp)
    result.format = format
  }
  
  return result
}

/**
 * Get compressed version path from original path
 */
export function getCompressedPath(originalPath: string): string {
  return originalPath.replace('_original_', '_compressed_')
}

/**
 * Get edited version path from compressed path
 */
export function getEditedPath(compressedPath: string): string {
  return compressedPath.replace('_compressed_', '_edited_')
}

/**
 * Check if path is original version
 */
export function isOriginalVersion(path: string): boolean {
  return path.includes('_original_')
}

/**
 * Check if path is compressed version
 */
export function isCompressedVersion(path: string): boolean {
  return path.includes('_compressed_')
}

/**
 * Check if path is edited version
 */
export function isEditedVersion(path: string): boolean {
  return path.includes('_edited_')
}

/**
 * Get all version paths for a photo
 */
export function getAllVersionPaths(basePath: string): {
  original: string
  compressed: string
  edited: string
} {
  // Assume basePath is the original version
  const original = basePath.includes('_original_') 
    ? basePath 
    : basePath.replace(/_(compressed|edited)_/, '_original_')
  
  return {
    original,
    compressed: getCompressedPath(original),
    edited: getEditedPath(getCompressedPath(original))
  }
}

/**
 * Generate bucket name (for environment switching)
 */
export function getBucketName(env: 'production' | 'staging' | 'development' = 'production'): string {
  switch (env) {
    case 'production':
      return 'vehicle-events'
    case 'staging':
      return 'vehicle-events-staging'
    case 'development':
      return 'vehicle-events-dev'
  }
}

/**
 * Example Usage:
 * 
 * // Event photo (captured via camera)
 * const path = getEventPhotoPath({
 *   vehicleId: '75bf28ae-b576-4628-abb0-9728dfc01ec0',
 *   eventId: 'abc-123',
 *   stepId: 'receipt',
 *   version: 'compressed',
 *   timestamp: Date.now(),
 *   format: 'webp'
 * })
 * // Result: vehicles/75bf28ae.../events/abc-123/receipt_compressed_1760047360956.webp
 * 
 * // Chat attachment
 * const chatPath = getChatAttachmentPath({
 *   vehicleId: '75bf28ae-b576-4628-abb0-9728dfc01ec0',
 *   threadId: 'thread-456',
 *   messageId: 'msg-789',
 *   timestamp: Date.now()
 * })
 * // Result: vehicles/75bf28ae.../chat/thread-456/msg-789_1760047360956.jpg
 * 
 * // General photo
 * const generalPath = getGeneralPhotoPath({
 *   vehicleId: '75bf28ae-b576-4628-abb0-9728dfc01ec0',
 *   category: 'dashboards',
 *   timestamp: Date.now()
 * })
 * // Result: vehicles/75bf28ae.../general/dashboards/1760047360956.jpg
 */
