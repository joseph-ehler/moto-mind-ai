/**
 * Storage Manager
 * 
 * Manage Supabase Storage buckets and files:
 * - List, create, and delete buckets
 * - Upload and download files
 * - Get bucket statistics
 * - Cleanup old files
 * - Manage bucket policies
 */

import { QueryExecutor } from '../core/query-executor'
import { createClient } from '@supabase/supabase-js'

export interface StorageBucket {
  id: string
  name: string
  owner: string
  public: boolean
  createdAt: Date
  updatedAt: Date
  fileSizeLimit: number | null
  allowedMimeTypes: string[] | null
}

export interface StorageFile {
  name: string
  id: string
  size: number
  mimeType: string
  createdAt: Date
  updatedAt: Date
  lastAccessedAt: Date | null
  metadata: Record<string, any>
}

export interface BucketStats {
  name: string
  fileCount: number
  totalSize: number
  oldestFile: Date | null
  newestFile: Date | null
  mimeTypes: Record<string, number>
}

export interface CleanupResult {
  filesDeleted: number
  spaceFreed: number
  errors: Array<{ file: string; error: string }>
}

export class StorageManager {
  private supabase: ReturnType<typeof createClient>
  
  constructor(private queryExecutor: QueryExecutor) {
    // Initialize Supabase client for storage operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment')
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })
  }
  
  /**
   * List all storage buckets
   */
  async listBuckets(): Promise<StorageBucket[]> {
    const { data, error } = await this.supabase.storage.listBuckets()
    
    if (error) {
      throw new Error(`Failed to list buckets: ${error.message}`)
    }
    
    return data.map(bucket => ({
      id: bucket.id,
      name: bucket.name,
      owner: bucket.owner || 'unknown',
      public: bucket.public || false,
      createdAt: new Date(bucket.created_at),
      updatedAt: new Date(bucket.updated_at),
      fileSizeLimit: bucket.file_size_limit || null,
      allowedMimeTypes: bucket.allowed_mime_types || null
    }))
  }
  
  /**
   * Get bucket by name
   */
  async getBucket(name: string): Promise<StorageBucket | null> {
    const { data, error } = await this.supabase.storage.getBucket(name)
    
    if (error) {
      if (error.message.includes('not found')) {
        return null
      }
      throw new Error(`Failed to get bucket: ${error.message}`)
    }
    
    return {
      id: data.id,
      name: data.name,
      owner: data.owner || 'unknown',
      public: data.public || false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      fileSizeLimit: data.file_size_limit || null,
      allowedMimeTypes: data.allowed_mime_types || null
    }
  }
  
  /**
   * Create a new storage bucket
   */
  async createBucket(
    name: string,
    options: {
      public?: boolean
      fileSizeLimit?: number
      allowedMimeTypes?: string[]
    } = {}
  ): Promise<StorageBucket> {
    const { data, error } = await this.supabase.storage.createBucket(name, {
      public: options.public || false,
      fileSizeLimit: options.fileSizeLimit,
      allowedMimeTypes: options.allowedMimeTypes
    })
    
    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`)
    }
    
    // Get the created bucket details
    const bucket = await this.getBucket(name)
    
    if (!bucket) {
      throw new Error('Bucket created but could not retrieve details')
    }
    
    return bucket
  }
  
  /**
   * Delete a storage bucket
   */
  async deleteBucket(name: string, force: boolean = false): Promise<void> {
    // Check if bucket has files
    const files = await this.listFiles(name)
    
    if (files.length > 0 && !force) {
      throw new Error(
        `Bucket "${name}" contains ${files.length} files. ` +
        `Use force=true to delete anyway.`
      )
    }
    
    // Delete all files if force is true
    if (files.length > 0 && force) {
      const filePaths = files.map(f => f.name)
      await this.deleteFiles(name, filePaths)
    }
    
    const { error } = await this.supabase.storage.deleteBucket(name)
    
    if (error) {
      throw new Error(`Failed to delete bucket: ${error.message}`)
    }
  }
  
  /**
   * Empty a bucket (delete all files)
   */
  async emptyBucket(name: string): Promise<number> {
    const files = await this.listFiles(name)
    
    if (files.length === 0) {
      return 0
    }
    
    const filePaths = files.map(f => f.name)
    await this.deleteFiles(name, filePaths)
    
    return files.length
  }
  
  /**
   * List files in a bucket
   */
  async listFiles(
    bucketName: string,
    path: string = '',
    options: {
      limit?: number
      offset?: number
      sortBy?: { column: string; order: 'asc' | 'desc' }
    } = {}
  ): Promise<StorageFile[]> {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .list(path, {
        limit: options.limit,
        offset: options.offset,
        sortBy: options.sortBy
      })
    
    if (error) {
      throw new Error(`Failed to list files: ${error.message}`)
    }
    
    return data.map(file => ({
      name: file.name,
      id: file.id || file.name,
      size: file.metadata?.size || 0,
      mimeType: file.metadata?.mimetype || 'application/octet-stream',
      createdAt: new Date(file.created_at),
      updatedAt: new Date(file.updated_at),
      lastAccessedAt: file.last_accessed_at ? new Date(file.last_accessed_at) : null,
      metadata: file.metadata || {}
    }))
  }
  
  /**
   * Delete files from a bucket
   */
  async deleteFiles(bucketName: string, filePaths: string[]): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucketName)
      .remove(filePaths)
    
    if (error) {
      throw new Error(`Failed to delete files: ${error.message}`)
    }
  }
  
  /**
   * Get bucket statistics
   */
  async getBucketStats(bucketName: string): Promise<BucketStats> {
    const files = await this.listFiles(bucketName)
    
    const stats: BucketStats = {
      name: bucketName,
      fileCount: files.length,
      totalSize: 0,
      oldestFile: null,
      newestFile: null,
      mimeTypes: {}
    }
    
    for (const file of files) {
      stats.totalSize += file.size
      
      // Track oldest/newest
      if (!stats.oldestFile || file.createdAt < stats.oldestFile) {
        stats.oldestFile = file.createdAt
      }
      
      if (!stats.newestFile || file.createdAt > stats.newestFile) {
        stats.newestFile = file.createdAt
      }
      
      // Track mime types
      const mimeType = file.mimeType
      stats.mimeTypes[mimeType] = (stats.mimeTypes[mimeType] || 0) + 1
    }
    
    return stats
  }
  
  /**
   * Cleanup old files in a bucket
   */
  async cleanupOldFiles(
    bucketName: string,
    olderThan: Date,
    options: {
      dryRun?: boolean
      pathPrefix?: string
    } = {}
  ): Promise<CleanupResult> {
    const files = await this.listFiles(bucketName, options.pathPrefix || '')
    
    const oldFiles = files.filter(file => file.createdAt < olderThan)
    
    const result: CleanupResult = {
      filesDeleted: 0,
      spaceFreed: 0,
      errors: []
    }
    
    if (oldFiles.length === 0) {
      return result
    }
    
    const filePaths = oldFiles.map(f => f.name)
    const totalSize = oldFiles.reduce((sum, f) => sum + f.size, 0)
    
    if (options.dryRun) {
      result.filesDeleted = oldFiles.length
      result.spaceFreed = totalSize
      return result
    }
    
    // Delete in batches of 100
    const batchSize = 100
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize)
      
      try {
        await this.deleteFiles(bucketName, batch)
        result.filesDeleted += batch.length
      } catch (error) {
        batch.forEach(file => {
          result.errors.push({
            file,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        })
      }
    }
    
    result.spaceFreed = totalSize
    
    return result
  }
  
  /**
   * Get public URL for a file
   */
  getPublicUrl(bucketName: string, filePath: string): string {
    const { data } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }
  
  /**
   * Create signed URL for private file
   */
  async createSignedUrl(
    bucketName: string,
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn)
    
    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }
    
    return data.signedUrl
  }
  
  /**
   * Download a file
   */
  async downloadFile(bucketName: string, filePath: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .download(filePath)
    
    if (error) {
      throw new Error(`Failed to download file: ${error.message}`)
    }
    
    return data
  }
  
  /**
   * Upload a file
   */
  async uploadFile(
    bucketName: string,
    filePath: string,
    file: File | Blob,
    options: {
      cacheControl?: string
      upsert?: boolean
      contentType?: string
    } = {}
  ): Promise<{ path: string; url: string }> {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: options.cacheControl || '3600',
        upsert: options.upsert || false,
        contentType: options.contentType
      })
    
    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
    
    const url = this.getPublicUrl(bucketName, data.path)
    
    return {
      path: data.path,
      url
    }
  }
  
  /**
   * Move/rename a file
   */
  async moveFile(
    bucketName: string,
    fromPath: string,
    toPath: string
  ): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucketName)
      .move(fromPath, toPath)
    
    if (error) {
      throw new Error(`Failed to move file: ${error.message}`)
    }
  }
  
  /**
   * Copy a file
   */
  async copyFile(
    bucketName: string,
    fromPath: string,
    toPath: string
  ): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucketName)
      .copy(fromPath, toPath)
    
    if (error) {
      throw new Error(`Failed to copy file: ${error.message}`)
    }
  }
}
