// MotoMindAI: Production-Safe Database Layer
// Connection-safe tenant scoping with RLS

import { Pool, PoolClient } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DATABASE_POOL_MAX || '40'),
  min: parseInt(process.env.DATABASE_POOL_MIN || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: false,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
})

export interface TenantContext {
  tenantId: string
  userId?: string
}

export class DatabaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class TenantIsolationError extends DatabaseError {
  constructor(tenantId: string) {
    super(`Tenant isolation violation: ${tenantId}`)
    this.name = 'TenantIsolationError'
  }
}

// Connection-safe tenant scoping with SET LOCAL
export async function withTenantTransaction<T>(
  context: TenantContext,
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    // Set tenant context with SET LOCAL (transaction-scoped, pool-safe)
    await client.query('SET LOCAL app.tenant_id = $1', [context.tenantId])
    
    if (context.userId) {
      await client.query('SET LOCAL app.user_id = $1', [context.userId])
    }
    
    const result = await operation(client)
    
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    
    if (error instanceof Error) {
      throw new DatabaseError(`Transaction failed: ${error.message}`, error)
    }
    throw error
  } finally {
    client.release()
  }
}

// Usage counter helper (prevents hot row contention)
export async function incrementUsage(
  client: PoolClient,
  tenantId: string,
  type: 'explanations' | 'pdf_exports',
  count: number = 1,
  tokens?: { in?: number; out?: number }
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  
  await client.query(`
    INSERT INTO usage_counters (tenant_id, day, ${type}_count, tokens_in, tokens_out)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (tenant_id, day)
    DO UPDATE SET
      ${type}_count = usage_counters.${type}_count + $3,
      tokens_in = usage_counters.tokens_in + $4,
      tokens_out = usage_counters.tokens_out + $5,
      updated_at = now()
  `, [tenantId, today, count, tokens?.in || 0, tokens?.out || 0])
}

// Pool health monitoring
export function getPoolMetrics() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  pool.end(() => {
    console.log('Database pool closed gracefully')
  })
})

export { pool }
