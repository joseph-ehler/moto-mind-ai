/**
 * Registry CLI Commands
 * 
 * Commands for managing the schema registry:
 * - registry:sync - Sync from information_schema
 * - registry:search - Search registry
 * - registry:stats - Show registry statistics
 * 
 * Part of Phase 5: AI Preflight System
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import Table from 'cli-table3'
import { RegistryManager } from '../../preflight/registry-manager'
import type { Database } from '../../core'

export function registerRegistryCommands(program: Command, db: Database) {
  const registryCmd = program
    .command('registry')
    .description('Manage schema registry for AI preflight system')

  // ===========================
  // registry:sync
  // ===========================
  registryCmd
    .command('sync')
    .description('Sync registry from information_schema')
    .option('-s, --schema <name>', 'Schema name to sync', 'public')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options) => {
      const spinner = ora('Syncing schema registry...').start()

      try {
        const registry = new RegistryManager(db)
        const result = await registry.syncFromSchema(options.schema)

        spinner.succeed('Schema registry synced successfully!\n')

        // Show summary
        console.log(chalk.bold('📊 Sync Summary:\n'))
        const summaryTable = new Table({
          head: [chalk.cyan('Metric'), chalk.cyan('Count')],
          colWidths: [30, 15]
        })

        summaryTable.push(
          ['Total Synced', chalk.green(result.synced.toString())],
          ['Tables', result.details.tables.toString()],
          ['Views', result.details.views.toString()],
          ['Enums', result.details.enums.toString()],
          ['Columns', result.details.columns.toString()],
          ['Errors', result.errors > 0 ? chalk.red(result.errors.toString()) : '0']
        )

        console.log(summaryTable.toString())

        if (options.verbose && result.errors > 0) {
          console.log(chalk.yellow('\n⚠️  Some objects could not be synced (check logs)'))
        }

        console.log(chalk.dim('\n💡 Next: npm run db registry:stats'))
      } catch (error) {
        spinner.fail('Failed to sync schema registry')
        console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
        process.exit(1)
      }
    })

  // ===========================
  // registry:search
  // ===========================
  registryCmd
    .command('search <query>')
    .description('Search registry for schema objects')
    .option('-d, --domain <domain>', 'Filter by domain')
    .option('-k, --kind <kind>', 'Filter by kind (table|view|enum|function)')
    .option('-l, --limit <number>', 'Max results', '20')
    .action(async (query, options) => {
      const spinner = ora(`Searching for "${query}"...`).start()

      try {
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
          return
        }

        console.log(chalk.bold(`\n🔍 Found ${results.length} results:\n`))

        const table = new Table({
          head: [
            chalk.cyan('Type'),
            chalk.cyan('Name'),
            chalk.cyan('Domain'),
            chalk.cyan('Description')
          ],
          colWidths: [10, 30, 15, 50]
        })

        results.forEach(obj => {
          table.push([
            obj.kind,
            chalk.bold(obj.name),
            obj.domain,
            obj.description || chalk.dim('(no description)')
          ])
        })

        console.log(table.toString())
        console.log()
      } catch (error) {
        spinner.fail('Search failed')
        console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
        process.exit(1)
      }
    })

  // ===========================
  // registry:stats
  // ===========================
  registryCmd
    .command('stats')
    .description('Show registry statistics')
    .action(async () => {
      const spinner = ora('Loading registry statistics...').start()

      try {
        const registry = new RegistryManager(db)
        const stats = await registry.getStats()

        spinner.succeed('Registry statistics loaded!\n')

        console.log(chalk.bold('📊 Registry Statistics:\n'))

        const table = new Table({
          head: [chalk.cyan('Category'), chalk.cyan('Count')],
          colWidths: [30, 15]
        })

        table.push(
          ['Tables', chalk.green(stats.tables || '0')],
          ['Views', stats.views || '0'],
          ['Enums', stats.enums || '0'],
          ['Functions', stats.functions || '0'],
          ['Total Columns', stats.columns || '0'],
          ['Vector Embeddings', stats.embeddings || '0']
        )

        console.log(table.toString())

        if (stats.last_sync) {
          const lastSync = new Date(stats.last_sync)
          const now = new Date()
          const hoursSince = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60))

          console.log(
            chalk.dim(
              `\n📅 Last sync: ${lastSync.toLocaleString()} (${hoursSince}h ago)`
            )
          )

          if (hoursSince > 24) {
            console.log(
              chalk.yellow(
                `\n⚠️  Registry is ${hoursSince}h old. Consider running: npm run db registry:sync`
              )
            )
          }
        } else {
          console.log(chalk.yellow('\n⚠️  Registry never synced. Run: npm run db registry:sync'))
        }

        console.log()
      } catch (error) {
        spinner.fail('Failed to load statistics')
        console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error)
        process.exit(1)
      }
    })
}
