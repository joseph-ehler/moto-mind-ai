#!/usr/bin/env tsx
/**
 * Mark Migration Complete
 * 
 * Manually create a completion file for a migration.
 * Use when you've migrated a feature manually and want to track it in the dashboard.
 * 
 * Usage: npm run migration:complete <feature-name> <duration-minutes> [estimated-minutes]
 * Example: npm run migration:complete vehicles 45 360
 */

import * as fs from 'fs'
import * as path from 'path'

const featureName = process.argv[2]
const durationMinutes = parseInt(process.argv[3] || '0')
const estimatedMinutes = parseInt(process.argv[4] || '240') // Default 4 hours

if (!featureName || !durationMinutes) {
  console.error('❌ Usage: npm run migration:complete <feature-name> <duration-minutes> [estimated-minutes]')
  console.error('   Example: npm run migration:complete vehicles 45 360')
  console.error()
  console.error('   feature-name:       Name of the migrated feature')
  console.error('   duration-minutes:   How long the migration actually took')
  console.error('   estimated-minutes:  AI estimated duration (optional, default: 240)')
  process.exit(1)
}

const completionData = {
  feature: featureName,
  completedAt: new Date().toISOString(),
  duration: durationMinutes,
  estimatedDuration: estimatedMinutes,
  result: 'success'
}

const completionPath = path.join(process.cwd(), `.migration-completed-${featureName}.json`)

async function run() {
  try {
    // Check if already exists
    if (fs.existsSync(completionPath)) {
      console.log(`⚠️  Completion file for '${featureName}' already exists!`)
      const answer = await new Promise<string>((resolve) => {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        })
        readline.question('   Overwrite? (y/n): ', (ans: string) => {
          readline.close()
          resolve(ans)
        })
      })
      
      if (answer.toLowerCase() !== 'y') {
        console.log('   Cancelled.')
        process.exit(0)
      }
    }
    
    fs.writeFileSync(completionPath, JSON.stringify(completionData, null, 2), 'utf-8')
    
    console.log()
    console.log('✅ Migration marked complete!')
    console.log('='.repeat(60))
    console.log(`   Feature:   ${featureName}`)
    console.log(`   Duration:  ${durationMinutes} minutes`)
    console.log(`   Estimated: ${Math.round(estimatedMinutes / 60)} hours`)
    console.log(`   Saved:     ${Math.round((estimatedMinutes - durationMinutes) / 60)} hours`)
    console.log('='.repeat(60))
    console.log()
    console.log('📊 View on dashboard:')
    console.log('   https://moto-mind-ai.vercel.app/migrations')
    console.log()
    console.log('💡 Tip: Commit this file to track the migration!')
    console.log(`   git add .migration-completed-${featureName}.json`)
    console.log()
  } catch (e: any) {
    console.error('❌ Error creating completion file:', e.message)
    process.exit(1)
  }
}

run()
