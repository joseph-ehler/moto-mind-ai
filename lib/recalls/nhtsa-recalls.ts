/**
 * NHTSA Recalls Integration
 * 
 * Free API for checking vehicle recalls
 * https://one.nhtsa.gov/webapi/api/Recalls/vehicle/{vin}?format=json
 * Alternative: https://api.nhtsa.gov/products/vehicle/recalls?vin={vin}
 */

export interface NHTSARecall {
  Manufacturer: string
  NHTSACampaignNumber: string
  ReportReceivedDate: string
  Component: string
  Summary: string
  Consequence: string
  Remedy: string
  Notes: string
}

export interface RecallCheckResult {
  success: boolean
  vin: string
  recalls: NHTSARecall[]
  hasOpenRecalls: boolean
  recallCount: number
  lastChecked: Date
  error?: string
}

/**
 * Check NHTSA for recalls by VIN
 */
export async function checkRecalls(vin: string): Promise<RecallCheckResult> {
  try {
    console.log(`[NHTSA/Recalls] Checking recalls for VIN: ${vin}`)
    
    // Try primary endpoint (SaferCar API) with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(
      `https://one.nhtsa.gov/webapi/api/Recalls/vehicle/${vin}?format=json`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MotoMind/1.0 (contact@motomind.ai)',
        },
        signal: controller.signal,
      }
    )
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }

    const data = await response.json()
    
    console.log(`[NHTSA/Recalls] API Response status: ${response.status}`)

    // SaferCar API returns data.Results array
    const recalls: NHTSARecall[] = data.Results || data.results || []
    
    console.log(`[NHTSA/Recalls] Found ${recalls.length} recalls`)

    return {
      success: true,
      vin,
      recalls,
      hasOpenRecalls: recalls.length > 0,
      recallCount: recalls.length,
      lastChecked: new Date(),
    }
  } catch (error) {
    console.error('[NHTSA/Recalls] Error checking recalls:', error)
    
    // Check if it was a timeout
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[NHTSA/Recalls] Request timed out after 10 seconds')
    }
    
    return {
      success: false,
      vin,
      recalls: [],
      hasOpenRecalls: false,
      recallCount: 0,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get summary of most critical recalls
 */
export function getCriticalRecalls(recalls: NHTSARecall[]): NHTSARecall[] {
  // Filter for safety-critical components
  const criticalComponents = [
    'air bags',
    'brakes',
    'steering',
    'suspension',
    'fuel system',
    'seat belts',
  ]

  return recalls.filter((recall) => {
    const component = recall.Component?.toLowerCase() || ''
    return criticalComponents.some((critical) => component.includes(critical))
  })
}

/**
 * Format recall for display
 */
export function formatRecall(recall: NHTSARecall): {
  title: string
  description: string
  severity: 'critical' | 'important' | 'normal'
} {
  const component = recall.Component || 'Unknown component'
  const criticalRecalls = getCriticalRecalls([recall])
  
  return {
    title: `${component} Recall`,
    description: recall.Summary || 'No summary available',
    severity: criticalRecalls.length > 0 ? 'critical' : 'important',
  }
}
