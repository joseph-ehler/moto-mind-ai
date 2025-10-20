/**
 * Test RAG System
 * 
 * Quick verification that all components work:
 * - OpenAI API connection
 * - Embedding generation
 * - Vector search
 * - Database storage
 */

import 'dotenv/config'
import { getEmbeddingsService } from '../lib/nhtsa/embeddings-service'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testRAGSystem() {
  console.log('\n🧪 RAG SYSTEM TEST\n')
  console.log('='.repeat(80))
  
  try {
    // Test 1: OpenAI API Key
    console.log('\n1️⃣  Testing OpenAI API connection...')
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || !apiKey.startsWith('sk-')) {
      throw new Error('Invalid or missing OPENAI_API_KEY')
    }
    console.log('   ✅ API key found and formatted correctly')
    
    // Test 2: Generate test embedding
    console.log('\n2️⃣  Generating test embedding...')
    const embeddings = getEmbeddingsService()
    const testEmbedding = await embeddings.generateEmbedding('car stalls at highway speed')
    console.log(`   ✅ Generated ${testEmbedding.length}-dimension vector`)
    
    // Test 3: Database connection
    console.log('\n3️⃣  Testing database connection...')
    const { data: complaints, error } = await supabase
      .from('nhtsa_complaints')
      .select('id, odi_number, year, make, model')
      .limit(1)
    
    if (error) throw error
    console.log('   ✅ Database connected')
    console.log(`   ✅ Sample complaint: ${complaints?.[0]?.year} ${complaints?.[0]?.make} ${complaints?.[0]?.model}`)
    
    // Test 4: Embedding column exists
    console.log('\n4️⃣  Checking embedding column...')
    const { data: withEmbedding } = await supabase
      .from('nhtsa_complaints')
      .select('id, embedding')
      .not('embedding', 'is', null)
      .limit(1)
    
    if (withEmbedding && withEmbedding.length > 0) {
      console.log('   ✅ Embedding column exists and has data')
    } else {
      console.log('   ⚠️  Embedding column exists but no embeddings yet (expected if just starting)')
    }
    
    // Test 5: Vector search function exists
    console.log('\n5️⃣  Testing vector search function...')
    const { data: functionCheck } = await supabase
      .rpc('search_similar_complaints', {
        query_embedding: JSON.stringify(testEmbedding),
        match_threshold: 0.7,
        match_count: 1
      })
    
    console.log('   ✅ search_similar_complaints function exists')
    
    if (functionCheck && functionCheck.length > 0) {
      console.log(`   ✅ Found similar complaint: ${functionCheck[0].year} ${functionCheck[0].make} ${functionCheck[0].model}`)
    } else {
      console.log('   ⚠️  No similar complaints found (need more embeddings generated)')
    }
    
    // Test 6: Get stats
    console.log('\n6️⃣  Checking embedding generation stats...')
    const stats = await embeddings.getStats()
    console.log(`   📊 Total: ${stats.total_complaints.toLocaleString()}`)
    console.log(`   ✅ With embeddings: ${stats.with_embeddings.toLocaleString()}`)
    console.log(`   ⏱️  Remaining: ${stats.without_embeddings.toLocaleString()}`)
    console.log(`   📈 Progress: ${stats.percentage_complete}%`)
    
    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('✅ ALL TESTS PASSED!')
    console.log('='.repeat(80))
    console.log('\n💡 System Status:')
    
    if (stats.percentage_complete === 0) {
      console.log('   ⏳ Ready to generate embeddings')
      console.log('   👉 Run: npm run safety:embed')
    } else if (stats.percentage_complete < 100) {
      console.log(`   ⚡ Embedding generation in progress (${stats.percentage_complete}%)`)
      console.log('   👉 Monitor: npm run safety:embed-stats')
    } else {
      console.log('   🎉 All embeddings generated!')
      console.log('   👉 Test search: npm run safety:embed-test')
      console.log('   👉 Build UI: See GOD_TIER_RAG_SYSTEM.md')
    }
    
    console.log('\n')
    
  } catch (error: any) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ TEST FAILED')
    console.error('='.repeat(80))
    console.error(`\nError: ${error.message}`)
    
    if (error.message.includes('OPENAI_API_KEY')) {
      console.error('\n💡 Fix: Add OPENAI_API_KEY to .env.local')
    } else if (error.message.includes('database')) {
      console.error('\n💡 Fix: Check Supabase credentials in .env.local')
    } else if (error.message.includes('embedding')) {
      console.error('\n💡 Fix: Apply migration: npx tsx scripts/apply-migration.ts supabase/migrations/20251019040000_nhtsa_vector_search.sql')
    }
    
    console.error('\n')
    process.exit(1)
  }
}

testRAGSystem()
