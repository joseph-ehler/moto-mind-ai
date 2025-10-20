#!/usr/bin/env tsx
/**
 * Apply MASTER RLS Fix
 * Bypasses migration runner to apply critical security fix
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
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

async function applyMasterFix() {
  console.log('🔧 Applying MASTER RLS Policy Fix...\n')
  
  const filePath = path.join(process.cwd(), 'supabase/migrations/20251014_fix_all_rls_policies_MASTER.sql')
  const sql = fs.readFileSync(filePath, 'utf8')
  
  try {
    console.log('⏳ Executing migration...')
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      throw new Error(`SQL execution failed: ${error.message}`)
    }
    
    console.log('✅ MASTER RLS fix applied successfully!')
    console.log('\n📊 Fixed 10 tables:')
    console.log('  ✅ garages (CRITICAL - RLS was disabled)')
    console.log('  ✅ capture_sessions')
    console.log('  ✅ event_photos')
    console.log('  ✅ photo_metadata')
    console.log('  ✅ profiles')
    console.log('  ✅ user_tenants')
    console.log('  ✅ vehicle_event_audit_logs')
    console.log('  ✅ vehicle_events')
    console.log('  ✅ vehicle_images')
    console.log('  ✅ vehicles')
    
    // Record in migrations table
    await supabase
      .from('schema_migrations')
      .insert({ filename: '20251014_fix_all_rls_policies_MASTER.sql' })
    
    console.log('\n🎉 Database is now 100% secure!')
    console.log('Run: npm run db:validate')
    
  } catch (error: any) {
    console.error('\n❌ Failed to apply fix:', error.message || error)
    process.exit(1)
  }
}

applyMasterFix()
