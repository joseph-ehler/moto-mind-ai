/**
 * React hook for parking memory
 * 
 * Provides easy access to parking spot management with real-time updates.
 * 
 * @module hooks/useParkingMemory
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { ParkingMemory, type ParkingSpot, type SaveParkingSpotOptions } from '@/lib/tracking/parking-memory'

/**
 * Hook for managing parking memory
 * 
 * @returns Parking memory state and actions
 * 
 * @example
 * ```tsx
 * function ParkingWidget() {
 *   const { activeSpot, saveSpot, markAsRetrieved, isLoading } = useParkingMemory()
 *   
 *   if (activeSpot) {
 *     return <ActiveSpotCard spot={activeSpot} onRetrieved={markAsRetrieved} />
 *   }
 *   
 *   return <SaveSpotButton onSave={saveSpot} />
 * }
 * ```
 */
export function useParkingMemory() {
  const { data: session } = useSession()
  const [activeSpot, setActiveSpot] = useState<ParkingSpot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const parkingMemoryRef = useRef<ParkingMemory | null>(null)
  
  // Get user ID from NextAuth session
  const userId = (session?.user as any)?.id
  
  // Initialize ParkingMemory instance
  useEffect(() => {
    parkingMemoryRef.current = new ParkingMemory()
  }, [])
  
  // Load active spot when user ID is available
  useEffect(() => {
    if (userId) {
      loadActiveSpot()
    }
  }, [userId])
  
  /**
   * Load the active parking spot
   */
  const loadActiveSpot = useCallback(async () => {
    if (!parkingMemoryRef.current || !userId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const spot = await parkingMemoryRef.current.getActiveSpot(userId)
      setActiveSpot(spot)
    } catch (err) {
      console.error('[useParkingMemory] Failed to load active spot:', err)
      setError(err instanceof Error ? err.message : 'Failed to load parking spot')
    } finally {
      setIsLoading(false)
    }
  }, [userId])
  
  /**
   * Save a new parking spot
   */
  const saveSpot = useCallback(async (options: SaveParkingSpotOptions): Promise<ParkingSpot> => {
    if (!parkingMemoryRef.current) {
      throw new Error('ParkingMemory not initialized')
    }
    
    if (!userId) {
      throw new Error('User not authenticated')
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const spot = await parkingMemoryRef.current.saveSpot(userId, options)
      setActiveSpot(spot)
      return spot
    } catch (err) {
      console.error('[useParkingMemory] Failed to save spot:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save parking spot'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [userId])
  
  /**
   * Update parking spot metadata
   */
  const updateSpot = useCallback(async (
    spotId: string,
    updates: Partial<Pick<ParkingSpot, 'notes' | 'floor' | 'section' | 'spotNumber' | 'photoUrl'>>
  ): Promise<ParkingSpot> => {
    if (!parkingMemoryRef.current) {
      throw new Error('ParkingMemory not initialized')
    }
    
    setError(null)
    
    try {
      const updatedSpot = await parkingMemoryRef.current.updateSpot(spotId, updates)
      
      // Update local state if this is the active spot
      if (activeSpot?.id === spotId) {
        setActiveSpot(updatedSpot)
      }
      
      return updatedSpot
    } catch (err) {
      console.error('[useParkingMemory] Failed to update spot:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update parking spot'
      setError(errorMessage)
      throw err
    }
  }, [activeSpot])
  
  /**
   * Mark active parking spot as retrieved
   */
  const markAsRetrieved = useCallback(async () => {
    if (!parkingMemoryRef.current || !activeSpot) {
      return
    }
    
    setError(null)
    
    try {
      await parkingMemoryRef.current.markAsRetrieved(activeSpot.id)
      setActiveSpot(null)
    } catch (err) {
      console.error('[useParkingMemory] Failed to mark as retrieved:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark spot as retrieved'
      setError(errorMessage)
      throw err
    }
  }, [activeSpot])
  
  /**
   * Delete a parking spot
   */
  const deleteSpot = useCallback(async (spotId: string) => {
    if (!parkingMemoryRef.current) {
      throw new Error('ParkingMemory not initialized')
    }
    
    setError(null)
    
    try {
      await parkingMemoryRef.current.deleteSpot(spotId)
      
      // Clear active spot if it was deleted
      if (activeSpot?.id === spotId) {
        setActiveSpot(null)
      }
    } catch (err) {
      console.error('[useParkingMemory] Failed to delete spot:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete parking spot'
      setError(errorMessage)
      throw err
    }
  }, [activeSpot])
  
  /**
   * Calculate distance to active parking spot
   */
  const getDistanceToSpot = useCallback((currentLat: number, currentLng: number): number | null => {
    if (!parkingMemoryRef.current || !activeSpot) {
      return null
    }
    
    return parkingMemoryRef.current.calculateDistance(
      currentLat,
      currentLng,
      activeSpot.latitude,
      activeSpot.longitude
    )
  }, [activeSpot])
  
  /**
   * Get directions URL to active parking spot
   */
  const getDirectionsUrl = useCallback((currentLat?: number, currentLng?: number): string | null => {
    if (!parkingMemoryRef.current || !activeSpot) {
      return null
    }
    
    // Detect iOS for Apple Maps
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    
    if (isIOS) {
      return parkingMemoryRef.current.getAppleMapsUrl(activeSpot, currentLat, currentLng)
    }
    
    return parkingMemoryRef.current.getDirectionsUrl(activeSpot, currentLat, currentLng)
  }, [activeSpot])
  
  return {
    // State
    activeSpot,
    isLoading,
    error,
    
    // Actions
    saveSpot,
    updateSpot,
    markAsRetrieved,
    deleteSpot,
    refresh: loadActiveSpot,
    
    // Utilities
    getDistanceToSpot,
    getDirectionsUrl
  }
}

/**
 * Hook for parking spot history
 * 
 * @param limit Maximum number of spots to load
 * @returns Parking spot history
 * 
 * @example
 * ```tsx
 * function ParkingHistory() {
 *   const { history, isLoading } = useParkingHistory(20)
 *   
 *   return (
 *     <ul>
 *       {history.map(spot => (
 *         <li key={spot.id}>{spot.address}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useParkingHistory(limit: number = 10) {
  const { data: session } = useSession()
  const [history, setHistory] = useState<ParkingSpot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const parkingMemoryRef = useRef<ParkingMemory | null>(null)
  
  // Get user ID from NextAuth session
  const userId = (session?.user as any)?.id
  
  // Initialize ParkingMemory instance
  useEffect(() => {
    parkingMemoryRef.current = new ParkingMemory()
  }, [])
  
  // Load history when user ID is available or limit changes
  useEffect(() => {
    if (userId) {
      loadHistory()
    }
  }, [userId, limit])
  
  const loadHistory = useCallback(async () => {
    if (!parkingMemoryRef.current || !userId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const spots = await parkingMemoryRef.current.getHistory(userId, limit)
      setHistory(spots)
    } catch (err) {
      console.error('[useParkingHistory] Failed to load history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load parking history')
    } finally {
      setIsLoading(false)
    }
  }, [userId, limit])
  
  return {
    history,
    isLoading,
    error,
    refresh: loadHistory
  }
}
