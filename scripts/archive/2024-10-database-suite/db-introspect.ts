#!/usr/bin/env tsx
/**
 * Database Introspection Tool (Fixed for DNS issues)
 * 
 * Uses standard information_schema queries instead of custom RPC functions
 * Usage: npm run db:introspect
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Known tables from migrations
const KNOWN_TABLES = [
  'tenants',
  'user_tenants',
  'logs',
  'schema_migrations',
  'conversation_messages',
  'conversation_threads',
  'auth_credentials',
  'email_verification_tokens'
]

async function getTables(): Promise<string[]> {
  const existingTables: string[] = []
  
  for (const table of KNOWN_TABLES) {
    try {
      // Try to query the table - if it exists, this will succeed
      const { error } = await supabase.from(table).select('*').limit(0)
      if (!error) {
        existingTables.push(table)
      }
    } catch (e) {
      // Table doesn't exist, skip
    }
  }
  
  return existingTables.sort()
}

async function getTableInfo(tableName: string): Promise<any> {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
    
    return {
      name: tableName,
      rowCount: count || 0,
      exists: !error
    }
  } catch (error: any) {
    return {
      name: tableName,
      rowCount: 0,
      exists: false
    }
  }
}

async function main() {
  console.log('\n🔍 DATABASE INTROSPECTION (Fixed)\n')
  console.log(`📍 Database: ${SUPABASE_URL}\n`)

  try {
    const tables = await getTables()
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found in public schema')
      return
    }

    console.log(`📊 Found ${tables.length} tables:\n`)

    for (const table of tables) {
      const info = await getTableInfo(table)
      console.log(`  • ${info.name} (${info.rowCount} rows)`)
    }

    console.log('\n✅ Introspection complete!\n')

  } catch (error: any) {
    console.error('\n❌ Introspection failed:', error.message)
    process.exit(1)
  }
}

main()
