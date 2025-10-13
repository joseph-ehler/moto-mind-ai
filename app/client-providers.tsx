'use client'

import { useEffect } from 'react'
import Head from 'next/head'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/design-system/feedback/ToastNotifications'
import { registerServiceWorker } from '@/lib/pwa/register-sw'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== 'undefined') {
      registerServiceWorker()
      
      // Manually inject manifest link if not present
      if (!document.querySelector('link[rel="manifest"]')) {
        const link = document.createElement('link')
        link.rel = 'manifest'
        link.href = '/manifest.json'
        document.head.appendChild(link)
      }
    }
  }, [])

  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MotoMind" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </Head>
      <SessionProvider>
        <ToastProvider position="top-right">
          {children}
        </ToastProvider>
      </SessionProvider>
    </>
  )
}
