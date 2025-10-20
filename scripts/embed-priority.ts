/**
 * Priority Embedding Script
 * 
 * Embeds complaints in smart priority order:
 * Phase 1: Top 16 makes (80% of complaints) → 2 hours
 * Phase 2: Medium priority (>5K complaints) → Overnight
 * Phase 3: Low priority (on-demand only)
 */

import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import {
  TOP_VEHICLE_MAKES,
  getComplaintsNeedingEmbeddings,
  getEmbeddingStats,
  estimateCompletionTime
} from '../lib/nhtsa/smart-embedding-priority'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const EMBEDDING_MODEL = 'text-embedding-3-small'
const BATCH_SIZE = 100
const RATE_LIMIT_DELAY = 20 // ms between batches

type Priority = 'high' | 'medium' | 'low'

interface ComplaintRecord {
  id: string
  odi_number: string
  year: string
  make: string
  model: string
  component: string
  summary: string
  description: string
}

/**
 * Generate embeddings for a batch of complaints
 */
async function embedBatch(complaints: ComplaintRecord[]): Promise<{
  success: number
  failed: number
}> {
  try {
    // Create text for embedding (optimized for semantic search)
    const texts = complaints.map(c => 
      `${c.year} ${c.make} ${c.model} - ${c.component}: ${c.summary} ${c.description}`.substring(0, 8000)
    )
    
    // Generate embeddings
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts
    })
    
    // Update database
    const updates = complaints.map((complaint, i) => ({
      id: complaint.id,
      embedding: JSON.stringify(response.data[i].embedding),
      embedding_generated_at: new Date().toISOString(),
      embedding_model: EMBEDDING_MODEL
    }))
    
    // Batch update
    for (const update of updates) {
      await supabase
        .from('nhtsa_complaints')
        .update({
          embedding: update.embedding,
          embedding_generated_at: update.embedding_generated_at,
          embedding_model: update.embedding_model
        })
        .eq('id', update.id)
    }
    
    return { success: complaints.length, failed: 0 }
  } catch (error: any) {
    console.error('[EmbedBatch] Error:', error.message)
    return { success: 0, failed: complaints.length }
  }
}

/**
 * Process embeddings for a priority level
 */
async function processPriority(priority: Priority): Promise<void> {
  console.log(`\n🚀 Processing ${priority.toUpperCase()} priority complaints...`)
  
  // Get time estimate
  const estimate = await estimateCompletionTime(priority)
  console.log(`📊 Records remaining: ${estimate.remainingRecords.toLocaleString()}`)
  console.log(`⏱️  Estimated time: ${estimate.estimatedHours} hours`)
  
  if (estimate.remainingRecords === 0) {
    console.log(`✅ All ${priority} priority complaints already embedded!`)
    return
  }
  
  let processed = 0
  let success = 0
  let failed = 0
  const startTime = Date.now()
  
  while (true) {
    // Fetch batch
    const complaints = await getComplaintsNeedingEmbeddings({
      priority,
      limit: BATCH_SIZE
    })
    
    if (complaints.length === 0) {
      break
    }
    
    // Process batch
    const result = await embedBatch(complaints)
    success += result.success
    failed += result.failed
    processed += complaints.length
    
    // Progress update
    const elapsed = (Date.now() - startTime) / 1000 / 60 // minutes
    const rate = Math.round(processed / elapsed)
    const remaining = estimate.remainingRecords - processed
    const eta = Math.round(remaining / rate)
    
    console.log(`⚡ Batch: +${complaints.length} | Total: ${processed.toLocaleString()} | Rate: ${rate}/min | ETA: ${eta}min`)
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
  }
  
  const totalTime = Math.round((Date.now() - startTime) / 1000 / 60)
  console.log(`\n✅ ${priority.toUpperCase()} Priority Complete!`)
  console.log(`   Success: ${success.toLocaleString()}`)
  console.log(`   Failed: ${failed.toLocaleString()}`)
  console.log(`   Time: ${totalTime} minutes`)
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2)
  const priority = (args[0] as Priority) || 'high'
  
  if (!['high', 'medium', 'low'].includes(priority)) {
    console.error('Usage: npm run embed:priority [high|medium|low]')
    process.exit(1)
  }
  
  console.log('\n╔════════════════════════════════════════╗')
  console.log('║   SMART PRIORITY EMBEDDING SYSTEM      ║')
  console.log('╚════════════════════════════════════════╝')
  
  // Show current stats
  const stats = await getEmbeddingStats()
  console.log('\n📊 CURRENT STATUS:')
  console.log(`   Total: ${stats.total.toLocaleString()} complaints`)
  console.log(`   Embedded: ${stats.embedded.toLocaleString()} (${Math.round((stats.embedded/stats.total)*100)}%)`)
  console.log(`   Remaining: ${stats.needEmbedding.toLocaleString()}`)
  console.log(`\n🎯 HIGH Priority (Top 16 Makes):`)
  console.log(`   Total: ${stats.highPriority.total.toLocaleString()}`)
  console.log(`   Complete: ${stats.highPriority.percentComplete}%`)
  
  console.log(`\n🚀 Starting ${priority.toUpperCase()} priority embedding...`)
  
  await processPriority(priority)
  
  // Show final stats
  const finalStats = await getEmbeddingStats()
  console.log('\n╔════════════════════════════════════════╗')
  console.log('║          FINAL STATISTICS              ║')
  console.log('╚════════════════════════════════════════╝')
  console.log(`\nHIGH Priority: ${finalStats.highPriority.percentComplete}% complete`)
  console.log(`MEDIUM Priority: ${finalStats.mediumPriority.percentComplete}% complete`)
  console.log(`LOW Priority: ${finalStats.lowPriority.percentComplete}% complete`)
  console.log(`\nTotal embedded: ${finalStats.embedded.toLocaleString()} / ${finalStats.total.toLocaleString()}`)
  
  console.log('\n✅ DONE!\n')
}

main().catch(console.error)
