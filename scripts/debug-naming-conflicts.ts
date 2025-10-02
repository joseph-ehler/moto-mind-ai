// Debug Naming Conflicts
// Investigate why identical-looking strings are being detected as different

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

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

async function debugNamingConflicts() {
  console.log('🔍 Debugging naming field conflicts...')
  
  try {
    // Get all vehicles with detailed comparison
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('id, label, nickname, display_name')
    
    if (error) {
      throw new Error(`Failed to fetch vehicles: ${error.message}`)
    }
    
    if (!vehicles) {
      console.log('No vehicles found')
      return
    }
    
    console.log(`\n📊 Analyzing ${vehicles.length} vehicles for naming conflicts...\n`)
    
    for (const vehicle of vehicles) {
      console.log(`🚗 Vehicle: ${vehicle.id}`)
      console.log(`  label: "${vehicle.label}" (length: ${vehicle.label?.length || 0})`)
      console.log(`  nickname: "${vehicle.nickname}" (length: ${vehicle.nickname?.length || 0})`)
      console.log(`  display_name: "${vehicle.display_name}" (length: ${vehicle.display_name?.length || 0})`)
      
      // Check exact equality
      const labelDisplaySame = vehicle.label === vehicle.display_name
      const labelNicknameSame = vehicle.label === vehicle.nickname
      const nicknameDisplaySame = vehicle.nickname === vehicle.display_name
      
      console.log(`  Comparisons:`)
      console.log(`    label === display_name: ${labelDisplaySame}`)
      console.log(`    label === nickname: ${labelNicknameSame}`)
      console.log(`    nickname === display_name: ${nicknameDisplaySame}`)
      
      // Check for null/undefined differences
      console.log(`  Null checks:`)
      console.log(`    label is null: ${vehicle.label === null}`)
      console.log(`    nickname is null: ${vehicle.nickname === null}`)
      console.log(`    display_name is null: ${vehicle.display_name === null}`)
      
      // Check character codes for hidden differences
      if (vehicle.label && vehicle.display_name && vehicle.label !== vehicle.display_name) {
        console.log(`  Character analysis:`)
        console.log(`    label chars: ${vehicle.label.split('').map(c => c.charCodeAt(0)).join(', ')}`)
        console.log(`    display_name chars: ${vehicle.display_name.split('').map(c => c.charCodeAt(0)).join(', ')}`)
      }
      
      // Determine consolidation safety
      let consolidationStatus = 'SAFE'
      let reason = 'All fields match or are null'
      
      if (vehicle.label && vehicle.display_name && vehicle.label !== vehicle.display_name) {
        consolidationStatus = 'CONFLICT'
        reason = 'label != display_name'
      } else if (vehicle.nickname && vehicle.display_name && vehicle.nickname !== vehicle.display_name) {
        consolidationStatus = 'CONFLICT'
        reason = 'nickname != display_name'
      } else if (vehicle.label && vehicle.nickname && vehicle.label !== vehicle.nickname) {
        consolidationStatus = 'REVIEW'
        reason = 'label != nickname (but both match display_name)'
      }
      
      console.log(`  Status: ${consolidationStatus} (${reason})`)
      console.log('')
    }
    
    // Summary analysis
    console.log('📊 SUMMARY ANALYSIS:')
    
    const conflicts = vehicles.filter(v => 
      (v.label && v.display_name && v.label !== v.display_name) ||
      (v.nickname && v.display_name && v.nickname !== v.display_name)
    )
    
    const safeConsolidation = vehicles.filter(v => 
      (!v.label || !v.display_name || v.label === v.display_name) &&
      (!v.nickname || !v.display_name || v.nickname === v.display_name)
    )
    
    console.log(`Total vehicles: ${vehicles.length}`)
    console.log(`Conflicts detected: ${conflicts.length}`)
    console.log(`Safe for consolidation: ${safeConsolidation.length}`)
    
    if (conflicts.length === 0) {
      console.log('\n✅ NO CONFLICTS: Safe to proceed with consolidation')
      
      // Test the SQL query that was failing
      console.log('\n🔍 Testing SQL conflict detection query...')
      
      const { data: sqlConflicts, error: sqlError } = await supabase
        .from('vehicles')
        .select('id, label, display_name')
        .neq('label', 'display_name')
      
      if (sqlError) {
        console.log('❌ SQL query failed:', sqlError.message)
      } else {
        console.log(`SQL query found ${sqlConflicts?.length || 0} conflicts`)
        if (sqlConflicts && sqlConflicts.length > 0) {
          console.log('🔍 SQL-detected conflicts:')
          sqlConflicts.forEach(v => {
            console.log(`  • ${v.id}: "${v.label}" vs "${v.display_name}"`)
          })
        }
      }
    } else {
      console.log('\n⚠️  CONFLICTS FOUND: Manual review required')
      console.log('Conflicting vehicles:')
      conflicts.forEach(v => {
        console.log(`  • ${v.id}: label="${v.label}" display_name="${v.display_name}"`)
      })
    }
    
  } catch (error) {
    console.error('💥 Debug analysis failed:', error)
  }
}

async function main() {
  try {
    console.log('🚀 MotoMind Naming Conflict Debug Analysis')
    
    await debugNamingConflicts()
    
    console.log('\n✅ Debug analysis complete!')
    
  } catch (error) {
    console.error('💥 Debug failed:', error)
    process.exit(1)
  }
}

main()
