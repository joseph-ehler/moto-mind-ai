// API Envelope Utilities - Dual Format Support During Migration
// Provides backward compatibility during API format transition

// import type { ApiListResponse, ApiSingleResponse } from '@/lib/domain/types'

interface ApiListResponse<T> {
  data: T[]
  count?: number
}

interface ApiSingleResponse<T> {
  data: T
}

// Feature flag for new envelope format
export const useNewEnvelope = process.env.NEW_API_ENVELOPE === 'true'

// Dual format list envelope
export function listEnvelope<T>(key: string, data: T[], count?: number): any {
  if (useNewEnvelope) {
    return { data, count } as ApiListResponse<T>
  } else {
    // Legacy format
    return { [key]: data, ...(count !== undefined && { count }) }
  }
}

// Dual format single item envelope
export function singleEnvelope<T>(key: string, data: T | null): any {
  if (useNewEnvelope) {
    return { data } as ApiSingleResponse<T>
  } else {
    // Legacy format
    return { [key]: data }
  }
}

// Error envelope (consistent across versions)
export function errorEnvelope(error: string, code?: string, detail?: string) {
  return { error, ...(code && { code }), ...(detail && { detail }) }
}

// Client-side normalizer for consuming APIs during transition
export function normalizeListResponse<T>(response: any): T[] {
  // New format
  if (Array.isArray(response?.data)) {
    return response.data
  }
  
  // Legacy format - find the array property
  const keys = Object.keys(response || {})
  const arrayKey = keys.find(key => Array.isArray(response[key]))
  
  return arrayKey ? response[arrayKey] : []
}

// Client-side normalizer for single item responses
export function normalizeSingleResponse<T>(response: any): T | null {
  // New format
  if (response?.data !== undefined) {
    return response.data
  }
  
  // Legacy format - find the non-metadata property
  const keys = Object.keys(response || {})
  const dataKey = keys.find(key => 
    key !== 'count' && 
    key !== 'cursor' && 
    key !== 'error' && 
    key !== 'code' && 
    key !== 'detail'
  )
  
  return dataKey ? response[dataKey] : null
}

// Fetch wrapper with automatic normalization
export async function fetchList<T>(url: string): Promise<T[]> {
  const response = await fetch(url)
  const json = await response.json()
  
  if (!response.ok) {
    throw new Error(json.error || 'Request failed')
  }
  
  return normalizeListResponse<T>(json)
}

export async function fetchSingle<T>(url: string): Promise<T | null> {
  const response = await fetch(url)
  const json = await response.json()
  
  if (!response.ok) {
    throw new Error(json.error || 'Request failed')
  }
  
  return normalizeSingleResponse<T>(json)
}

// Metrics tracking for envelope usage
export function trackEnvelopeUsage(endpoint: string, format: 'new' | 'legacy') {
  // In production, send to your metrics service
  console.log(`API Envelope: ${endpoint} used ${format} format`)
}
