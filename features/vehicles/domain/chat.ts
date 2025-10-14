/**
 * Vehicle AI Chat API
 * 
 * Handles contextual AI conversations about a specific vehicle
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface VehicleContext {
  id: string
  make: string
  model: string
  year: number
  mileage: number
  health?: number
  recentIssues?: string[]
  lastService?: string
}

interface ChatRequest {
  message: string
  conversationHistory?: ChatMessage[]
  vehicleContext: VehicleContext
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id: vehicleId } = req.query
  const { message, conversationHistory = [], vehicleContext }: ChatRequest = req.body

  if (!message || !vehicleContext) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Build system prompt with vehicle context
    const systemPrompt = buildSystemPrompt(vehicleContext)

    // Call OpenAI with conversation history
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error('No response from AI')
    }

    return res.status(200).json({
      response,
      tokensUsed: completion.usage?.total_tokens || 0
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return res.status(500).json({
      error: 'Failed to generate response',
      fallback: 'I apologize, but I encountered an error. Please try asking your question again.'
    })
  }
}

function buildSystemPrompt(context: VehicleContext): string {
  return `You are a knowledgeable automotive AI assistant helping the owner of a ${context.year} ${context.make} ${context.model}.

VEHICLE CONTEXT:
- Make/Model: ${context.year} ${context.make} ${context.model}
- Current Mileage: ${context.mileage.toLocaleString()} miles
${context.health ? `- Health Score: ${context.health}/100` : ''}
${context.lastService ? `- Last Service: ${context.lastService}` : ''}
${context.recentIssues?.length ? `- Recent Issues: ${context.recentIssues.join(', ')}` : ''}

YOUR ROLE:
- Provide helpful, accurate information about this specific vehicle
- Answer questions about maintenance schedules, costs, common issues
- Reference the vehicle's current mileage when relevant
- Be conversational but concise (2-3 paragraphs max)
- If you don't know something specific, be honest and suggest consulting the owner's manual or a mechanic

GUIDELINES:
- Use the owner's perspective (their vehicle, their mileage)
- Provide actionable advice when possible
- Reference manufacturer recommendations when applicable
- Warn about safety-critical issues
- Keep responses under 200 words unless asked for detail

Remember: This is a real vehicle with real maintenance needs. Provide practical, owner-focused guidance.`
}


export default withTenantIsolation(handler)
