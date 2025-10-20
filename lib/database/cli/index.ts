#!/usr/bin/env tsx
/**
 * God-Tier Database CLI
 * 
 * Unified command-line interface for all database operations
 * 
 * Usage:
 *   npm run db <command> [options]
 * 
 * Commands:
 *   query <sql>              - Execute raw SQL
 *   health                   - Check database health
 *   schema:show <table>      - Show table schema
 *   migrate:apply            - Apply pending migrations
 *   backup                   - Backup database
 * 
 * Examples:
 *   npm run db query "SELECT * FROM vehicles LIMIT 10"
 *   npm run db health
 *   npm run db schema:show vehicles
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import Table from 'cli-table3'
import { initDatabase } from '../core'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const program = new Command()

program
  .name('db')
  .description('God-Tier Database Toolkit')
  .version('1.0.0')

// ============================================================================
// QUERY COMMANDS
// ============================================================================

program
  .command('query <sql>')
  .description('Execute raw SQL query')
  .option('-f, --format <type>', 'Output format (table|json|csv)', 'table')
  .option('-d, --dry-run', 'Preview without executing')
  .option('-e, --explain', 'Show query plan')
  .option('-r, --read-only', 'Execute in read-only mode')
  .option('-t, --transaction', 'Execute in transaction')
  .action(async (sql, options) => {
    const spinner = ora('Executing query...').start()
    
    try {
      const db = await initDatabase()
      
      const result = await db.query(sql, {
        dryRun: options.dryRun,
        explain: options.explain,
        readOnly: options.readOnly,
        transaction: options.transaction
      })
      
      if (options.dryRun) {
        spinner.succeed('Dry run complete')
        console.log(chalk.gray('\nSQL:'))
        console.log(sql)
        return
      }
      
      if (options.explain && result.plan) {
        spinner.succeed('Query plan generated')
        console.log(chalk.bold('\n📊 Query Plan:'))
        console.log(`  Planning Time: ${result.plan.planningTime.toFixed(2)}ms`)
        console.log(`  Execution Time: ${result.plan.executionTime.toFixed(2)}ms`)
        console.log(`  Total Cost: ${result.plan.totalCost.toFixed(2)}`)
        console.log(`  Summary: ${result.plan.summary}`)
        return
      }
      
      spinner.succeed(`Returned ${result.rows.length} rows in ${result.duration}ms`)
      
      if (result.rows.length === 0) {
        console.log(chalk.gray('\nNo results'))
        return
      }
      
      // Format output
      if (options.format === 'table') {
        const table = new Table({
          head: Object.keys(result.rows[0]).map(k => chalk.cyan(k)),
          style: { head: [] }
        })
        
        result.rows.forEach(row => {
          table.push(Object.values(row))
        })
        
        console.log('\n' + table.toString())
      } else if (options.format === 'json') {
        console.log(JSON.stringify(result.rows, null, 2))
      } else if (options.format === 'csv') {
        const headers = Object.keys(result.rows[0]).join(',')
        const rows = result.rows.map(row => 
          Object.values(row).map(v => JSON.stringify(v)).join(',')
        )
        console.log([headers, ...rows].join('\n'))
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Query failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

// ============================================================================
// HEALTH COMMANDS
// ============================================================================

program
  .command('health')
  .description('Check database health')
  .option('-q, --quick', 'Quick check (connections only)')
  .action(async (options) => {
    const spinner = ora('Checking database health...').start()
    
    try {
      const db = await initDatabase()
      
      if (options.quick) {
        const health = await db.healthQuick()
        
        if (health.healthy) {
          spinner.succeed(`Database healthy (${health.latency}ms)`)
        } else {
          spinner.fail(`Database unhealthy: ${health.message}`)
        }
      } else {
        const report = await db.health()
        spinner.succeed('Health check complete')
        
        // Overall status
        const statusIcon = report.overall === 'healthy' ? '✅' : 
                          report.overall === 'degraded' ? '⚠️' : '🚨'
        console.log(`\n${statusIcon} ${chalk.bold('Overall:')} ${report.overall.toUpperCase()} (Score: ${report.score}/100)`)
        
        // Connections
        console.log(chalk.bold('\n🔌 Connections:'))
        report.connections.forEach(conn => {
          const icon = conn.status === 'healthy' ? '✅' : 
                      conn.status === 'degraded' ? '⚠️' : '❌'
          console.log(`  ${icon} ${conn.type}: ${conn.status} (${conn.latency}ms)`)
          if (conn.message) {
            console.log(chalk.gray(`     ${conn.message}`))
          }
        })
        
        // Database
        console.log(chalk.bold('\n💾 Database:'))
        console.log(`  Size: ${report.database.size}`)
        console.log(`  Connections: ${report.database.connections}/${report.database.maxConnections}`)
        console.log(`  Slow Queries: ${report.database.slowQueries}`)
        console.log(`  Cache Hit Ratio: ${report.database.cacheHitRatio}%`)
        
        // Recommendations
        console.log(chalk.bold('\n💡 Recommendations:'))
        report.recommendations.forEach(rec => {
          console.log(`  ${rec}`)
        })
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Health check failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      console.error(chalk.dim('\nFull error:'), error)
      if (error instanceof Error && error.stack) {
        console.error(chalk.dim('\nStack trace:'))
        console.error(chalk.dim(error.stack))
      }
      process.exit(1)
    }
  })

// ============================================================================
// AI COMMANDS
// ============================================================================

program
  .command('ask <question>')
  .description('Query database using natural language')
  .option('-d, --dry-run', 'Preview without executing')
  .action(async (question, options) => {
    const spinner = ora('Thinking...').start()
    
    try {
      const db = await initDatabase()
      
      const result = await db.ask(question, { dryRun: options.dryRun })
      
      spinner.succeed('Query complete')
      
      // Show generated SQL
      console.log(chalk.bold('\n📝 Generated SQL:'))
      console.log(chalk.gray(result.nlQuery.generatedSql))
      
      if (result.nlQuery.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Warnings:'))
        result.nlQuery.warnings.forEach(w => console.log(`  ${w}`))
      }
      
      // Show results
      if (result.rows.length > 0) {
        console.log(chalk.bold(`\n📊 Results (${result.rows.length} rows):\n`))
        
        const table = new Table({
          head: Object.keys(result.rows[0]).map(k => chalk.cyan(k)),
          style: { head: [] }
        })
        
        result.rows.slice(0, 10).forEach(row => {
          table.push(Object.values(row))
        })
        
        console.log(table.toString())
        
        if (result.rows.length > 10) {
          console.log(chalk.gray(`\n... and ${result.rows.length - 10} more rows`))
        }
      } else {
        console.log(chalk.gray('\nNo results'))
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Query failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('explain <sql>')
  .description('Explain query in plain English')
  .action(async (sql) => {
    const spinner = ora('Analyzing query...').start()
    
    try {
      const db = await initDatabase()
      
      const explanation = await db.explain(sql)
      
      spinner.succeed('Analysis complete')
      
      // Summary
      console.log(chalk.bold('\n📊 Summary:'))
      console.log(`  ${explanation.summary}`)
      
      // Steps
      console.log(chalk.bold('\n🔍 Execution Steps:'))
      explanation.steps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step.operation}`)
        console.log(chalk.gray(`     ${step.description}`))
        console.log(chalk.gray(`     Cost: ${step.cost.toFixed(2)}, Rows: ${step.rows}`))
      })
      
      // Recommendations
      if (explanation.recommendations.length > 0) {
        console.log(chalk.bold('\n💡 Recommendations:'))
        explanation.recommendations.forEach(rec => {
          console.log(`  ${rec}`)
        })
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Analysis failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('indexes')
  .description('Recommend missing indexes')
  .option('--min-duration <ms>', 'Minimum query duration (ms)', '100')
  .action(async (options) => {
    const spinner = ora('Analyzing slow queries...').start()
    
    try {
      const db = await initDatabase()
      
      const minDuration = parseInt(options.minDuration)
      const result = await db.recommendIndexes(minDuration)
      
      spinner.succeed(`Found ${result.slowQueries.length} slow queries`)
      
      if (result.recommendations.length === 0) {
        console.log(chalk.green('\n✅ No missing indexes detected!'))
      } else {
        console.log(chalk.bold(`\n🎯 Index Recommendations (${result.recommendations.length}):\n`))
        
        result.recommendations.forEach((rec, i) => {
          const priorityColor = rec.priority === 'high' ? chalk.red : 
                               rec.priority === 'medium' ? chalk.yellow : chalk.gray
          
          console.log(`${i + 1}. ${priorityColor(rec.priority.toUpperCase())} - ${rec.table}`)
          console.log(`   Columns: ${rec.columns.join(', ')}`)
          console.log(chalk.gray(`   ${rec.reason}`))
          console.log(chalk.gray(`   Impact: ${rec.impact}`))
          console.log(chalk.cyan(`   ${rec.sql}`))
          console.log('')
        })
        
        console.log(chalk.bold('💡 To generate migration SQL:'))
        console.log(chalk.gray('   npm run db indexes --generate-sql'))
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Analysis failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('schema:export')
  .description('Export schema documentation')
  .option('-o, --output <path>', 'Output file path')
  .action(async (options) => {
    const spinner = ora('Generating schema documentation...').start()
    
    try {
      const db = await initDatabase()
      
      const markdown = await db.exportSchema(options.output)
      
      if (options.output) {
        spinner.succeed(`Schema exported to ${options.output}`)
      } else {
        spinner.succeed('Schema documentation generated')
        console.log('\n' + markdown)
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Export failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

// ============================================================================
// OPERATIONS COMMANDS (PHASE 3)
// ============================================================================

program
  .command('schema:inspect')
  .description('Inspect database schema')
  .option('-s, --schema <name>', 'Schema name', 'public')
  .action(async (options) => {
    const spinner = ora('Inspecting schema...').start()
    
    try {
      const db = await initDatabase()
      
      const result = await db.inspectSchema(options.schema)
      
      spinner.succeed('Schema inspection complete')
      
      console.log(chalk.bold(`\n📊 Schema: ${options.schema}\n`))
      console.log(`Tables: ${result.summary.totalTables}`)
      console.log(`Columns: ${result.summary.totalColumns}`)
      console.log(`Indexes: ${result.summary.totalIndexes}`)
      console.log(`Constraints: ${result.summary.totalConstraints}`)
      console.log(`Total Size: ${(result.summary.totalSize / 1024 / 1024).toFixed(2)} MB`)
      
      console.log(chalk.bold('\n📋 Tables:'))
      result.tables.forEach(table => {
        const cols = result.columns.get(table.name)?.length || 0
        const idxs = result.indexes.get(table.name)?.length || 0
        console.log(`  • ${table.name} (${cols} cols, ${idxs} indexes, ${table.rowCount || 0} rows)`)
      })
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Inspection failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('migrate:plan <directory>')
  .description('Plan pending migrations')
  .action(async (directory) => {
    const spinner = ora('Planning migrations...').start()
    
    try {
      const db = await initDatabase()
      
      const plan = await db.planMigrations(directory)
      
      spinner.succeed('Migration plan ready')
      
      console.log(chalk.bold('\n📋 Migration Plan\n'))
      console.log(`Total migrations: ${plan.total}`)
      console.log(`Applied: ${plan.applied.length}`)
      console.log(`Pending: ${plan.pending.length}`)
      console.log(`Estimated time: ${(plan.estimatedTime / 1000).toFixed(0)}s`)
      
      if (plan.pending.length > 0) {
        console.log(chalk.bold('\n⏳ Pending Migrations:'))
        plan.pending.forEach((m, i) => {
          console.log(`  ${i + 1}. ${m.id} - ${m.name}`)
        })
      } else {
        console.log(chalk.green('\n✅ No pending migrations'))
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Planning failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('migrate:run <directory>')
  .description('Run pending migrations')
  .option('-d, --dry-run', 'Preview without executing')
  .option('--stop-on-error', 'Stop on first error', true)
  .action(async (directory, options) => {
    const spinner = ora('Running migrations...').start()
    
    try {
      const db = await initDatabase()
      
      const result = await db.runMigrations(directory, {
        dryRun: options.dryRun,
        stopOnError: options.stopOnError
      })
      
      spinner.succeed('Migrations complete')
      
      console.log(chalk.bold('\n📊 Migration Results\n'))
      console.log(`Total: ${result.summary.total}`)
      console.log(chalk.green(`Successful: ${result.summary.successful}`))
      if (result.summary.failed > 0) {
        console.log(chalk.red(`Failed: ${result.summary.failed}`))
      }
      if (result.summary.skipped > 0) {
        console.log(chalk.yellow(`Skipped: ${result.summary.skipped}`))
      }
      console.log(`Duration: ${(result.summary.totalTime / 1000).toFixed(2)}s`)
      
      if (result.results.length > 0) {
        console.log(chalk.bold('\n📋 Details:'))
        result.results.forEach(r => {
          const icon = r.success ? '✅' : '❌'
          console.log(`  ${icon} ${r.migration.id} (${r.executionTime}ms)`)
          if (r.error) {
            console.log(chalk.red(`     Error: ${r.error}`))
          }
        })
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Migration failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('migrate:validate <file>')
  .description('Validate migration file before applying')
  .option('--confirm', 'Confirm dangerous operations')
  .action(async (file, options) => {
    const spinner = ora('Validating migration...').start()
    
    try {
      const db = await initDatabase()
      const { validateMigration } = await import('../operations/migration-validator')
      const { formatErrorForCLI } = await import('../core/error-handler')
      
      const result = await validateMigration(file, db, {
        confirmed: options.confirm
      })
      
      spinner.stop()
      
      if (result.valid) {
        console.log(chalk.green('\n✅ Validation passed!\n'))
        
        if (result.warnings.length > 0) {
          console.log(chalk.yellow('⚠️  Warnings:\n'))
          result.warnings.forEach(w => {
            console.log(`  • ${w.message}`)
            if (w.fix) console.log(chalk.dim(`    Fix: ${w.fix}`))
          })
          console.log()
        }
        
        console.log(chalk.dim('💡 Safe to apply with: npm run db migrate:run'))
      } else {
        console.log(chalk.red('\n❌ Validation failed!\n'))
        
        if (result.errors.length > 0) {
          console.log(chalk.bold('Errors:\n'))
          result.errors.forEach(e => {
            console.log(`  ${chalk.red('•')} ${e.message}`)
            if (e.fix) console.log(chalk.dim(`    💡 Fix: ${e.fix}`))
            if (e.line) console.log(chalk.dim(`    📍 Line ${e.line}`))
          })
          console.log()
        }
        
        if (result.warnings.length > 0) {
          console.log(chalk.yellow('⚠️  Warnings:\n'))
          result.warnings.forEach(w => {
            console.log(`  • ${w.message}`)
            if (w.fix) console.log(chalk.dim(`    Fix: ${w.fix}`))
          })
          console.log()
        }
        
        console.log(chalk.red('🚫 BLOCKED - Fix issues above before applying\n'))
        process.exit(1)
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Validation failed')
      const { formatErrorForCLI } = await import('../core/error-handler')
      console.error('\n' + formatErrorForCLI(error))
      process.exit(1)
    }
  })

program
  .command('backup <output>')
  .description('Backup database')
  .option('-t, --tables <tables>', 'Comma-separated table names')
  .option('--schema-only', 'Backup schema only (no data)')
  .option('--data-only', 'Backup data only (no schema)')
  .action(async (output, options) => {
    const spinner = ora('Creating backup...').start()
    
    try {
      const db = await initDatabase()
      
      const metadata = await db.backup(output, {
        tables: options.tables?.split(','),
        schemaOnly: options.schemaOnly,
        dataOnly: options.dataOnly
      })
      
      spinner.succeed('Backup complete')
      
      console.log(chalk.bold('\n💾 Backup Created\n'))
      console.log(`File: ${output}`)
      console.log(`Tables: ${metadata.tables.length}`)
      console.log(`Rows: ${metadata.rowCount}`)
      console.log(`Size: ${(metadata.sizeBytes / 1024 / 1024).toFixed(2)} MB`)
      console.log(`Timestamp: ${metadata.timestamp}`)
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Backup failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('restore <backup>')
  .description('Restore from backup')
  .option('-d, --dry-run', 'Preview without executing')
  .option('--skip-errors', 'Continue on errors')
  .action(async (backup, options) => {
    const spinner = ora('Restoring backup...').start()
    
    try {
      const db = await initDatabase()
      
      const result = await db.restore(backup, {
        dryRun: options.dryRun,
        skipErrors: options.skipErrors
      })
      
      spinner.succeed('Restore complete')
      
      console.log(chalk.bold('\n📦 Restore Results\n'))
      console.log(`Tables restored: ${result.tablesRestored.length}`)
      console.log(`Rows restored: ${result.rowsRestored}`)
      console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`)
      
      if (result.errors.length > 0) {
        console.log(chalk.red(`\n❌ Errors: ${result.errors.length}`))
        result.errors.forEach(err => {
          console.log(`  • ${err.table}: ${err.error}`)
        })
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Restore failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('perf:metrics')
  .description('Get performance metrics')
  .action(async () => {
    const spinner = ora('Gathering metrics...').start()
    
    try {
      const db = await initDatabase()
      
      const metrics = await db.getPerformanceMetrics()
      
      spinner.succeed('Metrics gathered')
      
      console.log(chalk.bold('\n📊 Performance Metrics\n'))
      
      console.log(chalk.bold('Database:'))
      console.log(`  Size: ${metrics.database.size}`)
      console.log(`  Connections: ${metrics.database.connections}/${metrics.database.maxConnections}`)
      console.log(`  Active: ${metrics.database.activeQueries}`)
      console.log(`  TPS: ${metrics.database.transactionsPerSecond.toFixed(2)}`)
      console.log(`  Cache Hit: ${metrics.database.cacheHitRatio.toFixed(2)}%`)
      
      console.log(chalk.bold('\nQueries:'))
      console.log(`  Total: ${metrics.queries.total}`)
      console.log(`  Slow: ${metrics.queries.slow}`)
      console.log(`  Avg Duration: ${metrics.queries.avgDuration.toFixed(2)}ms`)
      
      console.log(chalk.bold('\nLocks:'))
      console.log(`  Total: ${metrics.locks.total}`)
      console.log(`  Waiting: ${metrics.locks.waiting}`)
      console.log(`  Blocking: ${metrics.locks.blocking.length}`)
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to gather metrics')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('perf:bottlenecks')
  .description('Identify performance bottlenecks')
  .action(async () => {
    const spinner = ora('Analyzing bottlenecks...').start()
    
    try {
      const db = await initDatabase()
      
      const bottlenecks = await db.findBottlenecks()
      
      spinner.succeed('Analysis complete')
      
      console.log(chalk.bold('\n🔍 Performance Bottlenecks\n'))
      
      if (bottlenecks.slowQueries.length > 0) {
        console.log(chalk.bold('🐌 Slow Queries:'))
        bottlenecks.slowQueries.forEach((q, i) => {
          console.log(`  ${i + 1}. ${q.query}`)
          console.log(chalk.gray(`     ${q.issue}`))
          console.log(chalk.cyan(`     💡 ${q.recommendation}`))
        })
        console.log('')
      }
      
      if (bottlenecks.missingIndexes.length > 0) {
        console.log(chalk.bold('📊 Missing Indexes:'))
        bottlenecks.missingIndexes.forEach((idx, i) => {
          console.log(`  ${i + 1}. ${idx.table}`)
          console.log(chalk.gray(`     ${idx.reason}`))
        })
        console.log('')
      }
      
      if (bottlenecks.bloatedTables.length > 0) {
        console.log(chalk.bold('💥 Bloated Tables:'))
        bottlenecks.bloatedTables.forEach((tbl, i) => {
          console.log(`  ${i + 1}. ${tbl.table} (${tbl.deadTuples} dead tuples)`)
          console.log(chalk.cyan(`     💡 ${tbl.recommendation}`))
        })
        console.log('')
      }
      
      if (bottlenecks.slowQueries.length === 0 &&
          bottlenecks.missingIndexes.length === 0 &&
          bottlenecks.bloatedTables.length === 0) {
        console.log(chalk.green('✅ No significant bottlenecks detected!'))
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Analysis failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

// ============================================================================
// RLS COMMANDS (PHASE 4)
// ============================================================================

program
  .command('rls:list')
  .description('List all tables with RLS status')
  .option('-s, --schema <name>', 'Schema name', 'public')
  .action(async (options) => {
    const spinner = ora('Listing RLS status...').start()
    
    try {
      const db = await initDatabase()
      
      const tables = await db.listAllRLS(options.schema)
      
      spinner.succeed('RLS status retrieved')
      
      console.log(chalk.bold(`\n🔒 RLS Status (${options.schema})\n`))
      
      tables.forEach(table => {
        const icon = table.rlsEnabled ? '✅' : '❌'
        const forced = table.rlsForced ? ' (FORCED)' : ''
        console.log(`${icon} ${table.tableName}${forced}`)
        
        if (table.policies.length > 0) {
          console.log(chalk.gray(`   Policies: ${table.policies.length}`))
          table.policies.forEach(p => {
            console.log(chalk.gray(`   • ${p.policyName} (${p.command})`))
          })
        } else if (table.rlsEnabled) {
          console.log(chalk.yellow('   ⚠️  No policies defined'))
        }
        console.log('')
      })
      
      const enabled = tables.filter(t => t.rlsEnabled).length
      const disabled = tables.filter(t => !t.rlsEnabled).length
      
      console.log(chalk.bold('Summary:'))
      console.log(`  Total tables: ${tables.length}`)
      console.log(`  RLS enabled: ${enabled}`)
      console.log(`  RLS disabled: ${disabled}`)
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to list RLS')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('rls:enable <table>')
  .description('Enable RLS on a table')
  .option('-s, --schema <name>', 'Schema name', 'public')
  .action(async (table, options) => {
    const spinner = ora(`Enabling RLS on ${table}...`).start()
    
    try {
      const db = await initDatabase()
      
      await db.enableRLS(table, options.schema)
      
      spinner.succeed(`RLS enabled on ${table}`)
      
      console.log(chalk.green(`\n✅ RLS is now enabled on ${options.schema}.${table}`))
      console.log(chalk.yellow('\n⚠️  Remember to create policies, or the table will be inaccessible!'))
      console.log(chalk.gray(`\nNext steps:`))
      console.log(chalk.gray(`  1. Create policies: npm run db rls:apply-nextauth ${table}`))
      console.log(chalk.gray(`  2. Or create custom policies manually`))
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to enable RLS')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('rls:disable <table>')
  .description('Disable RLS on a table')
  .option('-s, --schema <name>', 'Schema name', 'public')
  .action(async (table, options) => {
    const spinner = ora(`Disabling RLS on ${table}...`).start()
    
    try {
      const db = await initDatabase()
      
      await db.disableRLS(table, options.schema)
      
      spinner.succeed(`RLS disabled on ${table}`)
      
      console.log(chalk.green(`\n✅ RLS is now disabled on ${options.schema}.${table}`))
      console.log(chalk.yellow('\n⚠️  Table is now accessible without row-level restrictions!'))
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to disable RLS')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('rls:validate')
  .description('Validate RLS configuration')
  .option('-s, --schema <name>', 'Schema name', 'public')
  .action(async (options) => {
    const spinner = ora('Validating RLS configuration...').start()
    
    try {
      const db = await initDatabase()
      
      const result = await db.validateRLS(options.schema)
      
      if (result.valid) {
        spinner.succeed('RLS validation passed')
      } else {
        spinner.warn('RLS validation found issues')
      }
      
      console.log(chalk.bold(`\n🔍 RLS Validation Results\n`))
      
      console.log(chalk.bold('Summary:'))
      console.log(`  Tables checked: ${result.summary.tablesChecked}`)
      console.log(`  RLS enabled: ${result.summary.rlsEnabled}`)
      console.log(`  RLS disabled: ${result.summary.rlsDisabled}`)
      console.log(`  Policies found: ${result.summary.policiesFound}`)
      console.log(`  Issues found: ${result.summary.issuesFound}`)
      
      if (result.issues.length > 0) {
        console.log(chalk.bold('\n📋 Issues:\n'))
        
        result.issues.forEach((issue, i) => {
          const icon = issue.severity === 'error' ? '🔴' :
                      issue.severity === 'warning' ? '🟡' : 'ℹ️'
          
          console.log(`${i + 1}. ${icon} ${issue.severity.toUpperCase()} - ${issue.table}`)
          console.log(chalk.gray(`   ${issue.issue}`))
          console.log(chalk.cyan(`   💡 ${issue.recommendation}`))
          console.log('')
        })
      } else {
        console.log(chalk.green('\n✅ No issues found!'))
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Validation failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('rls:apply-nextauth <table>')
  .description('Apply NextAuth-friendly RLS policy')
  .option('-s, --schema <name>', 'Schema name', 'public')
  .action(async (table, options) => {
    const spinner = ora(`Applying NextAuth RLS to ${table}...`).start()
    
    try {
      const db = await initDatabase()
      
      await db.applyNextAuthRLS(table, options.schema)
      
      spinner.succeed(`NextAuth RLS applied to ${table}`)
      
      console.log(chalk.green(`\n✅ NextAuth-friendly RLS applied to ${options.schema}.${table}`))
      console.log(chalk.gray(`\nWhat was done:`))
      console.log(chalk.gray(`  1. Enabled RLS on the table`))
      console.log(chalk.gray(`  2. Created permissive policy (allows all operations)`))
      console.log(chalk.gray(`  3. Added explanatory comment`))
      console.log(chalk.yellow(`\n💡 Remember: Authorization is handled in your API layer with requireUserServer()`))
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to apply NextAuth RLS')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

// ============================================================================
// STORAGE COMMANDS (PHASE 4)
// ============================================================================

program
  .command('storage:list')
  .description('List all storage buckets')
  .action(async () => {
    const spinner = ora('Listing storage buckets...').start()
    
    try {
      const db = await initDatabase()
      
      const buckets = await db.listBuckets()
      
      spinner.succeed('Storage buckets retrieved')
      
      console.log(chalk.bold('\n💾 Storage Buckets\n'))
      
      if (buckets.length === 0) {
        console.log(chalk.yellow('No buckets found'))
      } else {
        buckets.forEach(bucket => {
          const visibility = bucket.public ? '🌐 Public' : '🔒 Private'
          console.log(`${visibility} ${bucket.name}`)
          console.log(chalk.gray(`   ID: ${bucket.id}`))
          console.log(chalk.gray(`   Created: ${bucket.createdAt.toLocaleString()}`))
          if (bucket.fileSizeLimit) {
            console.log(chalk.gray(`   Max file size: ${(bucket.fileSizeLimit / 1024 / 1024).toFixed(2)} MB`))
          }
          console.log('')
        })
      }
      
      console.log(chalk.bold('Summary:'))
      console.log(`  Total buckets: ${buckets.length}`)
      console.log(`  Public: ${buckets.filter(b => b.public).length}`)
      console.log(`  Private: ${buckets.filter(b => !b.public).length}`)
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to list buckets')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('storage:create <name>')
  .description('Create a new storage bucket')
  .option('-p, --public', 'Make bucket public')
  .option('--size-limit <mb>', 'Max file size in MB')
  .action(async (name, options) => {
    const spinner = ora(`Creating bucket ${name}...`).start()
    
    try {
      const db = await initDatabase()
      
      const bucket = await db.createBucket(name, {
        public: options.public,
        fileSizeLimit: options.sizeLimit ? parseInt(options.sizeLimit) * 1024 * 1024 : undefined
      })
      
      spinner.succeed(`Bucket ${name} created`)
      
      console.log(chalk.green(`\n✅ Bucket created successfully`))
      console.log(chalk.gray(`\nDetails:`))
      console.log(chalk.gray(`  Name: ${bucket.name}`))
      console.log(chalk.gray(`  Visibility: ${bucket.public ? 'Public' : 'Private'}`))
      if (bucket.fileSizeLimit) {
        console.log(chalk.gray(`  Max file size: ${(bucket.fileSizeLimit / 1024 / 1024).toFixed(2)} MB`))
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to create bucket')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('storage:delete <name>')
  .description('Delete a storage bucket')
  .option('-f, --force', 'Force delete even if bucket has files')
  .action(async (name, options) => {
    const spinner = ora(`Deleting bucket ${name}...`).start()
    
    try {
      const db = await initDatabase()
      
      await db.deleteBucket(name, options.force)
      
      spinner.succeed(`Bucket ${name} deleted`)
      
      console.log(chalk.green(`\n✅ Bucket deleted successfully`))
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to delete bucket')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      
      if (message.includes('contains')) {
        console.error(chalk.yellow('\n💡 Use --force to delete bucket with files'))
      }
      
      process.exit(1)
    }
  })

program
  .command('storage:stats <bucket>')
  .description('Get bucket statistics')
  .action(async (bucket) => {
    const spinner = ora(`Getting stats for ${bucket}...`).start()
    
    try {
      const db = await initDatabase()
      
      const stats = await db.getBucketStats(bucket)
      
      spinner.succeed('Stats retrieved')
      
      console.log(chalk.bold(`\n📊 Bucket Statistics: ${bucket}\n`))
      
      console.log(chalk.bold('Files:'))
      console.log(`  Count: ${stats.fileCount}`)
      console.log(`  Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`)
      
      if (stats.oldestFile) {
        console.log(`  Oldest: ${stats.oldestFile.toLocaleString()}`)
      }
      
      if (stats.newestFile) {
        console.log(`  Newest: ${stats.newestFile.toLocaleString()}`)
      }
      
      if (Object.keys(stats.mimeTypes).length > 0) {
        console.log(chalk.bold('\nFile Types:'))
        Object.entries(stats.mimeTypes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`)
          })
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to get stats')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('storage:cleanup <bucket>')
  .description('Cleanup old files in a bucket')
  .option('-d, --days <days>', 'Delete files older than N days', '30')
  .option('--dry-run', 'Preview without deleting')
  .action(async (bucket, options) => {
    const days = parseInt(options.days)
    const olderThan = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const spinner = ora(`Cleaning up files older than ${days} days...`).start()
    
    try {
      const db = await initDatabase()
      
      const result = await db.cleanupOldFiles(bucket, olderThan, {
        dryRun: options.dryRun
      })
      
      if (options.dryRun) {
        spinner.succeed('Cleanup preview complete')
      } else {
        spinner.succeed('Cleanup complete')
      }
      
      console.log(chalk.bold(`\n🧹 Cleanup Results\n`))
      
      console.log(`Files ${options.dryRun ? 'to delete' : 'deleted'}: ${result.filesDeleted}`)
      console.log(`Space ${options.dryRun ? 'to free' : 'freed'}: ${(result.spaceFreed / 1024 / 1024).toFixed(2)} MB`)
      
      if (result.errors.length > 0) {
        console.log(chalk.red(`\nErrors: ${result.errors.length}`))
        result.errors.slice(0, 5).forEach(err => {
          console.log(chalk.red(`  ${err.file}: ${err.error}`))
        })
      }
      
      if (options.dryRun) {
        console.log(chalk.yellow(`\n💡 Run without --dry-run to actually delete files`))
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Cleanup failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

// ============================================================================
// SEED COMMANDS (PHASE 4)
// ============================================================================

program
  .command('seed <file>')
  .description('Load and execute a seed file')
  .action(async (file) => {
    const spinner = ora(`Loading seed file: ${file}...`).start()
    
    try {
      const db = await initDatabase()
      
      const result = await db.loadSeedFile(file)
      
      if (result.success) {
        spinner.succeed('Seed file executed successfully')
      } else {
        spinner.fail('Seed file execution failed')
      }
      
      console.log(chalk.bold(`\n🌱 Seed Results\n`))
      
      console.log(`Tables seeded: ${result.tablesSeeded.length}`)
      if (result.tablesSeeded.length > 0) {
        console.log(chalk.gray(`  ${result.tablesSeeded.join(', ')}`))
      }
      
      console.log(`Rows inserted: ${result.rowsInserted}`)
      console.log(`Duration: ${result.duration}ms`)
      
      if (result.errors.length > 0) {
        console.log(chalk.red(`\nErrors: ${result.errors.length}`))
        result.errors.forEach(err => {
          console.log(chalk.red(`  ${err.table}: ${err.error}`))
        })
      }
      
      await db.shutdown()
      
      if (!result.success) {
        process.exit(1)
      }
    } catch (error) {
      spinner.fail('Failed to load seed file')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('seed:list <directory>')
  .description('List seed files in a directory')
  .action(async (directory) => {
    const spinner = ora(`Listing seed files in ${directory}...`).start()
    
    try {
      const db = await initDatabase()
      
      const files = await db.listSeedFiles(directory)
      
      spinner.succeed(`Found ${files.length} seed files`)
      
      if (files.length === 0) {
        console.log(chalk.yellow('\nNo seed files found'))
      } else {
        console.log(chalk.bold('\n🌱 Seed Files\n'))
        files.forEach((file, i) => {
          console.log(`${i + 1}. ${file}`)
        })
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to list seed files')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('seed:truncate <tables...>')
  .description('Truncate tables')
  .option('-c, --cascade', 'Cascade to dependent objects')
  .option('-r, --restart', 'Restart identity sequences')
  .action(async (tables, options) => {
    const spinner = ora(`Truncating ${tables.length} table(s)...`).start()
    
    try {
      const db = await initDatabase()
      
      for (const table of tables) {
        await db.truncateTable(table, {
          cascade: options.cascade,
          restart: options.restart
        })
      }
      
      spinner.succeed(`Truncated ${tables.length} table(s)`)
      
      console.log(chalk.green(`\n✅ Tables truncated successfully`))
      console.log(chalk.gray(`\nTables: ${tables.join(', ')}`))
      
      if (options.cascade) {
        console.log(chalk.yellow('⚠️  CASCADE: Dependent objects were also truncated'))
      }
      
      if (options.restart) {
        console.log(chalk.gray('🔄 Identity sequences restarted'))
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to truncate tables')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('seed:reset')
  .description('Reset database (truncate all tables and reset sequences)')
  .option('-s, --schema <name>', 'Schema name', 'public')
  .option('--confirm', 'Required confirmation flag')
  .option('--exclude <tables>', 'Comma-separated list of tables to exclude')
  .action(async (options) => {
    if (!options.confirm) {
      console.error(chalk.red('\n❌ This command requires explicit confirmation!'))
      console.error(chalk.yellow('   Add --confirm flag to proceed'))
      console.error(chalk.gray('\n   Example: npm run db seed:reset --confirm'))
      console.error(chalk.red('\n⚠️  WARNING: This will delete ALL data in the database!'))
      process.exit(1)
    }
    
    const spinner = ora('Resetting database...').start()
    
    try {
      const db = await initDatabase()
      
      const exclude = options.exclude ? options.exclude.split(',').map((s: string) => s.trim()) : []
      
      const result = await db.resetDatabase(options.schema, {
        confirm: true,
        exclude
      })
      
      spinner.succeed('Database reset complete')
      
      console.log(chalk.bold('\n🔄 Reset Results\n'))
      
      console.log(`Tables truncated: ${result.tablesTruncated}`)
      console.log(`Sequences reset: ${result.sequencesReset}`)
      
      if (exclude.length > 0) {
        console.log(chalk.gray(`\nExcluded: ${exclude.join(', ')}`))
      }
      
      console.log(chalk.green('\n✅ Database reset successfully'))
      console.log(chalk.yellow('⚠️  All data has been deleted!'))
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to reset database')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('seed:count <table>')
  .description('Get row count for a table')
  .action(async (table) => {
    const spinner = ora(`Counting rows in ${table}...`).start()
    
    try {
      const db = await initDatabase()
      
      const count = await db.getTableCount(table)
      
      spinner.succeed('Count retrieved')
      
      console.log(chalk.bold(`\n📊 Table: ${table}\n`))
      console.log(`Rows: ${count.toLocaleString()}`)
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to count rows')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

// ============================================================================
// MIGRATION GENERATION COMMANDS (PHASE 4)
// ============================================================================

program
  .command('migrate:generate <name>')
  .description('Generate a new migration file')
  .option('-t, --template <name>', 'Use a template (create_table, add_column, create_index)')
  .option('-d, --directory <path>', 'Migration directory', 'database/supabase/migrations')
  .action(async (name, options) => {
    const spinner = ora(`Generating migration: ${name}...`).start()
    
    try {
      const db = await initDatabase()
      
      let content: string
      
      if (options.template) {
        // Use template
        spinner.text = `Using template: ${options.template}...`
        
        // Get template variables from user (simplified for CLI)
        const templates = db.listMigrationTemplates()
        
        if (!templates.includes(options.template)) {
          throw new Error(`Unknown template: ${options.template}. Available: ${templates.join(', ')}`)
        }
        
        // For CLI, generate basic template
        content = `-- Migration: ${name}
-- Generated: ${new Date().toISOString()}
-- Template: ${options.template}

-- TODO: Add your migration SQL here

`
      } else {
        // Generate empty migration
        content = `-- Migration: ${name}
-- Generated: ${new Date().toISOString()}

-- TODO: Add your migration SQL here

`
      }
      
      const result = await db.createMigrationFile(options.directory, name, content)
      
      spinner.succeed('Migration file created')
      
      console.log(chalk.bold('\n📝 Migration Created\n'))
      console.log(`File: ${result.filename}`)
      console.log(`Path: ${result.path}`)
      console.log(chalk.gray(`\nEdit the file to add your migration SQL`))
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to generate migration')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('migrate:templates')
  .description('List available migration templates')
  .action(async () => {
    const spinner = ora('Loading templates...').start()
    
    try {
      const db = await initDatabase()
      
      const templates = db.listMigrationTemplates()
      
      spinner.succeed('Templates loaded')
      
      console.log(chalk.bold('\n📋 Migration Templates\n'))
      
      templates.forEach((template, i) => {
        console.log(`${i + 1}. ${template}`)
      })
      
      console.log(chalk.gray('\nUsage: npm run db migrate:generate <name> --template <template_name>'))
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to load templates')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('migrate:diff <schema1> <schema2>')
  .description('Generate migration from schema diff')
  .option('-n, --name <name>', 'Migration name', 'schema_diff')
  .option('-d, --directory <path>', 'Migration directory', 'database/supabase/migrations')
  .action(async (schema1, schema2, options) => {
    const spinner = ora(`Comparing ${schema1} and ${schema2}...`).start()
    
    try {
      const db = await initDatabase()
      
      spinner.text = 'Generating migration from diff...'
      
      const migration = await db.generateMigrationFromDiff(schema1, schema2, {
        name: options.name
      })
      
      spinner.text = 'Creating migration file...'
      
      const result = await db.createMigrationFile(
        options.directory,
        options.name,
        migration.content
      )
      
      spinner.succeed('Migration generated from schema diff')
      
      console.log(chalk.bold('\n📊 Schema Diff Migration\n'))
      console.log(`File: ${result.filename}`)
      console.log(`Path: ${result.path}`)
      console.log(chalk.yellow(`\n⚠️  Review the generated SQL before running!`))
      console.log(chalk.gray(`Some statements may need manual adjustment`))
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to generate diff migration')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

// ============================================================================
// ADMIN OPERATIONS COMMANDS (PHASE 4)
// ============================================================================

program
  .command('admin:vacuum [table]')
  .description('VACUUM a table or entire database')
  .option('-f, --full', 'Perform VACUUM FULL')
  .option('-a, --analyze', 'Also run ANALYZE')
  .option('-v, --verbose', 'Verbose output')
  .action(async (table, options) => {
    const target = table || 'entire database'
    const spinner = ora(`Running VACUUM on ${target}...`).start()
    
    try {
      const db = await initDatabase()
      
      const result = await db.vacuum(table, {
        full: options.full,
        analyze: options.analyze,
        verbose: options.verbose
      })
      
      if (result.success) {
        spinner.succeed(`VACUUM completed in ${result.duration}ms`)
      } else {
        spinner.fail('VACUUM failed')
      }
      
      console.log(chalk.bold('\n🧹 VACUUM Results\n'))
      console.log(`Target: ${target}`)
      console.log(`Duration: ${result.duration}ms`)
      
      if (options.full) {
        console.log(chalk.yellow('Mode: FULL (reclaimed all space)'))
      }
      
      if (options.analyze) {
        console.log(chalk.gray('ANALYZE: Statistics updated'))
      }
      
      if (result.message) {
        console.log(chalk.red(`\nError: ${result.message}`))
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('VACUUM failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('admin:analyze [table]')
  .description('ANALYZE a table or entire database')
  .option('-v, --verbose', 'Verbose output')
  .action(async (table, options) => {
    const target = table || 'entire database'
    const spinner = ora(`Running ANALYZE on ${target}...`).start()
    
    try {
      const db = await initDatabase()
      
      const result = await db.analyze(table, options.verbose)
      
      if (result.success) {
        spinner.succeed(`ANALYZE completed in ${result.duration}ms`)
      } else {
        spinner.fail('ANALYZE failed')
      }
      
      console.log(chalk.bold('\n📊 ANALYZE Results\n'))
      console.log(`Target: ${target}`)
      console.log(`Duration: ${result.duration}ms`)
      console.log(chalk.gray('Statistics updated for query planner'))
      
      if (result.message) {
        console.log(chalk.red(`\nError: ${result.message}`))
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('ANALYZE failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('admin:reindex <target>')
  .description('REINDEX a table, index, or database')
  .option('-t, --type <type>', 'Type: TABLE, INDEX, SCHEMA, DATABASE', 'TABLE')
  .action(async (target, options) => {
    const spinner = ora(`Running REINDEX ${options.type} ${target}...`).start()
    
    try {
      const db = await initDatabase()
      
      const result = await db.reindex(target, options.type)
      
      if (result.success) {
        spinner.succeed(`REINDEX completed in ${result.duration}ms`)
      } else {
        spinner.fail('REINDEX failed')
      }
      
      console.log(chalk.bold('\n🔄 REINDEX Results\n'))
      console.log(`Type: ${options.type}`)
      console.log(`Target: ${target}`)
      console.log(`Duration: ${result.duration}ms`)
      console.log(chalk.gray('Indexes rebuilt successfully'))
      
      if (result.message) {
        console.log(chalk.red(`\nError: ${result.message}`))
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('REINDEX failed')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('admin:connections')
  .description('List all database connections')
  .action(async () => {
    const spinner = ora('Fetching connections...').start()
    
    try {
      const db = await initDatabase()
      
      const connections = await db.listConnections()
      const stats = await db.getConnectionStats()
      
      spinner.succeed('Connections retrieved')
      
      console.log(chalk.bold('\n🔌 Database Connections\n'))
      
      console.log(chalk.bold('Statistics:'))
      console.log(`  Total: ${stats.total}`)
      console.log(`  Active: ${stats.active}`)
      console.log(`  Idle: ${stats.idle}`)
      console.log(`  Idle in transaction: ${stats.idleInTransaction}`)
      
      if (connections.length > 0) {
        console.log(chalk.bold('\nConnections:\n'))
        
        connections.slice(0, 10).forEach(conn => {
          console.log(`PID ${conn.pid}: ${conn.username}@${conn.database}`)
          console.log(chalk.gray(`  State: ${conn.state}`))
          console.log(chalk.gray(`  App: ${conn.applicationName}`))
          if (conn.query && conn.query !== '<IDLE>') {
            console.log(chalk.gray(`  Query: ${conn.query.substring(0, 80)}...`))
          }
          console.log('')
        })
        
        if (connections.length > 10) {
          console.log(chalk.gray(`... and ${connections.length - 10} more`))
        }
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to fetch connections')
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

program
  .command('admin:kill <pid>')
  .description('Terminate a database connection')
  .option('-c, --cancel', 'Cancel query instead of terminating connection')
  .action(async (pid, options) => {
    const pidNum = parseInt(pid)
    const action = options.cancel ? 'Canceling query' : 'Terminating connection'
    const spinner = ora(`${action} for PID ${pidNum}...`).start()
    
    try {
      const db = await initDatabase()
      
      const success = options.cancel
        ? await db.cancelQuery(pidNum)
        : await db.terminateConnection(pidNum)
      
      if (success) {
        spinner.succeed(`${action} successful`)
        console.log(chalk.green(`\n✅ PID ${pidNum} ${options.cancel ? 'query canceled' : 'connection terminated'}`))
      } else {
        spinner.fail(`${action} failed`)
        console.log(chalk.yellow(`\n⚠️  Could not ${options.cancel ? 'cancel' : 'terminate'} PID ${pidNum}`))
        console.log(chalk.gray('Connection may have already closed'))
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail(`${action} failed`)
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(chalk.red(`\n❌ ${message}`))
      process.exit(1)
    }
  })

// ============================================================================
// REGISTRY COMMANDS (PHASE 5)
// ============================================================================

program
  .command('registry:sync')
  .description('Sync registry from information_schema')
  .option('-s, --schema <name>', 'Schema name to sync', 'public')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    const spinner = ora('Syncing schema registry...').start()
    
    try {
      const db = await initDatabase()
      const { RegistryManager } = await import('../preflight/registry-manager')
      const registry = new RegistryManager(db)
      const result = await registry.syncFromSchema(options.schema)
      
      spinner.succeed('Schema registry synced successfully!\n')
      
      console.log(chalk.bold('📊 Sync Summary:\n'))
      console.log(`Total Synced: ${chalk.green(result.synced)}`)
      console.log(`Tables: ${result.details.tables}`)
      console.log(`Views: ${result.details.views}`)
      console.log(`Enums: ${result.details.enums}`)
      console.log(`Columns: ${result.details.columns}`)
      if (result.errors > 0) {
        console.log(`Errors: ${chalk.red(result.errors)}`)
      }
      
      console.log(chalk.dim('\n💡 Next: npm run db registry:stats'))
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to sync schema registry')
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

program
  .command('registry:search <query>')
  .description('Search registry for schema objects')
  .option('-d, --domain <domain>', 'Filter by domain')
  .option('-k, --kind <kind>', 'Filter by kind (table|view|enum|function)')
  .option('-l, --limit <number>', 'Max results', '20')
  .action(async (query, options) => {
    const spinner = ora(`Searching for "${query}"...`).start()
    
    try {
      const db = await initDatabase()
      const { RegistryManager } = await import('../preflight/registry-manager')
      const registry = new RegistryManager(db)
      const results = await registry.search({
        query,
        domain: options.domain,
        kind: options.kind,
        limit: parseInt(options.limit)
      })
      
      spinner.stop()
      
      if (results.length === 0) {
        console.log(chalk.yellow(`\n⚠️  No results found for "${query}"\n`))
        await db.shutdown()
        return
      }
      
      console.log(chalk.bold(`\n🔍 Found ${results.length} results:\n`))
      results.forEach(obj => {
        console.log(`${chalk.cyan(obj.kind.padEnd(10))} ${chalk.bold(obj.name.padEnd(30))} ${obj.domain.padEnd(15)} ${obj.description || chalk.dim('(no description)')}`)
      })
      console.log()
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Search failed')
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

program
  .command('registry:stats')
  .description('Show registry statistics')
  .action(async () => {
    const spinner = ora('Loading registry statistics...').start()
    
    try {
      const db = await initDatabase()
      const { RegistryManager } = await import('../preflight/registry-manager')
      const registry = new RegistryManager(db)
      const stats = await registry.getStats()
      
      spinner.succeed('Registry statistics loaded!\n')
      
      console.log(chalk.bold('📊 Registry Statistics:\n'))
      console.log(`Tables: ${chalk.green(stats.tables || '0')}`)
      console.log(`Views: ${stats.views || '0'}`)
      console.log(`Enums: ${stats.enums || '0'}`)
      console.log(`Functions: ${stats.functions || '0'}`)
      console.log(`Total Columns: ${stats.columns || '0'}`)
      console.log(`Vector Embeddings: ${stats.embeddings || '0'}`)
      
      if (stats.last_sync) {
        const lastSync = new Date(stats.last_sync)
        const hoursSince = Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60))
        console.log(chalk.dim(`\n📅 Last sync: ${lastSync.toLocaleString()} (${hoursSince}h ago)`))
        
        if (hoursSince > 24) {
          console.log(chalk.yellow(`\n⚠️  Registry is ${hoursSince}h old. Consider running: npm run db registry:sync`))
        }
      } else {
        console.log(chalk.yellow('\n⚠️  Registry never synced. Run: npm run db registry:sync'))
      }
      console.log()
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to load statistics')
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

program
  .command('registry:embed')
  .description('Generate embeddings for schema objects')
  .option('--refresh', 'Re-embed all objects (default: only new)')
  .action(async (options) => {
    const spinner = ora('Generating embeddings...').start()
    
    try {
      const db = await initDatabase()
      const { EmbeddingService } = await import('../ai/embedding-service')
      const { EmbeddingManager } = await import('../ai/embedding-manager')
      
      const embeddingService = new EmbeddingService()
      const embeddingManager = new EmbeddingManager(db, embeddingService)
      
      let completed = 0
      let total = 0
      
      const stats = await embeddingManager.embedAll({
        refresh: options.refresh,
        onProgress: (c, t) => {
          completed = c
          total = t
          spinner.text = `Generating embeddings... ${c}/${t} (${Math.round((c/t) * 100)}%)`
        }
      })
      
      spinner.succeed('Embeddings generated!')
      
      console.log(chalk.bold('\n📊 Embedding Statistics\n'))
      console.log(`Total Objects: ${stats.total_objects}`)
      console.log(chalk.green(`Embedded: ${stats.embedded}`))
      if (stats.pending > 0) {
        console.log(chalk.yellow(`Pending: ${stats.pending}`))
      }
      console.log(`Total Tokens: ${stats.total_tokens.toLocaleString()}`)
      console.log(`Estimated Cost: $${stats.estimated_cost.toFixed(4)}`)
      
      console.log(chalk.dim('\n💡 Next: npm run db registry:similar --text "your search query"'))
      await db.shutdown()
    } catch (error) {
      spinner.fail('Failed to generate embeddings')
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

program
  .command('registry:similar')
  .description('Find similar schema objects')
  .option('--text <query>', 'Search text')
  .option('--limit <n>', 'Maximum results (default: 10)', '10')
  .option('--threshold <n>', 'Minimum similarity (0-1, default: 0.5)', '0.5')
  .option('-k, --kind <kind>', 'Filter by kind (table|view)')
  .option('-d, --domain <domain>', 'Filter by domain')
  .action(async (options) => {
    if (!options.text) {
      console.error(chalk.red('Error: --text is required'))
      console.log(chalk.dim('Usage: npm run db registry:similar --text "vehicle notes"'))
      process.exit(1)
    }
    
    const spinner = ora('Searching for similar objects...').start()
    
    try {
      const db = await initDatabase()
      const { EmbeddingService } = await import('../ai/embedding-service')
      const { EmbeddingManager } = await import('../ai/embedding-manager')
      
      const embeddingService = new EmbeddingService()
      const embeddingManager = new EmbeddingManager(db, embeddingService)
      
      const results = await embeddingManager.findSimilar(options.text, {
        limit: parseInt(options.limit),
        threshold: parseFloat(options.threshold),
        kind: options.kind,
        domain: options.domain
      })
      
      spinner.stop()
      
      if (results.length === 0) {
        console.log(chalk.yellow('\n⚠️  No similar objects found'))
        console.log(chalk.dim('Try lowering the threshold or broadening your search'))
      } else {
        console.log(chalk.bold(`\n🔍 Found ${results.length} similar object(s)\n`))
        
        results.forEach((result, index) => {
          const similarity = (result.similarity * 100).toFixed(1)
          const simValue = parseFloat(similarity)
          
          // Risk indicator
          let riskIcon = '🟢'
          let riskLabel = 'LOW RISK'
          let riskColor = chalk.green
          
          if (simValue >= 80) {
            riskIcon = '🔴'
            riskLabel = 'HIGH RISK - Very similar table exists!'
            riskColor = chalk.red
          } else if (simValue >= 60) {
            riskIcon = '🟡'
            riskLabel = 'MEDIUM RISK - Similar table found'
            riskColor = chalk.yellow
          } else if (simValue >= 40) {
            riskIcon = '🟢'
            riskLabel = 'LOW RISK - Somewhat related'
            riskColor = chalk.green
          } else {
            riskIcon = '⚪'
            riskLabel = 'WEAK - Loosely related'
            riskColor = chalk.dim
          }
          
          console.log(chalk.bold(`${index + 1}. ${result.schema_name}.${result.name} ${riskIcon}`))
          console.log(`   Type: ${result.kind} | Domain: ${result.domain || 'none'}`)
          console.log(riskColor(`   ${riskLabel} (${similarity}%)`))
          if (result.description) {
            console.log(chalk.dim(`   ${result.description}`))
          }
          console.log(chalk.dim(`   Embedding: ${result.embedding_text.substring(0, 100)}...`))
          console.log()
        })
      }
      
      await db.shutdown()
    } catch (error) {
      spinner.fail('Search failed')
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

// ============================================================================
// SCHEMA LINTING (Phase 5 Day 3)
// ============================================================================

program
  .command('schema:lint')
  .description('Validate schema against linting rules')
  .option('-t, --table <name>', 'Lint specific table')
  .option('-s, --schema <name>', 'Schema name (default: public)', 'public')
  .option('--show-all', 'Show all issues (including info)')
  .action(async (options) => {
    const spinner = ora('Linting schema...').start()
    
    try {
      const db = await initDatabase()
      const { SchemaLinter } = await import('../linting/schema-linter')
      
      const linter = new SchemaLinter(db)
      
      let result
      if (options.table) {
        spinner.text = `Linting table ${options.table}...`
        const issues = await linter.lintTable(options.table, options.schema)
        
        // Create result object
        result = {
          passed: !issues.some(i => i.severity === 'error'),
          total_tables: 1,
          passing_tables: issues.some(i => i.severity === 'error') ? 0 : 1,
          blockers: issues.filter(i => i.severity === 'error'),
          warnings: issues.filter(i => i.severity === 'warning'),
          info: issues.filter(i => i.severity === 'info')
        }
      } else {
        result = await linter.lintSchema(options.schema)
      }
      
      spinner.stop()
      
      // Display results
      console.log(chalk.bold('\n📋 Schema Lint Results\n'))
      
      // Summary
      if (result.passed) {
        console.log(chalk.green(`✅ All checks passed!`))
      } else {
        console.log(chalk.red(`❌ ${result.blockers.length} blocker(s) found`))
      }
      
      console.log(`Tables: ${result.passing_tables}/${result.total_tables} passing`)
      console.log()
      
      // Blockers
      if (result.blockers.length > 0) {
        console.log(chalk.red.bold(`❌ BLOCKERS (must fix):\n`))
        result.blockers.forEach((issue, index) => {
          console.log(chalk.red(`${index + 1}. [${issue.category}] ${issue.message}`))
          if (issue.table) {
            console.log(chalk.dim(`   Table: ${issue.table}${issue.column ? `.${issue.column}` : ''}`))
          }
          if (issue.fix) {
            console.log(chalk.cyan(`   Fix: ${issue.fix}`))
          }
          console.log()
        })
      }
      
      // Warnings
      if (result.warnings.length > 0) {
        console.log(chalk.yellow.bold(`⚠️  WARNINGS (review recommended):\n`))
        result.warnings.forEach((issue, index) => {
          console.log(chalk.yellow(`${index + 1}. [${issue.category}] ${issue.message}`))
          if (issue.table) {
            console.log(chalk.dim(`   Table: ${issue.table}${issue.column ? `.${issue.column}` : ''}`))
          }
          if (issue.fix) {
            console.log(chalk.cyan(`   Fix: ${issue.fix}`))
          }
          console.log()
        })
      }
      
      // Info (only if --show-all)
      if (options.showAll && result.info.length > 0) {
        console.log(chalk.blue.bold(`💡 SUGGESTIONS (optional improvements):\n`))
        result.info.forEach((issue, index) => {
          console.log(chalk.blue(`${index + 1}. [${issue.category}] ${issue.message}`))
          if (issue.table) {
            console.log(chalk.dim(`   Table: ${issue.table}${issue.column ? `.${issue.column}` : ''}`))
          }
          if (issue.fix) {
            console.log(chalk.cyan(`   Fix: ${issue.fix}`))
          }
          console.log()
        })
      } else if (result.info.length > 0) {
        console.log(chalk.dim(`💡 ${result.info.length} suggestions available (use --show-all to view)`))
        console.log()
      }
      
      // Summary footer
      if (result.passed) {
        console.log(chalk.green(`\n✅ Schema is production-ready!`))
      } else {
        console.log(chalk.red(`\n❌ Fix blockers before deploying`))
      }
      
      await db.shutdown()
      
      // Exit with error code if blockers exist
      if (!result.passed) {
        process.exit(1)
      }
    } catch (error) {
      spinner.fail('Linting failed')
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

// ============================================================================
// SCHEMA AUTO-FIXES (Phase 6)
// ============================================================================

program
  .command('schema:fix')
  .description('Generate automatic fixes for linting violations')
  .option('-t, --table <name>', 'Table to fix (required)')
  .option('-s, --schema <name>', 'Schema name (default: public)', 'public')
  .option('--apply', 'Apply fixes immediately')
  .option('--save-migration', 'Save fixes as migration file')
  .option('--dry-run', 'Preview fixes without applying')
  .action(async (options) => {
    if (!options.table) {
      console.error(chalk.red('Error: --table is required'))
      console.log(chalk.dim('Usage: npm run db schema:fix --table vehicles'))
      process.exit(1)
    }
    
    const spinner = ora('Generating fixes...').start()
    
    try {
      const db = await initDatabase()
      const { SchemaLinter } = await import('../linting/schema-linter')
      const { SchemaFixer } = await import('../linting/schema-fixer')
      
      // Run linting first
      spinner.text = 'Running schema lint...'
      const linter = new SchemaLinter(db)
      const issues = await linter.lintTable(options.table, options.schema)
      
      const result = {
        passed: !issues.some(i => i.severity === 'error'),
        total_tables: 1,
        passing_tables: issues.some(i => i.severity === 'error') ? 0 : 1,
        blockers: issues.filter(i => i.severity === 'error'),
        warnings: issues.filter(i => i.severity === 'warning'),
        info: issues.filter(i => i.severity === 'info')
      }
      
      if (result.passed && result.warnings.length === 0 && result.info.length === 0) {
        spinner.succeed('No issues found - table is perfect!')
        console.log(chalk.green('\n✅ No fixes needed'))
        await db.shutdown()
        return
      }
      
      // Generate fixes
      spinner.text = 'Generating automatic fixes...'
      const fixer = new SchemaFixer(db)
      const fixResult = await fixer.generateFixes(options.table, result, {
        autoApply: options.apply && !options.dryRun,
        dryRun: options.dryRun
      })
      
      spinner.stop()
      
      // Display results
      console.log(chalk.bold('\n🔧 Auto-Fix Results\n'))
      
      if (fixResult.fixes.length === 0) {
        console.log(chalk.yellow('⚠️  No automatic fixes available'))
        console.log(chalk.dim('Some issues require manual migration'))
      } else {
        console.log(`Found ${chalk.cyan(fixResult.fixes.length)} fixable issue(s)\n`)
        
        const critical = fixResult.fixes.filter(f => f.severity === 'critical')
        const recommended = fixResult.fixes.filter(f => f.severity === 'recommended')
        
        if (critical.length > 0) {
          console.log(chalk.red.bold(`🔴 CRITICAL FIXES (${critical.length}):\n`))
          critical.forEach((fix, i) => {
            console.log(chalk.red(`${i + 1}. ${fix.description}`))
            console.log(chalk.dim(`   Rule: ${fix.rule}`))
            if (!options.apply) {
              console.log(chalk.cyan(`   SQL:\n${fix.sql.split('\n').map(l => `     ${l}`).join('\n')}`))
            }
            console.log()
          })
        }
        
        if (recommended.length > 0) {
          console.log(chalk.yellow.bold(`🟡 RECOMMENDED FIXES (${recommended.length}):\n`))
          recommended.forEach((fix, i) => {
            console.log(chalk.yellow(`${i + 1}. ${fix.description}`))
            console.log(chalk.dim(`   Rule: ${fix.rule}`))
            if (!options.apply) {
              console.log(chalk.cyan(`   SQL:\n${fix.sql.split('\n').map(l => `     ${l}`).join('\n')}`))
            }
            console.log()
          })
        }
        
        // Show status
        if (options.apply && !options.dryRun) {
          if (fixResult.applied) {
            console.log(chalk.green.bold(`\n✅ Fixes applied successfully!`))
            if (fixResult.errors && fixResult.errors.length > 0) {
              console.log(chalk.red(`\n⚠️  Some fixes failed:`))
              fixResult.errors.forEach(err => console.log(chalk.red(`   • ${err}`)))
            }
          }
        } else if (options.dryRun) {
          console.log(chalk.dim('\n💡 This is a dry-run. Use --apply to execute fixes.'))
        } else {
          console.log(chalk.dim('\n💡 To apply fixes: npm run db schema:fix --table ' + options.table + ' --apply'))
        }
        
        // Save migration if requested
        if (options.saveMigration) {
          spinner.start('Generating migration file...')
          const migrationPath = await fixer.generateMigrationFile(options.table, fixResult.fixes)
          spinner.succeed('Migration file created')
          console.log(chalk.cyan(`\n📄 Migration: ${migrationPath}`))
        }
      }
      
      await db.shutdown()
      
    } catch (error) {
      spinner.fail('Fix generation failed')
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

// ============================================================================
// AI PREFLIGHT (Phase 5 Day 4)
// ============================================================================

program
  .command('ai:preflight')
  .description('Run AI-powered preflight checks before deployment')
  .option('-f, --feature <name>', 'Feature name or description')
  .option('-d, --domain <name>', 'Domain (e.g., vehicles, trips)')
  .option('-t, --table <name>', 'Table name to validate')
  .option('-o, --output <path>', 'Output path for change plan JSON', 'change_plan.json')
  .action(async (options) => {
    const spinner = ora('Running preflight checks...').start()
    
    try {
      const db = await initDatabase()
      const { EmbeddingService } = await import('../ai/embedding-service')
      const { EmbeddingManager } = await import('../ai/embedding-manager')
      const { SchemaLinter } = await import('../linting/schema-linter')
      const { PreflightEngine } = await import('../preflight/preflight-engine')
      
      spinner.stop()
      
      // Initialize services
      const embeddingService = new EmbeddingService()
      const embeddingManager = new EmbeddingManager(db, embeddingService)
      const linter = new SchemaLinter(db)
      const preflight = new PreflightEngine(db, embeddingManager, linter)
      
      // Run preflight
      const plan = await preflight.run({
        feature: options.feature,
        domain: options.domain,
        tableName: options.table
      })
      
      // Display results
      console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
      console.log(chalk.bold('🎯 PREFLIGHT RESULT'))
      console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
      
      // Status
      if (plan.status === 'blocked') {
        console.log(chalk.red.bold(`❌ BLOCKED`))
      } else if (plan.status === 'needs_review') {
        console.log(chalk.yellow.bold(`⚠️  NEEDS REVIEW`))
      } else {
        console.log(chalk.green.bold(`✅ PASSED`))
      }
      console.log()
      
      // Summary
      console.log(chalk.bold('Summary:'))
      console.log(`  ${plan.summary}`)
      console.log()
      
      // Duplicates
      if (plan.duplicates.found) {
        console.log(chalk.yellow.bold(`⚠️  Similar Tables Found (${plan.duplicates.count}):\n`))
        plan.duplicates.matches.slice(0, 3).forEach((match, i) => {
          const similarity = (match.similarity * 100).toFixed(1)
          console.log(chalk.yellow(`  ${i + 1}. ${match.schema}.${match.table} (${similarity}% match)`))
          console.log(chalk.dim(`     ${match.reason}`))
        })
        console.log()
      }
      
      // Lint results
      if (plan.lint_results) {
        if (plan.lint_results.blockers > 0) {
          console.log(chalk.red.bold(`❌ Linting Blockers (${plan.lint_results.blockers}):\n`))
          plan.lint_results.issues
            .filter(i => i.severity === 'error')
            .slice(0, 5)
            .forEach((issue, i) => {
              console.log(chalk.red(`  ${i + 1}. ${issue.message}`))
              if (issue.fix) {
                console.log(chalk.cyan(`     Fix: ${issue.fix}`))
              }
            })
          console.log()
        }
        
        if (plan.lint_results.warnings > 0) {
          console.log(chalk.yellow(`⚠️  ${plan.lint_results.warnings} warning(s) found\n`))
        }
      }
      
      // Type status
      if (plan.types && plan.types.checked) {
        if (!plan.types.up_to_date) {
          console.log(chalk.yellow.bold(`⚠️  TypeScript Types Stale\n`))
          console.log(chalk.yellow(`  Database types need to be regenerated`))
          console.log(chalk.cyan(`  Run: npm run db types:generate`))
          console.log()
        }
      }
      
      // Actions
      if (plan.actions.length > 0) {
        console.log(chalk.bold('Recommended Actions:\n'))
        plan.actions.forEach((action, i) => {
          const icon = action.priority === 'critical' ? '🔴' : 
                       action.priority === 'high' ? '🟡' : '🟢'
          
          // Highlight auto-fix actions (Phase 6 integration)
          if (action.type === 'auto_fix_available') {
            console.log(chalk.green.bold(`  ${i + 1}. ✨ [AUTO-FIX] ${action.message}`))
            if (action.command) {
              console.log(chalk.cyan.bold(`     → ${action.command}`))
            }
          } else {
            console.log(`  ${i + 1}. ${icon} [${action.priority.toUpperCase()}] ${action.message}`)
            if (action.command) {
              console.log(chalk.cyan(`     → ${action.command}`))
            }
          }
        })
        console.log()
      }
      
      // Recommendation
      console.log(chalk.bold('Recommendation:'))
      if (plan.recommendation === 'BLOCKED') {
        console.log(chalk.red('  ❌ DO NOT PROCEED - Fix blockers first'))
      } else if (plan.recommendation === 'REUSE_EXISTING') {
        console.log(chalk.yellow('  ⚠️  CONSIDER REUSING - Similar table exists'))
      } else if (plan.recommendation === 'FIX_ISSUES') {
        console.log(chalk.yellow('  ⚠️  FIX ISSUES - Address warnings before deploy'))
      } else {
        console.log(chalk.green('  ✅ SAFE TO PROCEED'))
      }
      console.log()
      
      // Save plan
      await preflight.savePlan(plan, options.output)
      console.log(chalk.dim(`📄 Change plan saved to: ${options.output}\n`))
      
      await db.shutdown()
      
      // Exit with error code if blocked
      if (plan.status === 'blocked') {
        process.exit(1)
      }
    } catch (error) {
      spinner.fail('Preflight checks failed')
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

// ============================================================================
// TYPE GENERATION (Phase 5 Final)
// ============================================================================

program
  .command('types:generate')
  .description('Generate TypeScript types from database schema')
  .option('-o, --output <path>', 'Output path', 'types/supabase.ts')
  .option('--helpers', 'Also generate helper types')
  .action(async (options) => {
    const spinner = ora('Generating TypeScript types...').start()
    
    try {
      const { TypeGenerator } = await import('../types/type-generator')
      
      const generator = new TypeGenerator()
      const result = await generator.generate({
        outputPath: options.output
      })
      
      if (!result.success) {
        spinner.fail('Type generation failed')
        console.error(chalk.red('\n❌ Error:'), result.error)
        process.exit(1)
      }
      
      spinner.succeed('Types generated successfully')
      
      console.log(chalk.bold('\n📄 Type Generation Results\n'))
      console.log(`Output: ${chalk.cyan(result.outputPath)}`)
      console.log(`Schema Hash: ${chalk.dim(result.schemaHash)}`)
      
      if (result.changed) {
        console.log(chalk.yellow('\n⚠️  Types changed - commit the updated file'))
      } else {
        console.log(chalk.green('\n✅ Types unchanged'))
      }
      
      // Generate helpers if requested
      if (options.helpers) {
        spinner.start('Generating helper types...')
        await generator.generateHelpers()
        spinner.succeed('Helper types generated')
        console.log(`Helpers: ${chalk.cyan('types/database-helpers.ts')}`)
      }
      
      console.log(chalk.dim('\n💡 Import types: import type { Database } from \'@/types/supabase\''))
      
    } catch (error) {
      spinner.fail('Type generation failed')
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

program
  .command('types:validate')
  .description('Validate that types are up-to-date')
  .option('-o, --output <path>', 'Types file path', 'types/supabase.ts')
  .action(async (options) => {
    const spinner = ora('Validating types...').start()
    
    try {
      const { TypeGenerator } = await import('../types/type-generator')
      
      const generator = new TypeGenerator()
      const isValid = await generator.validate({
        outputPath: options.output
      })
      
      if (isValid) {
        spinner.succeed('Types are up-to-date')
        console.log(chalk.green('\n✅ Types match current schema'))
      } else {
        spinner.fail('Types are stale')
        console.log(chalk.red('\n❌ Types do not match current schema'))
        console.log(chalk.yellow('Run: npm run db types:generate'))
        process.exit(1)
      }
      
    } catch (error) {
      spinner.fail('Validation failed')
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

program
  .command('types:watch')
  .description('Watch schema and regenerate types on changes')
  .option('-o, --output <path>', 'Output path', 'types/supabase.ts')
  .option('--interval <seconds>', 'Check interval in seconds', '10')
  .action(async (options) => {
    console.log(chalk.bold('👀 Watching for schema changes...\n'))
    console.log(chalk.dim(`Checking every ${options.interval} seconds`))
    console.log(chalk.dim('Press Ctrl+C to stop\n'))
    
    try {
      const { TypeGenerator } = await import('../types/type-generator')
      const generator = new TypeGenerator()
      
      let lastHash: string | undefined
      
      const check = async () => {
        try {
          const result = await generator.generate({
            outputPath: options.output
          })
          
          if (result.success) {
            if (lastHash && lastHash !== result.schemaHash && result.changed) {
              console.log(chalk.yellow(`\n⚡ Schema changed! Types regenerated`))
              console.log(chalk.dim(`   Hash: ${result.schemaHash}`))
            } else if (!lastHash) {
              console.log(chalk.green(`✅ Initial types generated`))
              console.log(chalk.dim(`   Hash: ${result.schemaHash}`))
            }
            
            lastHash = result.schemaHash
          }
        } catch (error) {
          console.error(chalk.red('❌ Generation error:'), error instanceof Error ? error.message : error)
        }
      }
      
      // Initial check
      await check()
      
      // Watch loop
      const interval = parseInt(options.interval) * 1000
      setInterval(check, interval)
      
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

// ============================================================================
// AI DDL GENERATION (Phase 7)
// ============================================================================

program
  .command('ai:create-table')
  .description('Generate table DDL from natural language using AI')
  .argument('<prompt>', 'Natural language description (e.g., "vehicle notes scoped to vehicle")')
  .option('-d, --domain <name>', 'Domain (e.g., vehicles, trips)')
  .option('--apply', 'Apply the generated SQL immediately')
  .option('--save-migration', 'Save as migration file')
  .option('--dry-run', 'Preview only (default)')
  .action(async (prompt, options) => {
    const spinner = ora('Generating table from AI...').start()
    
    try {
      const db = await initDatabase()
      const { EmbeddingService } = await import('../ai/embedding-service')
      const { EmbeddingManager } = await import('../ai/embedding-manager')
      const { SchemaLinter } = await import('../linting/schema-linter')
      const { DDLGenerator } = await import('../ai/ddl-generator')
      
      spinner.stop()
      
      // Initialize services
      const embeddingService = new EmbeddingService()
      const embeddingManager = new EmbeddingManager(db, embeddingService)
      const linter = new SchemaLinter(db)
      const ddlGenerator = new DDLGenerator(db, embeddingManager, linter)
      
      // Generate DDL
      spinner.start('Parsing intent with AI...')
      const result = await ddlGenerator.generateFromPrompt(prompt, {
        domain: options.domain,
        dryRun: !options.apply
      })
      
      spinner.succeed('DDL generated!')
      
      // Display results
      console.log(chalk.bold('\n✨ AI-Generated Table DDL\n'))
      console.log(chalk.cyan(`Table: ${result.tableName}`))
      console.log(chalk.dim(`Description: ${result.intent.description}`))
      console.log()
      
      // Duplicate check
      if (result.duplicateCheck.found) {
        const topMatch = result.duplicateCheck.matches[0]
        const similarity = (topMatch.similarity * 100).toFixed(1)
        
        if (topMatch.similarity > 0.7) {
          console.log(chalk.red.bold(`🔴 VERY SIMILAR TABLE EXISTS (${similarity}%)\n`))
          console.log(chalk.red(`  ${topMatch.name}`))
          console.log(chalk.dim(`  ${topMatch.reason}\n`))
          console.log(chalk.yellow('💡 Consider reusing the existing table instead of creating a new one'))
          console.log(chalk.cyan(`   Run: npm run db registry:search ${topMatch.name.split('.')[1]}\n`))
        } else if (topMatch.similarity > 0.5) {
          console.log(chalk.yellow.bold(`🟡 SIMILAR TABLE FOUND (${similarity}%)\n`))
          console.log(chalk.yellow(`  ${topMatch.name}`))
          console.log(chalk.dim(`  ${topMatch.reason}\n`))
          console.log(chalk.dim('Review this table before creating a new one\n'))
        }
      } else {
        console.log(chalk.green('✅ No similar tables found\n'))
      }
      
      // Warnings
      if (result.warnings.length > 0) {
        console.log(chalk.yellow.bold('⚠️  Warnings:\n'))
        result.warnings.forEach(w => console.log(chalk.yellow(`  • ${w}`)))
        console.log()
      }
      
      // Generated SQL
      if (result.sql) {
        console.log(chalk.bold('Generated SQL:\n'))
        console.log(chalk.cyan(result.sql))
        console.log()
      }
      
      // Recommendation
      console.log(chalk.bold('Recommendation:'))
      if (result.recommendation === 'REUSE_EXISTING') {
        console.log(chalk.red('  ❌ DO NOT CREATE - Reuse existing table'))
      } else if (result.recommendation === 'REVIEW_SIMILAR') {
        console.log(chalk.yellow('  ⚠️  REVIEW SIMILAR - Check existing tables first'))
      } else {
        console.log(chalk.green('  ✅ SAFE TO CREATE'))
      }
      console.log()
      
      // Actions
      if (result.recommendation !== 'REUSE_EXISTING') {
        if (options.apply) {
          // Apply immediately
          spinner.start('Applying SQL...')
          await db.query(result.sql, { transaction: true })
          spinner.succeed('Table created!')
          console.log(chalk.green(`\n✅ Table ${result.tableName} created successfully\n`))
        } else if (options.saveMigration) {
          // Save as migration
          const migrationPath = await ddlGenerator.saveMigration(result)
          console.log(chalk.cyan(`📄 Migration saved: ${migrationPath}\n`))
        } else {
          // Show next steps
          console.log(chalk.dim('Next steps:'))
          console.log(chalk.dim(`  --apply             Apply immediately (fast lane)`))
          console.log(chalk.dim(`  --save-migration    Save as migration file (governed lane)`))
          console.log()
        }
      }
      
      await db.shutdown()
      
    } catch (error) {
      spinner.fail('Generation failed')
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

// ============================================================================
// HELP
// ============================================================================

program
  .command('help')
  .description('Show detailed help')
  .action(() => {
    console.log(chalk.bold('\n🔥 GOD-TIER DATABASE TOOLKIT\n'))
    
    console.log(chalk.bold('Quick Start:'))
    console.log('  npm run db health              # Check database health')
    console.log('  npm run db query "SELECT 1"    # Execute query')
    console.log('')
    
    console.log(chalk.bold('Query Commands:'))
    console.log('  query <sql>                    Execute raw SQL')
    console.log('    -f, --format <type>          Output format (table|json|csv)')
    console.log('    -d, --dry-run                Preview without executing')
    console.log('    -e, --explain                Show query plan')
    console.log('    -r, --read-only              Execute in read-only mode')
    console.log('    -t, --transaction            Execute in transaction')
    console.log('')
    
    console.log(chalk.bold('Health Commands:'))
    console.log('  health                         Full health check')
    console.log('    -q, --quick                  Quick check (connections only)')
    console.log('')
    
    console.log(chalk.bold('AI Commands:'))
    console.log('  ask <question>                 Query using natural language')
    console.log('    -d, --dry-run                Preview without executing')
    console.log('  explain <sql>                  Explain query in plain English')
    console.log('  indexes                        Recommend missing indexes')
    console.log('    --min-duration <ms>          Min query duration (default: 100ms)')
    console.log('  schema:export                  Export schema documentation')
    console.log('    -o, --output <path>          Output file path')
    console.log('')
    
    console.log(chalk.bold('Operations Commands (Phase 3):'))
    console.log('  schema:inspect                 Deep schema introspection')
    console.log('    -s, --schema <name>          Schema name (default: public)')
    console.log('  migrate:plan <dir>             Plan pending migrations')
    console.log('  migrate:run <dir>              Run pending migrations')
    console.log('    -d, --dry-run                Preview without executing')
    console.log('  backup <output>                Backup database')
    console.log('    -t, --tables <tables>        Specific tables (comma-separated)')
    console.log('    --schema-only                Schema only (no data)')
    console.log('  restore <backup>               Restore from backup')
    console.log('    -d, --dry-run                Preview without executing')
    console.log('  perf:metrics                   Get performance metrics')
    console.log('  perf:bottlenecks               Identify bottlenecks')
    console.log('')
    
    console.log(chalk.bold('RLS Commands (Phase 4):'))
    console.log('  rls:list                       List all tables with RLS status')
    console.log('    -s, --schema <name>          Schema name (default: public)')
    console.log('  rls:enable <table>             Enable RLS on a table')
    console.log('  rls:disable <table>            Disable RLS on a table')
    console.log('  rls:validate                   Validate RLS configuration')
    console.log('  rls:apply-nextauth <table>     Apply NextAuth-friendly RLS')
    console.log('')
    
    console.log(chalk.bold('Storage Commands (Phase 4):'))
    console.log('  storage:list                   List all storage buckets')
    console.log('  storage:create <name>          Create a new bucket')
    console.log('    -p, --public                 Make bucket public')
    console.log('    --size-limit <mb>            Max file size in MB')
    console.log('  storage:delete <name>          Delete a bucket')
    console.log('    -f, --force                  Force delete with files')
    console.log('  storage:stats <bucket>         Get bucket statistics')
    console.log('  storage:cleanup <bucket>       Cleanup old files')
    console.log('    -d, --days <days>            Delete files older than N days')
    console.log('    --dry-run                    Preview without deleting')
    console.log('')
    
    console.log(chalk.bold('Seed Commands (Phase 4):'))
    console.log('  seed <file>                    Load and execute seed file')
    console.log('  seed:list <directory>          List seed files in directory')
    console.log('  seed:truncate <tables...>      Truncate tables')
    console.log('    -c, --cascade                Cascade to dependent objects')
    console.log('    -r, --restart                Restart identity sequences')
    console.log('  seed:reset                     Reset database (DANGEROUS!)')
    console.log('    --confirm                    Required confirmation flag')
    console.log('    --exclude <tables>           Tables to exclude')
    console.log('  seed:count <table>             Get row count for table')
    console.log('')
    
    console.log(chalk.bold('Migration Generation (Phase 4):'))
    console.log('  migrate:generate <name>        Generate new migration file')
    console.log('    -t, --template <name>        Use a template')
    console.log('  migrate:templates              List available templates')
    console.log('  migrate:diff <s1> <s2>         Generate from schema diff')
    console.log('')
    
    console.log(chalk.bold('Registry Commands (Phase 5): ⭐ NEW'))
    console.log('  registry:sync                  Sync from information_schema')
    console.log('    -s, --schema <name>          Schema name (default: public)')
    console.log('  registry:search <query>        Search registry')
    console.log('    -d, --domain <domain>        Filter by domain')
    console.log('    -k, --kind <kind>            Filter by kind (table|view|enum)')
    console.log('  registry:stats                 Show registry statistics')
    console.log('  registry:embed                 Generate embeddings for schema objects')
    console.log('    --refresh                    Re-embed all objects')
    console.log('  registry:similar               Find similar schema objects')
    console.log('    --text <query>               Search text (required)')
    console.log('    --threshold <n>              Min similarity (0-1, default: 0.5)')
    console.log('    --limit <n>                  Max results (default: 10)')
    console.log('    -k, --kind <kind>            Filter by kind (table|view)')
    console.log('    -d, --domain <domain>        Filter by domain')
    console.log('')
    
    console.log(chalk.bold('Schema Linting (Phase 5): ⭐ NEW'))
    console.log('  schema:lint                    Validate schema against rules')
    console.log('    -t, --table <name>           Lint specific table')
    console.log('    -s, --schema <name>          Schema name (default: public)')
    console.log('    --show-all                   Show all issues (including suggestions)')
    console.log('  schema:fix                     Auto-fix linting violations ⭐ PHASE 6')
    console.log('    -t, --table <name>           Table to fix (required)')
    console.log('    --apply                      Apply fixes immediately')
    console.log('    --save-migration             Save as migration file')
    console.log('    --dry-run                    Preview fixes only')
    console.log('')
    
    console.log(chalk.bold('AI Preflight (Phase 5): ⭐ NEW'))
    console.log('  ai:preflight                   Run AI-powered pre-deployment checks')
    console.log('    -f, --feature <name>         Feature name or description')
    console.log('    -d, --domain <name>          Domain (e.g., vehicles, trips)')
    console.log('    -t, --table <name>           Table name to validate')
    console.log('    -o, --output <path>          Output path for change plan JSON')
    console.log('')
    
    console.log(chalk.bold('Type Generation (Phase 5): ⭐ NEW'))
    console.log('  types:generate                 Generate TypeScript types from schema')
    console.log('    -o, --output <path>          Output path (default: types/supabase.ts)')
    console.log('    --helpers                    Also generate helper types')
    console.log('  types:validate                 Validate types are up-to-date')
    console.log('  types:watch                    Watch and regenerate on changes')
    console.log('    --interval <seconds>         Check interval (default: 10)')
    console.log('')
    
    console.log(chalk.bold('AI DDL Generation (Phase 7): ⭐ NEW'))
    console.log('  ai:create-table "<prompt>"     Generate table from natural language')
    console.log('    -d, --domain <name>          Domain (e.g., vehicles, trips)')
    console.log('    --apply                      Apply immediately (fast lane)')
    console.log('    --save-migration             Save as migration (governed lane)')
    console.log('    --dry-run                    Preview only (default)')
    console.log('  Examples:')
    console.log('    npm run db ai:create-table "vehicle notes scoped to vehicle"')
    console.log('    npm run db ai:create-table "trip expenses with amount and category" --domain trips')
    console.log('')
    
    console.log(chalk.bold('Admin Operations (Phase 4):'))
    console.log('  admin:vacuum [table]           VACUUM table or database')
    console.log('    -f, --full                   VACUUM FULL')
    console.log('    -a, --analyze                Also run ANALYZE')
    console.log('  admin:analyze [table]          Update statistics')
    console.log('  admin:reindex <target>         Rebuild indexes')
    console.log('  admin:connections              List all connections')
    console.log('  admin:kill <pid>               Terminate connection')
    console.log('    -c, --cancel                 Cancel query only')
    console.log('')
    
    console.log(chalk.bold('Examples:'))
    console.log(chalk.gray('  # Execute query'))
    console.log('  npm run db query "SELECT * FROM vehicles LIMIT 10"')
    console.log('')
    console.log(chalk.gray('  # Dry run (preview)'))
    console.log('  npm run db query "DELETE FROM vehicles" --dry-run')
    console.log('')
    console.log(chalk.gray('  # Get query plan'))
    console.log('  npm run db query "SELECT * FROM vehicles WHERE vin = \'ABC123\'" --explain')
    console.log('')
    console.log(chalk.gray('  # Export as JSON'))
    console.log('  npm run db query "SELECT * FROM vehicles" --format=json > vehicles.json')
    console.log('')
    console.log(chalk.gray('  # Check health'))
    console.log('  npm run db health')
    console.log('')
  })

// ============================================================================
// ERROR HANDLING
// ============================================================================

program.on('command:*', () => {
  console.error(chalk.red(`\n❌ Invalid command: ${program.args.join(' ')}\n`))
  console.log(chalk.gray('Run "npm run db help" for usage information'))
  process.exit(1)
})

// Show help if no command
if (process.argv.length === 2) {
  program.outputHelp()
}

program.parse()
