#!/usr/bin/env tsx
/**
 * RLS Policy Inspector
 * Directly queries database to see what policies exist and what columns tables have
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function inspectTable(tableName: string) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📊 TABLE: ${tableName}`)
  console.log('='.repeat(60))
  
  // Get columns
  const { data: columns, error: colError } = await supabase
    .from('information_schema.columns' as any)
    .select('column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .order('ordinal_position')
  
  if (colError) {
    console.log('❌ Error fetching columns:', colError)
  } else {
    console.log('\n📋 Columns:')
    columns?.forEach((col: any) => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)'
      console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}`)
    })
  }
  
  // Check if RLS is enabled
  const { data: rlsData } = await supabase.rpc('get_table_rls_status' as any, {
    table_name: tableName
  }).single()
  
  console.log(`\n🔒 RLS Enabled: ${rlsData ? 'Yes' : 'Unknown'}`)
  
  // Get policies
  const { data: policies, error: polError } = await supabase
    .from('pg_policies' as any)
    .select('*')
    .eq('tablename', tableName)
  
  if (polError) {
    console.log('❌ Error fetching policies:', polError)
  } else if (!policies || policies.length === 0) {
    console.log('\n⚠️  No policies found')
  } else {
    console.log(`\n🛡️  Policies (${policies.length}):`)
    policies.forEach((pol: any) => {
      console.log(`\n  Policy: ${pol.policyname}`)
      console.log(`    Command: ${pol.cmd}`)
      console.log(`    Roles: ${pol.roles?.join(', ') || 'N/A'}`)
      if (pol.qual) {
        console.log(`    USING: ${pol.qual}`)
      }
      if (pol.with_check) {
        console.log(`    WITH CHECK: ${pol.with_check}`)
      }
    })
  }
}

async function main() {
  console.log('🔍 RLS POLICY INSPECTOR\n')
  console.log(`📍 Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`)
  
  const tables = [
    'vehicles',
    'vehicle_events', 
    'garages',
    'profiles',
    'user_maintenance_preferences'
  ]
  
  for (const table of tables) {
    await inspectTable(table)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Inspection complete')
}

main().catch(console.error)
