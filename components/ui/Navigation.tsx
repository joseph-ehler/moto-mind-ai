/**
 * Navigation - Mobile-first navigation components
 * 
 * Touch-friendly navigation with large touch targets and mobile-optimized layouts.
 */

import React from 'react'
import { cn } from '@/lib/utils/cn'
import { ChevronRight, Menu, X } from 'lucide-react'

// ============================================================================
// TABS
// ============================================================================

interface TabItem {
  id: string
  label: string
  disabled?: boolean
}

interface TabsProps {
  items: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

export function Tabs({ items, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('border-b border-gray-200', className)}>
      <nav className="flex space-x-0 overflow-x-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && onChange(item.id)}
            disabled={item.disabled}
            className={cn(
              // Mobile-first: Large touch targets
              'min-h-[44px] px-4 py-3 text-base font-medium whitespace-nowrap',
              'border-b-2 transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              activeTab === item.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

// ============================================================================
// BREADCRUMBS
// ============================================================================

interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
          
          {index === items.length - 1 ? (
            // Current page - not clickable
            <span className="text-gray-900 font-medium truncate">
              {item.label}
            </span>
          ) : (
            // Clickable breadcrumb
            <button
              onClick={item.onClick}
              className={cn(
                'text-gray-500 hover:text-gray-700 transition-colors',
                'min-h-[32px] px-1 truncate', // Smaller touch target for breadcrumbs
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded'
              )}
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

// ============================================================================
// MOBILE MENU
// ============================================================================

interface MenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  href?: string
  disabled?: boolean
  badge?: string | number
}

interface MobileMenuProps {
  items: MenuItem[]
  isOpen: boolean
  onClose: () => void
  title?: string
  className?: string
}

export function MobileMenu({ items, isOpen, onClose, title, className }: MobileMenuProps) {
  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-full max-w-sm',
        'bg-white shadow-xl',
        'flex flex-col',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {title && (
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (!item.disabled && item.onClick) {
                  item.onClick()
                  onClose()
                }
              }}
              disabled={item.disabled}
              className={cn(
                // Mobile-first: Large touch targets
                'w-full flex items-center gap-3 p-3 rounded-lg',
                'text-left text-base transition-colors',
                'min-h-[48px]', // Touch-friendly
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'hover:bg-gray-50 active:bg-gray-100'
              )}
            >
              {item.icon && (
                <div className="flex-shrink-0 text-gray-400">
                  {item.icon}
                </div>
              )}
              
              <span className="flex-1 text-gray-900">{item.label}</span>
              
              {item.badge && (
                <span className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}

// ============================================================================
// MENU TRIGGER
// ============================================================================

interface MenuTriggerProps {
  onClick: () => void
  className?: string
}

export function MenuTrigger({ onClick, className }: MenuTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2 hover:bg-gray-100 rounded-lg transition-colors',
        'min-h-[44px] min-w-[44px]', // Touch target
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
    >
      <Menu className="w-6 h-6" />
    </button>
  )
}

// ============================================================================
// BOTTOM NAVIGATION (Mobile-specific)
// ============================================================================

interface BottomNavItem {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  badge?: string | number
  active?: boolean
}

interface BottomNavigationProps {
  items: BottomNavItem[]
  className?: string
}

export function BottomNavigation({ items, className }: BottomNavigationProps) {
  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-30',
      'bg-white border-t border-gray-200',
      'safe-area-inset-bottom', // Handle iPhone notch
      className
    )}>
      <div className="flex">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'flex-1 flex flex-col items-center justify-center',
              'py-2 px-1 min-h-[60px]', // Large touch target
              'transition-colors duration-150',
              'relative',
              item.active 
                ? 'text-blue-600' 
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <div className="relative">
              {item.icon}
              
              {item.badge && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
            </div>
            
            <span className="text-xs font-medium mt-1 truncate max-w-full">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
