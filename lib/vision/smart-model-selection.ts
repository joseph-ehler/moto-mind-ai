// Smart Model Selection for OpenAI Vision
// Automatically chooses optimal model based on document complexity and type

export interface ModelSelectionConfig {
  documentType: string
  complexity?: number
  retryAttempt?: number
  costBudget?: 'low' | 'medium' | 'high'
}

export interface ModelChoice {
  model: 'gpt-4o' | 'gpt-4o-mini'
  reasoning: string
  estimatedCost: number
  maxTokens: number
}

// Cost per 1K tokens (as of 2024)
const MODEL_COSTS = {
  'gpt-4o': {
    input: 0.005,
    output: 0.015
  },
  'gpt-4o-mini': {
    input: 0.00015,
    output: 0.0006
  }
} as const

// Document complexity scoring
const COMPLEXITY_SCORES = {
  // Simple extractions - use mini
  'odometer': 0.2,
  'fuel': 0.3,
  'license_plate': 0.2,
  'vin': 0.4,
  
  // Medium complexity - usually mini, gpt-4o for retries
  'service_invoice': 0.6,
  'receipt': 0.5,
  'registration': 0.7,
  
  // Complex documents - prefer gpt-4o
  'insurance': 0.8,
  'accident_report': 0.9,
  'legal_document': 0.9,
  'unknown': 0.7
} as const

export function selectOptimalModel(config: ModelSelectionConfig): ModelChoice {
  const { documentType, complexity, retryAttempt = 0, costBudget = 'medium' } = config
  
  // Get base complexity score
  const baseComplexity = COMPLEXITY_SCORES[documentType as keyof typeof COMPLEXITY_SCORES] || 0.7
  const finalComplexity = complexity || baseComplexity
  
  // Decision logic
  let model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini'
  let reasoning = 'Default to cost-effective mini model'
  
  // Use gpt-4o for complex documents
  if (finalComplexity >= 0.8) {
    model = 'gpt-4o'
    reasoning = 'High complexity document requires premium model'
  }
  
  // Smart escalation: Only escalate on 2nd+ retry for simple docs, 1st+ for complex
  else if (retryAttempt > 0) {
    const shouldEscalate = finalComplexity >= 0.6 || retryAttempt >= 2
    if (shouldEscalate) {
      model = 'gpt-4o'
      reasoning = `Retry attempt ${retryAttempt} - escalating to premium model (complexity: ${finalComplexity})`
    } else {
      reasoning = `Retry attempt ${retryAttempt} - staying with mini model for simple document`
    }
  }
  
  // Respect cost budget
  else if (costBudget === 'low' && finalComplexity < 0.9) {
    model = 'gpt-4o-mini'
    reasoning = 'Low cost budget - using mini model'
  }
  
  // High budget allows premium model for medium complexity
  else if (costBudget === 'high' && finalComplexity >= 0.6) {
    model = 'gpt-4o'
    reasoning = 'High budget allows premium model for better accuracy'
  }
  
  // Calculate estimated cost (assuming 1K input tokens, 300 output tokens)
  const inputTokens = 1000
  const outputTokens = 300
  const costs = MODEL_COSTS[model]
  const estimatedCost = (inputTokens * costs.input) + (outputTokens * costs.output)
  
  // Set appropriate token limits
  const maxTokens = model === 'gpt-4o' ? 1000 : 500
  
  return {
    model,
    reasoning,
    estimatedCost,
    maxTokens
  }
}

// Usage examples and testing
export const testModelSelection = () => {
  const testCases = [
    { documentType: 'odometer', expected: 'gpt-4o-mini' },
    { documentType: 'fuel', expected: 'gpt-4o-mini' },
    { documentType: 'service_invoice', expected: 'gpt-4o-mini' },
    { documentType: 'insurance', expected: 'gpt-4o' },
    { documentType: 'service_invoice', retryAttempt: 1, expected: 'gpt-4o' },
    { documentType: 'fuel', costBudget: 'high' as const, expected: 'gpt-4o-mini' }
  ]
  
  console.log('🧪 Model Selection Test Results:')
  testCases.forEach((test, i) => {
    const result = selectOptimalModel(test)
    const passed = result.model === test.expected
    console.log(`${i + 1}. ${test.documentType} → ${result.model} ${passed ? '✅' : '❌'}`)
    console.log(`   Reasoning: ${result.reasoning}`)
    console.log(`   Cost: $${result.estimatedCost.toFixed(4)}`)
  })
}

// Cost savings calculator
export const calculateSavings = (documentsPerMonth: number) => {
  const avgDocuments = {
    'odometer': documentsPerMonth * 0.3,
    'fuel': documentsPerMonth * 0.4,
    'service_invoice': documentsPerMonth * 0.2,
    'insurance': documentsPerMonth * 0.1
  }
  
  // Current cost (all gpt-4o)
  const currentCost = Object.values(avgDocuments).reduce((sum, count) => {
    return sum + (count * MODEL_COSTS['gpt-4o'].input * 1.3) // 1.3K tokens average
  }, 0)
  
  // Optimized cost (smart selection)
  const optimizedCost = 
    (avgDocuments.odometer + avgDocuments.fuel) * MODEL_COSTS['gpt-4o-mini'].input * 1.3 +
    avgDocuments.service_invoice * MODEL_COSTS['gpt-4o-mini'].input * 1.3 +
    avgDocuments.insurance * MODEL_COSTS['gpt-4o'].input * 1.3
  
  const savings = currentCost - optimizedCost
  const savingsPercent = (savings / currentCost) * 100
  
  return {
    currentCost: currentCost.toFixed(2),
    optimizedCost: optimizedCost.toFixed(2),
    monthlySavings: savings.toFixed(2),
    savingsPercent: savingsPercent.toFixed(1)
  }
}
