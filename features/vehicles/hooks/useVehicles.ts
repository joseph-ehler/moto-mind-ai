import { useState, useEffect } from 'react'
import { useOptimisticActions } from './useOptimisticActions'

interface VehicleFilters {
  garageId?: string
  needsAttention?: boolean
  limit?: number
  offset?: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useVehicles(filters: VehicleFilters = {}) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  
  // Build query string
  const queryParams = new URLSearchParams()
  if (filters.garageId) queryParams.set('garage_id', filters.garageId)
  if (filters.needsAttention) queryParams.set('needs_attention', 'true')
  if (filters.limit) queryParams.set('limit', filters.limit.toString())
  if (filters.offset) queryParams.set('offset', filters.offset.toString())
  
  const queryString = queryParams.toString()
  const url = `/api/vehicles${queryString ? `?${queryString}` : ''}`
  
  const fetchData = async () => {
    try {
      console.log('🚗 Starting fetch for:', url)
      setIsLoading(true)
      setError(null)
      const response = await fetch(url)
      console.log('🚗 Response status:', response.status, response.statusText)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const result = await response.json()
      console.log('🚗 JSON parsed successfully')
      setData(result)
      
      // Debug logging
      console.log('🚗 useVehicles debug:', {
        url,
        isLoading: false,
        error: null,
        dataType: typeof result,
        dataKeys: result ? Object.keys(result) : null,
        vehicles: result?.data,
        vehicleCount: result?.data?.length
      })
      console.log('🚗 Full API Response:', result)
    } catch (err) {
      setError(err)
      console.error('🚗 useVehicles error:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchData()
  }, [url])
  
  const mutate = () => {
    fetchData()
  }
  
  const optimisticActions = useOptimisticActions()
  
  // Enhanced actions with optimistic updates
  const actions = {
    // Quick action handlers for vehicle rows
    handleVehicleAction: async (action: string, vehicleId: string) => {
      switch (action) {
        case 'log-maintenance':
          // Open maintenance modal or navigate
          window.location.href = `/vehicles/${vehicleId}?action=maintenance`
          break
          
        case 'update-odometer':
        case 'update_mileage':
          // Open odometer modal or navigate
          window.location.href = `/vehicles/${vehicleId}?action=odometer`
          break
          
        case 'add-fuel':
          // Open fuel modal or navigate
          window.location.href = `/vehicles/${vehicleId}?action=fuel`
          break
          
        case 'add-photos':
          // Navigate to photos page
          window.location.href = `/vehicles/${vehicleId}/photos`
          break
          
        case 'move-vehicle':
          // This would open a modal - for now just log
          console.log('Move vehicle:', vehicleId)
          break
          
        case 'create-reminder':
          // Navigate to vehicle page with reminder focus
          window.location.href = `/vehicles/${vehicleId}?action=reminder`
          break
          
        default:
          console.log('Unknown action:', action, vehicleId)
      }
    },
    
    // Optimistic vehicle move
    moveVehicle: (vehicleId: string, targetGarageId: string) => {
      return optimisticActions.moveVehicle(vehicleId, targetGarageId, {
        successMessage: 'Vehicle moved successfully',
        errorMessage: 'Failed to move vehicle'
      })
    },
    
    // Manual refresh
    refresh: () => mutate(),
    
    // Optimistic event creation
    createEvent: (vehicleId: string, eventData: any) => {
      return optimisticActions.createVehicleEvent(vehicleId, eventData, {
        successMessage: `${eventData.type} logged successfully`,
        errorMessage: `Failed to log ${eventData.type}`
      })
    }
  }
  
  return {
    vehicles: data?.vehicles || data?.data || [], // API returns { "vehicles": [...] }
    count: data?.count || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    actions,
    mutate
  }
}

// Hook for single vehicle
export function useVehicle(vehicleId: string) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  
  const fetchData = async () => {
    if (!vehicleId) return
    
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/vehicles/${vehicleId}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchData()
  }, [vehicleId])
  
  const mutate = () => {
    fetchData()
  }
  
  const optimisticActions = useOptimisticActions()
  
  const actions = {
    createEvent: (eventData: any) => {
      return optimisticActions.createVehicleEvent(vehicleId, eventData, {
        successMessage: `${eventData.type} logged successfully`,
        errorMessage: `Failed to log ${eventData.type}`
      })
    },
    
    createReminder: (reminderData: any) => {
      return optimisticActions.createReminder({
        ...reminderData,
        vehicle_id: vehicleId
      }, {
        successMessage: 'Reminder created successfully',
        errorMessage: 'Failed to create reminder'
      })
    },
    
    refresh: () => mutate()
  }
  
  return {
    vehicle: data?.vehicle,
    isLoading,
    error,
    actions,
    mutate
  }
}
