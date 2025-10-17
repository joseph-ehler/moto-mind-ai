// Cost Calibration and Telemetry System
// Tracks actual vs estimated costs to improve accuracy over time

export interface CostCalibrationData {
  documentType: string
  model: 'gpt-4o' | 'gpt-4o-mini'
  estimated: {
    inputTokens: number
    outputTokens: number
    cost: number
  }
  actual: {
    inputTokens: number
    outputTokens: number
    cost: number
  }
  accuracy: {
    inputTokenError: number    // Percentage error
    outputTokenError: number
    costError: number
  }
  timestamp: string
  imageSize: { width: number, height: number }
  complexity: number
}

class CostCalibrator {
  private calibrationData: CostCalibrationData[] = []
  private maxRecords = 1000 // Keep last 1000 calibrations
  
  // Record actual vs estimated for calibration
  recordCalibration(data: Omit<CostCalibrationData, 'accuracy' | 'timestamp'>): void {
    const accuracy = {
      inputTokenError: this.calculateError(data.estimated.inputTokens, data.actual.inputTokens),
      outputTokenError: this.calculateError(data.estimated.outputTokens, data.actual.outputTokens),
      costError: this.calculateError(data.estimated.cost, data.actual.cost)
    }
    
    const calibrationRecord: CostCalibrationData = {
      ...data,
      accuracy,
      timestamp: new Date().toISOString()
    }
    
    this.calibrationData.push(calibrationRecord)
    
    // Keep only recent records
    if (this.calibrationData.length > this.maxRecords) {
      this.calibrationData = this.calibrationData.slice(-this.maxRecords)
    }
    
    console.log(`📊 Cost calibration recorded: ${data.documentType} - ${accuracy.costError.toFixed(1)}% error`)
  }
  
  private calculateError(estimated: number, actual: number): number {
    if (actual === 0) return estimated === 0 ? 0 : 100
    return Math.abs((estimated - actual) / actual) * 100
  }
  
  // Get calibration insights for a document type
  getCalibrationInsights(documentType: string): {
    sampleSize: number
    avgInputTokenError: number
    avgOutputTokenError: number
    avgCostError: number
    recommendedAdjustment: {
      inputTokenMultiplier: number
      outputTokenMultiplier: number
    }
  } {
    const relevantData = this.calibrationData.filter(d => d.documentType === documentType)
    
    if (relevantData.length === 0) {
      return {
        sampleSize: 0,
        avgInputTokenError: 0,
        avgOutputTokenError: 0,
        avgCostError: 0,
        recommendedAdjustment: {
          inputTokenMultiplier: 1.0,
          outputTokenMultiplier: 1.0
        }
      }
    }
    
    const avgInputTokenError = relevantData.reduce((sum, d) => sum + d.accuracy.inputTokenError, 0) / relevantData.length
    const avgOutputTokenError = relevantData.reduce((sum, d) => sum + d.accuracy.outputTokenError, 0) / relevantData.length
    const avgCostError = relevantData.reduce((sum, d) => sum + d.accuracy.costError, 0) / relevantData.length
    
    // Calculate recommended multipliers to improve accuracy
    const inputMultiplier = this.calculateAdjustmentMultiplier(relevantData, 'input')
    const outputMultiplier = this.calculateAdjustmentMultiplier(relevantData, 'output')
    
    return {
      sampleSize: relevantData.length,
      avgInputTokenError,
      avgOutputTokenError,
      avgCostError,
      recommendedAdjustment: {
        inputTokenMultiplier: inputMultiplier,
        outputTokenMultiplier: outputMultiplier
      }
    }
  }
  
  private calculateAdjustmentMultiplier(data: CostCalibrationData[], type: 'input' | 'output'): number {
    const ratios = data.map(d => {
      const estimated = type === 'input' ? d.estimated.inputTokens : d.estimated.outputTokens
      const actual = type === 'input' ? d.actual.inputTokens : d.actual.outputTokens
      return estimated > 0 ? actual / estimated : 1
    })
    
    // Use median to avoid outlier bias
    ratios.sort((a, b) => a - b)
    const median = ratios[Math.floor(ratios.length / 2)]
    
    // Clamp to reasonable range
    return Math.max(0.5, Math.min(2.0, median))
  }
  
