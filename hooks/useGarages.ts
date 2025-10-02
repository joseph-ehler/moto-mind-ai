import useSWR from 'swr'
import { garageEvents } from '@/utils/garageSync'
import { useEffect } from 'react'

export interface Garage {
  id: string
  name: string
  address: string
  lat?: number
  lng?: number
  timezone?: string
  is_default?: boolean
  vehicleCount: number
  created_at: string
  updated_at: string
}

const fetcher = async (url: string): Promise<{ garages: Garage[] }> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch garages')
  }
  return response.json()
}

export function useGarages() {
  const { data, error, mutate, isLoading } = useSWR('/api/garages', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 30000, // 30 seconds
  })

  // Listen for garage events and revalidate
  useEffect(() => {
    const unsubscribe = garageEvents.subscribe((event) => {
      if (event.type === 'vehicle_moved') {
        // Revalidate garage data when vehicles are moved
        mutate()
      }
    })

    return unsubscribe
  }, [mutate])

  return {
    garages: data?.garages || [],
    isLoading,
    error,
    mutate,
    // Helper functions
    getGarageById: (id: string) => data?.garages.find((g: Garage) => g.id === id),
    getDefaultGarage: () => data?.garages.find((g: Garage) => g.is_default),
    getTotalVehicles: () => data?.garages.reduce((sum: number, g: Garage) => sum + g.vehicleCount, 0) || 0
  }
}

const singleGarageFetcher = async (url: string): Promise<{ garage: Garage }> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch garage')
  }
  return response.json()
}

export function useGarage(id: string) {
  const { data, error, mutate, isLoading } = useSWR(
    id ? `/api/garages/${id}` : null,
    singleGarageFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    garage: data?.garage,
    isLoading,
    error,
    mutate
  }
}
