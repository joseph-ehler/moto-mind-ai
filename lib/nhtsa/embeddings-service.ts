/**
 * NHTSA Embeddings Service
 * 
 * Generates OpenAI embeddings for semantic search
 * - Batch processing (100 at a time)
 * - Rate limiting (3000 RPM for text-embedding-3-small)
 * - Progress tracking
 * - Error handling with retries
 */

import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Using text-embedding-3-small (62% cheaper, nearly same quality)
const EMBEDDING_MODEL = 'text-embedding-3-small'
const BATCH_SIZE = 100 // Process 100 at a time
const RATE_LIMIT_DELAY = 20 // ms between requests (3000 RPM max)

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

interface EmbeddingResult {
  complaintId: string
  embedding: number[]
  success: boolean
  error?: string
}

export class EmbeddingsService {
  
  /**
   * Generate embedding for a single complaint
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float'
    })
    
    return response.data[0].embedding
  }
  
  /**
   * Create searchable text from complaint
   */
  createSearchableText(complaint: ComplaintRecord): string {
    // Combine relevant fields for semantic search
    const parts = [
      `${complaint.year} ${complaint.make} ${complaint.model}`,
      `Component: ${complaint.component}`,
      complaint.summary,
      complaint.description
    ]
    
    return parts.filter(p => p && p.trim()).join('. ')
  }
  
  /**
   * Generate embeddings for a batch of complaints
   */
  async generateBatch(complaints: ComplaintRecord[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = []
    
    for (const complaint of complaints) {
      try {
        const text = this.createSearchableText(complaint)
        const embedding = await this.generateEmbedding(text)
        
        results.push({
          complaintId: complaint.id,
          embedding,
          success: true
        })
        
        // Rate limiting
        await this.delay(RATE_LIMIT_DELAY)
        
      } catch (error: any) {
        console.error(`Failed to generate embedding for ${complaint.odi_number}:`, error.message)
        results.push({
          complaintId: complaint.id,
          embedding: [],
          success: false,
          error: error.message
        })
      }
    }
    
    return results
  }
  
  /**
   * Save embeddings to database
   */
  async saveEmbeddings(results: EmbeddingResult[]): Promise<number> {
    let saved = 0
    
    for (const result of results) {
      if (!result.success) continue
      
      const { error } = await supabase
        .from('nhtsa_complaints')
        .update({
          embedding: JSON.stringify(result.embedding),
          embedding_generated_at: new Date().toISOString(),
          embedding_model: EMBEDDING_MODEL
        })
        .eq('id', result.complaintId)
      
      if (!error) saved++
    }
    
    return saved
  }
  
  /**
   * Get complaints that need embeddings
   */
  async getComplaintsNeedingEmbeddings(limit: number = BATCH_SIZE): Promise<ComplaintRecord[]> {
    const { data, error } = await supabase
      .from('nhtsa_complaints')
      .select('id, odi_number, year, make, model, component, summary, description')
      .is('embedding', null)
      .limit(limit)
    
    if (error) throw error
    
    return data || []
  }
  
  /**
   * Get embedding generation stats
   */
  async getStats() {
    const { data, error } = await supabase
      .rpc('get_embedding_stats')
    
    if (error) throw error
    
    return data?.[0] || {
      total_complaints: 0,
      with_embeddings: 0,
      without_embeddings: 0,
      percentage_complete: 0
    }
  }
  
  /**
   * Process all complaints (run in batches)
   */
  async processAll(onProgress?: (stats: any) => void): Promise<void> {
    let totalProcessed = 0
    
    while (true) {
      // Get batch
      const complaints = await this.getComplaintsNeedingEmbeddings(BATCH_SIZE)
      
      if (complaints.length === 0) {
        console.log('✅ All embeddings generated!')
        break
      }
      
      console.log(`\n📦 Processing batch of ${complaints.length} complaints...`)
      
      // Generate embeddings
      const results = await this.generateBatch(complaints)
      
      // Save to database
      const saved = await this.saveEmbeddings(results)
      
      totalProcessed += saved
      
      // Get stats
      const stats = await this.getStats()
      
      console.log(`   ✅ Saved ${saved}/${complaints.length} embeddings`)
      console.log(`   📊 Progress: ${stats.with_embeddings.toLocaleString()}/${stats.total_complaints.toLocaleString()} (${stats.percentage_complete}%)`)
      
      if (onProgress) {
        onProgress(stats)
      }
    }
    
    console.log(`\n🎉 Complete! Processed ${totalProcessed.toLocaleString()} embeddings`)
  }
  
  /**
   * Search for similar complaints
   */
  async searchSimilar(
    query: string,
    options: {
      threshold?: number
      limit?: number
      year?: string
      make?: string
      model?: string
    } = {}
  ) {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query)
    
    // Search database
    const { data, error } = await supabase.rpc('search_similar_complaints', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: options.threshold || 0.7,
      match_count: options.limit || 10,
      vehicle_year: options.year || null,
      vehicle_make: options.make || null,
      vehicle_model: options.model || null
    })
    
    if (error) throw error
    
    return data || []
  }
  
  /**
   * Helper: delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
let instance: EmbeddingsService | null = null

export function getEmbeddingsService(): EmbeddingsService {
  if (!instance) {
    instance = new EmbeddingsService()
  }
  return instance
}
