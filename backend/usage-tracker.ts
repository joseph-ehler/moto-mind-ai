// MotoMindAI: High-Performance Usage Tracking
// Batched updates eliminate database contention

import { pool } from './database'

interface UsageBatch {
  tenantId: string
  day: string
  explanations: number
  pdfExports: number
  tokensIn: number
  tokensOut: number
}

export class UsageTracker {
  private batch = new Map<string, UsageBatch>()
  private flushInterval: NodeJS.Timeout
  private readonly FLUSH_INTERVAL_MS = parseInt(process.env.USAGE_FLUSH_INTERVAL_MS || '30000') // 30 seconds
  private readonly MAX_BATCH_SIZE = parseInt(process.env.USAGE_BATCH_SIZE || '100')
  private isShuttingDown = false
  
  constructor() {
    // Periodic flush every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flush().catch(console.error)
    }, this.FLUSH_INTERVAL_MS)
    
    // Graceful shutdown handlers
    process.on('SIGTERM', this.shutdown.bind(this))
    process.on('SIGINT', this.shutdown.bind(this))
    
    console.log(`📊 Usage tracker initialized - flush every ${this.FLUSH_INTERVAL_MS}ms, batch size ${this.MAX_BATCH_SIZE}`)
  }
  
  track(
    tenantId: string,
    type: 'explanation' | 'pdf_export',
    tokens?: { in: number; out: number }
  ): void {
    if (this.isShuttingDown) return
    
    const today = new Date().toISOString().split('T')[0]
    const key = `${tenantId}:${today}`
    
    const existing = this.batch.get(key) || {
      tenantId,
      day: today,
      explanations: 0,
      pdfExports: 0,
      tokensIn: 0,
      tokensOut: 0
    }
    
    if (type === 'explanation') {
      existing.explanations += 1
    } else {
      existing.pdfExports += 1
    }
    
    if (tokens) {
      existing.tokensIn += tokens.in
      existing.tokensOut += tokens.out
    }
    
    this.batch.set(key, existing)
    
    // Flush immediately if batch gets too large (prevents memory bloat)
    if (this.batch.size >= this.MAX_BATCH_SIZE) {
      console.log(`⚡ Usage batch size limit reached (${this.MAX_BATCH_SIZE}), flushing immediately`)
      setImmediate(() => this.flush().catch(console.error))
    }
  }
  
  private async flush(): Promise<void> {
    if (this.batch.size === 0) return
    
    const entries = Array.from(this.batch.values())
    this.batch.clear()
    
    const startTime = Date.now()
    
    try {
      await this.batchUpsert(entries)
      const duration = Date.now() - startTime
      console.log(`✅ Usage batch flushed: ${entries.length} entries in ${duration}ms`)
    } catch (error) {
      console.error('❌ Usage tracking flush failed:', error)
      
      // Re-add failed entries to batch for retry (with deduplication)
      entries.forEach(entry => {
        const key = `${entry.tenantId}:${entry.day}`
        const existing = this.batch.get(key)
        if (existing) {
          // Merge with existing entry
          existing.explanations += entry.explanations
          existing.pdfExports += entry.pdfExports
          existing.tokensIn += entry.tokensIn
          existing.tokensOut += entry.tokensOut
        } else {
          this.batch.set(key, entry)
        }
      })
    }
  }
  
  private async batchUpsert(entries: UsageBatch[]): Promise<void> {
    if (entries.length === 0) return
    
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      // Use PostgreSQL UNNEST for efficient batch upsert
      const tenantIds = entries.map(e => e.tenantId)
      const days = entries.map(e => e.day)
      const explanations = entries.map(e => e.explanations)
      const pdfExports = entries.map(e => e.pdfExports)
      const tokensIn = entries.map(e => e.tokensIn)
      const tokensOut = entries.map(e => e.tokensOut)
      
      await client.query(`
        INSERT INTO usage_counters (tenant_id, day, explanations_count, pdf_exports_count, tokens_in, tokens_out)
        SELECT * FROM UNNEST($1::uuid[], $2::date[], $3::int[], $4::int[], $5::int[], $6::int[])
        ON CONFLICT (tenant_id, day)
        DO UPDATE SET
          explanations_count = usage_counters.explanations_count + EXCLUDED.explanations_count,
          pdf_exports_count = usage_counters.pdf_exports_count + EXCLUDED.pdf_exports_count,
          tokens_in = usage_counters.tokens_in + EXCLUDED.tokens_in,
          tokens_out = usage_counters.tokens_out + EXCLUDED.tokens_out,
          updated_at = now()
      `, [tenantIds, days, explanations, pdfExports, tokensIn, tokensOut])
      
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
  
  private async shutdown(): Promise<void> {
    if (this.isShuttingDown) return
    
    console.log('🛑 Usage tracker shutting down gracefully...')
    this.isShuttingDown = true
    
    // Clear the interval
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    
    // Final flush of any remaining data
    try {
      await this.flush()
      console.log('✅ Usage tracker shutdown complete')
    } catch (error) {
      console.error('❌ Error during usage tracker shutdown:', error)
    }
  }
  
  // Get current batch status for monitoring
  getBatchStatus() {
    return {
      batchSize: this.batch.size,
      maxBatchSize: this.MAX_BATCH_SIZE,
      flushIntervalMs: this.FLUSH_INTERVAL_MS,
      isShuttingDown: this.isShuttingDown
    }
  }
}

// Global singleton instance
export const usageTracker = new UsageTracker()
