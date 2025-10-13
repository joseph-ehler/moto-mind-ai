import useSWR from 'swr'
import { flags } from '@/lib/config/featureFlags'

export interface JurisdictionSummary {
  registration?: {
    kind: string
    cadence: string
    notes?: string
  }
  inspection?: {
    kind: string
    cadence: string
    notes?: string
  }
  emissions?: {
    kind: string
    cadence: string
    notes?: string
  }
}

export interface JurisdictionProfile {
  id: string
  garage_id: string
  country: string
  state?: string
  county?: string
  derived_at: string
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch jurisdiction data')
  }
  return response.json()
}

export function useGarageJurisdiction(garageId: string) {
  const endpoint = flags.useSimpleJurisdiction 
    ? `/api/vehicless/${garageId}/jurisdiction-simple`
    : `/api/vehicless/${garageId}/jurisdiction`
    
  const { data, error, mutate, isLoading } = useSWR(
    garageId ? endpoint : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes
    }
  )

  const applyJurisdiction = async () => {
    try {
      const response = await fetch(`/api/vehicless/${garageId}/jurisdiction/apply`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Revalidate data after applying
        mutate()
        return await response.json()
      } else {
        throw new Error('Failed to apply jurisdiction rules')
      }
    } catch (error) {
      console.error('Error applying jurisdiction:', error)
      throw error
    }
  }

  return {
    profile: data?.profile as JurisdictionProfile | undefined,
    rules: data?.rules || {},
    summary: data?.summary as JurisdictionSummary | undefined,
    summaryText: data?.summaryText as string | undefined,
    lastUpdated: data?.lastUpdated,
    isLoading,
    error,
    mutate,
    applyJurisdiction,
    // Helper functions
    hasRegistration: () => data?.summary?.registration?.cadence !== 'none',
    hasInspection: () => data?.summary?.inspection?.cadence !== 'none', 
    hasEmissions: () => data?.summary?.emissions?.cadence !== 'none',
    getRequirements: () => {
      const reqs: string[] = []
      if (data?.summary?.registration?.cadence !== 'none') {
        reqs.push(`${data.summary.registration.cadence} registration`)
      }
      if (data?.summary?.inspection?.cadence !== 'none') {
        reqs.push(`${data.summary.inspection.cadence} inspection`)
      }
      if (data?.summary?.emissions?.cadence !== 'none') {
        reqs.push(`${data.summary.emissions.cadence} emissions`)
      } else {
        reqs.push('no emissions')
      }
      return reqs
    }
  }
}
