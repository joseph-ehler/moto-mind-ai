// Dynamic Cost Estimation for Vision API
// Provides accurate token counting and cost calculation based on actual usage

export interface TokenEstimation {
  inputTokens: number
  outputTokens: number
  imageTokens: number
  totalCost: number
  breakdown: {
    textCost: number
    imageCost: number
    outputCost: number
  }
}

// OpenAI Vision pricing (updated 2024)
const VISION_PRICING = {
  'gpt-4o': {
    text_input: 0.005 / 1000,
    text_output: 0.015 / 1000,
    image_low: 0.00255, // per image (low detail)
    image_high: 0.00765 // per image (high detail)
  },
  'gpt-4o-mini': {
    text_input: 0.00015 / 1000,
    text_output: 0.0006 / 1000,
    image_low: 0.0007225, // per image (low detail)
    image_high: 0.002167 // per image (high detail)
  }
} as const

// Estimate tokens based on text length (rough approximation)
function estimateTextTokens(text: string): number {
  // GPT tokenizer approximation: ~4 characters per token
  return Math.ceil(text.length / 4)
}

// Calculate image tokens based on size and detail level
function calculateImageTokens(imageSize: { width: number, height: number }, detail: 'low' | 'high'): number {
  if (detail === 'low') {
    return 85 // Fixed cost for low detail
  }
  
  // High detail calculation based on OpenAI's formula
  const { width, height } = imageSize
  
  // Scale down to fit in 2048x2048 if needed
  const maxDim = Math.max(width, height)
  const scale = maxDim > 2048 ? 2048 / maxDim : 1
  const scaledWidth = Math.floor(width * scale)
  const scaledHeight = Math.floor(height * scale)
  
  // Calculate 512x512 tiles
  const tilesX = Math.ceil(scaledWidth / 512)
  const tilesY = Math.ceil(scaledHeight / 512)
  const totalTiles = tilesX * tilesY
  
  return 85 + (totalTiles * 170) // Base cost + tile cost
}

// Estimate output tokens based on document type and complexity (calibrated from production data)
function estimateOutputTokens(documentType: string, complexity: number): number {
  const baseTokens = {
    'odometer': 12,        // Often just "123456" - very minimal
    'fuel': 35,           // Station, gallons, cost, date
    'license_plate': 8,    // Just the plate number
    'vin': 20,            // 17-char VIN + minimal structure
    'service_invoice': 120, // Moderate complexity, itemized services
    'receipt': 60,        // Basic transaction details
    'registration': 90,   // Vehicle details, dates, plates
    'insurance': 180,     // Policy details, coverage, dates
    'accident_report': 220, // Complex incident details
    'legal_document': 350, // Can be very verbose
    'unknown': 80
  }
  
  const base = baseTokens[documentType as keyof typeof baseTokens] || 80
  
  // Complexity multiplier: 0.5 = simple, 1.0 = complex
  const complexityMultiplier = 0.7 + (complexity * 0.6) // Range: 0.7x to 1.3x
  return Math.floor(base * complexityMultiplier)
}

export function estimateCost(
  model: 'gpt-4o' | 'gpt-4o-mini',
  prompt: string,
  documentType: string,
  complexity: number = 0.5,
  imageDetail: 'low' | 'high' = 'high',
  imageSize: { width: number, height: number } = { width: 1024, height: 1024 }
): TokenEstimation {
  
  const pricing = VISION_PRICING[model]
  
  // Calculate token counts
  const inputTokens = estimateTextTokens(prompt)
  const outputTokens = estimateOutputTokens(documentType, complexity)
  const imageTokens = calculateImageTokens(imageSize, imageDetail)
  
  // Calculate costs
  const textCost = inputTokens * pricing.text_input
  const outputCost = outputTokens * pricing.text_output
  const imageCost = imageDetail === 'high' ? pricing.image_high : pricing.image_low
  
  const totalCost = textCost + outputCost + imageCost
  
  return {
    inputTokens,
    outputTokens,
    imageTokens,
    totalCost,
    breakdown: {
      textCost,
      imageCost,
      outputCost
    }
  }
}

