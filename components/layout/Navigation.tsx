// Navigation - Exactly like Ro's clean top nav
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { 
  Home, 
  Car, 
  MessageCircle, 
  Settings,
  User,
  Bell
} from 'lucide-react'

export function Navigation() {
  const router = useRouter()
  
  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/vehicles', label: 'Vehicles', icon: Car },
    { href: '/support', label: 'Support', icon: MessageCircle },
    { href: '/account', label: 'Account', icon: User },
  ]
  
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="text-xl font-semibold text-gray-900">
                MotoMind
              </div>
            </Link>
          </div>
          
          {/* Main Navigation - Ro style */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              )
            })}
          </div>
          
          {/* Right side - Notifications + Profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
            </button>
            
            {/* Profile */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
