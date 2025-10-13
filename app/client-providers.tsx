'use client'

import { useEffect } from 'react'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/design-system/feedback/ToastNotifications'
import { PWAInstallPrompt, OfflineIndicator } from '@/components/PWAInstallPrompt'
import { registerServiceWorker } from '@/lib/pwa/register-sw'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== 'undefined') {
      registerServiceWorker()
      console.log('[PWA Setup] Service worker registration initiated')
    }
  }, [])

  return (
    <SessionProvider>
      <ToastProvider position="top-right">
        <PWAInstallPrompt />
        <OfflineIndicator />
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}
