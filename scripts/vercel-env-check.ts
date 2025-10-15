#!/usr/bin/env tsx
/**
 * Vercel Environment Variable Validator
 * 
 * Validates that all required environment variables are set in Vercel.
 * Helps prevent deployment failures due to missing environment variables.
 * 
 * Features:
 * - Checks required environment variables
 * - Compares local .env with Vercel
 * - Identifies missing or mismatched variables
 * - Provides sync commands
 * 
 * Usage:
 *   npm run env:check           # Check required variables
 *   npm run env:check -- --all  # Check all variables
 *   npm run env:check -- --sync # Show sync commands
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

interface EnvVariable {
  key: string
  required: boolean
  description?: string
}

// Define required environment variables for your app
const REQUIRED_VARS: EnvVariable[] = [
  { key: 'DATABASE_URL', required: true, description: 'PostgreSQL connection string' },
  { key: 'OPENAI_API_KEY', required: true, description: 'OpenAI API key for vision processing' },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', required: true, description: 'Supabase project URL' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, description: 'Supabase anonymous key' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', required: true, description: 'Supabase service role key' },
]

const OPTIONAL_VARS: EnvVariable[] = [
  { key: 'NEXT_PUBLIC_VERCEL_URL', required: false, description: 'Vercel deployment URL' },
  { key: 'VERCEL_URL', required: false, description: 'Vercel URL (auto-set)' },
]

class VercelEnvValidator {
  private vercelEnvs: Map<string, string> = new Map()
  private localEnvs: Map<string, string> = new Map()
  
  async validate(options: { checkAll?: boolean, showSync?: boolean } = {}): Promise<void> {
    console.log('🔐 VERCEL ENVIRONMENT VALIDATOR\n')
    console.log('='.repeat(70))
    console.log()
    
    // Step 1: Fetch Vercel environment variables
    await this.fetchVercelEnvs()
    
    // Step 2: Read local .env files
    this.readLocalEnvs()
    
    // Step 3: Check required variables
    const issues = this.checkRequiredVars()
    
    // Step 4: Check optional variables (if requested)
    if (options.checkAll) {
      this.checkOptionalVars()
    }
    
    // Step 5: Compare with local (if sync requested)
    if (options.showSync) {
      this.showSyncCommands()
    }
    
    // Step 6: Show results
    this.showResults(issues)
    
    if (issues.length > 0) {
      process.exit(1)
    }
  }
  
  private async fetchVercelEnvs(): Promise<void> {
    console.log('📡 Fetching Vercel environment variables...\n')
    
    try {
      // Get environment variables for production
      const output = execSync('vercel env ls production --json 2>/dev/null', {
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      if (!output.trim()) {
        console.log('⚠️  No environment variables found in Vercel\n')
        return
      }
      
      // Parse the output (Vercel CLI returns JSON array)
      try {
        const envs = JSON.parse(output)
        if (Array.isArray(envs)) {
          envs.forEach((env: any) => {
            if (env.key) {
              this.vercelEnvs.set(env.key, env.value || '(set)')
            }
          })
        }
      } catch (e) {
        // If JSON parsing fails, try parsing line by line
        const lines = output.split('\n')
        lines.forEach(line => {
          const match = line.match(/^(\w+)\s+/)
          if (match) {
            this.vercelEnvs.set(match[1], '(set)')
          }
        })
      }
      
      console.log(`✅ Found ${this.vercelEnvs.size} variables in Vercel\n`)
      
    } catch (error: any) {
      if (error.message.includes('not found')) {
        console.log('❌ Vercel CLI not found. Install with: npm install -g vercel\n')
        process.exit(1)
      }
      console.log('⚠️  Could not fetch Vercel environment variables\n')
      console.log('   Make sure you are logged in: vercel login\n')
    }
  }
  
  private readLocalEnvs(): void {
    const envFiles = [
      '.env',
      '.env.local',
      '.env.production',
      '.env.production.local'
    ]
    
    for (const file of envFiles) {
      const filePath = path.join(process.cwd(), file)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.split('\n')
        
        lines.forEach(line => {
          const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
          if (match) {
            const [, key, value] = match
            this.localEnvs.set(key, value.trim())
          }
        })
      }
    }
  }
  
  private checkRequiredVars(): Array<{ key: string, issue: string }> {
    console.log('🔍 Checking required variables...\n')
    
    const issues: Array<{ key: string, issue: string }> = []
    
    for (const variable of REQUIRED_VARS) {
      const inVercel = this.vercelEnvs.has(variable.key)
      const inLocal = this.localEnvs.has(variable.key)
      
      if (!inVercel) {
        console.log(`❌ ${variable.key}`)
        console.log(`   Missing in Vercel`)
        if (variable.description) {
          console.log(`   ${variable.description}`)
        }
        if (inLocal) {
          console.log(`   ✅ Found in local .env`)
          console.log(`   💡 Add to Vercel: vercel env add ${variable.key} production`)
        }
        console.log()
        issues.push({ key: variable.key, issue: 'missing' })
      } else {
        console.log(`✅ ${variable.key}`)
        if (variable.description) {
          console.log(`   ${variable.description}`)
        }
        console.log()
      }
    }
    
    return issues
  }
  
  private checkOptionalVars(): void {
    console.log('\n📋 Optional variables:\n')
    
    for (const variable of OPTIONAL_VARS) {
      const inVercel = this.vercelEnvs.has(variable.key)
      
      if (inVercel) {
        console.log(`✅ ${variable.key}`)
      } else {
        console.log(`⚪ ${variable.key} (not set)`)
      }
      
      if (variable.description) {
        console.log(`   ${variable.description}`)
      }
      console.log()
    }
  }
  
  private showSyncCommands(): void {
    console.log('\n📤 Sync commands:\n')
    
    const localOnlyVars = Array.from(this.localEnvs.keys()).filter(
      key => !this.vercelEnvs.has(key) && key.startsWith('NEXT_PUBLIC_') || key.includes('KEY') || key.includes('SECRET')
    )
    
    if (localOnlyVars.length > 0) {
      console.log('Variables in local .env but not in Vercel:\n')
      localOnlyVars.forEach(key => {
        console.log(`vercel env add ${key} production`)
      })
      console.log()
    } else {
      console.log('✅ All local variables are synced to Vercel\n')
    }
  }
  
  private showResults(issues: Array<{ key: string, issue: string }>): void {
    console.log('='.repeat(70))
    
    if (issues.length === 0) {
      console.log('\n✅ ALL REQUIRED VARIABLES ARE SET\n')
      console.log('Safe to deploy! 🚀\n')
    } else {
      console.log(`\n❌ ${issues.length} REQUIRED VARIABLE(S) MISSING\n`)
      console.log('Fix these before deploying:\n')
      
      issues.forEach(({ key }) => {
        console.log(`   vercel env add ${key} production`)
      })
      
      console.log('\nThen verify: npm run env:check\n')
    }
  }
}

// CLI
const args = process.argv.slice(2)
const checkAll = args.includes('--all')
const showSync = args.includes('--sync')

const validator = new VercelEnvValidator()
validator.validate({ checkAll, showSync }).catch(error => {
  console.error('❌ Validation error:', error.message)
  process.exit(1)
})
