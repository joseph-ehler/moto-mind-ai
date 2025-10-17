/**
 * Quick script to fix sessions table schema
 * Adds missing columns needed by session-tracker
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runSQL(sql: string, description: string) {
  console.log(`\n📝 ${description}...`)
  
  const { data, error } = await supabase.rpc('exec_sql', { query: sql })
  
  if (error) {
    console.error(`❌ Failed: ${error.message}`)
    return false
  }
  
  console.log(`✅ Success`)
  return true
}

async function fixSessionsTable() {
  console.log('🔧 Fixing sessions table schema...\n')
  
  // Step 1: Make session_token and expires nullable
  await runSQL(
    `ALTER TABLE sessions 
     ALTER COLUMN session_token DROP NOT NULL,
     ALTER COLUMN expires DROP NOT NULL;`,
    'Making session_token and expires nullable'
  )
  
  // Step 2: Add missing columns
  await runSQL(
    `ALTER TABLE sessions 
     ADD COLUMN IF NOT EXISTS device_id TEXT,
     ADD COLUMN IF NOT EXISTS device_name TEXT,
     ADD COLUMN IF NOT EXISTS browser_version TEXT,
     ADD COLUMN IF NOT EXISTS os_version TEXT,
     ADD COLUMN IF NOT EXISTS location_flag TEXT,
     ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();`,
    'Adding missing columns (device_id, device_name, etc.)'
  )
  
  // Step 3: Migrate old data if needed
  await runSQL(
    `UPDATE sessions 
     SET last_active = COALESCE(last_active, last_active_at, created_at)
     WHERE last_active IS NULL;`,
    'Migrating last_active data from old columns'
  )
  
  await runSQL(
    `UPDATE sessions 
     SET device_id = COALESCE(device_id, device_fingerprint)
     WHERE device_id IS NULL AND device_fingerprint IS NOT NULL;`,
    'Migrating device_id data from device_fingerprint'
  )
  
  // Step 4: Create indexes
  await runSQL(
    `CREATE INDEX IF NOT EXISTS idx_sessions_user_device ON sessions(user_id, device_id);
     CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);`,
    'Creating performance indexes'
  )
  
  // Step 5: Update RLS policies
  await runSQL(
    `DROP POLICY IF EXISTS "Service role only" ON sessions;
     DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
     
     CREATE POLICY "Service role full access" ON sessions
       FOR ALL USING (auth.role() = 'service_role');
     
     CREATE POLICY "Users can view own sessions" ON sessions
       FOR SELECT USING (
         user_id = current_setting('request.jwt.claims', true)::json->>'email'
         OR user_id = auth.jwt() ->> 'email'
       );`,
    'Updating RLS policies'
  )
  
  // Step 6: Verify schema
  console.log('\n🔍 Verifying schema...')
  
  const requiredColumns = [
    'id', 'user_id', 'session_token', 'expires', 
    'device_id', 'device_name', 'device_type', 
    'browser', 'browser_version', 'os', 'os_version',
    'ip_address', 'location_country', 'location_city', 'location_flag',
    'last_active', 'created_at'
  ]
  
  const { data: columns } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'sessions')
  
  const existingColumns = new Set(columns?.map(c => c.column_name) || [])
  
  let allGood = true
  for (const col of requiredColumns) {
    if (existingColumns.has(col)) {
      console.log(`  ✅ ${col}`)
    } else {
      console.log(`  ❌ ${col} - MISSING`)
      allGood = false
    }
  }
  
  if (allGood) {
    console.log('\n🎉 Sessions table is ready!')
    console.log('\n✨ Next steps:')
    console.log('  1. Refresh your browser')
    console.log('  2. Navigate around the app (triggers session tracking)')
    console.log('  3. Visit /settings/sessions to see your active session')
  } else {
    console.log('\n⚠️  Some columns are still missing - manual intervention may be needed')
  }
}

// Run it
fixSessionsTable()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
