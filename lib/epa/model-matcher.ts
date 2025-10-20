/**
 * EPA Model Matcher
 * Fuzzy matches NHTSA model names to EPA model names
 */

import { ResilientFetch } from '../utils/resilient-fetch'
import { VINCache } from '../cache/vin-cache'
import { validateEPAMenuResponse } from '../vin/schemas'

interface EPAModelOption {
  text: string
  value: string
}

export class EPAModelMatcher {
  private static baseUrl = 'https://www.fueleconomy.gov/ws/rest'
  
  /**
   * Find best matching EPA model name
   */
  static async findBestMatch(params: {
    year: number
    make: string
    model: string
    driveType?: string | null
    cylinders?: number | null
    displacement?: number | null
  }): Promise<string | null> {
    // Get EPA model list (cached)
    const models = await this.getModelList(params.year, params.make)
    
    if (!models || models.length === 0) {
      console.warn(`[EPA Matcher] No models found for ${params.year} ${params.make}`)
      return null
    }
    
    console.log(`[EPA Matcher] Found ${models.length} models for ${params.year} ${params.make}`)
    
    // Try different matching strategies
    const strategies = [
      () => this.exactMatch(models, params.model),
      () => this.driveTypeMatch(models, params.model, params.driveType),
      () => this.startsWithMatch(models, params.model),
      () => this.containsMatch(models, params.model),
      () => this.fuzzyMatch(models, params.model)
    ]
    
    for (const strategy of strategies) {
      const match = strategy()
      if (match) {
        console.log(`[EPA Matcher] Matched "${params.model}" → "${match}"`)
        return match
      }
    }
    
    // Fallback: use first model
    console.warn(`[EPA Matcher] No match found, using first model: ${models[0].value}`)
    return models[0].value
  }
  
  /**
   * Get model list from EPA API
   */
  private static async getModelList(year: number, make: string): Promise<EPAModelOption[]> {
    const cacheKey = `epa:models:${year}:${make}`
    
    return VINCache.getOrFetch(
      cacheKey,
      async () => {
        const url = `${this.baseUrl}/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`
        
        try {
          const data = await ResilientFetch.fetchJSON(url, {
            headers: { 'Accept': 'application/json' }
          })
          
          const validated = validateEPAMenuResponse(data)
          return validated.menuItem || []
        } catch (error) {
          console.error(`[EPA Matcher] Failed to get model list:`, error)
          return []
        }
      },
      30 * 24 * 60 * 60 * 1000 // Cache for 30 days
    )
  }
  
  /**
   * Strategy 1: Exact match
   */
  private static exactMatch(models: EPAModelOption[], target: string): string | null {
    const match = models.find(m => 
      m.value.toLowerCase() === target.toLowerCase()
    )
    return match?.value || null
  }
  
  /**
   * Strategy 2: Match with drive type
   */
  private static driveTypeMatch(
    models: EPAModelOption[], 
    target: string, 
    driveType?: string | null
  ): string | null {
    if (!driveType) return null
    
    const drive = driveType.toLowerCase()
    const targetLower = target.toLowerCase()
    
    const match = models.find(m => {
      const modelLower = m.value.toLowerCase()
      
      // Must contain target model name
      if (!modelLower.includes(targetLower)) return false
      
      // Match drive type
      if (drive === '4wd' && (modelLower.includes('4wd') || modelLower.includes('4x4'))) return true
      if (drive === 'awd' && modelLower.includes('awd')) return true
      if (drive === 'fwd' && modelLower.includes('fwd')) return true
      if (drive === 'rwd' && modelLower.includes('rwd')) return true
      if (drive === '2wd' && modelLower.includes('2wd')) return true
      
      return false
    })
    
    return match?.value || null
  }
  
  /**
   * Strategy 3: Starts with match
   */
  private static startsWithMatch(models: EPAModelOption[], target: string): string | null {
    const match = models.find(m => 
      m.value.toLowerCase().startsWith(target.toLowerCase())
    )
    return match?.value || null
  }
  
  /**
   * Strategy 4: Contains match
   */
  private static containsMatch(models: EPAModelOption[], target: string): string | null {
    const match = models.find(m => 
      m.value.toLowerCase().includes(target.toLowerCase())
    )
    return match?.value || null
  }
  
  /**
   * Strategy 5: Fuzzy match (Levenshtein distance)
   */
  private static fuzzyMatch(models: EPAModelOption[], target: string): string | null {
    const targetLower = target.toLowerCase()
    
    // Calculate similarity scores
    const scored = models.map(m => ({
      model: m.value,
      score: this.similarity(targetLower, m.value.toLowerCase())
    }))
    
    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score)
    
    // Return if similarity > 0.6 (60%)
    if (scored[0] && scored[0].score > 0.6) {
      return scored[0].model
    }
    
    return null
  }
  
  /**
   * Calculate string similarity (0-1)
   */
  private static similarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshtein(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }
  
  /**
   * Levenshtein distance (edit distance)
   */
  private static levenshtein(s1: string, s2: string): number {
    const matrix: number[][] = []
    
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }
    
    return matrix[s2.length][s1.length]
  }
}
