/**
 * Database Error Handler
 * 
 * Converts cryptic Postgres/PostgREST errors into actionable messages with fixes
 * 
 * Example:
 *   throw new DatabaseError('42P01', { message: 'relation "foo" does not exist' })
 *   // Output:
 *   // ❌ Undefined table
 *   // 💡 Fix: Create the table or check schema/namespace (search_path).
 */

export interface ErrorAdvice {
  title: string
  fix?: string
  docs?: string
}

/**
 * Postgres error code to human-readable advice mapping
 * See: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const PG_ERROR_MAP: Record<string, ErrorAdvice> = {
  // Class 23 - Integrity Constraint Violation
  '23505': {
    title: 'Unique violation',
    fix: 'Check existing data or add ON CONFLICT handling for backfills.',
    docs: 'https://www.postgresql.org/docs/current/ddl-constraints.html'
  },
  '23503': {
    title: 'Foreign key violation',
    fix: 'Ensure referenced row exists or add CASCADE to foreign key.',
    docs: 'https://www.postgresql.org/docs/current/ddl-constraints.html'
  },
  '23502': {
    title: 'Not-null violation',
    fix: 'Provide a value or add DEFAULT to column definition.',
    docs: 'https://www.postgresql.org/docs/current/ddl-constraints.html'
  },
  
  // Class 42 - Syntax Error or Access Rule Violation
  '42P01': {
    title: 'Undefined table',
    fix: 'Create the table or check schema/namespace (search_path).',
    docs: 'https://www.postgresql.org/docs/current/ddl-schemas.html'
  },
  '42703': {
    title: 'Undefined column',
    fix: 'Check column name spelling or migration order.',
    docs: 'https://www.postgresql.org/docs/current/ddl-basics.html'
  },
  '42601': {
    title: 'Syntax error',
    fix: 'Review SQL syntax. Common issues: missing commas, reserved words, unquoted identifiers.',
    docs: 'https://www.postgresql.org/docs/current/sql-syntax.html'
  },
  '42P07': {
    title: 'Duplicate table',
    fix: 'Table already exists. Use CREATE TABLE IF NOT EXISTS or DROP TABLE first.',
    docs: 'https://www.postgresql.org/docs/current/sql-createtable.html'
  },
  '42701': {
    title: 'Duplicate column',
    fix: 'Column already exists. Check migration order or use ALTER TABLE ADD COLUMN IF NOT EXISTS.',
    docs: 'https://www.postgresql.org/docs/current/sql-altertable.html'
  },
  '42704': {
    title: 'Undefined object',
    fix: 'Database object (function, type, operator) does not exist. Check dependencies.',
    docs: 'https://www.postgresql.org/docs/current/extend.html'
  },
  '42P18': {
    title: 'Indeterminate datatype',
    fix: 'Add explicit type cast. Example: NULL::text or $1::integer.',
    docs: 'https://www.postgresql.org/docs/current/typeconv.html'
  },
  '42846': {
    title: 'Cannot coerce',
    fix: 'Type mismatch. Add explicit cast or change column type.',
    docs: 'https://www.postgresql.org/docs/current/typeconv.html'
  },
  
  // Class 53 - Insufficient Resources
  '53000': {
    title: 'Insufficient resources',
    fix: 'Database is out of memory or connections. Scale up or reduce load.',
    docs: 'https://www.postgresql.org/docs/current/runtime-config-resource.html'
  },
  '53200': {
    title: 'Out of memory',
    fix: 'Query requires too much memory. Reduce batch size or add more RAM.',
    docs: 'https://www.postgresql.org/docs/current/runtime-config-resource.html'
  },
  '53300': {
    title: 'Too many connections',
    fix: 'Connection pool exhausted. Increase max_connections or use connection pooler.',
    docs: 'https://www.postgresql.org/docs/current/runtime-config-connection.html'
  },
  
  // Class 08 - Connection Exception
  '08000': {
    title: 'Connection exception',
    fix: 'Cannot connect to database. Check DATABASE_URL and network.',
    docs: 'https://www.postgresql.org/docs/current/libpq-connect.html'
  },
  '08003': {
    title: 'Connection does not exist',
    fix: 'Connection was closed. Retry with new connection.',
    docs: 'https://www.postgresql.org/docs/current/libpq-connect.html'
  },
  '08006': {
    title: 'Connection failure',
    fix: 'Connection lost during operation. Check network stability.',
    docs: 'https://www.postgresql.org/docs/current/libpq-connect.html'
  },
  
  // PostgREST specific errors
  'PGRST204': {
    title: 'No rows returned',
    fix: 'Query returned empty result. This is often expected, not an error.',
  },
  'PGRST205': {
    title: 'Table not in schema cache',
    fix: 'PostgREST cannot see the table. Check RLS policies or reload schema cache.',
    docs: 'https://postgrest.org/en/stable/api.html#table-not-in-schema-cache'
  },
  'PGRST202': {
    title: 'Function not found',
    fix: 'RPC function does not exist. Create the function or check spelling.',
    docs: 'https://postgrest.org/en/stable/api.html#stored-procedures'
  },
  'PGRST301': {
    title: 'Authentication required',
    fix: 'Request requires authentication. Add Bearer token or service role key.',
    docs: 'https://postgrest.org/en/stable/auth.html'
  },
  'PGRST116': {
    title: 'Invalid JWT',
    fix: 'JWT token is invalid or expired. Refresh authentication.',
    docs: 'https://postgrest.org/en/stable/auth.html'
  },
  
  // Common application errors
  'ECONNREFUSED': {
    title: 'Connection refused',
    fix: 'Cannot reach database server. Check DATABASE_URL and firewall rules.',
  },
  'ENOTFOUND': {
    title: 'Host not found',
    fix: 'Database host does not exist. Check DATABASE_URL hostname.',
  },
  'ETIMEDOUT': {
    title: 'Connection timeout',
    fix: 'Database did not respond in time. Check network or increase timeout.',
  },
}

/**
 * Enhanced database error with actionable advice
 */
