/**
 * Smart NHTSA Downloader
 * 
 * Only downloads files if they've changed:
 * - Checks file metadata (size, last-modified)
 * - Compares SHA256 hash with last import
 * - Skips download if file hasn't changed
 * - Saves bandwidth and time
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface FileMetadata {
  url: string
  fileName: string
  size: number
  lastModified: Date
  hash?: string
}

interface DownloadResult {
  downloaded: boolean
  reason: string
  filePath?: string
  metadata?: FileMetadata
  previousHash?: string
}

export class SmartDownloader {
  private dataDir: string

  constructor(dataDir: string = path.join(process.cwd(), 'data/nhtsa')) {
    this.dataDir = dataDir
    this.ensureDirectories()
  }

  /**
   * Ensure data directories exist
   */
  private ensureDirectories() {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'complaints'),
      path.join(this.dataDir, 'investigations'),
      path.join(this.dataDir, 'recalls')
    ]

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
  }

  /**
   * Get file metadata from NHTSA server (HEAD request)
   */
  async getRemoteMetadata(url: string): Promise<FileMetadata> {
    const response = await fetch(url, { method: 'HEAD' })
    
    if (!response.ok) {
      throw new Error(`Failed to get file metadata: ${response.statusText}`)
    }

    const fileName = path.basename(url)
    const size = parseInt(response.headers.get('content-length') || '0')
    const lastModified = new Date(response.headers.get('last-modified') || Date.now())

    return { url, fileName, size, lastModified }
  }

  /**
   * Calculate SHA256 hash of a file
   */
  calculateFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath)
    const hashSum = crypto.createHash('sha256')
    hashSum.update(fileBuffer)
    return hashSum.digest('hex')
  }

  /**
   * Get last import metadata from provenance table
   */
  async getLastImport(sourceType: string): Promise<{ hash: string | null, completed: boolean }> {
    const { data, error } = await supabase
      .from('nhtsa_data_provenance')
      .select('file_hash_sha256, status')
      .eq('source_type', sourceType)
      .eq('status', 'completed')
      .order('import_completed_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return { hash: null, completed: false }
    }

    return { hash: data.file_hash_sha256, completed: true }
  }

  /**
   * Smart download: only if file changed
   */
  async downloadIfChanged(url: string, sourceType: 'complaints' | 'investigations' | 'recalls'): Promise<DownloadResult> {
    console.log(`\n🔍 Checking if download needed...`)
    console.log(`   URL: ${url}`)
    console.log(`   Type: ${sourceType}`)

    // Get remote metadata (HEAD request)
    const metadata = await this.getRemoteMetadata(url)
    console.log(`   Remote size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   Last modified: ${metadata.lastModified.toISOString()}`)

    // Check if we have this file locally
    const localPath = path.join(this.dataDir, sourceType, metadata.fileName)
    const fileExists = fs.existsSync(localPath)

    if (fileExists) {
      console.log(`   ✅ File exists locally`)
      
      // Calculate hash of local file
      const localHash = this.calculateFileHash(localPath)
      console.log(`   Local hash: ${localHash.substring(0, 16)}...`)

      // Check if we've already imported this hash
      const lastImport = await this.getLastImport(sourceType)
      
      if (lastImport.hash === localHash) {
        console.log(`   ✅ File already imported (hash match)`)
        return {
          downloaded: false,
          reason: 'already_imported',
          filePath: localPath,
          metadata,
          previousHash: localHash
        }
      }

      console.log(`   ⚠️  File changed (hash mismatch)`)
      if (lastImport.hash) {
        console.log(`   Previous: ${lastImport.hash.substring(0, 16)}...`)
      }
    }

    // Download file
    console.log(`   ⬇️  Downloading...`)
    const startTime = Date.now()
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    fs.writeFileSync(localPath, Buffer.from(buffer))

    const elapsed = Date.now() - startTime
    console.log(`   ✅ Downloaded ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB in ${(elapsed / 1000).toFixed(1)}s`)

    // Calculate hash
    const newHash = this.calculateFileHash(localPath)
    metadata.hash = newHash
    console.log(`   Hash: ${newHash.substring(0, 16)}...`)

    return {
      downloaded: true,
      reason: fileExists ? 'file_changed' : 'new_file',
      filePath: localPath,
      metadata
    }
  }

  /**
   * Download all NHTSA files (if needed)
   */
  async downloadAll(): Promise<Map<string, DownloadResult>> {
    const results = new Map<string, DownloadResult>()

    const sources = [
      {
        type: 'complaints' as const,
        url: 'https://static.nhtsa.gov/odi/ffdd/cmpl/FLAT_CMPL.zip'
      },
      {
        type: 'investigations' as const,
        url: 'https://static.nhtsa.gov/odi/ffdd/inv/FLAT_INV.zip'
      }
      // Can add recalls later
    ]

    for (const source of sources) {
      try {
        const result = await this.downloadIfChanged(source.url, source.type)
        results.set(source.type, result)
      } catch (error: any) {
        console.error(`❌ Failed to download ${source.type}:`, error.message)
        results.set(source.type, {
          downloaded: false,
          reason: `error: ${error.message}`
        })
      }
    }

    return results
  }
}

// Singleton
let instance: SmartDownloader | null = null

export function getSmartDownloader(): SmartDownloader {
  if (!instance) {
    instance = new SmartDownloader()
  }
  return instance
}
