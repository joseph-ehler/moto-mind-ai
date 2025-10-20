/**
 * Local NHTSA Safety Service
 * 
 * Queries the local database (nhtsa_complaints_rollup) instead of external APIs
 * Fast, reliable, and uses our $513k investment!
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface LocalSafetyData {
  // Vehicle identification
  year: string
  make: string
  model: string
  
  // Complaint stats
  totalComplaints: number
  uniqueComplaints: number
  crashes: number
  fires: number
  totalInjured: number
  totalDeaths: number
  
  // Mileage data
  avgMileage: number | null
  medianMileage: number | null
  
  // Safety metrics
  safetyScore: number  // 0-100 (our calculated score)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  
  // Top problems (from component rollup)
  topProblems: Array<{
    component: string
    complaintCount: number
    crashes: number
    fires: number
    severityScore: number
  }>
  
  // Comparison data
  comparison: {
    avgComplaintsForYear: number
    percentile: number  // Where this vehicle ranks (0-100)
    betterThan: number  // Percentage of vehicles this is better than
  }
}

export class LocalSafetyService {
  /**
   * Get complete safety data from local database
   */
  async getSafetyData(params: {
    make: string
    model: string
    year: number
  }): Promise<LocalSafetyData | null> {
    console.log('[Local Safety] Fetching for', params)
    
    // Query rollup table for vehicle
    const { data: rollupData, error: rollupError } = await supabase
      .from('nhtsa_complaints_rollup')
      .select('*')
      .eq('year', params.year.toString())
      .ilike('make', params.make)
      .ilike('model', params.model)
      .single()
    
    if (rollupError || !rollupData) {
      console.log('[Local Safety] No data found:', rollupError?.message)
      return null
    }
    
    console.log('[Local Safety] Found vehicle data:', rollupData)
    
    // Get top problems from component rollup
    const { data: componentData } = await supabase
      .from('nhtsa_component_rollup')
      .select('component, complaint_count, crashes, fires, severity_score')
      .eq('year', params.year.toString())
      .ilike('make', params.make)
      .ilike('model', params.model)
      .order('severity_score', { ascending: false })
      .limit(5)
    
    const topProblems = (componentData || []).map(c => ({
      component: c.component,
      complaintCount: c.complaint_count,
      crashes: c.crashes,
      fires: c.fires,
      severityScore: c.severity_score
    }))
    
    // Get average complaints for this year (for comparison)
    const { data: yearStats } = await supabase
      .from('nhtsa_complaints_rollup')
      .select('total_complaints')
      .eq('year', params.year.toString())
    
    const avgComplaintsForYear = yearStats && yearStats.length > 0
      ? yearStats.reduce((sum, v) => sum + v.total_complaints, 0) / yearStats.length
      : 0
    
    // Calculate percentile (how many vehicles have fewer complaints)
    const { count: betterCount } = await supabase
      .from('nhtsa_complaints_rollup')
      .select('*', { count: 'exact', head: true })
      .eq('year', params.year.toString())
      .lt('total_complaints', rollupData.total_complaints)
    
    const { count: totalCount } = await supabase
      .from('nhtsa_complaints_rollup')
      .select('*', { count: 'exact', head: true })
      .eq('year', params.year.toString())
    
    const percentile = totalCount && totalCount > 0
      ? Math.round((betterCount || 0) / totalCount * 100)
      : 50
    
    const betterThan = percentile
    
    return {
      year: rollupData.year,
      make: rollupData.make,
      model: rollupData.model,
      totalComplaints: rollupData.total_complaints,
      uniqueComplaints: rollupData.unique_complaints,
      crashes: rollupData.crashes,
      fires: rollupData.fires,
      totalInjured: rollupData.total_injured,
      totalDeaths: rollupData.total_deaths,
      avgMileage: rollupData.avg_mileage,
      medianMileage: rollupData.median_mileage,
      safetyScore: rollupData.safety_score,
      riskLevel: rollupData.risk_level,
      topProblems,
      comparison: {
        avgComplaintsForYear,
        percentile,
        betterThan
      }
    }
  }
  
  /**
   * Get safety data for multiple vehicles (for comparison)
   */
  async getSafetyDataBatch(vehicles: Array<{ make: string; model: string; year: number }>) {
    const results = await Promise.all(
      vehicles.map(v => this.getSafetyData(v))
    )
    return results.filter((r): r is LocalSafetyData => r !== null)
  }
  
  /**
   * Check if we have data for a vehicle
   */
  async hasData(params: { make: string; model: string; year: number }): Promise<boolean> {
    const { count } = await supabase
      .from('nhtsa_complaints_rollup')
      .select('*', { count: 'exact', head: true })
      .eq('year', params.year.toString())
      .ilike('make', params.make)
      .ilike('model', params.model)
    
    return (count || 0) > 0
  }
}

// Singleton instance
let instance: LocalSafetyService

export function getLocalSafetyService(): LocalSafetyService {
  if (!instance) {
    instance = new LocalSafetyService()
  }
  return instance
}
