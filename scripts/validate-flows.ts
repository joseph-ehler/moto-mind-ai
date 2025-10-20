#!/usr/bin/env tsx

/**
 * Ultra God-Tier Wizard: Flow Validation CLI
 * 
 * Validates flow JSON files against strict schema.
 * 
 * Usage:
 *   npm run flows:validate [path]
 *   npm run flows:validate config/onboarding/vehicle-flow.json
 *   npm run flows:validate config/onboarding/**\/*.json
 * 
 * Phase A: Contracts & Validator
 */

import { validateFlowFile } from '../lib/wizard/flow-validator'
import { glob } from 'glob'
import chalk from 'chalk'

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log(chalk.yellow('Usage: npm run flows:validate [path]'))
    console.log(chalk.gray('Examples:'))
    console.log(chalk.gray('  npm run flows:validate config/onboarding/vehicle-flow.json'))
    console.log(chalk.gray('  npm run flows:validate "config/onboarding/**/*.json"'))
    process.exit(1)
  }
  
  const pattern = args[0]
  const strictMode = !args.includes('--no-strict')
  
  console.log(chalk.bold('\n🔍 Validating Flow JSON Files'))
  console.log(chalk.gray(`Pattern: ${pattern}`))
  console.log(chalk.gray(`Strict Mode: ${strictMode ? 'ON' : 'OFF'}\n`))
  
  // Find files
  const files = await glob(pattern, {
    cwd: process.cwd(),
    absolute: true,
  })
  
  if (files.length === 0) {
    console.log(chalk.red('No files found matching pattern'))
    process.exit(1)
  }
  
  console.log(chalk.gray(`Found ${files.length} file(s)\n`))
  
  // Validate each file
  const results = []
  for (const file of files) {
    const result = await validateFlowFile(file, strictMode)
    results.push({ file, result })
  }
  
  // Summary
  console.log(chalk.bold('\n📊 Validation Summary'))
  console.log(chalk.gray('─'.repeat(60)))
  
  const validCount = results.filter(r => r.result.valid).length
  const invalidCount = results.length - validCount
  
  console.log(`Total Files: ${results.length}`)
  console.log(chalk.green(`Valid: ${validCount}`))
  if (invalidCount > 0) {
    console.log(chalk.red(`Invalid: ${invalidCount}`))
  }
  console.log()
  
  // Exit with error if any invalid
  if (invalidCount > 0) {
    process.exit(1)
  }
  
  console.log(chalk.green('✓ All flows are valid!\n'))
}

main().catch(error => {
  console.error(chalk.red('\n✗ Error:'), error.message)
  process.exit(1)
})