  // Get overall system accuracy
  getSystemAccuracy(): {
    totalSamples: number
    byDocumentType: Record<string, {
      samples: number
      avgCostError: number
      trend: 'improving' | 'stable' | 'degrading'
    }>
    overallCostAccuracy: number
    modelComparison: {
      'gpt-4o': { samples: number, avgCostError: number }
      'gpt-4o-mini': { samples: number, avgCostError: number }
    }
  } {
    const byType = this.calibrationData.reduce((acc, d) => {
      if (!acc[d.documentType]) {
        acc[d.documentType] = []
      }
      acc[d.documentType].push(d)
      return acc
    }, {} as Record<string, CostCalibrationData[]>)
    
    const byDocumentType = Object.entries(byType).reduce((acc, [type, data]) => {
      const avgError = data.reduce((sum, d) => sum + d.accuracy.costError, 0) / data.length
      
      // Calculate trend (last 10 vs previous 10)
      const recent = data.slice(-10)
      const previous = data.slice(-20, -10)
      const recentAvg = recent.reduce((sum, d) => sum + d.accuracy.costError, 0) / recent.length
      const previousAvg = previous.length > 0 ? previous.reduce((sum, d) => sum + d.accuracy.costError, 0) / previous.length : recentAvg
      
      let trend: 'improving' | 'stable' | 'degrading' = 'stable'
      if (recentAvg < previousAvg - 2) trend = 'improving'
      else if (recentAvg > previousAvg + 2) trend = 'degrading'
      
      acc[type] = {
        samples: data.length,
        avgCostError: avgError,
        trend
      }
      return acc
    }, {} as Record<string, any>)
    
    const overallCostAccuracy = this.calibrationData.reduce((sum, d) => sum + d.accuracy.costError, 0) / this.calibrationData.length
    
    const modelData = this.calibrationData.reduce((acc, d) => {
      if (!acc[d.model]) acc[d.model] = []
      acc[d.model].push(d)
      return acc
    }, {} as Record<string, CostCalibrationData[]>)
    
    const modelComparison = {
      'gpt-4o': {
        samples: modelData['gpt-4o']?.length || 0,
        avgCostError: modelData['gpt-4o']?.reduce((sum, d) => sum + d.accuracy.costError, 0) / (modelData['gpt-4o']?.length || 1) || 0
      },
      'gpt-4o-mini': {
        samples: modelData['gpt-4o-mini']?.length || 0,
        avgCostError: modelData['gpt-4o-mini']?.reduce((sum, d) => sum + d.accuracy.costError, 0) / (modelData['gpt-4o-mini']?.length || 1) || 0
      }
    }
    
    return {
      totalSamples: this.calibrationData.length,
      byDocumentType,
      overallCostAccuracy,
      modelComparison
    }
  }
  
  // Generate calibration report
  generateReport(): string {
    const accuracy = this.getSystemAccuracy()
    
    let report = `📊 Cost Calibration Report\n`
    report += `Total Samples: ${accuracy.totalSamples}\n`
    report += `Overall Cost Accuracy: ${(100 - accuracy.overallCostAccuracy).toFixed(1)}%\n\n`
    
    report += `Model Comparison:\n`
    report += `  gpt-4o: ${accuracy.modelComparison['gpt-4o'].samples} samples, ${(100 - accuracy.modelComparison['gpt-4o'].avgCostError).toFixed(1)}% accuracy\n`
    report += `  gpt-4o-mini: ${accuracy.modelComparison['gpt-4o-mini'].samples} samples, ${(100 - accuracy.modelComparison['gpt-4o-mini'].avgCostError).toFixed(1)}% accuracy\n\n`
    
    report += `By Document Type:\n`
    Object.entries(accuracy.byDocumentType).forEach(([type, data]) => {
      const trendEmoji = data.trend === 'improving' ? '📈' : data.trend === 'degrading' ? '📉' : '➡️'
      report += `  ${type}: ${data.samples} samples, ${(100 - data.avgCostError).toFixed(1)}% accuracy ${trendEmoji}\n`
    })
    
    return report
  }
}

// Global calibrator instance
export const costCalibrator = new CostCalibrator()

// Helper function to record calibration from API responses
export function recordActualCost(
  documentType: string,
  model: 'gpt-4o' | 'gpt-4o-mini',
  estimated: { inputTokens: number, outputTokens: number, cost: number },
  actualUsage: { prompt_tokens: number, completion_tokens: number, total_tokens: number },
  imageSize: { width: number, height: number },
  complexity: number
): void {
  const actualCost = calculateActualCostFromUsage(model, actualUsage)
  
  costCalibrator.recordCalibration({
    documentType,
    model,
    estimated,
    actual: {
      inputTokens: actualUsage.prompt_tokens,
      outputTokens: actualUsage.completion_tokens,
      cost: actualCost
    },
    imageSize,
    complexity
  })
}

function calculateActualCostFromUsage(
  model: 'gpt-4o' | 'gpt-4o-mini',
  usage: { prompt_tokens: number, completion_tokens: number, total_tokens: number }
): number {
  const pricing = {
    'gpt-4o': { input: 0.005 / 1000, output: 0.015 / 1000 },
    'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 }
  }
  
  const costs = pricing[model]
  return (usage.prompt_tokens * costs.input) + (usage.completion_tokens * costs.output)
}
