// A/B Testing Framework for Vision Model Accuracy Validation
// Compares gpt-4o vs gpt-4o-mini accuracy for different document types

export interface ABTestConfig {
  testName: string
  documentTypes: string[]
  trafficSplit: number // 0.0 to 1.0 (percentage going to variant B)
  minSampleSize: number
  maxDuration: number // milliseconds
  confidenceLevel: number // 0.95 for 95% confidence
  testingMethod: 'fixed_horizon' | 'sequential' | 'bayesian'
  earlyStoppingEnabled: boolean
  minimumEffect: number // Minimum practical difference to detect
}

export interface ABTestResult {
  testId: string
  variant: 'A' | 'B' // A = gpt-4o-mini, B = gpt-4o
  documentType: string
  extractedData: any
  userCorrections: any[] // User edits indicate accuracy issues
  processingTime: number
  cost: number
  confidence: number
  timestamp: string
  userId?: string
}

export interface ABTestAnalysis {
  testName: string
  status: 'running' | 'completed' | 'insufficient_data'
  sampleSizes: { variantA: number, variantB: number }
  metrics: {
    accuracy: { variantA: number, variantB: number, pValue: number }
    cost: { variantA: number, variantB: number, difference: number }
    speed: { variantA: number, variantB: number, difference: number }
    userSatisfaction: { variantA: number, variantB: number, pValue: number }
  }
  recommendation: 'use_variant_a' | 'use_variant_b' | 'continue_testing' | 'inconclusive'
  confidence: number
}

class ABTestManager {
  private activeTests = new Map<string, ABTestConfig>()
  private testResults = new Map<string, ABTestResult[]>()
  
  // Start a new A/B test
  startTest(config: ABTestConfig): string {
    const testId = `ab_${config.testName}_${Date.now()}`
    this.activeTests.set(testId, {
      ...config,
      maxDuration: config.maxDuration || 7 * 24 * 60 * 60 * 1000 // 7 days default
    })
    this.testResults.set(testId, [])
    
    console.log(`🧪 Started A/B test: ${config.testName} (${config.trafficSplit * 100}% to variant B)`)
    return testId
  }
  
  // Determine which variant to use for a request
  getVariant(testId: string, documentType: string, userId?: string): 'A' | 'B' | null {
    const config = this.activeTests.get(testId)
    if (!config) return null
    
    // Check if document type is included in test
    if (!config.documentTypes.includes(documentType)) return null
    
    // Check if test has expired
    const results = this.testResults.get(testId) || []
    const testStart = results.length > 0 ? new Date(results[0].timestamp).getTime() : Date.now()
    if (Date.now() - testStart > config.maxDuration) {
      this.stopTest(testId)
      return null
    }
    
    // Deterministic assignment based on userId or random
    const hash = userId ? this.hashString(userId + testId) : Math.random()
    return hash < config.trafficSplit ? 'B' : 'A'
  }
  
  // Record test result
  recordResult(testId: string, result: Omit<ABTestResult, 'testId'>): void {
    const results = this.testResults.get(testId) || []
    results.push({ ...result, testId })
    this.testResults.set(testId, results)
    
    console.log(`📊 Recorded A/B test result: ${testId} - Variant ${result.variant}`)
  }
  
