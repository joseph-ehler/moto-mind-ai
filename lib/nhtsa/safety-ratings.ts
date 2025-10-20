/**
 * NHTSA 5-Star Safety Ratings (NCAP) - REAL API
 * 
 * https://api.nhtsa.gov/SafetyRatings
 */

export interface SafetyRating {
  vehicleId: number
  make: string
  model: string
  modelYear: number
  vehicleDescription: string
  overallRating: number // 0-5 stars
  overallFrontCrashRating: number
  frontCrashDriversideRating: number
  frontCrashPassengersideRating: number
  overallSideCrashRating: number
  sideCrashDriversideRating: number
  sideCrashPassengersideRating: number
  rolloverRating: number
  rolloverRating2: number
}

export interface SafetyRatingSummary {
  overallRating: number
  ratings: SafetyRating[]
  hasRatings: boolean
}

export class NHTSASafetyRatings {
  private baseUrl = 'https://api.nhtsa.gov/SafetyRatings'
  
  /**
   * Get safety ratings for a vehicle
   */
  async getRatingsByVehicle(params: {
    make: string
    model: string
    year: number
  }): Promise<SafetyRating[]> {
    try {
      // Step 1: Get vehicle IDs for this make/model/year
      const url = `${this.baseUrl}/modelyear/${params.year}/make/${encodeURIComponent(params.make)}/model/${encodeURIComponent(params.model)}`
      
      console.log('[NHTSA Safety Ratings] Fetching:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.warn('[NHTSA Safety Ratings] API returned:', response.status)
        return []
      }
      
      const data = await response.json()
      const results = data.Results || []
      
      if (results.length === 0) {
        return []
      }
      
      // Step 2: Get detailed ratings for each vehicle ID
      const ratings = await Promise.all(
        results.slice(0, 3).map((vehicle: any) => // Limit to 3 to avoid too many requests
          this.getRatingByVehicleId(vehicle.VehicleId)
        )
      )
      
      return ratings.filter(r => r !== null) as SafetyRating[]
      
    } catch (error) {
      console.error('[NHTSA Safety Ratings] API error:', error)
      return []
    }
  }
  
  /**
   * Get detailed rating by vehicle ID
   */
  private async getRatingByVehicleId(vehicleId: number): Promise<SafetyRating | null> {
    try {
      const url = `${this.baseUrl}/VehicleId/${vehicleId}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      const result = data.Results?.[0]
      
      if (!result) {
        return null
      }
      
      return {
        vehicleId: result.VehicleId || vehicleId,
        make: result.Make || '',
        model: result.Model || '',
        modelYear: parseInt(result.ModelYear) || 0,
        vehicleDescription: result.VehicleDescription || '',
        overallRating: parseInt(result.OverallRating) || 0,
        overallFrontCrashRating: parseInt(result.OverallFrontCrashRating) || 0,
        frontCrashDriversideRating: parseInt(result.FrontCrashDriversideRating) || 0,
        frontCrashPassengersideRating: parseInt(result.FrontCrashPassengersideRating) || 0,
        overallSideCrashRating: parseInt(result.OverallSideCrashRating) || 0,
        sideCrashDriversideRating: parseInt(result.SideCrashDriversideRating) || 0,
        sideCrashPassengersideRating: parseInt(result.SideCrashPassengersideRating) || 0,
        rolloverRating: parseInt(result.RolloverRating) || 0,
        rolloverRating2: parseInt(result.RolloverRating2) || 0
      }
      
    } catch (error) {
      console.error('[NHTSA Safety Ratings] Vehicle ID fetch error:', error)
      return null
    }
  }
  
  /**
   * Analyze and summarize ratings
   */
  analyzeSummary(ratings: SafetyRating[]): SafetyRatingSummary {
    if (ratings.length === 0) {
      return {
        overallRating: 0,
        ratings: [],
        hasRatings: false
      }
    }
    
    // Get the best overall rating
    const overallRating = Math.max(...ratings.map(r => r.overallRating))
    
    return {
      overallRating,
      ratings,
      hasRatings: true
    }
  }
}

/**
 * Convenience export
 */
export async function getVehicleSafetyRatings(params: {
  make: string
  model: string
  year: number
}): Promise<SafetyRatingSummary> {
  const service = new NHTSASafetyRatings()
  const ratings = await service.getRatingsByVehicle(params)
  return service.analyzeSummary(ratings)
}
