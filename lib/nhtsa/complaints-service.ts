/**
 * NHTSA Complaints Service
 * 
 * Query local NHTSA complaints and investigations database
 * Provides analysis, risk scoring, and pattern detection
 */

import { createClient } from '@supabase/supabase-js'

export interface ComplaintSummary {
  total: number
  crashes: number
  fires: number
  injuries: number
  deaths: number
  
  topProblems: ProblemPattern[]
  recentComplaints: ComplaintDetail[]
  
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface ProblemPattern {
  component: string
  count: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  avgMileage: number
  crashes: number
  fires: number
  recentExample: {
    date: Date
    description: string
    crash: boolean
    fire: boolean
  }
}

export interface ComplaintDetail {
  odiNumber: string
  date: Date
  component: string
  summary: string
  crash: boolean
  fire: boolean
  injured: number
  deaths: number
  mileage?: number
}

export interface InvestigationSummary {
  total: number
  open: number
  closed: number
  activeInvestigations: InvestigationDetail[]
}

export interface InvestigationDetail {
  nhtsaId: string
  component: string
  subject: string
  summary: string
  openDate: Date
  closeDate?: Date
  potentialAffected?: number
}

export class ComplaintsService {
  private supabase: ReturnType<typeof createClient>
  
  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }
  
  /**
   * Get complete complaint summary for a vehicle
   */
  async getComplaintSummary(params: {
    year: number | string
    make: string
    model: string
  }): Promise<ComplaintSummary> {
    
    const yearStr = params.year.toString()
    const make = params.make.toUpperCase().trim()
    const model = params.model.toUpperCase().trim()
    
    // Get all complaints for this vehicle
    const { data: complaints, error } = await this.supabase
      .from('nhtsa_complaints')
      .select('*')
      .eq('year', yearStr)
      .eq('make', make)
      .eq('model', model)
      .order('complaint_date', { ascending: false })
    
    if (error) {
      console.error('[Complaints Service] Query error:', error)
      return this.getEmptySummary()
    }
    
    if (!complaints || complaints.length === 0) {
      return this.getEmptySummary()
    }
    
    // Calculate summary stats
    const total = complaints.length
    const crashes = complaints.filter(c => c.crash).length
    const fires = complaints.filter(c => c.fire).length
    const injuries = complaints.reduce((sum, c) => sum + (c.injured || 0), 0)
    const deaths = complaints.reduce((sum, c) => sum + (c.deaths || 0), 0)
    
    // Identify problem patterns
    const topProblems = await this.identifyProblemPatterns(complaints)
    
    // Get recent complaints
    const recentComplaints = complaints.slice(0, 10).map(c => ({
      odiNumber: c.odi_number,
      date: new Date(c.complaint_date),
      component: c.component,
      summary: c.summary,
      crash: c.crash,
      fire: c.fire,
      injured: c.injured,
      deaths: c.deaths,
      mileage: c.mileage
    }))
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore({
      total,
      crashes,
      fires,
      injuries,
      deaths
    })
    
    const riskLevel = this.getRiskLevel(riskScore)
    
    return {
      total,
      crashes,
      fires,
      injuries,
      deaths,
      topProblems,
      recentComplaints,
      riskScore,
      riskLevel
    }
  }
  
