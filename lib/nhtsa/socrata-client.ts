/**
 * Socrata Open Data Client
 * 
 * Access DOT/NHTSA data via open data portal
 * https://data.transportation.gov/
 */

export interface SocrataQueryOptions {
  where?: string
  select?: string
  order?: string
  limit?: number
  offset?: number
}

export class SocrataClient {
  private baseUrl = 'https://data.transportation.gov/resource'
  private appToken?: string // Optional - for higher rate limits
  
  constructor(appToken?: string) {
    this.appToken = appToken
  }
  
  /**
   * Query a Socrata dataset
   */
  async query<T = any>(
    datasetId: string,
    options: SocrataQueryOptions = {}
  ): Promise<T[]> {
    const params = new URLSearchParams()
    
    // Add query parameters
    if (options.where) {
      params.append('$where', options.where)
    }
    if (options.select) {
      params.append('$select', options.select)
    }
    if (options.order) {
      params.append('$order', options.order)
    }
    if (options.limit) {
      params.append('$limit', String(options.limit))
    }
    if (options.offset) {
      params.append('$offset', String(options.offset))
    }
    
    const url = `${this.baseUrl}/${datasetId}.json?${params.toString()}`
    
    console.log('[Socrata] Querying:', url)
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (this.appToken) {
      headers['X-App-Token'] = this.appToken
    }
    
    try {
      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        console.warn('[Socrata] API returned:', response.status)
        return []
      }
      
      const data = await response.json()
      
      // Socrata always returns an array
      return Array.isArray(data) ? data : []
      
    } catch (error) {
      console.error('[Socrata] Query error:', error)
      return []
    }
  }
  
  /**
   * Build WHERE clause for vehicle queries
   */
  buildVehicleWhere(params: {
    year: number
    make: string
    model: string
    yearField?: string
    makeField?: string
    modelField?: string
  }): string {
    const {
      year,
      make,
      model,
      yearField = 'yeartxt',
      makeField = 'maketxt',
      modelField = 'modeltxt'
    } = params
    
    // Socrata uses SQL-like WHERE clauses
    // Field names vary by dataset
    const conditions = [
      `${yearField}='${year}'`,
      `UPPER(${makeField})='${make.toUpperCase()}'`,
      `UPPER(${modelField})='${model.toUpperCase()}'`
    ]
    
    return conditions.join(' AND ')
  }
  
  /**
   * Normalize make/model for consistent queries
   */
  normalizeMake(make: string): string {
    return make
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9\s]/g, '') // Remove special chars
  }
  
  normalizeModel(model: string): string {
    return model
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9\s]/g, '') // Remove special chars
  }
}

/**
 * Singleton instance
 */
let socrataClient: SocrataClient | null = null

export function getSocrataClient(): SocrataClient {
  if (!socrataClient) {
    // Optional: Add app token from env for higher rate limits
    const appToken = process.env.SOCRATA_APP_TOKEN
    socrataClient = new SocrataClient(appToken)
  }
  return socrataClient
}
