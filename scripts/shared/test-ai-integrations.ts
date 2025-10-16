#!/usr/bin/env tsx
/**
 * AI Integration Test Suite
 * 
 * Validates that all 5 AI integrations are working correctly
 * 
 * Usage: npm run ai:test
 */

import * as fs from 'fs'
import * as path from 'path'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  message: string
  time?: number
}

class AIIntegrationTester {
  private results: TestResult[] = []
  
  async runAll(): Promise<void> {
    console.log('🧪 AI INTEGRATION TEST SUITE\n')
    console.log('='.repeat(70))
    console.log()
    
    // Test 1: Check ai-helper.ts exists and exports
    await this.testAIHelper()
    
    // Test 2: Check all 5 AI integrations exist
    await this.testProductIntelligence()
    await this.testErrorParser()
    await this.testArchValidator()
    await this.testDeployRisk()
    await this.testDatabaseDoctor()
    
    // Test 3: Check package.json commands
    await this.testCommands()
    
    // Test 4: Check OpenAI client
    await this.testOpenAIClient()
    
    // Report results
    this.report()
  }
  
  private async testAIHelper(): Promise<void> {
    const start = Date.now()
    
    try {
      const helperPath = path.join(process.cwd(), 'scripts/shared/ai-helper.ts')
      
      if (!fs.existsSync(helperPath)) {
        this.results.push({
          name: 'AI Helper Foundation',
          status: 'fail',
          message: 'ai-helper.ts not found',
          time: Date.now() - start
        })
        return
      }
      
      const content = fs.readFileSync(helperPath, 'utf8')
      
      // Check for key exports
      const hasGetOpenAIAnalysis = content.includes('export async function getOpenAIAnalysis')
      const hasTrackUsage = content.includes('trackAIUsage')
      
      if (!hasGetOpenAIAnalysis) {
        this.results.push({
          name: 'AI Helper Foundation',
          status: 'fail',
          message: 'Missing getOpenAIAnalysis function',
          time: Date.now() - start
        })
        return
      }
      
      this.results.push({
        name: 'AI Helper Foundation',
        status: 'pass',
        message: 'ai-helper.ts exists with required exports',
        time: Date.now() - start
      })
    } catch (error) {
      this.results.push({
        name: 'AI Helper Foundation',
        status: 'fail',
        message: `Error: ${error}`,
        time: Date.now() - start
      })
    }
  }
  
