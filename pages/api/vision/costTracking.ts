// Vision API Cost Tracking and Analytics
// Monitors usage, costs, and optimization opportunities

import { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/features/auth'

import { withValidation, validationSchemas } from '@/features/vehicles/data/api-validation'

interface VisionUsageRecord {
  timestamp: string
  documentType: string
  model: string
  tokens: {
    input: number
    output: number
  }
  cost: number
  processingTime: number
  success: boolean
  attempt: number
}

// In-memory storage (replace with database in production)
let usageRecords: VisionUsageRecord[] = []

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Record usage with validation
    return withValidation(req, res, validationSchemas.vision.costTracking, async (validatedData) => {
      const record: VisionUsageRecord = {
        timestamp: new Date().toISOString(),
        documentType: validatedData.documentType || 'unknown',
        model: validatedData.model,
        tokens: {
          input: validatedData.inputTokens,
          output: validatedData.outputTokens
        },
        cost: 0, // Calculate based on model pricing
        processingTime: 0,
        success: true,
        attempt: 1
      }
      usageRecords.push(record)
    
      // Keep only last 1000 records in memory
      if (usageRecords.length > 1000) {
        usageRecords = usageRecords.slice(-1000)
      }
    
      return { success: true, recordsCount: usageRecords.length }
    })
  }
  
  if (req.method === 'GET') {
    // Return analytics
    const analytics = generateAnalytics()
    return res.status(200).json(analytics)
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}

function generateAnalytics() {
  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const recent24h = usageRecords.filter(r => new Date(r.timestamp) > last24h)
  const recent7d = usageRecords.filter(r => new Date(r.timestamp) > last7d)
  const recent30d = usageRecords.filter(r => new Date(r.timestamp) > last30d)
  
  return {
    summary: {
      total_requests: usageRecords.length,
      total_cost: usageRecords.reduce((sum, r) => sum + r.cost, 0).toFixed(4),
      success_rate: (usageRecords.filter(r => r.success).length / usageRecords.length * 100).toFixed(1),
      avg_processing_time: (usageRecords.reduce((sum, r) => sum + r.processingTime, 0) / usageRecords.length).toFixed(0)
    },
    
    periods: {
      last_24h: generatePeriodStats(recent24h),
      last_7d: generatePeriodStats(recent7d),
      last_30d: generatePeriodStats(recent30d)
    },
    
    model_usage: generateModelStats(usageRecords),
    document_types: generateDocumentTypeStats(usageRecords),
    cost_optimization: generateOptimizationStats(usageRecords),
    
    recent_failures: usageRecords
      .filter(r => !r.success)
      .slice(-10)
      .map(r => ({
        timestamp: r.timestamp,
        documentType: r.documentType,
        model: r.model,
        attempt: r.attempt
      }))
  }
}

function generatePeriodStats(records: VisionUsageRecord[]) {
  if (records.length === 0) {
    return { requests: 0, cost: '0.0000', success_rate: '0.0', avg_time: '0' }
  }
  
  return {
    requests: records.length,
    cost: records.reduce((sum, r) => sum + r.cost, 0).toFixed(4),
    success_rate: (records.filter(r => r.success).length / records.length * 100).toFixed(1),
    avg_time: (records.reduce((sum, r) => sum + r.processingTime, 0) / records.length).toFixed(0)
  }
}

function generateModelStats(records: VisionUsageRecord[]) {
  const modelStats = records.reduce((acc, r) => {
    if (!acc[r.model]) {
      acc[r.model] = { count: 0, cost: 0, success: 0 }
    }
    acc[r.model].count++
    acc[r.model].cost += r.cost
    if (r.success) acc[r.model].success++
    return acc
  }, {} as Record<string, { count: number, cost: number, success: number }>)
  
  return Object.entries(modelStats).map(([model, stats]) => ({
    model,
    usage_count: stats.count,
    total_cost: stats.cost.toFixed(4),
    success_rate: (stats.success / stats.count * 100).toFixed(1),
    avg_cost_per_request: (stats.cost / stats.count).toFixed(4)
  }))
}

