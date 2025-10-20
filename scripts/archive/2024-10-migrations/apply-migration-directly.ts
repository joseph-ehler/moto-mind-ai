/**
 * Apply migration SQL directly via Supabase Management API
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function applyMigration() {
  console.log('📝 Reading migration file...\n')
  
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251017_06_fix_sessions_complete.sql')
  const sql = fs.readFileSync(migrationPath, 'utf-8')
  
  console.log('📤 Sending SQL to Supabase...\n')
  console.log('⚠️  Note: This uses PostgREST, not direct SQL execution')
  console.log('   You may need to apply this migration manually via Supabase Dashboard')
  console.log('\n' + '='.repeat(80))
  console.log('\n📋 COPY THIS SQL AND RUN IT IN SUPABASE SQL EDITOR:')
  console.log('\n🔗 https://supabase.com/dashboard/project/ucbbzzoimghnaoihyqbd/sql/new')
  console.log('\n' + '='.repeat(80))
  console.log('\n' + sql)
  console.log('\n' + '='.repeat(80))
  console.log('\n✅ After running the SQL in Supabase Dashboard:')
  console.log('   1. Refresh your browser')
  console.log('   2. Navigate around the app')
  console.log('   3. Visit /settings/sessions\n')
}

applyMigration()