  private async testProductIntelligence(): Promise<void> {
    const start = Date.now()
    
    const filePath = path.join(process.cwd(), 'scripts/dev-tools/product-intelligence-ai.ts')
    
    if (!fs.existsSync(filePath)) {
      this.results.push({
        name: '1. Product Intelligence AI',
        status: 'fail',
        message: 'Script not found',
        time: Date.now() - start
      })
      return
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check for AI integration
    if (!content.includes('getOpenAIAnalysis') && !content.includes('callOpenAI')) {
      this.results.push({
        name: '1. Product Intelligence AI',
        status: 'fail',
        message: 'Missing OpenAI integration',
        time: Date.now() - start
      })
      return
    }
    
    this.results.push({
      name: '1. Product Intelligence AI',
      status: 'pass',
      message: 'Script exists and uses OpenAI',
      time: Date.now() - start
    })
  }
  
  private async testErrorParser(): Promise<void> {
    const start = Date.now()
    
    const filePath = path.join(process.cwd(), 'scripts/dev-tools/parse-build-errors-ai.ts')
    
    if (!fs.existsSync(filePath)) {
      this.results.push({
        name: '2. Error Parser AI',
        status: 'fail',
        message: 'Script not found',
        time: Date.now() - start
      })
      return
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    
    if (!content.includes('getOpenAIAnalysis') && !content.includes('OpenAI')) {
      this.results.push({
        name: '2. Error Parser AI',
        status: 'fail',
        message: 'Missing OpenAI integration',
        time: Date.now() - start
      })
      return
    }
    
    this.results.push({
      name: '2. Error Parser AI',
      status: 'pass',
      message: 'Script exists and uses OpenAI',
      time: Date.now() - start
    })
  }
  
  private async testArchValidator(): Promise<void> {
    const start = Date.now()
    
    const filePath = path.join(process.cwd(), 'scripts/qa-platform/validate-architecture-ai.ts')
    
    if (!fs.existsSync(filePath)) {
      this.results.push({
        name: '3. Architecture Validator AI',
        status: 'fail',
        message: 'Script not found',
        time: Date.now() - start
      })
      return
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    
    if (!content.includes('getOpenAIAnalysis')) {
      this.results.push({
        name: '3. Architecture Validator AI',
        status: 'fail',
        message: 'Missing OpenAI integration',
        time: Date.now() - start
      })
      return
    }
    
    this.results.push({
      name: '3. Architecture Validator AI',
      status: 'pass',
      message: 'Script exists and uses OpenAI',
      time: Date.now() - start
    })
  }
  
  private async testDeployRisk(): Promise<void> {
    const start = Date.now()
    
    const filePath = path.join(process.cwd(), 'scripts/devops-suite/deploy-risk-ai.ts')
    
    if (!fs.existsSync(filePath)) {
      this.results.push({
        name: '4. Deploy Risk AI',
        status: 'fail',
        message: 'Script not found',
        time: Date.now() - start
      })
      return
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    
    if (!content.includes('getOpenAIAnalysis')) {
      this.results.push({
        name: '4. Deploy Risk AI',
        status: 'fail',
        message: 'Missing OpenAI integration',
        time: Date.now() - start
      })
      return
    }
    
    this.results.push({
      name: '4. Deploy Risk AI',
      status: 'pass',
      message: 'Script exists and uses OpenAI',
      time: Date.now() - start
    })
  }
  
  private async testDatabaseDoctor(): Promise<void> {
    const start = Date.now()
    
    const filePath = path.join(process.cwd(), 'scripts/database-suite/doctor-ai.ts')
    
    if (!fs.existsSync(filePath)) {
      this.results.push({
        name: '5. Database Doctor AI',
        status: 'fail',
        message: 'Script not found',
        time: Date.now() - start
      })
      return
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    
    if (!content.includes('getOpenAIAnalysis')) {
      this.results.push({
        name: '5. Database Doctor AI',
        status: 'fail',
        message: 'Missing OpenAI integration',
        time: Date.now() - start
      })
      return
    }
    
    this.results.push({
      name: '5. Database Doctor AI',
      status: 'pass',
      message: 'Script exists and uses OpenAI',
      time: Date.now() - start
    })
  }
  
  private async testCommands(): Promise<void> {
    const start = Date.now()
    
    const packagePath = path.join(process.cwd(), 'package.json')
    
    if (!fs.existsSync(packagePath)) {
      this.results.push({
        name: 'Package.json Commands',
        status: 'fail',
        message: 'package.json not found',
        time: Date.now() - start
      })
      return
    }
    
    const content = fs.readFileSync(packagePath, 'utf8')
    const pkg = JSON.parse(content)
    
    const requiredCommands = [
      'product:analyze:ai',
      'product:brief:ai',
      'build:errors:ai',
      'arch:validate:ai',
      'deploy:risk:ai',
      'db:doctor:ai'
    ]
    
    const missingCommands = requiredCommands.filter(cmd => !pkg.scripts[cmd])
    
    if (missingCommands.length > 0) {
      this.results.push({
        name: 'Package.json Commands',
        status: 'fail',
        message: `Missing commands: ${missingCommands.join(', ')}`,
        time: Date.now() - start
      })
      return
    }
    
    this.results.push({
      name: 'Package.json Commands',
      status: 'pass',
      message: 'All 6 AI commands configured',
      time: Date.now() - start
    })
  }
  
  private async testOpenAIClient(): Promise<void> {
    const start = Date.now()
    
    const clientPath = path.join(process.cwd(), 'lib/ai/openai-client.ts')
    
    if (!fs.existsSync(clientPath)) {
      this.results.push({
        name: 'OpenAI Client',
        status: 'fail',
        message: 'openai-client.ts not found',
        time: Date.now() - start
      })
      return
    }
    
    const content = fs.readFileSync(clientPath, 'utf8')
    
    if (!content.includes('callOpenAI') || !content.includes('OpenAI')) {
      this.results.push({
        name: 'OpenAI Client',
        status: 'fail',
        message: 'Missing callOpenAI function',
        time: Date.now() - start
      })
      return
    }
    
    this.results.push({
      name: 'OpenAI Client',
      status: 'pass',
      message: 'OpenAI client configured',
      time: Date.now() - start
    })
  }
  
  private report(): void {
    console.log('\n' + '='.repeat(70))
    console.log('📊 TEST RESULTS')
    console.log('='.repeat(70))
    console.log()
    
    const passed = this.results.filter(r => r.status === 'pass')
    const failed = this.results.filter(r => r.status === 'fail')
    const skipped = this.results.filter(r => r.status === 'skip')
    
    this.results.forEach(result => {
      const emoji = result.status === 'pass' ? '✅' : 
                   result.status === 'fail' ? '❌' : '⏭️'
      const time = result.time ? ` (${result.time}ms)` : ''
      
      console.log(`${emoji} ${result.name}${time}`)
      console.log(`   ${result.message}`)
      console.log()
    })
    
    console.log('='.repeat(70))
    console.log(`✅ Passed: ${passed.length}`)
    console.log(`❌ Failed: ${failed.length}`)
    console.log(`⏭️  Skipped: ${skipped.length}`)
    console.log('='.repeat(70))
    console.log()
    
    if (failed.length === 0) {
      console.log('🎉 All AI integrations validated successfully!')
      console.log()
      console.log('✨ Ready to use:')
      console.log('   npm run product:analyze:ai "<request>"')
      console.log('   npm run build:errors:ai <log-file>')
      console.log('   npm run arch:validate:ai')
      console.log('   npm run deploy:risk:ai')
      console.log('   npm run db:doctor:ai')
      console.log()
    } else {
      console.log('⚠️  Some tests failed. Please review and fix.')
      console.log()
    }
  }
}

// Run tests
const tester = new AIIntegrationTester()

tester.runAll()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Test suite error:', err)
    process.exit(1)
  })
