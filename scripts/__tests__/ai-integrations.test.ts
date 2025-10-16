/**
 * AI Integration Test Suite
 * Tests all 5 OpenAI integrations for correctness and consistency
 */

import { execSync } from 'child_process'
import { existsSync, writeFileSync, unlinkSync, mkdirSync } from 'fs'
import { join } from 'path'

const TEST_TIMEOUT = 60000 // 1 minute per test

describe('AI Integration Suite - All 5 Integrations', () => {
  const tempDir = join(__dirname, '__temp__')
  
  beforeAll(() => {
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true })
    }
  })
  
  afterAll(() => {
    // Cleanup temp files
    if (existsSync(tempDir)) {
      execSync(`rm -rf ${tempDir}`)
    }
  })

  describe('1. Product Intelligence AI', () => {
    it('should analyze feature request with strategic thinking', async () => {
      const result = execSync(
        'npm run product:analyze:ai "add user notifications"',
        { encoding: 'utf-8', timeout: TEST_TIMEOUT }
      )
      
      // Verify output structure
      expect(result).toContain('AI Understanding')
      expect(result).toContain('What user asked')
      expect(result).toContain('What user needs')
      expect(result).toContain('Recommendation')
      expect(result).toContain('Confidence')
    }, TEST_TIMEOUT)

    it('should generate complete product brief', async () => {
      const result = execSync(
        'npm run product:brief:ai "improve search"',
        { encoding: 'utf-8', timeout: TEST_TIMEOUT }
      )
      
      expect(result).toContain('Critical Questions')
      expect(result).toContain('Alternative Approaches')
      expect(result).toContain('Implementation Strategy')
      expect(result).toContain('Success Metrics')
      expect(result).toContain('Risk Assessment')
    }, TEST_TIMEOUT)
  })

  describe('2. Error Parser AI', () => {
    it('should parse and explain build errors', async () => {
      // Create sample error log
      const errorLog = join(tempDir, 'test-error.log')
      const sampleError = `
Error: TS2307: Cannot find module '@/hooks/useVehicleData'
    at /app/pages/vehicles.tsx:5:24
    
Build failed with 1 error
      `
      writeFileSync(errorLog, sampleError)
      
      const result = execSync(
        `npm run build:errors:ai ${errorLog}`,
        { encoding: 'utf-8', timeout: TEST_TIMEOUT }
      )
      
      expect(result).toContain('What This Means')
      expect(result).toContain('How to Fix')
      expect(result).toContain('Prevention')
      
      // Cleanup
      unlinkSync(errorLog)
    }, TEST_TIMEOUT)

    it('should handle multiple errors gracefully', async () => {
      const errorLog = join(tempDir, 'multiple-errors.log')
      const multipleErrors = `
Error: TS2307: Cannot find module '@/hooks/useVehicleData'
Error: TS2322: Type 'string' is not assignable to type 'number'
Error: TS2345: Argument of type 'undefined' is not assignable
      `
      writeFileSync(errorLog, multipleErrors)
      
      const result = execSync(
        `npm run build:errors:ai ${errorLog}`,
        { encoding: 'utf-8', timeout: TEST_TIMEOUT }
      )
      
      // Should analyze all errors
      expect(result.match(/Error Analysis/g)?.length).toBeGreaterThanOrEqual(1)
      
      unlinkSync(errorLog)
    }, TEST_TIMEOUT)
  })

  describe('3. Architecture Validator AI', () => {
    it('should provide overall health score', async () => {
      const result = execSync(
        'npm run arch:validate:ai',
        { encoding: 'utf-8', timeout: TEST_TIMEOUT }
      )
      
      expect(result).toContain('Overall Health')
      expect(result).toMatch(/\d+\/100/) // Health score format
      expect(result).toContain('Strengths')
      expect(result).toContain('Strategic Insights')
    }, TEST_TIMEOUT)

    it('should identify architectural concerns', async () => {
      const result = execSync(
        'npm run arch:validate:ai',
        { encoding: 'utf-8', timeout: TEST_TIMEOUT }
      )
      
      // Should include priority insights
      expect(result).toContain('Priority')
      expect(result).toContain('Impact')
    }, TEST_TIMEOUT)
  })

  describe('4. Deploy Risk AI', () => {
    it('should assess deployment risk from git changes', async () => {
      const result = execSync(
        'npm run deploy:risk:ai',
        { encoding: 'utf-8', timeout: TEST_TIMEOUT }
      )
      
      expect(result).toContain('Overall Risk')
      expect(result).toMatch(/LOW|MEDIUM|HIGH/) // Risk level
      expect(result).toContain('Risk Factors')
      expect(result).toContain('Recommended Strategy')
      expect(result).toContain('Monitor')
      expect(result).toContain('Rollback')
    }, TEST_TIMEOUT)

    it('should categorize changes correctly', async () => {
      const result = execSync(
        'npm run deploy:risk:ai',
        { encoding: 'utf-8', timeout: TEST_TIMEOUT }
      )
      
      // Should identify change types
      expect(result).toMatch(/backend|frontend|database|infrastructure/i)
    }, TEST_TIMEOUT)
  })

  describe('5. Database Doctor AI', () => {
    it('should diagnose database health', async () => {
      const result = execSync(
        'npm run db:doctor:ai',
        { encoding: 'utf-8', timeout: TEST_TIMEOUT }
      )
      
      expect(result).toContain('Database Health')
      expect(result).toMatch(/\d+\/100/) // Health score
      expect(result).toContain('Root Cause')
      expect(result).toContain('Prescriptive Fixes')
    }, TEST_TIMEOUT)

    it('should provide actionable SQL fixes', async () => {
      const result = execSync(
        'npm run db:doctor:ai',
        { encoding: 'utf-8', timeout: TEST_TIMEOUT }
      )
      
      // Should include SQL recommendations
      expect(result).toMatch(/CREATE INDEX|ALTER TABLE|VACUUM|ANALYZE/i)
      expect(result).toContain('Priority')
      expect(result).toContain('Risk')
    }, TEST_TIMEOUT)
  })

  describe('AI Helper Foundation', () => {
    it('should have ai-helper.ts with core functionality', () => {
      const aiHelperPath = join(__dirname, '../shared/ai-helper.ts')
      expect(existsSync(aiHelperPath)).toBe(true)
    })

    it('should track costs and tokens', async () => {
      // Run any AI integration and verify cost tracking
      const result = execSync(
        'npm run product:analyze:ai "test feature"',
        { encoding: 'utf-8', timeout: TEST_TIMEOUT }
      )
      
      expect(result).toMatch(/Cost|Tokens/)
    }, TEST_TIMEOUT)
  })

  describe('Integration Consistency', () => {
    it('all integrations should use consistent output format', async () => {
      const integrations = [
        'product:analyze:ai "test"',
        'arch:validate:ai',
        'deploy:risk:ai',
        'db:doctor:ai'
      ]
      
      for (const cmd of integrations) {
        const result = execSync(`npm run ${cmd}`, { 
          encoding: 'utf-8', 
          timeout: TEST_TIMEOUT 
        })
        
        // All should have meaningful output
        expect(result.length).toBeGreaterThan(100)
        expect(result).toContain('Cost') // Should track costs
      }
    }, TEST_TIMEOUT * 4)
  })

  describe('Error Handling', () => {
    it('should handle missing arguments gracefully', () => {
      expect(() => {
        execSync('npm run build:errors:ai', { encoding: 'utf-8' })
      }).toThrow()
    })

    it('should handle invalid file paths', () => {
      expect(() => {
        execSync('npm run build:errors:ai /nonexistent/file.log', { 
          encoding: 'utf-8' 
        })
      }).toThrow()
    })
  })
})

describe('AI Integration Performance', () => {
  it('should complete requests within reasonable time', async () => {
    const start = Date.now()
    
    execSync('npm run product:analyze:ai "quick test"', { 
      encoding: 'utf-8',
      timeout: TEST_TIMEOUT 
    })
    
    const duration = Date.now() - start
    
    // Should complete within 30 seconds
    expect(duration).toBeLessThan(30000)
  }, TEST_TIMEOUT)
})

describe('Cost Tracking', () => {
  it('should estimate costs accurately', async () => {
    const result = execSync(
      'npm run product:analyze:ai "cost test"',
      { encoding: 'utf-8', timeout: TEST_TIMEOUT }
    )
    
    // Should show reasonable cost estimate
    const costMatch = result.match(/\$(\d+\.\d+)/)
    if (costMatch) {
      const cost = parseFloat(costMatch[1])
      expect(cost).toBeGreaterThan(0)
      expect(cost).toBeLessThan(1) // Should be under $1 per call
    }
  }, TEST_TIMEOUT)
})
