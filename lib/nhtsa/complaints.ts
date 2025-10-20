/**
 * NHTSA Complaints Integration
 * 
 * Access user complaints filed with NHTSA
 * https://api.nhtsa.gov/complaints
 */

export interface Complaint {
  odiNumber: string           // Unique complaint ID
  manufacturer: string
  crash: boolean             // Did it involve a crash?
  fire: boolean              // Did it involve a fire?
  numberOfInjuries: number
  numberOfDeaths: number
  dateOfIncident: string
  dateComplaintFiled: string
  vin: string
  component: string          // What component had the issue
  summary: string            // User's description
  productType: string        // Vehicle, Tire, etc.
  mileage: number
}

export interface ComplaintSummary {
  totalComplaints: number
  crashCount: number
  fireCount: number
  injuries: number
  deaths: number
  topComponents: Array<{
    component: string
    count: number
  }>
  commonIssues: Array<{
    issue: string
    count: number
    severity: 'high' | 'medium' | 'low'
  }>
}

import { getSocrataClient } from './socrata-client'

export class NHTSAComplaints {
  private socrata = getSocrataClient()
  private datasetId = 'a8j8-mz9p' // ODI Complaints dataset
  
  /**
   * Get all complaints for a specific vehicle
   * Using Socrata Open Data Portal (DOT official data)
   * Dataset: ODI Complaints (a8j8-mz9p)
   */
  async getComplaintsByVehicle(params: {
    make: string
    model: string
    year: number
  }): Promise<Complaint[]> {
    try {
      console.log('[NHTSA Complaints] Fetching from Socrata:', params)
      
      // Build WHERE clause for Socrata
      const where = this.socrata.buildVehicleWhere({
        year: params.year,
        make: params.make,
        model: params.model,
        yearField: 'yeartxt',
        makeField: 'maketxt',
        modelField: 'modeltxt'
      })
      
      // Query Socrata dataset
      const results = await this.socrata.query(this.datasetId, {
        where,
        limit: 1000, // Get up to 1000 complaints
        order: 'datea DESC' // Most recent first
      })
      
      console.log(`[NHTSA Complaints] Found ${results.length} complaints`)
      
      return this.parseComplaintData(results)
      
    } catch (error) {
      console.error('[NHTSA Complaints] Socrata error:', error)
      return []
    }
  }
  
  /**
   * Get complaints by VIN (for specific vehicle)
   */
  async getComplaintsByVIN(vin: string): Promise<Complaint[]> {
    try {
      console.log('[NHTSA Complaints] Fetching by VIN from Socrata:', vin)
      
      // Query Socrata by VIN
      const results = await this.socrata.query(this.datasetId, {
        where: `vin='${vin}'`,
        limit: 1000,
        order: 'datea DESC'
      })
      
      console.log(`[NHTSA Complaints] Found ${results.length} complaints for VIN`)
      
      return this.parseComplaintData(results)
      
    } catch (error) {
      console.error('[NHTSA Complaints] By VIN error:', error)
      return []
    }
  }
  
  /**
   * Analyze and summarize complaints
   */
  analyzeSummary(complaints: Complaint[]): ComplaintSummary {
    if (complaints.length === 0) {
      return {
        totalComplaints: 0,
        crashCount: 0,
        fireCount: 0,
        injuries: 0,
        deaths: 0,
        topComponents: [],
        commonIssues: []
      }
    }
    
    // Count by component
    const componentCounts = new Map<string, number>()
    complaints.forEach(c => {
      const current = componentCounts.get(c.component) || 0
      componentCounts.set(c.component, current + 1)
    })
    
    // Sort by frequency
    const topComponents = Array.from(componentCounts.entries())
      .map(([component, count]) => ({ component, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    // Analyze common issues
    const commonIssues = this.extractCommonIssues(complaints)
    
    return {
      totalComplaints: complaints.length,
      crashCount: complaints.filter(c => c.crash).length,
      fireCount: complaints.filter(c => c.fire).length,
      injuries: complaints.reduce((sum, c) => sum + c.numberOfInjuries, 0),
      deaths: complaints.reduce((sum, c) => sum + c.numberOfDeaths, 0),
      topComponents,
      commonIssues
    }
  }
  
  /**
   * Extract common issues from complaint summaries using NLP
   */
  private extractCommonIssues(complaints: Complaint[]): Array<{
    issue: string
    count: number
    severity: 'high' | 'medium' | 'low'
  }> {
    // Common automotive issue keywords
    const issuePatterns = [
      { keywords: ['engine stall', 'stalling', 'dies while driving'], issue: 'Engine stalling', severity: 'high' as const },
      { keywords: ['transmission', 'shifting', 'gear'], issue: 'Transmission problems', severity: 'high' as const },
      { keywords: ['brake', 'braking', 'stopping'], issue: 'Brake issues', severity: 'high' as const },
      { keywords: ['airbag', 'air bag'], issue: 'Airbag problems', severity: 'high' as const },
      { keywords: ['steering', 'wheel'], issue: 'Steering issues', severity: 'high' as const },
      { keywords: ['fuel pump', 'fuel system'], issue: 'Fuel system', severity: 'medium' as const },
      { keywords: ['electrical', 'battery', 'alternator'], issue: 'Electrical issues', severity: 'medium' as const },
      { keywords: ['suspension', 'shock', 'strut'], issue: 'Suspension problems', severity: 'medium' as const },
      { keywords: ['leak', 'leaking'], issue: 'Fluid leaks', severity: 'medium' as const },
      { keywords: ['check engine', 'warning light'], issue: 'Warning lights', severity: 'low' as const },
      { keywords: ['noise', 'rattling', 'squeaking'], issue: 'Unusual noises', severity: 'low' as const }
    ]
    
    const issueCounts = new Map<string, { count: number, severity: 'high' | 'medium' | 'low' }>()
    
    complaints.forEach(complaint => {
      const summary = complaint.summary.toLowerCase()
      
      issuePatterns.forEach(pattern => {
        if (pattern.keywords.some(keyword => summary.includes(keyword))) {
          const current = issueCounts.get(pattern.issue) || { count: 0, severity: pattern.severity }
          issueCounts.set(pattern.issue, {
            count: current.count + 1,
            severity: pattern.severity
          })
        }
      })
    })
    
    return Array.from(issueCounts.entries())
      .map(([issue, data]) => ({
        issue,
        count: data.count,
        severity: data.severity
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }
  
  /**
   * Parse complaint data from Socrata
   */
  private parseComplaintData(results: any[]): Complaint[] {
    return results.map((item: any) => ({
      odiNumber: item.odinumber || '',
      manufacturer: item.mfgname || '',
      crash: item.crash === 'Y' || item.crash === 'Yes',
      fire: item.fire_yn === 'Y' || item.fire_yn === 'Yes',
      numberOfInjuries: parseInt(item.injured || '0', 10),
      numberOfDeaths: parseInt(item.deaths || '0', 10),
      dateOfIncident: item.faildate || '',
      dateComplaintFiled: item.datea || '',
      vin: item.vin || '',
      component: item.compname || 'Unknown',
      summary: item.cdescr || '',
      productType: 'Vehicle',
      mileage: parseInt(item.mileage || '0', 10)
    }))
  }
}

/**
 * Convenience export
 */
export async function getVehicleComplaints(params: {
  make: string
  model: string
  year: number
}): Promise<ComplaintSummary> {
  const service = new NHTSAComplaints()
  const complaints = await service.getComplaintsByVehicle(params)
  return service.analyzeSummary(complaints)
}
