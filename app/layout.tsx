'use client'

import { Inter } from 'next/font/google'
import { useEffect } from 'react'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/design-system/feedback/ToastNotifications'
import { registerServiceWorker } from '@/lib/pwa/register-sw'
import '../styles/globals.css'
import '../styles/gradients.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== 'undefined') {
      registerServiceWorker()
    }
  }, [])

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MotoMind" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <ToastProvider position="top-right">
            {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
