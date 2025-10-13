// import { mutate } from 'swr' // Temporarily disabled due to SWR issues
// Temporary stub for mutate function
const mutate = (key: string, data?: any, options?: any) => {
  console.log('🔄 Cache invalidation requested for:', key, data ? 'with data' : 'without data')
  // In a real implementation, this would trigger re-fetching
  return Promise.resolve(data)
}

// Simple toast implementation - replace with your preferred toast library
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message)
}

interface OptimisticActionOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  successMessage?: string
  errorMessage?: string
}

export function useOptimisticActions() {
  
  // Optimistic vehicle event creation
  const createVehicleEvent = async (
    vehicleId: string,
    eventData: any,
    options: OptimisticActionOptions = {}
  ) => {
    const { onSuccess, onError, successMessage, errorMessage } = options
    
    try {
      // Optimistically update related data (instant UI feedback)
      mutate(`/api/vehicles/${vehicleId}`)
      mutate('/api/vehicles')
      mutate('/api/notifications')  // Refresh Home notification stack instantly
      
      // Show immediate feedback
      if (successMessage) {
        toast.success(successMessage)
      }
      
      // Make API call
      const response = await fetch(`/api/vehicles/${vehicleId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create event')
      }
      
      const result = await response.json()
      
      // Revalidate data after success
      mutate(`/api/vehicles/${vehicleId}`)
      mutate('/api/vehicles')
      mutate('/api/notifications')
      
      onSuccess?.(result)
      return result
      
    } catch (error) {
      // Revert optimistic updates on error
      mutate(`/api/vehicles/${vehicleId}`)
      mutate('/api/vehicles')
      mutate('/api/notifications')
      
      toast.error(errorMessage || 'Something went wrong')
      onError?.(error)
      throw error
    }
  }
  
  // Optimistic reminder creation
  const createReminder = async (
    reminderData: any,
    options: OptimisticActionOptions = {}
  ) => {
    const { onSuccess, onError, successMessage, errorMessage } = options
    
    try {
      // Optimistically update notifications
      mutate('/api/notifications')
      mutate(`/api/vehicles/${reminderData.vehicle_id}`)
      
      if (successMessage) {
        toast.success(successMessage)
      }
      
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create reminder')
      }
      
      const result = await response.json()
      
      // Revalidate after success
      mutate('/api/notifications')
      mutate(`/api/vehicles/${reminderData.vehicle_id}`)
      
      onSuccess?.(result)
      return result
      
    } catch (error) {
      // Revert on error
      mutate('/api/notifications')
      mutate(`/api/vehicles/${reminderData.vehicle_id}`)
      
      toast.error(errorMessage || 'Failed to create reminder')
      onError?.(error)
      throw error
    }
  }
  
  // Optimistic notification dismissal
  const dismissNotification = async (
    notificationId: string,
    options: OptimisticActionOptions = {}
  ) => {
    const { onSuccess, onError } = options
    
    try {
      // Optimistically remove from notifications
      mutate('/api/notifications', (current: any) => {
        if (!current) return current
        return {
          ...current,
          notifications: current.notifications.filter((n: any) => n.id !== notificationId)
        }
      }, false)
      
      // TODO: Implement actual dismissal API when ready
      // For now, just keep it dismissed locally
      
      onSuccess?.({ dismissed: true })
      
    } catch (error) {
      // Revert on error
      mutate('/api/notifications')
      onError?.(error)
      throw error
    }
  }
  
  // Optimistic vehicle move
  const moveVehicle = async (
    vehicleId: string,
    targetGarageId: string,
    options: OptimisticActionOptions = {}
  ) => {
    const { onSuccess, onError, successMessage, errorMessage } = options
    
    try {
      // Optimistically update vehicle data
      mutate('/api/vehicles')
      mutate(`/api/vehicles/${vehicleId}`)
      
      if (successMessage) {
        toast.success(successMessage)
      }
      
      const response = await fetch(`/api/vehicles/${vehicleId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garage_id: targetGarageId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to move vehicle')
      }
      
      const result = await response.json()
      
      // Revalidate after success
      mutate('/api/vehicles')
      mutate(`/api/vehicles/${vehicleId}`)
      mutate('/api/vehicless')
      
      onSuccess?.(result)
      return result
      
    } catch (error) {
      // Revert on error
      mutate('/api/vehicles')
      mutate(`/api/vehicles/${vehicleId}`)
      
      toast.error(errorMessage || 'Failed to move vehicle')
      onError?.(error)
      throw error
    }
  }
  
  return {
    createVehicleEvent,
    createReminder,
    dismissNotification,
    moveVehicle
  }
}
