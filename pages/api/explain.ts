// MotoMindAI: Core Explanation API Endpoint
// The heart of the fleet intelligence system

import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantTransaction, incrementUsage } from '../../backend/database'
import { evaluateRules, getMostSevereRule, getVehicleStatus } from '../../backend/reasoning/fleet-rules'
import { generateExplanationWithLLM } from '../../backend/llm-client'
import { FleetErrors, getErrorStatusCode } from '../../backend/error-types'
import { usageTracker } from '../../backend/usage-tracker'
import jwt from 'jsonwebtoken'

interface ExplanationRequest {
  vehicleId: string
  question: string
}

interface ExplanationResponse {
  explanation: {
    id: string
    question: string
    reasoning: any
    confidence: string
    flagTypes: string[]
    dataQualityScore: number
    createdAt: string
  }
  metrics: {
    vehicleId: string
    dataCompletenessPct: number
    sourceLatencySec: number
    lastUpdated: string
  }
  tokensUsed: {
    in: number
    out: number
  }
  fallbackUsed: boolean
}

// Mock auth for development - replace with real JWT validation
function mockAuth(req: NextApiRequest) {
  // In development, use mock tenant/user
  return {
    tenantId: 'demo-tenant-123',
    userId: 'demo-user-456',
    role: 'owner'
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExplanationResponse | { error: string; suggestion?: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = Date.now()

  try {
    // Authentication (mock for development)
    const auth = mockAuth(req)
    
    // Validate request body
    const { vehicleId, question }: ExplanationRequest = req.body
    if (!vehicleId || !question) {
      const error = FleetErrors.validationError('request', 'vehicleId and question are required')
      return res.status(getErrorStatusCode(error.category)).json(error.toJSON())
    }

    // Execute the core explanation loop
    const result = await withTenantTransaction(
      { tenantId: auth.tenantId, userId: auth.userId },
      async (client) => {
        // 1. Get latest vehicle metrics from database
        const metricsQuery = await client.query(`
          SELECT 
            vehicle_id,
            brake_wear_pct,
            fuel_efficiency_mpg,
            harsh_events,
            idle_minutes,
            miles_driven,
            data_completeness_pct,
            source_latency_sec,
            metric_date,
            last_service_date
          FROM vehicle_metrics 
          WHERE vehicle_id = $1 
          ORDER BY metric_date DESC 
          LIMIT 1
        `, [vehicleId])

        if (metricsQuery.rows.length === 0) {
          throw FleetErrors.insufficientData(vehicleId, ['recent metrics'])
        }

        const metrics = metricsQuery.rows[0]

        // 2. Evaluate deterministic fleet rules
        const ruleResults = evaluateRules(metrics)
        const mostSevereRule = getMostSevereRule(ruleResults)
        const vehicleStatus = getVehicleStatus(ruleResults)

        // 3. Generate LLM explanation with Zod validation
        const vehicleQuery = await client.query(
          'SELECT label FROM vehicles WHERE id = $1',
          [vehicleId]
        )
        const vehicleLabel = vehicleQuery.rows[0]?.label || vehicleId

        const llmResponse = await generateExplanationWithLLM({
          question,
          ruleResults,
          metrics,
          vehicleLabel
        })

        // 4. Persist explanation and audit trail
        const explanationInsert = await client.query(`
          INSERT INTO explanations (
            tenant_id, vehicle_id, question, reasoning, confidence, 
            flag_types, data_quality_score, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          auth.tenantId,
          vehicleId,
          question,
          JSON.stringify(llmResponse.reasoning),
          llmResponse.confidence,
          JSON.stringify(ruleResults.filter(r => r.hit).map(r => r.type)),
          metrics.data_completeness_pct,
          auth.userId
        ])

        const explanation = explanationInsert.rows[0]

        // 5. Create audit log entry
        await client.query(`
          INSERT INTO audit_logs (
            tenant_id, explanation_id, vehicle_id, event_type, 
            actor_type, actor_id, payload
          )
          VALUES ($1, $2, $3, 'explanation_generated', 'user', $4, $5)
        `, [
          auth.tenantId,
          explanation.id,
          vehicleId,
          auth.userId,
          JSON.stringify({
            question,
            ruleResults: ruleResults.filter(r => r.hit),
            dataQuality: {
              completeness: metrics.data_completeness_pct,
              latency: metrics.source_latency_sec
            },
            llmFallbackUsed: llmResponse.fallbackUsed,
            tokensUsed: llmResponse.tokensUsed
          })
        ])

        return {
          explanation,
          metrics,
          llmResponse
        }
      }
    )

    // 6. Track usage for billing (batched)
    usageTracker.track(auth.tenantId, 'explanation', result.llmResponse.tokensUsed)

    // 7. Log performance metrics
    const duration = Date.now() - startTime
    console.log(`Explanation generated in ${duration}ms for ${vehicleId}`)

    // 8. Return structured response
    const response: ExplanationResponse = {
      explanation: {
        id: result.explanation.id,
        question: result.explanation.question,
        reasoning: result.llmResponse.reasoning,
        confidence: result.explanation.confidence,
        flagTypes: JSON.parse(result.explanation.flag_types),
        dataQualityScore: result.explanation.data_quality_score,
        createdAt: result.explanation.created_at
      },
      metrics: {
        vehicleId: result.metrics.vehicle_id,
        dataCompletenessPct: result.metrics.data_completeness_pct,
        sourceLatencySec: result.metrics.source_latency_sec,
        lastUpdated: result.metrics.metric_date
      },
      tokensUsed: result.llmResponse.tokensUsed,
      fallbackUsed: result.llmResponse.fallbackUsed
    }

    return res.status(200).json(response)

  } catch (error) {
    console.error('Explanation API error:', error)

    if (error instanceof Error && error.name === 'FleetError') {
      const fleetError = error as any
      return res.status(getErrorStatusCode(fleetError.category)).json(fleetError.toJSON())
    }

    // Generic system error
    const systemError = FleetErrors.systemError('explanation generation')
    return res.status(getErrorStatusCode(systemError.category)).json(systemError.toJSON())
  }
}
