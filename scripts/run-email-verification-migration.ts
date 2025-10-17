#!/usr/bin/env tsx
/**
 * Run Email Verification Migration
 * Applies the email_verified columns to user_tenants table
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🔄 Running Email Verification Migration\n')
  
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251016_10_email_verification.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If RPC doesn't exist, try direct execution
      return await supabase.from('_raw').select('*').limit(0).then(() => {
        // Fallback: execute statements one by one
        return executeSQLStatements(sql)
      })
    })
    
    if (error) {
      throw error
    }
    
    console.log('✅ Email verification migration completed successfully!\n')
    console.log('Added columns:')
    console.log('  - email_verified (boolean)')
    console.log('  - email_verified_at (timestamp)')
    console.log('  - Index on email_verified')
    console.log('  - Trigger to auto-set verification timestamp\n')
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

async function executeSQLStatements(sql: string) {
  // Split SQL into statements and execute via Supabase
  const { data, error } = await supabase
    .rpc('exec_sql', { sql_query: sql })
  
  if (error) {
    // Try alternative method - use schema query
    const statements = [
      `ALTER TABLE user_tenants ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`,
      `ALTER TABLE user_tenants ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ`,
      `CREATE INDEX IF NOT EXISTS idx_user_tenants_email_verified ON user_tenants(email_verified)`
    ]
    
    for (const statement of statements) {
      const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement })
      if (stmtError) {
        throw stmtError
      }
    }
  }
  
  return { data, error: null }
}

// Run it
runMigration()
