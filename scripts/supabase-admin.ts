#!/usr/bin/env tsx
/**
 * Supabase Admin Script
 * 
 * Direct access to Supabase database for:
 * - Schema inspection
 * - RLS policy management
 * - Migration execution
 * - Tenant isolation testing
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials!')
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
  process.exit(1)
}

// Create admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function listTables() {
  console.log('\n📊 LISTING ALL TABLES\n')
  
  // Use RPC to query pg_tables
  const { data, error } = await supabase.rpc('list_tables')
  
  if (error) {
    console.log('⚠️  RPC not available, using manual table list')
    
    // Fallback: Try known tables
    const knownTables = [
      'tenants',
      'user_tenants',
      'vehicles',
      'vehicle_events',
      'vehicle_images',
      'photo_metadata',
      'conversation_messages',
      'maintenance_records'
    ]
    
    console.log('Checking known tables:')
    for (const table of knownTables) {
      const { error: checkError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .limit(0)
      
      if (!checkError) {
        console.log(`  ✅ ${table}`)
      }
    }
    return
  }
  
  console.log('Tables in public schema:')
  data?.forEach((table: any) => {
    console.log(`  - ${table.table_name || table}`)
  })
}

async function inspectTable(tableName: string) {
  console.log(`\n🔍 INSPECTING TABLE: ${tableName}\n`)
  
  // Get column info
  const { data: columns, error: colError } = await supabase.rpc('get_table_columns', {
    p_table_name: tableName
  })
  
  if (colError) {
    console.log('⚠️  Using alternative method to get columns')
    
    // Fallback: get first row to see structure
    const { data: sample, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.error('❌ Error:', sampleError)
      return
    }
    
    if (sample && sample.length > 0) {
      console.log('Columns (from sample):')
      Object.keys(sample[0]).forEach(col => {
        console.log(`  - ${col}: ${typeof sample[0][col]}`)
      })
    }
  }
  
  // Get row count
  const { count, error: countError } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
  
  if (!countError) {
    console.log(`\nRow count: ${count}`)
  }
}

async function checkRLSPolicies(tableName: string) {
  console.log(`\n🔒 RLS POLICIES FOR: ${tableName}\n`)
  
  const { data, error } = await supabase.rpc('get_rls_policies', {
    p_table_name: tableName
  })
  
  if (error) {
    console.log('⚠️  Using pg_policies query')
    
    // Direct SQL query
    const { data: policies, error: polError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', tableName)
    
    if (polError) {
      console.error('❌ Error:', polError)
      console.log('💡 Try running: SELECT * FROM pg_policies WHERE tablename = \'' + tableName + '\'')
      return
    }
    
    if (policies && policies.length > 0) {
      policies.forEach(policy => {
        console.log(`Policy: ${policy.policyname}`)
        console.log(`  Command: ${policy.cmd}`)
        console.log(`  Roles: ${policy.roles}`)
        console.log(`  Qual: ${policy.qual}`)
        console.log(`  With Check: ${policy.with_check}`)
        console.log()
      })
    } else {
      console.log('No RLS policies found')
    }
  } else {
    console.log('Policies:', data)
  }
}

async function listTenants() {
  console.log('\n👥 LISTING TENANTS\n')
  
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log(`Found ${data?.length || 0} tenants:`)
  data?.forEach(tenant => {
    console.log(`  ${tenant.is_active ? '✅' : '❌'} ${tenant.name}`)
    console.log(`     ID: ${tenant.id}`)
    console.log(`     Created: ${tenant.created_at}`)
    console.log()
  })
}

async function checkAllRLSPolicies() {
  console.log('\n🔒 CHECKING ALL RLS POLICIES\n')
  
  const tables = [
    'vehicles',
    'vehicle_events',
    'vehicle_images',
    'photo_metadata',
    'maintenance_records',
    'tenants',
    'user_tenants'
  ]
  
  for (const table of tables) {
    console.log(`\n📊 Table: ${table}`)
    console.log('─'.repeat(50))
    
    // Check if RLS is enabled
    const { data: rlsEnabled } = await supabase.rpc('check_rls_enabled', {
      p_table: table
    })
    
    // Try to get policies via SQL query
    const { data: policies, error } = await supabase
      .rpc('get_policies_for_table', { table_name: table })
    
    if (error) {
      // Fallback: Use known policy names from migration files
      console.log('⚠️  Cannot query pg_policies directly')
      console.log('🔍 RLS Status: Unknown (need to check in Supabase dashboard)')
      console.log('📝 Check: https://supabase.com/dashboard → Database → Policies')
      continue
    }
    
    if (!policies || policies.length === 0) {
      console.log('❌ NO RLS POLICIES FOUND')
      console.log('⚠️  WARNING: Table is unprotected!')
      continue
    }
    
    policies.forEach((policy: any) => {
      console.log(`\n  Policy: ${policy.policyname}`)
      console.log(`  Command: ${policy.cmd}`)
      console.log(`  Using: ${policy.qual || 'true'}`)
      console.log(`  With Check: ${policy.with_check || 'true'}`)
      
      // Security check
      if (policy.qual === 'true' || policy.with_check === 'true') {
        console.log('  ⚠️  SECURITY ISSUE: Allows all authenticated users!')
      } else if (policy.qual?.includes('tenant_id')) {
        console.log('  ✅ Tenant isolation: YES')
      }
    })
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('💡 RECOMMENDATION:')
  console.log('   If policies show USING (true), they need to be fixed!')
  console.log('   Run: npm run db:migrate to apply secure policies')
  console.log('='.repeat(50) + '\n')
}

async function testConnection() {
  console.log('🔌 TESTING SUPABASE CONNECTION\n')
  console.log(`URL: ${SUPABASE_URL}`)
  console.log(`Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`)
  
  const { data, error } = await supabase
    .from('tenants')
    .select('count')
    .limit(1)
  
  if (error) {
    console.error('❌ Connection failed:', error.message)
    return false
  }
  
  console.log('✅ Connection successful!\n')
  return true
}

// Main function
async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]
  
  const connected = await testConnection()
  if (!connected) {
    console.log('\n💡 Check your .env.local file')
    process.exit(1)
  }
  
  switch (command) {
    case 'tables':
      await listTables()
      break
    
    case 'inspect':
      if (!arg) {
        console.error('Usage: npm run supabase:admin inspect <table_name>')
        process.exit(1)
      }
      await inspectTable(arg)
      break
    
    case 'rls':
      if (!arg) {
        console.error('Usage: npm run supabase:admin rls <table_name>')
        process.exit(1)
      }
      await checkRLSPolicies(arg)
      break
    
    case 'tenants':
      await listTenants()
      break
    
    case 'policies':
      await checkAllRLSPolicies()
      break
    
    case 'all':
      await listTables()
      await listTenants()
      break
    
    default:
      console.log('📚 SUPABASE ADMIN COMMANDS:\n')
      console.log('  npm run supabase:admin tables          - List all tables')
      console.log('  npm run supabase:admin inspect <name>  - Inspect table structure')
      console.log('  npm run supabase:admin rls <name>      - Check RLS policies for table')
      console.log('  npm run supabase:admin policies        - Check ALL RLS policies')
      console.log('  npm run supabase:admin tenants         - List all tenants')
      console.log('  npm run supabase:admin all             - Show everything')
      console.log()
  }
}

main().catch(console.error)
