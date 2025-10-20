/**
 * RLS (Row Level Security) Manager
 * 
 * Manage Row Level Security policies:
 * - Enable/disable RLS on tables
 * - Create and manage policies
 * - Validate policy effectiveness
 * - List and audit policies
 */

import { QueryExecutor } from '../core/query-executor'

export interface RLSPolicy {
  schema: string
  tableName: string
  policyName: string
  permissive: 'PERMISSIVE' | 'RESTRICTIVE'
  roles: string[]
  command: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  qual: string | null  // USING clause
  withCheck: string | null  // WITH CHECK clause
}

export interface RLSStatus {
  schema: string
  tableName: string
  rlsEnabled: boolean
  rlsForced: boolean
  policies: RLSPolicy[]
  owner: string
}

export interface RLSPolicyDefinition {
  tableName: string
  policyName: string
  command?: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  using?: string
  withCheck?: string
  roles?: string[]
  permissive?: boolean
}

export interface RLSValidationResult {
  valid: boolean
  issues: Array<{
    table: string
    issue: string
    severity: 'error' | 'warning' | 'info'
    recommendation: string
  }>
  summary: {
    tablesChecked: number
    rlsEnabled: number
    rlsDisabled: number
    policiesFound: number
    issuesFound: number
  }
}

export class RLSManager {
  constructor(private queryExecutor: QueryExecutor) {}
  
  /**
   * Enable RLS on a table
   */
  async enableRLS(tableName: string, schemaName: string = 'public'): Promise<void> {
    await this.queryExecutor.execute(
      `ALTER TABLE ${schemaName}.${tableName} ENABLE ROW LEVEL SECURITY`,
      { transaction: true }
    )
  }
  
  /**
   * Disable RLS on a table
   */
  async disableRLS(tableName: string, schemaName: string = 'public'): Promise<void> {
    await this.queryExecutor.execute(
      `ALTER TABLE ${schemaName}.${tableName} DISABLE ROW LEVEL SECURITY`,
      { transaction: true }
    )
  }
  
  /**
   * Force RLS (apply to table owner too)
   */
  async forceRLS(tableName: string, schemaName: string = 'public'): Promise<void> {
    await this.queryExecutor.execute(
      `ALTER TABLE ${schemaName}.${tableName} FORCE ROW LEVEL SECURITY`,
      { transaction: true }
    )
  }
  
  /**
   * Get RLS status for a table
   */
  async getTableStatus(tableName: string, schemaName: string = 'public'): Promise<RLSStatus> {
    const result = await this.queryExecutor.execute<{
      relrowsecurity: boolean
      relforcerowsecurity: boolean
      tableowner: string
    }>(
      `SELECT 
        c.relrowsecurity,
        c.relforcerowsecurity,
        pg_catalog.pg_get_userbyid(c.relowner) as tableowner
      FROM pg_catalog.pg_class c
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = $1
        AND n.nspname = $2`,
      { params: [tableName, schemaName], readOnly: true }
    )
    
    if (result.rows.length === 0) {
      throw new Error(`Table ${schemaName}.${tableName} not found`)
    }
    
    const status = result.rows[0]
    const policies = await this.listPolicies(tableName, schemaName)
    
    return {
      schema: schemaName,
      tableName,
      rlsEnabled: status.relrowsecurity,
      rlsForced: status.relforcerowsecurity,
      policies,
      owner: status.tableowner
    }
  }
  
  /**
   * List all policies for a table
   */
  async listPolicies(tableName: string, schemaName: string = 'public'): Promise<RLSPolicy[]> {
    const result = await this.queryExecutor.execute<{
      policyname: string
      permissive: string
      roles: string[]
      cmd: string
      qual: string | null
      with_check: string | null
    }>(
      `SELECT 
        pol.polname as policyname,
        CASE pol.polpermissive 
          WHEN true THEN 'PERMISSIVE'
          ELSE 'RESTRICTIVE'
        END as permissive,
        ARRAY(
          SELECT rolname 
          FROM pg_roles 
          WHERE oid = ANY(pol.polroles)
        ) as roles,
        CASE pol.polcmd
          WHEN 'r' THEN 'SELECT'
          WHEN 'a' THEN 'INSERT'
          WHEN 'w' THEN 'UPDATE'
          WHEN 'd' THEN 'DELETE'
          WHEN '*' THEN 'ALL'
        END as cmd,
        pg_get_expr(pol.polqual, pol.polrelid) as qual,
        pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
      FROM pg_policy pol
      JOIN pg_class c ON c.oid = pol.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = $1
        AND n.nspname = $2
      ORDER BY pol.polname`,
      { params: [tableName, schemaName], readOnly: true }
    )
    
    return result.rows.map(row => ({
      schema: schemaName,
      tableName,
      policyName: row.policyname,
      permissive: row.permissive as 'PERMISSIVE' | 'RESTRICTIVE',
      roles: row.roles,
      command: row.cmd as RLSPolicy['command'],
      qual: row.qual,
      withCheck: row.with_check
    }))
  }
  
  /**
   * Create a new RLS policy
   */
  async createPolicy(policy: RLSPolicyDefinition, schemaName: string = 'public'): Promise<void> {
    const parts: string[] = []
    
    parts.push(`CREATE POLICY ${policy.policyName}`)
    parts.push(`ON ${schemaName}.${policy.tableName}`)
    
    if (policy.permissive === false) {
      parts.push('AS RESTRICTIVE')
    }
    
    if (policy.command) {
      parts.push(`FOR ${policy.command}`)
    }
    
    if (policy.roles && policy.roles.length > 0) {
      parts.push(`TO ${policy.roles.join(', ')}`)
    }
    
    if (policy.using) {
      parts.push(`USING (${policy.using})`)
    }
    
    if (policy.withCheck) {
      parts.push(`WITH CHECK (${policy.withCheck})`)
    }
    
    const sql = parts.join('\n')
    
    await this.queryExecutor.execute(sql, { transaction: true })
  }
  
