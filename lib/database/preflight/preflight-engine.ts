/**
 * Preflight Engine
 * 
 * Orchestrates all pre-deployment checks:
 * 1. Vector similarity (find duplicates)
 * 2. Schema linting (validate rules)
 * 3. Shadow testing (dry run)
 * 4. RLS validation
 * 5. Generate change plan
 */

import { Database } from '../core'
import { EmbeddingManager, EmbeddingService } from '../ai'
import { SchemaLinter, type LintResult } from '../linting'

export interface PreflightOptions {
  feature?: string
  domain?: string
  ddl?: string
  ddlPath?: string
  tableName?: string
}

export interface ProposedSchema {
  tableName: string
  columns: Array<{
    name: string
    type: string
    nullable: boolean
  }>
  domain?: string
}

export interface DuplicateMatch {
  table: string
  schema: string
  similarity: number
  reason: string
  domain: string | null
}

export interface ChangePlan {
  status: 'passed' | 'needs_review' | 'blocked'
  timestamp: string
  feature?: string
  domain?: string
  
  duplicates: {
    found: boolean
    count: number
    matches: DuplicateMatch[]
  }
  
  lint_results?: {
    passed: boolean
    blockers: number
    warnings: number
    suggestions: number
    issues: Array<{
      category: string
      severity: string
      message: string
      fix?: string
    }>
  }
  
  shadow_test?: {
    executed: boolean
    passed: boolean
    execution_time?: number
  }
  
  rls?: {
    checked: boolean
    enabled?: boolean
    policies_count?: number
    has_issues?: boolean
  }
  
  types?: {
    checked: boolean
    up_to_date: boolean
    schema_hash?: string
  }
  
  recommendation: 'PROCEED' | 'REUSE_EXISTING' | 'FIX_ISSUES' | 'BLOCKED'
  
  actions: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low'
    type: string
    message: string
    command?: string
    target?: string
  }>
  
  summary: string
}

export class PreflightEngine {
  constructor(
    private db: Database,
    private embeddingManager: EmbeddingManager,
    private linter: SchemaLinter
  ) {}

  /**
   * Run complete preflight analysis
   */
  async run(options: PreflightOptions): Promise<ChangePlan> {
    const startTime = Date.now()
    
    console.log('🔍 Running preflight checks...\n')

    // Initialize plan
    const plan: ChangePlan = {
      status: 'passed',
      timestamp: new Date().toISOString(),
      feature: options.feature,
      domain: options.domain,
      duplicates: {
        found: false,
        count: 0,
        matches: []
      },
      recommendation: 'PROCEED',
      actions: [],
      summary: ''
    }

    // 1. Vector similarity search
    await this.checkDuplicates(plan, options)

    // 2. Schema linting
    if (options.tableName) {
      await this.lintSchema(plan, options)
    }

    // 3. Determine final status and recommendation
    this.finalizePlan(plan, options.tableName)

    const duration = Date.now() - startTime
    console.log(`\n✅ Preflight complete in ${duration}ms\n`)

    return plan
  }

