/**
 * Apply New Migrations (Oct 18, 2025)
 * Runs the latest migrations to fix RLS and add onboarding table
 */

import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'

const DATABASE_URL = process.env.DATABASE_URL!

const migrations = [
  '20251018_fix_rls_policies_for_nextauth.sql',
  '20251018_create_user_onboarding_table.sql'
]

async function applyMigrations() {
  console.log('🔌 Connecting to Supabase...\n')
  
  const pool = new Pool({ connectionString: DATABASE_URL })
  const client = await pool.connect()
  
  try {
    for (const migration of migrations) {
      console.log(`📄 Applying: ${migration}`)
      console.log('-'.repeat(60))
      
      try {
        // Read migration file
        const sql = readFileSync(
          join(process.cwd(), 'supabase/migrations', migration),
          'utf8'
        )
        
        // Execute
        await client.query('BEGIN')
        await client.query(sql)
        await client.query('COMMIT')
        
        console.log(`✅ Success!\n`)
      } catch (error: any) {
        await client.query('ROLLBACK')
        console.error(`❌ Failed: ${error.message}\n`)
        throw error
      }
    }
    
    console.log('='.repeat(60))
    console.log('🎉 All migrations applied successfully!')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

applyMigrations()
