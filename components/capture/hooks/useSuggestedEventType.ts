/**
 * Hook: useSuggestedEventType
 * 
 * Provides smart suggestions based on:
 * - Time since last event of each type
 * - Average intervals
 * - Predictive patterns
 * 
 * Returns null if no suggestion, or an object with type and reason
 */

'use client'

import { useEffect, useState } from 'react'

interface EventSuggestion {
  type: string
  reason: string
  confidence: number
}

export function useSuggestedEventType(vehicleId: string): {
  suggestion: EventSuggestion | null
  isLoading: boolean
  error: Error | null
} {
  const [suggestion, setSuggestion] = useState<EventSuggestion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchSuggestion = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}/events?limit=100`)
        if (!response.ok) {
          throw new Error('Failed to fetch events for suggestion')
        }
        
        const data = await response.json()
        const events = data.events || []
        
        // Analyze patterns
        const fuelEvents = events.filter((e: any) => e.type === 'fuel')
        const serviceEvents = events.filter((e: any) => e.type === 'service')
        
        // Check fuel pattern (most common)
        if (fuelEvents.length >= 2) {
          const lastFuel = new Date(fuelEvents[0]?.date)
          const daysSinceFuel = Math.floor((Date.now() - lastFuel.getTime()) / (1000 * 60 * 60 * 24))
          
          // Calculate average interval
          let totalDays = 0
          for (let i = 0; i < fuelEvents.length - 1; i++) {
            const diff = new Date(fuelEvents[i].date).getTime() - new Date(fuelEvents[i + 1].date).getTime()
            totalDays += diff / (1000 * 60 * 60 * 24)
          }
          const avgInterval = totalDays / (fuelEvents.length - 1)
          
          // Suggest if close to average interval
          if (daysSinceFuel >= avgInterval * 0.9) {
            setSuggestion({
              type: 'fuel',
              reason: `Last filled ${daysSinceFuel} days ago · Usually every ${Math.round(avgInterval)} days`,
              confidence: Math.min(daysSinceFuel / avgInterval, 1)
            })
            return
          }
        }
        
        // Check service pattern
        if (serviceEvents.length >= 2) {
          const lastService = new Date(serviceEvents[0]?.date)
          const daysSinceService = Math.floor((Date.now() - lastService.getTime()) / (1000 * 60 * 60 * 24))
          
          // Suggest if > 90 days since last service
          if (daysSinceService >= 90) {
            setSuggestion({
              type: 'service',
              reason: `${daysSinceService} days since last service · Maintenance may be due`,
              confidence: 0.7
            })
            return
          }
        }
        
        setSuggestion(null)
      } catch (err) {
        console.error('Error generating suggestion:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setSuggestion(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (vehicleId) {
      fetchSuggestion()
    } else {
      setIsLoading(false)
    }
  }, [vehicleId])

  return { suggestion, isLoading, error }
}
