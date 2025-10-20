/**
 * God-Tier Database Toolkit - Main Entry Point
 * 
 * Unified database operations with:
 * - Smart connection management
 * - Safe query execution
 * - Health monitoring
 * - Transaction support
 */

import { ConnectionManager, createConnectionManager } from './connection-manager'
import { QueryExecutor } from './query-executor'
import { HealthMonitor } from './health-monitor'
import { QueryOptions, QueryResult } from './types'
import { 
  SchemaContextProvider, 
  NaturalLanguageQueryInterface,
  QueryExplainer,
  IndexAdvisor
} from '../ai-tools'
import {
  SchemaInspector,
  MigrationRunner,
  BackupRestore,
  PerformanceAnalyzer,
  RLSManager,
  StorageManager,
  SeedManager,
  MigrationGenerator,
  AdminOperations
} from '../operations'

export class Database {
  private connectionManager: ConnectionManager
  private queryExecutor: QueryExecutor
  private healthMonitor: HealthMonitor
  private schemaProvider: SchemaContextProvider
  private nlQuery: NaturalLanguageQueryInterface
  private explainer: QueryExplainer
  private indexAdvisor: IndexAdvisor
  private schemaInspector: SchemaInspector
  private migrationRunner: MigrationRunner
  private backupRestore: BackupRestore
  private performanceAnalyzer: PerformanceAnalyzer
  private rlsManager: RLSManager
  private storageManager: StorageManager
  private seedManager: SeedManager
  private migrationGenerator: MigrationGenerator
  private adminOps: AdminOperations
  private initialized = false
  
  constructor(connectionManager?: ConnectionManager) {
    this.connectionManager = connectionManager || createConnectionManager()
    this.queryExecutor = new QueryExecutor(this.connectionManager)
    this.healthMonitor = new HealthMonitor(this.connectionManager, this.queryExecutor)
    
    // AI Tools (Phase 2)
    this.schemaProvider = new SchemaContextProvider(this.queryExecutor)
    this.nlQuery = new NaturalLanguageQueryInterface(this.queryExecutor, this.schemaProvider)
    this.explainer = new QueryExplainer(this.queryExecutor)
    this.indexAdvisor = new IndexAdvisor(this.queryExecutor)
    
    // Operations Tools (Phase 3)
    this.schemaInspector = new SchemaInspector(this.queryExecutor)
    this.migrationRunner = new MigrationRunner(this.queryExecutor)
    this.backupRestore = new BackupRestore(this.queryExecutor)
    this.performanceAnalyzer = new PerformanceAnalyzer(this.queryExecutor)
    
    // Phase 4 Tools
    this.rlsManager = new RLSManager(this.queryExecutor)
    this.storageManager = new StorageManager(this.queryExecutor)
    this.seedManager = new SeedManager(this.queryExecutor)
    this.migrationGenerator = new MigrationGenerator(this.queryExecutor)
    this.adminOps = new AdminOperations(this.queryExecutor)
  }
  
  /**
   * Initialize database connections
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }
    
    await this.connectionManager.initialize()
    this.initialized = true
  }
  
  /**
   * Ensure initialized (auto-initialize if needed)
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }
  
  /**
   * Execute raw SQL query
   */
  async query<T = any>(
    sql: string,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    await this.ensureInitialized()
    return this.queryExecutor.execute<T>(sql, options)
  }
  
  /**
   * Execute query with retry logic
   */
  async queryWithRetry<T = any>(
    sql: string,
    options?: QueryOptions,
    maxRetries: number = 3
  ): Promise<QueryResult<T>> {
    await this.ensureInitialized()
    return this.queryExecutor.executeWithRetry<T>(sql, options, maxRetries)
  }
  
