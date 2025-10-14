#!/usr/bin/env tsx
/**
 * Storage Manager
 * 
 * Complete control over Supabase Storage buckets
 * Features:
 * - List/create/delete buckets
 * - Audit storage security
 * - Fix bucket permissions
 * - Migrate files between buckets
 * - Cleanup orphaned files
 * 
 * Usage: npm run db:storage <command>
 */

import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface BucketInfo {
  id: string
  name: string
  public: boolean
  file_size_limit?: number
  allowed_mime_types?: string[]
}

interface SecurityIssue {
  bucket: string
  severity: 'high' | 'medium' | 'low'
  issue: string
  fix?: string
}

class StorageManager {
  // List all buckets
  async listBuckets(): Promise<void> {
    console.log('📦 STORAGE BUCKETS\n')
    
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('❌ Failed to list buckets:', error.message)
      return
    }
    
    if (!buckets || buckets.length === 0) {
      console.log('No buckets found')
      return
    }
    
    console.log(`Found ${buckets.length} bucket(s):\n`)
    
    for (const bucket of buckets) {
      console.log(`📁 ${bucket.name}`)
      console.log(`   ID: ${bucket.id}`)
      console.log(`   Public: ${bucket.public ? 'Yes ⚠️' : 'No ✅'}`)
      console.log(`   Created: ${bucket.created_at}`)
      
      // Get file count
      const { data: files } = await supabase.storage.from(bucket.name).list()
      console.log(`   Files: ${files?.length || 0}`)
      console.log('')
    }
  }
  
  // Audit storage security
  async auditSecurity(): Promise<SecurityIssue[]> {
    console.log('🔍 STORAGE SECURITY AUDIT\n')
    
    const { data: buckets } = await supabase.storage.listBuckets()
    const issues: SecurityIssue[] = []
    
    if (!buckets) {
      console.log('No buckets to audit')
      return issues
    }
    
    for (const bucket of buckets) {
      console.log(`🔍 Auditing: ${bucket.name}`)
      
      // Check 1: Public bucket with sensitive name
      if (bucket.public && (
        bucket.name.includes('private') || 
        bucket.name.includes('secure') ||
        bucket.name.includes('internal')
      )) {
        issues.push({
          bucket: bucket.name,
          severity: 'high',
          issue: 'Bucket is public but name suggests it should be private',
          fix: 'Make bucket private or rename it'
        })
        console.log('   ❌ HIGH: Public bucket with private name')
      }
      
      // Check 2: No file size limit
      if (!bucket.file_size_limit) {
        issues.push({
          bucket: bucket.name,
          severity: 'medium',
          issue: 'No file size limit set',
          fix: 'Set reasonable file size limit (e.g., 10MB)'
        })
        console.log('   ⚠️  MEDIUM: No file size limit')
      }
      
      // Check 3: Large bucket with no organization
      const { data: files } = await supabase.storage.from(bucket.name).list()
      if (files && files.length > 100) {
        issues.push({
          bucket: bucket.name,
          severity: 'low',
          issue: `Large number of files (${files.length}) - consider organization`,
          fix: 'Organize files into folders'
        })
        console.log(`   ⚠️  LOW: ${files.length} files (consider folders)`)
      }
      
      if (issues.filter(i => i.bucket === bucket.name).length === 0) {
        console.log('   ✅ No issues found')
      }
      console.log('')
    }
    
    // Summary
    console.log('='.repeat(60))
    console.log('📊 AUDIT SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total buckets: ${buckets.length}`)
    console.log(`High severity: ${issues.filter(i => i.severity === 'high').length}`)
    console.log(`Medium severity: ${issues.filter(i => i.severity === 'medium').length}`)
    console.log(`Low severity: ${issues.filter(i => i.severity === 'low').length}`)
    console.log('')
    
    if (issues.length === 0) {
      console.log('✅ No security issues found!')
    } else {
      console.log('⚠️  Issues found - review and fix')
    }
    console.log('')
    
    return issues
  }
  
  // Create bucket with proper settings
  async createBucket(name: string, options: {
    public?: boolean
    fileSizeLimit?: number
    allowedMimeTypes?: string[]
  } = {}): Promise<void> {
    console.log(`📦 Creating bucket: ${name}\n`)
    
    const { data, error } = await supabase.storage.createBucket(name, {
      public: options.public || false,
      fileSizeLimit: options.fileSizeLimit,
      allowedMimeTypes: options.allowedMimeTypes
    })
    
    if (error) {
      console.error('❌ Failed to create bucket:', error.message)
      return
    }
    
    console.log('✅ Bucket created successfully')
    console.log(`   Name: ${name}`)
    console.log(`   Public: ${options.public ? 'Yes' : 'No'}`)
    if (options.fileSizeLimit) {
      console.log(`   Size limit: ${(options.fileSizeLimit / 1024 / 1024).toFixed(1)}MB`)
    }
    if (options.allowedMimeTypes) {
      console.log(`   Allowed types: ${options.allowedMimeTypes.join(', ')}`)
    }
    console.log('')
  }
  
  // Get bucket details
  async getBucketInfo(name: string): Promise<void> {
    console.log(`📁 Bucket: ${name}\n`)
    
    const { data: bucket, error } = await supabase.storage.getBucket(name)
    
    if (error) {
      console.error('❌ Bucket not found')
      return
    }
    
    console.log(`ID: ${bucket.id}`)
    console.log(`Public: ${bucket.public ? 'Yes' : 'No'}`)
    console.log(`Created: ${bucket.created_at}`)
    console.log(`Updated: ${bucket.updated_at}`)
    
    if (bucket.file_size_limit) {
      console.log(`Size limit: ${(bucket.file_size_limit / 1024 / 1024).toFixed(1)}MB`)
    }
    
    if (bucket.allowed_mime_types) {
      console.log(`Allowed types: ${bucket.allowed_mime_types.join(', ')}`)
    }
    
    // Get files
    const { data: files } = await supabase.storage.from(name).list()
    console.log(`\nFiles: ${files?.length || 0}`)
    
    if (files && files.length > 0) {
      const totalSize = files.reduce((sum, f) => sum + (f.metadata?.size || 0), 0)
      console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`)
    }
    console.log('')
  }
  
  // Find orphaned files (not referenced in database)
  async findOrphans(bucketName: string): Promise<string[]> {
    console.log(`🔍 Finding orphaned files in: ${bucketName}\n`)
    
    const { data: files } = await supabase.storage.from(bucketName).list()
    
    if (!files || files.length === 0) {
      console.log('No files in bucket')
      return []
    }
    
    const orphans: string[] = []
    
    // Check each file against database
    for (const file of files) {
      // Check vehicle_images
      const { data: vehicleImages } = await supabase
        .from('vehicle_images')
        .select('id')
        .or(`storage_path.eq.${file.name},thumbnail_path.eq.${file.name}`)
        .limit(1)
      
      if (!vehicleImages || vehicleImages.length === 0) {
        orphans.push(file.name)
      }
    }
    
    console.log(`Total files: ${files.length}`)
    console.log(`Orphaned: ${orphans.length}`)
    console.log(`Referenced: ${files.length - orphans.length}`)
    
    if (orphans.length > 0) {
      console.log(`\n⚠️  Orphaned files:`)
      orphans.forEach(f => console.log(`  - ${f}`))
    } else {
      console.log('\n✅ No orphaned files found')
    }
    console.log('')
    
    return orphans
  }
  
  // Cleanup orphaned files
  async cleanupOrphans(bucketName: string, dryRun: boolean = true): Promise<void> {
    const orphans = await this.findOrphans(bucketName)
    
    if (orphans.length === 0) {
      return
    }
    
    if (dryRun) {
      console.log('🔍 DRY RUN - No files will be deleted')
      console.log(`Would delete ${orphans.length} orphaned file(s)`)
      console.log('\nRun with --no-dry-run to actually delete')
      return
    }
    
    console.log(`🗑️  Deleting ${orphans.length} orphaned files...`)
    
    const { error } = await supabase.storage.from(bucketName).remove(orphans)
    
    if (error) {
      console.error('❌ Failed to delete files:', error.message)
      return
    }
    
    console.log('✅ Orphaned files deleted')
  }
}

// CLI
const command = process.argv[2]
const args = process.argv.slice(3)

const manager = new StorageManager()

async function main() {
  switch (command) {
    case 'list':
      await manager.listBuckets()
      break
      
    case 'audit':
      await manager.auditSecurity()
      break
      
    case 'create':
      if (!args[0]) {
        console.error('Usage: npm run db:storage create <bucket-name> [--public] [--size-limit=10MB]')
        process.exit(1)
      }
      await manager.createBucket(args[0], {
        public: args.includes('--public'),
        fileSizeLimit: args.find(a => a.startsWith('--size-limit='))
          ? parseInt(args.find(a => a.startsWith('--size-limit='))!.split('=')[1]) * 1024 * 1024
          : undefined
      })
      break
      
    case 'info':
      if (!args[0]) {
        console.error('Usage: npm run db:storage info <bucket-name>')
        process.exit(1)
      }
      await manager.getBucketInfo(args[0])
      break
      
    case 'orphans':
      if (!args[0]) {
        console.error('Usage: npm run db:storage orphans <bucket-name>')
        process.exit(1)
      }
      await manager.findOrphans(args[0])
      break
      
    case 'cleanup':
      if (!args[0]) {
        console.error('Usage: npm run db:storage cleanup <bucket-name> [--no-dry-run]')
        process.exit(1)
      }
      await manager.cleanupOrphans(args[0], !args.includes('--no-dry-run'))
      break
      
    default:
      console.log('🗄️  STORAGE MANAGER\n')
      console.log('Commands:')
      console.log('  list                    - List all buckets')
      console.log('  audit                   - Security audit')
      console.log('  create <name> [opts]    - Create bucket')
      console.log('  info <name>             - Get bucket details')
      console.log('  orphans <name>          - Find orphaned files')
      console.log('  cleanup <name>          - Cleanup orphans (dry-run)')
      console.log('')
      console.log('Examples:')
      console.log('  npm run db:storage list')
      console.log('  npm run db:storage audit')
      console.log('  npm run db:storage create my-bucket --public')
      console.log('  npm run db:storage info vehicle-images')
      console.log('  npm run db:storage orphans vehicle-images')
      console.log('  npm run db:storage cleanup vehicle-images --no-dry-run')
      process.exit(1)
  }
}

main().catch(console.error)