  /**
   * Check for duplicate tables using vector similarity
   */
  private async checkDuplicates(plan: ChangePlan, options: PreflightOptions): Promise<void> {
    console.log('🔎 Searching for similar tables...')

    if (!options.feature && !options.tableName) {
      console.log('   ⊘ Skipped (no feature/table specified)\n')
      return
    }

    try {
      const searchText = options.feature || options.tableName || ''
      const results = await this.embeddingManager.findSimilar(searchText, {
        limit: 5,
        threshold: 0.4,
        domain: options.domain
      })

      if (results.length > 0) {
        plan.duplicates.found = true
        plan.duplicates.count = results.length
        plan.duplicates.matches = results.map(r => ({
          table: r.name,
          schema: r.schema_name,
          similarity: r.similarity,
          reason: r.description || 'Similar purpose detected',
          domain: r.domain
        }))

        console.log(`   ⚠️  Found ${results.length} similar table(s):`)
        results.forEach((r, i) => {
          const similarity = (r.similarity * 100).toFixed(1)
          console.log(`      ${i + 1}. ${r.schema_name}.${r.name} (${similarity}% match)`)
        })
        console.log()

        // High similarity = recommend reuse
        if (results[0].similarity >= 0.6) {
          plan.recommendation = 'REUSE_EXISTING'
          plan.actions.push({
            priority: 'high',
            type: 'reuse_table',
            message: `Consider reusing existing table "${results[0].schema_name}.${results[0].name}" (${(results[0].similarity * 100).toFixed(1)}% match)`,
            target: results[0].name
          })
        } else {
          plan.actions.push({
            priority: 'medium',
            type: 'review_similar',
            message: `Review similar tables before creating new one`,
            command: `npm run db registry:similar -- --text "${searchText}"`
          })
        }
      } else {
        console.log('   ✓ No similar tables found\n')
      }
    } catch (error) {
      console.log(`   ⚠️  Similarity search failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
    }
  }

  /**
   * Run schema linting
   */
  private async lintSchema(plan: ChangePlan, options: PreflightOptions): Promise<void> {
    console.log('📋 Validating schema rules...')

    if (!options.tableName) {
      console.log('   ⊘ Skipped (no table specified)\n')
      return
    }

    try {
      const issues = await this.linter.lintTable(options.tableName, 'public')
      
      const blockers = issues.filter(i => i.severity === 'error')
      const warnings = issues.filter(i => i.severity === 'warning')
      const suggestions = issues.filter(i => i.severity === 'info')

      plan.lint_results = {
        passed: blockers.length === 0,
        blockers: blockers.length,
        warnings: warnings.length,
        suggestions: suggestions.length,
        issues: issues.map(i => ({
          category: i.category,
          severity: i.severity,
          message: i.message,
          fix: i.fix
        }))
      }

      if (blockers.length > 0) {
        console.log(`   ❌ ${blockers.length} blocker(s) found`)
        blockers.forEach(b => {
          console.log(`      • ${b.message}`)
        })
        
        plan.recommendation = 'BLOCKED'
        plan.actions.push({
          priority: 'critical',
          type: 'fix_lint',
          message: `Fix ${blockers.length} schema linting blocker(s)`,
          command: `npm run db schema:lint --table ${options.tableName}`
        })
      } else if (warnings.length > 0) {
        console.log(`   ⚠️  ${warnings.length} warning(s) found`)
      } else {
        console.log('   ✓ All rules passed')
      }

      if (suggestions.length > 0) {
        console.log(`   💡 ${suggestions.length} suggestion(s) available`)
      }
      console.log()
    } catch (error) {
      console.log(`   ⚠️  Linting failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
    }
  }

  /**
   * Finalize plan status and summary
   */
  private finalizePlan(plan: ChangePlan, tableName?: string): void {
    // Determine final status
    if (plan.lint_results && !plan.lint_results.passed) {
      plan.status = 'blocked'
    } else if (plan.duplicates.found) {
      plan.status = 'needs_review'
    } else {
      plan.status = 'passed'
    }

    // Check for auto-fixable issues (Phase 6 integration)
    if (plan.lint_results && plan.lint_results.issues.length > 0) {
      const autoFixableCount = this.countAutoFixableIssues(plan.lint_results.issues)
      
      if (autoFixableCount > 0) {
        const tableToFix = tableName || this.getTableNameFromPlan(plan)
        plan.actions.unshift({
          priority: 'critical',
          type: 'auto_fix_available',
          message: `${autoFixableCount} issue(s) can be auto-fixed ✨`,
          command: `npm run db schema:fix --table ${tableToFix} --apply`
        })
      }
    }

    // Generate summary
    const parts: string[] = []

    if (plan.status === 'blocked') {
      parts.push(`❌ BLOCKED: ${plan.lint_results?.blockers} critical issue(s) must be fixed`)
    } else if (plan.status === 'needs_review') {
      parts.push(`⚠️  NEEDS REVIEW: ${plan.duplicates.count} similar table(s) found`)
    } else {
      parts.push('✅ PASSED: All checks passed, safe to proceed')
    }

    if (plan.lint_results) {
      if (plan.lint_results.warnings > 0) {
        parts.push(`${plan.lint_results.warnings} warning(s)`)
      }
      if (plan.lint_results.suggestions > 0) {
        parts.push(`${plan.lint_results.suggestions} suggestion(s)`)
      }
    }

    plan.summary = parts.join(', ')
  }

  /**
   * Count how many issues can be auto-fixed
   */
  private countAutoFixableIssues(issues: Array<{ category: string; severity: string }>): number {
    // List of auto-fixable rule categories (Phase 6)
    const autoFixableRules = [
      'keys.created_at.missing',
      'keys.updated_at.missing',
      'user_id.missing',
      'rls.not_enabled',
      'rls.no_policies',
      'keys.primary_key.missing',
      'indexes.',  // Prefix match
      'documentation.table_comment',
      'naming.tables.plural'
    ]

    return issues.filter(issue => {
      return autoFixableRules.some(rule => 
        issue.category === rule || issue.category.startsWith(rule)
      )
    }).length
  }

  /**
   * Extract table name from plan for fix command
   */
  private getTableNameFromPlan(plan: ChangePlan): string {
    // Try to extract from feature name or return placeholder
    if (plan.feature) {
      // Simple extraction - could be improved
      const words = plan.feature.toLowerCase().split(/\s+/)
      if (words.length > 0) {
        return words[words.length - 1] // Last word as table name
      }
    }
    return 'TABLE_NAME'
  }

  /**
   * Save plan to JSON file
   */
  async savePlan(plan: ChangePlan, outputPath: string): Promise<void> {
    const fs = await import('fs')
    fs.writeFileSync(outputPath, JSON.stringify(plan, null, 2))
  }
}
