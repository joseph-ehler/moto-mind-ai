import useSWR from 'swr'
import { useOptimisticActions } from '@/features/vehicles/hooks/useOptimisticActions'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useNotifications() {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/notifications',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Refresh every minute for notifications
    }
  )
  
  const optimisticActions = useOptimisticActions()
  
  const actions = {
    // Optimistic dismissal
    dismiss: async (notificationId: string) => {
      return optimisticActions.dismissNotification(notificationId, {
        onSuccess: () => {
          // Notification stays dismissed locally
        },
        onError: () => {
          // Will revert automatically
        }
      })
    },
    
    // Handle notification action (navigate + dismiss)
    handleAction: async (notification: any) => {
      // Navigate to the action URL
      window.location.href = notification.ctaUrl
      
      // Optimistically dismiss the notification
      await actions.dismiss(notification.id)
    },
    
    // Manual refresh
    refresh: () => mutate(),
    
    // Mark all as seen (future feature)
    markAllSeen: async () => {
      // TODO: Implement when we add seen/unseen state
      console.log('Mark all notifications as seen')
    }
  }
  
  return {
    notifications: data?.notifications || [],
    count: data?.count || 0,
    generatedAt: data?.generated_at,
    isLoading,
    error,
    actions,
    mutate
  }
}
