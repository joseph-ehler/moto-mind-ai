'use client'

/**
 * AI-Powered App Navigation
 * 
 * Intelligence-first navigation for MotoMind vehicle maintenance platform
 * Shows AI insights, alerts, and quick actions
 * Hides on scroll down, shows on scroll up
 */

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Container, Flex, Button } from '@/components/design-system'
import { 
  LayoutDashboard, 
  Car, 
  FileText, 
  Bell,
  User
} from 'lucide-react'

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    href: '/vehicles',
    icon: <Car className="w-4 h-4" />
  },
  {
    id: 'assistant',
    label: 'Assistant',
    href: '/assistant',
    icon: <FileText className="w-4 h-4" />
  }
]

export function AppNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  
  // Mock alert count - replace with real data
  const alertCount = 3

  // Hide nav on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show nav if at top of page
      if (currentScrollY < 10) {
        setIsVisible(true)
      }
      // Hide nav when scrolling down past 100px
      else if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setIsVisible(false)
      }
      // Show nav when scrolling up
      else if (currentScrollY < lastScrollY) {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    // All vehicle routes naturally match /vehicles prefix
    return pathname?.startsWith(href)
  }

  return (
    <>
    {/* Desktop Top Navigation */}
    <nav 
      className={`bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-40 shadow-sm hidden md:block transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <Container 
        size="lg" 
        useCase="navigation"
        override={{
          reason: "Navigation bar requires full-width layout for proper spacing and branding",
          approvedBy: "UX Team"
        }}
      >
        <Flex align="center" justify="between" className="h-16">
          {/* Logo */}
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors tracking-tight"
          >
            mo
          </button>
          
          {/* Desktop Navigation */}
          <Flex align="center" gap="xl" className="hidden md:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href)
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className={`relative flex items-center gap-2 text-sm font-semibold transition-colors pb-1 ${
                    active ? 'text-black' : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {/* Active underline */}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
                  )}
                </button>
              )
            })}
          </Flex>

          {/* Right Actions */}
          <Flex align="center" gap="lg">
            {/* Alerts */}
            <button
              onClick={() => router.push('/alerts')}
              className="relative hover:opacity-70 transition-opacity"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {alertCount > 0 && (
                <Flex align="center" justify="center" className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full font-medium">
                  {alertCount}
                </Flex>
              )}
            </button>

            {/* Profile */}
            <button
              onClick={() => router.push('/profile')}
              className="hover:opacity-70 transition-opacity"
            >
              <User className="w-5 h-5 text-gray-700" />
            </button>
          </Flex>
        </Flex>
      </Container>
    </nav>

    {/* Mobile Bottom Navigation */}
    <MobileBottomNav pathname={pathname} router={router} alertCount={alertCount} />
    </>
  )
}

/**
 * Mobile Bottom Navigation
 */
function MobileBottomNav({ 
  pathname, 
  router, 
  alertCount 
}: { 
  pathname: string | null
  router: any
  alertCount: number 
}) {
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    // All vehicle routes naturally match /vehicles prefix
    return pathname?.startsWith(href)
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 z-50 safe-area-bottom shadow-lg">
      <Flex align="center" justify="around" className="h-16 px-2">
        {/* Dashboard */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex flex-col items-center justify-center flex-1 gap-1"
        >
          <LayoutDashboard className={`w-6 h-6 ${isActive('/dashboard') ? 'text-black' : 'text-gray-600'}`} />
          <span className={`text-xs font-medium ${isActive('/dashboard') ? 'text-black' : 'text-gray-600'}`}>
            Home
          </span>
        </button>

        {/* Vehicles */}
        <button
          onClick={() => router.push('/vehicles')}
          className="flex flex-col items-center justify-center flex-1 gap-1"
        >
          <Car className={`w-6 h-6 ${isActive('/vehicles') ? 'text-black' : 'text-gray-600'}`} />
          <span className={`text-xs font-medium ${isActive('/vehicles') ? 'text-black' : 'text-gray-600'}`}>
            Vehicles
          </span>
        </button>

        {/* Assistant */}
        <button
          onClick={() => router.push('/assistant')}
          className="flex flex-col items-center justify-center flex-1 gap-1"
        >
          <FileText className={`w-6 h-6 ${isActive('/assistant') ? 'text-black' : 'text-gray-600'}`} />
          <span className={`text-xs font-medium ${isActive('/assistant') ? 'text-black' : 'text-gray-600'}`}>
            Assistant
          </span>
        </button>

        {/* More */}
        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center justify-center flex-1 gap-1 relative"
        >
          <User className="w-6 h-6 text-gray-600" />
          <span className="text-xs font-medium text-gray-600">More</span>
          {alertCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {alertCount}
            </span>
          )}
        </button>
      </Flex>
    </div>
  )
}
