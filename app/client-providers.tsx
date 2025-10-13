'use client'

import { useEffect } from 'react'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/design-system/feedback/ToastNotifications'
import { registerServiceWorker } from '@/lib/pwa/register-sw'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== 'undefined') {
      registerServiceWorker()
    }
  }, [])

  return (
    <SessionProvider>
      <ToastProvider position="top-right">
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}
