/**
 * SERVICE WORKER REGISTRATION
 * 
 * Registers the service worker and handles updates.
 * Call this from your app's entry point (e.g., _app.tsx or layout.tsx)
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') {
    return null
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    })

    console.log('[PWA] Service Worker registered:', registration.scope)

    // Check for updates every hour
    setInterval(() => {
      registration.update()
    }, 60 * 60 * 1000)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('[PWA] New service worker available')
            
            // Notify user about update
            if (confirm('A new version is available! Reload to update?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' })
              window.location.reload()
            }
          }
        })
      }
    })

    // Handle controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Controller changed, reloading...')
      window.location.reload()
    })

    return registration
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error)
    return null
  }
}

/**
 * Unregister service worker (for debugging)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
    }
    console.log('[PWA] Service Worker unregistered')
    return true
  } catch (error) {
    console.error('[PWA] Service Worker unregistration failed:', error)
    return false
  }
}

/**
 * Check if app is installed
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // Check if running in standalone mode
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    console.log('[PWA] Notification permission:', permission)
    return permission
  }

  return Notification.permission
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(vapidPublicKey: string): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // Subscribe
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      console.log('[PWA] Push subscription created')

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      })
    }

    return subscription
  } catch (error) {
    console.error('[PWA] Push subscription failed:', error)
    return null
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      console.log('[PWA] Push unsubscribed')

      // Notify server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      })

      return true
    }

    return false
  } catch (error) {
    console.error('[PWA] Push unsubscribe failed:', error)
    return false
  }
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
