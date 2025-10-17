// OpenAI API Usage Tracking and Cost Control
import { Pool } from 'pg'

interface APIUsageLog {
  id: string
  endpoint: string
  model: string
  tokens_used: number
  estimated_cost: number
  success: boolean
  error_message?: string
  user_id?: string
  vehicle_id?: string
  created_at: Date
}

class APIUsageTracker {
  private pool: Pool

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString })
  }

  // OpenAI pricing (as of 2024)
  private readonly PRICING = {
    'gpt-4o': {
      input: 0.005 / 1000,  // $0.005 per 1K input tokens
      output: 0.015 / 1000  // $0.015 per 1K output tokens
    },
    'gpt-4o-mini': {
      input: 0.00015 / 1000,  // $0.00015 per 1K input tokens
      output: 0.0006 / 1000   // $0.0006 per 1K output tokens
    }
  }

  async logAPICall(params: {
    endpoint: string
    model: string
    inputTokens: number
    outputTokens: number
    success: boolean
    errorMessage?: string
    userId?: string
    vehicleId?: string
  }): Promise<void> {
    const { endpoint, model, inputTokens, outputTokens, success, errorMessage, userId, vehicleId } = params
    
    const pricing = this.PRICING[model as keyof typeof this.PRICING]
    const estimatedCost = pricing ? 
      (inputTokens * pricing.input) + (outputTokens * pricing.output) : 0

    const client = await this.pool.connect()
    
    try {
      await client.query(`
        INSERT INTO api_usage_logs (
          endpoint, model, input_tokens, output_tokens, total_tokens, 
          estimated_cost, success, error_message, user_id, vehicle_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      `, [
        endpoint,
        model,
        inputTokens,
        outputTokens,
        inputTokens + outputTokens,
        estimatedCost,
        success,
        errorMessage,
        userId,
        vehicleId
      ])

      console.log(`📊 API Usage: ${endpoint} | ${model} | ${inputTokens + outputTokens} tokens | $${estimatedCost.toFixed(4)}`)
      
    } catch (error) {
      console.error('Failed to log API usage:', error)
    } finally {
      client.release()
    }
  }

  async getUsageStats(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    totalCalls: number
    totalTokens: number
    totalCost: number
    successRate: number
    topEndpoints: Array<{ endpoint: string; calls: number; cost: number }>
  }> {
    const client = await this.pool.connect()
    
    try {
      const timeFilter = {
        hour: "created_at > NOW() - INTERVAL '1 hour'",
        day: "created_at > NOW() - INTERVAL '1 day'",
        week: "created_at > NOW() - INTERVAL '1 week'",
        month: "created_at > NOW() - INTERVAL '1 month'"
      }[timeframe]

      const result = await client.query(`
        SELECT 
          COUNT(*) as total_calls,
          SUM(total_tokens) as total_tokens,
          SUM(estimated_cost) as total_cost,
          AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as success_rate,
          json_agg(
            json_build_object(
              'endpoint', endpoint,
              'calls', endpoint_calls,
              'cost', endpoint_cost
            )
          ) as top_endpoints
        FROM (
          SELECT *,
            COUNT(*) OVER (PARTITION BY endpoint) as endpoint_calls,
            SUM(estimated_cost) OVER (PARTITION BY endpoint) as endpoint_cost
          FROM api_usage_logs 
          WHERE ${timeFilter}
        ) t
      `)

      const stats = result.rows[0]
      
      return {
        totalCalls: parseInt(stats.total_calls) || 0,
        totalTokens: parseInt(stats.total_tokens) || 0,
        totalCost: parseFloat(stats.total_cost) || 0,
        successRate: parseFloat(stats.success_rate) || 0,
        topEndpoints: stats.top_endpoints || []
      }
      
    } finally {
      client.release()
    }
  }

  async checkUsageLimits(userId?: string): Promise<{
    withinLimits: boolean
    dailyCost: number
    dailyLimit: number
    warningThreshold: number
  }> {
    const DAILY_LIMIT = 10.00 // $10 per day limit
    const WARNING_THRESHOLD = 8.00 // $8 warning threshold

    const stats = await this.getUsageStats('day')
    
    return {
      withinLimits: stats.totalCost < DAILY_LIMIT,
      dailyCost: stats.totalCost,
      dailyLimit: DAILY_LIMIT,
      warningThreshold: WARNING_THRESHOLD
    }
  }
}

// Singleton instance
let tracker: APIUsageTracker | null = null

export function getAPIUsageTracker(): APIUsageTracker {
  if (!tracker && process.env.DATABASE_URL) {
    tracker = new APIUsageTracker(process.env.DATABASE_URL)
  }
  return tracker!
}

// Helper function to wrap OpenAI calls with usage tracking
export async function trackOpenAICall<T>(
  endpoint: string,
  model: string,
  apiCall: () => Promise<T>,
  metadata?: { userId?: string; vehicleId?: string }
): Promise<T> {
  const startTime = Date.now()
  let result: T
  let success = true
  let errorMessage: string | undefined

  try {
    result = await apiCall()
    return result
  } catch (error) {
    success = false
    errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw error
  } finally {
    // Note: In a real implementation, you'd extract token counts from the OpenAI response
    // For now, we'll estimate based on typical usage
    const estimatedInputTokens = endpoint.includes('vision') ? 1000 : 500
    const estimatedOutputTokens = 200

    try {
      await getAPIUsageTracker().logAPICall({
        endpoint,
        model,
        inputTokens: estimatedInputTokens,
        outputTokens: estimatedOutputTokens,
        success,
        errorMessage,
        ...metadata
      })
    } catch (logError) {
      console.error('Failed to log API usage:', logError)
    }
  }
}
