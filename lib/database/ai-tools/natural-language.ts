/**
 * Natural Language Query Interface
 * 
 * Translates natural language queries into SQL using AI.
 * 
 * Examples:
 * - "Show me vehicles from last week"
 * - "How many trips were logged in December?"
 * - "Which users haven't logged a trip in 30 days?"
 */

import { QueryExecutor } from '../core/query-executor'
import { SchemaContextProvider } from './schema-context'
import { QueryResult } from '../core/types'

export interface NaturalLanguageQuery {
  prompt: string
  generatedSql: string
  confidence: number
  explanation: string
  warnings: string[]
}

export interface NaturalLanguageQueryOptions {
  dryRun?: boolean
  explain?: boolean
  maxRows?: number
}

export class NaturalLanguageQueryInterface {
  private schemaContext: string | null = null
  
  constructor(
    private queryExecutor: QueryExecutor,
    private schemaProvider: SchemaContextProvider
  ) {}
  
  /**
   * Execute a natural language query
   */
  async query<T = any>(
    prompt: string,
    options?: NaturalLanguageQueryOptions
  ): Promise<QueryResult<T> & { nlQuery: NaturalLanguageQuery }> {
    const opts = {
      dryRun: options?.dryRun ?? false,
      explain: options?.explain ?? false,
      maxRows: options?.maxRows ?? 1000
    }
    
    // Generate SQL from natural language
    const nlQuery = await this.generateSQL(prompt, opts.maxRows)
    
    // Show generated SQL for transparency
    console.log('Generated SQL:', nlQuery.generatedSql)
    
    if (nlQuery.warnings.length > 0) {
      console.warn('Warnings:', nlQuery.warnings)
    }
    
    // Execute the generated SQL
    const result = await this.queryExecutor.execute<T>(
      nlQuery.generatedSql,
      {
        dryRun: opts.dryRun,
        explain: opts.explain,
        readOnly: true
      }
    )
    
    return {
      ...result,
      nlQuery
    }
  }
  
  /**
   * Generate SQL from natural language prompt
   */
  private async generateSQL(
    prompt: string,
    maxRows: number
  ): Promise<NaturalLanguageQuery> {
    // Get schema context (cached)
    if (!this.schemaContext) {
      const context = await this.schemaProvider.generateContext({
        includeExamples: true,
        includeStats: false
      })
      this.schemaContext = this.schemaProvider.generateAIContext(context)
    }
    
    // Build system prompt
    const systemPrompt = `You are a PostgreSQL expert. Generate safe, efficient SQL queries from natural language.

${this.schemaContext}

CRITICAL RULES:
1. Always include LIMIT clause (default: ${maxRows})
2. Use parameterized queries when possible
3. Never generate DELETE, DROP, TRUNCATE, or UPDATE without WHERE
4. Prefer JOINs over subqueries for performance
5. Use appropriate indexes (see schema above)
6. Return only valid PostgreSQL syntax
7. Include helpful comments in the SQL

Response Format (JSON):
{
  "sql": "SELECT ...",
  "confidence": 0.95,
  "explanation": "This query retrieves...",
  "warnings": []
}

If the query is ambiguous or risky, include warnings.`
    
    // Call OpenAI (or compatible API)
    const response = await this.callAI(systemPrompt, prompt)
    
    return response
  }
  
