/**
 * Parallel Embedding Generation (FAST)
 * 
 * Processes multiple batches in parallel for 5-10x speedup:
 * - 10 parallel workers
 * - 100 embeddings per worker
 * - ~500-1000 embeddings/minute
 * - Total time: 20-40 hours (vs 185 hours)
 */

import 'dotenv/config'
import { getEmbeddingsService } from '../lib/nhtsa/embeddings-service'
import pLimit from 'p-limit'

const PARALLEL_WORKERS = 10 // Process 10 batches simultaneously
const BATCH_SIZE = 100

async function generateParallel() {
  console.log('\n🚀 PARALLEL EMBEDDING GENERATION\n')
  console.log('='.repeat(80))
  console.log('\n⚡ Workers: 10 parallel batches')
  console.log('📦 Batch size: 100 per worker')
  console.log('🎯 Expected rate: 500-1000/minute\n')
  
  const embeddings = getEmbeddingsService()
  const limit = pLimit(PARALLEL_WORKERS)
  
  const stats = await embeddings.getStats()
  console.log(`📊 Total: ${stats.total_complaints.toLocaleString()}`)
  console.log(`✅ Complete: ${stats.with_embeddings.toLocaleString()} (${stats.percentage_complete}%)`)
  console.log(`⏱️  Remaining: ${stats.without_embeddings.toLocaleString()}\n`)
  
  if (stats.without_embeddings === 0) {
    console.log('✅ All embeddings complete!\n')
    return
  }
  
  // Estimate
  const estimatedMinutes = Math.ceil(stats.without_embeddings / 500) // ~500/min
  const estimatedHours = Math.floor(estimatedMinutes / 60)
  console.log(`⏱️  Estimated time: ~${estimatedHours} hours\n`)
  
  const startTime = Date.now()
  let totalProcessed = 0
  
  // Main loop
  while (true) {
    // Get next batches (10 workers x 100 each = 1000 at a time)
    const tasks = []
    
    for (let i = 0; i < PARALLEL_WORKERS; i++) {
      tasks.push(
        limit(async () => {
          const complaints = await embeddings.getComplaintsNeedingEmbeddings(BATCH_SIZE)
          
          if (complaints.length === 0) return 0
          
          const results = await embeddings.generateBatch(complaints)
          const saved = await embeddings.saveEmbeddings(results)
          
          return saved
        })
      )
    }
    
    // Wait for all workers to complete
    const results = await Promise.all(tasks)
    const batchTotal = results.reduce((a, b) => a + b, 0)
    
    if (batchTotal === 0) {
      break // No more records
    }
    
    totalProcessed += batchTotal
    
    // Calculate rate
    const elapsed = Date.now() - startTime
    const rate = Math.round((totalProcessed / (elapsed / 60000)))
    const remainingMinutes = Math.ceil((stats.without_embeddings - totalProcessed) / rate)
    
    // Progress
    const currentStats = await embeddings.getStats()
    const percent = currentStats.percentage_complete
    
    console.log(`⚡ Processed ${batchTotal.toLocaleString()} | Total: ${totalProcessed.toLocaleString()} | Rate: ${rate}/min | Progress: ${percent}% | ETA: ${remainingMinutes}min`)
  }
  
  const endTime = Date.now()
  const totalMinutes = Math.round((endTime - startTime) / 60000)
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60
  
  console.log('\n' + '='.repeat(80))
  console.log('✅ COMPLETE!')
  console.log('='.repeat(80))
  console.log(`\n⏱️  Time: ${totalHours}h ${remainingMinutes}m`)
  console.log(`📊 Processed: ${totalProcessed.toLocaleString()} embeddings`)
  console.log(`⚡ Avg rate: ${Math.round(totalProcessed / totalMinutes)}/min`)
  console.log('\n')
}

generateParallel().catch(error => {
  console.error('\n❌ Error:', error.message)
  process.exit(1)
})
