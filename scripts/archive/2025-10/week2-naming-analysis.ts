// Week 2: Comprehensive Naming Field Analysis
// Deep dive into vehicles table naming patterns and data loss scenarios

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

interface NamingAnalysisReport {
  timestamp: string
  vehicles_analyzed: number
  naming_patterns: {
    has_label: number
    has_nickname: number
    has_display_name: number
    all_three_present: number
    only_label: number
    only_nickname: number
    only_display_name: number
    label_display_same: number
    label_nickname_same: number
    nickname_display_same: number
    all_three_same: number
    all_three_different: number
  }
  data_quality_issues: {
    empty_fields: {
      empty_labels: number
      empty_nicknames: number
      empty_display_names: number
    }
    length_analysis: {
      avg_label_length: number
      avg_nickname_length: number
      avg_display_name_length: number
      max_label_length: number
      max_nickname_length: number
      max_display_name_length: number
    }
    special_characters: {
      labels_with_special_chars: number
      nicknames_with_special_chars: number
      display_names_with_special_chars: number
    }
  }
  consolidation_scenarios: {
    safe_to_use_display_name: number
    safe_to_use_label: number
    requires_manual_review: number
    potential_data_loss: number
  }
  sample_conflicts: any[]
  recommendations: string[]
}

async function analyzeNamingPatterns(): Promise<NamingAnalysisReport> {
  console.log('🔍 Starting comprehensive naming field analysis...')
  
  const report: NamingAnalysisReport = {
    timestamp: new Date().toISOString(),
    vehicles_analyzed: 0,
    naming_patterns: {
      has_label: 0,
      has_nickname: 0,
      has_display_name: 0,
      all_three_present: 0,
      only_label: 0,
      only_nickname: 0,
      only_display_name: 0,
      label_display_same: 0,
      label_nickname_same: 0,
      nickname_display_same: 0,
      all_three_same: 0,
      all_three_different: 0
    },
    data_quality_issues: {
      empty_fields: {
        empty_labels: 0,
        empty_nicknames: 0,
        empty_display_names: 0
      },
      length_analysis: {
        avg_label_length: 0,
        avg_nickname_length: 0,
        avg_display_name_length: 0,
        max_label_length: 0,
        max_nickname_length: 0,
        max_display_name_length: 0
      },
      special_characters: {
        labels_with_special_chars: 0,
        nicknames_with_special_chars: 0,
        display_names_with_special_chars: 0
      }
    },
    consolidation_scenarios: {
      safe_to_use_display_name: 0,
      safe_to_use_label: 0,
      requires_manual_review: 0,
      potential_data_loss: 0
    },
    sample_conflicts: [],
    recommendations: []
  }

  try {
    // Get all vehicles with naming fields
    console.log('📊 Fetching all vehicles with naming fields...')
    
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        label,
        nickname, 
        display_name,
        make,
        model,
        created_at
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch vehicles: ${error.message}`)
    }
    
    if (!vehicles || vehicles.length === 0) {
      console.log('⚠️  No vehicles found in database')
      return report
    }
    
    report.vehicles_analyzed = vehicles.length
    console.log(`📊 Analyzing ${vehicles.length} vehicles...`)
    
    // Analyze each vehicle
    const labelLengths: number[] = []
    const nicknameLengths: number[] = []
    const displayNameLengths: number[] = []
    
    for (const vehicle of vehicles) {
      // Pattern analysis
      const hasLabel = !!vehicle.label
      const hasNickname = !!vehicle.nickname
      const hasDisplayName = !!vehicle.display_name
      
      if (hasLabel) report.naming_patterns.has_label++
      if (hasNickname) report.naming_patterns.has_nickname++
      if (hasDisplayName) report.naming_patterns.has_display_name++
      
      // Combination patterns
      if (hasLabel && hasNickname && hasDisplayName) {
        report.naming_patterns.all_three_present++
      }
      
      if (hasLabel && !hasNickname && !hasDisplayName) {
        report.naming_patterns.only_label++
      }
      
      if (!hasLabel && hasNickname && !hasDisplayName) {
        report.naming_patterns.only_nickname++
      }
      
      if (!hasLabel && !hasNickname && hasDisplayName) {
        report.naming_patterns.only_display_name++
      }
      
      // Comparison analysis
      if (hasLabel && hasDisplayName && vehicle.label === vehicle.display_name) {
        report.naming_patterns.label_display_same++
      }
      
      if (hasLabel && hasNickname && vehicle.label === vehicle.nickname) {
        report.naming_patterns.label_nickname_same++
      }
      
      if (hasNickname && hasDisplayName && vehicle.nickname === vehicle.display_name) {
        report.naming_patterns.nickname_display_same++
      }
      
      if (hasLabel && hasNickname && hasDisplayName && 
          vehicle.label === vehicle.nickname && 
          vehicle.label === vehicle.display_name) {
        report.naming_patterns.all_three_same++
      }
      
      if (hasLabel && hasNickname && hasDisplayName &&
          vehicle.label !== vehicle.nickname &&
          vehicle.label !== vehicle.display_name &&
          vehicle.nickname !== vehicle.display_name) {
        report.naming_patterns.all_three_different++
        
        // Add to sample conflicts for review
        if (report.sample_conflicts.length < 10) {
          report.sample_conflicts.push({
            id: vehicle.id,
            label: vehicle.label,
            nickname: vehicle.nickname,
            display_name: vehicle.display_name,
            make: vehicle.make,
            model: vehicle.model
          })
        }
      }
      
      // Length analysis
      if (vehicle.label) {
        labelLengths.push(vehicle.label.length)
        report.data_quality_issues.length_analysis.max_label_length = Math.max(
          report.data_quality_issues.length_analysis.max_label_length,
          vehicle.label.length
        )
      } else {
        report.data_quality_issues.empty_fields.empty_labels++
      }
      
      if (vehicle.nickname) {
        nicknameLengths.push(vehicle.nickname.length)
        report.data_quality_issues.length_analysis.max_nickname_length = Math.max(
          report.data_quality_issues.length_analysis.max_nickname_length,
          vehicle.nickname.length
        )
      } else {
        report.data_quality_issues.empty_fields.empty_nicknames++
      }
      
      if (vehicle.display_name) {
        displayNameLengths.push(vehicle.display_name.length)
        report.data_quality_issues.length_analysis.max_display_name_length = Math.max(
          report.data_quality_issues.length_analysis.max_display_name_length,
          vehicle.display_name.length
        )
      } else {
        report.data_quality_issues.empty_fields.empty_display_names++
      }
      
      // Special character analysis
      const specialCharRegex = /[^a-zA-Z0-9\s\-]/
      
      if (vehicle.label && specialCharRegex.test(vehicle.label)) {
        report.data_quality_issues.special_characters.labels_with_special_chars++
      }
      
      if (vehicle.nickname && specialCharRegex.test(vehicle.nickname)) {
        report.data_quality_issues.special_characters.nicknames_with_special_chars++
      }
      
      if (vehicle.display_name && specialCharRegex.test(vehicle.display_name)) {
        report.data_quality_issues.special_characters.display_names_with_special_chars++
      }
      
      // Consolidation scenario analysis
      if (hasDisplayName && (!hasLabel || vehicle.display_name === vehicle.label) && 
          (!hasNickname || vehicle.display_name === vehicle.nickname)) {
        report.consolidation_scenarios.safe_to_use_display_name++
      } else if (hasLabel && (!hasDisplayName || vehicle.label === vehicle.display_name) && 
                 (!hasNickname || vehicle.label === vehicle.nickname)) {
        report.consolidation_scenarios.safe_to_use_label++
      } else if (hasLabel && hasNickname && hasDisplayName && 
                 (vehicle.label !== vehicle.nickname || 
                  vehicle.label !== vehicle.display_name || 
                  vehicle.nickname !== vehicle.display_name)) {
        report.consolidation_scenarios.requires_manual_review++
        
        // Check if this would cause data loss
        const uniqueValues = new Set([vehicle.label, vehicle.nickname, vehicle.display_name].filter(Boolean))
        if (uniqueValues.size > 1) {
          report.consolidation_scenarios.potential_data_loss++
        }
      }
    }
    
    // Calculate averages
    if (labelLengths.length > 0) {
      report.data_quality_issues.length_analysis.avg_label_length = 
        labelLengths.reduce((a, b) => a + b, 0) / labelLengths.length
    }
    
    if (nicknameLengths.length > 0) {
      report.data_quality_issues.length_analysis.avg_nickname_length = 
        nicknameLengths.reduce((a, b) => a + b, 0) / nicknameLengths.length
    }
    
    if (displayNameLengths.length > 0) {
      report.data_quality_issues.length_analysis.avg_display_name_length = 
        displayNameLengths.reduce((a, b) => a + b, 0) / displayNameLengths.length
    }
    
    // Generate recommendations
    generateConsolidationRecommendations(report)
    
    return report
    
  } catch (error) {
    console.error('💥 Naming analysis failed:', error)
    throw error
  }
}

function generateConsolidationRecommendations(report: NamingAnalysisReport) {
  const recommendations: string[] = []
  
  // Overall assessment
  if (report.naming_patterns.all_three_different > 0) {
    recommendations.push(`🚨 CRITICAL: ${report.naming_patterns.all_three_different} vehicles have completely different values in all three name fields - requires manual review`)
  }
  
  if (report.consolidation_scenarios.potential_data_loss > 0) {
    recommendations.push(`⚠️  DATA LOSS RISK: ${report.consolidation_scenarios.potential_data_loss} vehicles would lose information during automatic consolidation`)
  }
  
  // Safe consolidation scenarios
  if (report.consolidation_scenarios.safe_to_use_display_name > 0) {
    recommendations.push(`✅ SAFE: ${report.consolidation_scenarios.safe_to_use_display_name} vehicles can safely use display_name as canonical field`)
  }
  
  if (report.consolidation_scenarios.safe_to_use_label > 0) {
    recommendations.push(`✅ SAFE: ${report.consolidation_scenarios.safe_to_use_label} vehicles can safely use label as canonical field`)
  }
  
  // Field usage patterns
  const totalVehicles = report.vehicles_analyzed
  const displayNameUsage = (report.naming_patterns.has_display_name / totalVehicles) * 100
  const labelUsage = (report.naming_patterns.has_label / totalVehicles) * 100
  const nicknameUsage = (report.naming_patterns.has_nickname / totalVehicles) * 100
  
  recommendations.push(`📊 USAGE: display_name (${displayNameUsage.toFixed(1)}%), label (${labelUsage.toFixed(1)}%), nickname (${nicknameUsage.toFixed(1)}%)`)
  
  // Consolidation strategy
  if (report.naming_patterns.all_three_same === totalVehicles) {
    recommendations.push(`🎯 STRATEGY: All vehicles have identical values - safe to drop label and nickname fields`)
  } else if (report.consolidation_scenarios.requires_manual_review > 0) {
    recommendations.push(`🎯 STRATEGY: Implement staged migration with manual review for ${report.consolidation_scenarios.requires_manual_review} vehicles`)
  } else {
    recommendations.push(`🎯 STRATEGY: Automatic consolidation appears safe for most vehicles`)
  }
  
  // Data quality recommendations
  if (report.data_quality_issues.special_characters.labels_with_special_chars > 0 ||
      report.data_quality_issues.special_characters.nicknames_with_special_chars > 0 ||
      report.data_quality_issues.special_characters.display_names_with_special_chars > 0) {
    recommendations.push(`🔧 CLEANUP: Some vehicle names contain special characters - consider normalization`)
  }
  
  report.recommendations = recommendations
}

async function main() {
  try {
    console.log('🚀 Week 2: MotoMind Naming Field Analysis')
    console.log('🎯 Analyzing data loss scenarios and consolidation safety')
    
    const report = await analyzeNamingPatterns()
    
    // Save detailed report
    const outputPath = join(process.cwd(), 'docs/week2-naming-analysis.json')
    writeFileSync(outputPath, JSON.stringify(report, null, 2))
    
    console.log(`\n📄 Detailed analysis saved to: ${outputPath}`)
    
    // Print key findings
    console.log('\n📊 KEY FINDINGS:')
    console.log(`📋 Vehicles analyzed: ${report.vehicles_analyzed}`)
    console.log(`📊 Field usage: display_name (${report.naming_patterns.has_display_name}), label (${report.naming_patterns.has_label}), nickname (${report.naming_patterns.has_nickname})`)
    console.log(`🔍 All three different: ${report.naming_patterns.all_three_different}`)
    console.log(`⚠️  Potential data loss: ${report.consolidation_scenarios.potential_data_loss}`)
    console.log(`✅ Safe consolidation: ${report.consolidation_scenarios.safe_to_use_display_name + report.consolidation_scenarios.safe_to_use_label}`)
    
    if (report.sample_conflicts.length > 0) {
      console.log('\n🔍 SAMPLE CONFLICTS:')
      report.sample_conflicts.slice(0, 3).forEach(conflict => {
        console.log(`  • ${conflict.make} ${conflict.model}:`)
        console.log(`    - label: "${conflict.label}"`)
        console.log(`    - nickname: "${conflict.nickname}"`)
        console.log(`    - display_name: "${conflict.display_name}"`)
      })
    }
    
    console.log('\n💡 RECOMMENDATIONS:')
    report.recommendations.forEach(rec => {
      console.log(`  ${rec}`)
    })
    
    console.log('\n✅ Week 2 naming analysis complete!')
    
  } catch (error) {
    console.error('💥 Analysis failed:', error)
    process.exit(1)
  }
}

main()
