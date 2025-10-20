/**
 * NHTSA Service Bulletins (TSBs) Integration
 * 
 * Technical Service Bulletins are manufacturer notifications
 * about common issues and recommended repairs
 */

export interface ServiceBulletin {
  nhtsaId: string
  manufacturer: string
  make: string
  model: string
  modelYear: number
  component: string
  summary: string
  consequence: string
  correctiveAction: string
  notes: string
  bulletinDate: string
  bulletinNumber: string
}

export interface TSBSummary {
  totalBulletins: number
  byComponent: Array<{
    component: string
    count: number
  }>
  recentBulletins: ServiceBulletin[]
  criticalBulletins: ServiceBulletin[]
}

export class NHTSAServiceBulletins {
  private baseUrl = 'https://api.nhtsa.gov/products/vehicle'
  
  /**
   * Get all TSBs for a specific vehicle
   */
  async getTSBsByVehicle(params: {
    make: string
    model: string
    year: number
  }): Promise<ServiceBulletin[]> {
    try {
      const url = `${this.baseUrl}/tsbs?make=${encodeURIComponent(params.make)}&model=${encodeURIComponent(params.model)}&modelYear=${params.year}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`NHTSA TSB API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      return (data.results || []).map((item: any) => ({
        nhtsaId: item.NHTSAId || item.nhtsaId || '',
        manufacturer: item.Manufacturer || item.manufacturer || '',
        make: item.Make || item.make || '',
        model: item.Model || item.model || '',
        modelYear: parseInt(item.ModelYear || item.modelYear || params.year, 10),
        component: item.Component || item.component || 'General',
        summary: item.Summary || item.summary || '',
        consequence: item.Consequence || item.consequence || '',
        correctiveAction: item.CorrectiveAction || item.correctiveAction || '',
        notes: item.Notes || item.notes || '',
        bulletinDate: item.BulletinDate || item.bulletinDate || '',
        bulletinNumber: item.BulletinNumber || item.bulletinNumber || ''
      }))
      
    } catch (error) {
      console.error('[NHTSA TSB] API error:', error)
      return []
    }
  }
  
  /**
   * Analyze and summarize TSBs
   */
  analyzeSummary(bulletins: ServiceBulletin[]): TSBSummary {
    if (bulletins.length === 0) {
      return {
        totalBulletins: 0,
        byComponent: [],
        recentBulletins: [],
        criticalBulletins: []
      }
    }
    
    // Count by component
    const componentCounts = new Map<string, number>()
    bulletins.forEach(b => {
      const current = componentCounts.get(b.component) || 0
      componentCounts.set(b.component, current + 1)
    })
    
    const byComponent = Array.from(componentCounts.entries())
      .map(([component, count]) => ({ component, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    // Get recent (last 3 years)
    const threeYearsAgo = new Date()
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)
    
    const recentBulletins = bulletins
      .filter(b => b.bulletinDate && new Date(b.bulletinDate) > threeYearsAgo)
      .sort((a, b) => new Date(b.bulletinDate).getTime() - new Date(a.bulletinDate).getTime())
      .slice(0, 5)
    
    // Identify critical (mentions safety, crash, fire, etc.)
    const criticalKeywords = ['safety', 'crash', 'fire', 'injury', 'death', 'brake', 'steering', 'airbag', 'fuel leak']
    const criticalBulletins = bulletins
      .filter(b => {
        const text = `${b.summary} ${b.consequence}`.toLowerCase()
        return criticalKeywords.some(keyword => text.includes(keyword))
      })
      .slice(0, 5)
    
    return {
      totalBulletins: bulletins.length,
      byComponent,
      recentBulletins,
      criticalBulletins
    }
  }
}

/**
 * Convenience export
 */
export async function getVehicleTSBs(params: {
  make: string
  model: string
  year: number
}): Promise<TSBSummary> {
  const service = new NHTSAServiceBulletins()
  const bulletins = await service.getTSBsByVehicle(params)
  return service.analyzeSummary(bulletins)
}
