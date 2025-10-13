'use client'

import { Inter } from 'next/font/google'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/design-system/feedback/ToastNotifications'
import '../styles/globals.css'
import '../styles/gradients.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
