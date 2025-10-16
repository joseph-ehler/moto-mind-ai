import { getSupabaseServer } from '@/lib/supabase-server'
/**
 * Supabase Storage Service for Canonical Vehicle Images
 * 
 * Handles uploading, retrieving, and managing vehicle images in Supabase Storage.
 * Optimized for canonical image system with proper naming and organization.
 */


// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create service role client for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, 

// Storage configuration
const VEHICLE_IMAGES_BUCKET = 'vehicle-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export interface ImageMetadata {
  canonicalKey: string
  angle: string
  generatedAt: Date
  model: string
  verified: boolean
}

/**
 * Supabase Storage service for canonical vehicle images
 */
export class SupabaseStorageService {
  
  /**
   * Initialize storage bucket if it doesn't exist
   */
  async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(bucket => bucket.name === VEHICLE_IMAGES_BUCKET)
      
      if (!bucketExists) {
        // Create bucket with public read access
        const { error } = await supabase.storage.createBucket(VEHICLE_IMAGES_BUCKET, {
          public: true,
          allowedMimeTypes: ALLOWED_MIME_TYPES,
          fileSizeLimit: MAX_FILE_SIZE
        })
        
        if (error) {
          console.error('Failed to create storage bucket:', error)
          throw error
        }
        
        console.log(`✅ Created storage bucket: ${VEHICLE_IMAGES_BUCKET}`)
      }
    } catch (error) {
      console.error('Storage initialization error:', error)
      throw error
    }
  }

  /**
   * Generate storage path for canonical image
   */
  generateStoragePath(canonicalKey: string, angle: string): string {
    // Parse canonical key: "2012-2015|honda|civic|sedan|neutral_silver|usdm"
    const parts = canonicalKey.split('|')
    const [generation, make, model, bodyStyle, color] = parts
    
    // Create organized folder structure
    // Format: make/model/generation/bodyStyle/angle_color.jpg
    return `${make}/${model}/${generation}/${bodyStyle}/${angle}_${color}.jpg`
  }

  /**
   * Upload image from URL to Supabase Storage
   */
  async uploadImageFromUrl(
    imageUrl: string, 
    canonicalKey: string, 
    angle: string,
    metadata?: Partial<ImageMetadata>
  ): Promise<UploadResult> {
    try {
      console.log(`📤 Uploading image to Supabase Storage: ${canonicalKey} (${angle})`)
      
      // Download image from URL
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      
      const imageBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      
      // Validate file size
      if (imageBuffer.byteLength > MAX_FILE_SIZE) {
        return {
          success: false,
          error: `Image too large: ${imageBuffer.byteLength} bytes (max: ${MAX_FILE_SIZE})`
        }
      }
      
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        return {
          success: false,
          error: `Invalid MIME type: ${contentType}`
        }
      }
      
      // Generate storage path
      const storagePath = this.generateStoragePath(canonicalKey, angle)
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(VEHICLE_IMAGES_BUCKET)
        .upload(storagePath, imageBuffer, {
          contentType,
          upsert: true, // Overwrite if exists
          metadata: {
            canonicalKey,
            angle,
            generatedAt: new Date().toISOString(),
            ...metadata
          }
        })
      
      if (error) {
        console.error('Supabase upload error:', error)
        return {
          success: false,
          error: error.message
        }
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(VEHICLE_IMAGES_BUCKET)
        .getPublicUrl(storagePath)
      
      console.log(`✅ Image uploaded successfully: ${urlData.publicUrl}`)
      
      return {
        success: true,
        url: urlData.publicUrl,
        path: storagePath
      }
      
    } catch (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  /**
   * Upload image from buffer to Supabase Storage
   */
  async uploadImageFromBuffer(
    imageBuffer: ArrayBuffer,
    canonicalKey: string,
    angle: string,
    contentType: string = 'image/jpeg',
    metadata?: Partial<ImageMetadata>
  ): Promise<UploadResult> {
    try {
      // Validate file size
      if (imageBuffer.byteLength > MAX_FILE_SIZE) {
        return {
          success: false,
          error: `Image too large: ${imageBuffer.byteLength} bytes (max: ${MAX_FILE_SIZE})`
        }
      }
      
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        return {
          success: false,
          error: `Invalid MIME type: ${contentType}`
        }
      }
      
      // Generate storage path
      const storagePath = this.generateStoragePath(canonicalKey, angle)
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(VEHICLE_IMAGES_BUCKET)
        .upload(storagePath, imageBuffer, {
          contentType,
          upsert: true,
          metadata: {
            canonicalKey,
            angle,
            generatedAt: new Date().toISOString(),
            ...metadata
          }
        })
      
      if (error) {
        return {
          success: false,
          error: error.message
        }
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(VEHICLE_IMAGES_BUCKET)
        .getPublicUrl(storagePath)
      
      return {
        success: true,
        url: urlData.publicUrl,
        path: storagePath
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  /**
   * Get public URL for stored image
   */
  getPublicUrl(storagePath: string): string {
    const { data } = supabase.storage
      .from(VEHICLE_IMAGES_BUCKET)
      .getPublicUrl(storagePath)
    
    return data.publicUrl
  }

  /**
   * Check if image exists in storage
   */
  async imageExists(canonicalKey: string, angle: string): Promise<boolean> {
    try {
      const storagePath = this.generateStoragePath(canonicalKey, angle)
      
      const { data, error } = await supabase.storage
        .from(VEHICLE_IMAGES_BUCKET)
        .list(storagePath.split('/').slice(0, -1).join('/'), {
          search: storagePath.split('/').pop()
        })
      
      return !error && data && data.length > 0
    } catch (error) {
      return false
    }
  }

  /**
   * Delete image from storage
   */
  async deleteImage(canonicalKey: string, angle: string): Promise<boolean> {
    try {
      const storagePath = this.generateStoragePath(canonicalKey, angle)
      
      const { error } = await supabase.storage
        .from(VEHICLE_IMAGES_BUCKET)
        .remove([storagePath])
      
      return !error
    } catch (error) {
      console.error('Delete error:', error)
      return false
    }
  }

  /**
   * List all images for a canonical key
   */
  async listImagesForVehicle(canonicalKey: string): Promise<string[]> {
    try {
      const parts = canonicalKey.split('|')
      const [generation, make, model, bodyStyle] = parts
      const folderPath = `${make}/${model}/${generation}/${bodyStyle}/`
      
      const { data, error } = await supabase.storage
        .from(VEHICLE_IMAGES_BUCKET)
        .list(folderPath)
      
      if (error || !data) {
        return []
      }
      
      return data
        .filter(file => file.name.endsWith('.jpg') || file.name.endsWith('.png'))
        .map(file => this.getPublicUrl(`${folderPath}${file.name}`))
        
    } catch (error) {
      console.error('List images error:', error)
      return []
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalImages: number
    totalSize: number
    bucketSize: number
  }> {
    try {
      // This would require recursive listing of all files
      // For now, return basic stats
      const { data: buckets } = await supabase.storage.listBuckets()
      const vehicleBucket = buckets?.find(b => b.name === VEHICLE_IMAGES_BUCKET)
      
      return {
        totalImages: 0, // Would need to count all files
        totalSize: 0,   // Would need to sum all file sizes
        bucketSize: vehicleBucket?.file_size_limit || MAX_FILE_SIZE
      }
    } catch (error) {
      return {
        totalImages: 0,
        totalSize: 0,
        bucketSize: MAX_FILE_SIZE
      }
    }
  }

  /**
   * Cleanup old or unused images
   */
  async cleanupOldImages(olderThanDays: number = 30): Promise<number> {
    try {
      // This would require listing all files and checking their metadata
      // Implementation depends on specific cleanup requirements
      console.log(`🧹 Cleanup would remove images older than ${olderThanDays} days`)
      return 0
    } catch (error) {
      console.error('Cleanup error:', error)
      return 0
    }
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorageService()

// Helper functions for common operations
export async function uploadCanonicalImage(
  imageUrl: string,
  canonicalKey: string,
  angle: string,
  metadata?: Partial<ImageMetadata>
): Promise<UploadResult> {
  return supabaseStorage.uploadImageFromUrl(imageUrl, canonicalKey, angle, metadata)
}

export async function getCanonicalImageUrl(canonicalKey: string, angle: string): Promise<string | null> {
  const exists = await supabaseStorage.imageExists(canonicalKey, angle)
  if (!exists) return null
  
  const storagePath = supabaseStorage.generateStoragePath(canonicalKey, angle)
  return supabaseStorage.getPublicUrl(storagePath)
}

export async function initializeVehicleImageStorage(): Promise<void> {
  await supabaseStorage.initializeBucket()
}
