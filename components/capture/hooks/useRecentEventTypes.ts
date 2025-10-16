/**
 * Hook: useRecentEventTypes
 * 
 * Returns recently used event types for a vehicle
 * Used to show "Recently Used" section in capture modal
 */

'use client'

import { useEffect, useState } from 'react'

export function useRecentEventTypes(vehicleId: string, limit: number = 3): {
  recentTypes: string[]
  isLoading: boolean
  error: Error | null
} {
  const [recentTypes, setRecentTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchRecentTypes = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch recent events and extract unique types
        const response = await fetch(`/api/vehicles/${vehicleId}/events?limit=50`)
        if (!response.ok) {
          throw new Error('Failed to fetch recent event types')
        }
        
        const data = await response.json()
        const events = data.events || []
        
        // Extract unique event types in reverse chronological order
        const types = new Set<string>()
        for (const event of events) {
          if (event.type && types.size < limit) {
            types.add(event.type)
          }
        }
        
        setRecentTypes(Array.from(types))
      } catch (err) {
        console.error('Error fetching recent event types:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setRecentTypes([])
      } finally {
        setIsLoading(false)
      }
    }

    if (vehicleId) {
      fetchRecentTypes()
    } else {
      setIsLoading(false)
    }
  }, [vehicleId, limit])

  return { recentTypes, isLoading, error }
}
