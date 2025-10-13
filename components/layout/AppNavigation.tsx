import React from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Car, MapPin, Settings, Plus } from 'lucide-react'

export function AppNavigation() {
  const router = useRouter()
  
  const navItems = [
    {
      label: 'Fleet',
      href: '/fleet',
      icon: Car,
      active: router.pathname === '/fleet'
    },
    {
      label: 'Garages',
      href: '/vehicless',
      icon: MapPin,
      active: router.pathname.startsWith('/vehicless')
    }
  ]

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-semibold text-gray-900">MotoMind</h1>
            
            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.href}
                    variant={item.active ? "default" : "ghost"}
                    size="sm"
                    onClick={() => router.push(item.href)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/onboard')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
