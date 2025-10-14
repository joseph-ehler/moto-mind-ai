import useSWRInfinite from 'swr/infinite'
import { useState, useCallback } from 'react'

interface Event {
  id: string
  type: string
  date: string
  miles: number | null
  payload: any
  created_at: string
}

interface EventsResponse {
  events: Event[]
  count: number
  next_cursor: string | null
  has_more: boolean
}

interface UseVehicleEventsOptions {
  vehicleId: string
  limit?: number
  types?: string[]
  since?: string
  initialData?: EventsResponse
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useVehicleEvents({
  vehicleId,
  limit = 30,
  types,
  since
}: UseVehicleEventsOptions) {
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Generate key for each page
  const getKey = (pageIndex: number, previousPageData: EventsResponse | null) => {
    // Don't fetch if no vehicle ID
    if (!vehicleId) return null
    
    // Reached the end
    if (previousPageData && !previousPageData.has_more) return null

    // Build query params
    const params = new URLSearchParams()
    params.set('limit', limit.toString())

    if (types && types.length > 0) {
      params.set('types', types.join(','))
    }

    if (since) {
      params.set('since', since)
    }

    // Add cursor for subsequent pages
    if (pageIndex > 0 && previousPageData?.next_cursor) {
      params.set('after', previousPageData.next_cursor)
    }

    return `/api/vehicles/${vehicleId}/events?${params.toString()}`
  }

  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate
  } = useSWRInfinite<EventsResponse>(
    getKey,
    fetcher,
    {
      revalidateFirstPage: true,
      revalidateOnFocus: true, // Auto-refresh when page gets focus
      dedupingInterval: 2000, // Reduced from 5000ms
      refreshInterval: 0 // No auto-polling, only on focus
    }
  )

  // Flatten all events from all pages
  const events = data ? data.flatMap(page => page.events) : []
  const isLoading = !data && !error
  const hasMore = data && data[data.length - 1]?.has_more
  const isEmpty = data?.[0]?.events.length === 0

  // Load more function
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      await setSize(size + 1)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, setSize, size])

  // Refresh function (invalidates all pages and refetches)
  const refresh = useCallback(async () => {
    // Reset to first page and revalidate
    setSize(1)
    await mutate()
  }, [mutate, setSize])

  return {
    events,
    isLoading,
    isLoadingMore,
    isValidating,
    error,
    hasMore,
    isEmpty,
    loadMore,
    refresh,
    size
  }
}

// Hook for vehicle stats
interface VehicleStats {
  service: {
    last_oil_change_miles: number | null
    current_miles: number | null
    interval_miles: number
    miles_until_service: number | null
    next_service_due: number | null
  }
  costs: {
    month_total: number
    month_count: number
    quarter_total: number
    quarter_count: number
  }
  activity: Array<{
    id: string
    type: string
    date: string
    summary: string | null
    miles: number | null
    total_amount: number | null
  }>
  health: {
    warning_lights: string[]
    last_dashboard_date: string | null
  }
}

export function useVehicleStats(vehicleId: string) {
  const { data, error, mutate } = useSWR<VehicleStats>(
    vehicleId && vehicleId !== '' ? `/api/vehicles/${vehicleId}/stats` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
      dedupingInterval: 0 // No deduplication - always allow refresh
    }
  )

  const refresh = async () => {
    // Force refetch with cache busting
    await mutate(async () => {
      const url = `/api/vehicles/${vehicleId}/stats?_=${Date.now()}`
      const response = await fetch(url, { cache: 'no-store' })
      return response.json()
    }, { revalidate: false }) // Don't revalidate, use the new data directly
  }

  return {
    stats: data,
    isLoading: !data && !error,
    error,
    refresh
  }
}

// Import missing useSWR
import useSWR from 'swr'