  /**
   * Identify common problem patterns
   */
  private async identifyProblemPatterns(complaints: any[]): Promise<ProblemPattern[]> {
    // Group by component
    const componentGroups = new Map<string, any[]>()
    
    for (const complaint of complaints) {
      const component = complaint.component || 'UNKNOWN'
      
      if (!componentGroups.has(component)) {
        componentGroups.set(component, [])
      }
      
      componentGroups.get(component)!.push(complaint)
    }
    
    // Analyze each component
    const patterns: ProblemPattern[] = []
    
    for (const [component, items] of componentGroups) {
      if (items.length < 3) continue // Ignore single incidents
      
      const crashes = items.filter(c => c.crash).length
      const fires = items.filter(c => c.fire).length
      
      // Calculate severity
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
      if (fires > 0 || crashes > 3) severity = 'HIGH'
      else if (crashes > 0 || items.length > 10) severity = 'MEDIUM'
      
      // Average mileage
      const mileages = items
        .filter(c => c.mileage && c.mileage > 0)
        .map(c => c.mileage)
      
      const avgMileage = mileages.length > 0
        ? Math.round(mileages.reduce((a: number, b: number) => a + b, 0) / mileages.length)
        : 0
      
      // Most recent example
      const recent = items[0]
      
      patterns.push({
        component,
        count: items.length,
        severity,
        avgMileage,
        crashes,
        fires,
        recentExample: {
          date: new Date(recent.complaint_date),
          description: recent.summary || recent.description,
          crash: recent.crash,
          fire: recent.fire
        }
      })
    }
    
    // Sort by count (most common problems first)
    return patterns
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 problems
  }
  
  /**
   * Calculate risk score (0-100)
   */
  private calculateRiskScore(stats: {
    total: number
    crashes: number
    fires: number
    injuries: number
    deaths: number
  }): number {
    
    let score = 0
    
    // Base score on complaint volume
    score += Math.min(stats.total * 0.5, 30) // Max 30 points
    
    // Crashes (major concern)
    score += stats.crashes * 5 // 5 points per crash
    
    // Fires (critical concern)
    score += stats.fires * 10 // 10 points per fire
    
    // Injuries
    score += stats.injuries * 3 // 3 points per injury
    
    // Deaths (most critical)
    score += stats.deaths * 15 // 15 points per death
    
    // Cap at 100
    return Math.min(Math.round(score), 100)
  }
  
  /**
   * Get risk level from score
   */
  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 80) return 'CRITICAL'
    if (score >= 60) return 'HIGH'
    if (score >= 30) return 'MEDIUM'
    return 'LOW'
  }
  
  /**
   * Get active investigations for a vehicle
   */
  async getInvestigations(params: {
    year: number | string
    make: string
    model: string
  }): Promise<InvestigationSummary> {
    
    const yearStr = params.year.toString()
    const make = params.make.toUpperCase().trim()
    const model = params.model.toUpperCase().trim()
    
    const { data: investigations, error } = await this.supabase
      .from('nhtsa_investigations')
      .select('*')
      .eq('year', yearStr)
      .eq('make', make)
      .eq('model', model)
      .order('open_date', { ascending: false })
    
    if (error || !investigations) {
      console.error('[Complaints Service] Investigations error:', error)
      return {
        total: 0,
        open: 0,
        closed: 0,
        activeInvestigations: []
      }
    }
    
    const total = investigations.length
    const open = investigations.filter(i => !i.close_date).length
    const closed = investigations.filter(i => i.close_date).length
    
    const activeInvestigations = investigations
      .filter(i => !i.close_date)
      .map(i => ({
        nhtsaId: i.nhtsa_id,
        component: i.component,
        subject: i.subject,
        summary: i.summary,
        openDate: new Date(i.open_date),
        closeDate: i.close_date ? new Date(i.close_date) : undefined,
        potentialAffected: i.potential_affected
      }))
    
    return {
      total,
      open,
      closed,
      activeInvestigations
    }
  }
  
  /**
   * Get empty summary (no data)
   */
  private getEmptySummary(): ComplaintSummary {
    return {
      total: 0,
      crashes: 0,
      fires: 0,
      injuries: 0,
      deaths: 0,
      topProblems: [],
      recentComplaints: [],
      riskScore: 0,
      riskLevel: 'LOW'
    }
  }
}

/**
 * Singleton instance
 */
let complaintsService: ComplaintsService | null = null

export function getComplaintsService(): ComplaintsService {
  if (!complaintsService) {
    complaintsService = new ComplaintsService()
  }
  return complaintsService
}
