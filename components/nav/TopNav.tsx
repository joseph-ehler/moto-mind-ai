'use client'

/**
 * Top Navigation Bar
 * 
 * Displays logo and user menu with settings access
 * Uses: MotoMind design system + shadcn/ui
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import Link from 'next/link'
import { UserMenu } from '@/components/layout/UserMenu'

export function TopNav() {
  // UserMenu handles its own auth state
  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🏍️</span>
            <span className="text-xl font-bold text-gray-900">MotoMind</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/vehicles" 
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Vehicles
            </Link>
            <Link 
              href="/maintenance" 
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Maintenance
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  )
}
