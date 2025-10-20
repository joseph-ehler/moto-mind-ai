/**
 * Generate Embeddings for NHTSA Complaints
 * 
 * Processes all complaints and generates OpenAI embeddings
 * for semantic search / RAG system
 * 
 * Usage:
 *   npm run safety:embed        # Generate all
 *   npm run safety:embed-stats  # Check progress
 */

import 'dotenv/config'
import { getEmbeddingsService } from '../lib/nhtsa/embeddings-service'

const action = process.argv[2] || 'generate'

async function main() {
  const embeddings = getEmbeddingsService()
  
  if (action === 'stats') {
    // Show stats
    console.log('\n📊 Embedding Generation Stats\n')
    console.log('='.repeat(80))
    
    const stats = await embeddings.getStats()
    
    console.log(`\n✅ Total Complaints:     ${stats.total_complaints.toLocaleString()}`)
    console.log(`✅ With Embeddings:      ${stats.with_embeddings.toLocaleString()}`)
    console.log(`⏱️  Without Embeddings:   ${stats.without_embeddings.toLocaleString()}`)
    console.log(`📈 Progress:             ${stats.percentage_complete}%`)
    
    if (stats.oldest_embedding) {
      console.log(`\n📅 Oldest Embedding:     ${new Date(stats.oldest_embedding).toLocaleString()}`)
    }
    if (stats.newest_embedding) {
      console.log(`📅 Newest Embedding:     ${new Date(stats.newest_embedding).toLocaleString()}`)
    }
    
    console.log('\n')
    
  } else if (action === 'generate') {
    // Generate embeddings
    console.log('\n🚀 NHTSA EMBEDDING GENERATION\n')
    console.log('='.repeat(80))
    console.log('\n📊 Model: text-embedding-3-small')
    console.log('⚡ Batch Size: 100')
    console.log('⏱️  Rate Limit: 3000 RPM\n')
    
    // Get initial stats
    const initialStats = await embeddings.getStats()
    console.log(`📋 Total: ${initialStats.total_complaints.toLocaleString()} complaints`)
    console.log(`✅ Complete: ${initialStats.with_embeddings.toLocaleString()} (${initialStats.percentage_complete}%)`)
    console.log(`⏱️  Remaining: ${initialStats.without_embeddings.toLocaleString()}\n`)
    
    if (initialStats.without_embeddings === 0) {
      console.log('✅ All embeddings already generated!\n')
      return
    }
    
    // Estimate
    const estimatedMinutes = Math.ceil(initialStats.without_embeddings / 100 * 2) // ~2 min per 100
    console.log(`⏱️  Estimated time: ~${estimatedMinutes} minutes\n`)
    
    const startTime = Date.now()
    
    // Process all
    await embeddings.processAll((stats) => {
      const elapsed = Date.now() - startTime
      const rate = stats.with_embeddings / (elapsed / 60000) // per minute
      console.log(`   ⚡ Rate: ${Math.round(rate)}/min`)
    })
    
    // Final stats
    const endTime = Date.now()
    const totalMinutes = Math.round((endTime - startTime) / 60000)
    
    console.log('\n' + '='.repeat(80))
    console.log('✅ EMBEDDING GENERATION COMPLETE!')
    console.log('='.repeat(80))
    console.log(`\n⏱️  Total time: ${totalMinutes} minutes`)
    console.log('\n💡 Next steps:')
    console.log('   1. Test semantic search: npm run safety:test-rag')
    console.log('   2. Try "Ask My Car" UI component')
    console.log('   3. Refresh materialized views if needed\n')
    
  } else if (action === 'test') {
    // Test search
    console.log('\n🔍 Testing Semantic Search\n')
    console.log('='.repeat(80))
    
    const testQueries = [
      'car stalls at highway speed',
      'steering wheel shakes',
      'engine catches fire',
      'airbag didnt deploy in crash'
    ]
    
    for (const query of testQueries) {
      console.log(`\n❓ Query: "${query}"`)
      
      const results = await embeddings.searchSimilar(query, {
        limit: 3,
        threshold: 0.7
      })
      
      console.log(`   Found ${results.length} similar complaints:`)
      
      for (const r of results) {
        console.log(`   - ${r.year} ${r.make} ${r.model} (${Math.round(r.similarity * 100)}% match)`)
        console.log(`     ${r.component}: ${r.summary.substring(0, 80)}...`)
      }
    }
    
    console.log('\n')
    
  } else {
    console.log('❌ Unknown action:', action)
    console.log('   Usage: npm run safety:embed [generate|stats|test]')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('\n❌ Error:', error.message)
  process.exit(1)
})