  // Record user correction (indicates accuracy issue)
  recordUserCorrection(
    testId: string,
    originalData: any,
    correctedData: any,
    userId?: string
  ): void {
    const results = this.testResults.get(testId) || []
    
    // Find the most recent result for this user
    const userResults = userId 
      ? results.filter(r => r.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      : results.slice(-1)
    
    if (userResults.length > 0) {
      const latestResult = userResults[0]
      latestResult.userCorrections = latestResult.userCorrections || []
      latestResult.userCorrections.push({
        original: originalData,
        corrected: correctedData,
        timestamp: new Date().toISOString()
      })
      
      console.log(`✏️ User correction recorded for test ${testId} - Variant ${latestResult.variant}`)
    }
  }
  
  // Analyze test results with multiple testing methods
  analyzeTest(testId: string): ABTestAnalysis {
    const config = this.activeTests.get(testId)
    const results = this.testResults.get(testId) || []
    
    if (!config) {
      throw new Error(`Test ${testId} not found`)
    }
    
    const variantAResults = results.filter(r => r.variant === 'A')
    const variantBResults = results.filter(r => r.variant === 'B')
    
    // Apply different testing methods
    switch (config.testingMethod) {
      case 'sequential':
        return this.analyzeSequentialTest(config, variantAResults, variantBResults)
      case 'bayesian':
        return this.analyzeBayesianTest(config, variantAResults, variantBResults)
      default:
        return this.analyzeFixedHorizonTest(config, variantAResults, variantBResults)
    }
  }
  
  // Traditional fixed-horizon testing
  private analyzeFixedHorizonTest(config: ABTestConfig, variantA: ABTestResult[], variantB: ABTestResult[]): ABTestAnalysis {
    const hasSufficientData = variantA.length >= config.minSampleSize && 
                             variantB.length >= config.minSampleSize
    
    if (!hasSufficientData) {
      return {
        testName: config.testName,
        status: 'insufficient_data',
        sampleSizes: { variantA: variantA.length, variantB: variantB.length },
        metrics: this.calculateMetrics(variantA, variantB),
        recommendation: 'continue_testing',
        confidence: 0
      }
    }
    
    const metrics = this.calculateMetrics(variantA, variantB)
    const recommendation = this.generateRecommendation(metrics, config)
    
    return {
      testName: config.testName,
      status: 'completed',
      sampleSizes: { variantA: variantA.length, variantB: variantB.length },
      metrics,
      recommendation,
      confidence: config.confidenceLevel
    }
  }
  
  // Sequential testing - can stop early with fewer samples
  private analyzeSequentialTest(config: ABTestConfig, variantA: ABTestResult[], variantB: ABTestResult[]): ABTestAnalysis {
    const minSamples = Math.max(10, Math.floor(config.minSampleSize / 5)) // Much lower minimum
    
    if (variantA.length < minSamples || variantB.length < minSamples) {
      return {
        testName: config.testName,
        status: 'insufficient_data',
        sampleSizes: { variantA: variantA.length, variantB: variantB.length },
        metrics: this.calculateMetrics(variantA, variantB),
        recommendation: 'continue_testing',
        confidence: 0
      }
    }
    
    const metrics = this.calculateMetrics(variantA, variantB)
    
    // Sequential probability ratio test (simplified)
    const accuracyDiff = Math.abs(metrics.accuracy.variantB - metrics.accuracy.variantA)
    const costDiff = Math.abs(metrics.cost.difference)
    
    // Early stopping conditions
    if (config.earlyStoppingEnabled) {
      // Strong evidence for significant difference
      if (accuracyDiff > config.minimumEffect && metrics.accuracy.pValue < 0.01) {
        return {
          testName: config.testName,
          status: 'completed',
          sampleSizes: { variantA: variantA.length, variantB: variantB.length },
          metrics,
          recommendation: this.generateRecommendation(metrics, config),
          confidence: 0.99
        }
      }
      
      // Strong evidence for no significant difference
      if (accuracyDiff < config.minimumEffect / 2 && metrics.accuracy.pValue > 0.5) {
        return {
          testName: config.testName,
          status: 'completed',
          sampleSizes: { variantA: variantA.length, variantB: variantB.length },
          metrics,
          recommendation: 'use_variant_a', // Default to cheaper option
          confidence: 0.95
        }
      }
    }
    
    // Continue testing if no early stopping
    return {
      testName: config.testName,
      status: 'running',
      sampleSizes: { variantA: variantA.length, variantB: variantB.length },
      metrics,
      recommendation: 'continue_testing',
      confidence: 0
    }
  }
  
  // Bayesian testing - uses prior beliefs and updates with data
  private analyzeBayesianTest(config: ABTestConfig, variantA: ABTestResult[], variantB: ABTestResult[]): ABTestAnalysis {
    const minSamples = Math.max(5, Math.floor(config.minSampleSize / 10)) // Very low minimum
    
    if (variantA.length < minSamples || variantB.length < minSamples) {
      return {
        testName: config.testName,
        status: 'insufficient_data',
        sampleSizes: { variantA: variantA.length, variantB: variantB.length },
        metrics: this.calculateMetrics(variantA, variantB),
        recommendation: 'continue_testing',
        confidence: 0
      }
    }
    
    const metrics = this.calculateMetrics(variantA, variantB)
    
    // Simplified Bayesian analysis
    const priorBelief = 0.5 // 50% prior that variants are equal
    const evidenceStrength = Math.min(variantA.length + variantB.length, 100) / 100
    
    const accuracyDiff = metrics.accuracy.variantB - metrics.accuracy.variantA
    const costBenefit = -metrics.cost.difference / 100 // Negative cost difference is good
    
    // Bayesian posterior probability that B is better
    const posteriorB = this.calculateBayesianPosterior(priorBelief, accuracyDiff, costBenefit, evidenceStrength)
    
    let recommendation: 'use_variant_a' | 'use_variant_b' | 'continue_testing' | 'inconclusive' = 'continue_testing'
    let confidence = posteriorB
    
    if (posteriorB > 0.95) {
      recommendation = 'use_variant_b'
      confidence = posteriorB
    } else if (posteriorB < 0.05) {
      recommendation = 'use_variant_a'
      confidence = 1 - posteriorB
    } else if (evidenceStrength > 0.8) {
      recommendation = 'inconclusive'
    }
    
    return {
      testName: config.testName,
      status: recommendation === 'continue_testing' ? 'running' : 'completed',
      sampleSizes: { variantA: variantA.length, variantB: variantB.length },
      metrics,
      recommendation,
      confidence
    }
  }
  
  private calculateBayesianPosterior(prior: number, accuracyDiff: number, costBenefit: number, evidenceStrength: number): number {
    // Simplified Bayesian update
    const likelihood = 0.5 + (accuracyDiff / 100) * 0.3 + costBenefit * 0.2
    const posterior = (likelihood * evidenceStrength + prior * (1 - evidenceStrength))
    return Math.max(0, Math.min(1, posterior))
  }
  
  private calculateMetrics(variantA: ABTestResult[], variantB: ABTestResult[]) {
    // Accuracy: Based on user corrections (fewer corrections = higher accuracy)
    const accuracyA = this.calculateAccuracy(variantA)
    const accuracyB = this.calculateAccuracy(variantB)
    const accuracyPValue = this.calculatePValue(
      variantA.map(r => r.userCorrections?.length || 0),
      variantB.map(r => r.userCorrections?.length || 0)
    )
    
    // Cost: Average cost per request
    const costA = variantA.reduce((sum, r) => sum + r.cost, 0) / variantA.length
    const costB = variantB.reduce((sum, r) => sum + r.cost, 0) / variantB.length
    
    // Speed: Average processing time
    const speedA = variantA.reduce((sum, r) => sum + r.processingTime, 0) / variantA.length
    const speedB = variantB.reduce((sum, r) => sum + r.processingTime, 0) / variantB.length
    
    // User satisfaction: Based on confidence scores and correction frequency
    const satisfactionA = this.calculateSatisfaction(variantA)
    const satisfactionB = this.calculateSatisfaction(variantB)
    const satisfactionPValue = this.calculatePValue(
      variantA.map(r => r.confidence),
      variantB.map(r => r.confidence)
    )
    
    return {
      accuracy: { variantA: accuracyA, variantB: accuracyB, pValue: accuracyPValue },
      cost: { variantA: costA, variantB: costB, difference: ((costB - costA) / costA) * 100 },
      speed: { variantA: speedA, variantB: speedB, difference: ((speedA - speedB) / speedA) * 100 },
      userSatisfaction: { variantA: satisfactionA, variantB: satisfactionB, pValue: satisfactionPValue }
    }
  }
  
  private calculateAccuracy(results: ABTestResult[]): number {
    if (results.length === 0) return 0
    
    const totalCorrections = results.reduce((sum, r) => sum + (r.userCorrections?.length || 0), 0)
    const accuracyRate = 1 - (totalCorrections / results.length)
    return Math.max(0, Math.min(1, accuracyRate)) * 100
  }
  
  private calculateSatisfaction(results: ABTestResult[]): number {
    if (results.length === 0) return 0
    
    // Combine confidence scores and correction frequency
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    const correctionPenalty = results.reduce((sum, r) => sum + (r.userCorrections?.length || 0), 0) / results.length
    
    return Math.max(0, avgConfidence - (correctionPenalty * 10))
  }
  
  private calculatePValue(groupA: number[], groupB: number[]): number {
    // Simplified t-test calculation
    if (groupA.length === 0 || groupB.length === 0) return 1
    
    const meanA = groupA.reduce((sum, val) => sum + val, 0) / groupA.length
    const meanB = groupB.reduce((sum, val) => sum + val, 0) / groupB.length
    
    const varA = groupA.reduce((sum, val) => sum + Math.pow(val - meanA, 2), 0) / (groupA.length - 1)
    const varB = groupB.reduce((sum, val) => sum + Math.pow(val - meanB, 2), 0) / (groupB.length - 1)
    
    const pooledVar = ((groupA.length - 1) * varA + (groupB.length - 1) * varB) / (groupA.length + groupB.length - 2)
    const standardError = Math.sqrt(pooledVar * (1/groupA.length + 1/groupB.length))
    
    if (standardError === 0) return 1
    
    const tStat = Math.abs(meanA - meanB) / standardError
    
    // Simplified p-value approximation (for demonstration)
    return Math.max(0.001, 1 / (1 + tStat * tStat))
  }
  
  private generateRecommendation(metrics: any, config: ABTestConfig): 'use_variant_a' | 'use_variant_b' | 'continue_testing' | 'inconclusive' {
    const significanceThreshold = 1 - config.confidenceLevel // 0.05 for 95% confidence
    
    // Check statistical significance
    const accuracySignificant = metrics.accuracy.pValue < significanceThreshold
    const satisfactionSignificant = metrics.userSatisfaction.pValue < significanceThreshold
    
    if (!accuracySignificant && !satisfactionSignificant) {
      return 'inconclusive'
    }
    
    // Cost-benefit analysis
    const accuracyDiff = metrics.accuracy.variantB - metrics.accuracy.variantA
    const costDiff = metrics.cost.difference // Positive means B is more expensive
    const satisfactionDiff = metrics.userSatisfaction.variantB - metrics.userSatisfaction.variantA
    
    // Variant B (gpt-4o) is significantly better in accuracy/satisfaction
    if (accuracyDiff > 5 || satisfactionDiff > 10) {
      // But is it worth the cost?
      if (costDiff < 200) { // Less than 200% cost increase
        return 'use_variant_b'
      }
    }
    
    // Variant A (gpt-4o-mini) is good enough and much cheaper
    if (accuracyDiff < 5 && satisfactionDiff < 10) {
      return 'use_variant_a'
    }
    
    return 'continue_testing'
  }
  
  private stopTest(testId: string): void {
    this.activeTests.delete(testId)
    console.log(`🛑 Stopped A/B test: ${testId}`)
  }
  
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647 // Normalize to 0-1
  }
  
