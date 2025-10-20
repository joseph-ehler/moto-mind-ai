/**
 * God-Tier Database Toolkit - Core Types
 * 
 * Shared types for the entire database toolkit
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Pool, PoolClient, QueryResult as PgQueryResult } from 'pg'

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export type ConnectionMode = 'read' | 'write'

export type ConnectionType = 'direct' | 'session' | 'transaction' | 'supabase' | 'cli'

export interface ConnectionConfig {
  // PostgreSQL connection strings
  directUrl: string          // Port 5432 - Direct connection (fastest)
  sessionPoolerUrl: string   // IPv4 shared pooler (fallback)
  transactionPoolerUrl: string // Port 6543 - Transaction pooler (serverless)
  
  // Supabase client config
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey: string
  
  // Connection pool settings
  poolMin?: number
  poolMax?: number
  connectionTimeout?: number
  idleTimeout?: number
  statementTimeout?: number
}

export interface Connection {
  type: ConnectionType
  client: SupabaseClient | Pool | PoolClient
  healthy: boolean
  latency: number
  lastHealthCheck: Date
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'failed'
  latency: number
  error?: string
  reason?: string
  timestamp: Date
}

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface QueryOptions {
  params?: any[]
  transaction?: boolean
  dryRun?: boolean
  timeout?: number
  streaming?: boolean
  explain?: boolean
  confirm?: boolean
  readOnly?: boolean
}

export interface QueryResult<T = any> {
  rows: T[]
  rowCount: number
  command: string
  duration: number
  plan?: QueryPlan
  preview?: boolean
  sql?: string
}

export interface QueryPlan {
  plan: any
  executionTime: number
  planningTime: number
  totalCost: number
  summary: string
}

export interface ValidationResult {
  safe: boolean
  reason?: string
  warnings?: string[]
}

// ============================================================================
// SCHEMA TYPES
// ============================================================================

export interface TableSchema {
  name: string
  schema: string
  columns: ColumnSchema[]
  indexes: IndexSchema[]
  foreignKeys: ForeignKeySchema[]
  policies: PolicySchema[]
  triggers: TriggerSchema[]
  rowCount?: number
  sizeBytes?: number
  comment?: string
}

export interface ColumnSchema {
  name: string
  type: string
  nullable: boolean
  default: string | null
  isPrimaryKey: boolean
  isForeignKey: boolean
  isUnique: boolean
  comment: string | null
}

export interface IndexSchema {
  name: string
  columns: string[]
  unique: boolean
  type: string
  sizeBytes?: number
  scans?: number
}

export interface ForeignKeySchema {
  name: string
  columns: string[]
  referencedTable: string
  referencedColumns: string[]
  onDelete: string
  onUpdate: string
}

export interface PolicySchema {
  name: string
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  roles: string[]
  using: string | null
  withCheck: string | null
  permissive: boolean
}

export interface TriggerSchema {
  name: string
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF'
  events: string[]
  function: string
}

export interface RelationshipMap {
  from: string
  to: string
  via: string[]
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
}

// ============================================================================
// MIGRATION TYPES
// ============================================================================

export interface Migration {
  id: string
  name: string
  up: string
  down: string
  applied: boolean
  appliedAt?: Date
  checksum?: string
}

export interface MigrationResult {
  success: boolean
  migration: Migration
  duration: number
  error?: string
  affectedRows?: number
}

// ============================================================================
// PERFORMANCE TYPES
// ============================================================================

export interface SlowQuery {
  fingerprint: string
  sql: string
  avgDuration: number
  calls: number
  totalDuration: number
  table: string
  recommendations: string[]
}

export interface IndexRecommendation {
  table: string
  columns: string[]
  reason: string
  estimatedSizeKB: number
  estimatedImprovementMs: number
  sql: string
}

// ============================================================================
// SECURITY TYPES
// ============================================================================

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  table: string
  issue: string
  recommendation: string
  autoFixable: boolean
  fixSql?: string
}

export interface SecurityAuditReport {
  score: number
  issues: SecurityIssue[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

// ============================================================================
// DATA QUALITY TYPES
// ============================================================================

export interface IntegrityIssue {
  table: string
  issue: string
  count: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  autoFixable: boolean
  fixSql?: string
}

export interface IntegrityReport {
  score: number
  issues: IntegrityIssue[]
  checkedTables: number
  totalRows: number
}

// ============================================================================
// AI TYPES
// ============================================================================

export interface SchemaContext {
  tables: {
    name: string
    description?: string
    columns: {
      name: string
      type: string
      nullable: boolean
      description?: string
    }[]
    relationships: {
      to: string
      via: string
    }[]
  }[]
  examples?: {
    prompt: string
    sql: string
  }[]
}

export interface NaturalLanguageQuery {
  prompt: string
  generatedSql: string
  confidence: number
  result: QueryResult
}

// ============================================================================
// BACKUP TYPES
// ============================================================================

export interface BackupOptions {
  tables?: string[]
  includeData?: boolean
  outputPath: string
  format?: 'sql' | 'json' | 'csv'
  compress?: boolean
}

export interface BackupResult {
  success: boolean
  path: string
  sizeBytes: number
  duration: number
  tables: string[]
  error?: string
}

export interface RestoreOptions {
  backupPath: string
  dryRun?: boolean
  confirmDestructive?: boolean
  tables?: string[]
}

export interface RestoreResult {
  success: boolean
  affectedTables: string[]
  affectedRows: number
  duration: number
  error?: string
}