function generateDocumentTypeStats(records: VisionUsageRecord[]) {
  const typeStats = records.reduce((acc, r) => {
    if (!acc[r.documentType]) {
      acc[r.documentType] = { count: 0, cost: 0, success: 0, totalTime: 0 }
    }
    acc[r.documentType].count++
    acc[r.documentType].cost += r.cost
    acc[r.documentType].totalTime += r.processingTime
    if (r.success) acc[r.documentType].success++
    return acc
  }, {} as Record<string, { count: number, cost: number, success: number, totalTime: number }>)
  
  return Object.entries(typeStats).map(([type, stats]) => ({
    document_type: type,
    usage_count: stats.count,
    total_cost: stats.cost.toFixed(4),
    success_rate: (stats.success / stats.count * 100).toFixed(1),
    avg_processing_time: (stats.totalTime / stats.count).toFixed(0)
  }))
}

function generateOptimizationStats(records: VisionUsageRecord[]) {
  const gpt4Records = records.filter(r => r.model === 'gpt-4o')
  const gpt4MiniRecords = records.filter(r => r.model === 'gpt-4o-mini')
  
  const currentCost = records.reduce((sum, r) => sum + r.cost, 0)
  
  // Calculate potential savings if all gpt-4o requests used gpt-4o-mini
  const potentialSavings = gpt4Records.reduce((sum, r) => {
    const miniCost = r.cost * 0.2 // gpt-4o-mini is ~20% the cost
    return sum + (r.cost - miniCost)
  }, 0)
  
  const optimizationRate = gpt4MiniRecords.length / records.length * 100
  
  return {
    current_optimization_rate: optimizationRate.toFixed(1) + '%',
    potential_monthly_savings: (potentialSavings * 30).toFixed(2),
    gpt4o_usage: gpt4Records.length,
    gpt4o_mini_usage: gpt4MiniRecords.length,
    recommendations: generateRecommendations(records)
  }
}

function generateRecommendations(records: VisionUsageRecord[]) {
  const recommendations = []
  
  // Check for high gpt-4o usage on simple document types
  const simpleTypes = ['odometer', 'fuel', 'license_plate']
  const unnecessaryGpt4o = records.filter(r => 
    r.model === 'gpt-4o' && simpleTypes.includes(r.documentType)
  )
  
  if (unnecessaryGpt4o.length > 0) {
    recommendations.push({
      type: 'cost_optimization',
      message: `${unnecessaryGpt4o.length} simple extractions used expensive gpt-4o model`,
      potential_savings: (unnecessaryGpt4o.length * 0.004).toFixed(3),
      action: 'Switch simple document types to gpt-4o-mini'
    })
  }
  
  // Check for high retry rates
  const retryRecords = records.filter(r => r.attempt > 1)
  if (retryRecords.length / records.length > 0.1) {
    recommendations.push({
      type: 'reliability',
      message: `${(retryRecords.length / records.length * 100).toFixed(1)}% of requests required retries`,
      action: 'Investigate API reliability issues or improve error handling'
    })
  }
  
  // Check for slow processing times
  const slowRecords = records.filter(r => r.processingTime > 10000) // > 10 seconds
  if (slowRecords.length > 0) {
    recommendations.push({
      type: 'performance',
      message: `${slowRecords.length} requests took over 10 seconds`,
      action: 'Consider timeout optimization or image preprocessing'
    })
  }
  
  return recommendations
}

// Helper function to record usage (call from other endpoints)
export const recordVisionUsage = async (record: VisionUsageRecord) => {
  try {
    await fetch('/api/vision/cost-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    })
  } catch (error) {
    console.error('Failed to record vision usage:', error)
  }
}


export default withTenantIsolation(handler)