  /**
   * Call AI service (OpenAI compatible)
   */
  private async callAI(
    systemPrompt: string,
    userPrompt: string
  ): Promise<NaturalLanguageQuery> {
    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      // Fallback: Use simple pattern matching (not AI)
      return this.fallbackGenerate(userPrompt)
    }
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0,
          response_format: { type: 'json_object' }
        })
      })
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }
      
      const data = await response.json()
      const content = data.choices[0].message.content
      const parsed = JSON.parse(content)
      
      return {
        prompt: userPrompt,
        generatedSql: parsed.sql,
        confidence: parsed.confidence || 0.8,
        explanation: parsed.explanation || '',
        warnings: parsed.warnings || []
      }
    } catch (error) {
      console.warn('AI call failed, using fallback:', error)
      return this.fallbackGenerate(userPrompt)
    }
  }
  
  /**
   * Fallback SQL generation without AI
   * Uses simple pattern matching
   */
  private fallbackGenerate(prompt: string): NaturalLanguageQuery {
    const lower = prompt.toLowerCase()
    let sql = ''
    const warnings: string[] = []
    
    // Pattern: "show me vehicles from last week"
    if (lower.includes('vehicles') && lower.includes('last week')) {
      sql = `SELECT * FROM vehicles WHERE created_at >= NOW() - INTERVAL '7 days' ORDER BY created_at DESC LIMIT 100`
    }
    // Pattern: "how many trips"
    else if (lower.includes('how many trips')) {
      sql = `SELECT COUNT(*) as count FROM trips WHERE status = 'finalized'`
    }
    // Pattern: "recent trips"
    else if (lower.includes('recent trips') || lower.includes('latest trips')) {
      sql = `SELECT * FROM trips WHERE status = 'finalized' ORDER BY started_at DESC LIMIT 100`
    }
    // Pattern: "users without trips"
    else if (lower.includes('users') && (lower.includes('without') || lower.includes('no trips'))) {
      sql = `SELECT DISTINCT user_id FROM vehicles v WHERE NOT EXISTS (SELECT 1 FROM trips t WHERE t.vehicle_id = v.id) LIMIT 100`
    }
    // Default: list tables
    else {
      sql = `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
      warnings.push('Could not interpret query. Listing all tables instead.')
      warnings.push('Try: "show me vehicles from last week" or "how many trips"')
    }
    
    return {
      prompt,
      generatedSql: sql,
      confidence: 0.5,
      explanation: 'Generated using fallback pattern matching (OpenAI API key not configured)',
      warnings
    }
  }
  
  /**
   * Suggest query improvements
   */
  async suggestImprovements(sql: string): Promise<{
    suggestions: string[]
    optimizedSql?: string
  }> {
    const suggestions: string[] = []
    let optimizedSql: string | undefined
    
    // Check for SELECT *
    if (sql.includes('SELECT *')) {
      suggestions.push('Specify columns instead of SELECT * for better performance')
    }
    
    // Check for missing LIMIT
    if (sql.toUpperCase().includes('SELECT') && !sql.toUpperCase().includes('LIMIT')) {
      suggestions.push('Add LIMIT clause to prevent large result sets')
      optimizedSql = sql + ' LIMIT 1000'
    }
    
    // Check for missing indexes
    if (sql.includes('WHERE') && !sql.includes('INDEX')) {
      suggestions.push('Consider adding indexes on WHERE clause columns')
    }
    
    // Check for N+1 queries
    if (sql.includes('SELECT') && sql.includes('IN (SELECT')) {
      suggestions.push('Consider using JOIN instead of subquery in IN clause')
    }
    
    return {
      suggestions,
      optimizedSql
    }
  }
  
  /**
   * Validate generated SQL
   */
  async validateSQL(sql: string): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Check for destructive operations
    const destructive = ['DELETE', 'DROP', 'TRUNCATE', 'UPDATE', 'INSERT', 'ALTER']
    for (const keyword of destructive) {
      if (sql.toUpperCase().includes(keyword)) {
        errors.push(`Destructive operation detected: ${keyword}`)
      }
    }
    
    // Check syntax by running EXPLAIN
    try {
      await this.queryExecutor.execute(`EXPLAIN ${sql}`, { readOnly: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Syntax error: ${message}`)
    }
    
    // Check for SELECT *
    if (sql.includes('SELECT *')) {
      warnings.push('Using SELECT * is not recommended')
    }
    
    // Check for missing LIMIT
    if (sql.toUpperCase().includes('SELECT') && !sql.toUpperCase().includes('LIMIT')) {
      warnings.push('Missing LIMIT clause')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Get query suggestions based on partial input
   */
  async getSuggestions(partialQuery: string): Promise<string[]> {
    const suggestions: string[] = []
    const lower = partialQuery.toLowerCase()
    
    // Common query patterns
    if (lower.includes('show') || lower.includes('get') || lower.includes('list')) {
      suggestions.push('Show me vehicles from last week')
      suggestions.push('Get all trips for vehicle ID')
      suggestions.push('List recent crash events')
    }
    
    if (lower.includes('how many') || lower.includes('count')) {
      suggestions.push('How many vehicles are registered?')
      suggestions.push('How many trips were logged in December?')
      suggestions.push('Count vehicles by make')
    }
    
    if (lower.includes('which') || lower.includes('find')) {
      suggestions.push('Which users haven\'t logged a trip in 30 days?')
      suggestions.push('Find vehicles with no maintenance records')
      suggestions.push('Which trips have crash events?')
    }
    
    if (lower.includes('average') || lower.includes('avg')) {
      suggestions.push('Average trip duration')
      suggestions.push('Average speed per vehicle')
    }
    
    return suggestions
  }
}
