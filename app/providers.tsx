'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { SessionTracker } from '@/components/auth/SessionTracker'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <SessionTracker />
      {children}
    </NextAuthSessionProvider>
  )
}