export class DatabaseError extends Error {
  public code: string
  public rawError: any
  public advice?: ErrorAdvice

  constructor(code: string, rawError: any) {
    const advice = PG_ERROR_MAP[code]
    super(advice?.title || rawError?.message || 'Database error')
    
    this.name = 'DatabaseError'
    this.code = code
    this.rawError = rawError
    this.advice = advice
    
    // Preserve stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError)
    }
  }

  /**
   * Format error with advice for CLI output
   */
  toFormattedString(): string {
    const parts: string[] = [`❌ ${this.message}`]
    
    if (this.advice?.fix) {
      parts.push(`💡 Fix: ${this.advice.fix}`)
    }
    
    if (this.advice?.docs) {
      parts.push(`📘 Docs: ${this.advice.docs}`)
    }
    
    // Add SQL context if available
    if (this.rawError?.sql) {
      const sql = this.rawError.sql.substring(0, 200)
      parts.push(`🔍 SQL: ${sql}${this.rawError.sql.length > 200 ? '...' : ''}`)
    }
    
    return parts.join('\n')
  }

  /**
   * Convert to plain object for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      advice: this.advice,
      sql: this.rawError?.sql,
      detail: this.rawError?.detail,
      hint: this.rawError?.hint,
      stack: this.stack
    }
  }
}

/**
 * Extract error code from various error types
 */
export function extractErrorCode(error: any): string {
  return (
    error.code ||
    error.details?.code ||
    error.name ||
    'UNKNOWN'
  )
}

/**
 * Create DatabaseError from any error type
 */
export function toDatabaseError(error: any): DatabaseError {
  if (error instanceof DatabaseError) {
    return error
  }
  
  const code = extractErrorCode(error)
  return new DatabaseError(code, error)
}

/**
 * Format any error for CLI output
 */
export function formatErrorForCLI(error: any): string {
  const dbError = toDatabaseError(error)
  return dbError.toFormattedString()
}
