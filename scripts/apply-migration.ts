/**
 * Apply SQL Migration Helper
 * 
 * Loads environment and applies a SQL migration file
 * Usage: npx tsx scripts/apply-migration.ts <migration-file>
 */

import 'dotenv/config'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ Usage: npx tsx scripts/apply-migration.ts <migration-file>')
  console.error('   Example: npx tsx scripts/apply-migration.ts supabase/migrations/20251019020000_nhtsa_staging.sql')
  process.exit(1)
}

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set')
  console.error('   Add it to .env.local file')
  process.exit(1)
}

const fullPath = path.resolve(migrationFile)

if (!fs.existsSync(fullPath)) {
  console.error(`❌ Migration file not found: ${fullPath}`)
  process.exit(1)
}

async function applyMigration() {
  console.log(`📋 Applying migration: ${path.basename(migrationFile)}`)
  console.log(`   File: ${fullPath}`)
  console.log(`   Database: ${DATABASE_URL.split('@')[1]?.split('/')[0] || 'configured'}`)
  console.log('')
  
  try {
    const { stdout, stderr } = await execAsync(`psql "${DATABASE_URL}" -f "${fullPath}"`)
    
    if (stdout) {
      console.log(stdout)
    }
    
    if (stderr && !stderr.includes('NOTICE') && !stderr.includes('CREATE') && !stderr.includes('COMMENT')) {
      console.warn(`⚠️  ${stderr}`)
    }
    
    console.log('✅ Migration applied successfully!')
    
  } catch (error: any) {
    console.error(`❌ Migration failed: ${error.message}`)
    if (error.stderr) {
      console.error(error.stderr)
    }
    process.exit(1)
  }
}

applyMigration()
