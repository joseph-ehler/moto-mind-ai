/**
 * AI Tickers API
 * 
 * Generates contextual loading messages using OpenAI.
 * 
 * POST /api/ai/tickers
 * Body: { flow, chapter, vehicle: { year, make, model }, mileageBand?, locale?, tone? }
 * 
 * Returns: { tickers: string[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const RequestSchema = z.object({
  flow: z.string(),
  chapter: z.string(),
  vehicle: z.object({
    year: z.number().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
  }).optional(),
  mileageBand: z.string().optional(),
  locale: z.string().default('en-US'),
  tone: z.string().default('calm'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const context = RequestSchema.parse(body)
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      )
    }
    
    // Build prompt
    const prompt = buildPrompt(context)
    
    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are MotoMind\'s micro-copy engine. Output 2-3 short, friendly loading ticker lines based only on the provided context. Keep it calm, non-diagnostic, and brand-safe. 7-10 words each. No promises, no instructions to the user. Return only valid JSON with a "tickers" array of strings.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      }),
    })
    
    if (!response.ok) {
      console.error('[AI Tickers] OpenAI error:', response.status)
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 503 }
      )
    }
    
    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }
    
    // Parse JSON response
    const parsed = JSON.parse(content)
    
    // Validate tickers
    if (!parsed.tickers || !Array.isArray(parsed.tickers)) {
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      )
    }
    
    // Filter and validate
    const tickers = parsed.tickers
      .filter((t: any) => typeof t === 'string')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length >= 5 && t.length <= 60)
      .slice(0, 3) // Max 3
    
    if (tickers.length === 0) {
      return NextResponse.json(
        { error: 'No valid tickers generated' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ tickers })
    
  } catch (error: any) {
    console.error('[AI Tickers] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Build prompt from context
 */
function buildPrompt(context: z.infer<typeof RequestSchema>): string {
  const parts: string[] = []
  
  parts.push(`Flow: ${context.flow}`)
  parts.push(`Chapter: ${context.chapter}`)
  
  if (context.vehicle) {
    if (context.vehicle.year) parts.push(`Year: ${context.vehicle.year}`)
    if (context.vehicle.make) parts.push(`Make: ${context.vehicle.make}`)
    if (context.vehicle.model) parts.push(`Model: ${context.vehicle.model}`)
  }
  
  if (context.mileageBand) {
    parts.push(`Mileage: ${context.mileageBand}`)
  }
  
  parts.push(`Locale: ${context.locale}`)
  parts.push(`Tone: ${context.tone}`)
  
  parts.push('\nGenerate 2-3 contextual loading ticker messages (7-10 words each) that reference the vehicle when appropriate. Keep it helpful and brand-safe. No costs, repairs, or shop names.')
  
  return parts.join('\n')
}