// Real-time cost tracking with actual usage
export class CostTracker {
  private dailyUsage: Map<string, number> = new Map()
  private monthlyBudget: number = 100 // $100 default monthly budget
  
  constructor(monthlyBudget?: number) {
    if (monthlyBudget) this.monthlyBudget = monthlyBudget
  }
  
  recordUsage(cost: number, date: string = new Date().toISOString().split('T')[0]) {
    const currentUsage = this.dailyUsage.get(date) || 0
    this.dailyUsage.set(date, currentUsage + cost)
  }
  
  getDailyUsage(date: string = new Date().toISOString().split('T')[0]): number {
    return this.dailyUsage.get(date) || 0
  }
  
  getMonthlyUsage(): number {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    let monthlyTotal = 0
    const entries = Array.from(this.dailyUsage.entries())
    for (const [date, cost] of entries) {
      if (date.startsWith(currentMonth)) {
        monthlyTotal += cost
      }
    }
    
    return monthlyTotal
  }
  
  getBudgetStatus(): {
    used: number
    remaining: number
    percentage: number
    daysLeft: number
    projectedOverage: number
  } {
    const used = this.getMonthlyUsage()
    const remaining = Math.max(0, this.monthlyBudget - used)
    const percentage = (used / this.monthlyBudget) * 100
    
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth = now.getDate()
    const daysLeft = daysInMonth - dayOfMonth
    
    const dailyAverage = used / dayOfMonth
    const projectedMonthly = dailyAverage * daysInMonth
    const projectedOverage = Math.max(0, projectedMonthly - this.monthlyBudget)
    
    return {
      used,
      remaining,
      percentage,
      daysLeft,
      projectedOverage
    }
  }
  
  shouldThrottle(): boolean {
    const status = this.getBudgetStatus()
    return status.percentage > 90 || status.projectedOverage > this.monthlyBudget * 0.2
  }
  
  getRecommendations(): string[] {
    const status = this.getBudgetStatus()
    const recommendations: string[] = []
    
    if (status.percentage > 80) {
      recommendations.push('Consider switching more documents to gpt-4o-mini')
    }
    
    if (status.projectedOverage > 0) {
      recommendations.push(`Projected to exceed budget by $${status.projectedOverage.toFixed(2)}`)
    }
    
    if (status.percentage > 95) {
      recommendations.push('Enable cost throttling to prevent budget overrun')
    }
    
    return recommendations
  }
}

// Global cost tracker instance
export const globalCostTracker = new CostTracker()

// Enhanced cost calculation with real usage data
export function calculateActualCost(
  model: 'gpt-4o' | 'gpt-4o-mini',
  actualTokens: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  },
  imageDetail: 'low' | 'high' = 'high'
): number {
  const pricing = VISION_PRICING[model]
  
  const textCost = actualTokens.prompt_tokens * pricing.text_input
  const outputCost = actualTokens.completion_tokens * pricing.text_output
  const imageCost = imageDetail === 'high' ? pricing.image_high : pricing.image_low
  
  return textCost + outputCost + imageCost
}

// Cost optimization suggestions
export function getCostOptimizationSuggestions(
  documentType: string,
  currentModel: 'gpt-4o' | 'gpt-4o-mini',
  actualCost: number
): {
  canOptimize: boolean
  suggestedModel: 'gpt-4o' | 'gpt-4o-mini'
  potentialSavings: number
  reasoning: string
} {
  const simpleTypes = ['odometer', 'fuel', 'license_plate', 'vin']
  const isSimple = simpleTypes.includes(documentType)
  
  if (currentModel === 'gpt-4o' && isSimple) {
    const miniCost = actualCost * 0.2 // gpt-4o-mini is ~20% the cost
    return {
      canOptimize: true,
      suggestedModel: 'gpt-4o-mini',
      potentialSavings: actualCost - miniCost,
      reasoning: 'Simple document type can use cost-effective mini model'
    }
  }
  
  return {
    canOptimize: false,
    suggestedModel: currentModel,
    potentialSavings: 0,
    reasoning: 'Current model selection is optimal'
  }
}
