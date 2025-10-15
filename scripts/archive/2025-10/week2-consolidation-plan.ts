// Week 2: Safe Naming Field Consolidation Plan
// Creates production-safe migration to consolidate label/nickname into display_name

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

interface ConsolidationPlan {
  timestamp: string
  analysis_summary: {
    total_vehicles: number
    safe_consolidation: number
    zero_data_loss: boolean
    recommended_strategy: string
  }
  migration_phases: {
    phase: string
    description: string
    sql_commands: string[]
    validation_queries: string[]
    rollback_commands: string[]
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  }[]
  pre_migration_checks: string[]
  post_migration_validation: string[]
  user_impact_assessment: {
    api_changes_required: boolean
    ui_changes_required: boolean
    breaking_changes: boolean
    user_visible_changes: boolean
  }
}

async function createConsolidationPlan(): Promise<ConsolidationPlan> {
  console.log('📋 Creating naming field consolidation plan...')
  
  const plan: ConsolidationPlan = {
    timestamp: new Date().toISOString(),
    analysis_summary: {
      total_vehicles: 5,
      safe_consolidation: 5,
      zero_data_loss: true,
      recommended_strategy: 'Automatic consolidation using display_name as canonical field'
    },
    migration_phases: [
      {
        phase: 'Phase 1: Pre-Migration Validation',
        description: 'Verify current state and create backup validation',
        sql_commands: [
          '-- Verify no data loss scenarios exist',
          'SELECT COUNT(*) as vehicles_with_conflicts FROM vehicles WHERE label != display_name OR (nickname IS NOT NULL AND nickname != display_name);',
          '',
          '-- Create backup of current naming state',
          'CREATE TABLE IF NOT EXISTS vehicles_naming_backup AS SELECT id, label, nickname, display_name, created_at FROM vehicles;'
        ],
        validation_queries: [
          'SELECT COUNT(*) FROM vehicles_naming_backup;',
          'SELECT COUNT(*) FROM vehicles WHERE label IS DISTINCT FROM display_name;'
        ],
        rollback_commands: [
          'DROP TABLE IF EXISTS vehicles_naming_backup;'
        ],
        risk_level: 'LOW'
      },
      {
        phase: 'Phase 2: Update Application Code',
        description: 'Update all application code to use display_name exclusively',
        sql_commands: [
          '-- No SQL changes in this phase',
          '-- This phase involves updating TypeScript interfaces and components'
        ],
        validation_queries: [
          '-- Verify APIs still work',
          'SELECT id, display_name FROM vehicles LIMIT 3;'
        ],
        rollback_commands: [
          '-- Revert application code changes if needed'
        ],
        risk_level: 'LOW'
      },
      {
        phase: 'Phase 3: Remove Redundant Columns (Safe)',
        description: 'Drop label and nickname columns after confirming no usage',
        sql_commands: [
          '-- Add comment to mark columns as deprecated',
          'COMMENT ON COLUMN vehicles.label IS \'DEPRECATED: Use display_name instead. Will be removed in next release.\';',
          'COMMENT ON COLUMN vehicles.nickname IS \'DEPRECATED: Use display_name instead. Will be removed in next release.\';',
          '',
          '-- After 7-14 days of monitoring, drop the columns',
          '-- ALTER TABLE vehicles DROP COLUMN label;',
          '-- ALTER TABLE vehicles DROP COLUMN nickname;'
        ],
        validation_queries: [
          'SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = \'vehicles\' AND column_name IN (\'label\', \'nickname\', \'display_name\');'
        ],
        rollback_commands: [
          '-- Restore from backup if needed',
          'UPDATE vehicles SET label = b.label, nickname = b.nickname FROM vehicles_naming_backup b WHERE vehicles.id = b.id;'
        ],
        risk_level: 'LOW'
      }
    ],
    pre_migration_checks: [
      'Verify all vehicles have display_name populated',
      'Confirm no data loss scenarios exist (label != display_name)',
      'Check that all application code uses display_name',
      'Ensure backup table is created successfully',
      'Validate API endpoints return correct data'
    ],
    post_migration_validation: [
      'Verify all vehicles still accessible via API',
      'Check that UI displays vehicle names correctly',
      'Confirm no application errors in logs',
      'Validate that display_name contains expected values',
      'Test vehicle creation and updates work correctly'
    ],
    user_impact_assessment: {
      api_changes_required: false, // APIs already use display_name
      ui_changes_required: false,  // UI components already use display_name
      breaking_changes: false,     // No breaking changes
      user_visible_changes: false // No user-visible changes
    }
  }
  
  return plan
}

