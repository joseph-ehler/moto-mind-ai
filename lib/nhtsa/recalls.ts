/**
 * NHTSA Recalls Integration - REAL API
 * 
 * Uses documented NHTSA Recalls API
 * https://webapi.nhtsa.gov/api/Recalls/vehicle/modelyear/{year}/make/{make}/model/{model}
 */

export interface Recall {
  nhtsaId: string
  manufacturer: string
  subject: string
  summary: string
  consequence: string
  remedy: string
  component: string
  reportReceivedDate: string
  modelYear: number
  make: string
  model: string
}

export interface RecallSummary {
  totalRecalls: number
  openRecalls: number
  byComponent: Array<{
    component: string
    count: number
  }>
  recent: Recall[]
}

import { getSocrataClient } from './socrata-client'

export class NHTSARecalls {
  private socrata = getSocrataClient()
  private datasetId = 'hivt-uz6i' // NHTSA Recalls dataset
  
  /**
   * Get all recalls for a specific vehicle
   * Using Socrata Open Data Portal (DOT official data)
   * Dataset: NHTSA Recalls (hivt-uz6i)
   */
  async getRecallsByVehicle(params: {
    make: string
    model: string
    year: number
  }): Promise<Recall[]> {
    try {
      console.log('[NHTSA Recalls] Fetching from Socrata:', params)
      
      // Build WHERE clause for Socrata
      const where = this.socrata.buildVehicleWhere({
        year: params.year,
        make: params.make,
        model: params.model,
        yearField: 'modelyear',
        makeField: 'make',
        modelField: 'model'
      })
      
      // Query Socrata dataset
      const results = await this.socrata.query(this.datasetId, {
        where,
        limit: 1000,
        order: 'reportreceiveddate DESC' // Most recent first
      })
      
      console.log(`[NHTSA Recalls] Found ${results.length} recalls`)
      
      return results.map((item: any) => ({
        nhtsaId: item.nhtsacampaignnumber || '',
        manufacturer: item.manufacturer || params.make,
        subject: item.subject || '',
        summary: item.summary || '',
        consequence: item.conequence || '', // Yes, NHTSA typo in dataset
        remedy: item.remedy || '',
        component: item.component || 'General',
        reportReceivedDate: item.reportreceiveddate || '',
        modelYear: params.year,
        make: params.make,
        model: params.model
      }))
      
    } catch (error) {
      console.error('[NHTSA Recalls] Socrata error:', error)
      return []
    }
  }
  
  /**
   * Analyze and summarize recalls
   */
  analyzeSummary(recalls: Recall[]): RecallSummary {
    if (recalls.length === 0) {
      return {
        totalRecalls: 0,
        openRecalls: 0,
        byComponent: [],
        recent: []
      }
    }
    
    // Count by component
    const componentCounts = new Map<string, number>()
    recalls.forEach(r => {
      const current = componentCounts.get(r.component) || 0
      componentCounts.set(r.component, current + 1)
    })
    
    const byComponent = Array.from(componentCounts.entries())
      .map(([component, count]) => ({ component, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    // Get recent (sort by date)
    const recent = [...recalls]
      .sort((a, b) => new Date(b.reportReceivedDate).getTime() - new Date(a.reportReceivedDate).getTime())
      .slice(0, 5)
    
    return {
      totalRecalls: recalls.length,
      openRecalls: recalls.length, // NHTSA only returns open recalls
      byComponent,
      recent
    }
  }
}

/**
 * Convenience export
 */
export async function getVehicleRecalls(params: {
  make: string
  model: string
  year: number
}): Promise<RecallSummary> {
  const service = new NHTSARecalls()
  const recalls = await service.getRecallsByVehicle(params)
  return service.analyzeSummary(recalls)
}
