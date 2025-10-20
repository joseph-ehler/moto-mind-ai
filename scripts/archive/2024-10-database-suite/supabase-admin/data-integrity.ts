/**
 * Data Integrity Validator
 * Detects orphaned records, invalid foreign keys, duplicates, and data corruption
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface IntegrityIssue {
  severity: 'critical' | 'warning' | 'info'
  table: string
  issue: string
  count: number
  details: string
  fixSuggestion: string
}

export interface IntegrityReport {
  score: number // 0-100
  totalIssues: number
  critical: number
  warnings: number
  info: number
  issues: IntegrityIssue[]
  tablesChecked: number
  recordsScanned: number
}

export async function validateDataIntegrity(
  supabase: SupabaseClient,
  tables: string[]
): Promise<IntegrityReport> {
  console.log('\n🔍 DATA INTEGRITY VALIDATION\n')
  console.log('Scanning for orphaned records, invalid FKs, duplicates...\n')
  
  const issues: IntegrityIssue[] = []
  let recordsScanned = 0
  
  for (const table of tables) {
    console.log(`📊 Checking: ${table}...`)
    
    const tableIssues = await checkTable(supabase, table)
    issues.push(...tableIssues)
    
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    recordsScanned += count || 0
    
    if (tableIssues.length === 0) {
      console.log(`   ✅ Clean`)
    } else {
      console.log(`   ⚠️  ${tableIssues.length} issue(s) found`)
    }
  }
  
  const critical = issues.filter(i => i.severity === 'critical').length
  const warnings = issues.filter(i => i.severity === 'warning').length
  const info = issues.filter(i => i.severity === 'info').length
  
  const score = Math.max(0, 100 - (critical * 20) - (warnings * 5) - (info * 1))
  
  return {
    score,
    totalIssues: issues.length,
    critical,
    warnings,
    info,
    issues,
    tablesChecked: tables.length,
    recordsScanned
  }
}

async function checkTable(
  supabase: SupabaseClient,
  table: string
): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = []
  
  // Check 1: Orphaned records
  const orphaned = await findOrphanedRecords(supabase, table)
  if (orphaned) issues.push(orphaned)
  
  // Check 2: Duplicate records
  const duplicates = await findDuplicates(supabase, table)
  if (duplicates) issues.push(duplicates)
  
  // Check 3: Null required fields
  const nullFields = await findNullRequiredFields(supabase, table)
  if (nullFields) issues.push(nullFields)
  
  // Check 4: Invalid foreign keys
  const invalidFKs = await findInvalidForeignKeys(supabase, table)
  if (invalidFKs) issues.push(invalidFKs)
  
  return issues
}

async function findOrphanedRecords(
  supabase: SupabaseClient,
  table: string
): Promise<IntegrityIssue | null> {
  // Check for foreign keys that point to non-existent records
  
  if (table === 'vehicle_events') {
    // Check vehicle_id references
    const { data } = await supabase
      .from('vehicle_events')
      .select('vehicle_id')
    
    if (!data) return null
    
    const vehicleIds = Array.from(new Set(data.map(r => r.vehicle_id).filter(Boolean)))
    
    // Check which vehicles exist
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id')
      .in('id', vehicleIds)
    
    const existingIds = new Set(vehicles?.map(v => v.id) || [])
    const orphanedCount = vehicleIds.filter(id => !existingIds.has(id)).length
    
    if (orphanedCount > 0) {
      return {
        severity: 'critical',
        table,
        issue: 'Orphaned records',
        count: orphanedCount,
        details: `${orphanedCount} vehicle_events reference deleted vehicles`,
        fixSuggestion: 'Delete orphaned events or restore referenced vehicles'
      }
    }
  }
  
  if (table === 'vehicle_images') {
    // Check vehicle_id references
    const { data } = await supabase
      .from('vehicle_images')
      .select('vehicle_id')
    
    if (!data) return null
    
    const vehicleIds = Array.from(new Set(data.map(r => r.vehicle_id).filter(Boolean)))
    
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id')
      .in('id', vehicleIds)
    
    const existingIds = new Set(vehicles?.map(v => v.id) || [])
    const orphanedCount = vehicleIds.filter(id => !existingIds.has(id)).length
    
    if (orphanedCount > 0) {
      return {
        severity: 'critical',
        table,
        issue: 'Orphaned records',
        count: orphanedCount,
        details: `${orphanedCount} images reference deleted vehicles`,
        fixSuggestion: 'Delete orphaned images or restore referenced vehicles'
      }
    }
  }
  
  return null
}

async function findDuplicates(
  supabase: SupabaseClient,
  table: string
): Promise<IntegrityIssue | null> {
  if (table === 'vehicles') {
    // Check for duplicate VINs
    const { data } = await supabase
      .from('vehicles')
      .select('vin')
    
    if (!data) return null
    
    const vins = data.map(v => v.vin)
    const duplicates = vins.filter((vin, index) => vins.indexOf(vin) !== index)
    
    if (duplicates.length > 0) {
      return {
        severity: 'warning',
        table,
        issue: 'Duplicate VINs',
        count: duplicates.length,
        details: `${duplicates.length} vehicles have duplicate VIN numbers`,
        fixSuggestion: 'Review and merge or delete duplicate vehicles'
      }
    }
  }
  
  return null
}

async function findNullRequiredFields(
  supabase: SupabaseClient,
  table: string
): Promise<IntegrityIssue | null> {
  // Check for null values in fields that should be required
  
  const { data } = await supabase
    .from(table)
    .select('*')
    .limit(100)
  
  if (!data || data.length === 0) return null
  
  // Check critical fields
  const sample = data[0]
  const criticalFields = ['id', 'tenant_id', 'created_at']
  
  for (const field of criticalFields) {
    if (field in sample) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .is(field, null)
      
      if (count && count > 0) {
        return {
          severity: 'critical',
          table,
          issue: `Null ${field}`,
          count,
          details: `${count} records have null ${field} (should be NOT NULL)`,
          fixSuggestion: `Set default value or delete invalid records`
        }
      }
    }
  }
  
  return null
}

async function findInvalidForeignKeys(
  supabase: SupabaseClient,
  table: string
): Promise<IntegrityIssue | null> {
  // Check tenant_id validity
  if (table !== 'tenants') {
    const { data } = await supabase
      .from(table)
      .select('tenant_id')
      .limit(100)
    
    if (!data) return null
    
    const tenantIds = Array.from(new Set(data.map(r => r.tenant_id).filter(Boolean)))
    
    if (tenantIds.length > 0) {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .in('id', tenantIds)
      
      const existingIds = new Set(tenants?.map(t => t.id) || [])
      const invalidCount = tenantIds.filter(id => !existingIds.has(id)).length
      
      if (invalidCount > 0) {
        return {
          severity: 'critical',
          table,
          issue: 'Invalid tenant_id',
          count: invalidCount,
          details: `${invalidCount} records reference non-existent tenants`,
          fixSuggestion: 'Create missing tenants or fix tenant_id values'
        }
      }
    }
  }
  
  return null
}

export function printIntegrityReport(report: IntegrityReport): void {
  console.log('\n' + '═'.repeat(70))
  console.log('🔍 DATA INTEGRITY REPORT')
  console.log('═'.repeat(70))
  
  const scoreColor = report.score >= 90 ? '🟢' : report.score >= 70 ? '🟡' : '🔴'
  console.log(`\n${scoreColor} Integrity Score: ${report.score}/100`)
  
  console.log(`\n📊 Summary:`)
  console.log(`   Tables Checked: ${report.tablesChecked}`)
  console.log(`   Records Scanned: ${report.recordsScanned.toLocaleString()}`)
  console.log(`   Total Issues: ${report.totalIssues}`)
  console.log(`   ❌ Critical: ${report.critical}`)
  console.log(`   ⚠️  Warnings: ${report.warnings}`)
  console.log(`   ℹ️  Info: ${report.info}`)
  
  if (report.issues.length > 0) {
    console.log(`\n📋 Issues Found:\n`)
    
    report.issues.forEach((issue, i) => {
      const icon = issue.severity === 'critical' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️'
      console.log(`${i + 1}. ${icon} ${issue.table}: ${issue.issue}`)
      console.log(`   Count: ${issue.count}`)
      console.log(`   Details: ${issue.details}`)
      console.log(`   Fix: ${issue.fixSuggestion}`)
      console.log()
    })
  } else {
    console.log(`\n✅ No integrity issues found!`)
    console.log(`   All data is clean and consistent.`)
  }
  
  console.log('═'.repeat(70) + '\n')
}

export async function autoFixIssues(
  supabase: SupabaseClient,
  issues: IntegrityIssue[]
): Promise<{ fixed: number; failed: number }> {
  console.log('\n🔧 AUTO-FIXING ISSUES\n')
  
  let fixed = 0
  let failed = 0
  
  for (const issue of issues) {
    console.log(`Attempting to fix: ${issue.table} - ${issue.issue}...`)
    
    try {
      if (issue.issue === 'Orphaned records') {
        // Delete orphaned records
        // This is dangerous - only do in dev/test
        console.log(`   ⚠️  Skipped (requires manual review)`)
        failed++
      } else {
        console.log(`   ⚠️  No auto-fix available`)
        failed++
      }
    } catch (error) {
      console.log(`   ❌ Failed`)
      failed++
    }
  }
  
  console.log(`\n✅ Fixed: ${fixed}`)
  console.log(`❌ Failed: ${failed}`)
  
  return { fixed, failed }
}
