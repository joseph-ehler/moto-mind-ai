#!/usr/bin/env tsx
/**
 * Database Data Validator
 * 
 * Validates data integrity across all tables
 * Usage: npm run db:validate
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

async function validateDatabase() {
  console.log('🔍 Validating database integrity...\n')

  let issues = 0
  let warnings = 0

  // 1. Check tenant data coverage
  console.log('📊 Tenant Data Coverage:')
  const { data: auditData } = await supabase.rpc('get_tenant_data_audit')

  if (auditData) {
    auditData.forEach((row: any) => {
      const pct = row.total_rows > 0 
        ? ((row.rows_with_tenant / row.total_rows) * 100).toFixed(1)
        : '0'
      
      if (row.rows_missing_tenant > 0) {
        console.log(`  ❌ ${row.table_name}: ${pct}% complete (${row.rows_missing_tenant} missing tenant_id)`)
        issues++
      } else if (row.total_rows === 0) {
        console.log(`  ⚪ ${row.table_name}: empty (0 rows)`)
      } else {
        console.log(`  ✅ ${row.table_name}: ${pct}% complete (${row.rows_with_tenant}/${row.total_rows})`)
      }
    })
  }

  // 2. Check RLS status on tenant tables
  console.log('\n🔒 RLS Status:')
  const { data: tables } = await supabase.rpc('get_all_tables')

  if (tables) {
    for (const table of tables) {
      const tableName = table.table_name

      // Check if table has tenant_id
      const { data: columns } = await supabase.rpc('get_table_columns', {
        table_name_param: tableName
      })

      const hasTenantId = columns?.some((c: any) => c.column_name === 'tenant_id')

      if (hasTenantId) {
        // Check RLS status
        const { data: rlsEnabled } = await supabase.rpc('get_table_rls_status', {
          table_name_param: tableName
        })

        if (!rlsEnabled) {
          console.log(`  ❌ ${tableName}: RLS disabled but has tenant_id`)
          issues++
        } else {
          // Check policy
          const { data: policies } = await supabase.rpc('get_table_rls_policies', {
            table_name_param: tableName
          })

          const hasStrongPolicy = policies?.some((p: any) => 
            p.qual && p.qual.includes('tenant_id')
          )

          if (!hasStrongPolicy) {
            console.log(`  ⚠️  ${tableName}: RLS enabled but weak policy (qual='true')`)
            warnings++
          } else {
            console.log(`  ✅ ${tableName}: RLS enabled with strong policy`)
          }
        }
      }
    }
  }

  // 3. Check for orphaned records
  console.log('\n🔗 Foreign Key Integrity:')
  
  // Check vehicles → tenants
  const { count: orphanedVehicles } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .not('tenant_id', 'in', `(SELECT id FROM tenants)`)

  if (orphanedVehicles && orphanedVehicles > 0) {
    console.log(`  ❌ Found ${orphanedVehicles} vehicles with invalid tenant_id`)
    issues++
  } else {
    console.log(`  ✅ All vehicles have valid tenant_id`)
  }

  // Check vehicle_events → vehicles
  const { data: eventCheck } = await supabase
    .from('vehicle_events')
    .select('id')
    .not('vehicle_id', 'in', `(SELECT id FROM vehicles)`)
    .limit(1)

  if (eventCheck && eventCheck.length > 0) {
    console.log(`  ❌ Found vehicle_events with invalid vehicle_id`)
    issues++
  } else {
    console.log(`  ✅ All vehicle_events have valid vehicle_id`)
  }

  // Check vehicle_images → vehicles
  const { data: imageCheck } = await supabase
    .from('vehicle_images')
    .select('id')
    .not('vehicle_id', 'in', `(SELECT id FROM vehicles)`)
    .limit(1)

  if (imageCheck && imageCheck.length > 0) {
    console.log(`  ❌ Found vehicle_images with invalid vehicle_id`)
    issues++
  } else {
    console.log(`  ✅ All vehicle_images have valid vehicle_id`)
  }

  // 4. Check for NULL tenant_ids where NOT NULL expected
  console.log('\n🚫 NULL Checks:')
  const criticalTables = ['vehicles', 'vehicle_images', 'photo_metadata']

  for (const table of criticalTables) {
    const { count } = await supabase
      .from(table as any)
      .select('*', { count: 'exact', head: true })
      .is('tenant_id', null)

    if (count && count > 0) {
      console.log(`  ❌ ${table}: Found ${count} rows with NULL tenant_id`)
      issues++
    } else {
      console.log(`  ✅ ${table}: No NULL tenant_ids`)
    }
  }

  // 5. Summary
  console.log('\n' + '='.repeat(50))
  console.log('📋 VALIDATION SUMMARY')
  console.log('='.repeat(50))
  
  if (issues === 0 && warnings === 0) {
    console.log('✅ Database is healthy! No issues found.')
    console.log('\n✨ Safe to deploy to production.')
    return 0
  } else {
    if (issues > 0) {
      console.log(`❌ Found ${issues} critical issue(s)`)
      console.log('⚠️  DO NOT deploy to production until fixed!')
    }
    if (warnings > 0) {
      console.log(`⚠️  Found ${warnings} warning(s)`)
      console.log('📝 Consider fixing these for better security')
    }
    
    console.log('\n🔧 Recommended actions:')
    if (issues > 0) {
      console.log('  1. Run: npm run db:generate-migration add-tenant-isolation <table>')
      console.log('  2. Review and apply migrations')
      console.log('  3. Run: npm run db:validate (again)')
    }
    
    return issues > 0 ? 1 : 0
  }
}

validateDatabase().then(exitCode => {
  process.exit(exitCode)
}).catch(error => {
  console.error('\n❌ Validation failed:', error)
  process.exit(1)
})
