// Utility functions for keeping garage data in sync across the app

export interface GarageUpdateEvent {
  type: 'vehicle_moved' | 'vehicle_added' | 'vehicle_removed' | 'garage_updated'
  vehicleId?: string
  fromGarageId?: string
  toGarageId?: string
  garageId?: string
}

// Simple event emitter for garage updates
class GarageEventEmitter {
  private listeners: ((event: GarageUpdateEvent) => void)[] = []

  subscribe(callback: (event: GarageUpdateEvent) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  emit(event: GarageUpdateEvent) {
    this.listeners.forEach(listener => listener(event))
  }
}

export const garageEvents = new GarageEventEmitter()

// Helper function to notify about vehicle moves
export function notifyVehicleMoved(vehicleId: string, fromGarageId?: string, toGarageId?: string) {
  garageEvents.emit({
    type: 'vehicle_moved',
    vehicleId,
    fromGarageId,
    toGarageId
  })
}

// Helper function to refresh garage data
export async function refreshGarageData() {
  try {
    const response = await fetch('/api/vehicless')
    if (response.ok) {
      const data = await response.json()
      return data.garages || []
    }
  } catch (error) {
    console.error('Error refreshing garage data:', error)
  }
  return []
}

// Helper function to refresh specific garage
export async function refreshGarage(garageId: string) {
  try {
    const response = await fetch(`/api/vehicless/${garageId}`)
    if (response.ok) {
      const data = await response.json()
      return data.garage
    }
  } catch (error) {
    console.error('Error refreshing garage:', error)
  }
  return null
}

// Helper function to get updated vehicle counts for garages
export async function getGarageVehicleCounts(garageIds: string[]) {
  try {
    const response = await fetch('/api/vehicles')
    if (response.ok) {
      const data = await response.json()
      const vehicles = data.data?.vehicles || data.vehicles || []
      
      const counts: Record<string, number> = {}
      garageIds.forEach(id => counts[id] = 0)
      
      vehicles.forEach((vehicle: any) => {
        if (vehicle.garage_id && counts.hasOwnProperty(vehicle.garage_id)) {
          counts[vehicle.garage_id]++
        }
      })
      
      return counts
    }
  } catch (error) {
    console.error('Error getting vehicle counts:', error)
  }
  return {}
}
