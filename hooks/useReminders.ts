import useSWR from 'swr'

export interface Reminder {
  id: string
  vehicle_id: string
  garage_id_at_creation?: string
  title: string
  description?: string
  category: string
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  due_miles?: number
  source: 'jurisdiction' | 'user'
  status: string
  created_at: string
  updated_at: string
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch reminders')
  }
  return response.json()
}

export function useVehicleReminders(vehicleId: string) {
  const { data, error, mutate, isLoading } = useSWR(
    vehicleId ? `/api/reminders-simple?vehicle_id=${vehicleId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  )

  return {
    reminders: data?.reminders || [],
    count: data?.count || 0,
    isLoading,
    error,
    mutate,
    // Helper functions
    getUpcomingReminders: () => {
      const upcoming = data?.reminders?.filter((r: Reminder) => r.status === 'open') || []
      return upcoming.sort((a: Reminder, b: Reminder) => {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })
    },
    getHighPriorityReminders: () => {
      return data?.reminders?.filter((r: Reminder) => r.priority === 'high' && r.status === 'open') || []
    }
  }
}
