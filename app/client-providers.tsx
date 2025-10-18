'use client'

import { useEffect } from 'react'
import { ToastProvider } from '@/components/design-system/feedback/ToastNotifications'
import { PWAInstallPrompt, OfflineIndicator } from '@/components/PWAInstallPrompt'
import { registerServiceWorker } from '@/lib/pwa/register-sw'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker for PWA functionality
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker()
    }
  }, [])

  return (
    <ToastProvider position="top-right">
      <PWAInstallPrompt />
      <OfflineIndicator />
      {children}
    </ToastProvider>
  )
}