  /**
   * Stream large result sets
   */
  async *stream<T = any>(
    sql: string,
    params?: any[],
    batchSize: number = 1000
  ): AsyncGenerator<T[]> {
    await this.ensureInitialized()
    yield* this.queryExecutor.stream<T>(sql, params, batchSize)
  }
  
  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(
    fn: (db: Database) => Promise<T>
  ): Promise<T> {
    await this.ensureInitialized()
    return this.queryExecutor.withTransaction(() => fn(this))
  }
  
  /**
   * Check database health
   */
  async health() {
    await this.ensureInitialized()
    return this.healthMonitor.check()
  }
  
  /**
   * Quick health check (connection only)
   */
  async healthQuick() {
    await this.ensureInitialized()
    return this.healthMonitor.quickCheck()
  }
  
  /**
   * Gracefully shutdown
   */
  async shutdown(): Promise<void> {
    if (this.initialized) {
      await this.connectionManager.shutdown()
      this.initialized = false
    }
  }
  
  /**
   * Get connection manager (for advanced usage)
   */
  getConnectionManager(): ConnectionManager {
    return this.connectionManager
  }
  
  /**
   * Get query executor (for advanced usage)
   */
  getQueryExecutor(): QueryExecutor {
    return this.queryExecutor
  }
  
