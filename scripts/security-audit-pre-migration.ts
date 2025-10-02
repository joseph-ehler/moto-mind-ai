// Pre-Migration Security Audit
// Analyze current data before applying tenant isolation fixes

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join } from 'path'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface SecurityAuditReport {
  timestamp: string
  critical_vulnerabilities: {
    vehicle_events_missing_tenant_id: number
    reminders_missing_tenant_id: number
    orphaned_vehicle_events: number
    orphaned_reminders: number
  }
  data_integrity: {
    vehicles_with_tenant_id: number
    total_vehicles: number
    tenant_distribution: any[]
  }
  naming_conflicts: {
    vehicles_with_multiple_names: number
    naming_field_analysis: any
  }
  recommendations: string[]
}

async function conductSecurityAudit(): Promise<SecurityAuditReport> {
  console.log('🔍 Starting pre-migration security audit...')
  
  const report: SecurityAuditReport = {
    timestamp: new Date().toISOString(),
    critical_vulnerabilities: {
      vehicle_events_missing_tenant_id: 0,
      reminders_missing_tenant_id: 0,
      orphaned_vehicle_events: 0,
      orphaned_reminders: 0
    },
    data_integrity: {
      vehicles_with_tenant_id: 0,
      total_vehicles: 0,
      tenant_distribution: []
    },
    naming_conflicts: {
      vehicles_with_multiple_names: 0,
      naming_field_analysis: {}
    },
    recommendations: []
  }

  try {
    // 1. Analyze vehicle_events tenant isolation
    console.log('📊 Analyzing vehicle_events tenant isolation...')
    
    const { count: vehicleEventsCount, error: veCountError } = await supabase
      .from('vehicle_events')
      .select('*', { count: 'exact', head: true })
    
    if (veCountError) {
      console.log('⚠️  Could not count vehicle_events:', veCountError.message)
    } else {
      report.critical_vulnerabilities.vehicle_events_missing_tenant_id = vehicleEventsCount || 0
      console.log(`  📈 Found ${vehicleEventsCount} vehicle_events rows without tenant_id`)
    }

    // Check for orphaned vehicle_events (referencing non-existent vehicles)
    const { data: orphanedVE, error: orphanVEError } = await supabase
      .from('vehicle_events')
      .select(`
        id,
        vehicle_id,
        vehicle:vehicles(id, tenant_id)
      `)
      .is('vehicle.id', null)
    
    if (!orphanVEError && orphanedVE) {
      report.critical_vulnerabilities.orphaned_vehicle_events = orphanedVE.length
      console.log(`  ⚠️  Found ${orphanedVE.length} orphaned vehicle_events`)
    }

    // 2. Analyze reminders tenant isolation
    console.log('📊 Analyzing reminders tenant isolation...')
    
    const { count: remindersCount, error: remindersCountError } = await supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
    
    if (remindersCountError) {
      console.log('⚠️  Could not count reminders:', remindersCountError.message)
    } else {
      report.critical_vulnerabilities.reminders_missing_tenant_id = remindersCount || 0
      console.log(`  📈 Found ${remindersCount} reminders rows without tenant_id`)
    }

    // Check for orphaned reminders
    const { data: orphanedReminders, error: orphanRemindersError } = await supabase
      .from('reminders')
      .select(`
        id,
        vehicle_id,
        vehicle:vehicles(id, tenant_id)
      `)
      .is('vehicle.id', null)
    
    if (!orphanRemindersError && orphanedReminders) {
      report.critical_vulnerabilities.orphaned_reminders = orphanedReminders.length
      console.log(`  ⚠️  Found ${orphanedReminders.length} orphaned reminders`)
    }

    // 3. Analyze data integrity baseline
    console.log('📊 Analyzing data integrity baseline...')
    
    const { count: vehiclesCount, error: vehiclesCountError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
    
    const { count: vehiclesWithTenantCount, error: vehiclesWithTenantError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .not('tenant_id', 'is', null)
    
    if (!vehiclesCountError && !vehiclesWithTenantError) {
      report.data_integrity.total_vehicles = vehiclesCount || 0
      report.data_integrity.vehicles_with_tenant_id = vehiclesWithTenantCount || 0
      console.log(`  📈 Vehicles: ${vehiclesWithTenantCount}/${vehiclesCount} have tenant_id`)
    }

    // Get tenant distribution
    const { data: tenantDist, error: tenantDistError } = await supabase
      .from('vehicles')
      .select('tenant_id')
      .not('tenant_id', 'is', null)
    
    if (!tenantDistError && tenantDist) {
      const distribution = tenantDist.reduce((acc: any, row) => {
        acc[row.tenant_id] = (acc[row.tenant_id] || 0) + 1
        return acc
      }, {})
      
      report.data_integrity.tenant_distribution = Object.entries(distribution).map(([tenant_id, count]) => ({
        tenant_id,
        vehicle_count: count
      }))
      
      console.log(`  📊 Tenant distribution:`, report.data_integrity.tenant_distribution)
    }

    // 4. Analyze naming conflicts
    console.log('📊 Analyzing naming field conflicts...')
    
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, label, nickname, display_name')
    
    if (!vehiclesError && vehicles) {
      let conflictCount = 0
      const fieldAnalysis = {
        has_label: 0,
        has_nickname: 0,
        has_display_name: 0,
        label_nickname_different: 0,
        label_display_different: 0,
        nickname_display_different: 0,
        all_three_different: 0
      }
      
      for (const vehicle of vehicles) {
        if (vehicle.label) fieldAnalysis.has_label++
        if (vehicle.nickname) fieldAnalysis.has_nickname++
        if (vehicle.display_name) fieldAnalysis.has_display_name++
        
        const hasConflict = (
          (vehicle.label && vehicle.nickname && vehicle.label !== vehicle.nickname) ||
          (vehicle.label && vehicle.display_name && vehicle.label !== vehicle.display_name) ||
          (vehicle.nickname && vehicle.display_name && vehicle.nickname !== vehicle.display_name)
        )
        
        if (hasConflict) {
          conflictCount++
          
          if (vehicle.label !== vehicle.nickname) fieldAnalysis.label_nickname_different++
          if (vehicle.label !== vehicle.display_name) fieldAnalysis.label_display_different++
          if (vehicle.nickname !== vehicle.display_name) fieldAnalysis.nickname_display_different++
          
          if (vehicle.label && vehicle.nickname && vehicle.display_name &&
              vehicle.label !== vehicle.nickname && 
              vehicle.label !== vehicle.display_name && 
              vehicle.nickname !== vehicle.display_name) {
            fieldAnalysis.all_three_different++
          }
        }
      }
      
      report.naming_conflicts.vehicles_with_multiple_names = conflictCount
      report.naming_conflicts.naming_field_analysis = fieldAnalysis
      
      console.log(`  📊 Naming conflicts: ${conflictCount} vehicles have different values in name fields`)
      console.log(`  📊 Field analysis:`, fieldAnalysis)
    }

    // 5. Generate recommendations
    generateRecommendations(report)

    return report

  } catch (error) {
    console.error('💥 Security audit failed:', error)
    throw error
  }
}

function generateRecommendations(report: SecurityAuditReport) {
  const recommendations: string[] = []
  
  // Critical security recommendations
  if (report.critical_vulnerabilities.vehicle_events_missing_tenant_id > 0) {
    recommendations.push(`🚨 CRITICAL: ${report.critical_vulnerabilities.vehicle_events_missing_tenant_id} vehicle_events rows need tenant_id backfill`)
  }
  
  if (report.critical_vulnerabilities.reminders_missing_tenant_id > 0) {
    recommendations.push(`🚨 CRITICAL: ${report.critical_vulnerabilities.reminders_missing_tenant_id} reminders rows need tenant_id backfill`)
  }
  
  if (report.critical_vulnerabilities.orphaned_vehicle_events > 0) {
    recommendations.push(`⚠️  WARNING: ${report.critical_vulnerabilities.orphaned_vehicle_events} orphaned vehicle_events need cleanup`)
  }
  
  if (report.critical_vulnerabilities.orphaned_reminders > 0) {
    recommendations.push(`⚠️  WARNING: ${report.critical_vulnerabilities.orphaned_reminders} orphaned reminders need cleanup`)
  }
  
  // Data integrity recommendations
  if (report.data_integrity.vehicles_with_tenant_id < report.data_integrity.total_vehicles) {
    const missing = report.data_integrity.total_vehicles - report.data_integrity.vehicles_with_tenant_id
    recommendations.push(`⚠️  WARNING: ${missing} vehicles missing tenant_id`)
  }
  
  // Naming conflict recommendations
  if (report.naming_conflicts.vehicles_with_multiple_names > 0) {
    recommendations.push(`📝 DATA QUALITY: ${report.naming_conflicts.vehicles_with_multiple_names} vehicles have naming conflicts requiring manual review`)
  }
  
  if (report.naming_conflicts.naming_field_analysis.all_three_different > 0) {
    recommendations.push(`🚨 DATA LOSS RISK: ${report.naming_conflicts.naming_field_analysis.all_three_different} vehicles have completely different values in all three name fields`)
  }
  
  report.recommendations = recommendations
}

async function main() {
  try {
    console.log('🚀 Starting MotoMind Security Audit (Pre-Migration)...\n')
    
    const report = await conductSecurityAudit()
    
    // Save audit report
    const outputPath = join(process.cwd(), 'docs/security-audit-pre-migration.json')
    writeFileSync(outputPath, JSON.stringify(report, null, 2))
    
    console.log(`\n📄 Security audit report saved to: ${outputPath}`)
    
    // Print critical findings
    console.log('\n🚨 CRITICAL SECURITY FINDINGS:')
    report.recommendations.forEach(rec => {
      console.log(`  ${rec}`)
    })
    
    console.log('\n📊 SUMMARY:')
    console.log(`  • vehicle_events without tenant_id: ${report.critical_vulnerabilities.vehicle_events_missing_tenant_id}`)
    console.log(`  • reminders without tenant_id: ${report.critical_vulnerabilities.reminders_missing_tenant_id}`)
    console.log(`  • Orphaned vehicle_events: ${report.critical_vulnerabilities.orphaned_vehicle_events}`)
    console.log(`  • Orphaned reminders: ${report.critical_vulnerabilities.orphaned_reminders}`)
    console.log(`  • Vehicles with naming conflicts: ${report.naming_conflicts.vehicles_with_multiple_names}`)
    
    if (report.critical_vulnerabilities.vehicle_events_missing_tenant_id > 0 || 
        report.critical_vulnerabilities.reminders_missing_tenant_id > 0) {
      console.log('\n🚨 IMMEDIATE ACTION REQUIRED: Tenant isolation vulnerabilities detected!')
      console.log('   Proceed with tenant_id backfill migrations immediately.')
    } else {
      console.log('\n✅ No critical tenant isolation vulnerabilities found.')
    }
    
    console.log('\n✅ Pre-migration security audit complete!')
    
  } catch (error) {
    console.error('💥 Audit failed:', error)
    process.exit(1)
  }
}

main()
