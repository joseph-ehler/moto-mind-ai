'use client'

/**
 * Top Navigation Bar
 * 
 * Displays user info and sign out button
 * Uses: MotoMind design system + shadcn/ui
 */

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui'
import { LogOut, User } from 'lucide-react'
import Link from 'next/link'

export function TopNav() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl">🏍️</span>
            <span className="text-xl font-bold text-gray-900">MotoMind</span>
          </Link>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {session.user.name || session.user.email}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/auth/signout' })}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
