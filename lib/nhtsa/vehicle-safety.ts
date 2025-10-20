/**
 * Unified Vehicle Safety Service
 * 
 * Combines complaints, TSBs, and investigations into a
 * comprehensive safety profile for any vehicle
 */

import { NHTSAComplaints, ComplaintSummary } from './complaints'
import { NHTSARecalls, RecallSummary } from './recalls'
import { NHTSASafetyRatings, SafetyRatingSummary } from './safety-ratings'

export interface VehicleSafetyData {
  complaints: ComplaintSummary
  recalls: RecallSummary
  safetyRatings: SafetyRatingSummary
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical'
  safetyScore: number // 0-100 (100 = safest)
  keyIssues: string[]
  recommendations: string[]
  // Link-outs for data not available via public API
  linkOuts: {
    tsbs: string // NHTSA TSB search page
    investigations: string // NHTSA investigations search
  }
}

export class VehicleSafetyService {
  private complaints = new NHTSAComplaints()
  private recalls = new NHTSARecalls()
  private safetyRatings = new NHTSASafetyRatings()
  
  /**
   * Get complete safety data for a vehicle
   */
  async getCompleteSafetyData(params: {
    make: string
    model: string
    year: number
  }): Promise<VehicleSafetyData> {
    console.log('[Vehicle Safety] Fetching data for', params)
    
    // Fetch all data in parallel (REAL APIs only)
    const [complaintsData, recallsData, ratingsData] = await Promise.all([
      this.complaints.getComplaintsByVehicle(params),
      this.recalls.getRecallsByVehicle(params),
      this.safetyRatings.getRatingsByVehicle(params)
    ])
    
    console.log('[Vehicle Safety] Received:', {
      complaints: complaintsData.length,
      recalls: recallsData.length,
      ratings: ratingsData.length
    })
    
    // Analyze
    const complaintsSummary = this.complaints.analyzeSummary(complaintsData)
    const recallsSummary = this.recalls.analyzeSummary(recallsData)
    const safetyRatingsSummary = this.safetyRatings.analyzeSummary(ratingsData)
    
    // Calculate overall risk
    const overallRiskLevel = this.calculateRiskLevel({
      complaints: complaintsSummary,
      recalls: recallsSummary,
      safetyRatings: safetyRatingsSummary
    })
    
    // Calculate safety score
    const safetyScore = this.calculateSafetyScore({
      complaints: complaintsSummary,
      recalls: recallsSummary,
      safetyRatings: safetyRatingsSummary
    })
    
    // Extract key issues
    const keyIssues = this.extractKeyIssues(complaintsSummary, recallsSummary)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations({
      complaints: complaintsSummary,
      recalls: recallsSummary,
      safetyRatings: safetyRatingsSummary
    })
    
    // Build link-outs for data not in public APIs
    const linkOuts = {
      tsbs: `https://www.nhtsa.gov/vehicle/${params.year}/${params.make}/${params.model}/tsbs`,
      investigations: `https://www.nhtsa.gov/recalls?make=${params.make}&model=${params.model}&year=${params.year}`
    }
    
    return {
      complaints: complaintsSummary,
      recalls: recallsSummary,
      safetyRatings: safetyRatingsSummary,
      overallRiskLevel,
      safetyScore,
      keyIssues,
      recommendations,
      linkOuts
    }
  }
  
  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(data: {
    complaints: ComplaintSummary
    recalls: RecallSummary
    safetyRatings: SafetyRatingSummary
  }): 'low' | 'medium' | 'high' | 'critical' {
    let score = 0
    
    // Open recalls are serious (0-40 points)
    if (data.recalls.openRecalls > 5) {
      score += 40
    } else if (data.recalls.openRecalls > 0) {
      score += 20
    }
    
    // Low safety rating is concerning (0-20 points)
    if (data.safetyRatings.hasRatings && data.safetyRatings.overallRating < 3) {
      score += 20
    } else if (data.safetyRatings.hasRatings && data.safetyRatings.overallRating === 3) {
      score += 10
    }
    
    // Deaths/injuries are critical (0-40 points)
    if (data.complaints.deaths > 0) {
      score += 40
    } else if (data.complaints.injuries > 10) {
      score += 25
    } else if (data.complaints.injuries > 0) {
      score += 10
    }
    
    // Crashes/fires (0-20 points)
    if (data.complaints.fireCount > 5) {
      score += 15
    } else if (data.complaints.fireCount > 0) {
      score += 8
    }
    
    if (data.complaints.crashCount > 20) {
      score += 10
    } else if (data.complaints.crashCount > 10) {
      score += 5
    }
    
    // High complaint volume (0-15 points)
    if (data.complaints.totalComplaints > 200) {
      score += 15
    } else if (data.complaints.totalComplaints > 100) {
      score += 10
    } else if (data.complaints.totalComplaints > 50) {
      score += 5
    }
    
    // Determine level (max 120 points possible)
    if (score >= 60) return 'critical'
    if (score >= 35) return 'high'
    if (score >= 15) return 'medium'
    return 'low'
  }
  
