/**
 * NHTSA "Ask My Car" API Endpoint
 * 
 * POST /api/nhtsa/ask
 * 
 * Semantic search + RAG for natural language Q&A
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRAGService } from '@/lib/nhtsa/rag-service'
import { requireUserServer } from '@/lib/auth/current-user'

export const runtime = 'nodejs'
export const maxDuration = 30 // 30 seconds max (embeddings + GPT-4)

export async function POST(request: NextRequest) {
  try {
    // Auth (optional - can be public or require Pro tier)
    // const user = await requireUserServer()
    
    // Parse request
    const body = await request.json()
    const { question, vehicle } = body
    
    // Validation
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }
    
    if (question.length < 10) {
      return NextResponse.json(
        { error: 'Question must be at least 10 characters' },
        { status: 400 }
      )
    }
    
    if (question.length > 500) {
      return NextResponse.json(
        { error: 'Question must be less than 500 characters' },
        { status: 400 }
      )
    }
    
    // Get RAG service
    const rag = getRAGService()
    
    // Process question
    const result = await rag.ask(question, vehicle)
    
    // Return response
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error('Ask API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process question',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// GET endpoint for stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'stats') {
      const { getEmbeddingsService } = await import('@/lib/nhtsa/embeddings-service')
      const embeddings = getEmbeddingsService()
      const stats = await embeddings.getStats()
      
      return NextResponse.json(stats)
    }
    
    return NextResponse.json({ 
      message: 'Ask My Car API',
      version: '1.0',
      model: 'gpt-4-turbo-preview + text-embedding-3-small'
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