  /**
   * Drop a policy
   */
  async dropPolicy(
    tableName: string,
    policyName: string,
    schemaName: string = 'public'
  ): Promise<void> {
    await this.queryExecutor.execute(
      `DROP POLICY IF EXISTS ${policyName} ON ${schemaName}.${tableName}`,
      { transaction: true }
    )
  }
  
  /**
   * List all tables with their RLS status
   */
  async listAllTables(schemaName: string = 'public'): Promise<RLSStatus[]> {
    const result = await this.queryExecutor.execute<{
      tablename: string
      relrowsecurity: boolean
      relforcerowsecurity: boolean
      tableowner: string
    }>(
      `SELECT 
        c.relname as tablename,
        c.relrowsecurity,
        c.relforcerowsecurity,
        pg_catalog.pg_get_userbyid(c.relowner) as tableowner
      FROM pg_catalog.pg_class c
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'r'
        AND n.nspname = $1
      ORDER BY c.relname`,
      { params: [schemaName], readOnly: true }
    )
    
    const statuses: RLSStatus[] = []
    
    for (const row of result.rows) {
      const policies = await this.listPolicies(row.tablename, schemaName)
      
      statuses.push({
        schema: schemaName,
        tableName: row.tablename,
        rlsEnabled: row.relrowsecurity,
        rlsForced: row.relforcerowsecurity,
        policies,
        owner: row.tableowner
      })
    }
    
    return statuses
  }
  
  /**
   * Validate RLS configuration
   */
  async validate(schemaName: string = 'public'): Promise<RLSValidationResult> {
    const tables = await this.listAllTables(schemaName)
    
    const issues: RLSValidationResult['issues'] = []
    let rlsEnabled = 0
    let rlsDisabled = 0
    let policiesFound = 0
    
    for (const table of tables) {
      if (table.rlsEnabled) {
        rlsEnabled++
        
        // Check if RLS is enabled but no policies exist
        if (table.policies.length === 0) {
          issues.push({
            table: table.tableName,
            issue: 'RLS enabled but no policies defined',
            severity: 'warning',
            recommendation: 'Add at least one policy or disable RLS'
          })
        } else {
          policiesFound += table.policies.length
          
          // Check for overly permissive policies
          const permissiveAll = table.policies.find(
            p => p.command === 'ALL' && p.qual === 'true'
          )
          
          if (permissiveAll) {
            issues.push({
              table: table.tableName,
              issue: `Policy "${permissiveAll.policyName}" is completely permissive (allows all operations with USING true)`,
              severity: 'info',
              recommendation: 'Consider more restrictive policies if security is needed'
            })
          }
        }
      } else {
        rlsDisabled++
        
        // Check if RLS is disabled but policies exist
        if (table.policies.length > 0) {
          issues.push({
            table: table.tableName,
            issue: 'RLS disabled but policies exist (policies are not active)',
            severity: 'warning',
            recommendation: 'Enable RLS or remove unused policies'
          })
        }
      }
      
      // Check if table has policies with auth.uid() but using NextAuth
      for (const policy of table.policies) {
        if (policy.qual?.includes('auth.uid()') || policy.withCheck?.includes('auth.uid()')) {
          issues.push({
            table: table.tableName,
            issue: `Policy "${policy.policyName}" uses auth.uid() which returns NULL with NextAuth`,
            severity: 'error',
            recommendation: 'Use permissive policies (true) and handle auth in API layer'
          })
        }
      }
    }
    
    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      summary: {
        tablesChecked: tables.length,
        rlsEnabled,
        rlsDisabled,
        policiesFound,
        issuesFound: issues.length
      }
    }
  }
  
  /**
   * Apply NextAuth-friendly RLS policy (permissive)
   */
  async applyNextAuthPolicy(tableName: string, schemaName: string = 'public'): Promise<void> {
    // Enable RLS
    await this.enableRLS(tableName, schemaName)
    
    // Create permissive policy
    await this.createPolicy({
      tableName,
      policyName: `Allow all operations on ${tableName}`,
      command: 'ALL',
      using: 'true',
      withCheck: 'true',
      roles: ['authenticated', 'anon']
    }, schemaName)
    
    // Add comment explaining why
    await this.queryExecutor.execute(
      `COMMENT ON POLICY "Allow all operations on ${tableName}" ON ${schemaName}.${tableName} IS 
       'Permissive - auth handled in API via NextAuth. Service role bypasses RLS anyway.'`,
      { transaction: true }
    )
  }
  
  /**
   * Generate RLS policy SQL for migration
   */
  generatePolicySQL(policy: RLSPolicyDefinition, schemaName: string = 'public'): string {
    const parts: string[] = []
    
    parts.push(`CREATE POLICY ${policy.policyName}`)
    parts.push(`  ON ${schemaName}.${policy.tableName}`)
    
    if (policy.permissive === false) {
      parts.push('  AS RESTRICTIVE')
    }
    
    if (policy.command) {
      parts.push(`  FOR ${policy.command}`)
    }
    
    if (policy.roles && policy.roles.length > 0) {
      parts.push(`  TO ${policy.roles.join(', ')}`)
    }
    
    if (policy.using) {
      parts.push(`  USING (${policy.using})`)
    }
    
    if (policy.withCheck) {
      parts.push(`  WITH CHECK (${policy.withCheck})`)
    }
    
    parts.push(';')
    
    return parts.join('\n')
  }
}