  /**
   * Calculate safety score (0-100, higher is better)
   */
  private calculateSafetyScore(data: {
    complaints: ComplaintSummary
    recalls: RecallSummary
    safetyRatings: SafetyRatingSummary
  }): number {
    let score = 100
    
    // Deduct for recalls (up to -40)
    score -= data.recalls.openRecalls * 8
    
    // Bonus for good safety ratings (up to +20)
    if (data.safetyRatings.hasRatings) {
      if (data.safetyRatings.overallRating === 5) {
        score += 20
      } else if (data.safetyRatings.overallRating === 4) {
        score += 10
      } else if (data.safetyRatings.overallRating <= 2) {
        score -= 20
      }
    }
    
    // Deduct for deaths/injuries (up to -50)
    score -= data.complaints.deaths * 10
    score -= data.complaints.injuries * 2
    
    // Deduct for crashes/fires (up to -20)
    score -= Math.min(data.complaints.crashCount / 2, 10)
    score -= Math.min(data.complaints.fireCount, 10)
    
    // Deduct for complaint volume (up to -10)
    score -= Math.min(data.complaints.totalComplaints / 20, 10)
    
    // Don't go below 0
    return Math.max(0, Math.round(score))
  }
  
  /**
   * Extract key issues
   */
  private extractKeyIssues(
    complaints: ComplaintSummary,
    recalls: RecallSummary
  ): string[] {
    const issues: string[] = []
    
    // Add critical complaint issues
    complaints.commonIssues
      .filter(i => i.severity === 'high' && i.count >= 5)
      .slice(0, 3)
      .forEach(i => issues.push(`${i.count} reports of ${i.issue.toLowerCase()}`))
    
    // Add open recalls
    if (recalls.openRecalls > 0) {
      issues.push(`${recalls.openRecalls} open recall${recalls.openRecalls > 1 ? 's' : ''}` )
    }
    
    // Add safety concerns
    if (complaints.deaths > 0) {
      issues.push(`${complaints.deaths} fatality report${complaints.deaths > 1 ? 's' : ''}`)
    }
    if (complaints.injuries > 0 && complaints.injuries <= 10) {
      issues.push(`${complaints.injuries} injury report${complaints.injuries > 1 ? 's' : ''}`)
    } else if (complaints.injuries > 10) {
      issues.push(`${complaints.injuries} injury reports`)
    }
    
    // Add crash/fire data
    if (complaints.crashCount > 20) {
      issues.push(`${complaints.crashCount} crash-related complaints`)
    }
    if (complaints.fireCount > 5) {
      issues.push(`${complaints.fireCount} fire-related complaints`)
    }
    
    return issues.slice(0, 5)
  }
  
  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(data: {
    complaints: ComplaintSummary
    recalls: RecallSummary
    safetyRatings: SafetyRatingSummary
  }): string[] {
    const recommendations: string[] = []
    
    // Check for open recalls
    if (data.recalls.openRecalls > 0) {
      recommendations.push(`Address ${data.recalls.openRecalls} open recall${data.recalls.openRecalls > 1 ? 's' : ''} immediately`)
    }
    
    // Check safety ratings
    if (data.safetyRatings.hasRatings && data.safetyRatings.overallRating < 4) {
      recommendations.push('Consider safety features when driving - lower crash test rating')
    }
    
    // Check for critical safety issues
    if (data.complaints.deaths > 0 || data.complaints.injuries > 10) {
      recommendations.push('Consider additional safety precautions or inspection')
    }
    
    // Check for specific component issues
    if (data.complaints.commonIssues.length > 0) {
      const topIssue = data.complaints.commonIssues[0]
      if (topIssue.severity === 'high') {
        recommendations.push(`Have ${topIssue.issue.toLowerCase()} inspected by certified technician`)
      }
    }
    
    // Fire/crash recommendations
    if (data.complaints.fireCount > 3) {
      recommendations.push('Inspect electrical system and fuel lines for safety')
    }
    
    // General recommendation
    if (recommendations.length === 0) {
      recommendations.push('Keep up with regular maintenance schedule')
      recommendations.push('Monitor for any unusual symptoms or behaviors')
    }
    
    return recommendations.slice(0, 5)
  }
}

/**
 * Convenience export
 */
export async function getVehicleSafety(params: {
  make: string
  model: string
  year: number
}): Promise<VehicleSafetyData> {
  const service = new VehicleSafetyService()
  return service.getCompleteSafetyData(params)
}
