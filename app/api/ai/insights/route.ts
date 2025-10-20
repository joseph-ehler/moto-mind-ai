/**
 * AI Insights API
 * 
 * Generates AI-powered insights for onboarding
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateMileageInsights,
  generateOwnershipInsights,
  generateServiceInsights,
  generateComprehensiveInsights,
  buildInsightContext,
  type AIInsight,
  type ComprehensiveInsights
} from '@/lib/ai/insight-generator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface InsightRequest {
  type: 'mileage' | 'ownership' | 'service' | 'comprehensive'
  data: {
    vehicleData?: any
    mileage?: number
    ownership?: string
    serviceTiming?: string
    nickname?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI/Insights] OpenAI API key not configured, using fallback')
      return NextResponse.json({
        success: false,
        error: 'AI insights not configured',
        useFallback: true
      }, { status: 200 }) // Return 200 so client can fallback gracefully
    }

    const body: InsightRequest = await request.json()
    const { type, data } = body

    // Build context from request data
    const context = buildInsightContext(data)

    let insights: AIInsight[] | ComprehensiveInsights | null = null

    // Generate appropriate insights based on type
    switch (type) {
      case 'mileage':
        insights = await generateMileageInsights(context)
        break
      
      case 'ownership':
        insights = await generateOwnershipInsights(context)
        break
      
      case 'service':
        insights = await generateServiceInsights(context)
        break
      
      case 'comprehensive':
        insights = await generateComprehensiveInsights(context)
        break
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid insight type' },
          { status: 400 }
        )
    }

    // If AI failed, return success: false so client can fallback
    if (!insights || (Array.isArray(insights) && insights.length === 0)) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate insights',
        useFallback: true
      }, { status: 200 })
    }

    return NextResponse.json({
      success: true,
      insights
    })

  } catch (error) {
    console.error('[AI/Insights] Error:', error)
    
    // Return graceful error so client can use fallback
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      useFallback: true
    }, { status: 200 })
  }
}