async function generateMigrationSQL(): Promise<string> {
  console.log('📝 Generating consolidation migration SQL...')
  
  const migrationSQL = `-- Week 2: Naming Field Consolidation Migration
-- SAFE: Zero data loss risk - all vehicles have identical label/display_name values
-- 
-- ROLLBACK PLAN:
-- UPDATE vehicles SET label = b.label, nickname = b.nickname 
-- FROM vehicles_naming_backup b WHERE vehicles.id = b.id;
-- DROP TABLE vehicles_naming_backup;

-- =============================================================================
-- PHASE 1: PRE-MIGRATION VALIDATION AND BACKUP
-- =============================================================================

-- Verify no data loss scenarios (should return 0)
SELECT 
  COUNT(*) as potential_data_loss_vehicles,
  'If this is > 0, STOP and review manually' as warning
FROM vehicles 
WHERE label IS DISTINCT FROM display_name 
   OR (nickname IS NOT NULL AND nickname IS DISTINCT FROM display_name);

-- Create backup table for safety
CREATE TABLE IF NOT EXISTS vehicles_naming_backup AS 
SELECT 
  id, 
  label, 
  nickname, 
  display_name, 
  created_at,
  now() as backup_created_at
FROM vehicles;

-- Verify backup created successfully
SELECT 
  COUNT(*) as backup_row_count,
  'Should match vehicles table count' as note
FROM vehicles_naming_backup;

-- =============================================================================
-- PHASE 2: MARK COLUMNS AS DEPRECATED (SAFE)
-- =============================================================================

-- Add deprecation comments (safe, no data changes)
COMMENT ON COLUMN vehicles.label IS 
  'DEPRECATED as of Week 2 cleanup: Use display_name instead. Scheduled for removal after monitoring period.';

COMMENT ON COLUMN vehicles.nickname IS 
  'DEPRECATED as of Week 2 cleanup: Use display_name instead. Scheduled for removal after monitoring period.';

COMMENT ON COLUMN vehicles.display_name IS 
  'CANONICAL vehicle name field. Consolidated from label/nickname during Week 2 cleanup.';

-- =============================================================================
-- PHASE 3: VALIDATION QUERIES (RUN THESE TO VERIFY SUCCESS)
-- =============================================================================

-- Verify all vehicles have display_name (should be 5)
SELECT COUNT(*) as vehicles_with_display_name
FROM vehicles 
WHERE display_name IS NOT NULL AND display_name != '';

-- Check for any remaining conflicts (should be 0)
SELECT COUNT(*) as remaining_conflicts
FROM vehicles 
WHERE label IS DISTINCT FROM display_name;

-- Sample of current naming state
SELECT 
  id,
  label,
  nickname,
  display_name,
  CASE 
    WHEN label = display_name THEN 'SAFE'
    ELSE 'REVIEW'
  END as consolidation_status
FROM vehicles 
ORDER BY created_at DESC
LIMIT 5;

-- Success message
SELECT 'Week 2 naming consolidation: PHASE 1-2 COMPLETE - Ready for monitoring period' as status;

-- =============================================================================
-- PHASE 4: COLUMN REMOVAL (EXECUTE AFTER 7-14 DAYS OF MONITORING)
-- =============================================================================

-- ONLY RUN THESE AFTER CONFIRMING NO APPLICATION ERRORS FOR 1-2 WEEKS:

-- DROP COLUMN label;
-- DROP COLUMN nickname;
-- DROP TABLE vehicles_naming_backup;

-- Final verification after column removal:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'vehicles' AND column_name IN ('label', 'nickname');
-- (Should return no rows)
`
  
  return migrationSQL
}

async function main() {
  try {
    console.log('🚀 Week 2: Naming Field Consolidation Planning')
    console.log('🎯 Creating safe migration plan based on zero data loss analysis')
    
    const plan = await createConsolidationPlan()
    const migrationSQL = await generateMigrationSQL()
    
    // Save consolidation plan
    const planPath = join(process.cwd(), 'docs/week2-consolidation-plan.json')
    writeFileSync(planPath, JSON.stringify(plan, null, 2))
    
    // Save migration SQL
    const sqlPath = join(process.cwd(), 'docs/week2-consolidation-migration.sql')
    writeFileSync(sqlPath, migrationSQL)
    
    console.log(`\n📄 Consolidation plan saved to: ${planPath}`)
    console.log(`📄 Migration SQL saved to: ${sqlPath}`)
    
    // Print summary
    console.log('\n📊 CONSOLIDATION PLAN SUMMARY:')
    console.log(`✅ Total vehicles: ${plan.analysis_summary.total_vehicles}`)
    console.log(`✅ Safe consolidation: ${plan.analysis_summary.safe_consolidation}`)
    console.log(`✅ Zero data loss: ${plan.analysis_summary.zero_data_loss}`)
    console.log(`🎯 Strategy: ${plan.analysis_summary.recommended_strategy}`)
    
    console.log('\n📋 MIGRATION PHASES:')
    plan.migration_phases.forEach((phase, index) => {
      console.log(`  ${index + 1}. ${phase.phase} (${phase.risk_level} risk)`)
      console.log(`     ${phase.description}`)
    })
    
    console.log('\n🎯 USER IMPACT ASSESSMENT:')
    console.log(`  • API changes required: ${plan.user_impact_assessment.api_changes_required ? 'YES' : 'NO'}`)
    console.log(`  • UI changes required: ${plan.user_impact_assessment.ui_changes_required ? 'YES' : 'NO'}`)
    console.log(`  • Breaking changes: ${plan.user_impact_assessment.breaking_changes ? 'YES' : 'NO'}`)
    console.log(`  • User visible changes: ${plan.user_impact_assessment.user_visible_changes ? 'YES' : 'NO'}`)
    
    console.log('\n🚀 NEXT STEPS:')
    console.log('1. Review the migration SQL in docs/week2-consolidation-migration.sql')
    console.log('2. Run Phase 1-2 (safe validation and deprecation comments)')
    console.log('3. Monitor application for 7-14 days')
    console.log('4. Execute Phase 3 (column removal) after monitoring period')
    
    console.log('\n✅ Week 2 consolidation planning complete!')
    
  } catch (error) {
    console.error('💥 Planning failed:', error)
    process.exit(1)
  }
}

main()
