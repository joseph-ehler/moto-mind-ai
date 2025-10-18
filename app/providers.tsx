'use client'

import { SessionTracker } from '@/components/auth/SessionTracker'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionTracker />
      {children}
    </>
  )
}