  /**
   * Get health monitor (for advanced usage)
   */
  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor
  }
  
  // ============================================================================
  // AI TOOLS
  // ============================================================================
  
  /**
   * Query database using natural language
   */
  async ask<T = any>(prompt: string, options?: { dryRun?: boolean }) {
    await this.ensureInitialized()
    return this.nlQuery.query<T>(prompt, options)
  }
  
  /**
   * Explain a SQL query in plain English
   */
  async explain(sql: string) {
    await this.ensureInitialized()
    return this.explainer.explain(sql)
  }
  
  /**
   * Get index recommendations for slow queries
   */
  async recommendIndexes(minDurationMs?: number) {
    await this.ensureInitialized()
    return this.indexAdvisor.analyzeSlowQueries(minDurationMs)
  }
  
  /**
   * Analyze a specific query for index recommendations
   */
  async analyzeQuery(sql: string) {
    await this.ensureInitialized()
    return this.indexAdvisor.analyzeQuery(sql)
  }
  
  /**
   * Generate schema context for AI
   */
  async getSchemaContext() {
    await this.ensureInitialized()
    return this.schemaProvider.generateContext()
  }
  
  /**
   * Export schema documentation as markdown
   */
  async exportSchema(outputPath?: string) {
    await this.ensureInitialized()
    const context = await this.schemaProvider.generateContext()
    const markdown = this.schemaProvider.generateMarkdown(context)
    
    if (outputPath) {
      const fs = await import('fs/promises')
      await fs.writeFile(outputPath, markdown, 'utf-8')
      console.log(`Schema exported to ${outputPath}`)
    }
    
    return markdown
  }
  
  /**
   * Get AI tools (for advanced usage)
   */
  getAITools() {
    return {
      schema: this.schemaProvider,
      nlQuery: this.nlQuery,
      explainer: this.explainer,
      indexAdvisor: this.indexAdvisor
    }
  }
  
  // ============================================================================
  // OPERATIONS TOOLS (PHASE 3)
  // ============================================================================
  
  /**
   * Inspect database schema
   */
  async inspectSchema(schemaName?: string) {
    await this.ensureInitialized()
    return this.schemaInspector.inspect(schemaName)
  }
  
  /**
   * Get tables in schema
   */
  async getTables(schemaName?: string) {
    await this.ensureInitialized()
    return this.schemaInspector.getTables(schemaName)
  }
  
  /**
   * Get columns for a table
   */
  async getColumns(tableName: string, schemaName?: string) {
    await this.ensureInitialized()
    return this.schemaInspector.getColumns(tableName, schemaName)
  }
  
  /**
   * Compare schemas (drift detection)
   */
  async compareSchemas(schema1: string, schema2: string) {
    await this.ensureInitialized()
    return this.schemaInspector.compareSchemas(schema1, schema2)
  }
  
  /**
   * Create migration plan
   */
  async planMigrations(directory: string) {
    await this.ensureInitialized()
    return this.migrationRunner.plan(directory)
  }
  
  /**
   * Run pending migrations
   */
  async runMigrations(directory: string, options?: { dryRun?: boolean; stopOnError?: boolean }) {
    await this.ensureInitialized()
    await this.migrationRunner.initialize()
    return this.migrationRunner.runPending(directory, options)
  }
  
  /**
   * Rollback a migration
   */
  async rollbackMigration(migrationId: string) {
    await this.ensureInitialized()
    return this.migrationRunner.rollback(migrationId)
  }
  
  /**
   * Validate migration checksums
   */
  async validateMigrations(directory: string) {
    await this.ensureInitialized()
    return this.migrationRunner.validateChecksums(directory)
  }
  
  /**
   * Backup database
   */
  async backup(outputPath: string, options?: {
    tables?: string[]
    schemaOnly?: boolean
    dataOnly?: boolean
    exclude?: string[]
  }) {
    await this.ensureInitialized()
    return this.backupRestore.backup(outputPath, options)
  }
  
  /**
   * Restore from backup
   */
  async restore(backupPath: string, options?: {
    overwrite?: boolean
    dryRun?: boolean
    skipErrors?: boolean
  }) {
    await this.ensureInitialized()
    return this.backupRestore.restore(backupPath, options)
  }
  
  /**
   * Backup a single table
   */
  async backupTable(tableName: string, outputPath: string, options?: {
    schemaOnly?: boolean
    anonymize?: string[]
  }) {
    await this.ensureInitialized()
    return this.backupRestore.backupTable(tableName, outputPath, options)
  }
  
  /**
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    await this.ensureInitialized()
    return this.performanceAnalyzer.getMetrics()
  }
  
  /**
   * Get query profiles
   */
  async getQueryProfiles(limit?: number, minCalls?: number) {
    await this.ensureInitialized()
    return this.performanceAnalyzer.getQueryProfiles(limit, minCalls)
  }
  
  /**
   * Get table statistics
   */
  async getTableStats(schemaName?: string) {
    await this.ensureInitialized()
    return this.performanceAnalyzer.getTableStatistics(schemaName)
  }
  
  /**
   * Identify performance bottlenecks
   */
  async findBottlenecks() {
    await this.ensureInitialized()
    return this.performanceAnalyzer.identifyBottlenecks()
  }
  
  // ============================================================================
  // RLS MANAGEMENT (PHASE 4)
  // ============================================================================
  
  /**
   * Enable RLS on a table
   */
  async enableRLS(tableName: string, schemaName?: string) {
    await this.ensureInitialized()
    return this.rlsManager.enableRLS(tableName, schemaName)
  }
  
  /**
   * Disable RLS on a table
   */
  async disableRLS(tableName: string, schemaName?: string) {
    await this.ensureInitialized()
    return this.rlsManager.disableRLS(tableName, schemaName)
  }
  
  /**
   * Get RLS status for a table
   */
  async getRLSStatus(tableName: string, schemaName?: string) {
    await this.ensureInitialized()
    return this.rlsManager.getTableStatus(tableName, schemaName)
  }
  
  /**
   * List all RLS policies for a table
   */
  async listRLSPolicies(tableName: string, schemaName?: string) {
    await this.ensureInitialized()
    return this.rlsManager.listPolicies(tableName, schemaName)
  }
  
  /**
   * List all tables with RLS status
   */
  async listAllRLS(schemaName?: string) {
    await this.ensureInitialized()
    return this.rlsManager.listAllTables(schemaName)
  }
  
  /**
   * Validate RLS configuration
   */
  async validateRLS(schemaName?: string) {
    await this.ensureInitialized()
    return this.rlsManager.validate(schemaName)
  }
  
  /**
   * Apply NextAuth-friendly RLS policy
   */
  async applyNextAuthRLS(tableName: string, schemaName?: string) {
    await this.ensureInitialized()
    return this.rlsManager.applyNextAuthPolicy(tableName, schemaName)
  }
  
  // ============================================================================
  // STORAGE MANAGEMENT (PHASE 4)
  // ============================================================================
  
  /**
   * List all storage buckets
   */
  async listBuckets() {
    await this.ensureInitialized()
    return this.storageManager.listBuckets()
  }
  
  /**
   * Get bucket by name
   */
  async getBucket(name: string) {
    await this.ensureInitialized()
    return this.storageManager.getBucket(name)
  }
  
  /**
   * Create a storage bucket
   */
  async createBucket(name: string, options?: { public?: boolean; fileSizeLimit?: number }) {
    await this.ensureInitialized()
    return this.storageManager.createBucket(name, options)
  }
  
  /**
   * Delete a storage bucket
   */
  async deleteBucket(name: string, force?: boolean) {
    await this.ensureInitialized()
    return this.storageManager.deleteBucket(name, force)
  }
  
  /**
   * Empty a bucket (delete all files)
   */
  async emptyBucket(name: string) {
    await this.ensureInitialized()
    return this.storageManager.emptyBucket(name)
  }
  
  /**
   * List files in a bucket
   */
  async listStorageFiles(bucketName: string, path?: string) {
    await this.ensureInitialized()
    return this.storageManager.listFiles(bucketName, path)
  }
  
  /**
   * Get bucket statistics
   */
  async getBucketStats(bucketName: string) {
    await this.ensureInitialized()
    return this.storageManager.getBucketStats(bucketName)
  }
  
  /**
   * Cleanup old files in a bucket
   */
  async cleanupOldFiles(bucketName: string, olderThan: Date, options?: { dryRun?: boolean }) {
    await this.ensureInitialized()
    return this.storageManager.cleanupOldFiles(bucketName, olderThan, options)
  }
  
  // ============================================================================
  // SEED MANAGEMENT (PHASE 4)
  // ============================================================================
  
  /**
   * Load and execute a seed file
   */
  async loadSeedFile(filePath: string) {
    await this.ensureInitialized()
    return this.seedManager.loadSeedFile(filePath)
  }
  
  /**
   * Seed a specific table with data
   */
  async seedTable(tableName: string, data: Record<string, any>[], options?: { onConflict?: 'ignore' | 'replace' | 'error' }) {
    await this.ensureInitialized()
    return this.seedManager.seedTable(tableName, data, options)
  }
  
  /**
   * Truncate a table
   */
  async truncateTable(tableName: string, options?: { cascade?: boolean; restart?: boolean }) {
    await this.ensureInitialized()
    return this.seedManager.truncateTable(tableName, options)
  }
  
  /**
   * Reset database (truncate all tables and reset sequences)
   */
  async resetDatabase(schemaName?: string, options?: { confirm?: boolean; exclude?: string[] }) {
    await this.ensureInitialized()
    return this.seedManager.resetDatabase(schemaName, options)
  }
  
  /**
   * Reset all sequences in a schema
   */
  async resetAllSequences(schemaName?: string) {
    await this.ensureInitialized()
    return this.seedManager.resetAllSequences(schemaName)
  }
  
  /**
   * Get table row count
   */
  async getTableCount(tableName: string) {
    await this.ensureInitialized()
    return this.seedManager.getTableCount(tableName)
  }
  
  /**
   * List seed files in a directory
   */
  async listSeedFiles(directory: string) {
    await this.ensureInitialized()
    return this.seedManager.listSeedFiles(directory)
  }
  
  /**
   * Execute multiple seed files
   */
  async executeSeedFiles(files: string[], options?: { stopOnError?: boolean }) {
    await this.ensureInitialized()
    return this.seedManager.executeSeedFiles(files, options)
  }
  
  // ============================================================================
  // MIGRATION GENERATION (PHASE 4)
  // ============================================================================
  
  /**
   * Generate migration from schema diff
   */
  async generateMigrationFromDiff(schema1: string, schema2: string, options?: { name?: string }) {
    await this.ensureInitialized()
    return this.migrationGenerator.generateFromDiff(schema1, schema2, options)
  }
  
  /**
   * Generate migration from template
   */
  generateMigrationFromTemplate(templateName: string, variables: Record<string, any>) {
    const template = this.migrationGenerator.getTemplate(templateName)
    if (!template) {
      throw new Error(`Template not found: ${templateName}`)
    }
    return this.migrationGenerator.generateFromTemplate(template, variables)
  }
  
  /**
   * Generate CREATE TABLE migration
   */
  generateCreateTableMigration(options: Parameters<typeof this.migrationGenerator.generateCreateTable>[0]) {
    return this.migrationGenerator.generateCreateTable(options)
  }
  
  /**
   * Create migration file
   */
  async createMigrationFile(directory: string, name: string, content: string) {
    await this.ensureInitialized()
    return this.migrationGenerator.createMigrationFile(directory, name, content)
  }
  
  /**
   * List available templates
   */
  listMigrationTemplates() {
    return this.migrationGenerator.listTemplates()
  }
  
  // ============================================================================
  // ADMIN OPERATIONS (PHASE 4)
  // ============================================================================
  
  /**
   * VACUUM a table or database
   */
  async vacuum(tableName?: string, options?: Parameters<typeof this.adminOps.vacuum>[1]) {
    await this.ensureInitialized()
    return this.adminOps.vacuum(tableName, options)
  }
  
  /**
   * ANALYZE a table or database
   */
  async analyze(tableName?: string, verbose?: boolean) {
    await this.ensureInitialized()
    return this.adminOps.analyze(tableName, verbose)
  }
  
  /**
   * REINDEX a table, index, or database
   */
  async reindex(target: string, type?: 'TABLE' | 'INDEX' | 'SCHEMA' | 'DATABASE') {
    await this.ensureInitialized()
    return this.adminOps.reindex(target, type)
  }
  
  /**
   * List all database connections
   */
  async listConnections() {
    await this.ensureInitialized()
    return this.adminOps.listConnections()
  }
  
  /**
   * Get connection statistics
   */
  async getConnectionStats() {
    await this.ensureInitialized()
    return this.adminOps.getConnectionStats()
  }
  
  /**
   * Terminate a connection
   */
  async terminateConnection(pid: number) {
    await this.ensureInitialized()
    return this.adminOps.terminateConnection(pid)
  }
  
  /**
   * Cancel a running query
   */
  async cancelQuery(pid: number) {
    await this.ensureInitialized()
    return this.adminOps.cancelQuery(pid)
  }
  
  /**
   * Get long-running queries
   */
  async getLongRunningQueries(minDurationSeconds?: number) {
    await this.ensureInitialized()
    return this.adminOps.getLongRunningQueries(minDurationSeconds)
  }
  
  /**
   * Get operations tools (for advanced usage)
   */
  getOperationsTools() {
    return {
      schemaInspector: this.schemaInspector,
      migrationRunner: this.migrationRunner,
      backupRestore: this.backupRestore,
      performanceAnalyzer: this.performanceAnalyzer,
      rlsManager: this.rlsManager,
      storageManager: this.storageManager,
      seedManager: this.seedManager,
      migrationGenerator: this.migrationGenerator,
      adminOps: this.adminOps
    }
  }
}

// Singleton instance
let dbInstance: Database | null = null

/**
 * Get or create singleton database instance
 */
export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new Database()
  }
  return dbInstance
}

/**
 * Initialize and return database instance
 */
export async function initDatabase(): Promise<Database> {
  const db = getDatabase()
  await db.initialize()
  return db
}

// Re-export everything
export * from './types'
export * from './connection-manager'
export * from './query-executor'
export * from './health-monitor'