  // Get all active tests
  getActiveTests(): Array<{ testId: string, config: ABTestConfig, resultCount: number }> {
    return Array.from(this.activeTests.entries()).map(([testId, config]) => ({
      testId,
      config,
      resultCount: this.testResults.get(testId)?.length || 0
    }))
  }
}

// Global A/B test manager
export const abTestManager = new ABTestManager()

// Convenience functions for common test scenarios
export function startModelAccuracyTest(documentTypes: string[], deploymentSize: 'small' | 'medium' | 'large' = 'medium'): string {
  const configs = {
    small: {
      testingMethod: 'bayesian' as const,
      minSampleSize: 20,
      earlyStoppingEnabled: true,
      minimumEffect: 5 // 5% accuracy difference
    },
    medium: {
      testingMethod: 'sequential' as const,
      minSampleSize: 50,
      earlyStoppingEnabled: true,
      minimumEffect: 3 // 3% accuracy difference
    },
    large: {
      testingMethod: 'fixed_horizon' as const,
      minSampleSize: 100,
      earlyStoppingEnabled: false,
      minimumEffect: 2 // 2% accuracy difference
    }
  }
  
  const config = configs[deploymentSize]
  
  return abTestManager.startTest({
    testName: 'model_accuracy_comparison',
    documentTypes,
    trafficSplit: 0.2, // 20% to gpt-4o, 80% to gpt-4o-mini
    maxDuration: 14 * 24 * 60 * 60 * 1000, // 14 days
    confidenceLevel: 0.95,
    ...config
  })
}

export function startCostOptimizationTest(documentType: string, deploymentSize: 'small' | 'medium' | 'large' = 'medium'): string {
  const configs = {
    small: {
      testingMethod: 'bayesian' as const,
      minSampleSize: 10,
      earlyStoppingEnabled: true,
      minimumEffect: 10 // 10% cost difference
    },
    medium: {
      testingMethod: 'sequential' as const,
      minSampleSize: 30,
      earlyStoppingEnabled: true,
      minimumEffect: 5 // 5% cost difference
    },
    large: {
      testingMethod: 'fixed_horizon' as const,
      minSampleSize: 100,
      earlyStoppingEnabled: false,
      minimumEffect: 2 // 2% cost difference
    }
  }
  
  const config = configs[deploymentSize]
  
  return abTestManager.startTest({
    testName: `cost_optimization_${documentType}`,
    documentTypes: [documentType],
    trafficSplit: 0.1, // 10% to gpt-4o for comparison
    maxDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    confidenceLevel: 0.99,
    ...config
  })
}
