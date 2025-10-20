/**
 * On-Demand Embedding API
 * 
 * Generates embeddings in real-time for rare vehicles
 * when users search for them.
 * 
 * USE CASE:
 * - User searches for rare vehicle (Maserati, Alfa Romeo, etc.)
 * - We don't have embeddings yet
 * - Generate embeddings on-the-fly
 * - Cache for future searches
 * 
 * GUARDRAILS:
 * - Only for low-priority vehicles
 * - Max 50 complaints per request
 * - 5-second timeout
 * - Falls back to keyword search if fails
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { shouldEmbedOnDemand, getComplaintsNeedingEmbeddings } from '@/lib/nhtsa/smart-embedding-priority'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const EMBEDDING_MODEL = 'text-embedding-3-small'
const MAX_ON_DEMAND = 50 // Max complaints to embed on-demand
const TIMEOUT_MS = 5000 // 5 second timeout

export async function POST(req: NextRequest) {
  try {
    const { make, model } = await req.json()
    
    if (!make || !model) {
      return NextResponse.json(
        { error: 'make and model are required' },
        { status: 400 }
      )
    }
    
    console.log(`[OnDemand] Checking: ${make} ${model}`)
    
    // Check if we should embed on-demand
    const should = await shouldEmbedOnDemand(make, model)
    
    if (!should) {
      return NextResponse.json({
        embedded: false,
        reason: 'Not a low-priority vehicle or already embedded',
        message: 'Use standard search'
      })
    }
    
    console.log(`[OnDemand] Embedding ${make} ${model} on-demand...`)
    
    // Get complaints that need embeddings
    const complaints = await getComplaintsNeedingEmbeddings({
      make,
      limit: MAX_ON_DEMAND
    })
    
    if (complaints.length === 0) {
      return NextResponse.json({
        embedded: false,
        reason: 'No complaints found',
        message: 'Vehicle has no complaints in database'
      })
    }
    
    console.log(`[OnDemand] Found ${complaints.length} complaints to embed`)
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)
    )
    
    // Embed with timeout
    const embedPromise = embedComplaints(complaints)
    
    const result = await Promise.race([embedPromise, timeoutPromise]) as {
      success: number
      failed: number
    }
    
    console.log(`[OnDemand] Success: ${result.success}, Failed: ${result.failed}`)
    
    return NextResponse.json({
      embedded: true,
      count: result.success,
      failed: result.failed,
      message: `Embedded ${result.success} complaints for ${make} ${model}`
    })
    
  } catch (error: any) {
    console.error('[OnDemand] Error:', error.message)
    
    if (error.message === 'Timeout') {
      return NextResponse.json({
        embedded: false,
        reason: 'timeout',
        message: 'Embedding took too long, falling back to keyword search'
      }, { status: 504 })
    }
    
    return NextResponse.json({
      embedded: false,
      reason: 'error',
      message: 'Failed to generate embeddings',
      error: error.message
    }, { status: 500 })
  }
}

/**
 * Embed complaints (helper function)
 */
async function embedComplaints(complaints: any[]): Promise<{
  success: number
  failed: number
}> {
  try {
    // Create text for embedding
    const texts = complaints.map(c => 
      `${c.year} ${c.make} ${c.model} - ${c.component}: ${c.summary} ${c.description}`.substring(0, 8000)
    )
    
    // Generate embeddings
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts
    })
    
    // Update database
    let success = 0
    let failed = 0
    
    for (let i = 0; i < complaints.length; i++) {
      try {
        await supabase
          .from('nhtsa_complaints')
          .update({
            embedding: JSON.stringify(response.data[i].embedding),
            embedding_generated_at: new Date().toISOString(),
            embedding_model: EMBEDDING_MODEL
          })
          .eq('id', complaints[i].id)
        
        success++
      } catch (error) {
        failed++
        console.error(`[OnDemand] Failed to update ${complaints[i].id}`)
      }
    }
    
    return { success, failed }
  } catch (error) {
    console.error('[OnDemand] embedComplaints error:', error)
    throw error
  }
}
