/**
 * NHTSA Investigations Integration
 * 
 * Active and closed safety investigations by NHTSA
 * PE = Preliminary Evaluation
 * EA = Engineering Analysis
 * INF = Investigation
 */

export interface Investigation {
  nhtsaId: string
  manufacturer: string
  make: string
  model: string
  modelYear: string // Can be range like "2018-2021"
  component: string
  openDate: string
  closeDate: string | null
  investigationType: 'PE' | 'EA' | 'INF' // Preliminary Evaluation, Engineering Analysis, Investigation
  summary: string
  status: 'Open' | 'Closed'
}

export interface InvestigationSummary {
  totalInvestigations: number
  openInvestigations: number
  closedInvestigations: number
  byType: Array<{
    type: string
    count: number
  }>
  activeInvestigations: Investigation[]
}

export class NHTSAInvestigations {
  private baseUrl = 'https://api.nhtsa.gov/products/vehicle'
  
  /**
   * Get all investigations for a specific vehicle
   */
  async getInvestigationsByVehicle(params: {
    make: string
    model: string
    year: number
  }): Promise<Investigation[]> {
    try {
      const url = `${this.baseUrl}/investigations?make=${encodeURIComponent(params.make)}&model=${encodeURIComponent(params.model)}&modelYear=${params.year}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`NHTSA Investigations API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      return (data.results || []).map((item: any) => ({
        nhtsaId: item.NHTSAId || item.nhtsaId || '',
        manufacturer: item.Manufacturer || item.manufacturer || '',
        make: item.Make || item.make || '',
        model: item.Model || item.model || '',
        modelYear: item.ModelYear || item.modelYear || String(params.year),
        component: item.Component || item.component || 'General',
        openDate: item.OpenDate || item.openDate || '',
        closeDate: item.CloseDate || item.closeDate || null,
        investigationType: (item.InvestigationType || item.investigationType || 'PE') as 'PE' | 'EA' | 'INF',
        summary: item.Summary || item.summary || '',
        status: (item.CloseDate || item.closeDate) ? 'Closed' : 'Open'
      }))
      
    } catch (error) {
      console.error('[NHTSA Investigations] API error:', error)
      return []
    }
  }
  
  /**
   * Analyze and summarize investigations
   */
  analyzeSummary(investigations: Investigation[]): InvestigationSummary {
    if (investigations.length === 0) {
      return {
        totalInvestigations: 0,
        openInvestigations: 0,
        closedInvestigations: 0,
        byType: [],
        activeInvestigations: []
      }
    }
    
    const openInvestigations = investigations.filter(i => i.status === 'Open')
    const closedInvestigations = investigations.filter(i => i.status === 'Closed')
    
    // Count by type
    const typeCounts = new Map<string, number>()
    investigations.forEach(i => {
      const current = typeCounts.get(i.investigationType) || 0
      typeCounts.set(i.investigationType, current + 1)
    })
    
    const typeNames = {
      'PE': 'Preliminary Evaluation',
      'EA': 'Engineering Analysis',
      'INF': 'Investigation'
    }
    
    const byType = Array.from(typeCounts.entries())
      .map(([type, count]) => ({
        type: typeNames[type as keyof typeof typeNames] || type,
        count
      }))
    
    return {
      totalInvestigations: investigations.length,
      openInvestigations: openInvestigations.length,
      closedInvestigations: closedInvestigations.length,
      byType,
      activeInvestigations: openInvestigations.slice(0, 5)
    }
  }
  
  /**
   * Get investigation severity level
   */
  getSeverityLevel(investigation: Investigation): 'critical' | 'high' | 'medium' {
    // Engineering Analysis and Investigation are more severe than Preliminary
    if (investigation.investigationType === 'EA' || investigation.investigationType === 'INF') {
      return 'critical'
    }
    
    // Check for safety-critical components
    const criticalComponents = ['brake', 'steering', 'airbag', 'seat belt', 'fuel system', 'accelerator']
    if (criticalComponents.some(c => investigation.component.toLowerCase().includes(c))) {
      return 'high'
    }
    
    return 'medium'
  }
}

/**
 * Convenience export
 */
export async function getVehicleInvestigations(params: {
  make: string
  model: string
  year: number
}): Promise<InvestigationSummary> {
  const service = new NHTSAInvestigations()
  const investigations = await service.getInvestigationsByVehicle(params)
  return service.analyzeSummary(investigations)
}
